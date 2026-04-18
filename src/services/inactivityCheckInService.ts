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

  // ============ Admin-only methods ============

  /**
   * Admin: list every user with check-in settings, joined with profile + computed status.
   * Requires admin RLS (checkin_settings policy allows is_admin()).
   */
  async adminListAll(): Promise<
    Array<{
      user_id: string;
      email: string | null;
      full_name: string | null;
      settings: InactivityCheckInSettings;
      last_checkin_at: string | null;
      next_due_at: string | null;
      computed_status: CheckInComputedStatus;
    }>
  > {
    const { data: settingsRows, error } = await supabase
      .from('checkin_settings')
      .select('*')
      .order('updated_at', { ascending: false });
    if (error) throw error;

    const userIds = (settingsRows || []).map((s: any) => s.user_id);
    if (userIds.length === 0) return [];

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, email, full_name, last_checkin_at, checkin_status')
      .in('id', userIds);

    const profMap = new Map<string, any>();
    (profiles || []).forEach((p: any) => profMap.set(p.id, p));

    // Compute next_due_at client-side for display (status RPC requires self/admin)
    const results = await Promise.all(
      (settingsRows || []).map(async (s: any) => {
        let computed: CheckInComputedStatus = 'inactive';
        let next_due_at: string | null = null;
        try {
          const { data } = await supabase.rpc('get_checkin_status', {
            p_user_id: s.user_id,
          });
          const row = (data as any[])?.[0];
          computed = (row?.status as CheckInComputedStatus) || 'inactive';
          next_due_at = row?.next_due_at || null;
        } catch {
          /* swallow — fall back to inactive */
        }
        const prof = profMap.get(s.user_id);
        return {
          user_id: s.user_id,
          email: prof?.email || null,
          full_name: prof?.full_name || null,
          settings: s as InactivityCheckInSettings,
          last_checkin_at: prof?.last_checkin_at || null,
          next_due_at,
          computed_status: computed,
        };
      }),
    );
    return results;
  },

  /** Admin: full event history for a single user. */
  async adminListEvents(userId: string, limit = 100): Promise<CheckInEvent[]> {
    const { data, error } = await supabase
      .from('checkin_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data as CheckInEvent[]) || [];
  },

  /** Admin: trigger fresh check-in email for any user. */
  async adminSendCheckInNow(targetUserId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      'admin-checkin-action',
      { body: { action: 'send_now', target_user_id: targetUserId } },
    );
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
  },

  /** Admin: manually mark user as checked in. */
  async adminMarkCheckedIn(targetUserId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke(
      'admin-checkin-action',
      { body: { action: 'mark_checked_in', target_user_id: targetUserId } },
    );
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
  },

  /** Admin: count users currently in grace or triggered state (for badge). */
  async adminCountAlerts(): Promise<number> {
    const all = await this.adminListAll();
    return all.filter(
      (r) => r.computed_status === 'grace' || r.computed_status === 'triggered',
    ).length;
  },
};
