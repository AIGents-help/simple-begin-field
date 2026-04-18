import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  token: string;
  pin?: string;
  action: 'hint' | 'verify';
}

function getDeviceType(ua: string): string {
  if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Macintosh/i.test(ua)) return 'macOS';
  if (/Linux/i.test(ua)) return 'Linux';
  return 'Unknown';
}

function getBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return 'Edge';
  if (/Chrome/i.test(ua)) return 'Chrome';
  if (/Safari/i.test(ua)) return 'Safari';
  if (/Firefox/i.test(ua)) return 'Firefox';
  return 'Unknown';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body: RequestBody = await req.json();
    if (!body.token || typeof body.token !== 'string') {
      return new Response(JSON.stringify({ error: 'Missing token' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Hint lookup (no PIN needed)
    if (body.action === 'hint') {
      const { data, error } = await supabase.rpc('get_emergency_pin_hint', { p_token: body.token });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Verify
    if (body.action === 'verify') {
      if (!body.pin || !/^\d{4,6}$/.test(body.pin)) {
        return new Response(JSON.stringify({ success: false, error: 'invalid_pin_format' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const ua = req.headers.get('user-agent') || '';
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;

      // Approximate geolocation via free service (best effort)
      let city: string | null = null, region: string | null = null, country: string | null = null;
      if (ip) {
        try {
          const geo = await fetch(`https://ipapi.co/${ip}/json/`).then(r => r.ok ? r.json() : null);
          if (geo) {
            city = geo.city || null;
            region = geo.region || null;
            country = geo.country_name || null;
          }
        } catch (_) { /* best effort */ }
      }

      const { data, error } = await supabase.rpc('verify_emergency_pin', {
        p_token: body.token,
        p_pin: body.pin,
        p_device_type: getDeviceType(ua),
        p_browser: getBrowser(ua),
        p_ip: ip,
        p_city: city,
        p_region: region,
        p_country: country,
        p_user_agent: ua,
      });

      if (error) {
        return new Response(JSON.stringify({ success: false, error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(data), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'unknown_action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    return new Response(JSON.stringify({ error: e.message || 'internal_error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
