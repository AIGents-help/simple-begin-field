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

    const { user_id, section_name, section_display_name, packet_owner_name } = await req.json();

    if (!user_id || !section_name) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Create Supabase client with service role to bypass RLS
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Query trusted contacts that match criteria
    const { data: contacts, error: queryError } = await supabase
      .from('trusted_contacts')
      .select('contact_name, contact_email, assigned_sections')
      .eq('user_id', user_id)
      .eq('access_granted', true)
      .eq('notify_on_updates', true);

    if (queryError) {
      console.error('Query error:', queryError);
      return new Response(JSON.stringify({ error: 'Failed to query contacts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter contacts whose assigned_sections include the section or 'all'
    const matchingContacts = (contacts || []).filter((c: any) => {
      const sections: string[] = c.assigned_sections || [];
      return sections.includes('all') || sections.includes(section_name);
    });

    const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    let notified = 0;

    for (const contact of matchingContacts) {
      try {
        const res = await fetch(LOOPS_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: contact.contact_email,
            eventName: 'packet_section_updated',
            eventProperties: {
              contactName: contact.contact_name,
              ownerName: packet_owner_name || 'Someone',
              sectionName: section_display_name || section_name,
              updateDate: today,
            },
          }),
        });

        if (res.ok) {
          notified++;
        } else {
          console.error(`Failed to notify ${contact.contact_email}:`, await res.text());
        }
      } catch (emailErr) {
        console.error(`Email send error for ${contact.contact_email}:`, emailErr);
      }
    }

    return new Response(JSON.stringify({ notified }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-contact-update error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
