// Edge function: send-couple-invite
// Creates (or refreshes) a pending couple_link and emails the partner via Loops.
// Caller must be authenticated. JWT is validated explicitly because verify_jwt = false.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOOPS_URL = 'https://app.loops.so/api/v1/events/send';
const RESEND_URL = 'https://api.resend.com/emails';
const RESEND_FROM = 'The Survivor Packet <onboarding@resend.dev>';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY');
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Missing Authorization header' }, 401);
    }

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');

    // 1) Identify the caller from their JWT
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) {
      return json({ error: 'Invalid auth token' }, 401);
    }
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const partnerEmail = String(body?.partnerEmail || '').trim().toLowerCase();
    if (!partnerEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(partnerEmail)) {
      return json({ error: 'A valid partner email is required' }, 400);
    }
    if (partnerEmail === (user.email || '').toLowerCase()) {
      return json({ error: 'You cannot invite yourself.' }, 400);
    }

    // 2) Service-role client for writes
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    // 3) Block if the user already has an active or pending link
    const { data: existing } = await admin
      .from('couple_links')
      .select('id,status,invite_email,user_id_2,invite_token,invite_expires_at')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .in('status', ['active', 'pending'])
      .maybeSingle();

    if (existing?.status === 'active') {
      return json({ error: 'You already have an active partner link.' }, 409);
    }

    // 4) Find partner by email (if they already have an account)
    const { data: partnerProfile } = await admin
      .from('profiles')
      .select('id, email, full_name')
      .ilike('email', partnerEmail)
      .maybeSingle();

    // 5) Create or refresh the pending link
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

    let linkId: string;
    if (existing?.status === 'pending') {
      const { error } = await admin
        .from('couple_links')
        .update({
          invite_email: partnerEmail,
          invite_token: token,
          invite_expires_at: expiresAt,
          user_id_2: partnerProfile?.id ?? null,
        })
        .eq('id', existing.id);
      if (error) {
        console.error('refresh pending link failed', error);
        return json({ error: error.message }, 500);
      }
      linkId = existing.id;
    } else {
      const { data: inserted, error } = await admin
        .from('couple_links')
        .insert({
          user_id_1: user.id,
          user_id_2: partnerProfile?.id ?? null,
          invite_email: partnerEmail,
          invite_token: token,
          invite_expires_at: expiresAt,
          initiated_by: user.id,
          status: 'pending',
        })
        .select('id')
        .single();
      if (error || !inserted) {
        console.error('create link failed', error);
        return json({ error: error?.message || 'Failed to create invite' }, 500);
      }
      linkId = inserted.id;
    }

    // 6) Send the email (Loops). If Loops isn't configured, still return the link.
    const ownerName = (user.user_metadata?.full_name as string | undefined)
      || (user.email ? user.email.split('@')[0] : 'Your partner');
    const baseUrl = req.headers.get('origin') || 'https://app.survivorpacket.com';
    const inviteUrl = `${baseUrl}/couple/invite/${token}`;

    let emailSent = false;
    let emailError: string | null = null;

    // Prefer Resend (works immediately without domain verification)
    if (RESEND_API_KEY) {
      try {
        const partnerName = partnerProfile?.full_name || partnerEmail.split('@')[0];
        const html = `
          <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; max-width: 560px; margin: 0 auto; padding: 32px 24px; color: #1f2937;">
            <h1 style="font-size: 22px; margin: 0 0 16px; color: #0f172a;">${escapeHtml(ownerName)} invited you to The Survivor Packet</h1>
            <p style="font-size: 15px; line-height: 1.6; color: #475569;">
              Hi ${escapeHtml(partnerName)}, ${escapeHtml(ownerName)} would like to collaborate with you on their Survivor Packet —
              a private place to organize the documents, accounts, and wishes your family would need.
            </p>
            <p style="text-align: center; margin: 32px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: #0f172a; color: #ffffff; padding: 14px 28px; border-radius: 10px; text-decoration: none; font-weight: 600; font-size: 15px;">
                Accept invitation
              </a>
            </p>
            <p style="font-size: 13px; color: #94a3b8; line-height: 1.6;">
              This invitation expires in 14 days. If the button above doesn't work, copy and paste this link into your browser:<br />
              <a href="${inviteUrl}" style="color: #475569; word-break: break-all;">${inviteUrl}</a>
            </p>
          </div>
        `;
        const resendRes = await fetch(RESEND_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: RESEND_FROM,
            to: [partnerEmail],
            subject: `${ownerName} invited you to The Survivor Packet`,
            html,
          }),
        });
        const txt = await resendRes.text();
        console.log(`Resend couple_invitation -> ${partnerEmail}: ${resendRes.status} ${txt}`);
        if (resendRes.ok) {
          emailSent = true;
        } else {
          emailError = `Resend ${resendRes.status}: ${txt}`;
        }
      } catch (e: any) {
        emailError = e?.message || String(e);
        console.error('Resend send failed:', e);
      }
    } else if (LOOPS_API_KEY) {
      try {
        const loopsRes = await fetch(LOOPS_URL, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: partnerEmail,
            eventName: 'couple_invitation',
            eventProperties: {
              ownerName,
              partnerName: partnerProfile?.full_name || partnerEmail.split('@')[0],
              inviteUrl,
            },
          }),
        });
        const txt = await loopsRes.text();
        console.log(`Loops couple_invitation -> ${partnerEmail}: ${loopsRes.status} ${txt}`);
        if (loopsRes.ok) emailSent = true;
        else emailError = `Loops ${loopsRes.status}: ${txt}`;
      } catch (e: any) {
        emailError = e?.message || String(e);
        console.error('Loops send failed:', e);
      }
    } else {
      console.warn('No email provider configured — invite created but email skipped.');
      emailError = 'No email provider configured';
    }

    return json({ ok: true, linkId, inviteUrl, partnerHasAccount: !!partnerProfile, emailSent, emailError });
  } catch (err: any) {
    console.error('send-couple-invite error:', err);
    return json({ error: err?.message || 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string): string {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
