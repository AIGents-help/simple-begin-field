import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Upgrade map: from basic plan_key → { targetPlanKey, differenceDollars }
const UPGRADE_MAP: Record<string, { target: string; diff: number }> = {
  basic_single_lifetime: { target: "full_single_lifetime", diff: 100 },
  basic_couple_lifetime: { target: "full_couple_lifetime", diff: 102 },
  basic_family_lifetime: { target: "full_family_lifetime", diff: 200 },
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) throw new Error("Unauthorized");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims } = await supabase.auth.getClaims(token);
    const userId = claims?.claims?.sub as string;
    if (!userId) throw new Error("Invalid token");

    const { fromPlanKey, successUrl, cancelUrl } = await req.json();
    const upgrade = UPGRADE_MAP[fromPlanKey];
    if (!upgrade) throw new Error("This plan is not eligible for upgrade");

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2022-11-15", httpClient: Stripe.createFetchHttpClient() });

    // Create a one-off Price for the difference (or use a pre-synced upgrade price if available)
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `Upgrade to Full Feature (${upgrade.target})`,
            description: `Difference between ${fromPlanKey} and ${upgrade.target}`,
          },
          unit_amount: upgrade.diff * 100,
        },
        quantity: 1,
      }],
      client_reference_id: userId,
      success_url: successUrl || "https://app.survivorpacket.com/checkout/success?upgrade=1",
      cancel_url: cancelUrl || "https://app.survivorpacket.com/profile",
      metadata: {
        type: "upgrade",
        from_plan: fromPlanKey,
        to_plan: upgrade.target,
        user_id: userId,
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("upgrade-plan error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
