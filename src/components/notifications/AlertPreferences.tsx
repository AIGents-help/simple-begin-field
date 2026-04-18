import React, { useEffect, useState } from 'react';
import { Bell, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import {
  notificationPreferencesService,
  NotificationPreferences,
  SECTION_LABELS,
  ALERT_INTERVALS,
  DEFAULT_MONITORED_SECTIONS,
} from '../../services/notificationPreferencesService';

const Toggle = ({ checked, onChange, disabled }: { checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }) => (
  <button
    type="button"
    onClick={() => !disabled && onChange(!checked)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 shrink-0 items-center rounded-full transition-colors disabled:opacity-40 ${
      checked ? 'bg-navy-muted' : 'bg-stone-300'
    }`}
  >
    <span className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${checked ? 'translate-x-5' : 'translate-x-0.5'}`} />
  </button>
);

export const AlertPreferences: React.FC = () => {
  const { user } = useAppContext();
  const [prefs, setPrefs] = useState<NotificationPreferences | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    let cancelled = false;
    notificationPreferencesService
      .getOrCreate(user.id)
      .then(p => { if (!cancelled) setPrefs(p); })
      .catch(err => toast.error(err.message || 'Failed to load alert preferences', { duration: 4000, position: 'bottom-center' }))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [user?.id]);

  const save = async (patch: Partial<NotificationPreferences>) => {
    if (!user?.id || !prefs) return;
    setPrefs({ ...prefs, ...patch });
    setSaving(true);
    try {
      await notificationPreferencesService.update(user.id, patch);
    } catch (err: any) {
      toast.error(err.message || 'Failed to save preferences', { duration: 4000, position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  const toggleSection = (key: string) => {
    if (!prefs) return;
    const current = prefs.monitored_sections || [];
    const next = current.includes(key) ? current.filter(s => s !== key) : [...current, key];
    save({ monitored_sections: next });
  };

  if (loading) {
    return (
      <div className="paper-sheet p-5 mb-4 flex items-center gap-3 text-stone-500 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading alert preferences…
      </div>
    );
  }

  if (!prefs) return null;

  const monitored = new Set(prefs.monitored_sections || DEFAULT_MONITORED_SECTIONS);
  const masterOff = !prefs.expiration_alerts_enabled;

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Alerts & Notifications</h3>

      <div className="paper-sheet p-5 mb-4">
        {/* Master toggle */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-50 rounded-xl flex items-center justify-center">
              <Bell size={20} className="text-amber-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-navy-muted">Document expiration alerts</p>
              <p className="text-xs text-stone-500">Get reminded before passports, insurance, and other documents expire.</p>
            </div>
          </div>
          <Toggle checked={prefs.expiration_alerts_enabled} onChange={v => save({ expiration_alerts_enabled: v })} />
        </div>
        {saving && <p className="text-[10px] text-stone-400 mt-2">Saving…</p>}
      </div>

      {/* Alert timing */}
      <div className="paper-sheet p-5 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">When to alert me</p>
        <div className="space-y-3">
          {ALERT_INTERVALS.map(({ key, label }) => (
            <div key={key as string} className="flex items-center justify-between">
              <span className={`text-sm ${masterOff ? 'text-stone-300' : 'text-navy-muted'}`}>{label}</span>
              <Toggle
                checked={!!prefs[key]}
                disabled={masterOff}
                onChange={v => save({ [key]: v } as Partial<NotificationPreferences>)}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Monitored sections */}
      <div className="paper-sheet p-5 mb-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-3">What to monitor</p>
        <div className="space-y-3">
          {Object.entries(SECTION_LABELS).map(([key, label]) => (
            <div key={key} className="flex items-center justify-between">
              <span className={`text-sm ${masterOff ? 'text-stone-300' : 'text-navy-muted'}`}>{label}</span>
              <Toggle
                checked={monitored.has(key)}
                disabled={masterOff}
                onChange={() => toggleSection(key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
