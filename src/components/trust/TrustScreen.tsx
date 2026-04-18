import React from 'react';
import { Shield, Lock, EyeOff, AlertCircle, CheckCircle2, Info, UserCheck, ArrowLeft } from 'lucide-react';
import { TrustInfoCard, DataUsageSummaryCard } from './TrustComponents';
import { TrustedContactsManager } from './TrustedContactsManager';
import { TrustedContactPortal } from './TrustedContactPortal';

interface TrustScreenProps {
  onBack?: () => void;
}

export const TrustScreen: React.FC<TrustScreenProps> = ({ onBack }) => {
  return (
    <div className="p-6 pb-32">
      {onBack && (
        <button
          onClick={onBack}
          className="mb-4 flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Profile
        </button>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-muted">Trust & Access</h1>
        <p className="text-sm text-stone-500 mt-1">Manage who can access your Survivor Packet</p>
      </div>

      {/* Phase 1 — Trusted Contact Access Portal */}
      <TrustedContactPortal />

      <div className="my-10 border-t border-stone-200" />

      {/* Legacy Trusted Contacts Manager — kept for existing data */}
      <TrustedContactsManager />

      {/* Trust info cards below */}
      <div className="mt-12">
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">How Your Data Is Protected</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <TrustInfoCard
            title="How Your Data Is Stored"
            description="Your information is stored securely in the cloud. Access is tied to your account, and files are not public."
            icon={<Shield className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="How Access Works"
            description="Only you (and your partner if invited) can access your packet. Trusted contacts require explicit access grants."
            icon={<Lock className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="Private Items"
            description="'Only Me' items are visible only to you. 'Me + Partner' items are shared. Some items can be restricted."
            icon={<EyeOff className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="User Responsibility"
            description="Keep login credentials secure, verify information accuracy, and keep documents up to date."
            icon={<UserCheck className="w-6 h-6" />}
          />
        </div>
      </div>

      <div className="mt-8">
        <DataUsageSummaryCard />
      </div>
    </div>
  );
};
