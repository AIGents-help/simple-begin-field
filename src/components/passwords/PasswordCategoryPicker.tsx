import React from 'react';
import { X, Mail, Banknote, Users, Landmark, HeartPulse, ShoppingBag, Tv, Briefcase, TrendingUp, Bitcoin, MoreHorizontal } from 'lucide-react';
import { PasswordCategory } from '../../services/passwordService';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (cat: PasswordCategory) => void;
}

const QUICK_PICKS: { value: PasswordCategory; label: string; icon: any; hint: string }[] = [
  { value: 'email', label: 'Email Account', icon: Mail, hint: 'Gmail, Outlook, iCloud' },
  { value: 'banking', label: 'Banking Login', icon: Banknote, hint: 'Bank, credit card portal' },
  { value: 'social', label: 'Social Media', icon: Users, hint: 'Facebook, Instagram, X' },
  { value: 'streaming', label: 'Streaming Service', icon: Tv, hint: 'Netflix, Spotify, Disney+' },
  { value: 'government', label: 'Government Account', icon: Landmark, hint: 'IRS, SSA, DMV' },
  { value: 'medical', label: 'Medical Portal', icon: HeartPulse, hint: 'MyChart, insurance' },
  { value: 'investment', label: 'Investment Account', icon: TrendingUp, hint: 'Brokerage, retirement' },
  { value: 'crypto', label: 'Crypto Account', icon: Bitcoin, hint: 'Exchange, wallet' },
  { value: 'work', label: 'Work Account', icon: Briefcase, hint: 'Email, VPN, tools' },
  { value: 'shopping', label: 'Shopping', icon: ShoppingBag, hint: 'Amazon, eBay' },
  { value: 'other', label: 'Other', icon: MoreHorizontal, hint: 'Anything else' },
];

export const PasswordCategoryPicker: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-md max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div>
            <h3 className="font-bold text-navy-muted">Add Password Entry</h3>
            <p className="text-xs text-stone-500 mt-0.5">Choose a category to get started</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-stone-100">
            <X size={18} className="text-stone-500" />
          </button>
        </div>
        <div className="overflow-y-auto p-3">
          <div className="grid grid-cols-2 gap-2">
            {QUICK_PICKS.map((p) => {
              const Icon = p.icon;
              return (
                <button
                  key={p.value}
                  onClick={() => onSelect(p.value)}
                  className="text-left p-3 rounded-2xl border border-stone-200 hover:border-navy-muted hover:bg-stone-50 transition"
                >
                  <Icon size={20} className="text-navy-muted mb-1.5" />
                  <p className="text-xs font-bold text-navy-muted">{p.label}</p>
                  <p className="text-[10px] text-stone-500 mt-0.5 leading-tight">{p.hint}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
