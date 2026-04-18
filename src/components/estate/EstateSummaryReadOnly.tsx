import React, { useEffect, useState } from 'react';
import { Loader2, Home, Car, Landmark, TrendingUp, PiggyBank, Package as PackageIcon, AlertTriangle, Eye } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { estateSummaryService, EstateSummary, formatCurrency, formatCurrencyAbbrev } from '../../services/estateSummaryService';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string }> = {
  real_estate: { label: 'Real Estate', icon: Home, color: 'hsl(210, 60%, 45%)' },
  vehicles: { label: 'Vehicles', icon: Car, color: 'hsl(25, 70%, 50%)' },
  banking: { label: 'Banking', icon: Landmark, color: 'hsl(160, 50%, 40%)' },
  investments: { label: 'Investments', icon: TrendingUp, color: 'hsl(280, 50%, 50%)' },
  retirement: { label: 'Retirement', icon: PiggyBank, color: 'hsl(45, 70%, 50%)' },
  property: { label: 'Personal Property', icon: PackageIcon, color: 'hsl(0, 50%, 50%)' },
};

interface Props {
  packetId: string;
  /** When true, calls the viewer-aware RPC (used for trusted contacts). */
  viewerMode?: boolean;
  className?: string;
}

/**
 * Read-only Estate Summary view used by the Trusted Contact dashboard
 * and the Admin packet detail screen. Renders totals, a donut chart,
 * and category totals — never any account numbers.
 */
export const EstateSummaryReadOnly: React.FC<Props> = ({ packetId, viewerMode = false, className }) => {
  const [summary, setSummary] = useState<EstateSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    const fetcher = viewerMode
      ? estateSummaryService.getSummaryForViewer(packetId)
      : estateSummaryService.getSummary(packetId);
    fetcher
      .then((s) => { if (!cancelled) setSummary(s); })
      .catch((e: any) => { if (!cancelled) setError(e?.message || 'Failed to load summary'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [packetId, viewerMode]);

  if (loading) {
    return (
      <div className={`flex items-center gap-2 text-sm text-stone-500 ${className || ''}`}>
        <Loader2 className="w-4 h-4 animate-spin" /> Loading estate summary…
      </div>
    );
  }
  if (error || !summary) {
    return (
      <div className={`text-sm text-stone-500 ${className || ''}`}>
        {error || 'No estate data yet.'}
      </div>
    );
  }

  const isNegative = summary.net_estate < 0;
  const isPartial = !!summary.partial;

  const chartData = Object.entries(summary.categories)
    .filter(([k]) => k !== 'life_insurance')
    .map(([k, v]: [string, any]) => ({
      name: CATEGORY_META[k]?.label ?? k,
      value: Math.max(0, Number(v.total || 0)),
      color: CATEGORY_META[k]?.color ?? 'hsl(220, 10%, 50%)',
    }))
    .filter((d) => d.value > 0);

  return (
    <div className={`space-y-5 ${className || ''}`}>
      {isPartial && (
        <div className="flex items-start gap-2 p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800">
          <Eye className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>
            <span className="font-bold">Partial Estate Summary</span> — based on the sections you have access to.
            Totals reflect only those categories.
          </p>
        </div>
      )}

      {/* Top totals */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Gross Estate</div>
          <div className="text-xl font-serif font-bold text-navy-muted mt-1">{formatCurrencyAbbrev(summary.gross_assets)}</div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Liabilities</div>
          <div className="text-xl font-serif font-bold text-rose-600 mt-1">{formatCurrencyAbbrev(summary.total_liabilities)}</div>
        </div>
        <div className="bg-white border-2 border-navy-muted rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-navy-muted">Net Estate</div>
          <div className={`text-2xl font-serif font-bold mt-1 ${isNegative ? 'text-rose-600' : 'text-navy-muted'}`}>
            {formatCurrencyAbbrev(summary.net_estate)}
          </div>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Death Benefits</div>
          <div className="text-xl font-serif font-bold text-stone-700 mt-1">{formatCurrencyAbbrev(summary.death_benefits)}</div>
        </div>
      </div>

      {/* Allocation + categories */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Asset Allocation</div>
            <div className="h-48">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={chartData} dataKey="value" innerRadius={45} outerRadius={75} paddingAngle={2}>
                    {chartData.map((d, i) => <Cell key={i} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatCurrency(v)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">Category Totals</div>
            <ul className="space-y-2 text-sm">
              {Object.entries(summary.categories)
                .filter(([k]) => k !== 'life_insurance')
                .map(([k, v]: [string, any]) => {
                  const meta = CATEGORY_META[k];
                  if (!meta) return null;
                  const Icon = meta.icon;
                  return (
                    <li key={k} className="flex items-center justify-between">
                      <span className="flex items-center gap-2 text-stone-700">
                        <span className="w-2 h-2 rounded-full" style={{ background: meta.color }} />
                        <Icon className="w-3.5 h-3.5 text-stone-400" />
                        {meta.label}
                      </span>
                      <span className="font-mono text-stone-900">{formatCurrency(v.total)}</span>
                    </li>
                  );
                })}
            </ul>
          </div>
        </div>
      )}

      {isNegative && (
        <div className="flex items-start gap-2 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800">
          <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <p>Liabilities currently exceed estimated assets.</p>
        </div>
      )}

      <p className="text-[11px] text-stone-500 italic">
        Estimated values entered by the packet owner. Not a professional appraisal. Consult a financial advisor or
        estate planning attorney for accurate valuation.
      </p>
    </div>
  );
};
