import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  X, Heart, HeartCrack, Baby, Users, GitBranch, Crown, UserPlus, Sparkles,
  UserMinus, UsersRound, Footprints, GraduationCap, UserCog,
} from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  /** Called with a relationship key (e.g. 'Spouse', 'Child', 'Parent'). */
  onPick: (relationship: string) => void;
}

type Option = {
  rel: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string;
  bg: string;
};

// Ordered top-to-bottom, paired left/right per row.
const OPTIONS: Option[] = [
  // Row 1
  { rel: 'Spouse',        label: 'Spouse / Partner',     icon: Heart,         color: 'text-rose-500',    bg: 'bg-rose-50' },
  { rel: 'Ex-Spouse',     label: 'Ex-Spouse / Partner',  icon: HeartCrack,    color: 'text-stone-500',   bg: 'bg-stone-100' },
  // Row 2
  { rel: 'Child',         label: 'Child',                icon: Baby,          color: 'text-amber-600',   bg: 'bg-amber-50' },
  { rel: 'Grandchild',    label: 'Grandchild',           icon: GraduationCap, color: 'text-amber-700',   bg: 'bg-amber-50' },
  // Row 3
  { rel: 'Step-Child',    label: 'Step-Child',           icon: Footprints,    color: 'text-orange-600',  bg: 'bg-orange-50' },
  { rel: 'Step-Parent',   label: 'Step-Parent',          icon: UserCog,       color: 'text-orange-700',  bg: 'bg-orange-50' },
  // Row 4
  { rel: 'Parent',        label: 'Parent',               icon: Users,         color: 'text-blue-600',    bg: 'bg-blue-50' },
  { rel: 'Grandparent',   label: 'Grandparent',          icon: Crown,         color: 'text-violet-600',  bg: 'bg-violet-50' },
  // Row 5
  { rel: 'Sibling',       label: 'Sibling',              icon: GitBranch,     color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { rel: 'Step-Sibling',  label: 'Step-Sibling',         icon: GitBranch,     color: 'text-emerald-700', bg: 'bg-emerald-50' },
  // Row 6
  { rel: 'In-Law',        label: 'In-Law',               icon: UserPlus,      color: 'text-teal-600',    bg: 'bg-teal-50' },
  { rel: 'Cousin',        label: 'Cousin',               icon: UsersRound,    color: 'text-cyan-600',    bg: 'bg-cyan-50' },
  // Row 7
  { rel: 'Niece',         label: 'Niece',                icon: UserMinus,     color: 'text-pink-600',    bg: 'bg-pink-50' },
  { rel: 'Nephew',        label: 'Nephew',               icon: UserMinus,     color: 'text-indigo-600',  bg: 'bg-indigo-50' },
  // Row 8
  { rel: 'Other',         label: 'Other Family',         icon: Sparkles,      color: 'text-stone-600',   bg: 'bg-stone-100' },
];

export const AddFamilyMemberSheet: React.FC<Props> = ({ isOpen, onClose, onPick }) => {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-stone-50 rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
          >
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-white rounded-t-3xl">
              <h2 className="text-lg font-serif font-bold text-navy-muted">Add Family Member</h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>
            <div className="overflow-y-auto p-4">
              <p className="text-sm text-stone-500 mb-4">Pick a relationship to start. You can change details later.</p>
              <div className="grid grid-cols-2 gap-3">
                {OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.rel}
                      type="button"
                      onClick={() => onPick(opt.rel)}
                      className="p-4 bg-white border border-stone-200 rounded-2xl hover:border-navy-muted/50 hover:shadow-sm transition-all flex flex-col items-center gap-2 text-center"
                    >
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${opt.bg}`}>
                        <Icon size={22} className={opt.color} />
                      </div>
                      <span className="text-sm font-bold text-navy-muted">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
