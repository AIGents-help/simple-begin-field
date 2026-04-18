import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, Clock, ChevronRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { expirationAlertsService, type UpcomingExpiration } from '../../services/expirationAlertsService';

const urgencyStyles: Record<UpcomingExpiration['urgency'], { dot: string; text: string; bg: string }> = {
  red: { dot: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50 border-rose-200' },
  yellow: { dot: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50 border-amber-200' },
  green: { dot: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
};

function formatDays(days: number): string {
  if (days < 0) return `Overdue by ${Math.abs(days)}d`;
  if (days === 0) return 'Expires today';
  if (days === 1) return '1 day left';
  return `${days} days left`;
}

export const UpcomingExpirationsCard: React.FC = () => {
  const { currentPacket, setView, setTab } = useAppContext();
  const [items, setItems] = useState<UpcomingExpiration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentPacket?.id) return;
    let cancelled = false;
    setLoading(true);
    expirationAlertsService
      .getUpcoming(currentPacket.id, 3)
      .then((data) => { if (!cancelled) setItems(data); })
      .catch((e) => console.error('Failed to load upcoming expirations', e))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [currentPacket?.id]);

  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-navy-muted" />
          <h3 className="text-base font-serif font-bold text-navy-muted">Upcoming Expirations</h3>
        </div>
        <button
          onClick={() => setView('profile')}
          className="text-[10px] font-bold uppercase tracking-wider text-stone-500 hover:text-navy-muted transition-colors"
        >
          Manage Alerts
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-12 bg-stone-100 rounded-lg animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex items-center gap-3 p-4 bg-emerald-50/60 border border-emerald-200/60 rounded-xl">
          <CheckCircle2 size={20} className="text-emerald-600 shrink-0" />
          <div>
            <p className="text-sm font-medium text-emerald-900">All documents current</p>
            <p className="text-xs text-emerald-700/80">Nothing expiring in the next 90 days.</p>
          </div>
        </div>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const styles = urgencyStyles[item.urgency];
            return (
              <button
                key={item.id}
                onClick={() => { setView('sections'); setTab(item.section_key as any); }}
                className={`w-full flex items-center justify-between gap-3 p-3 rounded-xl border ${styles.bg} hover:shadow-sm transition-all text-left group`}
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className={`w-2 h-2 rounded-full ${styles.dot} shrink-0`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-stone-900 truncate">
                      {item.document_name || item.document_type}
                    </p>
                    <p className={`text-xs font-medium ${styles.text}`}>
                      {item.urgency === 'red' && <AlertCircle size={10} className="inline mr-1 -mt-0.5" />}
                      {formatDays(item.days_remaining)}
                    </p>
                  </div>
                </div>
                <ChevronRight size={16} className="text-stone-400 group-hover:text-stone-700 shrink-0" />
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
