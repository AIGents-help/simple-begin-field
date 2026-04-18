import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Phase 3 — Inactivity sweep edge function.
 *
 * Calls the SECURITY DEFINER `run_inactivity_release_sweep()` RPC, which
 * auto-releases packets to trusted contacts whose owner has been inactive
 * past their configured threshold. Then sends a notification email per
 * newly-released contact via the existing send-trusted-contact-invite
 * function in `release_notification` mode.
 *
 * Intended to be invoked by a daily cron job.
 */

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { data, error } = await supabase.rpc("run_inactivity_release_sweep");
    if (error) {
      console.error("Sweep RPC error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const released = (data as any[]) || [];
    console.log(`Inactivity sweep released ${released.length} contact(s).`);

    // Notify each released contact via existing email function
    let notified = 0;
    for (const row of released) {
      try {
        const res = await fetch(`${supabaseUrl}/functions/v1/send-trusted-contact-invite`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${serviceKey}`,
          },
          body: JSON.stringify({
            contact_id: row.released_contact_id,
            mode: "release_notification",
          }),
        });
        if (res.ok) notified++;
      } catch (e) {
        console.error("Notify failed:", e);
      }
    }

    return new Response(
      JSON.stringify({
        released_count: released.length,
        notified_count: notified,
        released,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err: any) {
    console.error("Sweep error:", err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
