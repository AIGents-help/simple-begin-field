import React, { useEffect, useMemo, useState } from 'react';
import { TrendingUp, TrendingDown, Minus, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { healthScoreService } from '../../services/healthScoreService';

interface Props {
  packetId: string;
}

export const ScoreHistorySparkline: React.FC<Props> = ({ packetId }) => {
  const { completionVersion } = useAppContext();
  const [points, setPoints] = useState<Array<{ total_score: number; recorded_at: string }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    healthScoreService
      .getHistory(packetId, 30)
      .then((data) => !cancelled && setPoints(data))
      .catch((err) => console.error('[ScoreHistorySparkline] failed', err))
      .finally(() => !cancelled && setLoading(false));
    return () => { cancelled = true; };
  }, [packetId, completionVersion]);

  // Weekly delta: compare latest with the most recent point >= 7 days old
  const { weekDelta, latestScore } = useMemo(() => {
    if (points.length === 0) return { weekDelta: 0, latestScore: 0 };
    const latest = points[points.length - 1];
    const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    // points are oldest -> newest
    const baseline = [...points].reverse().find((p) => new Date(p.recorded_at).getTime() <= sevenDaysAgo);
    const baseScore = baseline ? baseline.total_score : points[0].total_score;
    return { weekDelta: latest.total_score - baseScore, latestScore: latest.total_score };
  }, [points]);

  const path = useMemo(() => {
    if (points.length < 2) return '';
    const w = 200;
    const h = 40;
    const xs = points.map((_, i) => (i / (points.length - 1)) * w);
    const min = Math.min(...points.map((p) => p.total_score));
    const max = Math.max(...points.map((p) => p.total_score));
    const range = Math.max(1, max - min);
    const ys = points.map((p) => h - ((p.total_score - min) / range) * h);
    return points.map((_, i) => `${i === 0 ? 'M' : 'L'} ${xs[i].toFixed(1)} ${ys[i].toFixed(1)}`).join(' ');
  }, [points]);

  if (loading) {
    return (
      <div className="paper-sheet p-4 flex items-center justify-center h-20">
        <Loader2 className="animate-spin text-stone-400" size={16} />
      </div>
    );
  }

  if (points.length < 2) {
    return (
      <div className="paper-sheet p-4">
        <p className="text-xs text-stone-400 text-center italic">
          Score history will appear once you've made changes over time.
        </p>
      </div>
    );
  }

  const TrendIcon = weekDelta > 0 ? TrendingUp : weekDelta < 0 ? TrendingDown : Minus;
  const trendColor = weekDelta > 0 ? 'text-emerald-600' : weekDelta < 0 ? 'text-rose-600' : 'text-stone-400';
  const trendBg = weekDelta > 0 ? 'bg-emerald-50' : weekDelta < 0 ? 'bg-rose-50' : 'bg-stone-50';
  const sparkColor = weekDelta >= 0 ? 'hsl(142 71% 45%)' : 'hsl(0 72% 51%)';

  return (
    <div className="paper-sheet p-4 flex items-center gap-4">
      <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${trendBg}`}>
        <TrendIcon size={18} className={trendColor} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-navy-muted">
          {weekDelta > 0 && `Your score increased by ${weekDelta} ${weekDelta === 1 ? 'point' : 'points'} this week`}
          {weekDelta < 0 && `Your score dropped ${Math.abs(weekDelta)} ${Math.abs(weekDelta) === 1 ? 'point' : 'points'} this week`}
          {weekDelta === 0 && 'Your score is steady this week'}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">
          Tracking last {points.length} update{points.length === 1 ? '' : 's'} · current: {latestScore}/100
        </p>
      </div>
      <svg width="120" height="32" viewBox="0 0 200 40" className="flex-shrink-0" preserveAspectRatio="none">
        <path d={path} fill="none" stroke={sparkColor} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  );
};
