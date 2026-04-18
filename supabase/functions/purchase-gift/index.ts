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
    const { data: claims, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claims?.claims) throw new Error("Invalid token");
    const userId = claims.claims.sub as string;

    const body = await req.json();
    const { planKey, recipientName, recipientEmail, personalMessage, deliveryDate, successUrl, cancelUrl } = body;
    if (!planKey) throw new Error("planKey is required");
    if (!recipientName) throw new Error("recipientName is required");

    // Look up the Stripe price for this plan
    const { data: plan, error: planErr } = await supabase
      .from("pricing_plans")
      .select("stripe_price_id, plan_key, price")
      .eq("plan_key", planKey)
      .maybeSingle();
    if (planErr || !plan?.stripe_price_id) throw new Error("Plan not configured");

    // Generate a unique code via DB function
    const { data: codeRow, error: codeErr } = await supabase.rpc("generate_gift_code");
    if (codeErr || !codeRow) throw new Error("Could not generate code");
    const giftCode = codeRow as string;

    // Insert pending gift_code row
    const { data: gift, error: insertErr } = await supabase
      .from("gift_codes")
      .insert({
        code: giftCode,
        plan_key: planKey,
        purchased_by_user_id: userId,
        recipient_email: recipientEmail || null,
        recipient_name: recipientName,
        personal_message: personalMessage || null,
        delivery_date: deliveryDate || null,
        status: "pending",
      })
      .select()
      .single();
    if (insertErr) throw insertErr;

    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("Stripe not configured");
    const stripe = new Stripe(stripeKey, { apiVersion: "2022-11-15", httpClient: Stripe.createFetchHttpClient() });

    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [{ price: plan.stripe_price_id, quantity: 1 }],
      payment_method_types: ["card"],
      client_reference_id: userId,
      success_url: successUrl || "https://app.survivorpacket.com/gift/success?code=" + giftCode,
      cancel_url: cancelUrl || "https://app.survivorpacket.com/pricing",
      metadata: {
        type: "gift",
        gift_id: gift.id,
        gift_code: giftCode,
        plan_key: planKey,
        purchased_by: userId,
      },
      allow_promotion_codes: true,
    });

    return new Response(JSON.stringify({ url: session.url, code: giftCode, giftId: gift.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });
  } catch (err: any) {
    console.error("purchase-gift error:", err.message);
    return new Response(JSON.stringify({ error: err.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 400,
    });
  }
});
