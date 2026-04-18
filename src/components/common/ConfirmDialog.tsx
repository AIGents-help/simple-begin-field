import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, AlertTriangle } from 'lucide-react';

export interface ConfirmDialogProps {
  open: boolean;
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * App-wide confirmation modal.
 *
 * Replaces all native `window.confirm()` dialogs with a branded UI:
 *   • Dark blurred overlay
 *   • Cream/white card matching the rest of the app
 *   • Red trash icon for destructive actions
 *   • Heading + supportive copy
 *   • Cancel (outlined) + Delete (solid red) actions
 *
 * Use directly, or via `useConfirm()` for an imperative `await confirm(...)`
 * API that mirrors the previous `window.confirm` ergonomics.
 */
export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
  open,
  title = 'Delete this record?',
  description = 'This action cannot be undone.',
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  variant = 'danger',
  onConfirm,
  onCancel,
}) => {
  const Icon = variant === 'danger' ? Trash2 : AlertTriangle;

  // Close on Escape
  React.useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onCancel]);

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center px-5">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            onClick={onCancel}
            className="absolute inset-0 bg-stone-900/50 backdrop-blur-sm"
            aria-hidden="true"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="confirm-dialog-title"
            aria-describedby="confirm-dialog-description"
            className="relative w-full max-w-sm bg-[#fdfaf3] rounded-3xl shadow-2xl border border-stone-200 overflow-hidden"
          >
            <div className="px-6 pt-6 pb-4 text-center">
              <div className="mx-auto w-14 h-14 rounded-full bg-red-50 border border-red-100 flex items-center justify-center mb-4">
                <Icon size={26} className="text-red-500" />
              </div>
              <h2
                id="confirm-dialog-title"
                className="text-xl font-serif font-bold text-navy-muted mb-1.5"
              >
                {title}
              </h2>
              <p
                id="confirm-dialog-description"
                className="text-sm text-stone-500 leading-relaxed"
              >
                {description}
              </p>
            </div>
            <div className="px-5 pb-5 pt-2 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="py-3 rounded-2xl font-bold text-sm text-navy-muted bg-white border border-stone-200 hover:bg-stone-50 active:scale-[0.98] transition-all"
                autoFocus
              >
                {cancelLabel}
              </button>
              <button
                type="button"
                onClick={onConfirm}
                className="py-3 rounded-2xl font-bold text-sm text-white bg-red-600 hover:bg-red-700 shadow-sm active:scale-[0.98] transition-all"
              >
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
