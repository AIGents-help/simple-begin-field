import { supabase } from '@/integrations/supabase/client';

export type SectionScore = { score: number; max: number };
export type CriticalGap = { section: string; label: string; impact: number; cta: string };

export type HealthScore = {
  packet_id: string;
  total_score: number;
  previous_score: number;
  score_change: number;
  section_scores: Record<string, SectionScore>;
  critical_gaps: CriticalGap[];
  calculated_at: string;
};

export type ScoreTier = {
  key: 'critical' | 'at_risk' | 'good' | 'strong' | 'excellent';
  label: string;
  message: string;
  color: string; // hsl
  emoji: string;
  grade: 'F' | 'D' | 'C' | 'B' | 'A';
};

export function tierForScore(score: number): ScoreTier {
  if (score <= 25) return { key: 'critical', label: 'Critical', message: 'Your packet needs urgent attention', color: 'hsl(0 72% 51%)', emoji: '🔴', grade: 'F' };
  if (score <= 50) return { key: 'at_risk', label: 'At Risk', message: 'Important gaps need to be filled', color: 'hsl(25 95% 53%)', emoji: '🟠', grade: 'D' };
  if (score <= 75) return { key: 'good', label: 'Good Progress', message: "You're on your way — keep going", color: 'hsl(45 93% 47%)', emoji: '🟡', grade: 'C' };
  if (score <= 90) return { key: 'strong', label: 'Strong', message: 'Your packet is well prepared', color: 'hsl(142 71% 45%)', emoji: '🟢', grade: 'B' };
  return { key: 'excellent', label: 'Excellent', message: 'Your packet is comprehensive', color: 'hsl(45 80% 50%)', emoji: '⭐', grade: 'A' };
}

export const healthScoreService = {
  async getCurrent(packetId: string): Promise<HealthScore | null> {
    const { data, error } = await supabase
      .from('health_scores' as any)
      .select('*')
      .eq('packet_id', packetId)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    return data as unknown as HealthScore;
  },

  async recompute(packetId: string): Promise<HealthScore | null> {
    const { error } = await supabase.rpc('calculate_health_score' as any, { p_packet_id: packetId });
    if (error) throw error;
    return this.getCurrent(packetId);
  },

  async getHistory(packetId: string, limit = 30): Promise<Array<{ total_score: number; recorded_at: string }>> {
    const { data, error } = await supabase
      .from('health_score_history' as any)
      .select('total_score, recorded_at')
      .eq('packet_id', packetId)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data || []) as any[]).reverse().map((r) => ({ total_score: r.total_score, recorded_at: r.recorded_at }));
  },
};
