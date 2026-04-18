import React, { useEffect, useMemo, useState } from 'react';
import { History, Search, Filter } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface ActivityRow {
  id: string;
  admin_email: string | null;
  target_user_email: string | null;
  action: string;
  old_value: any;
  new_value: any;
  note: string | null;
  created_at: string;
}

const ACTION_COLORS: Record<string, string> = {
  pause: 'bg-amber-50 text-amber-700',
  resume: 'bg-emerald-50 text-emerald-700',
  change_plan: 'bg-indigo-50 text-indigo-700',
  cancel: 'bg-rose-50 text-rose-700',
  grant_comp: 'bg-purple-50 text-purple-700',
};

const fmtAction = (a: string) => a.replace(/_/g, ' ');
const fmtDate = (s: string) => new Date(s).toLocaleString();

const renderValue = (v: any): string => {
  if (!v) return '—';
  if (typeof v === 'string') return v;
  return Object.entries(v)
    .map(([k, val]) => `${k}: ${val ?? '—'}`)
    .join(', ');
};

export const AdminActivityLog: React.FC = () => {
  const [rows, setRows] = useState<ActivityRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('all');

  const load = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_activity_log' as any)
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) throw error;
      setRows((data as any) || []);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load activity log');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      if (actionFilter !== 'all' && r.action !== actionFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (
          !(r.target_user_email || '').toLowerCase().includes(q) &&
          !(r.admin_email || '').toLowerCase().includes(q) &&
          !(r.note || '').toLowerCase().includes(q)
        )
          return false;
      }
      return true;
    });
  }, [rows, search, actionFilter]);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-lg font-serif italic text-stone-900 flex items-center gap-2">
          <History className="w-4 h-4" /> Admin Activity Log
        </h3>
        <p className="text-sm text-stone-500 mt-1">
          Every plan change, pause, resume and comp grant is logged here.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by user, admin, or note..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-stone-400" />
          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm"
          >
            <option value="all">All actions</option>
            <option value="change_plan">Change plan</option>
            <option value="pause">Pause</option>
            <option value="resume">Resume</option>
            <option value="cancel">Cancel</option>
            <option value="grant_comp">Grant comp</option>
          </select>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-stone-400 text-sm">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-stone-400 text-sm italic">
            No activity yet.
          </div>
        ) : (
          <div className="divide-y divide-stone-100">
            {filtered.map((r) => (
              <div key={r.id} className="p-4 hover:bg-stone-50 transition-colors">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-[10px] uppercase tracking-wider font-semibold px-2 py-0.5 rounded ${ACTION_COLORS[r.action] || 'bg-stone-100 text-stone-700'}`}
                      >
                        {fmtAction(r.action)}
                      </span>
                      <span className="text-sm text-stone-900 font-medium">
                        {r.target_user_email || 'Unknown user'}
                      </span>
                      <span className="text-xs text-stone-400">
                        by {r.admin_email || 'system'}
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-stone-600 space-y-1">
                      <div>
                        <span className="text-stone-400">From: </span>
                        {renderValue(r.old_value)}
                      </div>
                      <div>
                        <span className="text-stone-400">To: </span>
                        {renderValue(r.new_value)}
                      </div>
                      {r.note && (
                        <div className="italic text-stone-500 mt-1">"{r.note}"</div>
                      )}
                    </div>
                  </div>
                  <div className="text-[11px] text-stone-400 whitespace-nowrap">
                    {fmtDate(r.created_at)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
