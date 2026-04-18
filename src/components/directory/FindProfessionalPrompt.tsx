import React from 'react';
import { Search, ArrowRight } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';

interface FindProfessionalPromptProps {
  /** Search term to pre-populate in the directory */
  query: string | null | undefined;
  /** Visual variant — `inline` for inside cards, `block` for empty states */
  variant?: 'inline' | 'block';
  /** Optional override for the helper sentence */
  message?: string;
}

/**
 * Subtle prompt encouraging the user to find a qualified professional.
 * Tapping it navigates to the Find a Professional directory and pre-populates
 * the search field with the given query (auto-executes on arrival).
 *
 * Renders nothing if no query is provided.
 */
export const FindProfessionalPrompt: React.FC<FindProfessionalPromptProps> = ({
  query,
  variant = 'inline',
  message = 'Need help with this? Find a qualified professional',
}) => {
  const { setView, setDirectoryQuery } = useAppContext() as any;

  if (!query) return null;

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDirectoryQuery?.(query);
    setView('directory');
  };

  if (variant === 'block') {
    return (
      <div className="mt-6 pt-5 border-t border-stone-100 flex flex-col items-center text-center gap-2">
        <p className="text-xs italic text-stone-400">{message}</p>
        <button
          type="button"
          onClick={handleClick}
          className="min-h-[44px] inline-flex items-center gap-1.5 px-3 text-xs font-bold text-navy-muted hover:text-amber-700 transition-colors"
        >
          <Search size={13} className="opacity-70" />
          <span>Find a Professional</span>
          <ArrowRight size={13} className="opacity-70" />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-3 pt-3 border-t border-stone-100/70 flex flex-wrap items-center justify-between gap-2">
      <p className="text-[11px] italic text-stone-400 leading-snug">{message}</p>
      <button
        type="button"
        onClick={handleClick}
        className="min-h-[36px] inline-flex items-center gap-1 text-[11px] font-bold text-navy-muted hover:text-amber-700 transition-colors"
        aria-label={`Find a professional for ${query}`}
      >
        <Search size={11} className="opacity-70" />
        <span>Find a Professional</span>
        <ArrowRight size={11} />
      </button>
    </div>
  );
};
