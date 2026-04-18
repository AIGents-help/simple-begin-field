import React, { useEffect, useMemo, useState } from 'react';
import { Search, Gift, Users, Heart, Crown, Sparkles, X, Save, Ban, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { KPIStatCard, DataTable, StatusPill } from './DashboardComponents';
import { plansAdminService, type PlanRow, type SubscriberRow } from '@/services/plansAdminService';
import { useAppContext } from '@/context/AppContext';

const fmtMoney = (cents: number) =>
  `$${(cents / 100).toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;

const fmtDate = (s: string | null) => (s ? new Date(s).toLocaleDateString() : '—');

const statusType = (status: string): 'success' | 'warning' | 'error' | 'info' => {
  if (status === 'active' || status === 'one_time_paid') return 'success';
  if (status === 'past_due' || status === 'pending') return 'warning';
  if (status === 'canceled' || status === 'failed') return 'error';
  return 'info';
};

export const AdminPlans: React.FC = () => {
  const { profile } = useAppContext();
  const [plans, setPlans] = useState<PlanRow[]>([]);
  const [subs, setSubs] = useState<SubscriberRow[]>([]);
  const [overview, setOverview] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selected, setSelected] = useState<SubscriberRow | null>(null);
  const [compOpen, setCompOpen] = useState(false);

  const refresh = async () => {
    setLoading(true);
    try {
      const [p, s, o] = await Promise.all([
        plansAdminService.listPlans(),
        plansAdminService.listSubscribers(),
        plansAdminService.getOverview(),
      ]);
      setPlans(p);
      setSubs(s);
      setOverview(o);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load plans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    return subs.filter((s) => {
      if (planFilter !== 'all' && s.plan_key !== planFilter) return false;
      if (statusFilter !== 'all' && s.status !== statusFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!(s.full_name || '').toLowerCase().includes(q) && !(s.email || '').toLowerCase().includes(q))
          return false;
      }
      return true;
    });
  }, [subs, search, planFilter, statusFilter]);

  const columns = [
    {
      header: 'Subscriber',
      accessorKey: 'full_name',
      cell: (row: SubscriberRow) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-xs">
            {(row.full_name || row.email || '?').charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-medium text-stone-900">{row.full_name || 'Unnamed'}</p>
            <p className="text-xs text-stone-400">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Plan',
      accessorKey: 'plan_name',
      cell: (row: SubscriberRow) => (
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-stone-900">{row.plan_name}</span>
          {row.is_comp && (
            <span className="text-[10px] uppercase tracking-wider font-semibold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Comp
            </span>
          )}
        </div>
      ),
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: SubscriberRow) => <StatusPill status={row.status.replace('_', ' ')} type={statusType(row.status)} />,
    },
    {
      header: 'Start Date',
      accessorKey: 'start_date',
      cell: (row: SubscriberRow) => <span className="text-xs text-stone-500">{fmtDate(row.start_date)}</span>,
    },
    {
      header: 'Renews / Expires',
      accessorKey: 'current_period_end',
      cell: (row: SubscriberRow) => (
        <span className="text-xs text-stone-500">
          {fmtDate(row.comp_expires_at || row.current_period_end)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPIStatCard
          title="Free"
          value={overview?.free.count ?? '—'}
          icon={Users}
          description="$0 revenue"
        />
        <KPIStatCard
          title="Individual"
          value={overview?.individual.count ?? '—'}
          icon={Sparkles}
          description={overview ? `${fmtMoney(overview.individual.mrr)} MRR` : ''}
        />
        <KPIStatCard
          title="Couple"
          value={overview?.couple.count ?? '—'}
          icon={Heart}
          description={overview ? `${fmtMoney(overview.couple.mrr)} MRR` : ''}
        />
        <KPIStatCard
          title="Lifetime"
          value={overview?.lifetime.count ?? '—'}
          icon={Crown}
          description={overview ? `${fmtMoney(overview.lifetime.revenue)} total` : ''}
        />
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={planFilter}
            onChange={(e) => setPlanFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
          >
            <option value="all">All plans</option>
            {plans.map((p) => (
              <option key={p.id} value={p.plan_key}>
                {p.name}
              </option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
          >
            <option value="all">All status</option>
            <option value="active">Active</option>
            <option value="one_time_paid">One-time paid</option>
            <option value="past_due">Past due</option>
            <option value="canceled">Canceled</option>
            <option value="free">Free</option>
          </select>
          <button
            onClick={() => setCompOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors"
          >
            <Gift className="w-4 h-4" />
            Grant Comp Access
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable
          columns={columns as any}
          data={filtered.map((r) => ({ ...r, id: r.user_id }))}
          isLoading={loading}
          onRowClick={(row: any) => setSelected(row)}
        />
      </div>

      {selected && (
        <SubscriberDetailDrawer
          subscriber={selected}
          plans={plans}
          onClose={() => setSelected(null)}
          onUpdated={async () => {
            await refresh();
            setSelected(null);
          }}
        />
      )}

      {compOpen && (
        <GrantCompDialog
          plans={plans}
          grantedBy={profile?.id || ''}
          onClose={() => setCompOpen(false)}
          onGranted={async () => {
            await refresh();
            setCompOpen(false);
          }}
        />
      )}
    </div>
  );
};

const SubscriberDetailDrawer: React.FC<{
  subscriber: SubscriberRow;
  plans: PlanRow[];
  onClose: () => void;
  onUpdated: () => void;
}> = ({ subscriber, plans, onClose, onUpdated }) => {
  const [planId, setPlanId] = useState<string>(subscriber.pricing_plan_id || '');
  const [note, setNote] = useState(subscriber.admin_note || '');
  const [busy, setBusy] = useState(false);

  const handleChangePlan = async () => {
    if (!planId) return;
    setBusy(true);
    try {
      await plansAdminService.changePlan(subscriber.purchase_id, subscriber.user_id, planId);
      toast.success('Plan updated');
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update plan');
    } finally {
      setBusy(false);
    }
  };

  const handleCancel = async () => {
    if (!subscriber.purchase_id) {
      toast.error('No active subscription to cancel');
      return;
    }
    setBusy(true);
    try {
      await plansAdminService.cancelSubscription(subscriber.purchase_id);
      toast.success('Subscription canceled');
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to cancel');
    } finally {
      setBusy(false);
    }
  };

  const handleSaveNote = async () => {
    setBusy(true);
    try {
      await plansAdminService.updateNote(subscriber.purchase_id, subscriber.user_id, note);
      toast.success('Note saved');
      onUpdated();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to save note');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="bg-white w-full sm:max-w-lg sm:rounded-xl rounded-t-xl shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-stone-200 sticky top-0 bg-white">
          <div>
            <h3 className="font-serif italic text-lg text-stone-900">{subscriber.full_name || 'Unnamed'}</h3>
            <p className="text-xs text-stone-400">{subscriber.email}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-5">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Plan</p>
              <p className="text-stone-900 font-medium mt-1">{subscriber.plan_name}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Status</p>
              <p className="text-stone-900 font-medium mt-1 capitalize">{subscriber.status.replace('_', ' ')}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Start</p>
              <p className="text-stone-900 mt-1">{fmtDate(subscriber.start_date)}</p>
            </div>
            <div>
              <p className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">Renews/Expires</p>
              <p className="text-stone-900 mt-1">
                {fmtDate(subscriber.comp_expires_at || subscriber.current_period_end)}
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Change plan</label>
            <div className="flex gap-2">
              <select
                value={planId}
                onChange={(e) => setPlanId(e.target.value)}
                className="flex-1 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
              >
                <option value="">Select a plan...</option>
                {plans.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {fmtMoney(p.price_cents)}
                  </option>
                ))}
              </select>
              <button
                disabled={busy || !planId}
                onClick={handleChangePlan}
                className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
              >
                Apply
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Admin note</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              placeholder="Internal note about this account..."
            />
            <button
              disabled={busy}
              onClick={handleSaveNote}
              className="flex items-center gap-2 px-3 py-1.5 bg-stone-100 text-stone-700 rounded-lg text-xs font-medium hover:bg-stone-200 disabled:opacity-50"
            >
              <Save className="w-3 h-3" /> Save note
            </button>
          </div>

          <div className="pt-4 border-t border-stone-200 flex justify-between gap-3">
            <button
              disabled={busy || !subscriber.purchase_id}
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 bg-rose-50 text-rose-700 rounded-lg text-sm font-medium hover:bg-rose-100 disabled:opacity-50"
            >
              <Ban className="w-4 h-4" /> Cancel subscription
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const GrantCompDialog: React.FC<{
  plans: PlanRow[];
  grantedBy: string;
  onClose: () => void;
  onGranted: () => void;
}> = ({ plans, grantedBy, onClose, onGranted }) => {
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('');
  const [permanent, setPermanent] = useState(true);
  const [expiresAt, setExpiresAt] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const handleGrant = async () => {
    if (!email || !planId) {
      toast.error('Email and plan are required');
      return;
    }
    setBusy(true);
    try {
      await plansAdminService.grantCompByEmail({
        email,
        pricingPlanId: planId,
        expiresAt: permanent ? null : expiresAt || null,
        grantedBy,
        note,
      });
      toast.success(`Comp access granted to ${email}`);
      onGranted();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to grant comp');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-md rounded-xl shadow-xl">
        <div className="flex items-center justify-between p-5 border-b border-stone-200">
          <h3 className="font-serif italic text-lg text-stone-900 flex items-center gap-2">
            <Gift className="w-4 h-4" /> Grant Comp Access
          </h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          <div>
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-lg text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Plan tier</label>
            <select
              value={planId}
              onChange={(e) => setPlanId(e.target.value)}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-lg text-sm bg-white"
            >
              <option value="">Select a plan...</option>
              {plans.filter((p) => p.plan_key !== 'free').map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permanent}
                onChange={(e) => setPermanent(e.target.checked)}
              />
              <span>Permanent access</span>
            </label>
            {!permanent && (
              <input
                type="date"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                className="w-full px-3 py-2 border border-stone-200 rounded-lg text-sm"
              />
            )}
          </div>
          <div>
            <label className="text-xs font-semibold text-stone-600 uppercase tracking-wider">Note (optional)</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="w-full mt-1 px-3 py-2 border border-stone-200 rounded-lg text-sm"
              placeholder="Reason for granting comp..."
            />
          </div>
        </div>
        <div className="p-5 border-t border-stone-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-white border border-stone-200 text-stone-700 rounded-lg text-sm font-medium hover:bg-stone-50"
          >
            Cancel
          </button>
          <button
            disabled={busy}
            onClick={handleGrant}
            className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 disabled:opacity-50"
          >
            {busy ? 'Granting...' : 'Grant access'}
          </button>
        </div>
      </div>
    </div>
  );
};
