import React, { useEffect, useState } from 'react';
import { AlertTriangle, Mail, TrendingUp, Send, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { expirationAlertsService } from '@/services/expirationAlertsService';

type OverdueUser = {
  user_id: string;
  email: string | null;
  full_name: string | null;
  overdue_count: number;
};

type TopType = { document_type: string; count: number };

const STAT_CARD =
  'bg-white rounded-xl border border-stone-200 shadow-sm p-5';

const formatType = (t: string) =>
  t.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

export const AdminExpirationAlerts: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [sentToday, setSentToday] = useState(0);
  const [overdueUsers, setOverdueUsers] = useState<OverdueUser[]>([]);
  const [topTypes, setTopTypes] = useState<TopType[]>([]);
  const [sendingFor, setSendingFor] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [sent, users, types] = await Promise.all([
        expirationAlertsService.adminAlertsSentToday(),
        expirationAlertsService.adminOverdueUsers(),
        expirationAlertsService.adminTopExpiringTypes(),
      ]);
      setSentToday(sent);
      setOverdueUsers(users);
      setTopTypes(types);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load expiration alerts data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleManualSend = async (user: OverdueUser) => {
    setSendingFor(user.user_id);
    try {
      await expirationAlertsService.adminSendManualAlert(user.user_id);
      toast.success(`Manual alert sent to ${user.email || user.full_name || 'user'}`);
      await load();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to send manual alert');
    } finally {
      setSendingFor(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-serif italic text-stone-900 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" /> Expiration Alerts
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Monitor document expirations across all users and trigger manual alerts.
          </p>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-stone-600 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className={STAT_CARD}>
          <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider font-semibold">
            <Mail className="w-3.5 h-3.5" />
            Alerts sent today
          </div>
          <div className="mt-2 text-3xl font-serif text-stone-900">
            {loading ? '—' : sentToday}
          </div>
        </div>
        <div className={STAT_CARD}>
          <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider font-semibold">
            <AlertTriangle className="w-3.5 h-3.5" />
            Users with overdue docs
          </div>
          <div className="mt-2 text-3xl font-serif text-stone-900">
            {loading ? '—' : overdueUsers.length}
          </div>
        </div>
        <div className={STAT_CARD}>
          <div className="flex items-center gap-2 text-stone-500 text-xs uppercase tracking-wider font-semibold">
            <TrendingUp className="w-3.5 h-3.5" />
            Tracked document types
          </div>
          <div className="mt-2 text-3xl font-serif text-stone-900">
            {loading ? '—' : topTypes.length}
          </div>
        </div>
      </div>

      {/* Overdue users */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h4 className="text-sm font-semibold text-stone-900">Users with overdue documents</h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Sorted by number of overdue items. Send a manual alert to nudge them.
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Loading...</div>
        ) : overdueUsers.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm italic">
            No users have overdue documents 🎉
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {overdueUsers.map((u) => (
              <div
                key={u.user_id}
                className="p-4 flex items-center justify-between gap-4 hover:bg-stone-50 transition-colors"
              >
                <div className="min-w-0">
                  <div className="text-sm font-medium text-stone-900 truncate">
                    {u.full_name || u.email || u.user_id}
                  </div>
                  <div className="text-xs text-stone-500 truncate">{u.email || '—'}</div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-1 rounded">
                    {u.overdue_count} overdue
                  </span>
                  <button
                    onClick={() => handleManualSend(u)}
                    disabled={sendingFor === u.user_id}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors disabled:opacity-50"
                  >
                    {sendingFor === u.user_id ? (
                      <Loader2 className="w-3 h-3 animate-spin" />
                    ) : (
                      <Send className="w-3 h-3" />
                    )}
                    Send alert
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Top expiring types */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-100">
          <h4 className="text-sm font-semibold text-stone-900">
            Most commonly expiring document types
          </h4>
          <p className="text-xs text-stone-500 mt-0.5">
            Across all users, last 30 days overdue + next 90 days.
          </p>
        </div>
        {loading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Loading...</div>
        ) : topTypes.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm italic">
            No upcoming expirations tracked yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {topTypes.map((t) => {
              const max = topTypes[0]?.count || 1;
              const pct = Math.round((t.count / max) * 100);
              return (
                <div key={t.document_type} className="px-5 py-3 flex items-center gap-4">
                  <div className="w-44 text-sm text-stone-900 truncate">
                    {formatType(t.document_type)}
                  </div>
                  <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-stone-900 rounded-full transition-all"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="text-xs font-semibold text-stone-600 w-10 text-right">
                    {t.count}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
