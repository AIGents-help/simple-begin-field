import React from 'react';
import { Heart, Cross } from 'lucide-react';

/**
 * LifeStatusToggle — a large mobile-friendly Living / Deceased segmented control.
 *
 * Used in Family, Pets, and Trusted Contacts sections. When the value flips to
 * "deceased", the parent should reveal optional date_of_death and notes fields.
 *
 * NOTE: This component is presentational. The parent decides whether to persist
 * immediately (e.g. inline list toggle) or wait for a save click (form context).
 */
export const LifeStatusToggle: React.FC<{
  value: boolean; // true = deceased
  onChange: (deceased: boolean) => void;
  livingLabel?: string;
  deceasedLabel?: string;
  disabled?: boolean;
}> = ({ value, onChange, livingLabel = 'Living', deceasedLabel = 'Deceased', disabled }) => {
  return (
    <div
      role="radiogroup"
      aria-label="Life status"
      className="inline-flex items-center bg-stone-100 rounded-xl p-1 gap-1 w-full"
    >
      <button
        type="button"
        role="radio"
        aria-checked={!value}
        disabled={disabled}
        onClick={() => onChange(false)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
          !value
            ? 'bg-emerald-600 text-white shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        } disabled:opacity-50`}
      >
        <Heart size={14} />
        {livingLabel}
      </button>
      <button
        type="button"
        role="radio"
        aria-checked={value}
        disabled={disabled}
        onClick={() => onChange(true)}
        className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
          value
            ? 'bg-stone-700 text-white shadow-sm'
            : 'text-stone-500 hover:text-stone-700'
        } disabled:opacity-50`}
      >
        <Cross size={14} />
        {deceasedLabel}
      </button>
    </div>
  );
};

/**
 * AdvisorStatusToggle — 4-state lifecycle selector for professional advisors.
 *
 * Active / Deceased / Retired / Former (no longer my advisor).
 */
export const AdvisorStatusToggle: React.FC<{
  value: string; // 'active' | 'deceased' | 'retired' | 'former'
  onChange: (status: string) => void;
  disabled?: boolean;
}> = ({ value, onChange, disabled }) => {
  const options = [
    { key: 'active', label: 'Active', tone: 'bg-emerald-600' },
    { key: 'retired', label: 'Retired', tone: 'bg-amber-600' },
    { key: 'former', label: 'Former', tone: 'bg-stone-500' },
    { key: 'deceased', label: 'Deceased', tone: 'bg-stone-700' },
  ];
  return (
    <div className="grid grid-cols-2 gap-2">
      {options.map((opt) => {
        const selected = value === opt.key;
        return (
          <button
            key={opt.key}
            type="button"
            role="radio"
            aria-checked={selected}
            disabled={disabled}
            onClick={() => onChange(opt.key)}
            className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
              selected
                ? `${opt.tone} text-white shadow-sm`
                : 'bg-stone-100 text-stone-500 hover:text-stone-700'
            } disabled:opacity-50`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
};
