// Inactivity Check-in System — scheduled processor
// Runs daily via pg_cron. For each user with check-ins enabled:
//   1. If due → issue token + send Loops "checkin_request" event
//   2. If sent but no response, partway through grace → send reminder
//   3. If sent and grace nearly expired → send final warning
//   4. If grace fully expired → mark triggered + notify selected trusted contacts
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const LOOPS_API_KEY = Deno.env.get("LOOPS_API_KEY") || "";
const LOOPS_EVENT_URL = "https://app.loops.so/api/v1/events/send";
const APP_BASE_URL = Deno.env.get("APP_BASE_URL") || "https://app.survivorpacket.com";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

interface Settings {
  user_id: string;
  is_enabled: boolean;
  frequency_days: number;
  grace_period_days: number;
  release_behavior: string;
  is_paused: boolean;
  pause_until: string | null;
  selected_contact_ids: string[] | null;
}

async function sendLoopsEvent(email: string, eventName: string, props: Record<string, unknown>) {
  if (!LOOPS_API_KEY) {
    console.warn(`[loops] missing LOOPS_API_KEY, skipping event=${eventName} email=${email}`);
    return { ok: false, status: 0, body: "missing api key" };
  }
  const res = await fetch(LOOPS_EVENT_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${LOOPS_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, eventName, eventProperties: props }),
  });
  const body = await res.text();
  console.log(`[loops] ${eventName} → ${email} status=${res.status} ${body.slice(0, 200)}`);
  return { ok: res.ok, status: res.status, body };
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);
  const now = new Date();
  const summary = {
    requestsSent: 0,
    remindersSent: 0,
    finalWarningsSent: 0,
    triggered: 0,
    contactsNotified: 0,
    errors: [] as string[],
  };

  try {
    // Pull all enabled, non-paused settings
    const { data: settingsList, error: sErr } = await supabase
      .from("checkin_settings")
      .select("*")
      .eq("is_enabled", true);
    if (sErr) throw sErr;

    for (const s of (settingsList || []) as Settings[]) {
      try {
        // Honour pause window
        if (s.is_paused) {
          if (!s.pause_until || new Date(s.pause_until) > now) continue;
          // pause expired → un-pause
          await supabase.from("checkin_settings").update({ is_paused: false, pause_until: null }).eq("user_id", s.user_id);
        }

        const { data: profile } = await supabase
          .from("profiles")
          .select("id, email, full_name, last_checkin_at, checkin_status")
          .eq("id", s.user_id)
          .maybeSingle();
        if (!profile?.email) continue;

        const firstName = (profile.full_name || "").split(" ")[0] || "there";
        const lastCheckin = profile.last_checkin_at ? new Date(profile.last_checkin_at) : null;
        const freqMs = s.frequency_days * 86400000;
        const nextDue = lastCheckin ? new Date(lastCheckin.getTime() + freqMs) : new Date(0);

        // Find latest pending event (sent but not completed)
        const { data: pendingRows } = await supabase
          .from("checkin_events")
          .select("*")
          .eq("user_id", s.user_id)
          .in("status", ["sent"])
          .order("created_at", { ascending: false })
          .limit(1);
        const pending = pendingRows?.[0];

        // === Case 1: A pending event exists — handle reminders / grace expiry ===
        if (pending) {
          const sentAt = new Date(pending.sent_at);
          const ageDays = Math.floor((now.getTime() - sentAt.getTime()) / 86400000);
          const grace = s.grace_period_days;
          const verifyUrl = `${APP_BASE_URL}/checkin?token=${pending.token}`;

          if (ageDays >= grace) {
            // Grace expired → trigger
            await supabase.rpc("mark_checkin_triggered", { p_event_id: pending.id });
            summary.triggered++;

            // Notify selected trusted contacts
            const ids = s.selected_contact_ids || [];
            if (ids.length > 0) {
              const { data: contacts } = await supabase
                .from("trusted_contacts")
                .select("contact_email, contact_name")
                .in("id", ids);
              for (const c of contacts || []) {
                if (!c.contact_email) continue;
                const release = s.release_behavior;
                const accessUrl = `${APP_BASE_URL}/trusted-contact`;
                await sendLoopsEvent(c.contact_email, "inactivity_alert_to_contact", {
                  contactName: c.contact_name || "there",
                  ownerName: profile.full_name || profile.email,
                  ownerEmail: profile.email,
                  lastCheckinDate: lastCheckin ? lastCheckin.toLocaleDateString("en-US") : "unknown",
                  releaseBehavior: release,
                  willReleaseAccess: release !== "notify_only" ? "yes" : "no",
                  accessUrl,
                });
                summary.contactsNotified++;
              }
            }
            continue;
          }

          // Send reminder at day 1 (after first 24h)
          if (ageDays >= 1 && pending.reminder_count < 1) {
            await sendLoopsEvent(profile.email, "checkin_reminder", {
              firstName,
              checkinUrl: verifyUrl,
              graceDeadline: new Date(sentAt.getTime() + grace * 86400000).toLocaleDateString("en-US"),
              daysRemaining: String(grace - ageDays),
            });
            await supabase.rpc("bump_checkin_reminder", { p_event_id: pending.id });
            summary.remindersSent++;
            continue;
          }

          // Final warning when ≤2 days remain in grace and we haven't sent a 2nd reminder yet
          if (grace - ageDays <= 2 && pending.reminder_count < 2) {
            await sendLoopsEvent(profile.email, "checkin_final_warning", {
              firstName,
              checkinUrl: verifyUrl,
              daysRemaining: String(Math.max(0, grace - ageDays)),
            });
            await supabase.rpc("bump_checkin_reminder", { p_event_id: pending.id });
            summary.finalWarningsSent++;
            continue;
          }
          continue;
        }

        // === Case 2: No pending event — check if we should send a fresh request ===
        const due = !lastCheckin || now >= nextDue;
        if (!due) continue;

        // Issue token + create event row
        const { data: tokenRow, error: tErr } = await supabase
          .rpc("issue_checkin_token", { p_user_id: s.user_id, p_grace_days: s.grace_period_days });
        if (tErr) throw tErr;
        const t = (tokenRow as any[])?.[0];
        if (!t?.token) continue;

        const verifyUrl = `${APP_BASE_URL}/checkin?token=${t.token}`;
        const result = await sendLoopsEvent(profile.email, "checkin_request", {
          firstName,
          checkinUrl: verifyUrl,
          graceDays: String(s.grace_period_days),
          frequencyDays: String(s.frequency_days),
        });
        if (result.ok) summary.requestsSent++;

        // Update profile status to active (we've started a cycle)
        await supabase
          .from("profiles")
          .update({ checkin_status: "overdue", last_checkin_sent_at: now.toISOString() })
          .eq("id", s.user_id);
      } catch (innerErr: any) {
        console.error(`[user ${s.user_id}]`, innerErr?.message || innerErr);
        summary.errors.push(`${s.user_id}: ${innerErr?.message || innerErr}`);
      }
    }

    console.log("process-checkins summary:", summary);
    return new Response(JSON.stringify({ ok: true, summary }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("process-checkins fatal:", err);
    return new Response(JSON.stringify({ ok: false, error: err?.message || String(err), summary }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
