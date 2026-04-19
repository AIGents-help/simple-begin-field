import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface RequestBody {
  token: string;
  pin?: string;
  action: 'hint' | 'verify' | 'bypass';
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

const ALLOWED_BYPASS_FIELDS = new Set([
  'blood_type',
  'allergies',
  'medications',
  'medical_conditions',
  'dnr_status',
  'organ_donor',
  'emergency_contacts',
  'doctor',
  'insurance',
  'custom_field',
]);

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

    // Hint lookup (no PIN needed) — also surfaces bypass_enabled flag for the public scan page
    if (body.action === 'hint') {
      const { data, error } = await supabase.rpc('get_emergency_pin_hint', { p_token: body.token });
      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Augment the RPC response with bypass flag (read-only check on token row)
      let bypass_enabled = false;
      try {
        const { data: tok } = await supabase
          .from('emergency_tokens')
          .select('bypass_enabled, is_active')
          .eq('token', body.token)
          .maybeSingle();
        bypass_enabled = !!(tok?.bypass_enabled && tok?.is_active);
      } catch (_) { /* best effort */ }

      const merged = { ...(data || {}), bypass_enabled };
      return new Response(JSON.stringify(merged), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Bypass — provider access without PIN, returns ONLY the user-selected bypass_fields
    if (body.action === 'bypass') {
      const { data: tok, error: tokErr } = await supabase
        .from('emergency_tokens')
        .select('id, user_id, packet_id, bypass_enabled, bypass_fields, custom_field_text, is_active')
        .eq('token', body.token)
        .maybeSingle();

      if (tokErr || !tok) {
        return new Response(JSON.stringify({ success: false, error: 'invalid_token' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      if (!tok.is_active || !tok.bypass_enabled) {
        return new Response(JSON.stringify({ success: false, error: 'bypass_disabled' }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const rawFields: string[] = Array.isArray(tok.bypass_fields) ? tok.bypass_fields : [];
      const fields = rawFields.filter((f) => ALLOWED_BYPASS_FIELDS.has(f));
      const fieldSet = new Set(fields);

      // Pull the data sources (medical, family contacts) — same shape as PIN-verified path
      const [{ data: medArr }, { data: famArr }, { data: profile }] = await Promise.all([
        supabase
          .from('medical_records')
          .select('blood_type, allergies, conditions, dnr_status, organ_donor, provider_name, phone, insurance_provider, insurance_member_id, insurance_group_number, insurance_phone')
          .eq('packet_id', tok.packet_id)
          .limit(1),
        supabase
          .from('family_members')
          .select('name, phone, relationship')
          .eq('packet_id', tok.packet_id)
          .not('phone', 'is', null)
          .order('created_at')
          .limit(5),
        supabase
          .from('profiles')
          .select('full_name, first_name')
          .eq('id', tok.user_id)
          .maybeSingle(),
      ]);

      const med = (medArr || [])[0] || {};
      const medications: any[] = []; // medications table not present in current schema for this minimal set; left empty

      // Build response strictly limited to selected fields
      const data: any = {
        first_name: (profile?.first_name as string) || ((profile?.full_name as string) || '').split(' ')[0] || 'Patient',
        visible_sections: {} as Record<string, boolean>,
        medical_records: [{}],
        emergency_contacts: [],
        medications: [],
      };

      const visible = data.visible_sections;
      const medOut = data.medical_records[0];

      if (fieldSet.has('blood_type')) { visible.blood_type = true; medOut.blood_type = med.blood_type; }
      if (fieldSet.has('allergies')) { visible.allergies = true; medOut.allergies = med.allergies; }
      if (fieldSet.has('medical_conditions')) { visible.medical_conditions = true; medOut.conditions = med.conditions; }
      if (fieldSet.has('dnr_status')) { visible.dnr_status = true; medOut.dnr_status = med.dnr_status; }
      if (fieldSet.has('organ_donor')) { visible.organ_donor = true; medOut.organ_donor = med.organ_donor; }
      if (fieldSet.has('doctor')) { visible.doctor = true; medOut.provider_name = med.provider_name; medOut.phone = med.phone; }
      if (fieldSet.has('insurance')) {
        visible.insurance = true;
        medOut.insurance_provider = med.insurance_provider;
        medOut.insurance_member_id = med.insurance_member_id;
        medOut.insurance_group_number = med.insurance_group_number;
        medOut.insurance_phone = med.insurance_phone;
      }
      if (fieldSet.has('emergency_contacts')) {
        visible.emergency_contacts = true;
        data.emergency_contacts = (famArr || []).map((c: any) => ({ name: c.name, phone: c.phone, relationship: c.relationship }));
      }
      if (fieldSet.has('medications')) {
        visible.medications = true;
        data.medications = medications;
      }
      if (fieldSet.has('custom_field') && tok.custom_field_text) {
        visible.custom_field = true;
        data.custom_field = tok.custom_field_text;
      }

      // Log bypass access (best-effort, don't fail request if logging fails)
      const ua = req.headers.get('user-agent') || '';
      const ip = req.headers.get('x-forwarded-for')?.split(',')[0].trim() || null;
      try {
        await supabase.from('emergency_access_log').insert({
          token_id: tok.id,
          user_id: tok.user_id,
          pin_correct: true,
          device_type: getDeviceType(ua),
          browser: getBrowser(ua),
          ip_address: ip,
          user_agent: ua,
          sections_viewed: { mode: 'bypass', fields },
        });
      } catch (_) { /* best effort */ }

      return new Response(JSON.stringify({ success: true, data }), {
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
