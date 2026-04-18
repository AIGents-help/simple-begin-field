import React, { useEffect, useState } from 'react';
import { PacketHealthScore } from './PacketHealthScore';
import { CriticalGapsCard } from './CriticalGapsCard';
import { ScoreHistorySparkline } from './ScoreHistorySparkline';
import { CheckInBanner } from '../checkin/CheckInBanner';
import { UpcomingExpirationsCard } from './UpcomingExpirationsCard';
import { 
  CheckCircle2, 
  Clock, 
  Plus, 
  Lock,
  Loader2,
  ChevronRight,
  FileText,
  ShieldCheck
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { DownloadPacketButton } from '../download/DownloadPacketButton';
import { usePacketCompletion } from '../../hooks/usePacketCompletion';
import { healthScoreService, HealthScore } from '../../services/healthScoreService';
import { EstateSummaryCard } from '../estate/EstateSummaryCard';
import { PartnerStatusCard } from '../couple/PartnerStatusCard';
import { AnnualReviewBanner } from '../couple/AnnualReviewBanner';
import { BeneficiaryAlignmentCard } from '../couple/BeneficiaryAlignmentCard';
import { DocumentGapsCard } from '../couple/DocumentGapsCard';
import { CombinedFamilyTreeCard } from '../couple/CombinedFamilyTreeCard';
import { CoupleActivityFeed } from '../couple/CoupleActivityFeed';
import { FriendlyCompetitionBadge } from '../couple/FriendlyCompetitionBadge';
import { getCustomSectionIcon } from '../../config/customSectionIcons';
import { CustomSectionModal } from '../sections/CustomSectionModal';

export const DashboardScreen = () => {
  const {
    setView,
    setTab,
    currentPacket,
    userDisplayName,
    completionVersion,
    customSections,
    refreshCustomSections,
    setActiveCustomSection,
  } = useAppContext();
  const [showCreateCustom, setShowCreateCustom] = useState(false);

  // SINGLE SOURCE OF TRUTH for completion (header badge, progress bar,
  // ring, AND each folder card all read from this hook).
  const {
    loading,
    overallPercent,
    sectionStatus,
  } = usePacketCompletion(currentPacket?.id);

  // Health score (for per-section chips)
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  useEffect(() => {
    if (!currentPacket?.id) return;
    let cancelled = false;
    healthScoreService
      .getCurrent(currentPacket.id)
      .then((s) => !cancelled && setHealthScore(s))
      .catch((err) => console.error('[DashboardScreen] health score load failed', err));
    return () => { cancelled = true; };
  }, [currentPacket?.id, completionVersion]);

  const getSectionStat = (sectionId: string) => {
    const s = sectionStatus[sectionId];
    const count = s?.count ?? 0;
    const hasContent = s?.hasContent ?? false;
    const hs = healthScore?.section_scores?.[sectionId];
    return {
      status: hasContent ? 'in_progress' : 'empty',
      count,
      percentage: s?.percent ?? 0,
      healthScore: hs?.score ?? null,
      healthMax: hs?.max ?? null,
    };
  };

  const overallProgress = overallPercent;


  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case 'complete':
        return (
          <span className="px-2 py-0.5 bg-emerald-100/50 text-emerald-700 text-[9px] font-bold uppercase tracking-wider rounded border border-emerald-200/50">
            Complete
          </span>
        );
      case 'in_progress':
        return (
          <span className="px-2 py-0.5 bg-amber-100/50 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-200/50">
            In Progress
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-stone-200/50 text-stone-500 text-[9px] font-bold uppercase tracking-wider rounded border border-stone-300/50">
            Empty
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Securing your vault...</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-8 max-w-6xl mx-auto">
      {/* Check-In Banner */}
      <CheckInBanner />

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-serif font-bold text-navy-muted">Your Survivor Packet</h1>
            <span className="px-2 py-1 bg-navy-muted/5 text-navy-muted text-[10px] font-bold uppercase tracking-widest rounded-full border border-navy-muted/10">
              {overallProgress}% Complete
            </span>
          </div>
          <p className="text-stone-500 text-sm">Hello, {userDisplayName.split(' ')[0]}. Welcome to your secure document hub.</p>
        </div>
        <button 
          onClick={() => setView('sections')}
          className="flex items-center justify-center gap-2 px-6 py-3 bg-navy-muted text-white rounded-xl font-bold shadow-lg shadow-navy-muted/20 hover:bg-navy-muted/90 active:scale-95 transition-all"
        >
          <Plus size={18} />
          Add Document
        </button>
      </div>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="w-full h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <div 
            className="h-full bg-navy-muted transition-all duration-1000 ease-out" 
            style={{ width: `${overallProgress}%` }} 
          />
        </div>
      </div>

      {/* Annual review nudge (only when due) */}
      <AnnualReviewBanner />

      {/* Partner status (only renders when an active couple link exists) */}
      <PartnerStatusCard />

      {/* Friendly competition badge */}
      <FriendlyCompetitionBadge />

      {/* Packet Health Score */}
      {currentPacket && <PacketHealthScore packetId={currentPacket.id} />}

      {/* Beneficiary alignment + document gaps (couple-only, render conditionally) */}
      <BeneficiaryAlignmentCard />
      <DocumentGapsCard />
      <CombinedFamilyTreeCard />
      <CoupleActivityFeed />

      {/* Estate Value Summary Card */}
      {currentPacket && <EstateSummaryCard />}

      {/* Score History Sparkline */}
      {currentPacket && <ScoreHistorySparkline packetId={currentPacket.id} />}

      {/* Critical Gaps (only shown when score < 75) */}
      {currentPacket && <CriticalGapsCard packetId={currentPacket.id} />}

      {/* Upcoming Expirations */}
      <UpcomingExpirationsCard />

      {/* Section Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-10">
        {SECTIONS_CONFIG.map((section) => {
          const { status, count, percentage, healthScore: hsScore, healthMax } = getSectionStat(section.id);
          const Icon = section.icon;
          const isPrivate = section.id === 'private';
          const isComplete = status === 'complete';
          const isInProgress = status === 'in_progress';
          const isEmpty = status === 'empty';

          // Tab styling based on completion
          let tabStyle = "bg-[#E6D590] text-stone-600"; // Default manila-dark
          if (isComplete) {
            tabStyle = "bg-[#d1e7dd] text-emerald-700"; // Subtle green tint
          } else if (isInProgress) {
            tabStyle = "bg-[#fff3cd] text-amber-700"; // Subtle amber tint
          } else if (isEmpty) {
            tabStyle = "bg-stone-200 text-stone-500"; // Muted gray
          }

          return (
            <div key={section.id} className="relative pt-8 group">
              {/* Folder Tab */}
              <div 
                className={`absolute top-0 left-0 h-8 w-[45%] rounded-t-lg border-t border-x border-folder-edge flex items-center px-3 justify-between transition-colors duration-200 z-0 ${tabStyle}`}
              >
                <span className="text-[9px] font-bold uppercase tracking-wider truncate mr-1">
                  {section.label}
                </span>
                <div className="flex items-center gap-1 shrink-0">
                  {isPrivate ? (
                    <Lock size={10} />
                  ) : (
                    <span className="text-[9px] font-bold">{percentage}%</span>
                  )}
                  {isComplete && <CheckCircle2 size={10} />}
                </div>
              </div>

              {/* Folder Body */}
              <button
                onClick={() => { setView('sections'); setTab(section.id); }}
                className={`relative w-full text-left bg-[#F5F0E8] p-6 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-folder-edge shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-52 z-10`}
              >
                <div className="flex justify-between items-start">
                  <div className={`p-3 rounded-xl bg-white/60 text-navy-muted border border-folder-edge/20 shadow-inner`}>
                    <Icon size={24} />
                  </div>
                  <StatusBadge status={status} />
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg text-navy-muted leading-tight">{section.label}</h3>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-navy-muted transition-colors shrink-0" />
                  </div>
                  <p className="font-serif italic text-[12px] text-stone-500/80 leading-snug line-clamp-2">
                    {section.description}
                  </p>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5 text-stone-500 text-xs font-medium">
                      <FileText size={14} />
                      <span>{count} {count === 1 ? 'record' : 'records'}</span>
                    </div>
                    {hsScore !== null && healthMax !== null && healthMax > 0 && !isPrivate && (() => {
                      const pct = hsScore / healthMax;
                      const chipColor =
                        pct >= 0.75 ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : pct >= 0.4 ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-rose-50 text-rose-700 border-rose-200';
                      return (
                        <span
                          className={`px-2 py-0.5 text-[10px] font-bold rounded-full border ${chipColor}`}
                          title={`Section health: ${hsScore} of ${healthMax} points`}
                        >
                          {hsScore}/{healthMax} pts
                        </span>
                      );
                    })()}
                  </div>
                </div>
              </button>
            </div>
          );
        })}

        {/* Custom user-created folders */}
        {customSections.map((cs) => {
          const Icon = getCustomSectionIcon(cs.icon);
          return (
            <div key={cs.id} className="relative pt-8 group">
              <div className="absolute top-0 left-0 h-8 w-[45%] rounded-t-lg border-t border-x border-amber-300 flex items-center px-3 justify-between bg-amber-100 text-amber-800 z-0">
                <span className="text-[9px] font-bold uppercase tracking-wider truncate mr-1">{cs.name}</span>
                <span className="text-[8px] font-bold">CUSTOM</span>
              </div>
              <button
                onClick={() => { setActiveCustomSection(cs.id); setTab('custom'); setView('sections'); }}
                className="relative w-full text-left bg-amber-50/60 p-6 rounded-tr-2xl rounded-bl-2xl rounded-br-2xl border border-amber-200 shadow-sm group-hover:shadow-md group-hover:-translate-y-0.5 transition-all duration-200 flex flex-col justify-between h-52 z-10"
              >
                <div className="flex justify-between items-start">
                  <div className="p-3 rounded-xl bg-white/80 text-amber-800 border border-amber-200 shadow-inner">
                    <Icon size={24} />
                  </div>
                  <span className="px-2 py-0.5 bg-amber-200/70 text-amber-900 text-[9px] font-bold uppercase tracking-wider rounded border border-amber-300/60">
                    Custom
                  </span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className="font-serif font-bold text-lg text-navy-muted leading-tight">{cs.name}</h3>
                    <ChevronRight size={18} className="text-stone-400 group-hover:text-navy-muted transition-colors shrink-0" />
                  </div>
                  {cs.description && (
                    <p className="font-serif italic text-[12px] text-stone-500/80 leading-snug line-clamp-2">
                      {cs.description}
                    </p>
                  )}
                </div>
              </button>
            </div>
          );
        })}

        {/* Create custom section card */}
        {customSections.length < 3 ? (
          <div className="relative pt-8">
            <button
              onClick={() => setShowCreateCustom(true)}
              className="relative w-full text-left bg-amber-50/30 p-6 rounded-2xl border-2 border-dashed border-amber-300 hover:border-amber-400 hover:bg-amber-50/60 transition-all duration-200 flex flex-col justify-center items-center gap-3 h-60"
            >
              <div className="p-3 rounded-xl bg-amber-100 text-amber-700 border border-amber-200">
                <Plus size={28} />
              </div>
              <div className="text-center">
                <h3 className="font-serif font-bold text-lg text-navy-muted">Create Your Own Section</h3>
                <p className="text-[12px] text-stone-500 mt-1">
                  Add up to 3 personalized folders ({customSections.length}/3)
                </p>
              </div>
            </button>
          </div>
        ) : (
          <div className="relative pt-8">
            <div className="relative w-full bg-stone-50 p-6 rounded-2xl border border-stone-200 flex flex-col justify-center items-center gap-2 h-60 text-center">
              <div className="p-3 rounded-xl bg-stone-100 text-stone-400">
                <Plus size={28} />
              </div>
              <p className="text-sm font-bold text-stone-500">Custom sections (3/3)</p>
              <p className="text-[11px] text-stone-400">You've reached the maximum.</p>
            </div>
          </div>
        )}
      </div>

      <CustomSectionModal
        isOpen={showCreateCustom}
        onClose={() => setShowCreateCustom(false)}
        onSaved={(s) => {
          void refreshCustomSections();
          setActiveCustomSection(s.id);
          setTab('custom');
          setView('sections');
        }}
      />
      {/* Download My Packet Banner */}
      <div className="bg-gradient-to-br from-teal-50 to-emerald-50/60 border border-teal-200/60 rounded-2xl p-6 flex flex-col sm:flex-row items-start sm:items-center gap-5">
        <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center flex-shrink-0">
          <ShieldCheck size={24} className="text-teal-700" />
        </div>
        <div className="flex-1 space-y-1">
          <h3 className="text-base font-serif font-bold text-navy-muted">Your Data, Always Yours</h3>
          <p className="text-sm text-stone-500 leading-relaxed">
            Download a complete copy of your Survivor Packet anytime &mdash; all your information and documents in one ZIP file.
          </p>
        </div>
        <DownloadPacketButton />
      </div>

      {/* Footer / Connection Status */}
      <div className="pt-8 flex flex-col items-center gap-4">
        <div className="flex items-center gap-2 text-stone-400">
          <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
          <Clock size={14} />
          <span className="text-[10px] font-bold uppercase tracking-widest">Connected to Supabase Secure Vault</span>
        </div>
      </div>
    </div>
  );
};
