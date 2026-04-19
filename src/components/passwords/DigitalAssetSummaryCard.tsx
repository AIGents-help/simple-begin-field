import React, { useMemo } from 'react';
import { Globe, Briefcase, Image, X } from 'lucide-react';

interface Props {
  records: any[];
}

/**
 * Read-only roll-up summary card for digital estate planning.
 * Pulls data from existing password entries (subscriptions) and
 * is purely informational — does not mutate data.
 */
export const DigitalAssetSummaryCard: React.FC<Props> = ({ records }) => {
  const subs = useMemo(
    () => records.filter((r) => r.subscription_cost > 0).sort((a, b) => (b.subscription_cost || 0) - (a.subscription_cost || 0)),
    [records]
  );
  const monthlyTotal = subs.reduce((s, r) => s + (Number(r.subscription_cost) || 0), 0);

  if (records.length === 0) return null;

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4">
      <div className="flex items-center gap-2 mb-3">
        <Globe size={18} className="text-navy-muted" />
        <h3 className="font-bold text-navy-muted">Digital Asset Summary</h3>
      </div>
      <p className="text-[11px] text-stone-500 mb-4">
        A roll-up of your digital footprint for estate planning.
      </p>

      <div className="grid grid-cols-2 gap-3 mb-4">
        <Stat label="Tracked accounts" value={records.length.toString()} />
        <Stat
          label="Monthly subscriptions"
          value={`$${monthlyTotal.toFixed(2)}`}
          sub={`${subs.length} active`}
        />
      </div>

      {subs.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-2">
            Subscriptions to review
          </p>
          <div className="space-y-1">
            {subs.slice(0, 6).map((s) => (
              <div key={s.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-stone-700 truncate">{s.service_name}</span>
                <span className="text-stone-500 font-mono shrink-0 ml-2">
                  ${Number(s.subscription_cost).toFixed(2)}/mo
                </span>
              </div>
            ))}
            {subs.length > 6 && (
              <p className="text-[10px] text-stone-400 italic mt-1">+{subs.length - 6} more</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

const Stat: React.FC<{ label: string; value: string; sub?: string }> = ({ label, value, sub }) => (
  <div className="rounded-xl bg-stone-50 p-3">
    <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">{label}</p>
    <p className="text-lg font-bold text-navy-muted mt-0.5">{value}</p>
    {sub && <p className="text-[10px] text-stone-500 mt-0.5">{sub}</p>}
  </div>
);
