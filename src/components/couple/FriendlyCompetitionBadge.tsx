import React from 'react';
import { Trophy, Heart } from 'lucide-react';
import { useCouple } from '../../hooks/useCouple';

export const FriendlyCompetitionBadge: React.FC = () => {
  const { link, partner, partnerHealthScore, myHealthScore, loading } = useCouple();

  if (loading || !link || link.status !== 'active' || partnerHealthScore === null || myHealthScore === null) return null;

  const diff = myHealthScore - partnerHealthScore;
  const partnerName = partner?.full_name?.split(' ')[0] || 'Partner';

  let tone = 'bg-stone-50 border-stone-200 text-stone-700';
  let icon = <Heart size={14} className="text-rose-500" />;
  let message = `You're tied with ${partnerName} at ${myHealthScore}/100. 🤝`;

  if (diff > 0) {
    tone = 'bg-emerald-50 border-emerald-200 text-emerald-800';
    icon = <Trophy size={14} className="text-emerald-600" />;
    message = `You're ${diff} point${diff === 1 ? '' : 's'} ahead of ${partnerName}.`;
  } else if (diff < 0) {
    tone = 'bg-amber-50 border-amber-200 text-amber-800';
    icon = <Trophy size={14} className="text-amber-600" />;
    message = `${partnerName} is ${Math.abs(diff)} point${Math.abs(diff) === 1 ? '' : 's'} ahead. Catch up!`;
  }

  return (
    <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${tone} text-[12px] font-medium`}>
      {icon}
      <span>{message}</span>
    </div>
  );
};
