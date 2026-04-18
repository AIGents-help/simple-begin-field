import React, { useEffect, useState } from 'react';
import { Loader2, ShieldAlert, Calendar, Clock, Pause, Play, Check, AlertTriangle, Users } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import {
  inactivityCheckInService,
  type InactivityCheckInSettings,
  type ReleaseBehavior,
  type CheckInMethod,
  type CheckInStatusInfo,
} from '@/services/inactivityCheckInService';

type TrustedContact = {
  id: string;
  contact_name: string;
  contact_email: string;
};

const FREQUENCY_OPTIONS: Array<{ days: number; label: string }> = [
  { days: 30, label: 'Monthly' },
  { days: 60, label: 'Every 2 months' },
  { days: 90, label: 'Quarterly' },
  { days: 182, label: 'Every 6 months' },
  { days: 365, label: 'Annually' },
];

const GRACE_OPTIONS = [3, 7, 14, 30];

const RELEASE_OPTIONS: Array<{ value: ReleaseBehavior; title: string; desc: string }> = [
  {
    value: 'notify_only',
    title: 'Notify trusted contacts only',
    desc: 'No automatic access release.',
  },
  {
    value: 'release_access',
    title: 'Notify and release packet access',
    desc: 'Selected contacts get the access permissions you configured.',
  },
  {
    value: 'release_and_pdf',
    title: 'Notify, release access, and send PDF',
    desc: 'Same as above, plus a downloadable PDF of the packet.',
  },
];

const formatDate = (iso?: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
};

const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
  const map: Record<string, { label: string; className: string }> = {
    active: { label: 'Active', className: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    inactive: { label: 'Not enabled', className: 'bg-stone-100 text-stone-500 border-stone-200' },
    paused: { label: 'Paused', className: 'bg-blue-50 text-blue-700 border-blue-200' },
    overdue: { label: 'Overdue', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    grace: { label: 'Grace period', className: 'bg-amber-50 text-amber-700 border-amber-200' },
    triggered: { label: 'Triggered', className: 'bg-red-50 text-red-700 border-red-200' },
  };
  const m = map[status] || map.inactive;
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${m.className}`}>
      {m.label}
    </span>
  );
};

export const InactivityCheckInCard: React.FC = () => {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [checkingIn, setCheckingIn] = useState(false);
  const [settings, setSettings] = useState<InactivityCheckInSettings | null>(null);
  const [status, setStatus] = useState<CheckInStatusInfo | null>(null);
  const [contacts, setContacts] = useState<TrustedContact[]>([]);
  const [dirty, setDirty] = useState(false);

  // Local form state (mirrors settings until save)
  const [isEnabled, setIsEnabled] = useState(false);
  const [frequencyDays, setFrequencyDays] = useState(30);
  const [graceDays, setGraceDays] = useState(7);
  const [method, setMethod] = useState<CheckInMethod>('email');
  const [releaseBehavior, setReleaseBehavior] = useState<ReleaseBehavior>('notify_only');
  const [isPaused, setIsPaused] = useState(false);
  const [pauseUntil, setPauseUntil] = useState<string>('');
  const [selectedContactIds, setSelectedContactIds] = useState<string[]>([]);

  const loadAll = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const [s, st, c] = await Promise.all([
        inactivityCheckInService.getSettings(user.id),
        inactivityCheckInService.getStatus(user.id),
        supabase
          .from('trusted_contacts')
          .select('id, contact_name, contact_email')
          .eq('user_id', user.id)
          .order('created_at', { ascending: true }),
      ]);
      setSettings(s);
      setStatus(st);
      const tcRows = (c.data as any[]) || [];
      setContacts(tcRows);

      if (s) {
        setIsEnabled(s.is_enabled);
        setFrequencyDays(s.frequency_days);
        setGraceDays(s.grace_period_days);
        setMethod(s.checkin_method);
        setReleaseBehavior(s.release_behavior);
        setIsPaused(s.is_paused);
        setPauseUntil(s.pause_until ? s.pause_until.slice(0, 10) : '');
        setSelectedContactIds(s.selected_contact_ids || []);
      }
      setDirty(false);
    } catch (err: any) {
      console.error('Failed to load check-in settings:', err);
      toast.error(err.message || 'Failed to load check-in settings', {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const markDirty = () => setDirty(true);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await inactivityCheckInService.upsertSettings(user.id, {
        is_enabled: isEnabled,
        frequency_days: frequencyDays,
        grace_period_days: graceDays,
        checkin_method: method,
        release_behavior: releaseBehavior,
        is_paused: isPaused,
        pause_until: isPaused && pauseUntil ? new Date(pauseUntil).toISOString() : null,
        selected_contact_ids: selectedContactIds,
      });
      toast.success('Check-in settings saved', { duration: 3000, position: 'bottom-center' });
      await loadAll();
    } catch (err: any) {
      console.error('Save failed:', err);
      toast.error(err.message || 'Failed to save settings', {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleCheckInNow = async () => {
    setCheckingIn(true);
    try {
      await inactivityCheckInService.manualCheckIn();
      toast.success("You're checked in. Clock reset.", {
        duration: 3000,
        position: 'bottom-center',
      });
      await loadAll();
    } catch (err: any) {
      console.error('Check-in failed:', err);
      toast.error(err.message || 'Failed to check in', {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setCheckingIn(false);
    }
  };

  const toggleContact = (id: string) => {
    setSelectedContactIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
    markDirty();
  };

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">
        Inactivity Check-in System
      </h3>
      <div className="paper-sheet p-5 space-y-5">
        {/* Header / status */}
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <ShieldAlert size={20} className="text-amber-600" />
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-navy-muted">
              The "dead man's switch" for your packet
            </p>
            <p className="text-xs text-stone-500 leading-relaxed mt-1">
              We'll send periodic "are you okay?" emails. If you don't respond within the grace
              period, your selected trusted contacts are notified.
            </p>
          </div>
        </div>

        {/* Status row */}
        {!loading && (
          <div className="grid grid-cols-3 gap-3 p-3 bg-stone-50 rounded-xl">
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                Status
              </p>
              <StatusBadge status={status?.status || 'inactive'} />
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                Last check-in
              </p>
              <p className="text-xs font-bold text-navy-muted">
                {formatDate(status?.last_checkin_at)}
              </p>
            </div>
            <div>
              <p className="text-[9px] font-bold uppercase tracking-widest text-stone-400 mb-1">
                Next due
              </p>
              <p className="text-xs font-bold text-navy-muted">
                {formatDate(status?.next_due_at)}
              </p>
            </div>
          </div>
        )}

        {/* Manual check-in */}
        {!loading && isEnabled && (
          <button
            onClick={handleCheckInNow}
            disabled={checkingIn}
            className="w-full py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-emerald-700 transition-colors disabled:opacity-50"
          >
            {checkingIn ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Checking in...
              </>
            ) : (
              <>
                <Check className="w-4 h-4" />
                I'm Okay — Check Me In Now
              </>
            )}
          </button>
        )}

        {/* Enable toggle */}
        <div className="flex items-center justify-between py-2 border-t border-stone-100">
          <div>
            <p className="text-sm font-bold text-navy-muted">Enable inactivity check-ins</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
              {isEnabled ? 'Active' : 'Off'}
            </p>
          </div>
          <button
            onClick={() => {
              setIsEnabled(!isEnabled);
              markDirty();
            }}
            className={`relative w-12 h-7 rounded-full transition-colors ${
              isEnabled ? 'bg-emerald-600' : 'bg-stone-200'
            }`}
            aria-label="Toggle check-ins"
          >
            <div
              className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${
                isEnabled ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {isEnabled && (
          <>
            {/* Frequency */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Calendar size={12} /> Check-in frequency
              </p>
              <div className="grid grid-cols-2 gap-2">
                {FREQUENCY_OPTIONS.map((opt) => (
                  <button
                    key={opt.days}
                    onClick={() => {
                      setFrequencyDays(opt.days);
                      markDirty();
                    }}
                    className={`p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      frequencyDays === opt.days
                        ? 'border-navy-muted bg-navy-muted/5 text-navy-muted'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Grace period */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Clock size={12} /> Grace period before notifying contacts
              </p>
              <div className="flex gap-2 flex-wrap">
                {GRACE_OPTIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => {
                      setGraceDays(d);
                      markDirty();
                    }}
                    className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                      graceDays === d
                        ? 'border-navy-muted bg-navy-muted/5 text-navy-muted'
                        : 'border-stone-200 text-stone-600 hover:border-stone-300'
                    }`}
                  >
                    {d} days
                  </button>
                ))}
              </div>
            </div>

            {/* Method */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                Delivery method
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setMethod('email');
                    markDirty();
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                    method === 'email'
                      ? 'border-navy-muted bg-navy-muted/5 text-navy-muted'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  Email only
                </button>
                <button
                  onClick={() => {
                    setMethod('email_sms');
                    markDirty();
                  }}
                  className={`flex-1 px-4 py-2 rounded-xl border text-xs font-bold transition-all ${
                    method === 'email_sms'
                      ? 'border-navy-muted bg-navy-muted/5 text-navy-muted'
                      : 'border-stone-200 text-stone-600 hover:border-stone-300'
                  }`}
                >
                  Email + SMS
                </button>
              </div>
              {method === 'email_sms' && (
                <p className="text-[10px] text-stone-400 italic">
                  SMS requires a phone number on file. Coming soon.
                </p>
              )}
            </div>

            {/* Release behavior */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                When grace period expires
              </p>
              <div className="space-y-2">
                {RELEASE_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => {
                      setReleaseBehavior(opt.value);
                      markDirty();
                    }}
                    className={`w-full p-3 rounded-xl border text-left transition-all ${
                      releaseBehavior === opt.value
                        ? 'border-navy-muted bg-navy-muted/5'
                        : 'border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    <p className="text-xs font-bold text-navy-muted">{opt.title}</p>
                    <p className="text-[10px] text-stone-500 mt-1">{opt.desc}</p>
                  </button>
                ))}
              </div>
            </div>

            {/* Pause / vacation mode */}
            <div className="space-y-2 p-3 bg-stone-50 rounded-xl">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {isPaused ? (
                    <Pause size={14} className="text-blue-600" />
                  ) : (
                    <Play size={14} className="text-stone-400" />
                  )}
                  <p className="text-xs font-bold text-navy-muted">Pause check-ins (vacation mode)</p>
                </div>
                <button
                  onClick={() => {
                    setIsPaused(!isPaused);
                    markDirty();
                  }}
                  className={`relative w-10 h-6 rounded-full transition-colors ${
                    isPaused ? 'bg-blue-600' : 'bg-stone-300'
                  }`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
                      isPaused ? 'translate-x-4' : 'translate-x-0.5'
                    }`}
                  />
                </button>
              </div>
              {isPaused && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
                    Resume on
                  </label>
                  <input
                    type="date"
                    value={pauseUntil}
                    min={new Date().toISOString().slice(0, 10)}
                    onChange={(e) => {
                      setPauseUntil(e.target.value);
                      markDirty();
                    }}
                    className="w-full p-2 bg-white rounded-lg border border-stone-200 focus:border-stone-400 outline-none text-xs"
                  />
                </div>
              )}
            </div>

            {/* Emergency contacts selector */}
            <div className="space-y-2">
              <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 flex items-center gap-2">
                <Users size={12} /> Contacts to notify on inactivity
              </p>
              {contacts.length === 0 ? (
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-2">
                  <AlertTriangle size={14} className="text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[10px] text-amber-800 leading-relaxed">
                    Add trusted contacts in <strong>Trust Info</strong> first. Without contacts,
                    no one will be notified if you stop responding.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {contacts.map((c) => {
                    const checked = selectedContactIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        onClick={() => toggleContact(c.id)}
                        className={`w-full flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          checked
                            ? 'border-navy-muted bg-navy-muted/5'
                            : 'border-stone-200 hover:border-stone-300'
                        }`}
                      >
                        <div
                          className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                            checked ? 'border-navy-muted bg-navy-muted' : 'border-stone-300'
                          }`}
                        >
                          {checked && <Check size={12} className="text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-bold text-navy-muted truncate">
                            {c.contact_name}
                          </p>
                          <p className="text-[10px] text-stone-500 truncate">{c.contact_email}</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </>
        )}

        {/* Save / dirty indicator */}
        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
          <p className="text-[10px] text-stone-400 italic">
            {dirty ? 'Unsaved changes' : settings ? 'All changes saved' : 'Not configured yet'}
          </p>
          <button
            onClick={handleSave}
            disabled={saving || !dirty}
            className="px-4 py-2 bg-navy-muted text-white rounded-lg font-bold text-xs flex items-center gap-2 hover:bg-navy-muted/90 transition-colors disabled:opacity-40"
          >
            {saving ? (
              <>
                <Loader2 className="w-3 h-3 animate-spin" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </button>
        </div>

        {loading && (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin text-stone-400" />
          </div>
        )}
      </div>
    </div>
  );
};
