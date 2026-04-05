import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe@14.21.0?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2023-10-16',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

serve(async (req) => {
  const signature = req.headers.get('stripe-signature')

  if (!signature) {
    return new Response('No signature', { status: 400 })
  }

  try {
    const body = await req.text()
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET') || ''
    const event = stripe.webhooks.constructEvent(body, signature, webhookSecret)

    console.log(`Processing event: ${event.type}`)

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const { userId, packetId, planKey } = session.metadata || {}
        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string

        const status = planKey === 'lifetime' ? 'one_time_paid' : 'active'

        const { error: purchaseError } = await supabase
          .from('purchases')
          .upsert({
            user_id: userId,
            plan_id: planKey,
            status: status,
            stripe_customer_id: stripeCustomerId,
            stripe_subscription_id: stripeSubscriptionId,
            packet_id: packetId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id, plan_id' })

        if (purchaseError) throw purchaseError

        const { error: profileError } = await supabase
          .from('customer_billing_profiles')
          .upsert({
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (profileError) throw profileError

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const status = subscription.status === 'active' ? 'active' : 'inactive'
        
        const { error } = await supabase
          .from('purchases')
          .update({ status: status, updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)

        if (error) throw error
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        const { error } = await supabase
          .from('purchases')
          .update({ status: 'canceled', updated_at: new Date().toISOString() })
          .eq('stripe_subscription_id', subscription.id)

        if (error) throw error
        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})
