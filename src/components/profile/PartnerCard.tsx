import React, { useState } from 'react';
import { Mail, Send, Loader2, Settings2, Activity, UserPlus } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import { useCouple } from '../../hooks/useCouple';
import { coupleService } from '../../services/coupleService';
import { PersonAvatar } from '../common/PersonAvatar';

type Status = 'invited' | 'pending' | 'active' | 'inactive' | 'none';

const statusBadge: Record<Status, { label: string; cls: string }> = {
  invited: { label: 'Invited', cls: 'bg-amber-100 text-amber-800 border-amber-200' },
  pending: { label: 'Pending', cls: 'bg-stone-100 text-stone-600 border-stone-200' },
  active: { label: 'Active', cls: 'bg-emerald-100 text-emerald-800 border-emerald-200' },
  inactive: { label: 'Inactive', cls: 'bg-rose-100 text-rose-700 border-rose-200' },
  none: { label: '', cls: '' },
};

const formatRelative = (iso: string | null): string => {
  if (!iso) return 'Never logged in';
  const then = new Date(iso).getTime();
  const now = Date.now();
  const diffMs = now - then;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Active just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `Active ${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `Active ${hr}h ago`;
  const days = Math.floor(hr / 24);
  if (days < 30) return `Active ${days} day${days === 1 ? '' : 's'} ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `Active ${months} month${months === 1 ? '' : 's'} ago`;
  return `Active ${Math.floor(months / 12)}y ago`;
};

const formatDate = (iso: string | null): string => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
};

export const PartnerCard: React.FC = () => {
  const { setView } = useAppContext() as any;
  const { link, partner, loading, refresh } = useCouple();
  const [inviteEmail, setInviteEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [resending, setResending] = useState(false);

  if (loading) {
    return (
      <div className="pt-4 border-t border-stone-100 flex items-center gap-2 text-stone-400">
        <Loader2 size={14} className="animate-spin" />
        <span className="text-xs">Loading partner…</span>
      </div>
    );
  }

  // No active or pending link → invite form
  if (!link || link.status === 'unlinked') {
    const handleSend = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!inviteEmail.trim()) return;
      setSending(true);
      try {
        await coupleService.sendInvite(inviteEmail.trim());
        toast.success('Invitation sent.', { duration: 3000, position: 'bottom-center' });
        setInviteEmail('');
        await refresh();
      } catch (err: any) {
        toast.error(err?.message || 'Failed to send invitation.', { duration: 5000, position: 'bottom-center' });
      } finally {
        setSending(false);
      }
    };

    return (
      <div className="pt-4 border-t border-stone-100">
        <div className="flex items-center gap-2 mb-2">
          <UserPlus size={14} className="text-navy-muted" />
          <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500">Invite Your Partner</p>
        </div>
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="email"
            required
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
            placeholder="partner@email.com"
            className="flex-1 px-3 py-2 bg-white rounded-lg border border-stone-200 text-sm focus:outline-none focus:border-navy-muted"
          />
          <button
            type="submit"
            disabled={sending}
            className="px-3 py-2 bg-navy-muted text-white rounded-lg text-xs font-bold inline-flex items-center gap-1.5 disabled:opacity-50"
          >
            {sending ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
            Invite
          </button>
        </form>
      </div>
    );
  }

  // Determine status
  let status: Status = 'pending';
  if (link.status === 'pending') {
    status = 'invited';
  } else if (link.status === 'active') {
    const last = partner?.last_login_at ? new Date(partner.last_login_at).getTime() : null;
    const stale = last && Date.now() - last > 30 * 24 * 60 * 60 * 1000;
    status = stale ? 'inactive' : 'active';
  }

  const displayName =
    (link.status === 'active' ? partner?.full_name || partner?.email : link.invite_email) ||
    'Partner';
  const displayEmail = partner?.email || link.invite_email || '';
  const photoPath = link.status === 'active' ? partner?.avatar_path ?? null : null;

  const dateLabel = link.status === 'active' && link.linked_at
    ? `Linked ${formatDate(link.linked_at)}`
    : `Invited ${formatDate(link.created_at)}`;

  const lastActive = link.status === 'active' ? formatRelative(partner?.last_login_at ?? null) : null;

  const handleResend = async () => {
    if (!link.invite_email) return;
    setResending(true);
    try {
      await coupleService.sendInvite(link.invite_email);
      toast.success('Invitation resent.', { duration: 3000, position: 'bottom-center' });
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to resend invitation.', { duration: 5000, position: 'bottom-center' });
    } finally {
      setResending(false);
    }
  };

  const badge = statusBadge[status];

  return (
    <div className="pt-4 border-t border-stone-100">
      <p className="text-[10px] uppercase font-bold tracking-widest text-stone-500 mb-3">Partner</p>
      <div className="flex items-start gap-3">
        <PersonAvatar photoPath={photoPath} name={displayName} size={48} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-navy-muted truncate">{displayName}</p>
            <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest border ${badge.cls}`}>
              {badge.label}
            </span>
          </div>
          {displayEmail && displayEmail !== displayName && (
            <p className="text-[11px] text-stone-500 truncate flex items-center gap-1 mt-0.5">
              <Mail size={10} /> {displayEmail}
            </p>
          )}
          <p className="text-[10px] text-stone-400 mt-1">{dateLabel}</p>
          {lastActive && <p className="text-[10px] text-stone-400">{lastActive}</p>}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        {(status === 'invited' || status === 'pending') && (
          <button
            onClick={handleResend}
            disabled={resending}
            className="px-3 py-1.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-amber-100 disabled:opacity-50"
          >
            {resending ? <Loader2 size={11} className="animate-spin" /> : <Send size={11} />}
            Resend Invitation
          </button>
        )}
        {status === 'active' && (
          <button
            onClick={() => setView?.('partner')}
            className="px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-emerald-100"
          >
            <Activity size={11} />
            View Activity
          </button>
        )}
        <button
          onClick={() => setView?.('partner')}
          className="px-3 py-1.5 bg-manila text-navy-muted border border-folder-edge rounded-lg text-[10px] font-bold uppercase tracking-widest inline-flex items-center gap-1.5 hover:bg-stone-100"
        >
          <Settings2 size={11} />
          Manage Partner Settings
        </button>
      </div>
    </div>
  );
};
