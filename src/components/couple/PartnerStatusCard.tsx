import React from 'react';
import { Heart, ArrowRight, Activity } from 'lucide-react';
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

export const PartnerStatusCard: React.FC = () => {
  const { setView } = useAppContext();
  const { link, partner, partnerHealthScore, activity, loading } = useCouple();

  if (loading || !link || link.status !== 'active' || !partner) return null;

  const recent = activity.slice(0, 3);

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

      <div className="flex items-start gap-4">
        <div className="w-14 h-14 rounded-2xl bg-navy-muted text-manila flex items-center justify-center font-bold text-lg shrink-0">
          {initials(partner.full_name, partner.email)}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-navy-muted truncate">
            {partner.full_name || partner.email}
          </p>
          <p className="text-[11px] text-stone-500 truncate">{partner.email}</p>
          <p className="text-[11px] text-stone-400 mt-0.5">{formatRelative(partner.last_login_at)}</p>
        </div>
        <div className="text-right shrink-0">
          {partnerHealthScore !== null ? (
            <>
              <p className="text-2xl font-serif font-bold text-navy-muted leading-none">{partnerHealthScore}</p>
              <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">Health</p>
            </>
          ) : (
            <p className="text-[11px] text-stone-400 italic">No score yet</p>
          )}
        </div>
      </div>

      {recent.length > 0 && (
        <div className="mt-5 pt-5 border-t border-stone-100">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} className="text-stone-400" />
            <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">Recent activity</p>
          </div>
          <ul className="space-y-1.5">
            {recent.map((a) => (
              <li key={a.id} className="text-[12px] text-stone-600 flex items-center justify-between gap-2">
                <span className="truncate">
                  <span className="capitalize font-medium">{a.action_type}</span>
                  {a.section_key ? <span className="text-stone-400"> · {a.section_key}</span> : null}
                  {a.description ? <span className="text-stone-500"> — {a.description}</span> : null}
                </span>
              </li>
            ))}
          </ul>
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
