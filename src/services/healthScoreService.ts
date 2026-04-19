import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import {
  DEMO_PACKET_ID,
  DEMO_HEALTH_SCORE_FULL,
  DEMO_SCORE_HISTORY,
} from '../demo/morganFamilyData';

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
    if (isDemoMode()) {
      return DEMO_HEALTH_SCORE_FULL as unknown as HealthScore;
    }
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
    if (isDemoMode()) {
      return DEMO_HEALTH_SCORE_FULL as unknown as HealthScore;
    }
    const { error } = await supabase.rpc('calculate_health_score' as any, { p_packet_id: packetId });
    if (error) throw error;
    return this.getCurrent(packetId);
  },

  async getHistory(packetId: string, limit = 30): Promise<Array<{ total_score: number; recorded_at: string }>> {
    if (isDemoMode()) {
      return DEMO_SCORE_HISTORY.slice(-limit);
    }
    const { data, error } = await supabase
      .from('health_score_history' as any)
      .select('total_score, recorded_at')
      .eq('packet_id', packetId)
      .order('recorded_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return ((data || []) as any[]).reverse().map((r) => ({ total_score: r.total_score, recorded_at: r.recorded_at }));
  },

  async adminStats(): Promise<{
    averageScore: number;
    totalPackets: number;
    distribution: Record<string, number>;
    criticalUsers: Array<{
      user_id: string;
      packet_id: string;
      total_score: number;
      email: string | null;
      display_name: string | null;
      calculated_at: string;
    }>;
  }> {
    // Pull all current scores (admin RLS allows this via is_admin())
    const { data: scores, error } = await supabase
      .from('health_scores' as any)
      .select('user_id, packet_id, total_score, calculated_at')
      .order('total_score', { ascending: true });
    if (error) throw error;

    const rows = (scores || []) as any[];
    const totalPackets = rows.length;
    const averageScore = totalPackets === 0
      ? 0
      : Math.round(rows.reduce((sum, r) => sum + (r.total_score || 0), 0) / totalPackets);

    const distribution: Record<string, number> = { critical: 0, at_risk: 0, good: 0, strong: 0, excellent: 0 };
    for (const r of rows) {
      const tier = tierForScore(r.total_score || 0).key;
      distribution[tier]++;
    }

    // Critical users (score < 25) — fetch profile info
    const critical = rows.filter((r) => (r.total_score || 0) < 25);
    let criticalUsers: any[] = [];
    if (critical.length > 0) {
      const userIds = critical.map((r) => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .in('id', userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.id, p]));
      criticalUsers = critical.map((r) => {
        const prof = profileMap.get(r.user_id) as any;
        return {
          user_id: r.user_id,
          packet_id: r.packet_id,
          total_score: r.total_score,
          email: prof?.email ?? null,
          display_name: prof?.full_name ?? null,
          calculated_at: r.calculated_at,
        };
      });
    }

    return { averageScore, totalPackets, distribution, criticalUsers };
  },
};
