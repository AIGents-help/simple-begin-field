import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { sendLoopsTransactional } from "../_shared/loops.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Loops transactional template IDs (create in Loops dashboard)
const LOOPS_EXPIRATION_SINGLE = Deno.env.get("LOOPS_EXPIRATION_SINGLE_ID") || "";
const LOOPS_EXPIRATION_BATCH = Deno.env.get("LOOPS_EXPIRATION_BATCH_ID") || "";

const APP_URL = Deno.env.get("APP_URL") || "https://app.survivorpacket.com";

// Map alert flag column -> threshold in days from today
const THRESHOLDS: Array<{ flag: string; days: number; prefKey: string; label: string }> = [
  { flag: "alert_sent_90", days: 90, prefKey: "alert_90_days", label: "90 days" },
  { flag: "alert_sent_60", days: 60, prefKey: "alert_60_days", label: "60 days" },
  { flag: "alert_sent_30", days: 30, prefKey: "alert_30_days", label: "30 days" },
  { flag: "alert_sent_14", days: 14, prefKey: "alert_14_days", label: "14 days" },
  { flag: "alert_sent_7", days: 7, prefKey: "alert_7_days", label: "7 days" },
  { flag: "alert_sent_0", days: 0, prefKey: "alert_on_day", label: "today" },
  { flag: "alert_sent_overdue", days: -7, prefKey: "alert_overdue", label: "overdue" },
];

function daysBetween(today: Date, target: Date): number {
  const ms = target.getTime() - today.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    // Pull all non-dismissed alerts that are within the widest window
    const horizonStart = new Date(today);
    horizonStart.setUTCDate(today.getUTCDate() - 7); // overdue window
    const horizonEnd = new Date(today);
    horizonEnd.setUTCDate(today.getUTCDate() + 90);

    const { data: alerts, error: alertsErr } = await supabase
      .from("document_alerts")
      .select("*")
      .eq("is_dismissed", false)
      .gte("expiry_date", horizonStart.toISOString().slice(0, 10))
      .lte("expiry_date", horizonEnd.toISOString().slice(0, 10));

    if (alertsErr) throw alertsErr;

    // Group eligible alerts by user
    const perUser = new Map<string, Array<{ alert: any; threshold: typeof THRESHOLDS[0] }>>();

    for (const alert of alerts || []) {
      const expiry = new Date(alert.expiry_date + "T00:00:00Z");
      const diff = daysBetween(today, expiry);

      // Find the most urgent threshold this alert hits today, that hasn't been sent yet
      let hit: typeof THRESHOLDS[0] | null = null;
      for (const t of THRESHOLDS) {
        if (diff === t.days && !alert[t.flag]) {
          hit = t;
          break;
        }
      }
      if (!hit) continue;

      const list = perUser.get(alert.user_id) || [];
      list.push({ alert, threshold: hit });
      perUser.set(alert.user_id, list);
    }

    let emailsSent = 0;
    let alertsMarked = 0;
    const results: any[] = [];

    for (const [userId, items] of perUser.entries()) {
      // Load preferences + profile
      const { data: prefs } = await supabase
        .from("notification_preferences")
        .select("*")
        .eq("user_id", userId)
        .maybeSingle();

      const { data: profile } = await supabase
        .from("profiles")
        .select("id, email, full_name")
        .eq("id", userId)
        .maybeSingle();

      if (!profile?.email) continue;

      // Default: enabled if no row
      const masterEnabled = prefs ? prefs.expiration_alerts_enabled : true;
      if (!masterEnabled) {
        results.push({ userId, skipped: "master_off" });
        continue;
      }

      const monitored: string[] = prefs?.monitored_sections || [
        "info", "medical", "real-estate", "vehicles", "legal",
        "property", "advisors", "retirement", "investments",
      ];

      // Filter by preferences
      const eligible = items.filter(({ alert, threshold }) => {
        if (!monitored.includes(alert.section_key)) return false;
        if (prefs && prefs[threshold.prefKey] === false) return false;
        return true;
      });

      if (eligible.length === 0) continue;

      // Build email payload
      const firstName = (profile.full_name || "").split(" ")[0] || "there";
      const itemsList = eligible.map(({ alert, threshold }) => {
        const expiry = new Date(alert.expiry_date + "T00:00:00Z");
        const diff = daysBetween(today, expiry);
        const dateStr = expiry.toLocaleDateString("en-US", {
          year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
        });
        const status = diff < 0
          ? `Overdue by ${Math.abs(diff)} day(s)`
          : diff === 0
            ? "Expires today"
            : `Expires in ${diff} day(s)`;
        return `• ${alert.document_name || alert.document_type} — ${dateStr} (${status})`;
      }).join("\n");

      const sectionUrl = `${APP_URL}/?section=${encodeURIComponent(eligible[0].alert.section_key)}`;
      const isBatch = eligible.length > 1;

      try {
        if (isBatch && LOOPS_EXPIRATION_BATCH) {
          await sendLoopsTransactional({
            transactionalId: LOOPS_EXPIRATION_BATCH,
            email: profile.email,
            dataVariables: {
              firstName,
              itemCount: String(eligible.length),
              itemsList,
              dashboardUrl: `${APP_URL}/dashboard`,
              settingsUrl: `${APP_URL}/profile`,
            },
          });
        } else if (LOOPS_EXPIRATION_SINGLE) {
          const { alert, threshold } = eligible[0];
          const expiry = new Date(alert.expiry_date + "T00:00:00Z");
          const diff = daysBetween(today, expiry);
          await sendLoopsTransactional({
            transactionalId: LOOPS_EXPIRATION_SINGLE,
            email: profile.email,
            dataVariables: {
              firstName,
              documentName: alert.document_name || alert.document_type,
              expiryDate: expiry.toLocaleDateString("en-US", {
                year: "numeric", month: "short", day: "numeric", timeZone: "UTC",
              }),
              daysRemaining: String(diff),
              urgencyLabel: threshold.label,
              sectionKey: alert.section_key,
              updateUrl: sectionUrl,
              settingsUrl: `${APP_URL}/profile`,
            },
          });
        } else {
          console.warn("Loops template IDs not configured; skipping send for", profile.email);
          continue;
        }
        emailsSent++;
      } catch (e) {
        console.error("Loops send failed for", profile.email, e);
        continue;
      }

      // Mark flags so we never re-send the same threshold
      for (const { alert, threshold } of eligible) {
        const patch: Record<string, any> = {
          [threshold.flag]: true,
          last_alert_sent_at: new Date().toISOString(),
        };
        const { error: updErr } = await supabase
          .from("document_alerts")
          .update(patch)
          .eq("id", alert.id);
        if (!updErr) alertsMarked++;
      }

      results.push({ userId, email: profile.email, count: eligible.length });
    }

    return new Response(
      JSON.stringify({
        ok: true,
        scanned: alerts?.length || 0,
        usersNotified: results.length,
        emailsSent,
        alertsMarked,
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error: any) {
    console.error("process-expiration-alerts error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
