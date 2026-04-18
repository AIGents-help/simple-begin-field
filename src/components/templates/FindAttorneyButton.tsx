import React from 'react';
import { Scale } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

export const FindAttorneyButton: React.FC<{ className?: string; label?: string }> = ({
  className = '',
  label = 'Find an Attorney',
}) => {
  const { setView, setDirectoryQuery } = useAppContext();
  return (
    <button
      onClick={() => {
        setDirectoryQuery('Estate Planning Attorney');
        setView('directory');
      }}
      className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-navy-muted text-white text-sm font-semibold hover:bg-navy-muted/90 transition ${className}`}
    >
      <Scale className="w-4 h-4" />
      {label}
    </button>
  );
};
