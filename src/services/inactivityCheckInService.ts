import { supabase } from '@/integrations/supabase/client';

/**
 * Inactivity Check-in System — service layer (Phase 1)
 *
 * Handles the "dead man's switch" check-in settings, manual check-in,
 * and event history. Distinct from the existing `CheckInPreferences`
 * (which is the legacy "Haven check-in reminder" feature).
 */

export type CheckInMethod = 'email' | 'email_sms';
export type ReleaseBehavior = 'notify_only' | 'release_access' | 'release_and_pdf';
export type CheckInComputedStatus =
  | 'inactive'
  | 'active'
  | 'overdue'
  | 'grace'
  | 'paused'
  | 'triggered';

export interface InactivityCheckInSettings {
  id: string;
  user_id: string;
  is_enabled: boolean;
  frequency_days: number;
  grace_period_days: number;
  checkin_method: CheckInMethod;
  release_behavior: ReleaseBehavior;
  is_paused: boolean;
  pause_until: string | null;
  selected_contact_ids: string[];
  created_at: string;
  updated_at: string;
}

export interface CheckInEvent {
  id: string;
  user_id: string;
  scheduled_at: string;
  sent_at: string | null;
  checked_in_at: string | null;
  status: 'scheduled' | 'sent' | 'completed' | 'missed' | 'grace' | 'triggered';
  reminder_count: number;
  triggered_at: string | null;
  notes: string | null;
  created_at: string;
}

export interface CheckInStatusInfo {
  last_checkin_at: string | null;
  next_due_at: string | null;
  status: CheckInComputedStatus;
}

const DEFAULTS: Omit<InactivityCheckInSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'> = {
  is_enabled: false,
  frequency_days: 30,
  grace_period_days: 7,
  checkin_method: 'email',
  release_behavior: 'notify_only',
  is_paused: false,
  pause_until: null,
  selected_contact_ids: [],
};

export const inactivityCheckInService = {
  /** Fetch settings for the given user. Returns null if none exist yet. */
  async getSettings(userId: string): Promise<InactivityCheckInSettings | null> {
    const { data, error } = await supabase
      .from('checkin_settings')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw error;
    return (data as InactivityCheckInSettings) || null;
  },

  /** Upsert settings for the user. */
  async upsertSettings(
    userId: string,
    patch: Partial<InactivityCheckInSettings>
  ): Promise<InactivityCheckInSettings> {
    const existing = await this.getSettings(userId);
    if (existing) {
      const { data, error } = await supabase
        .from('checkin_settings')
        .update(patch)
        .eq('user_id', userId)
        .select('*')
        .single();
      if (error) throw error;
      return data as InactivityCheckInSettings;
    } else {
      const insertPayload: any = { ...DEFAULTS, ...patch, user_id: userId };
      const { data, error } = await supabase
        .from('checkin_settings')
        .insert(insertPayload)
        .select('*')
        .single();
      if (error) throw error;
      return data as InactivityCheckInSettings;
    }
  },

  /** Computed status (last/next/status) — uses SECURITY DEFINER RPC. */
  async getStatus(userId: string): Promise<CheckInStatusInfo> {
    const { data, error } = await supabase.rpc('get_checkin_status', { p_user_id: userId });
    if (error) throw error;
    const row = (data as any[])?.[0];
    return {
      last_checkin_at: row?.last_checkin_at || null,
      next_due_at: row?.next_due_at || null,
      status: (row?.status as CheckInComputedStatus) || 'inactive',
    };
  },

  /** Manual "Check In Now" — owner clicks button while logged in. */
  async manualCheckIn(): Promise<void> {
    const { error } = await supabase.rpc('manual_check_in');
    if (error) throw error;
  },

  /** Recent check-in events for history display. */
  async listRecentEvents(userId: string, limit = 25): Promise<CheckInEvent[]> {
    const { data, error } = await supabase
      .from('checkin_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as CheckInEvent[]) || [];
  },
};
