import React, { useEffect, useState } from 'react';
import {
  ShieldAlert,
  Send,
  CheckCircle2,
  Clock,
  RefreshCw,
  ChevronLeft,
  History,
  Pause,
  Loader2,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  inactivityCheckInService,
  CheckInEvent,
  CheckInComputedStatus,
} from '@/services/inactivityCheckInService';

interface AdminCheckInRow {
  user_id: string;
  email: string | null;
  full_name: string | null;
  settings: any;
  last_checkin_at: string | null;
  next_due_at: string | null;
  computed_status: CheckInComputedStatus;
}

const STATUS_STYLES: Record<CheckInComputedStatus, { bg: string; label: string }> = {
  active: { bg: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Active' },
  grace: { bg: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Grace Period' },
  triggered: { bg: 'bg-rose-100 text-rose-700 border-rose-200', label: 'Triggered' },
  paused: { bg: 'bg-stone-100 text-stone-600 border-stone-200', label: 'Paused' },
  overdue: { bg: 'bg-orange-100 text-orange-700 border-orange-200', label: 'Overdue' },
  inactive: { bg: 'bg-stone-100 text-stone-500 border-stone-200', label: 'Inactive' },
};

const fmtDate = (d: string | null) => (d ? new Date(d).toLocaleString() : '—');

export const AdminCheckIns: React.FC = () => {
  const [rows, setRows] = useState<AdminCheckInRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | CheckInComputedStatus>(
    'all',
  );
  const [selected, setSelected] = useState<AdminCheckInRow | null>(null);
  const [actioning, setActioning] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const data = await inactivityCheckInService.adminListAll();
      setRows(data);
    } catch (err: any) {
      console.error('[AdminCheckIns] load error', err);
      toast.error(err?.message || 'Failed to load check-ins');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const handleSendNow = async (userId: string) => {
    if (!window.confirm('Send a check-in email to this user now?')) return;
    setActioning(userId + ':send');
    try {
      await inactivityCheckInService.adminSendCheckInNow(userId);
      toast.success('Check-in email sent');
      await load();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to send');
    } finally {
      setActioning(null);
    }
  };

  const handleMarkCheckedIn = async (userId: string) => {
    if (!window.confirm('Mark this user as checked in? This will reset their timer.'))
      return;
    setActioning(userId + ':mark');
    try {
      await inactivityCheckInService.adminMarkCheckedIn(userId);
      toast.success('User marked as checked in');
      await load();
      if (selected?.user_id === userId) {
        const fresh = (await inactivityCheckInService.adminListAll()).find(
          (r) => r.user_id === userId,
        );
        if (fresh) setSelected(fresh);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to mark');
    } finally {
      setActioning(null);
    }
  };

  if (selected) {
    return (
      <CheckInUserDetail
        row={selected}
        onClose={() => setSelected(null)}
        onSendNow={() => handleSendNow(selected.user_id)}
        onMarkCheckedIn={() => handleMarkCheckedIn(selected.user_id)}
        actioning={actioning}
      />
    );
  }

  const filtered = rows.filter((r) => {
    const q = search.trim().toLowerCase();
    if (q && !`${r.full_name || ''} ${r.email || ''}`.toLowerCase().includes(q))
      return false;
    if (statusFilter !== 'all' && r.computed_status !== statusFilter) return false;
    return true;
  });

  const alertCount = rows.filter(
    (r) => r.computed_status === 'grace' || r.computed_status === 'triggered',
  ).length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-serif italic text-stone-900">
            Inactivity Check-Ins
          </h3>
          <p className="text-sm text-stone-500 mt-1">
            Monitor and manually manage the dead-man's-switch system across all
            users.
          </p>
        </div>
        <button
          onClick={() => void load()}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {alertCount > 0 && (
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-rose-600 mt-0.5 flex-shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-rose-900">
              {alertCount} user{alertCount === 1 ? '' : 's'} need attention
            </p>
            <p className="text-xs text-rose-700 mt-0.5">
              These users are in grace period or have triggered the inactivity
              alert.
            </p>
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as any)}
          className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5"
        >
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="grace">Grace period</option>
          <option value="triggered">Triggered</option>
          <option value="paused">Paused</option>
          <option value="inactive">Inactive</option>
        </select>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="py-16 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-16 text-center text-sm text-stone-500">
            No users match the current filter.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-200">
              <tr>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  User
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  Status
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  Frequency
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  Last Check-in
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  Next Due
                </th>
                <th className="text-right text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-4 py-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => {
                const style = STATUS_STYLES[r.computed_status];
                const sendBusy = actioning === r.user_id + ':send';
                const markBusy = actioning === r.user_id + ':mark';
                return (
                  <tr
                    key={r.user_id}
                    className="border-b border-stone-100 last:border-b-0 hover:bg-stone-50/50 transition-colors"
                  >
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setSelected(r)}
                        className="text-left"
                      >
                        <p className="text-sm font-medium text-stone-900">
                          {r.full_name || 'Unnamed'}
                        </p>
                        <p className="text-xs text-stone-400">{r.email}</p>
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${style.bg}`}
                      >
                        {r.computed_status === 'paused' && (
                          <Pause className="w-2.5 h-2.5" />
                        )}
                        {(r.computed_status === 'grace' ||
                          r.computed_status === 'triggered') && (
                          <ShieldAlert className="w-2.5 h-2.5" />
                        )}
                        {style.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-600">
                      Every {r.settings.frequency_days} days
                      <span className="text-stone-400">
                        {' '}
                        · grace {r.settings.grace_period_days}d
                      </span>
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {fmtDate(r.last_checkin_at)}
                    </td>
                    <td className="px-4 py-3 text-xs text-stone-500">
                      {fmtDate(r.next_due_at)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleSendNow(r.user_id)}
                          disabled={sendBusy || markBusy}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-white border border-stone-200 rounded-md text-[11px] font-medium text-stone-600 hover:bg-stone-50 transition-colors disabled:opacity-50"
                        >
                          {sendBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <Send className="w-3 h-3" />
                          )}
                          Send Now
                        </button>
                        <button
                          onClick={() => handleMarkCheckedIn(r.user_id)}
                          disabled={sendBusy || markBusy}
                          className="flex items-center gap-1.5 px-2.5 py-1 bg-stone-900 text-white rounded-md text-[11px] font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
                        >
                          {markBusy ? (
                            <Loader2 className="w-3 h-3 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3 h-3" />
                          )}
                          Mark Checked-in
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const EVENT_STATUS_COLORS: Record<string, string> = {
  scheduled: 'bg-stone-100 text-stone-600',
  sent: 'bg-blue-100 text-blue-700',
  completed: 'bg-emerald-100 text-emerald-700',
  missed: 'bg-orange-100 text-orange-700',
  grace: 'bg-amber-100 text-amber-700',
  triggered: 'bg-rose-100 text-rose-700',
};

const CheckInUserDetail: React.FC<{
  row: AdminCheckInRow;
  onClose: () => void;
  onSendNow: () => void;
  onMarkCheckedIn: () => void;
  actioning: string | null;
}> = ({ row, onClose, onSendNow, onMarkCheckedIn, actioning }) => {
  const [events, setEvents] = useState<CheckInEvent[]>([]);
  const [loading, setLoading] = useState(true);

  const loadEvents = async () => {
    setLoading(true);
    try {
      const data = await inactivityCheckInService.adminListEvents(row.user_id);
      setEvents(data);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadEvents();
  }, [row.user_id]);

  const style = STATUS_STYLES[row.computed_status];
  const sendBusy = actioning === row.user_id + ':send';
  const markBusy = actioning === row.user_id + ':mark';

  return (
    <div className="space-y-6">
      <button
        onClick={onClose}
        className="flex items-center gap-1.5 text-sm font-medium text-stone-500 hover:text-stone-900 transition-colors"
      >
        <ChevronLeft className="w-4 h-4" />
        Back to list
      </button>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-serif italic text-stone-900">
              {row.full_name || 'Unnamed'}
            </h3>
            <p className="text-sm text-stone-500 mt-0.5">{row.email}</p>
            <span
              className={`inline-flex items-center gap-1.5 mt-3 px-2.5 py-1 rounded-full border text-[10px] font-semibold uppercase tracking-wider ${style.bg}`}
            >
              {(row.computed_status === 'grace' ||
                row.computed_status === 'triggered') && (
                <ShieldAlert className="w-3 h-3" />
              )}
              {style.label}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onSendNow}
              disabled={sendBusy || markBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-white border border-stone-200 rounded-lg text-xs font-medium text-stone-700 hover:bg-stone-50 transition-colors disabled:opacity-50"
            >
              {sendBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Send className="w-3.5 h-3.5" />
              )}
              Send Check-in Now
            </button>
            <button
              onClick={onMarkCheckedIn}
              disabled={sendBusy || markBusy}
              className="flex items-center gap-1.5 px-3 py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {markBusy ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3.5 h-3.5" />
              )}
              Mark Checked-in
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-stone-100">
          <Stat
            label="Frequency"
            value={`Every ${row.settings.frequency_days} days`}
          />
          <Stat
            label="Grace period"
            value={`${row.settings.grace_period_days} days`}
          />
          <Stat label="Last check-in" value={fmtDate(row.last_checkin_at)} />
          <Stat label="Next due" value={fmtDate(row.next_due_at)} />
          <Stat
            label="Method"
            value={row.settings.checkin_method === 'email_sms' ? 'Email + SMS' : 'Email'}
          />
          <Stat
            label="On expiry"
            value={
              row.settings.release_behavior === 'release_and_pdf'
                ? 'Release + PDF'
                : row.settings.release_behavior === 'release_access'
                  ? 'Release access'
                  : 'Notify only'
            }
          />
          <Stat
            label="Enabled"
            value={row.settings.is_enabled ? 'Yes' : 'No'}
          />
          <Stat
            label="Paused"
            value={row.settings.is_paused ? 'Yes' : 'No'}
          />
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100 flex items-center gap-2">
          <History className="w-4 h-4 text-stone-400" />
          <h4 className="text-sm font-semibold text-stone-900">Check-in History</h4>
        </div>
        {loading ? (
          <div className="py-12 flex items-center justify-center">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        ) : events.length === 0 ? (
          <div className="py-12 text-center text-sm text-stone-500">
            No check-in events yet.
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-stone-50 border-b border-stone-100">
              <tr>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Status
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Scheduled
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Sent
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Checked In
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Reminders
                </th>
                <th className="text-left text-[10px] font-semibold text-stone-500 uppercase tracking-wider px-6 py-2">
                  Notes
                </th>
              </tr>
            </thead>
            <tbody>
              {events.map((e) => (
                <tr key={e.id} className="border-b border-stone-50 last:border-b-0">
                  <td className="px-6 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                        EVENT_STATUS_COLORS[e.status] || 'bg-stone-100 text-stone-600'
                      }`}
                    >
                      {e.status}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-xs text-stone-500">
                    {fmtDate(e.scheduled_at)}
                  </td>
                  <td className="px-6 py-3 text-xs text-stone-500">
                    {fmtDate(e.sent_at)}
                  </td>
                  <td className="px-6 py-3 text-xs text-stone-500">
                    {fmtDate(e.checked_in_at)}
                  </td>
                  <td className="px-6 py-3 text-xs text-stone-600">
                    {e.reminder_count}
                  </td>
                  <td className="px-6 py-3 text-xs text-stone-500 max-w-xs truncate">
                    {e.notes || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div>
    <p className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">
      {label}
    </p>
    <p className="text-sm font-medium text-stone-900 mt-0.5">{value}</p>
  </div>
);
