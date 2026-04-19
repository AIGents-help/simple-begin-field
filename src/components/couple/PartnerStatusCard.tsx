import React from 'react';
import { Heart, ArrowRight, Trophy } from 'lucide-react';
import { useCouple } from '../../hooks/useCouple';
import { useAppContext } from '../../context/AppContext';
import { PersonAvatar } from '../common/PersonAvatar';

const formatRelative = (iso: string | null | undefined) => {
  if (!iso) return 'Not yet active';
  const diff = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Active just now';
  if (minutes < 60) return `Active ${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Active ${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `Active ${days}d ago`;
  return `Active ${Math.floor(days / 30)}mo ago`;
};

interface PersonCardProps {
  name: string;
  photoPath: string | null;
  lastActiveIso: string | null | undefined;
  score: number | null;
  isLeader: boolean;
}

const PersonCard: React.FC<PersonCardProps> = ({ name, photoPath, lastActiveIso, score, isLeader }) => (
  <div className="rounded-xl border border-stone-200 bg-white px-3 py-2.5 shadow-sm min-w-0">
    <div className="flex items-center gap-2 min-w-0">
      <div className="relative shrink-0">
        <PersonAvatar photoPath={photoPath} name={name} size={40} ring />
        {isLeader && (
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center shadow-sm">
            <Trophy size={9} />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-bold text-navy-muted truncate leading-tight">{name}</p>
        <p className="text-[10px] text-stone-400 leading-tight truncate">{formatRelative(lastActiveIso)}</p>
      </div>
    </div>
    <div className="my-2 border-t border-stone-100" />
    <div className="flex items-baseline gap-1.5">
      {score !== null ? (
        <span className="text-[22px] font-serif font-bold text-navy-muted leading-none">{score}</span>
      ) : (
        <span className="text-base text-stone-400 italic leading-none">—</span>
      )}
      <span className="text-[9px] font-bold uppercase tracking-widest text-stone-400">Health</span>
    </div>
  </div>
);

export const PartnerStatusCard: React.FC = () => {
  const { setView, user, profile, userDisplayName } = useAppContext();
  const { link, partner, partnerHealthScore, myHealthScore, loading } = useCouple();

  if (loading || !link || link.status !== 'active' || !partner || !user) return null;

  const myName = userDisplayName || profile?.full_name || user.email || 'You';
  const myLastActive = profile?.last_login_at || profile?.updated_at || null;
  const myPhoto = (profile as any)?.avatar_path ?? null;

  const myScore = myHealthScore;
  const partnerScore = partnerHealthScore;

  let leadCopy: string | null = null;
  let myLead = false;
  let partnerLead = false;
  if (typeof myScore === 'number' && typeof partnerScore === 'number') {
    const diff = myScore - partnerScore;
    if (diff > 0) {
      leadCopy = `You're ${diff} point${diff === 1 ? '' : 's'} ahead`;
      myLead = true;
    } else if (diff < 0) {
      const d = Math.abs(diff);
      leadCopy = `${partner.full_name?.split(' ')[0] || 'Your partner'} is ${d} point${d === 1 ? '' : 's'} ahead`;
      partnerLead = true;
    } else {
      leadCopy = "You're tied";
    }
  }

  return (
    <div className="rounded-2xl border border-stone-200 bg-gradient-to-br from-rose-50/40 via-white to-white px-4 py-3 shadow-sm">
      {/* Header row */}
      <div className="flex items-center justify-between gap-3 mb-2">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-rose-100 text-rose-600 flex items-center justify-center">
            <Heart size={12} />
          </div>
          <h2 className="text-sm font-serif font-bold text-navy-muted">Our Packet</h2>
          {leadCopy && (
            <span className="ml-1 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800">
              <Trophy size={10} />
              {leadCopy}
            </span>
          )}
        </div>
        <button
          onClick={() => setView('profile')}
          className="text-[10px] uppercase font-bold tracking-widest text-stone-500 hover:text-navy-muted shrink-0"
        >
          Manage
        </button>
      </div>

      {/* 3-column grid: person | VS | person */}
      <div
        className="grid items-center"
        style={{ gridTemplateColumns: '1fr auto 1fr', gap: '8px' }}
      >
        <PersonCard
          name={myName}
          photoPath={myPhoto}
          lastActiveIso={myLastActive}
          score={typeof myScore === 'number' ? myScore : null}
          isLeader={myLead}
        />
        <span
          className="text-stone-400"
          style={{ fontSize: '11px', fontWeight: 500, letterSpacing: '0.08em' }}
        >
          VS
        </span>
        <PersonCard
          name={partner.full_name || partner.email || 'Partner'}
          photoPath={partner.avatar_path}
          lastActiveIso={partner.last_login_at}
          score={typeof partnerScore === 'number' ? partnerScore : null}
          isLeader={partnerLead}
        />
      </div>

      <button
        onClick={() => setView('profile')}
        className="mt-2 w-full flex items-center justify-center gap-1.5 py-1 text-[11px] font-bold text-stone-500 hover:text-navy-muted transition-colors"
      >
        Sharing settings
        <ArrowRight size={12} />
      </button>
    </div>
  );
};
