import React from 'react';
import { Lock, ArrowRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { SectionId } from '../../config/types';
import { FullFeatureKey, PRICING_PLANS } from '../../config/pricingConfig';

type GateFeature = 'upload' | 'pdf' | 'partner' | SectionId | FullFeatureKey;

interface PlanGateProps {
  children: React.ReactNode;
  feature?: GateFeature;
  /** Force a Full-Feature requirement even if the section is otherwise allowed. */
  requireFullFeature?: boolean;
  fallback?: React.ReactNode;
  /** Friendly text that appears in the upgrade prompt. */
  benefitText?: string;
}

const FULL_FEATURE_KEYS: FullFeatureKey[] = [
  'trusted_release',
  'inactivity_checkin',
  'health_score',
  'attorney_pdf',
  'legal_templates',
  'estate_summary',
  'haven_unlimited',
  'emergency_full',
  'memories_media',
  'couple_collab',
];

export const PlanGate = ({ children, feature, requireFullFeature, fallback, benefitText }: PlanGateProps) => {
  const { currentPlan, user, currentPacket, featureTier, planCategory } = useAppContext() as any;
  const navigate = useNavigate();

  const isFullFeatureFlag = feature && FULL_FEATURE_KEYS.includes(feature as FullFeatureKey);
  const needsFull = requireFullFeature || isFullFeatureFlag;

  const hasAccess = () => {
    // Owner of the packet always has access (legacy behavior)
    if (user && currentPacket && currentPacket.created_by === user.id && !needsFull) {
      return true;
    }

    if (needsFull) {
      return featureTier === 'full';
    }

    if (!feature) return true;
    if (feature === 'upload') return true; // upload available on all paid tiers
    if (feature === 'pdf') return currentPlan.canExportPDF;
    if (feature === 'partner') return currentPlan.canInvitePartner;

    if (currentPlan.allowedSections === 'all') return true;
    return currentPlan.allowedSections.includes(feature as SectionId);
  };

  if (hasAccess()) return <>{children}</>;
  if (fallback) return <>{fallback}</>;

  // Find the suggested upgrade target for the current plan/category
  const upgradeTarget =
    PRICING_PLANS.find(
      (p) =>
        p.featureTier === 'full' &&
        p.planCategory === (planCategory === 'free' ? 'individual' : planCategory),
    ) || PRICING_PLANS.find((p) => p.id === 'full_single_lifetime');

  const showFullPrompt = needsFull;

  return (
    <div className="p-8 bg-stone-50 rounded-3xl border border-stone-200 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-400 shadow-sm">
        {showFullPrompt ? <Sparkles size={24} className="text-amber-500" /> : <Lock size={24} />}
      </div>
      <div>
        <h3 className="text-lg font-bold text-navy-muted mb-2">
          {showFullPrompt ? 'Full Feature Required' : 'Upgrade Required'}
        </h3>
        <p className="text-sm text-stone-500 max-w-xs mx-auto">
          {benefitText ||
            (showFullPrompt
              ? 'This feature is part of the Full Feature plan. Upgrade once for lifetime access.'
              : 'This feature is available on a paid plan. Upgrade to unlock full access.')}
        </p>
      </div>
      <button
        onClick={() => navigate('/pricing')}
        className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-navy-muted/90 transition-all shadow-lg shadow-navy-muted/20"
      >
        {upgradeTarget && featureTier === 'basic'
          ? `Upgrade — $${upgradeTarget.price}`
          : 'View Pricing'}
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
