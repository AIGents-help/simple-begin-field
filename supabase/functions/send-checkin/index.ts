const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const LOOPS_URL = 'https://app.loops.so/api/v1/events/send';

const INTERVAL_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  biannual: 182,
  annual: 365,
};

const SECTION_TABLES = [
  'info_records', 'family_members', 'medical_records', 'banking_records',
  'real_estate_records', 'retirement_records', 'vehicle_records', 'advisor_records',
  'password_records', 'personal_property_records', 'pet_records', 'funeral_records',
  'private_items', 'documents', 'trusted_contacts',
];

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

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const supabase = createClient(supabaseUrl, supabaseKey);

    let body: any = {};
    try { body = await req.json(); } catch { /* empty body = batch mode */ }

    const { user_id } = body;
    const now = new Date();

    // Build query for due users
    let query = supabase
      .from('profiles')
      .select('id, email, full_name, checkin_frequency, last_checkin_sent_at, checkin_opted_out')
      .eq('checkin_opted_out', false);

    if (user_id) {
      query = query.eq('id', user_id);
    }

    const { data: profiles, error: profileError } = await query;
    if (profileError) {
      console.error('Profile query error:', profileError);
      return new Response(JSON.stringify({ error: 'Failed to query profiles' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Filter to users who are due
    const dueUsers = (profiles || []).filter((p: any) => {
      if (user_id) return true; // If specific user requested, always send
      const lastSent = p.last_checkin_sent_at;
      if (!lastSent) return true;
      const freq = p.checkin_frequency || 'quarterly';
      const days = INTERVAL_DAYS[freq] || 90;
      return now.getTime() - new Date(lastSent).getTime() >= days * 86400000;
    });

    let sent = 0;
    const sentEmails: string[] = [];

    for (const user of dueUsers) {
      try {
        // Get user's packet
        const { data: packets } = await supabase
          .from('packets')
          .select('id, updated_at')
          .eq('owner_user_id', user.id)
          .limit(1);

        const packet = packets?.[0];
        if (!packet) continue;

        // Calculate completion
        let sectionsComplete = 0;
        for (const table of SECTION_TABLES) {
          const { count } = await supabase
            .from(table)
            .select('id', { count: 'exact', head: true })
            .eq('packet_id', packet.id);
          if ((count || 0) > 0) sectionsComplete++;
        }
        const completionPct = Math.round((sectionsComplete / 15) * 100);

        // Send Loops event
        const res = await fetch(LOOPS_URL, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${LOOPS_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: user.email,
            eventName: 'packet_checkin',
            eventProperties: {
              firstName: user.full_name?.split(' ')[0] || 'there',
              completionPct,
              sectionsComplete,
              totalSections: 15,
              lastUpdated: packet.updated_at ? new Date(packet.updated_at).toLocaleDateString('en-US') : 'N/A',
              checkInNumber: 1, // Could track in DB for accuracy
            },
          }),
        });

        if (res.ok) {
          // Update last_checkin_sent_at
          await supabase
            .from('profiles')
            .update({ last_checkin_sent_at: now.toISOString() })
            .eq('id', user.id);
          sent++;
          sentEmails.push(user.email);
        } else {
          console.error(`Failed to send to ${user.email}:`, await res.text());
        }
      } catch (userErr) {
        console.error(`Error processing user ${user.id}:`, userErr);
      }
    }

    return new Response(JSON.stringify({ sent, users: sentEmails }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-checkin error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
