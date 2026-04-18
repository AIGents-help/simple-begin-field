import React, { useEffect, useState } from 'react';
import { AlertTriangle, CheckCircle2, Loader2, Users } from 'lucide-react';
import { coupleService, BeneficiaryAlignment } from '../../services/coupleService';
import { useCouple } from '../../hooks/useCouple';
import { useAppContext } from '../../context/AppContext';

export const BeneficiaryAlignmentCard: React.FC = () => {
  const { link, loading: coupleLoading } = useCouple();
  const { setView, setTab } = useAppContext();
  const [data, setData] = useState<BeneficiaryAlignment | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (coupleLoading || !link || link.status !== 'active') {
      setLoading(false);
      return;
    }
    let cancelled = false;
    coupleService.checkBeneficiaryAlignment().then((d) => {
      if (!cancelled) {
        setData(d);
        setLoading(false);
      }
    });
  }, [coupleLoading, link]);

  if (coupleLoading || !link || link.status !== 'active') return null;
  if (loading) return null;
  if (!data?.linked) return null;

  const hasIssues = data.mismatches.length > 0;

  return (
    <div className={`rounded-3xl border p-6 shadow-sm ${hasIssues ? 'border-amber-200 bg-amber-50/40' : 'border-emerald-200 bg-emerald-50/30'}`}>
      <div className="flex items-center gap-2 mb-4">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${hasIssues ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {hasIssues ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
        </div>
        <div>
          <h3 className="text-base font-serif font-bold text-navy-muted">Beneficiary alignment</h3>
          <p className="text-[11px] text-stone-500">Make sure both packets match what you'd expect</p>
        </div>
      </div>

      {!hasIssues ? (
        <p className="text-sm text-emerald-700">All checked accounts have primary beneficiaries on file. Nice work.</p>
      ) : (
        <div className="space-y-2">
          {data.mismatches.map((m, idx) => (
            <button
              key={idx}
              onClick={() => {
                if (m.side === 'me') {
                  setView('sections');
                  setTab(m.section as any);
                }
              }}
              className="w-full text-left bg-white rounded-xl border border-stone-200 px-3 py-2.5 flex items-start gap-3 hover:border-amber-300 transition-colors"
            >
              <Users size={14} className={m.severity === 'critical' ? 'text-rose-600 mt-0.5' : 'text-amber-600 mt-0.5'} />
              <div className="flex-1 min-w-0">
                <p className="text-[12px] text-navy-muted font-medium">{m.message}</p>
                <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400 mt-1">
                  {m.section} · {m.side === 'me' ? 'your packet' : "partner's packet"}
                </p>
              </div>
            </button>
          ))}
          <p className="text-[11px] text-stone-500 italic mt-3">
            Tip: Review beneficiaries together — life insurance, retirement accounts, and investment accounts should all reflect your current wishes.
          </p>
        </div>
      )}
    </div>
  );
};
