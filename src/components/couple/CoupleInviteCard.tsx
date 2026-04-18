import React, { useState } from 'react';
import { Heart, Loader2, Mail, X } from 'lucide-react';
import { toast } from 'sonner';
import { coupleService } from '../../services/coupleService';
import { useCouple } from '../../hooks/useCouple';

export const CoupleInviteCard: React.FC = () => {
  const { link, refresh, loading } = useCouple();
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  if (loading) return null;

  // Already actively linked — this card is for inviting only
  if (link?.status === 'active') return null;

  const pending = link?.status === 'pending';

  const handleSend = async () => {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error('Please enter your partner\u2019s email.', { position: 'bottom-center' });
      return;
    }
    setSending(true);
    try {
      const res = await coupleService.sendInvite(trimmed);
      toast.success(
        res.partnerHasAccount
          ? 'Invitation sent. Your partner will see it next time they sign in.'
          : 'Invitation sent. Your partner will be prompted to create an account.',
        { duration: 5000, position: 'bottom-center' },
      );
      setShowForm(false);
      setEmail('');
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Could not send invitation.', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSending(false);
    }
  };

  const handleCancel = async () => {
    if (!link) return;
    if (!confirm('Cancel this pending invitation?')) return;
    try {
      await coupleService.cancelPendingInvite(link.id);
      toast.success('Invitation cancelled.', { position: 'bottom-center' });
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Could not cancel.', { position: 'bottom-center' });
    }
  };

  return (
    <div className="paper-sheet p-5">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center shrink-0">
          <Heart size={22} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-serif font-bold text-navy-muted">Collaborate with your partner</h3>
          <p className="text-xs text-stone-500 leading-relaxed mt-1">
            Invite your partner to their own account so you can each maintain a packet and share what makes
            sense — joint accounts, real estate, legal documents.
          </p>

          {pending ? (
            <div className="mt-4 flex items-center justify-between gap-3 bg-amber-50 border border-amber-200 rounded-xl p-3">
              <div className="text-xs text-amber-800">
                Pending invite to <span className="font-bold">{link?.invite_email}</span>
              </div>
              <button
                onClick={handleCancel}
                className="text-[10px] uppercase font-bold tracking-widest text-amber-700 hover:text-amber-900"
              >
                Cancel
              </button>
            </div>
          ) : showForm ? (
            <div className="mt-4 space-y-2">
              <div className="flex items-center gap-2 bg-stone-50 border border-stone-200 rounded-xl px-3">
                <Mail size={14} className="text-stone-400" />
                <input
                  type="email"
                  autoFocus
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="partner@email.com"
                  className="flex-1 py-2.5 text-sm bg-transparent outline-none"
                  onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                />
                <button
                  onClick={() => { setShowForm(false); setEmail(''); }}
                  className="p-1 text-stone-400 hover:text-stone-600"
                  aria-label="Cancel"
                >
                  <X size={14} />
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSend}
                  disabled={sending}
                  className="flex-1 py-2.5 bg-navy-muted text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {sending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
                  Send invitation
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 px-4 py-2 bg-navy-muted text-white rounded-xl text-xs font-bold hover:bg-navy-muted/90"
            >
              Invite Partner
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
