import React from 'react';
import { Link2, X } from 'lucide-react';
import { cn } from '@/lib/utils';

type Props = {
  /** Where the value originated, e.g. "Spouse" or "Advisors → Attorney" */
  sourceLabel: string;
  /** Optional clear handler — when present, shows an X to remove the auto-fill */
  onClear?: () => void;
  className?: string;
};

/**
 * Subtle chip rendered next to (or under) a form field that was pre-populated
 * via cross-section federation. Uses semantic muted tokens so it stays quiet
 * on mobile and never dominates the field visually.
 */
export const AutoFilledIndicator: React.FC<Props> = ({ sourceLabel, onClear, className }) => {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2 py-0.5 text-[10px] font-medium text-muted-foreground',
        className,
      )}
    >
      <Link2 className="h-3 w-3" aria-hidden="true" />
      <span>Auto-filled from {sourceLabel}</span>
      {onClear ? (
        <button
          type="button"
          onClick={onClear}
          aria-label={`Clear value auto-filled from ${sourceLabel}`}
          className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/10"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </span>
  );
};
