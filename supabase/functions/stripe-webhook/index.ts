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
        const meta = session.metadata || {}
        const type = meta.type || 'individual'
        const stripeCustomerId = session.customer as string
        const stripeSubscriptionId = session.subscription as string | null

        // Branch by metadata type
        if (type === 'gift') {
          // Activate the gift code
          const giftId = meta.gift_id
          if (giftId) {
            const { error } = await supabase
              .from('gift_codes')
              .update({
                status: 'active',
                stripe_payment_intent_id: session.payment_intent as string,
                paid_at: new Date().toISOString(),
              })
              .eq('id', giftId)
            if (error) console.error('gift activation error:', error)
          }
          break
        }

        if (type === 'corporate') {
          const adminUserId = meta.admin_user_id
          const seats = parseInt(meta.seats || '10', 10)
          const planKey = meta.plan_key
          const featureTier = meta.feature_tier || 'basic'
          const companyName = meta.company_name
          const billingEmail = meta.billing_email || null

          if (adminUserId && planKey && companyName) {
            const { error } = await supabase
              .from('corporate_accounts')
              .upsert({
                admin_user_id: adminUserId,
                company_name: companyName,
                billing_email: billingEmail,
                plan_key: planKey,
                feature_tier: featureTier,
                seat_limit: seats,
                stripe_payment_intent_id: session.payment_intent as string,
                total_paid: (session.amount_total ?? 0) / 100,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'admin_user_id' })
            if (error) console.error('corporate account error:', error)
          }
          break
        }

        if (type === 'family') {
          const ownerUserId = meta.owner_user_id || meta.userId
          const planKey = meta.plan_key || meta.planKey
          const featureTier = meta.feature_tier || 'basic'
          const seatLimit = parseInt(meta.seat_limit || '6', 10)

          if (ownerUserId && planKey) {
            const { error } = await supabase
              .from('family_plans')
              .upsert({
                owner_user_id: ownerUserId,
                plan_key: planKey,
                feature_tier: featureTier,
                seat_limit: seatLimit,
                stripe_payment_intent_id: session.payment_intent as string,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'owner_user_id' })
            if (error) console.error('family plan error:', error)
          }
          // Continue to also upsert purchase below for the owner
        }

        if (type === 'upgrade') {
          const userId = meta.userId || meta.user_id
          const targetPlanKey = meta.targetPlanKey || meta.target_plan_key
          if (userId && targetPlanKey) {
            const { error } = await supabase
              .from('purchases')
              .update({
                plan_id: targetPlanKey,
                status: 'one_time_paid',
                updated_at: new Date().toISOString(),
              })
              .eq('user_id', userId)
            if (error) console.error('upgrade error:', error)
            if (stripeCustomerId) {
              const { email, name } = await getCustomerEmail(stripeCustomerId)
              if (email) await syncLoopsContact({ email, firstName: name?.split(' ')[0], plan: targetPlanKey })
            }
          }
          break
        }

        // Default: individual / couple / family-owner purchase
        const { userId, packetId, planKey } = meta
        if (!userId || !planKey) break

        const status = planKey === 'lifetime' || meta.lifetime === '1' ? 'one_time_paid' : 'active'

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

        if (!customerId) break

        const { email, name } = await getCustomerEmail(customerId)
        if (!email) break

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
