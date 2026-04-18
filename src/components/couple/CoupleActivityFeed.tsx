import React, { useState } from 'react';
import { Activity, User as UserIcon } from 'lucide-react';
import { useCouple } from '../../hooks/useCouple';
import { useAppContext } from '../../context/AppContext';

type FilterMode = 'all' | 'me' | 'partner';

const formatTime = (iso: string) => {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}d ago`;
  return new Date(iso).toLocaleDateString();
};

export const CoupleActivityFeed: React.FC = () => {
  const { user } = useAppContext();
  const { link, partner, activity, loading } = useCouple();
  const [filter, setFilter] = useState<FilterMode>('all');

  if (loading || !link || link.status !== 'active') return null;

  const filtered = activity.filter((a) => {
    if (filter === 'all') return true;
    if (filter === 'me') return a.user_id === user?.id;
    return a.user_id !== user?.id;
  });

  const partnerName = partner?.full_name?.split(' ')[0] || 'Partner';

  return (
    <div className="rounded-3xl border border-stone-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-stone-100 text-stone-700 flex items-center justify-center">
            <Activity size={16} />
          </div>
          <h3 className="text-base font-serif font-bold text-navy-muted">Our activity</h3>
        </div>

        <div className="inline-flex bg-stone-100 rounded-lg p-0.5">
          {(['all', 'me', 'partner'] as FilterMode[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-2.5 py-1 text-[10px] uppercase font-bold tracking-wider rounded-md transition-colors ${
                filter === f ? 'bg-white text-navy-muted shadow-sm' : 'text-stone-500'
              }`}
            >
              {f === 'all' ? 'All' : f === 'me' ? 'Me' : partnerName}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <p className="text-[12px] text-stone-400 italic py-6 text-center">No activity yet.</p>
      ) : (
        <ul className="space-y-2.5">
          {filtered.slice(0, 12).map((a) => {
            const isMe = a.user_id === user?.id;
            return (
              <li key={a.id} className="flex items-start gap-3">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isMe ? 'bg-sky-100 text-sky-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <UserIcon size={12} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[12px] text-navy-muted">
                    <span className="font-bold">{isMe ? 'You' : partnerName}</span>{' '}
                    <span className="text-stone-600">{a.action_type}</span>
                    {a.section_key && <span className="text-stone-400"> · {a.section_key}</span>}
                    {a.description && <span className="text-stone-500"> — {a.description}</span>}
                  </p>
                  <p className="text-[10px] text-stone-400 mt-0.5">{formatTime(a.created_at)}</p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};
