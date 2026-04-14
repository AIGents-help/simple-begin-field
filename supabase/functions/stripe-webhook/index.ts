import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { syncLoopsContact, sendLoopsTransactional } from "../_shared/loops.ts"

const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY') || '', {
  apiVersion: '2022-11-15',
  httpClient: Stripe.createFetchHttpClient(),
})

const supabaseUrl = Deno.env.get('SUPABASE_URL') || ''
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || ''
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Loops transactional IDs — must match loops-sync/index.ts
const TRANSACTIONAL_IDS = {
  paymentFailedDay1: 'YOUR_PAYMENT_FAILED_DAY1_ID',
  paymentFailedDay4: 'YOUR_PAYMENT_FAILED_DAY4_ID',
  paymentFailedDay7: 'YOUR_PAYMENT_FAILED_DAY7_ID',
  subscriptionCanceled: 'YOUR_SUBSCRIPTION_CANCELED_ID',
}

async function getCustomerEmail(customerId: string): Promise<{ email: string; name: string }> {
  try {
    const customer = await stripe.customers.retrieve(customerId)
    if (customer.deleted) return { email: '', name: '' }
    return {
      email: (customer as Stripe.Customer).email || '',
      name: (customer as Stripe.Customer).name || '',
    }
  } catch {
    return { email: '', name: '' }
  }
}

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

        // 1. Update or Insert Purchase
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

        // 2. Update Billing Profile
        const { error: profileError } = await supabase
          .from('customer_billing_profiles')
          .upsert({
            user_id: userId,
            stripe_customer_id: stripeCustomerId,
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' })

        if (profileError) throw profileError

        // 3. Sync plan to Loops
        if (stripeCustomerId) {
          const { email, name } = await getCustomerEmail(stripeCustomerId)
          if (email) {
            await syncLoopsContact({ email, firstName: name?.split(' ')[0], plan: planKey || 'paid' })
          }
        }

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        const customerId = invoice.customer as string
        const subscriptionId = invoice.subscription as string

        if (!customerId) break

        const { email, name } = await getCustomerEmail(customerId)
        if (!email) break

        // Determine which day of failure this is based on attempt count
        const attemptCount = invoice.attempt_count || 1
        let day = 1
        let transactionalId = TRANSACTIONAL_IDS.paymentFailedDay1
        if (attemptCount === 2) {
          day = 4
          transactionalId = TRANSACTIONAL_IDS.paymentFailedDay4
        } else if (attemptCount >= 3) {
          day = 7
          transactionalId = TRANSACTIONAL_IDS.paymentFailedDay7
        }

        console.log(`Payment failed for ${email}, attempt ${attemptCount} (day ${day})`)

        await sendLoopsTransactional({
          transactionalId,
          email,
          dataVariables: {
            firstName: name?.split(' ')[0] || 'there',
            billingUrl: 'https://app.survivorpacket.com/pricing',
            downloadUrl: 'https://app.survivorpacket.com/dashboard',
          },
        })

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

        // Send cancellation email via Loops
        const customerId = subscription.customer as string
        if (customerId) {
          const { email, name } = await getCustomerEmail(customerId)
          if (email) {
            await sendLoopsTransactional({
              transactionalId: TRANSACTIONAL_IDS.subscriptionCanceled,
              email,
              dataVariables: {
                firstName: name?.split(' ')[0] || 'there',
                downloadUrl: 'https://app.survivorpacket.com/dashboard',
              },
            })
            await syncLoopsContact({ email, plan: 'canceled' })
          }
        }

        break
      }
    }

    return new Response(JSON.stringify({ received: true }), { status: 200 })
  } catch (error) {
    console.error(`Webhook Error: ${error.message}`)
    return new Response(`Webhook Error: ${error.message}`, { status: 400 })
  }
})
