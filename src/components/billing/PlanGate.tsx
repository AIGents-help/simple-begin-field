import React from 'react';
import { Lock, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SectionId } from '../../config/types';

interface PlanGateProps {
  children: React.ReactNode;
  feature?: 'upload' | 'pdf' | 'partner' | SectionId;
  fallback?: React.ReactNode;
}

export const PlanGate = ({ children, feature, fallback }: PlanGateProps) => {
  const { currentPlan, setView, user, currentPacket } = useAppContext();

  const hasAccess = () => {
    // If user is the owner of the packet, they have full access regardless of plan
    if (user && currentPacket && currentPacket.created_by === user.id) {
      return true;
    }

    if (!feature) return true;
    
    // Temporarily removed file upload gate
    if (feature === 'upload') return true;
    if (feature === 'pdf') return currentPlan.canExportPDF;
    if (feature === 'partner') return currentPlan.canInvitePartner;
    
    // Referral code entry is always free
    if (feature === 'affiliate') return true;
    
    // Check section access
    if (currentPlan.allowedSections === 'all') return true;
    return currentPlan.allowedSections.includes(feature as SectionId);
  };

  if (hasAccess()) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  return (
    <div className="p-8 bg-stone-50 rounded-3xl border border-stone-200 text-center flex flex-col items-center gap-4">
      <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-stone-400 shadow-sm">
        <Lock size={24} />
      </div>
      <div>
        <h3 className="text-lg font-bold text-navy-muted mb-2">Upgrade Required</h3>
        <p className="text-sm text-stone-500 max-w-xs mx-auto">
          This feature is only available on our premium plans. Upgrade to unlock full access.
        </p>
      </div>
      <button 
        onClick={() => setView('pricing' as any)}
        className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-navy-muted/90 transition-all shadow-lg shadow-navy-muted/20"
      >
        View Pricing
        <ArrowRight size={16} />
      </button>
    </div>
  );
};
