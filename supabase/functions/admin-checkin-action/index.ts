// Admin actions for Inactivity Check-in System
// - send_now: trigger a fresh check-in email for a user
// - mark_checked_in: manually mark user as checked-in (logs to admin_activity_log)
// deno-lint-ignore-file no-explicit-any
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import { sendLoopsEvent } from "../_shared/loops.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")!;

const APP_URL =
  Deno.env.get("PUBLIC_APP_URL") || "https://app.survivorpacket.com";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization") || "";
    const token = authHeader.replace("Bearer ", "");
    if (!token) {
      return json({ error: "Unauthorized" }, 401);
    }

    // Verify caller is admin
    const userClient = createClient(SUPABASE_URL, ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: userData, error: userErr } = await userClient.auth.getUser();
    if (userErr || !userData.user) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(SUPABASE_URL, SERVICE_KEY);
    const { data: prof } = await admin
      .from("profiles")
      .select("id, email, role, full_name")
      .eq("id", userData.user.id)
      .maybeSingle();
    if (!prof || prof.role !== "admin") {
      return json({ error: "Admin only" }, 403);
    }

    const { action, target_user_id } = await req.json();
    if (!action || !target_user_id) {
      return json({ error: "Missing action or target_user_id" }, 400);
    }

    const { data: targetProfile } = await admin
      .from("profiles")
      .select("id, email, full_name")
      .eq("id", target_user_id)
      .maybeSingle();
    if (!targetProfile) return json({ error: "User not found" }, 404);

    if (action === "send_now") {
      const { data: settings } = await admin
        .from("checkin_settings")
        .select("*")
        .eq("user_id", target_user_id)
        .maybeSingle();
      const grace = settings?.grace_period_days ?? 7;

      const { data: tokenRow, error: tokenErr } = await admin.rpc(
        "issue_checkin_token",
        { p_user_id: target_user_id, p_grace_days: grace },
      );
      if (tokenErr) throw tokenErr;
      const row = (tokenRow as any[])?.[0];
      const checkinUrl = `${APP_URL}/checkin?token=${row.token}`;

      await sendLoopsEvent({
        email: targetProfile.email!,
        eventName: "checkin_request",
        eventProperties: {
          firstName: (targetProfile.full_name || "").split(" ")[0],
          checkinUrl,
          gracePeriodDays: String(grace),
          isAdminTriggered: "true",
        },
      });

      await admin.from("admin_activity_log").insert({
        action: "checkin_send_now",
        admin_user_id: prof.id,
        admin_email: prof.email,
        target_user_id: targetProfile.id,
        target_user_email: targetProfile.email,
        new_value: { event_id: row.event_id },
        note: "Admin manually triggered check-in email",
      });

      return json({ success: true, event_id: row.event_id });
    }

    if (action === "mark_checked_in") {
      // Insert a completed event + update profile
      await admin.from("checkin_events").insert({
        user_id: target_user_id,
        status: "completed",
        sent_at: new Date().toISOString(),
        checked_in_at: new Date().toISOString(),
        notes: `Admin (${prof.email}) marked as checked in`,
      });
      await admin
        .from("profiles")
        .update({
          last_checkin_at: new Date().toISOString(),
          checkin_status: "active",
        })
        .eq("id", target_user_id);

      await admin.from("admin_activity_log").insert({
        action: "checkin_mark_complete",
        admin_user_id: prof.id,
        admin_email: prof.email,
        target_user_id: targetProfile.id,
        target_user_email: targetProfile.email,
        note: "Admin manually marked user as checked-in",
      });

      return json({ success: true });
    }

    return json({ error: `Unknown action: ${action}` }, 400);
  } catch (err: any) {
    console.error("[admin-checkin-action] error", err);
    return json({ error: err?.message || "Unexpected error" }, 500);
  }
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
