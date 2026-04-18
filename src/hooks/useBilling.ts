import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PRICING_PLANS, PlanId, FeatureTier, PlanCategory } from '../config/pricingConfig';
import { User } from '@supabase/supabase-js';

export const useBilling = (user: User | null) => {
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [isPaid, setIsPaid] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);
  const [featureTier, setFeatureTier] = useState<FeatureTier>('basic');
  const [planCategory, setPlanCategory] = useState<PlanCategory>('free');

  const fetchBillingStatus = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Admins always get full lifetime
      const profileRes = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRes.data?.role === 'admin') {
        setPlanId('full_single_lifetime');
        setIsPaid(true);
        setIsCouple(true);
        setIsLifetime(true);
        setFeatureTier('full');
        setPlanCategory('individual');
        setLoading(false);
        return;
      }

      const purchaseRes = await supabase
        .from('purchases')
        .select('status, billing_type, pricing_plan_id, pricing_plans(plan_key, feature_tier, plan_category)')
        .eq('user_id', user.id)
        .in('status', ['active', 'one_time_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const purchase = purchaseRes.data;
      if (purchase && !purchaseRes.error) {
        const planRow = (purchase as any).pricing_plans;
        const planKey = planRow?.plan_key as string | undefined;
        const matchedPlan = planKey ? PRICING_PLANS.find(p => p.id === planKey) : null;

        // Resolve tier from DB column first, fall back to config, fall back to 'full' for legacy paid plans
        const dbTier = planRow?.feature_tier as FeatureTier | undefined;
        const dbCat = planRow?.plan_category as PlanCategory | undefined;
        const resolvedTier: FeatureTier = dbTier ?? matchedPlan?.featureTier ?? 'full';
        const resolvedCat: PlanCategory = dbCat ?? matchedPlan?.planCategory ?? 'individual';

        if (matchedPlan) {
          setPlanId(matchedPlan.id);
          setIsPaid(matchedPlan.price > 0);
          setIsCouple(matchedPlan.canInvitePartner || resolvedCat === 'couple' || resolvedCat === 'family');
          setIsLifetime(matchedPlan.interval === 'one-time');
        } else {
          // Unknown plan_key — paid status from purchase
          setPlanId('full_single_lifetime');
          setIsPaid(true);
          setIsCouple(false);
          setIsLifetime(purchase.billing_type === 'one_time');
        }
        setFeatureTier(resolvedTier);
        setPlanCategory(resolvedCat);
      } else {
        setPlanId('free');
        setIsPaid(false);
        setIsCouple(false);
        setIsLifetime(false);
        setFeatureTier('basic');
        setPlanCategory('free');
      }
    } catch (err) {
      console.error('Error fetching billing status:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchBillingStatus();
    } else {
      setPlanId('free');
      setIsPaid(false);
      setIsCouple(false);
      setIsLifetime(false);
      setFeatureTier('basic');
      setPlanCategory('free');
      setLoading(false);
    }
  }, [user, fetchBillingStatus]);

  const currentPlan = PRICING_PLANS.find(p => p.id === planId) || PRICING_PLANS[0];

  return {
    loading,
    planKey: planId,
    planName: currentPlan.name,
    isPaid,
    isCouple,
    isLifetime,
    featureTier,
    planCategory,
    isFullFeature: featureTier === 'full',
    currentPlan,
    refreshBilling: fetchBillingStatus
  };
};
