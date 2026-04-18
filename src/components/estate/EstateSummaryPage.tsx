import React, { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft,
  Loader2,
  Home,
  Car,
  Landmark,
  TrendingUp,
  PiggyBank,
  Package as PackageIcon,
  Heart,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Plus,
  Pencil,
  Trash2,
  Search,
  RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useAppContext } from '../../context/AppContext';
import {
  estateSummaryService,
  EstateSummary,
  EstateLiability,
  formatCurrency,
} from '../../services/estateSummaryService';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { LiabilityFormModal } from './LiabilityFormModal';

const CATEGORY_META: Record<string, { label: string; icon: any; color: string; section: string }> = {
  real_estate: { label: 'Real Estate', icon: Home, color: 'hsl(210, 60%, 45%)', section: 'real-estate' },
  vehicles: { label: 'Vehicles', icon: Car, color: 'hsl(25, 70%, 50%)', section: 'vehicles' },
  banking: { label: 'Banking', icon: Landmark, color: 'hsl(160, 50%, 40%)', section: 'banking' },
  investments: { label: 'Investments', icon: TrendingUp, color: 'hsl(280, 50%, 50%)', section: 'investments' },
  retirement: { label: 'Retirement', icon: PiggyBank, color: 'hsl(45, 70%, 50%)', section: 'retirement' },
  property: { label: 'Personal Property', icon: PackageIcon, color: 'hsl(0, 50%, 50%)', section: 'property' },
};

interface CategoryRowProps {
  categoryKey: string;
  total: number;
  records: { id: string; label: string | null; subtype?: string | null; value: number }[];
  onNavigate: (sectionId: string) => void;
}

const CategoryRow: React.FC<CategoryRowProps> = ({ categoryKey, total, records, onNavigate }) => {
  const meta = CATEGORY_META[categoryKey];
  const [open, setOpen] = useState(false);
  if (!meta) return null;
  const Icon = meta.icon;
  return (
    <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden">
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center justify-between p-4 hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: `${meta.color}1a`, color: meta.color }}
          >
            <Icon size={18} />
          </div>
          <div className="text-left">
            <p className="text-sm font-bold text-navy-muted">{meta.label}</p>
            <p className="text-[11px] text-stone-500">{records.length} {records.length === 1 ? 'record' : 'records'} with value</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-navy-muted">{formatCurrency(total)}</span>
          {open ? <ChevronUp size={16} className="text-stone-400" /> : <ChevronDown size={16} className="text-stone-400" />}
        </div>
      </button>
      {open && (
        <div className="border-t border-stone-100 bg-stone-50/50 divide-y divide-stone-100">
          {records.length === 0 ? (
            <div className="p-4 text-xs text-stone-500 italic">
              No records with estimated values yet.{' '}
              <button onClick={() => onNavigate(meta.section)} className="text-navy-muted font-bold underline">
                Add values →
              </button>
            </div>
          ) : (
            records.map((r) => (
              <button
                key={r.id}
                onClick={() => onNavigate(meta.section)}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-white transition-colors text-left"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-navy-muted truncate">{r.label || 'Untitled'}</p>
                  {r.subtype && <p className="text-[11px] text-stone-500">{r.subtype}</p>}
                </div>
                <span className="text-sm font-semibold text-navy-muted shrink-0 ml-2">{formatCurrency(r.value)}</span>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const EstateSummaryPage: React.FC = () => {
  const { currentPacket, user, setView, setTab, setDirectoryQuery } = useAppContext();
  const confirm = useConfirm();
  const [summary, setSummary] = useState<EstateSummary | null>(null);
  const [liabilities, setLiabilities] = useState<EstateLiability[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [liabModalOpen, setLiabModalOpen] = useState(false);
  const [editingLiab, setEditingLiab] = useState<EstateLiability | null>(null);

  const load = async () => {
    if (!currentPacket?.id) return;
    try {
      const [sum, liabs] = await Promise.all([
        estateSummaryService.getSummary(currentPacket.id),
        estateSummaryService.listLiabilities(currentPacket.id),
      ]);
      setSummary(sum);
      setLiabilities(liabs);
    } catch (err: any) {
      console.error('[EstateSummaryPage] load error:', err);
      toast.error(`Failed to load estate summary: ${err.message || 'Unknown error'}`, { position: 'bottom-center', duration: 4500 });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPacket?.id]);

  const navigateToSection = (sectionId: string) => {
    setTab(sectionId as any);
    setView('sections');
  };

  const handleDeleteLiability = async (liab: EstateLiability) => {
    const ok = await confirm({
      title: 'Delete this liability?',
      description: `Remove "${liab.lender_name || liab.liability_type}"? This cannot be undone.`,
    });
    if (!ok) return;
    try {
      await estateSummaryService.deleteLiability(liab.id);
      toast.success('Liability deleted.', { position: 'bottom-center' });
      setRefreshing(true);
      await load();
    } catch (err: any) {
      console.error('[EstateSummaryPage] delete error:', err);
      toast.error(`Failed to delete: ${err.message || 'Unknown error'}`, { position: 'bottom-center', duration: 4500 });
    }
  };

  const chartData = useMemo(() => {
    if (!summary) return [];
    return Object.entries(summary.categories)
      .filter(([k]) => k !== 'life_insurance')
      .map(([k, v]: [string, any]) => ({
        name: CATEGORY_META[k]?.label || k,
        value: Number(v.total || 0),
        color: CATEGORY_META[k]?.color || 'hsl(0,0%,50%)',
        key: k,
      }))
      .filter((d) => d.value > 0);
  }, [summary]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Calculating estate summary…</p>
      </div>
    );
  }

  if (!summary || !currentPacket) {
    return (
      <div className="p-6 max-w-5xl mx-auto">
        <p className="text-stone-500 text-sm">Estate summary unavailable.</p>
      </div>
    );
  }

  const isNegative = summary.net_estate < 0;

  return (
    <div className="p-6 pb-32 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <button
          onClick={() => setView('dashboard')}
          className="flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest hover:text-navy-muted"
        >
          <ArrowLeft size={14} />
          Back to Dashboard
        </button>
        <button
          onClick={() => { setRefreshing(true); load(); }}
          disabled={refreshing}
          className="flex items-center gap-2 text-xs font-bold text-stone-500 hover:text-navy-muted disabled:opacity-50"
        >
          <RefreshCw size={14} className={refreshing ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      <div className="space-y-1">
        <h1 className="text-2xl font-serif font-bold text-navy-muted">Estate Value Summary</h1>
        <p className="text-sm text-stone-500 max-w-2xl">
          Estimated values based on information in your packet. Consult a financial advisor for accurate valuation.
        </p>
        <p className="text-[11px] text-stone-400 uppercase tracking-widest font-bold">
          Last updated {new Date(summary.calculated_at).toLocaleString()}
        </p>
      </div>

      {/* Top summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Gross Estate</p>
          <p className="text-2xl font-serif font-bold text-navy-muted mt-1">{formatCurrency(summary.gross_assets)}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Total Liabilities</p>
          <p className="text-2xl font-serif font-bold text-rose-600 mt-1">−{formatCurrency(summary.total_liabilities)}</p>
        </div>
        <div className={`rounded-2xl p-5 shadow-sm sm:col-span-2 lg:col-span-1 ${isNegative ? 'bg-rose-50 border-2 border-rose-300' : 'bg-gradient-to-br from-navy-muted to-navy-muted/80 border border-navy-muted text-white'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${isNegative ? 'text-rose-700' : 'text-white/70'}`}>Net Estimated Estate</p>
          <p className={`text-3xl font-serif font-bold mt-1 ${isNegative ? 'text-rose-700' : 'text-white'}`}>{formatCurrency(summary.net_estate)}</p>
          {isNegative && <p className="text-[11px] text-rose-700 mt-1">Liabilities currently exceed assets.</p>}
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-1"><Heart size={10} /> Death Benefits</p>
          <p className="text-2xl font-serif font-bold text-navy-muted mt-1">{formatCurrency(summary.death_benefits)}</p>
          <p className="text-[10px] text-stone-500 mt-1 leading-snug">Paid directly to beneficiaries — may not be part of probate estate.</p>
        </div>
      </div>

      {/* Liquid / Illiquid */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Liquid Assets</p>
          <p className="text-lg font-bold text-navy-muted">{formatCurrency(summary.liquid_assets)}</p>
          <p className="text-[10px] text-stone-500">Banking + Investments</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Illiquid Assets</p>
          <p className="text-lg font-bold text-navy-muted">{formatCurrency(summary.illiquid_assets)}</p>
          <p className="text-[10px] text-stone-500">Real estate + vehicles + property</p>
        </div>
      </div>

      {/* Donut chart */}
      {chartData.length > 0 && (
        <div className="bg-white border border-stone-200 rounded-2xl p-5">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Asset Allocation</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={chartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={95} paddingAngle={2}>
                    {chartData.map((d) => <Cell key={d.key} fill={d.color} />)}
                  </Pie>
                  <Tooltip formatter={(v: any) => formatCurrency(Number(v))} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="space-y-2">
              {chartData.map((d) => {
                const pct = summary.gross_assets > 0 ? (d.value / summary.gross_assets) * 100 : 0;
                return (
                  <div key={d.key} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: d.color }} />
                      <span className="text-navy-muted">{d.name}</span>
                    </div>
                    <div className="text-stone-500">
                      {formatCurrency(d.value)} <span className="text-stone-400">({pct.toFixed(0)}%)</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Asset categories breakdown */}
      <div className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Asset Breakdown</h3>
        {Object.entries(summary.categories)
          .filter(([k]) => k !== 'life_insurance')
          .map(([k, v]: [string, any]) => (
            <CategoryRow
              key={k}
              categoryKey={k}
              total={Number(v.total || 0)}
              records={v.records || []}
              onNavigate={navigateToSection}
            />
          ))}

        {/* Life insurance informational */}
        {summary.categories.life_insurance.records.length > 0 && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-2">
              <Heart size={14} className="text-rose-500" />
              <p className="text-sm font-bold text-navy-muted">Life Insurance Policies</p>
            </div>
            <p className="text-[11px] text-stone-500 mb-3">
              Death benefits are paid directly to beneficiaries and may not be part of the probate estate.
            </p>
            <div className="space-y-2">
              {summary.categories.life_insurance.records.map((r) => (
                <div key={r.id} className="text-sm text-navy-muted border-l-2 border-rose-200 pl-3">
                  <p className="font-medium">{r.label}</p>
                  {r.notes && <p className="text-[11px] text-stone-500 line-clamp-2">{r.notes}</p>}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Liabilities */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Liabilities</h3>
          <button
            onClick={() => { setEditingLiab(null); setLiabModalOpen(true); }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-navy-muted text-white rounded-lg text-[11px] font-bold uppercase tracking-wider"
          >
            <Plus size={12} /> Add Liability
          </button>
        </div>
        {liabilities.length === 0 ? (
          <div className="bg-white border border-dashed border-stone-200 rounded-2xl p-6 text-center">
            <p className="text-sm text-stone-500">No liabilities added yet.</p>
            <p className="text-[11px] text-stone-400 mt-1">Vehicle loans from your Vehicles section are included automatically.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {liabilities.map((l) => (
              <div key={l.id} className="bg-white border border-rose-100 rounded-2xl p-4 flex items-center justify-between">
                <div className="min-w-0">
                  <p className="text-sm font-bold text-navy-muted">{l.lender_name || l.liability_type}</p>
                  <p className="text-[11px] text-stone-500">
                    {l.liability_type}
                    {l.monthly_payment ? ` · ${formatCurrency(l.monthly_payment)}/mo` : ''}
                    {l.interest_rate ? ` · ${l.interest_rate}%` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-rose-600">−{formatCurrency(l.balance)}</span>
                  <button onClick={() => { setEditingLiab(l); setLiabModalOpen(true); }} className="p-1.5 hover:bg-stone-100 rounded">
                    <Pencil size={14} className="text-stone-500" />
                  </button>
                  <button onClick={() => handleDeleteLiability(l)} className="p-1.5 hover:bg-rose-50 rounded">
                    <Trash2 size={14} className="text-rose-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Missing values */}
      {summary.missing_values.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-2">
            <AlertTriangle size={14} className="text-amber-600" />
            <p className="text-sm font-bold text-amber-900">Some records are missing estimated values</p>
          </div>
          <p className="text-[11px] text-amber-800 mb-3">
            Adding values gives you a more complete picture of your estate.
          </p>
          <div className="space-y-1 max-h-48 overflow-y-auto">
            {summary.missing_values.slice(0, 20).map((m) => (
              <button
                key={`${m.section}-${m.id}`}
                onClick={() => navigateToSection(m.section)}
                className="w-full text-left text-[12px] text-amber-900 hover:bg-amber-100 rounded px-2 py-1 flex items-center justify-between"
              >
                <span>
                  <span className="font-bold uppercase text-[10px] tracking-wider mr-2">{m.section}</span>
                  {m.label || 'Untitled'}
                </span>
                <span className="text-amber-700 font-bold">Add value →</span>
              </button>
            ))}
            {summary.missing_values.length > 20 && (
              <p className="text-[11px] text-amber-700 italic px-2">
                +{summary.missing_values.length - 20} more…
              </p>
            )}
          </div>
        </div>
      )}

      {/* Disclaimer */}
      <div className="bg-stone-50 border border-stone-200 rounded-2xl p-4 space-y-2">
        <p className="text-[12px] text-stone-600 leading-relaxed">
          <strong className="text-navy-muted">Disclaimer:</strong> This summary is based on estimated values you have entered. It is not a professional appraisal or financial assessment. Consult a qualified financial advisor or estate planning attorney for accurate estate valuation.
        </p>
        <button
          onClick={() => { setDirectoryQuery('Estate Planning Attorney'); setView('directory'); }}
          className="flex items-center gap-1.5 text-[12px] font-bold text-navy-muted hover:underline"
        >
          <Search size={12} />
          Find an Estate Planning Attorney →
        </button>
      </div>

      {currentPacket && user && (
        <LiabilityFormModal
          isOpen={liabModalOpen}
          onClose={() => setLiabModalOpen(false)}
          packetId={currentPacket.id}
          userId={user.id}
          liability={editingLiab}
          onSaved={() => { setRefreshing(true); load(); }}
        />
      )}
    </div>
  );
};
