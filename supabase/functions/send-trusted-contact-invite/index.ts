// Edge function: send-trusted-contact-invite
// Sends invitation OR release-notification emails to trusted contacts via Loops events.

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOOPS_URL = 'https://app.loops.so/api/v1/events/send';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const LOOPS_API_KEY = Deno.env.get('LOOPS_API_KEY');
    if (!LOOPS_API_KEY) {
      console.error('LOOPS_API_KEY not configured');
      return new Response(JSON.stringify({ error: 'Email service not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const contact_id: string | undefined = body?.contact_id;
    const token: string | undefined = body?.token;
    const mode: 'invitation' | 'release_notification' = body?.mode === 'release_notification'
      ? 'release_notification'
      : 'invitation';

    if (!contact_id) {
      return new Response(JSON.stringify({ error: 'contact_id is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Load the contact + owner profile
    const { data: contact, error: contactErr } = await supabase
      .from('trusted_contacts')
      .select('id, packet_id, user_id, contact_name, contact_email, invite_token')
      .eq('id', contact_id)
      .single();

    if (contactErr || !contact) {
      console.error('Contact lookup failed:', contactErr);
      return new Response(JSON.stringify({ error: 'Contact not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: ownerProfile } = await supabase
      .from('profiles')
      .select('full_name, email')
      .eq('id', contact.user_id)
      .single();

    const ownerName = ownerProfile?.full_name || 'A friend';
    const inviteToken = token || contact.invite_token || '';
    const baseUrl = req.headers.get('origin') || 'https://app.survivorpacket.com';
    const inviteUrl = mode === 'invitation'
      ? `${baseUrl}/trusted/invite/${inviteToken}`
      : `${baseUrl}/trusted`;

    const eventName = mode === 'invitation'
      ? 'trusted_contact_invitation'
      : 'trusted_contact_access_released';

    const loopsRes = await fetch(LOOPS_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOOPS_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: contact.contact_email,
        eventName,
        eventProperties: {
          contactName: contact.contact_name,
          ownerName,
          inviteUrl,
        },
      }),
    });

    const loopsText = await loopsRes.text();
    console.log(`Loops ${eventName} to ${contact.contact_email}: ${loopsRes.status} ${loopsText}`);

    if (!loopsRes.ok) {
      return new Response(JSON.stringify({
        error: 'Email provider rejected the request',
        details: loopsText,
      }), {
        status: 502,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ ok: true, mode }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('send-trusted-contact-invite error:', err);
    return new Response(JSON.stringify({ error: err?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
