import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface BackButtonProps {
  /** Optional explicit handler. If omitted, uses history.back() with a fallback to dashboard view. */
  onClick?: () => void;
  label?: string;
  className?: string;
}

/**
 * Standardized back button for full-page screens.
 * Ensures a 44px tap target for mobile accessibility.
 */
export const BackButton: React.FC<BackButtonProps> = ({ onClick, label = 'Back', className = '' }) => {
  const { setView } = useAppContext() as any;
  const handle = () => {
    if (onClick) return onClick();
    if (typeof window !== 'undefined' && window.history.length > 1) {
      window.history.back();
    } else {
      setView?.('dashboard');
    }
  };
  return (
    <button
      onClick={handle}
      aria-label={label}
      className={`inline-flex items-center gap-2 min-h-[44px] px-3 -ml-3 rounded-xl text-navy-muted hover:bg-stone-100 transition-colors font-bold text-sm ${className}`}
    >
      <ArrowLeft size={18} />
      <span>{label}</span>
    </button>
  );
};
