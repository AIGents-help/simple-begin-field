// Inactivity Check-in System — token verification endpoint
// Returns a branded HTML confirmation page when an owner clicks the
// "I'm Okay" button in their check-in email. No login required.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const page = (opts: {
  title: string;
  heading: string;
  message: string;
  nextDate?: string;
  variant?: "success" | "error" | "info";
}) => {
  const accent =
    opts.variant === "error" ? "#b45309" : opts.variant === "info" ? "#0f766e" : "#15803d";
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>${opts.title}</title>
  <style>
    body{margin:0;font-family:Georgia,'Times New Roman',serif;background:#faf7f2;color:#1c1917;display:flex;align-items:center;justify-content:center;min-height:100vh;padding:24px}
    .card{background:#fff;border:1px solid #e7e5e4;border-radius:18px;padding:48px 40px;max-width:480px;width:100%;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.05)}
    .badge{display:inline-flex;width:56px;height:56px;border-radius:999px;background:${accent}1a;color:${accent};align-items:center;justify-content:center;font-size:28px;margin-bottom:20px}
    h1{font-size:24px;margin:0 0 12px;font-weight:600}
    p{font-size:15px;line-height:1.55;color:#57534e;margin:0 0 12px}
    .next{margin-top:24px;padding:14px 18px;background:#f5f5f4;border-radius:10px;font-size:13px;color:#44403c}
    .footer{margin-top:32px;font-size:12px;color:#a8a29e}
  </style>
</head>
<body>
  <div class="card">
    <div class="badge">${opts.variant === "error" ? "!" : "✓"}</div>
    <h1>${opts.heading}</h1>
    <p>${opts.message}</p>
    ${opts.nextDate ? `<div class="next">Your next check-in is scheduled for <strong>${opts.nextDate}</strong>.</div>` : ""}
    <div class="footer">The Survivor Packet · Stay well.</div>
  </div>
</body>
</html>`;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const url = new URL(req.url);
  const token = url.searchParams.get("token");

  if (!token) {
    return new Response(
      page({
        title: "Invalid check-in link",
        heading: "Missing token",
        message: "This check-in link is missing its security token. Please use the button from your check-in email.",
        variant: "error",
      }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

  // Look up event by token
  const { data: event, error } = await supabase
    .from("checkin_events")
    .select("id, user_id, status, token_expires_at, checked_in_at")
    .eq("token", token)
    .maybeSingle();

  if (error || !event) {
    return new Response(
      page({
        title: "Check-in link not found",
        heading: "Link not recognized",
        message: "We couldn't find this check-in link. It may have already been used, expired, or been replaced by a newer one.",
        variant: "error",
      }),
      { status: 404, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  if (event.checked_in_at) {
    return new Response(
      page({
        title: "Already checked in",
        heading: "You're already checked in",
        message: "Thanks — we already received your confirmation for this check-in. Your timer has been reset.",
        variant: "info",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  if (event.token_expires_at && new Date(event.token_expires_at) < new Date()) {
    return new Response(
      page({
        title: "Link expired",
        heading: "This link has expired",
        message: "Please sign in to your Survivor Packet and use the 'Check In Now' button on your profile to confirm you're okay.",
        variant: "error",
      }),
      { status: 410, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
    );
  }

  // Mark event complete + reset profile clock
  const nowIso = new Date().toISOString();
  await supabase
    .from("checkin_events")
    .update({ status: "completed", checked_in_at: nowIso })
    .eq("id", event.id);
  await supabase
    .from("profiles")
    .update({ last_checkin_at: nowIso, last_checkin_acknowledged_at: nowIso, checkin_status: "active" })
    .eq("id", event.user_id);

  // Compute next due for display
  const { data: settings } = await supabase
    .from("checkin_settings")
    .select("frequency_days")
    .eq("user_id", event.user_id)
    .maybeSingle();
  const nextDays = (settings as any)?.frequency_days || 30;
  const nextDate = new Date(Date.now() + nextDays * 86400000).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return new Response(
    page({
      title: "You're checked in",
      heading: "You're checked in. Stay well.",
      message: "Thank you for confirming. Your check-in timer has been reset, and your trusted contacts will not be notified.",
      nextDate,
      variant: "success",
    }),
    { status: 200, headers: { ...corsHeaders, "Content-Type": "text/html; charset=utf-8" } },
  );
});
