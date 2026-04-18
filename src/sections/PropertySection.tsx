import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { PersonalPropertyCard } from '../components/property/PersonalPropertyCard';
import { PROPERTY_CATEGORIES } from '../config/propertyConfig';

const fmtCurrency = (n: number) =>
  `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;

export const PropertySection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();
  const [filter, setFilter] = useState<string>('all');

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this item?',
      description: `Delete "${record.title || record.item_name || 'this item'}"? This action cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await sectionService.deleteRecord('property', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Item deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => {
        const totalValue = records.reduce((sum, r: any) => {
          const v = parseFloat(r.appraised_value ?? r.estimated_value ?? 0);
          return sum + (isFinite(v) ? v : 0);
        }, 0);

        const filtered = filter === 'all' ? records : records.filter((r: any) => r.category === filter);
        const sorted = [...filtered].sort((a: any, b: any) => {
          const av = parseFloat(a.appraised_value ?? a.estimated_value ?? 0) || 0;
          const bv = parseFloat(b.appraised_value ?? b.estimated_value ?? 0) || 0;
          return bv - av;
        });

        const usedCategories = Array.from(new Set(records.map((r: any) => r.category).filter(Boolean)));

        return (
          <div className="space-y-4">
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Portfolio Total</p>
                <p className="text-2xl font-bold text-navy-muted mt-0.5">{fmtCurrency(totalValue)}</p>
                <p className="text-[11px] text-stone-500 mt-0.5">
                  {records.length} item{records.length === 1 ? '' : 's'}
                </p>
              </div>
            </div>

            {usedCategories.length > 0 && (
              <div className="flex gap-1.5 overflow-x-auto pb-1">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                    filter === 'all'
                      ? 'bg-navy-muted text-white'
                      : 'bg-white border border-stone-200 text-stone-600'
                  }`}
                >
                  All
                </button>
                {PROPERTY_CATEGORIES.filter((c) => usedCategories.includes(c)).map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setFilter(cat)}
                    className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition ${
                      filter === cat
                        ? 'bg-navy-muted text-white'
                        : 'bg-white border border-stone-200 text-stone-600'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            <div className="space-y-3">
              {sorted.map((record: any) => (
                <PersonalPropertyCard
                  key={record.id}
                  record={record}
                  onEdit={() => onAddClick(undefined, record)}
                  onDelete={() => handleDelete(record, refresh)}
                />
              ))}
            </div>
          </div>
        );
      }}
    </SectionScreenTemplate>
  );
};
