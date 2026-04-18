// Edge function: send-couple-notification
// Sends an email to the partner when actions occur. Best-effort, fire-and-forget.
// Body: { recipientEmail: string, recipientName?: string, actorName?: string, title: string, body?: string, linkTo?: string }

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SERVICE_KEY  = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const ANON_KEY     = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Invalid auth token' }, 401);

    const body = await req.json().catch(() => ({}));
    const { recipientEmail, recipientName, actorName, title, body: emailBody, linkTo } = body;
    if (!recipientEmail || !title) return json({ error: 'recipientEmail and title required' }, 400);

    // Check the link allows email notifications
    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: link } = await admin
      .from('couple_links')
      .select('email_notifications_enabled')
      .or(`user_id_1.eq.${userData.user.id},user_id_2.eq.${userData.user.id}`)
      .eq('status', 'active')
      .maybeSingle();

    if (link && (link as any).email_notifications_enabled === false) {
      return json({ ok: true, skipped: true, reason: 'notifications_disabled' });
    }

    if (!LOOPS_API_KEY) {
      return json({ ok: true, skipped: true, reason: 'no_loops_key' });
    }

    const greeting = recipientName ? `Hi ${recipientName.split(' ')[0]},` : 'Hi,';
    const actorLine = actorName ? `${actorName} just made an update on your shared Survivor Packet.` : 'There’s a new update on your shared Survivor Packet.';
    const ctaUrl = linkTo
      ? (linkTo.startsWith('http') ? linkTo : `https://app.survivorpacket.com${linkTo}`)
      : 'https://app.survivorpacket.com/';

    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,sans-serif;max-width:560px;margin:0 auto;padding:24px;">
        <h2 style="color:#1d2b3a;margin:0 0 12px;">${escape(title)}</h2>
        <p style="color:#525252;line-height:1.6;">${escape(greeting)}</p>
        <p style="color:#525252;line-height:1.6;">${escape(actorLine)}</p>
        ${emailBody ? `<p style="color:#525252;line-height:1.6;">${escape(emailBody)}</p>` : ''}
        <p style="margin-top:24px;">
          <a href="${ctaUrl}" style="background:#1d2b3a;color:#fff;text-decoration:none;padding:12px 20px;border-radius:10px;font-weight:bold;">Open Survivor Packet</a>
        </p>
        <p style="color:#a3a3a3;font-size:12px;margin-top:32px;">You can mute these emails in Profile → Partner Collaboration.</p>
      </div>
    `;

    const resp = await fetch('https://app.loops.so/api/v1/transactional', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOOPS_API_KEY}`,
      },
      body: JSON.stringify({
        transactionalId: 'couple_notification',
        email: recipientEmail,
        dataVariables: { title, html_body: html, cta_url: ctaUrl },
      }),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('loops failed:', resp.status, txt);
      return json({ ok: false, error: 'email_send_failed' }, 500);
    }

    return json({ ok: true });
  } catch (err: any) {
    console.error('send-couple-notification error:', err);
    return json({ error: err?.message || 'Unknown error' }, 500);
  }
});

function escape(s: string): string {
  return String(s).replace(/[<>&"']/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&#39;' }[c]!));
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
