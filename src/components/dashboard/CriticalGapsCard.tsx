import React, { useEffect, useState } from 'react';
import { AlertTriangle, ArrowRight, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { healthScoreService, HealthScore, CriticalGap } from '../../services/healthScoreService';

const sectionLabel = (key: string) =>
  SECTIONS_CONFIG.find((s) => s.id === key)?.label ?? key;

interface Props {
  packetId: string;
}

export const CriticalGapsCard: React.FC<Props> = ({ packetId }) => {
  const { setView, setTab, completionVersion } = useAppContext();
  const [score, setScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    healthScoreService
      .getCurrent(packetId)
      .then((s) => !cancelled && setScore(s))
      .catch((err) => console.error('[CriticalGapsCard] load failed', err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [packetId, completionVersion]);

  if (loading) {
    return (
      <div className="paper-sheet p-6 flex items-center justify-center">
        <Loader2 className="animate-spin text-stone-400" size={20} />
      </div>
    );
  }

  // Hide if score >= 75 or no gaps
  if (!score || score.total_score >= 75) return null;

  const gaps = (score.critical_gaps || []).slice(0, 3);
  if (gaps.length === 0) return null;

  const handleFix = (gap: CriticalGap) => {
    setTab(gap.section as any);
    setView('sections');
  };

  return (
    <div className="paper-sheet p-6 space-y-4 border-l-4 border-l-rose-500">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-full bg-rose-50 flex items-center justify-center flex-shrink-0">
          <AlertTriangle size={18} className="text-rose-600" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-bold text-navy-muted">Critical Gaps to Address</h3>
          <p className="text-xs text-stone-500 mt-0.5">
            Fix these high-impact items first to boost your score
          </p>
        </div>
      </div>

      <div className="space-y-2">
        {gaps.map((gap, i) => (
          <button
            key={`${gap.section}-${i}`}
            onClick={() => handleFix(gap)}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left group"
          >
            <div className="w-7 h-7 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-rose-700">{i + 1}</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-stone-800 truncate">
                {gap.label}
              </p>
              <p className="text-[11px] text-stone-500 mt-0.5">
                {sectionLabel(gap.section)} · +{gap.impact} pts possible
              </p>
            </div>
            <span className="flex items-center gap-1 text-xs font-bold text-navy-muted group-hover:gap-2 transition-all flex-shrink-0">
              Fix Now
              <ArrowRight size={14} />
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};
