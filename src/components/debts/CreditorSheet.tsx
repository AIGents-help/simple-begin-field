import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface CreditorSheetProps {
  isOpen: boolean;
  onClose: () => void;
  packetId: string | null | undefined;
  initialName?: string | null;
  existingCreditors?: string[];
  onSaved: (creditorName: string, isNew?: boolean) => void;
  mode: 'create' | 'edit';
}

export const CreditorSheet: React.FC<CreditorSheetProps> = ({
  isOpen,
  onClose,
  packetId,
  initialName,
  existingCreditors = [],
  onSaved,
  mode,
}) => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setDuplicateConfirm(null);
    }
  }, [isOpen, initialName]);

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Creditor name is required.', { duration: 4000, position: 'bottom-center' });
      return;
    }

    if (mode === 'create' && !duplicateConfirm) {
      const dupe = existingCreditors.find(
        (n) => (n || '').toLowerCase().trim() === trimmed.toLowerCase()
      );
      if (dupe) {
        setDuplicateConfirm(dupe);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'edit' && packetId && initialName && trimmed !== initialName) {
        // Rename across all debts at this creditor
        const { error } = await supabase
          .from('estate_liabilities')
          .update({ lender_name: trimmed })
          .eq('packet_id', packetId)
          .eq('lender_name', initialName);
        if (error) throw error;
        toast.success('Creditor updated.', { duration: 3000, position: 'bottom-center' });
        onSaved(trimmed, false);
      } else {
        // Create flow: signal back to open the AddEditSheet for first debt entry
        onSaved(trimmed, true);
      }
      onClose();
    } catch (err: any) {
      console.error('Creditor save failed:', err);
      toast.error(err?.message || 'Failed to save creditor.', { duration: 4000, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed bottom-0 left-0 right-0 bg-stone-50 rounded-t-3xl z-50 max-h-[85vh] overflow-y-auto"
          >
            <div className="sticky top-0 bg-stone-50 border-b border-stone-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-navy-muted">
                {mode === 'edit' ? 'Edit Creditor' : 'Add Creditor'}
              </h2>
              <button onClick={onClose} className="p-1.5 hover:bg-stone-200 rounded-lg" aria-label="Close">
                <X size={20} className="text-stone-500" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {duplicateConfirm && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="flex-1 space-y-3">
                    <p className="text-sm text-amber-900 font-semibold">
                      You already have {duplicateConfirm}. Would you like to add a debt there instead?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          onSaved(duplicateConfirm, false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-muted text-white"
                      >
                        Add debt there
                      </button>
                      <button
                        onClick={() => setDuplicateConfirm(null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white text-navy-muted border border-stone-300"
                      >
                        Create anyway
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                  Creditor Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chase, Sallie Mae, IRS, Capital One"
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (duplicateConfirm) setDuplicateConfirm(null);
                  }}
                  disabled={loading}
                  autoFocus
                />
                {mode === 'edit' && (
                  <p className="text-[11px] text-stone-500 italic">
                    Renaming will apply to every debt account at this creditor.
                  </p>
                )}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-stone-600 border border-stone-300"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={loading || !name.trim()}
                  className="px-4 py-2.5 rounded-xl text-sm font-bold bg-navy-muted text-white flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {mode === 'edit' ? 'Save Changes' : 'Continue → Add First Debt'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
