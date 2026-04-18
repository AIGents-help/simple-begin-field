import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { ConfirmDialog } from '@/components/common/ConfirmDialog';

export interface ConfirmOptions {
  title?: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning';
}

type ConfirmFn = (options?: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

/**
 * App-wide imperative confirmation dialog.
 *
 *   const confirm = useConfirm();
 *   if (!(await confirm({ title: 'Delete this record?' }))) return;
 *
 * Drop-in replacement for `window.confirm()` — never blocks the JS thread
 * and always renders the branded `<ConfirmDialog />`.
 */
export const ConfirmDialogProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [open, setOpen] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions>({});
  const resolverRef = useRef<((value: boolean) => void) | null>(null);

  const confirm: ConfirmFn = useCallback((opts) => {
    setOptions(opts ?? {});
    setOpen(true);
    return new Promise<boolean>((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const handleResolve = useCallback((value: boolean) => {
    setOpen(false);
    const resolver = resolverRef.current;
    resolverRef.current = null;
    // Resolve after the close animation kicks off so callers see a clean unmount.
    if (resolver) resolver(value);
  }, []);

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <ConfirmDialog
        open={open}
        title={options.title}
        description={options.description}
        confirmLabel={options.confirmLabel}
        cancelLabel={options.cancelLabel}
        variant={options.variant}
        onCancel={() => handleResolve(false)}
        onConfirm={() => handleResolve(true)}
      />
    </ConfirmContext.Provider>
  );
};

export const useConfirm = (): ConfirmFn => {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    throw new Error('useConfirm must be used within a <ConfirmDialogProvider>');
  }
  return ctx;
};
