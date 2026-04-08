import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { PRICING_PLANS, PlanId } from '../config/pricingConfig';
import { User } from '@supabase/supabase-js';

export const useBilling = (user: User | null) => {
  const [loading, setLoading] = useState(true);
  const [planId, setPlanId] = useState<PlanId>('free');
  const [isPaid, setIsPaid] = useState(false);
  const [isCouple, setIsCouple] = useState(false);
  const [isLifetime, setIsLifetime] = useState(false);

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
  }, [user]);

  const fetchBillingStatus = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('purchases')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['active', 'one_time_paid'])
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (data && !error) {
        const plan = PRICING_PLANS.find(p => p.id === data.plan_id);
        if (plan) {
          setPlanId(plan.id);
          setIsPaid(plan.price > 0);
          setIsCouple(plan.canInvitePartner);
          setIsLifetime(plan.interval === 'one-time');
        }
      } else {
        // Default to free
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
  };

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
