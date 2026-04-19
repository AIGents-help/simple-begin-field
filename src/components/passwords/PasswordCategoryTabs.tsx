import React from 'react';
import { PASSWORD_CATEGORIES, PasswordCategory } from '../../services/passwordService';

interface Props {
  active: PasswordCategory | 'all';
  counts: Record<string, number>;
  onChange: (cat: PasswordCategory | 'all') => void;
}

export const PasswordCategoryTabs: React.FC<Props> = ({ active, counts, onChange }) => {
  const totalCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const usedCategories = PASSWORD_CATEGORIES.filter((c) => (counts[c.value] || 0) > 0);

  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1">
      <button
        onClick={() => onChange('all')}
        className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
          active === 'all'
            ? 'bg-navy-muted text-white'
            : 'bg-white border border-stone-200 text-stone-600'
        }`}
      >
        All
        <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
          active === 'all' ? 'bg-white/20' : 'bg-stone-100 text-stone-500'
        }`}>{totalCount}</span>
      </button>
      {usedCategories.map((c) => (
        <button
          key={c.value}
          onClick={() => onChange(c.value)}
          className={`px-3 py-1.5 rounded-full text-[11px] font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
            active === c.value
              ? 'bg-navy-muted text-white'
              : 'bg-white border border-stone-200 text-stone-600'
          }`}
        >
          {c.label}
          <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
            active === c.value ? 'bg-white/20' : 'bg-stone-100 text-stone-500'
          }`}>{counts[c.value] || 0}</span>
        </button>
      ))}
    </div>
  );
};
