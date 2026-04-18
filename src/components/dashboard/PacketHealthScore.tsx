import React, { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { healthScoreService, HealthScore, tierForScore } from '../../services/healthScoreService';

const sectionLabel = (key: string) =>
  SECTIONS_CONFIG.find((s) => s.id === key)?.label ?? key;

export const PacketHealthScore: React.FC<{ packetId: string }> = ({ packetId }) => {
  const { setView, setTab, completionVersion } = useAppContext();
  const [expanded, setExpanded] = useState(false);
  const [score, setScore] = useState<HealthScore | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    healthScoreService
      .getCurrent(packetId)
      .then((s) => {
        if (cancelled) return;
        if (!s) {
          // Backfill on the fly if no row exists
          return healthScoreService.recompute(packetId).then((fresh) => {
            if (!cancelled) setScore(fresh);
          });
        }
        setScore(s);
      })
      .catch((err) => console.error('[PacketHealthScore] load failed', err))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [packetId, completionVersion]);

  const tier = useMemo(() => tierForScore(score?.total_score ?? 0), [score?.total_score]);

  if (loading || !score) {
    return (
      <div className="paper-sheet p-6 animate-pulse">
        <div className="h-24 bg-stone-100 rounded" />
      </div>
    );
  }

  const pct = score.total_score;
  const radius = 46;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  const sections = Object.entries(score.section_scores || {})
    .map(([key, val]) => ({ key, ...(val as { score: number; max: number }) }))
    .sort((a, b) => b.max - a.max);

  return (
    <div className="paper-sheet p-6 space-y-4">
      <div className="flex items-center gap-6">
        {/* Ring */}
        <div className="relative flex-shrink-0">
          <svg width="120" height="120" viewBox="0 0 120 120">
            <circle cx="60" cy="60" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
            <circle
              cx="60"
              cy="60"
              r={radius}
              fill="none"
              stroke={tier.color}
              strokeWidth="8"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 60 60)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-3xl font-bold text-navy-muted leading-none">{pct}</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 mt-0.5">
              Grade {tier.grade}
            </span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-base">{tier.emoji}</span>
            <p className="text-base font-bold text-navy-muted">{tier.label}</p>
            {score.score_change > 0 && (
              <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                +{score.score_change} pts
              </span>
            )}
          </div>
          <p className="text-sm text-stone-600 mt-1">{tier.message}</p>
          <p className="text-xs text-stone-400 mt-0.5">
            Packet Health Score — weighted across all sections
          </p>

          <button
            onClick={() => setExpanded(!expanded)}
            className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-navy-muted transition-colors"
          >
            {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
            {expanded ? 'Hide breakdown' : 'See full breakdown'}
          </button>
        </div>
      </div>

      {/* Expandable section breakdown */}
      {expanded && (
        <div className="pt-4 border-t border-stone-100 space-y-2">
          {sections.map((s) => {
            const pctFull = s.max > 0 ? Math.round((s.score / s.max) * 100) : 0;
            const isZero = s.score === 0;
            const barColor =
              pctFull >= 75 ? 'bg-emerald-500'
              : pctFull >= 40 ? 'bg-amber-500'
              : isZero ? 'bg-rose-500' : 'bg-stone-400';
            return (
              <button
                key={s.key}
                onClick={() => { setTab(s.key as any); setView('sections'); }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-stone-50 transition-colors text-left"
              >
                <div className="w-32 shrink-0 flex items-center gap-1.5">
                  {isZero && <AlertCircle size={12} className="text-rose-500 shrink-0" />}
                  <span className={`text-xs font-medium ${isZero ? 'text-rose-700' : 'text-stone-700'} truncate`}>
                    {sectionLabel(s.key)}
                  </span>
                </div>
                <div className="flex-1 h-1.5 bg-stone-100 rounded-full overflow-hidden">
                  <div className={`h-full ${barColor} rounded-full transition-all`} style={{ width: `${pctFull}%` }} />
                </div>
                <span className="w-14 text-right text-[11px] font-semibold text-stone-500 shrink-0">
                  {s.score}/{s.max}
                </span>
                <ArrowRight size={12} className="text-stone-300 shrink-0" />
              </button>
            );
          })}
          <p className="text-[10px] text-stone-400 italic pt-2">
            Bonus points (up to +5): trusted contacts, check-ins enabled, 5+ sections with documents,
            funeral wishes, and full legal trio (Will + POA + Directive).
          </p>
        </div>
      )}
    </div>
  );
};
