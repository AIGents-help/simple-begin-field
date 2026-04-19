import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, TrendingUp, UserSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import { retirementService, yearsSince } from '../services/retirementService';
import { RetirementAccountCard } from '../components/retirement/RetirementAccountCard';
import { FindProfessionalPrompt } from '../components/directory/FindProfessionalPrompt';

const RECOMMENDED_CHIPS = [
  '401k',
  'Traditional IRA',
  'Roth IRA',
  '403b / 457',
  'Pension',
  'SEP IRA',
  'Annuity',
  'Other Retirement Account',
];

const currencyFmt = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

interface Props {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}

export const RetirementSection: React.FC<Props> = ({ onRefresh }) => {
  const { currentPacket, activeScope, setView } = useAppContext();
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAccounts = React.useCallback(async () => {
    if (!currentPacket) return;
    setLoading(true);
    const { data } = await retirementService.list(currentPacket.id);
    // Apply scope filter client-side to keep service simple
    const filtered = activeScope
      ? (data || []).filter((r: any) => !r.scope || r.scope === activeScope || r.scope === 'shared')
      : (data || []);
    setAccounts(filtered);
    setLoading(false);
  }, [currentPacket, activeScope]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Wire up parent refresh hook (used by AddEditSheet etc.)
  useEffect(() => {
    if (onRefresh) onRefresh(fetchAccounts);
  }, [onRefresh, fetchAccounts]);

  const totalValue = useMemo(
    () =>
      accounts.reduce((sum, a) => {
        const n = Number(a.approximate_value);
        return Number.isFinite(n) ? sum + n : sum;
      }, 0),
    [accounts],
  );

  const overdueReviewCount = useMemo(
    () =>
      accounts.filter((a) => {
        const yrs = yearsSince(a.beneficiary_last_reviewed_date);
        return yrs !== null && yrs >= 3;
      }).length,
    [accounts],
  );

  const handleAddDraft = () => {
    if (!currentPacket) return;
    const draftId = `draft-${Date.now()}`;
    const newDraft: any = {
      id: draftId,
      packet_id: currentPacket.id,
      scope: activeScope || 'shared',
      institution: '',
      account_type: '',
      details: {},
    };
    setAccounts((prev) => [newDraft, ...prev]);
    setExpandedId(draftId);
  };

  const handleSaved = (saved: any, prevDraftId?: string) => {
    setAccounts((prev) => {
      const without = prev.filter((a) => a.id !== prevDraftId && a.id !== saved.id);
      return [saved, ...without];
    });
    setExpandedId(saved.id);
  };

  const handleDeleted = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleCancelDraft = (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const isEmpty = !loading && accounts.length === 0;

  return (
    <div className="space-y-6">
      {/* Portfolio header */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-muted to-navy-muted/80 text-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Total retirement portfolio</p>
            <p className="text-3xl font-bold mt-1">
              {totalValue > 0 ? currencyFmt.format(totalValue) : '—'}
            </p>
            <p className="text-xs opacity-80 mt-1">
              {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Beneficiary alert */}
      {overdueReviewCount > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              {overdueReviewCount} {overdueReviewCount === 1 ? 'account has' : 'accounts have'} not had
              beneficiaries reviewed in 3+ years
            </p>
            <p className="text-xs text-red-700 mt-1">
              Life events (marriage, birth, divorce, death) often require beneficiary updates.
            </p>
          </div>
        </div>
      )}

      {/* Add account button — always visible */}
      <Button onClick={handleAddDraft} className="w-full">
        <Plus className="h-4 w-4" /> Add retirement account
      </Button>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center space-y-3">
          <p className="text-stone-700 font-medium">No retirement accounts yet</p>
          <p className="text-sm text-stone-500">
            Start by adding a 401k, IRA, pension, or other retirement account.
          </p>
          <div className="flex flex-wrap gap-2 justify-center pt-2">
            {RECOMMENDED_CHIPS.map((chip) => (
              <button
                key={chip}
                onClick={handleAddDraft}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 hover:bg-stone-200 text-stone-700 border border-stone-200"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Account cards */}
      {!isEmpty && (
        <div className="space-y-3">
          {accounts.map((account) => (
            <RetirementAccountCard
              key={account.id}
              packetId={currentPacket!.id}
              scope={activeScope || account.scope || 'shared'}
              account={account}
              expanded={expandedId === account.id}
              onToggle={() =>
                setExpandedId((prev) => (prev === account.id ? null : account.id))
              }
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onCancelDraft={handleCancelDraft}
            />
          ))}
        </div>
      )}

      {/* Find a Professional CTAs */}
      {isEmpty ? (
        <FindProfessionalPrompt
          message="Need retirement planning help?"
          professionalType="Financial Advisor"
        />
      ) : overdueReviewCount > 0 ? (
        <FindProfessionalPrompt
          message="Review beneficiary designations with an attorney?"
          professionalType="Estate Planning Attorney"
        />
      ) : null}
    </div>
  );
};
