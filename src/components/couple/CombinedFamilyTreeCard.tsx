import React, { useEffect, useState } from 'react';
import { Users, Loader2 } from 'lucide-react';
import { coupleService, CombinedFamilyMember } from '../../services/coupleService';
import { useCouple } from '../../hooks/useCouple';

export const CombinedFamilyTreeCard: React.FC = () => {
  const { link, partner, loading: coupleLoading } = useCouple();
  const [members, setMembers] = useState<CombinedFamilyMember[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coupleLoading || !link || link.status !== 'active') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    coupleService.getCombinedFamilyTree().then((rows) => {
      if (!cancelled) {
        setMembers(rows);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [coupleLoading, link]);

  if (coupleLoading || !link || link.status !== 'active') return null;

  const mine = members.filter((m) => m.owner_side === 'me');
  const theirs = members.filter((m) => m.owner_side === 'partner');

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center gap-2 mb-5">
        <div className="w-8 h-8 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
          <Users size={16} />
        </div>
        <div>
          <h3 className="text-base font-serif font-bold text-navy-muted">Combined Family Tree</h3>
          <p className="text-[11px] text-stone-500">Both families, side by side</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-8 text-stone-400">
          <Loader2 className="animate-spin mr-2" size={16} /> Loading...
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <FamilyColumn
            title="Your family"
            tone="bg-sky-50 text-sky-700 border-sky-200"
            members={mine}
          />
          <FamilyColumn
            title={`${partner?.full_name?.split(' ')[0] || 'Partner'}'s family`}
            tone="bg-rose-50 text-rose-700 border-rose-200"
            members={theirs}
            emptyHint="Partner hasn't shared family records, or has none yet."
          />
        </div>
      )}
    </div>
  );
};

const FamilyColumn: React.FC<{
  title: string;
  tone: string;
  members: CombinedFamilyMember[];
  emptyHint?: string;
}> = ({ title, tone, members, emptyHint }) => (
  <div>
    <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-2">{title}</p>
    {members.length === 0 ? (
      <p className="text-[11px] text-stone-400 italic py-3">{emptyHint || 'No family members yet.'}</p>
    ) : (
      <ul className="space-y-1.5">
        {members.slice(0, 8).map((m) => (
          <li key={m.id} className={`flex items-center justify-between gap-2 px-2.5 py-1.5 rounded-lg border text-[11px] ${tone}`}>
            <span className="truncate font-medium">{m.name}</span>
            {m.relationship && <span className="text-[10px] opacity-70 shrink-0">{m.relationship}</span>}
          </li>
        ))}
        {members.length > 8 && (
          <li className="text-[10px] text-stone-400 italic px-2 pt-1">+{members.length - 8} more</li>
        )}
      </ul>
    )}
  </div>
);
