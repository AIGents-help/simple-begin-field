import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { estateSummaryService, EstateLiability, LIABILITY_TYPES } from '@/services/estateSummaryService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  packetId: string;
  userId: string;
  liability?: EstateLiability | null;
  onSaved: () => void;
}

export const LiabilityFormModal: React.FC<Props> = ({ isOpen, onClose, packetId, userId, liability, onSaved }) => {
  const [form, setForm] = useState({
    liability_type: 'Mortgage',
    lender_name: '',
    balance: '',
    monthly_payment: '',
    interest_rate: '',
    payoff_date: '',
    notes: '',
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm({
        liability_type: liability?.liability_type || 'Mortgage',
        lender_name: liability?.lender_name || '',
        balance: liability?.balance != null ? String(liability.balance) : '',
        monthly_payment: liability?.monthly_payment != null ? String(liability.monthly_payment) : '',
        interest_rate: liability?.interest_rate != null ? String(liability.interest_rate) : '',
        payoff_date: liability?.payoff_date || '',
        notes: liability?.notes || '',
      });
    }
  }, [isOpen, liability]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!form.liability_type || !form.balance) {
      toast.error('Liability type and balance are required.', { position: 'bottom-center' });
      return;
    }
    setSaving(true);
    try {
      await estateSummaryService.upsertLiability({
        id: liability?.id,
        packet_id: packetId,
        user_id: userId,
        liability_type: form.liability_type,
        lender_name: form.lender_name.trim() || null,
        balance: Number(form.balance) || 0,
        monthly_payment: form.monthly_payment ? Number(form.monthly_payment) : null,
        interest_rate: form.interest_rate ? Number(form.interest_rate) : null,
        payoff_date: form.payoff_date || null,
        notes: form.notes.trim() || null,
      });
      toast.success(liability ? 'Liability updated.' : 'Liability added.', { position: 'bottom-center' });
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('[LiabilityFormModal] save error:', err);
      toast.error(`Failed to save: ${err.message || 'Unknown error'}`, { position: 'bottom-center', duration: 4500 });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div className="bg-white rounded-t-2xl sm:rounded-2xl shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-stone-100 sticky top-0 bg-white z-10">
          <h3 className="text-lg font-bold text-navy-muted">{liability ? 'Edit Liability' : 'Add Liability'}</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
            <X size={16} />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Liability Type *</label>
            <select
              value={form.liability_type}
              onChange={(e) => setForm({ ...form, liability_type: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
            >
              {LIABILITY_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Lender Name</label>
            <input
              type="text"
              value={form.lender_name}
              onChange={(e) => setForm({ ...form, lender_name: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
              placeholder="Wells Fargo, Chase, etc."
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Outstanding Balance *</label>
            <input
              type="number"
              inputMode="decimal"
              value={form.balance}
              onChange={(e) => setForm({ ...form, balance: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
              placeholder="50000"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Monthly Payment</label>
              <input
                type="number"
                inputMode="decimal"
                value={form.monthly_payment}
                onChange={(e) => setForm({ ...form, monthly_payment: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
              />
            </div>
            <div>
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Interest Rate (%)</label>
              <input
                type="number"
                inputMode="decimal"
                step="0.01"
                value={form.interest_rate}
                onChange={(e) => setForm({ ...form, interest_rate: e.target.value })}
                className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
              />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Payoff Date</label>
            <input
              type="date"
              value={form.payoff_date}
              onChange={(e) => setForm({ ...form, payoff_date: e.target.value })}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
            />
          </div>
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-1 block">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              className="w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:border-navy-muted"
            />
          </div>
        </div>
        <div className="p-5 border-t border-stone-100 sticky bottom-0 bg-white">
          <button
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {saving ? <Loader2 className="animate-spin" size={16} /> : null}
            {liability ? 'Save Changes' : 'Add Liability'}
          </button>
        </div>
      </div>
    </div>
  );
};
