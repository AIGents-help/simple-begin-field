import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, X } from 'lucide-react';
import { CategoryOption } from './types';

interface CategorySelectorProps {
  options: CategoryOption[];
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  disabled?: boolean;
  label?: string;
  showOther?: boolean;
  otherValue?: string;
  onOtherValueChange?: (value: string) => void;
}

export const CategorySelector = ({
  options,
  value,
  onChange,
  required = false,
  disabled = false,
  label = 'Category',
  showOther = true,
  otherValue = '',
  onOtherValueChange
}: CategorySelectorProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const isOther = value === 'Other';
  const hasOtherInOptions = options.some(opt => opt.value === 'Other');
  
  const selectedOption = options.find(opt => opt.value === value);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (val: string) => {
    onChange(val);
    setIsOpen(false);
  };

  return (
    <div className="space-y-2 relative" ref={dropdownRef}>
      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
        {label} {required && <span className="text-red-400">*</span>}
      </label>
      
      <div className="space-y-3">
        <button
          type="button"
          disabled={disabled}
          onClick={() => setIsOpen(!isOpen)}
          className={`w-full p-4 rounded-2xl border flex items-center justify-between text-sm font-bold transition-all shadow-sm ${
            value 
              ? 'bg-navy-muted text-white border-navy-muted' 
              : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
          }`}
        >
          <span>{selectedOption?.label || value || 'Select a category...'}</span>
          <ChevronDown size={18} className={`transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </button>

        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-white border border-stone-100 rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto no-scrollbar py-2">
            {options.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={`w-full px-5 py-3 text-left text-sm font-medium hover:bg-stone-50 transition-colors ${
                  value === option.value ? 'text-navy-muted bg-stone-50 font-bold' : 'text-stone-600'
                }`}
              >
                {option.label}
              </button>
            ))}
            {showOther && !hasOtherInOptions && (
              <button
                type="button"
                onClick={() => handleSelect('Other')}
                className={`w-full px-5 py-3 text-left text-sm font-medium hover:bg-stone-50 transition-colors ${
                  value === 'Other' ? 'text-navy-muted bg-stone-50 font-bold' : 'text-stone-600'
                }`}
              >
                Other
              </button>
            )}
          </div>
        )}

        {isOther && onOtherValueChange && (
          <input
            type="text"
            value={otherValue}
            onChange={(e) => onOtherValueChange(e.target.value)}
            placeholder="Specify category..."
            className="w-full p-4 bg-white border border-stone-200 rounded-2xl text-sm font-medium focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
            required={required}
            disabled={disabled}
          />
        )}
      </div>
    </div>
  );
};
