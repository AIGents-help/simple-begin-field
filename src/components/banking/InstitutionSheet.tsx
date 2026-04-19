import React, { useEffect, useState } from 'react';
import { X, Save, Loader2, AlertTriangle } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface InstitutionSheetProps {
  isOpen: boolean;
  onClose: () => void;
  packetId: string | null | undefined;
  /** When provided, edits an existing institution (renames + updates routing on all child accounts). */
  initialName?: string | null;
  initialRouting?: string | null;
  /** Existing institution names (for duplicate detection on create). */
  existingInstitutions?: string[];
  /** Called after a successful create or edit. */
  onSaved: (institutionName: string, routing?: string | null, isNew?: boolean) => void;
  /** Mode: 'create' opens fresh; 'edit' edits existing. */
  mode: 'create' | 'edit';
}

export const InstitutionSheet: React.FC<InstitutionSheetProps> = ({
  isOpen,
  onClose,
  packetId,
  initialName,
  initialRouting,
  existingInstitutions = [],
  onSaved,
  mode,
}) => {
  const [name, setName] = useState('');
  const [routing, setRouting] = useState('');
  const [loading, setLoading] = useState(false);
  const [duplicateConfirm, setDuplicateConfirm] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || '');
      setRouting(initialRouting || '');
      setDuplicateConfirm(null);
    }
  }, [isOpen, initialName, initialRouting]);

  const normalizedExisting = existingInstitutions
    .filter((n) => n && (mode !== 'edit' || n.toLowerCase() !== (initialName || '').toLowerCase()))
    .map((n) => n.toLowerCase().trim());

  const handleSave = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Institution name is required.', { duration: 4000, position: 'bottom-center' });
      return;
    }

    // Duplicate detection (create only)
    if (mode === 'create' && !duplicateConfirm) {
      const dupe = existingInstitutions.find(
        (n) => (n || '').toLowerCase().trim() === trimmed.toLowerCase()
      );
      if (dupe) {
        setDuplicateConfirm(dupe);
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === 'edit' && packetId && initialName) {
        // Rename + update routing on all accounts at this institution
        const updates: any = {};
        if (trimmed !== initialName) updates.institution = trimmed;
        updates.routing_number_masked = routing.trim() || null;

        const { error } = await supabase
          .from('banking_records')
          .update(updates)
          .eq('packet_id', packetId)
          .eq('institution', initialName);

        if (error) throw error;
        toast.success('Institution updated.', { duration: 3000, position: 'bottom-center' });
        onSaved(trimmed, routing.trim() || null, false);
      } else {
        // Create flow: just signal back; the parent will open the AddEditSheet for the first account
        onSaved(trimmed, routing.trim() || null, true);
      }
      onClose();
    } catch (err: any) {
      console.error('Institution save failed:', err);
      toast.error(err?.message || 'Failed to save institution.', { duration: 4000, position: 'bottom-center' });
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
                {mode === 'edit' ? 'Edit Institution' : 'Add Institution'}
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
                      You already have {duplicateConfirm}. Would you like to add an account there instead?
                    </p>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => {
                          // Close this sheet and tell parent to add account at the existing institution
                          onSaved(duplicateConfirm, null, false);
                          onClose();
                        }}
                        className="px-3 py-1.5 rounded-lg text-xs font-bold bg-navy-muted text-white"
                      >
                        Add account there
                      </button>
                      <button
                        onClick={() => {
                          // Force-create a second institution with the same name
                          setDuplicateConfirm(null);
                          // Save will be called again via the main button; user must click Save again
                        }}
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
                  Institution Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Chase, Wells Fargo, Venmo"
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    if (duplicateConfirm) setDuplicateConfirm(null);
                  }}
                  disabled={loading}
                  autoFocus
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                  Routing Number (optional)
                </label>
                <input
                  type="text"
                  placeholder="9-digit routing number"
                  className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                  value={routing}
                  onChange={(e) => setRouting(e.target.value)}
                  disabled={loading}
                />
                {mode === 'edit' && (
                  <p className="text-[11px] text-stone-500 italic">
                    Updating the routing number will apply it to every account at this institution.
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
                  {mode === 'edit' ? 'Save Changes' : 'Continue → Add First Account'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
