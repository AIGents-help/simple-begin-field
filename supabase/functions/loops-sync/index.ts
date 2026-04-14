import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { syncLoopsContact, sendLoopsTransactional } from "../_shared/loops.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// ─── Loops Transactional IDs ───
// Create these templates in Loops dashboard and paste the IDs here
const TRANSACTIONAL_IDS = {
  welcome: 'YOUR_WELCOME_TRANSACTIONAL_ID',
  paymentFailedDay1: 'YOUR_PAYMENT_FAILED_DAY1_ID',
  paymentFailedDay4: 'YOUR_PAYMENT_FAILED_DAY4_ID',
  paymentFailedDay7: 'YOUR_PAYMENT_FAILED_DAY7_ID',
  subscriptionCanceled: 'YOUR_SUBSCRIPTION_CANCELED_ID',
  affiliateApproved: 'YOUR_AFFILIATE_APPROVED_ID',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { action, ...payload } = await req.json()

    switch (action) {
      // ─── Sync contact to Loops ───
      case 'sync_contact': {
        const { email, firstName, plan, createdAt, userId } = payload
        if (!email) throw new Error('email is required')
        const result = await syncLoopsContact({ email, firstName, plan, createdAt, userId })
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ─── Welcome email ───
      case 'welcome_email': {
        const { email, firstName } = payload
        if (!email) throw new Error('email is required')

        // Also sync/create the contact
        await syncLoopsContact({ email, firstName, plan: 'free', createdAt: new Date().toISOString(), userId: payload.userId })

        const result = await sendLoopsTransactional({
          transactionalId: TRANSACTIONAL_IDS.welcome,
          email,
          dataVariables: {
            firstName: firstName || 'there',
            appUrl: 'https://app.survivorpacket.com',
          },
        })
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ─── Payment failed emails (Day 1, 4, 7) ───
      case 'payment_failed': {
        const { email, firstName, day, billingUrl, downloadUrl } = payload
        if (!email) throw new Error('email is required')

        let transactionalId = TRANSACTIONAL_IDS.paymentFailedDay1
        if (day === 4) transactionalId = TRANSACTIONAL_IDS.paymentFailedDay4
        if (day === 7) transactionalId = TRANSACTIONAL_IDS.paymentFailedDay7

        // Update contact plan status
        await syncLoopsContact({ email, plan: 'payment_issue' })

        const result = await sendLoopsTransactional({
          transactionalId,
          email,
          dataVariables: {
            firstName: firstName || 'there',
            billingUrl: billingUrl || 'https://app.survivorpacket.com/pricing',
            downloadUrl: downloadUrl || 'https://app.survivorpacket.com/dashboard',
          },
        })
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ─── Subscription canceled ───
      case 'subscription_canceled': {
        const { email, firstName, downloadUrl } = payload
        if (!email) throw new Error('email is required')

        await syncLoopsContact({ email, plan: 'canceled' })

        const result = await sendLoopsTransactional({
          transactionalId: TRANSACTIONAL_IDS.subscriptionCanceled,
          email,
          dataVariables: {
            firstName: firstName || 'there',
            downloadUrl: downloadUrl || 'https://app.survivorpacket.com/dashboard',
          },
        })
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      // ─── Affiliate approved ───
      case 'affiliate_approved': {
        const { email, firstName, affiliateCode, dashboardUrl } = payload
        if (!email) throw new Error('email is required')

        await syncLoopsContact({ email, plan: 'affiliate' })

        const result = await sendLoopsTransactional({
          transactionalId: TRANSACTIONAL_IDS.affiliateApproved,
          email,
          dataVariables: {
            firstName: firstName || 'there',
            affiliateCode: affiliateCode || '',
            dashboardUrl: dashboardUrl || 'https://app.survivorpacket.com/affiliate',
            guidelinesUrl: 'https://app.survivorpacket.com/affiliate',
          },
        })
        return new Response(JSON.stringify(result), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
      }

      default:
        return new Response(JSON.stringify({ error: `Unknown action: ${action}` }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        })
    }
  } catch (error) {
    console.error('Loops sync error:', error.message)
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
