import React from 'react';
import { Scale, Calculator, TrendingUp, Shield, Home as HomeIcon, Stethoscope, UserPlus } from 'lucide-react';
import { type AdvisorKind, KIND_LABELS } from '@/services/advisorService';

interface Props {
  onPick: (kind: AdvisorKind) => void;
  className?: string;
}

const KIND_ORDER: AdvisorKind[] = ['attorney', 'cpa', 'financial', 'insurance', 'realtor', 'doctor', 'other'];

const KIND_ICON: Record<AdvisorKind, React.ElementType> = {
  attorney: Scale,
  cpa: Calculator,
  financial: TrendingUp,
  insurance: Shield,
  realtor: HomeIcon,
  doctor: Stethoscope,
  other: UserPlus,
};

/** Chip row used for "Add advisor" — multi-instance, none grayed. */
export const AdvisorKindPicker: React.FC<Props> = ({ onPick, className = '' }) => (
  <div className={`flex flex-wrap gap-2 ${className}`}>
    {KIND_ORDER.map((k) => {
      const Icon = KIND_ICON[k];
      return (
        <button
          key={k}
          type="button"
          onClick={() => onPick(k)}
          className="px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300 inline-flex items-center gap-1.5"
          title={`Add ${KIND_LABELS[k]}`}
        >
          <Icon className="h-3.5 w-3.5" />
          + {KIND_LABELS[k]}
        </button>
      );
    })}
  </div>
);
