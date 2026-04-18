import React, { useEffect, useState } from 'react';
import { Input } from '@/components/ui/input';

export const GENDER_PRESETS = ['Male', 'Female', 'Non-binary', 'Prefer not to say'];

interface GenderSelectProps {
  value: string;
  onChange: (value: string) => void;
  className?: string;
  id?: string;
}

/**
 * Standardized gender selector used across all sections.
 * Renders a dropdown with: Select, Male, Female, Non-binary, Prefer not to say, Custom.
 * Choosing "Custom" reveals a free-text input for the user to type a value.
 */
export const GenderSelect: React.FC<GenderSelectProps> = ({ value, onChange, className, id }) => {
  const isPreset = !value || GENDER_PRESETS.includes(value);
  const [mode, setMode] = useState<string>(isPreset ? (value || '') : 'Custom');
  const [customValue, setCustomValue] = useState<string>(isPreset ? '' : value);

  // Keep internal state in sync if parent value changes externally (e.g. record load)
  useEffect(() => {
    if (!value) {
      setMode('');
      setCustomValue('');
    } else if (GENDER_PRESETS.includes(value)) {
      setMode(value);
      setCustomValue('');
    } else {
      setMode('Custom');
      setCustomValue(value);
    }
  }, [value]);

  const handleSelect = (next: string) => {
    setMode(next);
    if (next === 'Custom') {
      onChange(customValue || '');
    } else {
      setCustomValue('');
      onChange(next);
    }
  };

  const handleCustom = (next: string) => {
    setCustomValue(next);
    onChange(next);
  };

  return (
    <div className={className}>
      <select
        id={id}
        value={mode}
        onChange={(e) => handleSelect(e.target.value)}
        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
      >
        <option value="">Select…</option>
        {GENDER_PRESETS.map((g) => (
          <option key={g} value={g}>{g}</option>
        ))}
        <option value="Custom">Custom…</option>
      </select>
      {mode === 'Custom' && (
        <Input
          value={customValue}
          placeholder="Enter gender"
          onChange={(e) => handleCustom(e.target.value)}
          className="mt-2"
        />
      )}
    </div>
  );
};
