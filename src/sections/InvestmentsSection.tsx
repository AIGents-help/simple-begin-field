import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { TrendingUp, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getCategoryIcon } from '../config/categoryIcons';

const ACCOUNT_TYPES = [
  'All',
  'Individual Brokerage',
  'Joint Brokerage',
  'Trust Account',
  'Custodial / UTMA',
  'Crypto Exchange',
  'Self-Directed',
  'Private Equity',
  'Angel / Startup Investment',
  'Hedge Fund',
  'Managed Portfolio',
  'Other',
];

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(n || 0);

export const InvestmentsSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<string>('All');

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this account?',
      description: `Delete "${record.account_nickname || record.institution || 'this account'}"? This action cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await sectionService.deleteRecord('investments', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Investment account deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => {
        const filtered = useMemo(() => {
          const list = filter === 'All' ? records : records.filter((r) => r.account_type === filter);
          // Sort by approximate value descending
          return [...list].sort((a, b) => Number(b.approximate_value || 0) - Number(a.approximate_value || 0));
        }, [records, filter]);

        const total = useMemo(
          () => records.reduce((sum, r) => sum + Number(r.approximate_value || 0), 0),
          [records]
        );

        const hasCrypto = records.some((r) => r.account_type === 'Crypto Exchange');

        return (
          <div className="space-y-6">
            {/* Portfolio total */}
            {records.length > 0 && (
              <div className="p-5 rounded-2xl bg-gradient-to-br from-navy-muted to-navy-muted/80 text-white shadow-sm">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest opacity-80">
                  <TrendingUp size={14} />
                  Total Estimated Portfolio Value
                </div>
                <div className="mt-1 text-3xl font-serif font-bold">{formatCurrency(total)}</div>
                <div className="mt-1 text-xs opacity-75">
                  Across {records.length} {records.length === 1 ? 'account' : 'accounts'}
                </div>
              </div>
            )}

            {/* Crypto safety reminder */}
            {hasCrypto && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-2">
                <AlertTriangle size={16} className="text-amber-600 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-amber-900 font-medium">
                  Never store actual seed phrases in any digital system. Record only the physical location of your seed phrase backup.
                </p>
              </div>
            )}

            {/* Filter chips */}
            {records.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
                {ACCOUNT_TYPES.filter(
                  (t) => t === 'All' || records.some((r) => r.account_type === t)
                ).map((t) => (
                  <button
                    key={t}
                    onClick={() => setFilter(t)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-colors ${
                      filter === t
                        ? 'bg-navy-muted text-white'
                        : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            )}

            {/* Account cards */}
            {filtered.map((record) => (
              <RecordCard
                key={record.id}
                title={record.account_nickname || record.institution}
                subtitle={buildSubtitle(
                  record.account_type,
                  record.approximate_value ? formatCurrency(Number(record.approximate_value)) : undefined,
                  record.account_number_masked
                )}
                subtitlePlaceholder="No account details added"
                icon={getCategoryIcon('investments', record)}
                data={record}
                onEdit={() => onAddClick(undefined, record)}
                onDelete={() => handleDelete(record, refresh)}
              />
            ))}
          </div>
        );
      }}
    </SectionScreenTemplate>
  );
};
