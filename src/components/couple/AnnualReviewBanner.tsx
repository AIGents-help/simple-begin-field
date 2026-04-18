import React, { useState } from 'react';
import { CalendarHeart, Check, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useCouple } from '../../hooks/useCouple';
import { coupleService } from '../../services/coupleService';

const REVIEW_INTERVAL_DAYS = 365;
const NUDGE_THRESHOLD_DAYS = 30; // show nudge starting 30 days before due

const REVIEW_CHECKLIST = [
  'Have you had any major life changes?',
  'Are beneficiaries still correct on all accounts?',
  'Are your trusted contacts still the right people?',
  'Do your legal documents reflect your current wishes?',
  'Have asset values changed significantly?',
];

export const AnnualReviewBanner: React.FC = () => {
  const { link, refresh, loading } = useCouple();
  const [expanded, setExpanded] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  if (loading || !link || link.status !== 'active' || dismissed) return null;

  // Determine if review is due
  const reference = link.last_review_at || link.linked_at || link.created_at;
  const refDate = new Date(reference);
  const dueDate = new Date(refDate.getTime() + REVIEW_INTERVAL_DAYS * 24 * 60 * 60 * 1000);
  const daysUntilDue = Math.ceil((dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysUntilDue > NUDGE_THRESHOLD_DAYS) return null;

  const isOverdue = daysUntilDue < 0;
  const message = isOverdue
    ? `It's been over a year since your last review. Take a few minutes together.`
    : daysUntilDue === 0
      ? `Your annual review is due today.`
      : `Your annual review is due in ${daysUntilDue} day${daysUntilDue === 1 ? '' : 's'}.`;

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      await coupleService.markReviewCompleted();
      toast.success('Annual review logged. Great job!', { position: 'bottom-center' });
      setExpanded(false);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to log review.', { position: 'bottom-center' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={`rounded-3xl border p-5 shadow-sm ${isOverdue ? 'bg-rose-50/40 border-rose-200' : 'bg-amber-50/40 border-amber-200'}`}>
      <div className="flex items-start gap-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isOverdue ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
          <CalendarHeart size={18} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-serif font-bold text-navy-muted">Couple Packet Review</p>
          <p className="text-[12px] text-stone-600 mt-0.5">{message}</p>

          {expanded && (
            <div className="mt-4 bg-white rounded-xl border border-stone-200 p-4">
              <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-3">Review checklist</p>
              <ul className="space-y-2">
                {REVIEW_CHECKLIST.map((q, i) => (
                  <li key={i} className="flex items-start gap-2 text-[12px] text-stone-700">
                    <Check size={12} className="mt-1 text-emerald-600 shrink-0" />
                    <span>{q}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  onClick={handleComplete}
                  disabled={submitting}
                  className="px-4 py-2 bg-navy-muted text-white rounded-xl text-xs font-bold hover:bg-navy-muted/90 disabled:opacity-50 inline-flex items-center gap-2"
                >
                  {submitting ? <Loader2 size={12} className="animate-spin" /> : <Check size={12} />}
                  We've reviewed
                </button>
                <button
                  onClick={() => setExpanded(false)}
                  className="px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl text-xs font-bold hover:bg-stone-50"
                >
                  Not now
                </button>
              </div>
            </div>
          )}

          {!expanded && (
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => setExpanded(true)}
                className="px-4 py-2 bg-navy-muted text-white rounded-xl text-xs font-bold hover:bg-navy-muted/90"
              >
                Start review
              </button>
              <button
                onClick={() => setDismissed(true)}
                className="px-4 py-2 bg-white text-stone-600 border border-stone-200 rounded-xl text-xs font-bold hover:bg-stone-50 inline-flex items-center gap-1"
              >
                <X size={12} /> Dismiss
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
