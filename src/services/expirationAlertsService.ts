import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PACKET_ID } from '../demo/morganFamilyData';

export type UpcomingExpiration = {
  id: string;
  document_type: string;
  document_name: string | null;
  expiry_date: string;
  section_key: string;
  related_table: string;
  record_id: string;
  days_remaining: number;
  urgency: 'red' | 'yellow' | 'green';
};

function urgencyFor(days: number): 'red' | 'yellow' | 'green' {
  if (days <= 14) return 'red';
  if (days <= 60) return 'yellow';
  return 'green';
}

export const expirationAlertsService = {
  /**
   * Fetch the next N upcoming expirations for the given user/packet.
   * Includes overdue (negative days) so users see them first.
   */
  async getUpcoming(packetId: string, limit = 3): Promise<UpcomingExpiration[]> {
    if (isDemoMode()) {
      return [];
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 90);
    const overdueStart = new Date(today);
    overdueStart.setDate(today.getDate() - 7);

    const { data, error } = await supabase
      .from('document_alerts')
      .select('id, document_type, document_name, expiry_date, section_key, related_table, record_id')
      .eq('packet_id', packetId)
      .eq('is_dismissed', false)
      .gte('expiry_date', overdueStart.toISOString().slice(0, 10))
      .lte('expiry_date', horizon.toISOString().slice(0, 10))
      .order('expiry_date', { ascending: true })
      .limit(limit);

    if (error) throw error;

    return (data || []).map((row: any) => {
      const expiry = new Date(row.expiry_date + 'T00:00:00');
      const days = Math.round((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      return {
        ...row,
        days_remaining: days,
        urgency: urgencyFor(days),
      } as UpcomingExpiration;
    });
  },

  /**
   * ADMIN: Count of alert emails sent today (any threshold flag flipped today).
   */
  async adminAlertsSentToday(): Promise<number> {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const { count, error } = await supabase
      .from('document_alerts')
      .select('id', { count: 'exact', head: true })
      .gte('last_alert_sent_at', startOfDay.toISOString());
    if (error) throw error;
    return count || 0;
  },

  /**
   * ADMIN: Users with at least one overdue (non-dismissed) document.
   */
  async adminOverdueUsers(): Promise<Array<{ user_id: string; email: string | null; full_name: string | null; overdue_count: number }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { data, error } = await supabase
      .from('document_alerts')
      .select('user_id')
      .eq('is_dismissed', false)
      .lt('expiry_date', today.toISOString().slice(0, 10));
    if (error) throw error;

    const counts = new Map<string, number>();
    (data || []).forEach((r: any) => {
      counts.set(r.user_id, (counts.get(r.user_id) || 0) + 1);
    });
    if (counts.size === 0) return [];

    const userIds = Array.from(counts.keys());
    const { data: profiles, error: pErr } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .in('id', userIds);
    if (pErr) throw pErr;

    return (profiles || []).map((p: any) => ({
      user_id: p.id,
      email: p.email,
      full_name: p.full_name,
      overdue_count: counts.get(p.id) || 0,
    })).sort((a, b) => b.overdue_count - a.overdue_count);
  },

  /**
   * ADMIN: Aggregate counts of expiring document types across all users (next 90d + overdue).
   */
  async adminTopExpiringTypes(): Promise<Array<{ document_type: string; count: number }>> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const horizon = new Date(today);
    horizon.setDate(today.getDate() + 90);
    const overdueStart = new Date(today);
    overdueStart.setDate(today.getDate() - 30);

    const { data, error } = await supabase
      .from('document_alerts')
      .select('document_type')
      .eq('is_dismissed', false)
      .gte('expiry_date', overdueStart.toISOString().slice(0, 10))
      .lte('expiry_date', horizon.toISOString().slice(0, 10));
    if (error) throw error;

    const counts = new Map<string, number>();
    (data || []).forEach((r: any) => {
      counts.set(r.document_type, (counts.get(r.document_type) || 0) + 1);
    });
    return Array.from(counts.entries())
      .map(([document_type, count]) => ({ document_type, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);
  },

  /**
   * ADMIN: Trigger a manual alert run for a single user (calls the edge function).
   */
  async adminSendManualAlert(userId: string): Promise<void> {
    const { data, error } = await supabase.functions.invoke('process-expiration-alerts', {
      body: { manual_user_id: userId },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
  },
};
