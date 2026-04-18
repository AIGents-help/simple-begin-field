import React, { useEffect, useState } from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { coupleService, DocumentGap } from '../../services/coupleService';
import { useCouple } from '../../hooks/useCouple';
import { useAppContext } from '../../context/AppContext';

export const DocumentGapsCard: React.FC = () => {
  const { link, loading: coupleLoading } = useCouple();
  const { setView, setTab } = useAppContext();
  const [gaps, setGaps] = useState<DocumentGap[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coupleLoading || !link || link.status !== 'active') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    coupleService.getDocumentGaps().then((g) => {
      if (!cancelled) {
        setGaps(g);
        setLoading(false);
      }
    });
  }, [coupleLoading, link]);

  if (coupleLoading || !link || link.status !== 'active' || loading || gaps.length === 0) return null;

  return (
    <div className="rounded-3xl border border-indigo-200 bg-gradient-to-br from-indigo-50/60 to-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center">
          <Sparkles size={16} />
        </div>
        <div>
          <h3 className="text-base font-serif font-bold text-navy-muted">Catch up to your partner</h3>
          <p className="text-[11px] text-stone-500">Sections they've completed but you haven't</p>
        </div>
      </div>

      <ul className="space-y-2">
        {gaps.map((g, idx) => (
          <li key={idx}>
            <button
              onClick={() => { setView('sections'); setTab(g.section as any); }}
              className="w-full flex items-center justify-between gap-3 px-3 py-2.5 bg-white rounded-xl border border-stone-200 hover:border-indigo-300 transition-colors text-left"
            >
              <span className="text-[12px] text-navy-muted font-medium flex-1 min-w-0 truncate">{g.label}</span>
              <span className="text-[10px] uppercase font-bold tracking-wider text-indigo-600 flex items-center gap-1 shrink-0">
                {g.cta} <ArrowRight size={11} />
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};
