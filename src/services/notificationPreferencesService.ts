import { supabase } from '@/integrations/supabase/client';

export type NotificationPreferences = {
  id: string;
  user_id: string;
  expiration_alerts_enabled: boolean;
  alert_90_days: boolean;
  alert_60_days: boolean;
  alert_30_days: boolean;
  alert_14_days: boolean;
  alert_7_days: boolean;
  alert_on_day: boolean;
  alert_overdue: boolean;
  delivery_method: string;
  monitored_sections: string[];
};

export const DEFAULT_MONITORED_SECTIONS = [
  'info', 'medical', 'real-estate', 'vehicles',
  'legal', 'property', 'advisors', 'retirement', 'investments',
];

export const SECTION_LABELS: Record<string, string> = {
  'info': 'Identity (passport, license, ID)',
  'medical': 'Medical insurance & prescriptions',
  'real-estate': 'Real estate insurance & mortgage',
  'vehicles': 'Vehicle registration & insurance',
  'legal': 'Will, POA & trust reviews',
  'property': 'Personal property riders & appraisals',
  'advisors': 'Advisor professional licenses',
  'retirement': 'Beneficiary reviews',
  'investments': 'Investment statement freshness',
};

export const ALERT_INTERVALS: Array<{ key: keyof NotificationPreferences; label: string }> = [
  { key: 'alert_90_days', label: '90 days before' },
  { key: 'alert_60_days', label: '60 days before' },
  { key: 'alert_30_days', label: '30 days before' },
  { key: 'alert_14_days', label: '14 days before' },
  { key: 'alert_7_days',  label: '7 days before' },
  { key: 'alert_on_day',  label: 'Day of expiry' },
  { key: 'alert_overdue', label: '7 days after (overdue)' },
];

export const notificationPreferencesService = {
  async getOrCreate(userId: string): Promise<NotificationPreferences> {
    const { data, error } = await supabase
      .from('notification_preferences')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    if (data) return data as unknown as NotificationPreferences;

    const { data: created, error: insertErr } = await supabase
      .from('notification_preferences')
      .insert({ user_id: userId })
      .select()
      .single();
    if (insertErr) throw insertErr;
    return created as unknown as NotificationPreferences;
  },

  async update(userId: string, patch: Partial<NotificationPreferences>): Promise<void> {
    const { error } = await supabase
      .from('notification_preferences')
      .update(patch)
      .eq('user_id', userId);
    if (error) throw error;
  },
};
