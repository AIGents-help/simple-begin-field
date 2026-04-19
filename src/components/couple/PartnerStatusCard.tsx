import React from 'react';
import { Heart, ArrowRight, Trophy } from 'lucide-react';
import { useCouple } from '../../hooks/useCouple';
import { useAppContext } from '../../context/AppContext';

const initials = (name: string | null | undefined, email: string | null | undefined) => {
  const src = (name || email || '').trim();
  if (!src) return '??';
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  return src.substring(0, 2).toUpperCase();
};

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

interface PersonColumnProps {
  name: string;
  email: string | null;
  initialsText: string;
  lastActiveIso: string | null | undefined;
  score: number | null;
  isLeader: boolean;
}

const PersonColumn: React.FC<PersonColumnProps> = ({ name, email, initialsText, lastActiveIso, score, isLeader }) => (
  <div className="flex-1 min-w-0 flex flex-col items-center text-center px-2">
    <div className="relative">
      <div className="w-16 h-16 rounded-2xl bg-navy-muted text-manila flex items-center justify-center font-bold text-lg shrink-0">
        {initialsText}
      </div>
      {isLeader && (
        <div className="absolute -top-1.5 -right-1.5 w-6 h-6 rounded-full bg-amber-400 text-amber-900 flex items-center justify-center shadow-sm">
          <Trophy size={12} />
        </div>
      )}
    </div>
    <p className="mt-2 text-sm font-bold text-navy-muted truncate w-full">{name}</p>
    {email && <p className="text-[11px] text-stone-500 truncate w-full">{email}</p>}
    <p className="text-[11px] text-stone-400 mt-0.5">{formatRelative(lastActiveIso)}</p>
    <div className="mt-2">
      {score !== null ? (
        <>
          <p className="text-2xl font-serif font-bold text-navy-muted leading-none">{score}</p>
          <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Health</p>
        </>
      ) : (
        <p className="text-[11px] text-stone-400 italic">No score yet</p>
      )}
    </div>
  </div>
);

export const PartnerStatusCard: React.FC = () => {
  const { setView, user, profile, userDisplayName } = useAppContext();
  const { link, partner, partnerHealthScore, myHealthScore, loading } = useCouple();

  if (loading || !link || link.status !== 'active' || !partner || !user) return null;

  const myName = userDisplayName || profile?.full_name || user.email || 'You';
  const myEmail = user.email || null;
  const myLastActive = profile?.last_login_at || profile?.updated_at || null;

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
    <div className="rounded-3xl border border-stone-200 bg-gradient-to-br from-rose-50/40 via-white to-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-5">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-rose-100 text-rose-600 flex items-center justify-center">
            <Heart size={16} />
          </div>
          <h2 className="text-base font-serif font-bold text-navy-muted">Our Packet</h2>
        </div>
        <button
          onClick={() => setView('profile')}
          className="text-[10px] uppercase font-bold tracking-widest text-stone-500 hover:text-navy-muted"
        >
          Manage
        </button>
      </div>

      <div className="flex items-start gap-2">
        <PersonColumn
          name={myName}
          email={myEmail}
          initialsText={initials(myName, myEmail)}
          lastActiveIso={myLastActive}
          score={typeof myScore === 'number' ? myScore : null}
          isLeader={myLead}
        />
        <div className="self-center text-stone-300 text-xs font-bold">VS</div>
        <PersonColumn
          name={partner.full_name || partner.email || 'Partner'}
          email={partner.email}
          initialsText={initials(partner.full_name, partner.email)}
          lastActiveIso={partner.last_login_at}
          score={typeof partnerScore === 'number' ? partnerScore : null}
          isLeader={partnerLead}
        />
      </div>

      {leadCopy && (
        <div className="mt-4 flex justify-center">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-[11px] font-bold text-amber-800">
            <Trophy size={12} />
            {leadCopy}
          </span>
        </div>
      )}

      <button
        onClick={() => setView('profile')}
        className="mt-5 w-full flex items-center justify-center gap-2 py-2.5 bg-white border border-stone-200 rounded-xl text-xs font-bold text-navy-muted hover:border-navy-muted/40 transition-colors"
      >
        Sharing settings
        <ArrowRight size={14} />
      </button>
    </div>
  );
};
