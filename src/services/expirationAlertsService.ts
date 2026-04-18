import { supabase } from '@/integrations/supabase/client';

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
};
