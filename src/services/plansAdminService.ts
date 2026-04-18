import { supabase } from '@/integrations/supabase/client';

export interface PlanPurchase {
  id: string;
  user_id: string | null;
  pricing_plan_id: string | null;
  status: string | null;
  billing_type: string | null;
  current_period_end: string | null;
  is_comp: boolean;
  comp_expires_at: string | null;
  admin_note: string | null;
  created_at: string | null;
  pricing_plans?: {
    id: string;
    name: string;
    plan_key: string;
    price_cents: number;
    billing_type: string | null;
    household_mode: string | null;
  } | null;
  profiles?: {
    id: string;
    full_name: string | null;
    email: string | null;
  } | null;
}

export interface PlanRow {
  id: string;
  plan_key: string;
  name: string;
  price_cents: number;
  billing_type: string | null;
  household_mode: string | null;
}

export interface SubscriberRow {
  user_id: string;
  full_name: string | null;
  email: string | null;
  plan_key: string;
  plan_name: string;
  status: string;
  is_comp: boolean;
  comp_expires_at: string | null;
  current_period_end: string | null;
  start_date: string | null;
  purchase_id: string | null;
  admin_note: string | null;
  pricing_plan_id: string | null;
  billing_type: string | null;
  household_mode: string | null;
  stripe_subscription_id: string | null;
  paused_at: string | null;
  pause_resumes_at: string | null;
  pause_note: string | null;
}

export const plansAdminService = {
  async listPlans(): Promise<PlanRow[]> {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('id, plan_key, name, price_cents, billing_type, household_mode')
      .eq('is_active', true)
      .order('price_cents', { ascending: true });
    if (error) throw error;
    return (data || []) as PlanRow[];
  },

  async listSubscribers(): Promise<SubscriberRow[]> {
    // Pull all profiles
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, full_name, email, created_at')
      .order('created_at', { ascending: false });
    if (pErr) throw pErr;

    // Pull all purchases joined with plan
    const { data: purchases, error: prErr } = await supabase
      .from('purchases')
      .select(`
        id, user_id, pricing_plan_id, status, billing_type, current_period_end,
        is_comp, comp_expires_at, admin_note, created_at,
        pricing_plans ( id, plan_key, name, price_cents, billing_type, household_mode )
      `)
      .order('created_at', { ascending: false });
    if (prErr) throw prErr;

    const latestByUser = new Map<string, any>();
    for (const p of purchases || []) {
      if (!p.user_id) continue;
      if (!latestByUser.has(p.user_id)) latestByUser.set(p.user_id, p);
    }

    return (profiles || []).map((profile: any) => {
      const purchase = latestByUser.get(profile.id);
      const plan = purchase?.pricing_plans;
      return {
        user_id: profile.id,
        full_name: profile.full_name,
        email: profile.email,
        plan_key: plan?.plan_key || 'free',
        plan_name: plan?.name || 'Free',
        status: purchase?.status || 'free',
        is_comp: Boolean(purchase?.is_comp),
        comp_expires_at: purchase?.comp_expires_at || null,
        current_period_end: purchase?.current_period_end || null,
        start_date: purchase?.created_at || profile.created_at,
        purchase_id: purchase?.id || null,
        admin_note: purchase?.admin_note || null,
        pricing_plan_id: purchase?.pricing_plan_id || null,
      } as SubscriberRow;
    });
  },

  async getOverview() {
    const subs = await this.listSubscribers();
    const plans = await this.listPlans();

    const planMap = new Map<string, PlanRow>(plans.map((p) => [p.plan_key, p]));

    const buckets = {
      free: { count: 0, revenue: 0 },
      individual: { count: 0, mrr: 0 },
      couple: { count: 0, mrr: 0 },
      lifetime: { count: 0, revenue: 0 },
    };

    for (const s of subs) {
      const plan = planMap.get(s.plan_key);
      const isActive = s.status === 'active' || s.status === 'one_time_paid';

      if (s.plan_key === 'free' || !plan) {
        buckets.free.count += 1;
        continue;
      }

      if (plan.plan_key === 'lifetime') {
        if (isActive) {
          buckets.lifetime.count += 1;
          if (!s.is_comp) buckets.lifetime.revenue += plan.price_cents;
        }
        continue;
      }

      const isCouple = plan.household_mode === 'couple';
      const target = isCouple ? buckets.couple : buckets.individual;

      if (isActive) {
        target.count += 1;
        if (!s.is_comp) {
          // Normalize to monthly recurring
          const monthly =
            plan.billing_type === 'annual' ? plan.price_cents / 12 : plan.price_cents;
          target.mrr += monthly;
        }
      }
    }

    return buckets;
  },

  async grantComp(args: {
    userId: string;
    pricingPlanId: string;
    expiresAt: string | null;
    grantedBy: string;
    note?: string;
  }) {
    // Cancel any existing active purchase for this user
    await supabase
      .from('purchases')
      .update({ status: 'canceled' })
      .eq('user_id', args.userId)
      .in('status', ['active', 'one_time_paid']);

    const { data, error } = await supabase
      .from('purchases')
      .insert({
        user_id: args.userId,
        pricing_plan_id: args.pricingPlanId,
        status: 'active',
        is_comp: true,
        comp_expires_at: args.expiresAt,
        comp_granted_by: args.grantedBy,
        admin_note: args.note || null,
      })
      .select()
      .single();
    if (error) throw error;
    return data;
  },

  async grantCompByEmail(args: {
    email: string;
    pricingPlanId: string;
    expiresAt: string | null;
    grantedBy: string;
    note?: string;
  }) {
    const { data: profile, error: pErr } = await supabase
      .from('profiles')
      .select('id')
      .ilike('email', args.email.trim())
      .maybeSingle();
    if (pErr) throw pErr;
    if (!profile) throw new Error(`No user found with email ${args.email}`);
    return this.grantComp({ ...args, userId: profile.id });
  },

  async changePlan(purchaseId: string | null, userId: string, pricingPlanId: string) {
    if (purchaseId) {
      const { error } = await supabase
        .from('purchases')
        .update({ pricing_plan_id: pricingPlanId, status: 'active' })
        .eq('id', purchaseId);
      if (error) throw error;
      return;
    }
    const { error } = await supabase
      .from('purchases')
      .insert({
        user_id: userId,
        pricing_plan_id: pricingPlanId,
        status: 'active',
        is_comp: false,
      });
    if (error) throw error;
  },

  async cancelSubscription(purchaseId: string) {
    const { error } = await supabase
      .from('purchases')
      .update({ status: 'canceled' })
      .eq('id', purchaseId);
    if (error) throw error;
  },

  async updateNote(purchaseId: string | null, userId: string, note: string) {
    if (purchaseId) {
      const { error } = await supabase
        .from('purchases')
        .update({ admin_note: note })
        .eq('id', purchaseId);
      if (error) throw error;
      return;
    }
    // Create a placeholder free purchase to hold the note
    const { data: freePlan } = await supabase
      .from('pricing_plans')
      .select('id')
      .eq('plan_key', 'free')
      .maybeSingle();
    const { error } = await supabase.from('purchases').insert({
      user_id: userId,
      pricing_plan_id: freePlan?.id || null,
      status: 'free',
      admin_note: note,
    });
    if (error) throw error;
  },
};
