import React, { useEffect, useState } from 'react';
import { TrendingUp, ArrowRight, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { estateSummaryService, EstateSummary, formatCurrencyAbbrev } from '../../services/estateSummaryService';

export const EstateSummaryCard: React.FC = () => {
  const { currentPacket, setView, completionVersion } = useAppContext();
  const [summary, setSummary] = useState<EstateSummary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPacket?.id) return;
    let cancelled = false;
    setLoading(true);
    estateSummaryService
      .getSummary(currentPacket.id)
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((err) => console.error('[EstateSummaryCard] load failed', err))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentPacket?.id, completionVersion]);

  if (loading || !summary) {
    return (
      <div className="bg-white border border-stone-200 rounded-2xl p-5 flex items-center gap-3">
        {loading ? <Loader2 className="animate-spin text-stone-400" size={18} /> : null}
        <p className="text-sm text-stone-500">{loading ? 'Loading estate summary…' : 'No estate data yet.'}</p>
      </div>
    );
  }

  const totalRecords =
    summary.categories.real_estate.records.length +
    summary.categories.vehicles.records.length +
    summary.categories.banking.records.length +
    summary.categories.investments.records.length +
    summary.categories.retirement.records.length +
    summary.categories.property.records.length;

  const sectionsWithData = Object.entries(summary.categories)
    .filter(([k, v]: [string, any]) => k !== 'life_insurance' && (v.total || 0) > 0).length;

  const isNegative = summary.net_estate < 0;
  const hasData = totalRecords > 0 || summary.total_liabilities > 0;

  return (
    <button
      onClick={() => setView('estate')}
      className="w-full text-left bg-gradient-to-br from-navy-muted to-navy-muted/85 text-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-all group"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest opacity-80">
            <TrendingUp size={12} />
            Estimated Estate Value
          </div>
          <p className={`text-3xl font-serif font-bold mt-1 ${isNegative ? 'text-rose-200' : 'text-white'}`}>
            {hasData ? formatCurrencyAbbrev(summary.net_estate) : '—'}
          </p>
          <p className="text-[11px] opacity-75 mt-1">
            {hasData
              ? `Based on ${totalRecords} ${totalRecords === 1 ? 'asset' : 'assets'} across ${sectionsWithData} ${sectionsWithData === 1 ? 'section' : 'sections'}`
              : 'Add asset values to see your estate snapshot'}
          </p>
        </div>
        <ArrowRight size={18} className="opacity-70 group-hover:translate-x-1 transition-transform shrink-0" />
      </div>
      <div className="mt-3 pt-3 border-t border-white/10 flex items-center justify-between text-[10px] uppercase tracking-widest font-bold opacity-75">
        <span>View Full Summary</span>
        <span>Updated {new Date(summary.calculated_at).toLocaleDateString()}</span>
      </div>
    </button>
  );
};
