// Send funeral instructions PDF to the funeral home via Lovable Emails (Resend).
// Logs the send into funeral_send_log and updates funeral_records timestamps.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface PhotoAttachment {
  filename: string;
  content: string; // base64
  mime?: string;
}

interface Body {
  to: string;
  personName?: string;
  packetId?: string;
  funeralRecordId?: string;
  message?: string;
  pdfBase64: string;
  filename: string;
  photoAttachments?: PhotoAttachment[];
}

const isEmail = (s: string) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return json({ error: 'Authorization required' }, 401);
    }

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    // Auth-bound client (verifies caller)
    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) {
      return json({ error: 'Invalid session' }, 401);
    }
    const userId = userRes.user.id;

    const body = (await req.json()) as Body;
    if (!isEmail(body.to)) return json({ error: 'Invalid recipient email' }, 400);
    if (!body.pdfBase64 || !body.filename) return json({ error: 'Missing PDF attachment' }, 400);
    if (body.pdfBase64.length > 8_000_000) {
      return json({ error: 'PDF too large (max ~6MB)' }, 400);
    }

    // Validate + cap total attachment payload (Resend limit ~40MB; keep safe at ~12MB base64)
    const photos = Array.isArray(body.photoAttachments) ? body.photoAttachments : [];
    let photoBase64Total = 0;
    for (const p of photos) {
      if (!p?.content || !p?.filename) {
        return json({ error: 'Invalid photo attachment' }, 400);
      }
      photoBase64Total += p.content.length;
    }
    if (photoBase64Total > 12_000_000) {
      return json({ error: 'Photo attachments too large (max ~9MB total)' }, 400);
    }

    // Verify packet membership using service role + caller id
    const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    if (body.packetId) {
      const { data: member } = await adminClient
        .from('packet_members')
        .select('id')
        .eq('packet_id', body.packetId)
        .eq('user_id', userId)
        .maybeSingle();
      if (!member) {
        return json({ error: 'Not a member of this packet' }, 403);
      }
    }

    const personName = (body.personName || '').trim();
    const subject = `Survivor Packet — Funeral Instructions${personName ? ` for ${personName}` : ''}`;
    const html = renderHtml({ personName, message: body.message || '' });

    // Send via Lovable Emails (Resend connector gateway)
    if (!LOVABLE_API_KEY) {
      return json({ error: 'Email gateway not configured' }, 500);
    }

    const resendResp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Survivor Packet <onboarding@resend.dev>',
        to: [body.to],
        subject,
        html,
        attachments: [
          {
            filename: body.filename,
            content: body.pdfBase64,
          },
        ],
      }),
    });

    const resendJson = await resendResp.json().catch(() => ({}));
    if (!resendResp.ok) {
      console.error('Resend error', resendResp.status, resendJson);
      return json(
        { error: `Email provider error: ${resendJson?.message || resendResp.statusText}` },
        502,
      );
    }

    const sentAt = new Date().toISOString();

    // Log + update funeral record (best-effort, do not fail the request on log errors)
    if (body.funeralRecordId && body.packetId) {
      const { error: logErr } = await adminClient.from('funeral_send_log').insert({
        funeral_record_id: body.funeralRecordId,
        packet_id: body.packetId,
        sent_to_email: body.to,
        sent_by: userId,
        payload_summary: {
          subject,
          attachment: body.filename,
          message_length: (body.message || '').length,
          provider_id: resendJson?.id || null,
        },
      });
      if (logErr) console.warn('funeral_send_log insert failed:', logErr);

      const { error: updErr } = await adminClient
        .from('funeral_records')
        .update({
          last_sent_to_funeral_home_at: sentAt,
          last_sent_to_email: body.to,
        })
        .eq('id', body.funeralRecordId);
      if (updErr) console.warn('funeral_records update failed:', updErr);
    }

    return json({ ok: true, sent_at: sentAt, provider_id: resendJson?.id || null }, 200);
  } catch (err) {
    console.error('send-funeral-instructions failed', err);
    return json({ error: (err as Error).message || 'Unexpected error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function escapeHtml(s: string) {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function renderHtml({ personName, message }: { personName: string; message: string }) {
  const safeName = escapeHtml(personName || 'a loved one');
  const safeMsg = escapeHtml(message);
  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.5;max-width:600px;margin:0 auto;padding:24px">
  <h2 style="margin:0 0 12px;color:#0f172a">Funeral Instructions for ${safeName}</h2>
  <p style="margin:0 0 12px">A complete set of funeral preferences and personalized content has been compiled and is attached as a PDF.</p>
  ${
    safeMsg
      ? `<div style="margin:16px 0;padding:14px;background:#f8fafc;border-left:3px solid #0f172a;border-radius:4px;white-space:pre-wrap">${safeMsg}</div>`
      : ''
  }
  <p style="margin:16px 0 0;font-size:13px;color:#475569">This package was prepared via The Survivor Packet by the family of ${safeName}.</p>
</body></html>`;
}
