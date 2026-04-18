import React, { useEffect, useState } from 'react';
import { ArrowLeft, Loader2, Eye, EyeOff, Pencil, AlertTriangle, Heart, Mail } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import { useCouple } from '../../hooks/useCouple';
import {
  coupleService,
  CouplePermissionLevel,
  SHARABLE_SECTIONS,
} from '../../services/coupleService';
import { PlanGate } from '../billing/PlanGate';
import { CoupleInviteCard } from './CoupleInviteCard';

const LEVELS: { value: CouplePermissionLevel; label: string; icon: React.ElementType; tone: string }[] = [
  { value: 'hidden', label: 'Hidden', icon: EyeOff, tone: 'bg-stone-100 text-stone-500' },
  { value: 'view', label: 'View', icon: Eye, tone: 'bg-sky-50 text-sky-700' },
  { value: 'collaborate', label: 'Collaborate', icon: Pencil, tone: 'bg-emerald-50 text-emerald-700' },
];

export const PartnerSettings: React.FC = () => {
  const { user, setView } = useAppContext();
  const { link, partner, myPermissions, refresh, loading } = useCouple();
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [unlinking, setUnlinking] = useState(false);
  const [emailEnabled, setEmailEnabled] = useState(true);

  useEffect(() => {
    if (link) setEmailEnabled(link.email_notifications_enabled);
  }, [link]);

  const handleToggleEmail = async (next: boolean) => {
    if (!link) return;
    setEmailEnabled(next);
    try {
      await coupleService.setEmailNotifications(link.id, next);
      toast.success(next ? 'Email notifications on.' : 'Email notifications off.', { duration: 1800, position: 'bottom-center' });
    } catch (err: any) {
      setEmailEnabled(!next);
      toast.error(err?.message || 'Failed to update.', { position: 'bottom-center' });
    }
  };

  const partnerId =
    link && user
      ? (link.user_id_1 === user.id ? link.user_id_2 : link.user_id_1)
      : null;

  const handleChange = async (sectionKey: string, level: CouplePermissionLevel) => {
    if (!link || !user || !partnerId) return;
    setSavingKey(sectionKey);
    try {
      await coupleService.setPermission(link.id, user.id, partnerId, sectionKey, level);
      toast.success('Sharing updated.', { duration: 2000, position: 'bottom-center' });
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to update sharing.', { duration: 4000, position: 'bottom-center' });
    } finally {
      setSavingKey(null);
    }
  };

  const handleUnlink = async () => {
    if (!link || !user) return;
    if (!confirm('Unlink your partner? They will lose all access immediately. Your individual packet data is not affected.')) return;
    setUnlinking(true);
    try {
      await coupleService.unlink(link.id, user.id);
      toast.success('Partner unlinked.', { position: 'bottom-center' });
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Failed to unlink.', { position: 'bottom-center' });
    } finally {
      setUnlinking(false);
    }
  };

  const getLevel = (sectionKey: string): CouplePermissionLevel => {
    const p = myPermissions.find((x) => x.section_key === sectionKey);
    return (p?.permission_level as CouplePermissionLevel) || 'view';
  };

  return (
    <div className="p-6 pb-32 max-w-3xl mx-auto">
      <button
        onClick={() => setView('profile')}
        className="mb-4 flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest hover:text-navy-muted"
      >
        <ArrowLeft size={14} />
        Back to Profile
      </button>

      <div className="mb-6">
        <h1 className="text-2xl font-serif font-bold text-navy-muted">Partner Collaboration</h1>
        <p className="text-sm text-stone-500 mt-1">
          Invite your partner and choose what they can see and edit.
        </p>
      </div>

      <PlanGate feature="partner">
        {loading ? (
          <div className="flex items-center justify-center py-16 text-stone-400">
            <Loader2 className="animate-spin mr-2" size={20} /> Loading...
          </div>
        ) : !link || link.status !== 'active' ? (
          <CoupleInviteCard />
        ) : (
          <div className="space-y-6">
            {/* Active partner */}
            <div className="paper-sheet p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
                  <Heart size={20} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] uppercase tracking-widest font-bold text-stone-400">Linked partner</p>
                  <p className="text-base font-bold text-navy-muted truncate">
                    {partner?.full_name || partner?.email || 'Partner'}
                  </p>
                  {partner?.email && partner.full_name ? (
                    <p className="text-[11px] text-stone-500 truncate">{partner.email}</p>
                  ) : null}
                </div>
              </div>
            </div>

            {/* Permissions matrix */}
            <div>
              <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
                What your partner can do with your data
              </h3>
              <div className="paper-sheet divide-y divide-stone-100">
                {SHARABLE_SECTIONS.map((section) => {
                  const current = getLevel(section.id);
                  return (
                    <div key={section.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-navy-muted truncate">{section.label}</p>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        {LEVELS.map(({ value, label, icon: Icon, tone }) => {
                          const active = current === value;
                          return (
                            <button
                              key={value}
                              onClick={() => handleChange(section.id, value)}
                              disabled={savingKey === section.id}
                              title={label}
                              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border ${
                                active
                                  ? `${tone} border-transparent shadow-sm`
                                  : 'bg-white text-stone-400 border-stone-200 hover:border-stone-300'
                              }`}
                            >
                              <Icon size={11} />
                              <span className="hidden sm:inline">{label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="mt-3 px-1 text-[11px] text-stone-500 leading-relaxed">
                <strong className="text-stone-700">Passwords</strong> and <strong className="text-stone-700">Private</strong> sections are
                always hidden from your partner — this can&rsquo;t be changed.
              </div>
            </div>

            {/* Email notifications toggle */}
            <div className="paper-sheet p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <Mail size={18} className="text-navy-muted mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-navy-muted">Email notifications</p>
                    <p className="text-[11px] text-stone-500 mt-0.5">
                      Get an email when your partner makes updates. In-app alerts always stay on.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleToggleEmail(!emailEnabled)}
                  className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${emailEnabled ? 'bg-emerald-500' : 'bg-stone-300'}`}
                  aria-pressed={emailEnabled}
                >
                  <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${emailEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="paper-sheet p-5 border border-rose-100 bg-rose-50/30">
              <div className="flex items-start gap-3">
                <AlertTriangle size={18} className="text-rose-600 mt-0.5 shrink-0" />
                <div className="flex-1">
                  <p className="text-sm font-bold text-navy-muted">Unlink partner</p>
                  <p className="text-[11px] text-stone-600 mt-1 leading-relaxed">
                    Removes all shared access immediately. Your individual packet data stays untouched.
                  </p>
                  <button
                    onClick={handleUnlink}
                    disabled={unlinking}
                    className="mt-3 px-4 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {unlinking ? <Loader2 size={12} className="animate-spin" /> : null}
                    Unlink Partner
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </PlanGate>
    </div>
  );
};
