// Daily drift sweep + weekly digest emails for the Packet Health Score.
// Idempotent: recomputes every active packet, then sends a weekly digest
// (via Loops) if score changed by ±10 points in the last 7 days.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import { sendLoopsTransactional } from '../_shared/loops.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const DIGEST_TEMPLATE_ID = Deno.env.get('LOOPS_HEALTH_DIGEST_TEMPLATE_ID') || '';

const SIGNIFICANT_DELTA = 10; // ± points considered "significant"
const APP_URL = Deno.env.get('APP_URL') || 'https://app.survivorpacket.com';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json().catch(() => ({}));
    const skipDigest = body?.skip_digest === true;
    const forcePacketId = body?.packet_id as string | undefined;

    // 1. Fetch packets to recompute
    const packetQuery = supabase.from('packets').select('id, owner_id');
    const { data: packets, error: packetErr } = forcePacketId
      ? await packetQuery.eq('id', forcePacketId)
      : await packetQuery;

    if (packetErr) throw packetErr;

    let recomputed = 0;
    let digestsSent = 0;
    const errors: string[] = [];

    for (const p of packets || []) {
      try {
        // Recompute via Postgres function
        const { error: rpcErr } = await supabase.rpc('calculate_health_score', { p_packet_id: p.id });
        if (rpcErr) {
          errors.push(`recompute ${p.id}: ${rpcErr.message}`);
          continue;
        }
        recomputed++;

        if (skipDigest) continue;

        // Pull latest score + last week's history snapshot
        const { data: current } = await supabase
          .from('health_scores')
          .select('total_score, section_scores, critical_gaps, calculated_at')
          .eq('packet_id', p.id)
          .maybeSingle();

        if (!current) continue;

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
        const { data: lastWeekRows } = await supabase
          .from('health_score_history')
          .select('total_score, recorded_at')
          .eq('packet_id', p.id)
          .lte('recorded_at', sevenDaysAgo)
          .order('recorded_at', { ascending: false })
          .limit(1);

        const lastWeekScore = lastWeekRows?.[0]?.total_score ?? null;
        if (lastWeekScore === null) continue;

        const delta = (current.total_score as number) - lastWeekScore;
        if (Math.abs(delta) < SIGNIFICANT_DELTA) continue;

        // Lookup owner email
        const { data: owner } = await supabase
          .from('profiles')
          .select('id, email, full_name')
          .eq('id', p.owner_id)
          .maybeSingle();

        if (!owner?.email) continue;

        // Top 3 actions = critical_gaps
        const gaps = (current.critical_gaps as any[]) || [];
        const top3 = gaps.slice(0, 3);

        if (DIGEST_TEMPLATE_ID) {
          await sendLoopsTransactional({
            transactionalId: DIGEST_TEMPLATE_ID,
            email: owner.email,
            dataVariables: {
              firstName: (owner.full_name || '').split(' ')[0] || 'there',
              currentScore: String(current.total_score),
              previousScore: String(lastWeekScore),
              changeText: delta > 0 ? `+${delta} points stronger` : `${delta} points`,
              improved: delta > 0 ? 'true' : 'false',
              percentStronger: delta > 0 ? String(Math.round((delta / Math.max(1, lastWeekScore)) * 100)) : '0',
              action1: top3[0]?.label || '',
              action2: top3[1]?.label || '',
              action3: top3[2]?.label || '',
              improveUrl: `${APP_URL}/`,
            },
          });
          digestsSent++;
        } else {
          console.log(`[digest] would send to ${owner.email}: ${lastWeekScore} -> ${current.total_score} (${delta > 0 ? '+' : ''}${delta})`);
        }
      } catch (err: any) {
        errors.push(`packet ${p.id}: ${err.message}`);
      }
    }

    return new Response(
      JSON.stringify({
        ok: true,
        recomputed,
        digests_sent: digestsSent,
        total_packets: packets?.length || 0,
        errors: errors.slice(0, 20),
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (err: any) {
    console.error('[recalculate-health-scores] fatal', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
