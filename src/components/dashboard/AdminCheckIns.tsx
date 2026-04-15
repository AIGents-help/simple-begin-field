import React, { useEffect, useState } from 'react';
import { Bird, Send, Loader2, Users, Clock, CheckCircle2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AdminCheckIns: React.FC = () => {
  const [stats, setStats] = useState({ optedIn: 0, optedOut: 0, dueToday: 0 });
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [lastBatch, setLastBatch] = useState<{ date: string; count: number } | null>(null);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('checkin_opted_out, checkin_frequency, last_checkin_sent_at' as any);
      if (error) throw error;

      const all = profiles || [];
      const optedIn = all.filter((p: any) => !p.checkin_opted_out).length;
      const optedOut = all.filter((p: any) => p.checkin_opted_out).length;

      const intervalDays: Record<string, number> = { monthly: 30, quarterly: 90, biannual: 182, annual: 365 };
      const now = Date.now();
      let dueToday = 0;
      for (const p of all) {
        if ((p as any).checkin_opted_out) continue;
        const lastSent = (p as any).last_checkin_sent_at;
        if (!lastSent) { dueToday++; continue; }
        const freq = (p as any).checkin_frequency || 'quarterly';
        const days = intervalDays[freq] || 90;
        if (now - new Date(lastSent).getTime() >= days * 86400000) dueToday++;
      }

      setStats({ optedIn, optedOut, dueToday });
    } catch (err: any) {
      console.error('Failed to fetch check-in stats:', err);
      toast.error(err.message || 'Failed to load stats', { duration: 5000, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  const handleSendBatch = async () => {
    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke('send-checkin', {
        body: {},
      });
      if (error) throw error;
      const count = data?.sent || 0;
      setLastBatch({ date: new Date().toLocaleString(), count });
      toast.success(`Sent ${count} Check-In${count !== 1 ? 's' : ''}`, { duration: 3000, position: 'bottom-center' });
      fetchStats();
    } catch (err: any) {
      console.error('Failed to send batch check-ins:', err);
      toast.error(err.message || 'Failed to send check-ins', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="animate-spin text-stone-400" size={24} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900 flex items-center gap-2">
          <Bird size={20} className="text-amber-600" />
          Check-In Manager
        </h3>
        <button
          onClick={handleSendBatch}
          disabled={sending || stats.dueToday === 0}
          className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          Send Check-Ins Now
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-1">
          <div className="flex items-center gap-2 text-stone-400 mb-2">
            <Users size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Opted In</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.optedIn}</p>
          <p className="text-xs text-stone-400">{stats.optedOut} opted out</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-1">
          <div className="flex items-center gap-2 text-amber-500 mb-2">
            <Clock size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Due Today</span>
          </div>
          <p className="text-2xl font-bold text-stone-900">{stats.dueToday}</p>
          <p className="text-xs text-stone-400">Users awaiting check-in</p>
        </div>

        <div className="bg-white rounded-xl border border-stone-200 p-5 space-y-1">
          <div className="flex items-center gap-2 text-emerald-500 mb-2">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-widest">Last Batch</span>
          </div>
          {lastBatch ? (
            <>
              <p className="text-2xl font-bold text-stone-900">{lastBatch.count}</p>
              <p className="text-xs text-stone-400">{lastBatch.date}</p>
            </>
          ) : (
            <p className="text-sm text-stone-400 italic">No batch sent this session</p>
          )}
        </div>
      </div>
    </div>
  );
};
