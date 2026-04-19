// Send the user's Emergency QR Card to a contact via email (Resend gateway).
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface Body {
  to: string;
  recipientName?: string;
  message?: string;
  qrPngBase64: string; // raw base64 (no data: prefix)
  emergencyUrl: string;
}

const isEmail = (s: string) =>
  typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Authorization required' }, 401);

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
    const SUPABASE_ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');

    const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userRes, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userRes?.user) return json({ error: 'Invalid session' }, 401);

    const body = (await req.json()) as Body;
    if (!isEmail(body.to)) return json({ error: 'Invalid recipient email' }, 400);
    if (!body.qrPngBase64 || body.qrPngBase64.length > 2_000_000) {
      return json({ error: 'Invalid or oversized QR image' }, 400);
    }
    if (!body.emergencyUrl || !/^https?:\/\//.test(body.emergencyUrl)) {
      return json({ error: 'Invalid emergency URL' }, 400);
    }

    if (!LOVABLE_API_KEY) return json({ error: 'Email gateway not configured' }, 500);

    // Resolve sender name
    const { data: profile } = await userClient
      .from('profiles')
      .select('full_name, email')
      .eq('id', userRes.user.id)
      .maybeSingle();
    const senderName =
      (profile?.full_name as string | null) ||
      (userRes.user.email?.split('@')[0] ?? 'Someone');

    const recipientName = (body.recipientName || '').trim();
    const subject = `${senderName} shared their Emergency QR Card with you`;
    const html = renderHtml({
      senderName,
      recipientName,
      message: body.message || '',
      emergencyUrl: body.emergencyUrl,
    });

    const resendResp = await fetch('https://connector-gateway.lovable.dev/resend/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
      },
      body: JSON.stringify({
        from: 'Survivor Packet <hello@survivorpacket.com>',
        to: [body.to],
        subject,
        html,
        attachments: [
          {
            filename: 'emergency-qr.png',
            content: body.qrPngBase64,
            content_id: 'emergency-qr',
            contentType: 'image/png',
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

    return json({ ok: true, provider_id: resendJson?.id || null }, 200);
  } catch (err) {
    console.error('send-emergency-card failed', err);
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

function renderHtml({
  senderName,
  recipientName,
  message,
  emergencyUrl,
}: {
  senderName: string;
  recipientName: string;
  message: string;
  emergencyUrl: string;
}) {
  const safeSender = escapeHtml(senderName);
  const safeRecipient = escapeHtml(recipientName || 'Hi');
  const safeMsg = escapeHtml(message);
  const safeUrl = escapeHtml(emergencyUrl);
  return `<!doctype html>
<html><body style="font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;color:#1f2937;line-height:1.6;max-width:600px;margin:0 auto;padding:24px;background:#fafaf9">
  <div style="text-align:center;margin-bottom:20px">
    <div style="font-size:13px;font-weight:700;letter-spacing:2px;color:#475569;text-transform:uppercase">The Survivor Packet</div>
  </div>

  <div style="background:#ffffff;border-radius:12px;padding:28px;border:1px solid #e7e5e4">
    <h2 style="margin:0 0 16px;color:#0f172a;font-size:20px">${safeRecipient}, ${safeSender} wants you to have their Emergency QR Card.</h2>

    ${
      safeMsg
        ? `<div style="margin:16px 0;padding:14px;background:#f8fafc;border-left:3px solid #0f172a;border-radius:4px;white-space:pre-wrap;font-size:14px">${safeMsg}</div>`
        : ''
    }

    <div style="text-align:center;margin:24px 0">
      <img src="cid:emergency-qr" alt="Emergency QR Code" width="220" height="220" style="border:1px solid #e7e5e4;border-radius:8px;padding:8px;background:#fff" />
    </div>

    <h3 style="margin:24px 0 12px;color:#0f172a;font-size:14px;text-transform:uppercase;letter-spacing:1px">How to use this card</h3>
    <ol style="margin:0;padding-left:20px;font-size:14px;color:#374151">
      <li style="margin-bottom:8px">Save or print this QR code.</li>
      <li style="margin-bottom:8px">In an emergency, anyone can scan it for critical medical information.</li>
      <li style="margin-bottom:8px">If ${safeSender} set a PIN, you may need it for full access — ask them for it.</li>
      <li style="margin-bottom:8px">Consider printing it as a wallet card or fridge magnet so it's always findable.</li>
    </ol>

    <div style="text-align:center;margin:28px 0 8px">
      <a href="${safeUrl}" style="display:inline-block;background:#0f172a;color:#ffffff;text-decoration:none;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px">Scan emergency card →</a>
    </div>
  </div>

  <p style="margin:20px 0 0;font-size:12px;color:#78716c;text-align:center">
    Sent via The Survivor Packet · <a href="https://survivorpacket.com" style="color:#78716c">survivorpacket.com</a>
  </p>
</body></html>`;
}
