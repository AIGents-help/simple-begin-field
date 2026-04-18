// Admin-only edge function: creates Stripe Products + Prices for every
// pricing_plans row that has a NULL stripe_price_id, then writes the new
// price_id back to the database. Idempotent — safe to re-run.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.0";
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const stripeKey = Deno.env.get("STRIPE_SECRET_KEY");
    if (!stripeKey) throw new Error("STRIPE_SECRET_KEY not configured");

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("Missing Authorization header");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // Verify the caller is an admin
    const userClient = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) throw new Error("Not authenticated");

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    if (profile?.role !== "admin") throw new Error("Admin role required");

    const stripe = new Stripe(stripeKey, { apiVersion: "2024-06-20" });

    // Pull all plans missing a stripe_price_id (skip free)
    const { data: plans, error } = await supabase
      .from("pricing_plans")
      .select("id, plan_key, name, price_cents, plan_category, feature_tier, stripe_price_id")
      .neq("plan_key", "free");
    if (error) throw error;

    const results: any[] = [];
    for (const plan of plans || []) {
      if (plan.stripe_price_id) {
        results.push({ plan_key: plan.plan_key, status: "skipped", price_id: plan.stripe_price_id });
        continue;
      }

      // Look up existing product by metadata.plan_key (idempotency)
      const search = await stripe.products.search({
        query: `metadata['plan_key']:'${plan.plan_key}' AND active:'true'`,
      });
      let productId = search.data[0]?.id;
      if (!productId) {
        const product = await stripe.products.create({
          name: plan.name,
          metadata: {
            plan_key: plan.plan_key,
            plan_category: plan.plan_category,
            feature_tier: plan.feature_tier,
          },
        });
        productId = product.id;
      }

      const price = await stripe.prices.create({
        product: productId,
        currency: "usd",
        unit_amount: plan.price_cents,
        metadata: { plan_key: plan.plan_key },
      });

      await supabase
        .from("pricing_plans")
        .update({ stripe_price_id: price.id })
        .eq("id", plan.id);

      results.push({ plan_key: plan.plan_key, status: "created", product_id: productId, price_id: price.id });
    }

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err: any) {
    console.error("stripe-product-sync error:", err);
    return new Response(JSON.stringify({ error: err.message || String(err) }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
