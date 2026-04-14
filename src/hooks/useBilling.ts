import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { PRICING_PLANS, PlanId } from '../config/pricingConfig';
import { User } from '@supabase/supabase-js';

export const useBilling = (user: User | null) => {
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [isPaid, setIsPaid] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);

  const fetchBillingStatus = useCallback(async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Check profile role first — admins skip purchase lookup entirely
      const profileRes = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle();

      if (profileRes.data?.role === 'admin') {
        setPlanId('lifetime');
        setIsPaid(true);
        setIsCouple(true);
        setIsLifetime(true);
        setLoading(false);
        return;
      }

      // Non-admin: check purchases
      const purchaseRes = await supabase
        .from('purchases')
        .select('status, billing_type, pricing_plan_id, pricing_plans(plan_key)')
        .eq('user_id', user.id)
        .in('status', ['active', 'one_time_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      const purchase = purchaseRes.data;
      if (purchase && !purchaseRes.error) {
        const planKey = (purchase as any).pricing_plans?.plan_key as string | undefined;
        const matchedPlan = planKey
          ? PRICING_PLANS.find(p => p.id === planKey)
          : null;

        if (matchedPlan) {
          setPlanId(matchedPlan.id);
          setIsPaid(matchedPlan.price > 0);
          setIsCouple(matchedPlan.canInvitePartner);
          setIsLifetime(matchedPlan.interval === 'one-time');
        } else {
          setPlanId('individual_monthly');
          setIsPaid(true);
          setIsCouple(false);
          setIsLifetime(purchase.billing_type === 'one_time');
        }
      } else {
        setPlanId('free');
        setIsPaid(false);
        setIsCouple(false);
        setIsLifetime(false);
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
    currentPlan,
    refreshBilling: fetchBillingStatus
  };
};
