import React, { useState } from 'react';
import { ChevronDown, ChevronUp, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { usePacketCompletion } from '../../hooks/usePacketCompletion';

/**
 * Packet completion ring + "what's missing" expandable list.
 * Reads from `usePacketCompletion` — the SINGLE source of truth shared
 * with DashboardScreen's header badge and folder cards.
 */
export const PacketCompletionScore: React.FC<{ packetId: string }> = ({ packetId }) => {
  const { setView, setTab } = useAppContext();
  const [expanded, setExpanded] = useState(false);

  const {
    loading,
    overallPercent: pct,
    completedSections: doneCount,
    totalSections: total,
    sectionStatus,
  } = usePacketCompletion(packetId);

  if (loading) return null;

  // Ring color
  let ringColor = '#ef4444'; // red
  if (pct >= 100) ringColor = '#c9a84c'; // gold
  else if (pct >= 67) ringColor = '#3b82f6'; // blue
  else if (pct >= 34) ringColor = '#f59e0b'; // amber

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (pct / 100) * circumference;

  // Sections that count toward overall but currently have no content
  const missing = SECTIONS_CONFIG
    .filter(s => s.id !== 'affiliate')
    .filter(s => !sectionStatus[s.id]?.hasContent);

  return (
    <div className="paper-sheet p-6">
      <div className="flex items-center gap-6">
        {/* Circular progress */}
        <div className="relative flex-shrink-0">
          <svg width="100" height="100" viewBox="0 0 100 100">
            <circle cx="50" cy="50" r={radius} fill="none" stroke="#e5e7eb" strokeWidth="6" />
            <circle
              cx="50" cy="50" r={radius} fill="none"
              stroke={ringColor} strokeWidth="6"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              transform="rotate(-90 50 50)"
              style={{ transition: 'stroke-dashoffset 1s ease-out' }}
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-2xl font-bold text-navy-muted">{pct}%</span>
          </div>
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          {pct >= 100 ? (
            <>
              <p className="text-base font-bold text-navy-muted">🎉 Your Packet is complete!</p>
              <p className="text-xs text-stone-500 mt-1">Download it or share with your trusted contacts.</p>
            </>
          ) : (
            <>
              <p className="text-base font-bold text-navy-muted">Your Packet is {pct}% complete</p>
              <p className="text-xs text-stone-500 mt-1">{doneCount} of {total} sections have information</p>
            </>
          )}

          {missing.length > 0 && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="mt-2 flex items-center gap-1 text-xs font-bold text-stone-500 hover:text-navy-muted transition-colors"
            >
              {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {expanded ? 'Hide details' : "See what's missing"}
            </button>
          )}
        </div>
      </div>

      {/* Expandable missing list */}
      {expanded && missing.length > 0 && (
        <div className="mt-4 pt-4 border-t border-stone-100 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {missing.map((s) => (
            <button
              key={s.id}
              onClick={() => { setTab(s.id); setView('sections'); }}
              className="flex items-center justify-between px-3 py-2 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors text-left group"
            >
              <span className="text-xs font-medium text-stone-600">{s.label}</span>
              <ArrowRight size={12} className="text-stone-400 group-hover:text-navy-muted" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
