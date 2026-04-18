import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

interface Props {
  value: string;
  onChange: (val: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

/**
 * Sensitive text input that masks its value by default.
 * Tap the eye icon to reveal. Used for serial numbers, safe codes, etc.
 */
export const MaskedInput: React.FC<Props> = ({ value, onChange, placeholder, disabled }) => {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="relative">
      <input
        type={revealed ? 'text' : 'password'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        className="w-full p-4 pr-12 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium tracking-wider"
      />
      <button
        type="button"
        onClick={() => setRevealed((r) => !r)}
        disabled={disabled}
        className="absolute right-3 top-1/2 -translate-y-1/2 p-2 text-stone-400 hover:text-navy-muted rounded-lg"
        aria-label={revealed ? 'Hide value' : 'Reveal value'}
      >
        {revealed ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};
