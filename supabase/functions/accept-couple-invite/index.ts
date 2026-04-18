// Edge function: accept-couple-invite
// Validates the token and links the authenticated user as the partner.
// Seeds default couple_permissions for both directions.

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

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) return json({ error: 'Missing Authorization header' }, 401);

    const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2');
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData?.user) return json({ error: 'Invalid auth token' }, 401);
    const user = userData.user;

    const body = await req.json().catch(() => ({}));
    const token = String(body?.token || '').trim();
    if (!token) return json({ error: 'token is required' }, 400);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);

    const { data: link, error: linkErr } = await admin
      .from('couple_links')
      .select('*')
      .eq('invite_token', token)
      .maybeSingle();

    if (linkErr || !link) return json({ error: 'Invalid invitation link' }, 404);
    if (link.status === 'active') return json({ error: 'This invitation was already accepted.' }, 409);
    if (link.status === 'unlinked') return json({ error: 'This invitation is no longer valid.' }, 410);
    if (link.invite_expires_at && new Date(link.invite_expires_at) < new Date()) {
      return json({ error: 'This invitation has expired.' }, 410);
    }
    if (link.user_id_1 === user.id) {
      return json({ error: 'You cannot accept your own invitation.' }, 400);
    }

    // Block if the accepting user already has an active link
    const { data: alreadyActive } = await admin
      .from('couple_links')
      .select('id')
      .or(`user_id_1.eq.${user.id},user_id_2.eq.${user.id}`)
      .eq('status', 'active')
      .maybeSingle();
    if (alreadyActive) return json({ error: 'You already have an active partner link.' }, 409);

    // Activate
    const { error: updErr } = await admin
      .from('couple_links')
      .update({
        user_id_2: user.id,
        status: 'active',
        linked_at: new Date().toISOString(),
        invite_token: null,
        invite_expires_at: null,
      })
      .eq('id', link.id);
    if (updErr) return json({ error: updErr.message }, 500);

    // Seed default permissions (both directions, view-only)
    const { error: seedErr } = await admin.rpc('seed_default_couple_permissions', { p_link_id: link.id });
    if (seedErr) console.error('seed_default_couple_permissions failed:', seedErr);

    // Log the link event for both sides
    await admin.from('couple_activity').insert({
      couple_link_id: link.id,
      user_id: user.id,
      action_type: 'linked',
      description: 'Partner linked',
    });

    return json({ ok: true, linkId: link.id });
  } catch (err: any) {
    console.error('accept-couple-invite error:', err);
    return json({ error: err?.message || 'Unknown error' }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
