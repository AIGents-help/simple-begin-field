import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Plus, Loader2, Lightbulb } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmDialogContext';
import { CategoryOption } from '../components/upload/types';
import { passwordService, PASSWORD_MANAGER_CATEGORY, PasswordCategory } from '../services/passwordService';

import { SecurityNoteBanner } from '../components/passwords/SecurityNoteBanner';
import { PasswordManagerCard } from '../components/passwords/PasswordManagerCard';
import { PasswordCategoryTabs } from '../components/passwords/PasswordCategoryTabs';
import { PasswordEntryCard } from '../components/passwords/PasswordEntryCard';
import { PasswordCategoryPicker } from '../components/passwords/PasswordCategoryPicker';
import { DigitalAssetSummaryCard } from '../components/passwords/DigitalAssetSummaryCard';

export const PasswordsSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick?: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { currentPacket, bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<PasswordCategory | 'all'>('all');
  const [pickerOpen, setPickerOpen] = useState(false);

  const fetchAll = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const { data, error } = await passwordService.listAll(currentPacket.id);
    if (error) {
      toast.error(`Could not load passwords: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setRecords(data || []);
    }
    setLoading(false);
  }, [currentPacket?.id]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  useEffect(() => {
    if (onRefresh) onRefresh(() => fetchAll());
  }, [onRefresh, fetchAll]);

  // Split manager (sentinel) vs entries
  const manager = useMemo(
    () => records.find((r) => r.category === PASSWORD_MANAGER_CATEGORY) || null,
    [records]
  );
  const entries = useMemo(
    () => records.filter((r) => r.category !== PASSWORD_MANAGER_CATEGORY),
    [records]
  );

  // Counts per category
  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const r of entries) {
      const k = r.category || 'other';
      c[k] = (c[k] || 0) + 1;
    }
    return c;
  }, [entries]);

  const filtered = filter === 'all' ? entries : entries.filter((r) => r.category === filter);

  const handleManagerSaved = (rec: any) => {
    setRecords((prev) => {
      const without = prev.filter((r) => r.id !== rec.id);
      return [rec, ...without];
    });
    bumpCompletion();
  };

  const handleEntrySaved = (rec: any) => {
    setRecords((prev) => {
      const without = prev.filter((r) => r.id !== rec.id);
      return [rec, ...without];
    });
    bumpCompletion();
  };

  const handleDelete = async (record: any) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this entry?',
      description: `Delete access info for "${record.service_name || 'this account'}"? This cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await passwordService.remove(record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    setRecords((prev) => prev.filter((r) => r.id !== record.id));
    bumpCompletion();
    toast.success('Entry deleted.', { duration: 2500, position: 'bottom-center' });
  };

  const handleAddCategory = async (cat: PasswordCategory) => {
    setPickerOpen(false);
    if (!currentPacket?.id) return;
    // Create a stub row so the user immediately sees the new card in edit mode.
    const { data, error } = await passwordService.save(currentPacket.id, {
      service_name: '',
      category: cat,
      scope: 'shared',
    });
    if (error) {
      toast.error(`Could not create: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    setRecords((prev) => [data, ...prev]);
    setFilter(cat);
  };

  if (loading) {
    return (
      <div className="p-6 pb-32 flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Loading passwords…</p>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-4">
      <div>
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">Passwords & Access</h2>
        <p className="text-sm text-stone-500">
          Account hints, recovery info, and instructions for trusted contacts. Never store actual passwords here.
        </p>
      </div>

      <PasswordManagerCard
        packetId={currentPacket!.id}
        record={manager}
        onSaved={handleManagerSaved}
      />

      <SecurityNoteBanner />

      <div className="flex items-center justify-between gap-3 pt-2">
        <PasswordCategoryTabs active={filter} counts={counts} onChange={setFilter} />
        <button
          onClick={() => setPickerOpen(true)}
          className="px-3 py-1.5 rounded-full bg-navy-muted text-white text-[11px] font-bold flex items-center gap-1.5 shrink-0"
        >
          <Plus size={13} /> Add Entry
        </button>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
          <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mb-3">
            <Lightbulb size={26} className="text-amber-500" />
          </div>
          <h3 className="text-base font-bold text-navy-muted mb-2">No password entries yet.</h3>
          <p className="text-xs text-stone-500 mb-5 max-w-sm">
            Consider using a password manager like 1Password or Bitwarden to store actual passwords securely.
            Add a hint or location entry here so trusted contacts know where to look.
          </p>
          <button
            onClick={() => setPickerOpen(true)}
            className="px-5 py-2.5 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={16} /> Add First Entry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <PasswordEntryCard
              key={r.id}
              packetId={currentPacket!.id}
              record={r}
              onSaved={handleEntrySaved}
              onDelete={() => handleDelete(r)}
            />
          ))}
          {filtered.length === 0 && (
            <p className="text-center text-xs text-stone-400 italic py-6">
              No entries in this category.
            </p>
          )}
        </div>
      )}

      <DigitalAssetSummaryCard records={entries} />

      <PasswordCategoryPicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleAddCategory}
      />
    </div>
  );
};
