import React, { useState, useEffect } from 'react';
import { Loader2, Check } from 'lucide-react';
import { HavenOwlSvg } from '@/components/haven/HavenOwlSvg';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

const FREQUENCY_OPTIONS = [
  { value: 'monthly', label: 'Monthly', desc: 'Every month · Best for life in transition' },
  { value: 'quarterly', label: 'Quarterly', desc: 'Every 3 months · Recommended for most people', recommended: true },
  { value: 'biannual', label: 'Every 6 Months', desc: 'Twice a year · Good for stable life situations' },
  { value: 'annual', label: 'Annually', desc: 'Once a year · Minimum check-in' },
];

const INTERVAL_DAYS: Record<string, number> = {
  monthly: 30,
  quarterly: 90,
  biannual: 182,
  annual: 365,
};

export const CheckInPreferences: React.FC = () => {
  const { user, profile } = useAppContext();
  const [frequency, setFrequency] = useState(profile?.checkin_frequency || 'quarterly');
  const [optedIn, setOptedIn] = useState(!(profile?.checkin_opted_out ?? false));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (profile) {
      setFrequency(profile.checkin_frequency || 'quarterly');
      setOptedIn(!(profile.checkin_opted_out ?? false));
    }
  }, [profile]);

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          checkin_frequency: frequency,
          checkin_opted_out: !optedIn,
        } as any)
        .eq('id', user.id);
      if (error) throw error;
      toast.success('Check-In preferences saved', { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      console.error('Failed to save check-in preferences:', err);
      toast.error(err.message || 'Failed to save preferences', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  const getNextCheckInDate = () => {
    const lastSent = profile?.last_checkin_sent_at;
    if (!lastSent) return null;
    const days = INTERVAL_DAYS[frequency] || 90;
    const next = new Date(lastSent);
    next.setDate(next.getDate() + days);
    return next.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  };

  const nextDate = getNextCheckInDate();

  return (
    <div>
      <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Haven Check-Ins</h3>
      <div className="paper-sheet p-5 space-y-5">
        {/* Intro */}
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <HavenOwlSvg size={48} />
          </div>
          <p className="text-xs text-stone-500 leading-relaxed">
            Haven will reach out periodically to make sure your Packet reflects your life as it is today — not as it was when you first set it up.
          </p>
        </div>

        {/* Opt-in toggle */}
        <div className="flex items-center justify-between py-2">
          <div>
            <p className="text-sm font-bold text-navy-muted">Receive Haven Check-Ins</p>
            <p className="text-[10px] text-stone-400 uppercase tracking-widest font-bold">
              {optedIn ? 'Enabled' : 'Paused'}
            </p>
          </div>
          <button
            onClick={() => setOptedIn(!optedIn)}
            className={`relative w-12 h-7 rounded-full transition-colors ${optedIn ? 'bg-navy-muted' : 'bg-stone-200'}`}
          >
            <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow transition-transform ${optedIn ? 'translate-x-5' : 'translate-x-0.5'}`} />
          </button>
        </div>

        {/* Frequency selector */}
        {optedIn && (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Frequency</p>
            <div className="space-y-2">
              {FREQUENCY_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setFrequency(opt.value)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                    frequency === opt.value
                      ? 'border-navy-muted bg-navy-muted/5'
                      : 'border-stone-200 hover:border-stone-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                      frequency === opt.value ? 'border-navy-muted bg-navy-muted' : 'border-stone-300'
                    }`}>
                      {frequency === opt.value && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <p className="text-sm font-bold text-navy-muted">{opt.label}</p>
                      <p className="text-[10px] text-stone-400">{opt.desc}</p>
                    </div>
                  </div>
                  {opt.recommended && (
                    <span className="px-2 py-0.5 bg-amber-100 text-amber-700 text-[9px] font-bold uppercase tracking-wider rounded-full border border-amber-200">
                      Recommended
                    </span>
                  )}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Next check-in */}
        {optedIn && (
          <div className="pt-2 border-t border-stone-100">
            <p className="text-xs text-stone-500">
              {nextDate
                ? `Your next Check-In is scheduled for ${nextDate}.`
                : 'Your first Check-In will arrive soon.'}
            </p>
          </div>
        )}

        {/* Save */}
        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-colors disabled:opacity-50"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
};
