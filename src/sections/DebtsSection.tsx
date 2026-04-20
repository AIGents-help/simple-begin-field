import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { CreditCard, ChevronDown, ChevronUp, Plus, Pencil, MinusCircle, ArrowDownRight } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { CreditorSheet } from '../components/debts/CreditorSheet';
import { estateSummaryService, formatCurrency, formatCurrencyAbbrev, EstateSummary } from '../services/estateSummaryService';

const DEBT_TYPE_ORDER = [
  'Credit Card', 'Line of Credit', 'Personal Loan', 'Auto Loan',
  'Mortgage', 'Student Loan', 'Medical Debt', 'Tax Debt', 'Business Loan', 'Other'
];

const sortDebts = (a: any, b: any) => {
  // Largest balance first within a creditor
  const ba = Number(a.balance || 0);
  const bb = Number(b.balance || 0);
  if (ba !== bb) return bb - ba;
  const ta = String(a.liability_type || '');
  const tb = String(b.liability_type || '');
  return ta.localeCompare(tb);
};

const UNKNOWN_KEY = '__unknown__';

interface DebtsViewProps {
  records: any[];
  refresh: () => void;
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onEditCreditor: (creditorName: string) => void;
}

const DebtsView: React.FC<DebtsViewProps> = ({ records, refresh, onAddClick, onEditCreditor }) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  const handleDelete = async (record: any) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this debt?',
      description: `Delete the ${record.liability_type || 'debt'} at ${record.lender_name || 'this creditor'}? This action cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await sectionService.deleteRecord('debts', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Debt deleted.', { duration: 3000, position: 'bottom-center' });
  };

  // Group by creditor (lender_name)
  const grouped = useMemo(() => {
    const map: Record<string, { displayName: string; debts: any[]; total: number }> = {};
    for (const r of records) {
      const raw = (r.lender_name || '').trim();
      const key = raw ? raw.toLowerCase() : UNKNOWN_KEY;
      if (!map[key]) {
        map[key] = {
          displayName: raw || 'Unknown Creditor',
          debts: [],
          total: 0,
        };
      }
      map[key].debts.push(r);
      map[key].total += Number(r.balance || 0);
    }
    for (const k of Object.keys(map)) {
      map[k].debts.sort(sortDebts);
    }
    return Object.entries(map).sort(([ka, va], [kb, vb]) => {
      if (ka === UNKNOWN_KEY) return 1;
      if (kb === UNKNOWN_KEY) return -1;
      return va.displayName.localeCompare(vb.displayName);
    });
  }, [records]);

  if (records.length === 0) return null;

  return (
    <div className="space-y-4">
      {grouped.map(([key, group]) => {
        const isCollapsed = !!collapsed[key];
        const isUnknown = key === UNKNOWN_KEY;
        return (
          <div key={key} className="rounded-3xl bg-white border border-stone-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-stone-50 border-b border-stone-100 flex items-start justify-between gap-3">
              <button
                onClick={() => setCollapsed((c) => ({ ...c, [key]: !isCollapsed }))}
                className="flex items-start gap-3 flex-1 min-w-0 text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-700 shrink-0">
                  <CreditCard size={20} />
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className={`font-bold text-base ${isUnknown ? 'text-stone-500 italic' : 'text-navy-muted'} truncate`}>
                    {group.displayName}
                  </h3>
                  <p className="text-[11px] text-rose-700 font-bold mt-0.5">
                    {formatCurrency(group.total)} owed
                  </p>
                  <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold mt-1">
                    {group.debts.length} {group.debts.length === 1 ? 'account' : 'accounts'}
                  </p>
                </div>
                {isCollapsed ? <ChevronDown size={18} className="text-stone-400 mt-1.5 shrink-0" /> : <ChevronUp size={18} className="text-stone-400 mt-1.5 shrink-0" />}
              </button>
              {!isUnknown && (
                <button
                  onClick={() => onEditCreditor(group.displayName)}
                  className="px-2 py-1 rounded-lg text-[11px] font-bold text-navy-muted hover:bg-stone-200 flex items-center gap-1 shrink-0"
                  aria-label={`Edit ${group.displayName}`}
                >
                  <Pencil size={12} />
                  Edit
                </button>
              )}
            </div>

            {!isCollapsed && (
              <div className="p-4 space-y-3">
                {isUnknown && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 font-medium">
                    Add a creditor name to organize {group.debts.length === 1 ? 'this debt' : 'these debts'}.
                  </div>
                )}

                {group.debts.map((record) => (
                  <div key={record.id} className="relative">
                    <RecordCard
                      title={record.liability_type || 'Debt'}
                      subtitle={buildSubtitle(
                        record.account_number_masked ? `****${String(record.account_number_masked).slice(-4)}` : null,
                        record.is_joint ? 'Joint' : null,
                        record.autopay_enabled ? 'Autopay' : null
                      )}
                      subtitlePlaceholder="No account details added"
                      icon={MinusCircle}
                      badge={record.scope === 'shared' ? 'Shared' : undefined}
                      data={record}
                      onEdit={() => onAddClick(undefined, record)}
                      onDelete={() => handleDelete(record)}
                    />
                    {/* Right-side balance overlay */}
                    {Number(record.balance || 0) > 0 && (
                      <div className="absolute top-5 right-14 pointer-events-none text-rose-700 font-bold text-sm">
                        {formatCurrency(record.balance)}
                      </div>
                    )}
                  </div>
                ))}

                {!isUnknown && (
                  <button
                    onClick={() =>
                      onAddClick(undefined, {
                        lender_name: group.displayName,
                        _lockedFields: ['lender_name'],
                      })
                    }
                    className="w-full py-3 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-500 hover:border-navy-muted hover:text-navy-muted transition-colors text-sm font-bold"
                  >
                    <Plus size={16} />
                    Add account at {group.displayName}
                  </button>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

const TotalDebtCard: React.FC<{ total: number; count: number }> = ({ total, count }) => (
  <div className="rounded-3xl bg-navy-muted text-white p-6 shadow-sm relative overflow-hidden">
    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/10 rounded-full -mr-12 -mt-12 pointer-events-none" />
    <p className="text-[10px] font-bold uppercase tracking-widest text-rose-300 mb-2">
      Total Outstanding Debt
    </p>
    <p className="text-3xl font-serif font-bold text-white tabular-nums">
      {formatCurrency(total)}
    </p>
    <p className="text-xs text-stone-300 mt-2 font-medium">
      {count} {count === 1 ? 'account' : 'accounts'}
    </p>
  </div>
);

const EstateRow: React.FC<{ totalDebts: number }> = ({ totalDebts }) => {
  const { currentPacket } = useAppContext();
  const [open, setOpen] = useState(false);
  const [summary, setSummary] = useState<EstateSummary | null>(null);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    try {
      const s = await estateSummaryService.getSummary(currentPacket.id);
      setSummary(s);
    } catch (err) {
      console.error('[Debts] estate summary load failed', err);
      toast.error('Failed to load estate summary.', { duration: 3500, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = () => {
    const next = !open;
    setOpen(next);
    if (next && !summary) void load();
  };

  return (
    <div className="rounded-2xl bg-white border border-stone-200 shadow-sm overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full p-4 flex items-center justify-between hover:bg-stone-50 transition-colors"
      >
        <div className="flex items-center gap-3 text-left">
          <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-700">
            <ArrowDownRight size={18} />
          </div>
          <div>
            <p className="text-sm font-bold text-navy-muted">See Estate Summary</p>
            <p className="text-[11px] text-stone-500">Assets minus debts = your net estate value</p>
          </div>
        </div>
        {open ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
      </button>
      {open && (
        <div className="p-5 border-t border-stone-100 bg-stone-50/50 space-y-2">
          {loading && <p className="text-xs text-stone-500">Calculating...</p>}
          {!loading && summary && (
            <>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Total Assets</span>
                <span className="font-bold text-navy-muted tabular-nums">
                  {formatCurrencyAbbrev(summary.gross_assets)}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-stone-600">Total Debts</span>
                <span className="font-bold text-rose-700 tabular-nums">
                  − {formatCurrencyAbbrev(summary.total_liabilities)}
                </span>
              </div>
              <div className="border-t border-stone-200 my-2" />
              <div className="flex items-center justify-between text-base">
                <span className="font-bold text-navy-muted">Net Value</span>
                <span className="font-serif font-bold text-emerald-700 tabular-nums">
                  {formatCurrencyAbbrev(summary.net_estate)}
                </span>
              </div>
              {Number(totalDebts || 0) > 0 && Number(summary.total_liabilities || 0) === 0 && (
                <p className="text-[11px] text-amber-700 italic mt-2">
                  Estate calculation may need a moment to refresh.
                </p>
              )}
            </>
          )}
          {!loading && !summary && (
            <p className="text-xs text-stone-500">No estate data available yet.</p>
          )}
        </div>
      )}
    </div>
  );
};

export const DebtsSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { currentPacket } = useAppContext();
  const [creditorSheetOpen, setCreditorSheetOpen] = useState(false);
  const [creditorMode, setCreditorMode] = useState<'create' | 'edit'>('create');
  const [editingCreditor, setEditingCreditor] = useState<string | null>(null);
  const [allRecords, setAllRecords] = useState<any[]>([]);
  const refreshRef = React.useRef<() => void>(() => {});

  const existingCreditorNames = useMemo(
    () => Array.from(new Set(allRecords.map((r) => (r.lender_name || '').trim()).filter(Boolean))),
    [allRecords]
  );

  const totalDebt = useMemo(
    () => allRecords.reduce((sum, r) => sum + Number(r.balance || 0), 0),
    [allRecords]
  );

  const handleEditCreditor = (name: string) => {
    setEditingCreditor(name);
    setCreditorMode('edit');
    setCreditorSheetOpen(true);
  };

  const handleAddCreditor = () => {
    setEditingCreditor(null);
    setCreditorMode('create');
    setCreditorSheetOpen(true);
  };

  const handleCreditorSaved = (creditorName: string, isNew?: boolean) => {
    if (creditorMode === 'create' || isNew) {
      onAddClick(undefined, {
        lender_name: creditorName,
        _lockedFields: ['lender_name'],
      });
    } else {
      refreshRef.current?.();
    }
  };

  return (
    <>
      <SectionScreenTemplate
        onAddClick={(_file, data) => {
          if (data && (data.id || data.lender_name || data._lockedFields)) {
            onAddClick(undefined, data);
            return;
          }
          handleAddCreditor();
        }}
        onRefresh={(fn) => {
          refreshRef.current = fn;
          onRefresh?.(fn);
        }}
      >
        {(records, _docs, refresh) => {
          if (records !== allRecords) {
            queueMicrotask(() => setAllRecords(records));
          }
          const sectionTotal = records.reduce((sum, r) => sum + Number(r.balance || 0), 0);
          return (
            <div className="space-y-5">
              <TotalDebtCard total={sectionTotal} count={records.length} />
              <EstateRow totalDebts={sectionTotal} />
              <DebtsView
                records={records}
                refresh={refresh}
                onAddClick={onAddClick}
                onEditCreditor={handleEditCreditor}
              />
            </div>
          );
        }}
      </SectionScreenTemplate>

      <CreditorSheet
        isOpen={creditorSheetOpen}
        onClose={() => setCreditorSheetOpen(false)}
        packetId={currentPacket?.id}
        mode={creditorMode}
        initialName={editingCreditor}
        existingCreditors={existingCreditorNames}
        onSaved={handleCreditorSaved}
      />
    </>
  );
};
