import React, { useEffect, useState } from 'react';
import { X, Loader2, AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { plansAdminService, PlanRow } from '@/services/plansAdminService';
import { toast } from 'sonner';

interface AssignPlanModalProps {
  isOpen: boolean;
  onClose: () => void;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    role?: string | null;
    purchases?: any[];
  };
  onSuccess: (newPlan: { plan_key: string; plan_name: string; status: string }) => void;
}

type PlanKeyChoice = 'free' | 'individual' | 'couple' | 'lifetime' | 'comp' | 'comp_couple';

const PLAN_LABEL: Record<PlanKeyChoice, string> = {
  free: 'Free',
  individual: 'Individual',
  couple: 'Couple',
  lifetime: 'Lifetime (one-time)',
  comp: 'Complimentary Individual (no charge)',
  comp_couple: 'Complimentary Couple (no charge)',
};

export const AssignPlanModal: React.FC<AssignPlanModalProps> = ({
  isOpen,
  onClose,
  customer,
  onSuccess,
}) => {
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [choice, setChoice] = useState<PlanKeyChoice>('free');
  const [partnerEmail, setPartnerEmail] = useState('');
  const [compReason, setCompReason] = useState('');
  const [compExpiry, setCompExpiry] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [grantAdmin, setGrantAdmin] = useState(false);
  const [confirmAdmin, setConfirmAdmin] = useState(false);

  const currentPurchase = customer.purchases?.[0];
  const currentPlanName = currentPurchase?.pricing_plans?.name || 'Free';
  const hasStripeSub = Boolean(currentPurchase?.stripe_subscription_id);
  const isCurrentlyAdmin = customer.role === 'admin';

  useEffect(() => {
    if (!isOpen) return;
    setError(null);
    setChoice('free');
    setPartnerEmail('');
    setCompReason('');
    setCompExpiry('');
    setAdminNote('');
    setGrantAdmin(false);
    setConfirmAdmin(false);
    setLoadingPlans(true);
    plansAdminService
      .listPlans()
      .then((p) => setPlans(p))
      .catch((err) => setError(err.message || 'Failed to load plans'))
      .finally(() => setLoadingPlans(false));
  }, [isOpen]);

  if (!isOpen) return null;

  const findPlanByKey = (key: string): PlanRow | undefined =>
    plans.find((p) => p.plan_key === key);

  const handleAssign = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const { data: authData } = await supabase.auth.getUser();
      const adminId = authData.user?.id;
      const adminEmail = authData.user?.email || null;
      if (!adminId) throw new Error('Not authenticated as admin');

      // Resolve target plan
      let targetPlan: PlanRow | undefined;
      if (choice === 'comp') {
        // Comp Individual uses Individual plan as the underlying entitlement
        targetPlan = findPlanByKey('individual') || findPlanByKey('lifetime');
      } else if (choice === 'comp_couple') {
        // Comp Couple uses Couple plan as the underlying entitlement
        targetPlan = findPlanByKey('couple') || findPlanByKey('individual') || findPlanByKey('lifetime');
      } else {
        targetPlan = findPlanByKey(choice);
      }
      if (!targetPlan && choice !== 'free') {
        throw new Error(`No pricing plan configured for "${choice}". Add one in Plans first.`);
      }

      // Validation
      if (choice === 'couple' && !partnerEmail.trim()) {
        throw new Error('Partner email is required for Couple plan');
      }
      if ((choice === 'comp' || choice === 'comp_couple') && !compReason.trim()) {
        throw new Error('Reason is required for Complimentary plan');
      }
      if (grantAdmin && !confirmAdmin) {
        throw new Error('Please confirm Full Admin Rights grant by checking the confirmation box.');
      }

      // Snapshot previous plan for log
      const oldValue = {
        plan_key: currentPurchase?.pricing_plans?.plan_key || 'free',
        plan_name: currentPurchase?.pricing_plans?.name || 'Free',
        status: currentPurchase?.status || 'free',
      };

      let newStatus = 'active';
      let newValue: any = {};

      if (choice === 'free') {
        // Cancel any active purchase, do not insert a new one
        const { error: cancelErr } = await supabase
          .from('purchases')
          .update({ status: 'canceled' })
          .eq('user_id', customer.id)
          .in('status', ['active', 'one_time_paid', 'paused']);
        if (cancelErr) throw cancelErr;
        newStatus = 'free';
        newValue = { plan_key: 'free', plan_name: 'Free', status: 'free' };
      } else if (choice === 'comp' || choice === 'comp_couple') {
        await plansAdminService.grantComp({
          userId: customer.id,
          pricingPlanId: targetPlan!.id,
          expiresAt: compExpiry || null,
          grantedBy: adminId,
          note: [compReason.trim(), adminNote.trim()].filter(Boolean).join(' | ') || null,
        });
        newValue = {
          plan_key: targetPlan!.plan_key,
          plan_name: targetPlan!.name,
          status: 'active',
          is_comp: true,
          comp_tier: choice === 'comp_couple' ? 'couple' : 'individual',
          comp_expires_at: compExpiry || null,
        };
      } else {
        // individual, couple, lifetime — manual assignment, no Stripe
        // Cancel previous active
        const { error: cancelErr } = await supabase
          .from('purchases')
          .update({ status: 'canceled' })
          .eq('user_id', customer.id)
          .in('status', ['active', 'one_time_paid', 'paused']);
        if (cancelErr) throw cancelErr;

        const status = targetPlan!.billing_type === 'one_time' ? 'one_time_paid' : 'active';
        const insertPayload: any = {
          user_id: customer.id,
          pricing_plan_id: targetPlan!.id,
          status,
          billing_type: targetPlan!.billing_type,
          admin_note: adminNote.trim() || null,
        };
        const { error: insErr } = await supabase.from('purchases').insert(insertPayload);
        if (insErr) throw insErr;

        newStatus = status;
        newValue = {
          plan_key: targetPlan!.plan_key,
          plan_name: targetPlan!.name,
          status,
          partner_email: choice === 'couple' ? partnerEmail.trim() : undefined,
        };
      }

      // Log admin activity (skip if comp — grantComp already logs)
      if (choice !== 'comp' && choice !== 'comp_couple') {
        const { error: logErr } = await supabase.from('admin_activity_log').insert({
          admin_user_id: adminId,
          admin_email: adminEmail,
          target_user_id: customer.id,
          target_user_email: customer.email,
          action: 'assign_plan_manual',
          old_value: oldValue,
          new_value: newValue,
          note: adminNote.trim() || null,
        });
        if (logErr) console.warn('Activity log insert failed:', logErr.message);
      }

      // Optionally grant full admin role
      if (grantAdmin && !isCurrentlyAdmin) {
        const { error: roleErr } = await supabase
          .from('profiles')
          .update({ role: 'admin' })
          .eq('id', customer.id);
        if (roleErr) throw new Error(`Failed to grant admin role: ${roleErr.message}`);

        const { error: roleLogErr } = await supabase.from('admin_activity_log').insert({
          admin_user_id: adminId,
          admin_email: adminEmail,
          target_user_id: customer.id,
          target_user_email: customer.email,
          action: 'grant_admin_role',
          old_value: { role: customer.role || 'customer' },
          new_value: { role: 'admin' },
          note: adminNote.trim() || null,
        });
        if (roleLogErr) console.warn('Admin role log insert failed:', roleLogErr.message);
        toast.success('Full Admin Rights granted.');
      }

      const planKey = choice === 'free' ? 'free' : targetPlan!.plan_key;
      const planName = choice === 'free' ? 'Free' : targetPlan!.name;
      toast.success(`Plan assigned: ${planName} — ${new Date().toLocaleTimeString()}`);
      onSuccess({ plan_key: planKey, plan_name: planName, status: newStatus });

      if (hasStripeSub && choice !== 'comp' && choice !== 'comp_couple') {
        toast.warning(
          'This user may have an active Stripe subscription. Visit Billing to cancel it separately.',
          { duration: 8000 }
        );
      }

      onClose();
    } catch (err: any) {
      const msg = err?.message || 'Failed to assign plan';
      setError(msg);
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-stone-100 flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold text-stone-900">Assign Plan Manually</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {customer.full_name || 'Unnamed'} &middot; {customer.email}
            </p>
            <p className="text-[10px] text-stone-400 uppercase tracking-wider mt-1">
              Current plan: {currentPlanName}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-stone-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4 overflow-y-auto">
          {hasStripeSub && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                This user may have an active Stripe subscription. Manually assigning a plan will
                NOT cancel it. Visit Billing to cancel it separately.
              </p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
              Select Plan
            </label>
            <select
              value={choice}
              onChange={(e) => setChoice(e.target.value as PlanKeyChoice)}
              disabled={loadingPlans || submitting}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 disabled:opacity-50"
            >
              {(['free', 'individual', 'couple', 'lifetime', 'comp'] as PlanKeyChoice[]).map((k) => {
                const plan = findPlanByKey(k === 'comp' ? 'individual' : k);
                const price = plan && k !== 'free' && k !== 'comp'
                  ? ` ($${(plan.price_cents / 100).toFixed(0)}${
                      plan.billing_type === 'monthly'
                        ? '/mo'
                        : plan.billing_type === 'annual'
                        ? '/yr'
                        : ''
                    })`
                  : '';
                return (
                  <option key={k} value={k}>
                    {PLAN_LABEL[k]}
                    {price}
                  </option>
                );
              })}
            </select>
          </div>

          {choice === 'couple' && (
            <div>
              <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                Partner Email *
              </label>
              <input
                type="email"
                value={partnerEmail}
                onChange={(e) => setPartnerEmail(e.target.value)}
                placeholder="partner@example.com"
                disabled={submitting}
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
              />
              <p className="text-[10px] text-stone-400 mt-1">
                Recorded on the assignment. You can send the invite separately.
              </p>
            </div>
          )}

          {choice === 'comp' && (
            <>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Reason *
                </label>
                <input
                  type="text"
                  value={compReason}
                  onChange={(e) => setCompReason(e.target.value)}
                  placeholder="e.g. Beta tester, support comp, partner"
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
                  Expiry Date (optional)
                </label>
                <input
                  type="date"
                  value={compExpiry}
                  onChange={(e) => setCompExpiry(e.target.value)}
                  disabled={submitting}
                  className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10"
                />
              </div>
            </>
          )}

          {choice === 'lifetime' && (
            <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-800">
                Lifetime grants permanent access. Reverting requires manual intervention.
              </p>
            </div>
          )}

          <div>
            <label className="text-[10px] font-semibold text-stone-500 uppercase tracking-wider block mb-1.5">
              Internal Note (optional, admin only)
            </label>
            <textarea
              value={adminNote}
              onChange={(e) => setAdminNote(e.target.value)}
              rows={2}
              placeholder="Why are you making this change?"
              disabled={submitting}
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 resize-none"
            />
          </div>

          {error && (
            <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-lg">
              <AlertTriangle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-rose-800 break-words">{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-stone-100 flex items-center justify-end gap-2 bg-stone-50/50">
          <button
            onClick={onClose}
            disabled={submitting}
            className="px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleAssign}
            disabled={submitting || loadingPlans}
            className="px-4 py-2 bg-stone-900 text-white text-sm font-medium rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
          >
            {submitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Assigning...
              </>
            ) : (
              <>
                <CheckCircle2 className="w-4 h-4" />
                Assign Plan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
