import React, { useEffect, useState, useRef } from 'react';
import { Bell, Check } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { coupleService, CoupleNotification } from '../../services/coupleService';
import { useCouple } from '../../hooks/useCouple';
import { toast } from 'sonner';

export const CoupleNotificationBell: React.FC = () => {
  const { user } = useAppContext();
  const { link } = useCouple();
  const [items, setItems] = useState<CoupleNotification[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async () => {
    if (!user) return;
    const [list, count] = await Promise.all([
      coupleService.getNotifications(user.id, 15),
      coupleService.getUnreadNotificationCount(user.id),
    ]);
    setItems(list);
    setUnread(count);
  };

  useEffect(() => {
    if (!user || !link || link.status !== 'active') return;
    void load();
    const t = setInterval(load, 60000);
    return () => clearInterval(t);
  }, [user, link]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  if (!user || !link || link.status !== 'active') return null;

  const handleMarkAll = async () => {
    try {
      await coupleService.markAllNotificationsRead(user.id);
      await load();
      toast.success('All caught up.', { duration: 1500, position: 'bottom-center' });
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark read.', { position: 'bottom-center' });
    }
  };

  const handleClick = async (n: CoupleNotification) => {
    if (!n.is_read) {
      try { await coupleService.markNotificationRead(n.id); } catch {}
    }
    setOpen(false);
    if (n.link_to) window.location.assign(n.link_to);
    void load();
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative w-10 h-10 rounded-xl bg-white border border-stone-200 hover:border-stone-300 flex items-center justify-center"
        aria-label="Partner notifications"
      >
        <Bell size={16} className="text-stone-700" />
        {unread > 0 && (
          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-rose-600 text-white text-[10px] font-bold flex items-center justify-center">
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 max-h-[420px] overflow-y-auto bg-white border border-stone-200 rounded-2xl shadow-xl z-50">
          <div className="px-4 py-3 border-b border-stone-100 flex items-center justify-between">
            <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Partner activity</p>
            {unread > 0 && (
              <button
                onClick={handleMarkAll}
                className="text-[10px] uppercase font-bold tracking-wider text-navy-muted hover:underline flex items-center gap-1"
              >
                <Check size={11} /> Mark all read
              </button>
            )}
          </div>

          {items.length === 0 ? (
            <p className="px-4 py-8 text-center text-[12px] text-stone-400 italic">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-stone-100">
              {items.map((n) => (
                <li key={n.id}>
                  <button
                    onClick={() => handleClick(n)}
                    className={`w-full text-left px-4 py-3 hover:bg-stone-50 transition-colors flex items-start gap-2 ${!n.is_read ? 'bg-rose-50/30' : ''}`}
                  >
                    {!n.is_read && <span className="w-1.5 h-1.5 rounded-full bg-rose-500 mt-1.5 shrink-0" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-[12px] text-navy-muted font-medium truncate">{n.title}</p>
                      {n.body && <p className="text-[11px] text-stone-500 line-clamp-2 mt-0.5">{n.body}</p>}
                      <p className="text-[10px] text-stone-400 mt-1">{new Date(n.created_at).toLocaleString()}</p>
                    </div>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
};
