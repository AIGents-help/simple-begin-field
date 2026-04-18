import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import Stripe from "https://esm.sh/stripe?target=deno";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
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

    const { planKey, seats, companyName, billingEmail, successUrl, cancelUrl } = await req.json();
    const seatCount = Math.max(10, parseInt(String(seats), 10) || 10);
    if (!planKey) throw new Error("planKey required");
    if (!companyName) throw new Error("companyName required");

    const { data: plan } = await supabase
      .from("pricing_plans")
      .select("price, plan_key, feature_tier")
      .eq("plan_key", planKey)
      .maybeSingle();
    if (!plan) throw new Error("Plan not found");

    const discount = seatCount >= 50 ? 0.2 : 0;
    const totalCents = Math.round(plan.price * seatCount * (1 - discount) * 100);

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2022-11-15", httpClient: Stripe.createFetchHttpClient() });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: {
            name: `${plan.plan_key} — ${seatCount} seats`,
            description: companyName + (discount ? " (20% volume discount)" : ""),
          },
          unit_amount: totalCents,
        },
        quantity: 1,
      }],
      customer_email: billingEmail,
      client_reference_id: userId,
      success_url: successUrl || "https://app.survivorpacket.com/corporate/dashboard?welcome=1",
      cancel_url: cancelUrl || "https://app.survivorpacket.com/pricing",
      metadata: {
        type: "corporate",
        plan_key: planKey,
        feature_tier: plan.feature_tier ?? "basic",
        seats: String(seatCount),
        company_name: companyName,
        admin_user_id: userId,
        billing_email: billingEmail ?? "",
      },
    });

    return new Response(JSON.stringify({ url: session.url }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
