import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import Stripe from "https://esm.sh/stripe?target=deno"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

type Action = 'pause' | 'resume' | 'change_plan' | 'cancel'

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      throw new Error('Unauthorized: Missing or invalid Authorization header')
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY') ?? ''
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    })

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await userClient.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      throw new Error('Unauthorized: Invalid token')
    }

    const adminId = claimsData.claims.sub as string
    const adminEmail = (claimsData.claims as any).email as string | undefined

    // Verify admin
    const admin = createClient(supabaseUrl, serviceKey)
    const { data: adminProfile, error: adminErr } = await admin
      .from('profiles')
      .select('role, email')
      .eq('id', adminId)
      .maybeSingle()
    if (adminErr) throw adminErr
    if (adminProfile?.role !== 'admin') {
      throw new Error('Forbidden: admin role required')
    }
    const resolvedAdminEmail = adminEmail || adminProfile.email || null

    const body = await req.json()
    const action = body.action as Action
    const purchaseId = body.purchaseId as string | undefined
    const userId = body.userId as string | undefined
    const note = (body.note as string | undefined) || null
    const resumesAt = (body.resumesAt as string | undefined) || null
    const newPricingPlanId = body.newPricingPlanId as string | undefined

    if (!action) throw new Error('action is required')

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY')
    if (!stripeKey) throw new Error('STRIPE_SECRET_KEY is not set')
    const stripe = new Stripe(stripeKey, {
      apiVersion: '2022-11-15',
      httpClient: Stripe.createFetchHttpClient(),
    })

    // Load purchase + target user
    let purchase: any = null
    if (purchaseId) {
      const res = await admin
        .from('purchases')
        .select('*, pricing_plans(plan_key, name, household_mode, billing_type, price_cents)')
        .eq('id', purchaseId)
        .maybeSingle()
      if (res.error) throw res.error
      purchase = res.data
    }

    const targetUserId = purchase?.user_id || userId
    if (!targetUserId) throw new Error('Target user could not be determined')

    const { data: targetProfile } = await admin
      .from('profiles')
      .select('email, full_name')
      .eq('id', targetUserId)
      .maybeSingle()
    const targetEmail = targetProfile?.email || null

    const logAction = async (actionName: string, oldValue: any, newValue: any, noteText: string | null) => {
      await admin.from('admin_activity_log').insert({
        admin_user_id: adminId,
        admin_email: resolvedAdminEmail,
        target_user_id: targetUserId,
        target_user_email: targetEmail,
        action: actionName,
        old_value: oldValue,
        new_value: newValue,
        note: noteText,
      })
    }

    let result: any = {}

    if (action === 'pause') {
      if (!purchase) throw new Error('Purchase record required to pause')
      const subId = purchase.stripe_subscription_id

      // Stripe pause if subscription exists
      if (subId) {
        try {
          await stripe.subscriptions.update(subId, {
            pause_collection: {
              behavior: 'void',
              ...(resumesAt ? { resumes_at: Math.floor(new Date(resumesAt).getTime() / 1000) } : {}),
            },
          })
        } catch (stripeErr: any) {
          throw new Error(`Stripe pause failed: ${stripeErr.message}`)
        }
      }

      const updates: any = {
        paused_at: new Date().toISOString(),
        pause_resumes_at: resumesAt,
        pause_note: note,
        paused_by: adminId,
        status: 'paused',
      }
      const { error } = await admin.from('purchases').update(updates).eq('id', purchase.id)
      if (error) throw error

      await logAction(
        'pause',
        { status: purchase.status, stripe_subscription_id: subId },
        { status: 'paused', pause_resumes_at: resumesAt, has_stripe: !!subId },
        note,
      )
      result = { ok: true, paused: true, soft_pause: !subId }
    } else if (action === 'resume') {
      if (!purchase) throw new Error('Purchase record required to resume')
      const subId = purchase.stripe_subscription_id

      if (subId) {
        try {
          await stripe.subscriptions.update(subId, { pause_collection: '' as any })
        } catch (stripeErr: any) {
          throw new Error(`Stripe resume failed: ${stripeErr.message}`)
        }
      }

      const updates: any = {
        paused_at: null,
        pause_resumes_at: null,
        pause_note: null,
        paused_by: null,
        status: 'active',
      }
      const { error } = await admin.from('purchases').update(updates).eq('id', purchase.id)
      if (error) throw error

      await logAction(
        'resume',
        { status: purchase.status, paused_at: purchase.paused_at },
        { status: 'active' },
        note,
      )
      result = { ok: true, resumed: true, soft_pause: !subId }
    } else if (action === 'change_plan') {
      if (!newPricingPlanId) throw new Error('newPricingPlanId required')
      const { data: newPlan, error: planErr } = await admin
        .from('pricing_plans')
        .select('id, plan_key, name, price_cents, billing_type')
        .eq('id', newPricingPlanId)
        .maybeSingle()
      if (planErr) throw planErr
      if (!newPlan) throw new Error('New plan not found')

      // Cancel any existing active purchase for this user that's not the current one
      await admin
        .from('purchases')
        .update({ status: 'canceled' })
        .eq('user_id', targetUserId)
        .in('status', ['active', 'one_time_paid', 'paused'])

      const insertRow: any = {
        user_id: targetUserId,
        pricing_plan_id: newPricingPlanId,
        status: newPlan.plan_key === 'lifetime' ? 'one_time_paid' : 'active',
        billing_type: newPlan.billing_type,
        admin_note: note,
      }
      const { data: inserted, error: insErr } = await admin
        .from('purchases')
        .insert(insertRow)
        .select()
        .single()
      if (insErr) throw insErr

      await logAction(
        'change_plan',
        {
          plan_key: purchase?.pricing_plans?.plan_key || 'free',
          plan_name: purchase?.pricing_plans?.name || 'Free',
        },
        { plan_key: newPlan.plan_key, plan_name: newPlan.name },
        note,
      )
      result = { ok: true, purchase: inserted }
    } else if (action === 'cancel') {
      if (!purchase) throw new Error('Purchase record required to cancel')
      const subId = purchase.stripe_subscription_id
      if (subId) {
        try {
          await stripe.subscriptions.cancel(subId)
        } catch (stripeErr: any) {
          // Continue even if Stripe call fails - log and proceed
          console.warn('Stripe cancel warning:', stripeErr.message)
        }
      }
      const { error } = await admin
        .from('purchases')
        .update({ status: 'canceled' })
        .eq('id', purchase.id)
      if (error) throw error

      await logAction('cancel', { status: purchase.status }, { status: 'canceled' }, note)
      result = { ok: true, canceled: true }
    } else {
      throw new Error(`Unknown action: ${action}`)
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error: any) {
    console.error('[admin-manage-subscription] error:', error?.message)
    return new Response(JSON.stringify({ error: error?.message || 'Unknown error' }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
