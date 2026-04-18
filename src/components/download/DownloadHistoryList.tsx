import React, { useEffect, useState } from 'react';
import { Loader2, FileText, ShieldCheck, ShieldAlert, RefreshCcw, History } from 'lucide-react';
import { packetPdfService, DownloadHistoryRow } from '@/services/packetPdfService';
import { toast } from 'sonner';

const ROLE_LABEL: Record<string, string> = {
  owner: 'You',
  member: 'Household member',
  trusted_contact: 'Trusted contact',
  admin: 'Admin',
};

function formatWhen(iso: string) {
  const d = new Date(iso);
  return d.toLocaleString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
}

function summarizeSections(sections: string[]): string {
  if (!sections || sections.length === 0) return 'No sections';
  if (sections.length >= 14) return 'All sections';
  if (sections.length === 1) return `1 section · ${sections[0]}`;
  return `${sections.length} sections`;
}

export const DownloadHistoryList: React.FC = () => {
  const [rows, setRows] = useState<DownloadHistoryRow[] | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const data = await packetPdfService.getHistory(25);
      setRows(data);
    } catch (err: any) {
      console.error('[DownloadHistoryList] load failed', err);
      toast.error(err.message || 'Could not load download history');
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { void load(); }, []);

  return (
    <div className="paper-sheet p-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <History size={14} className="text-stone-400" />
          <h3 className="text-sm font-bold text-navy-muted">Recent Downloads</h3>
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-stone-500 hover:text-navy-muted disabled:opacity-50"
        >
          <RefreshCcw size={11} className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {loading && !rows ? (
        <div className="flex items-center justify-center py-8">
          <Loader2 className="animate-spin text-stone-400" size={18} />
        </div>
      ) : !rows || rows.length === 0 ? (
        <div className="text-center py-8 px-4">
          <FileText className="mx-auto text-stone-300 mb-2" size={28} />
          <p className="text-sm font-bold text-stone-500">No downloads yet</p>
          <p className="text-xs text-stone-400 mt-1">When you download your packet, it will appear here.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div
              key={r.id}
              className="flex items-center gap-3 p-3 rounded-xl border border-stone-100 hover:bg-stone-50/60 transition-colors"
            >
              <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${
                r.include_sensitive ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {r.include_sensitive ? <ShieldAlert size={16} /> : <ShieldCheck size={16} />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-navy-muted truncate">
                  {r.file_name || 'Survivor Packet'}
                </p>
                <p className="text-[11px] text-stone-500 truncate">
                  {ROLE_LABEL[r.downloader_role] || r.downloader_role} · {summarizeSections(r.sections_included)} · {r.format_option === 'summary' ? 'Summary' : 'Full'}
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-[11px] text-stone-400">{formatWhen(r.created_at)}</p>
                <p className={`text-[10px] font-bold uppercase tracking-widest mt-0.5 ${
                  r.include_sensitive ? 'text-amber-600' : 'text-emerald-600'
                }`}>
                  {r.include_sensitive ? 'Sensitive' : 'Redacted'}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
