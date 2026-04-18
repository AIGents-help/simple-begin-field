import React, { useEffect, useState } from 'react';
import { Activity, AlertTriangle, TrendingUp, Loader2, Mail } from 'lucide-react';
import { healthScoreService, tierForScore } from '../../services/healthScoreService';
import { toast } from 'sonner';

type AdminStats = {
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
};

const TIER_ORDER: Array<'critical' | 'at_risk' | 'good' | 'strong' | 'excellent'> = [
  'critical', 'at_risk', 'good', 'strong', 'excellent',
];
const TIER_LABEL: Record<string, string> = {
  critical: 'Critical (0-25)',
  at_risk: 'At Risk (26-50)',
  good: 'Good (51-75)',
  strong: 'Strong (76-90)',
  excellent: 'Excellent (91-100)',
};

export const AdminHealthScores: React.FC = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    healthScoreService
      .adminStats()
      .then(setStats)
      .catch((err) => {
        console.error('[AdminHealthScores] failed', err);
        toast.error('Failed to load health score stats: ' + (err.message || 'unknown error'));
      })
      .finally(() => setLoading(false));
  }, []);

  const handleSendOutreach = (email: string | null) => {
    if (!email) {
      toast.error('No email on file for this user');
      return;
    }
    // Open mailto with prefilled outreach message
    window.location.href = `mailto:${email}?subject=Your Survivor Packet needs attention&body=Hi, we noticed your Survivor Packet health score is low. We'd love to help you get it to a stronger place — reply to this email and we'll guide you through the most important next steps.`;
  };

  if (loading) {
    return (
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex items-center justify-center h-40">
        <Loader2 className="animate-spin text-stone-400" size={24} />
      </div>
    );
  }

  if (!stats) return null;

  const maxBarValue = Math.max(...Object.values(stats.distribution), 1);

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Average Score</p>
            <Activity size={16} className="text-navy-muted" />
          </div>
          <p className="text-3xl font-bold text-navy-muted">{stats.averageScore}</p>
          <p className="text-xs text-stone-400 mt-1">across {stats.totalPackets} packet{stats.totalPackets === 1 ? '' : 's'}</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Critical Users</p>
            <AlertTriangle size={16} className="text-rose-600" />
          </div>
          <p className="text-3xl font-bold text-rose-600">{stats.criticalUsers.length}</p>
          <p className="text-xs text-stone-400 mt-1">scoring below 25</p>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500">Strong/Excellent</p>
            <TrendingUp size={16} className="text-emerald-600" />
          </div>
          <p className="text-3xl font-bold text-emerald-600">
            {(stats.distribution.strong || 0) + (stats.distribution.excellent || 0)}
          </p>
          <p className="text-xs text-stone-400 mt-1">scoring 76+</p>
        </div>
      </div>

      {/* Distribution chart */}
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
        <h3 className="text-sm font-bold text-navy-muted mb-4">Score Distribution</h3>
        <div className="space-y-3">
          {TIER_ORDER.map((tier) => {
            const count = stats.distribution[tier] || 0;
            const pct = (count / maxBarValue) * 100;
            const tierMeta = tierForScore(
              tier === 'critical' ? 10 : tier === 'at_risk' ? 40 : tier === 'good' ? 65 : tier === 'strong' ? 85 : 95
            );
            return (
              <div key={tier} className="flex items-center gap-3">
                <div className="w-32 shrink-0 text-xs font-medium text-stone-600">{TIER_LABEL[tier]}</div>
                <div className="flex-1 h-5 bg-stone-50 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all"
                    style={{ width: `${pct}%`, backgroundColor: tierMeta.color }}
                  />
                </div>
                <div className="w-12 text-right text-xs font-bold text-stone-700">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Critical users list */}
      {stats.criticalUsers.length > 0 && (
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-bold text-navy-muted mb-4">
            Users with Critical Scores
            <span className="ml-2 text-xs font-medium text-stone-400">({stats.criticalUsers.length})</span>
          </h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {stats.criticalUsers.map((u) => (
              <div
                key={u.packet_id}
                className="flex items-center gap-3 px-3 py-2.5 rounded-lg bg-stone-50 hover:bg-stone-100 transition-colors"
              >
                <div className="w-9 h-9 rounded-full bg-rose-100 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-bold text-rose-700">{u.total_score}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-stone-800 truncate">
                    {u.display_name || u.email || 'Unknown user'}
                  </p>
                  <p className="text-[11px] text-stone-500 truncate">
                    {u.email || '—'} · last calculated {new Date(u.calculated_at).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={() => handleSendOutreach(u.email)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-navy-muted text-white text-xs font-bold hover:bg-navy-muted/90 transition-colors flex-shrink-0"
                >
                  <Mail size={12} />
                  Outreach
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
