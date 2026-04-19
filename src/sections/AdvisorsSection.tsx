import React, { useEffect, useMemo, useState } from 'react';
import { Search, Users } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import {
  advisorService,
  kindFromAdvisorType,
  KIND_LABELS,
  splitName,
  type AdvisorKind,
} from '../services/advisorService';
import { AdvisorCard } from '../components/advisors/AdvisorCard';
import { AdvisorKindPicker } from '../components/advisors/AdvisorKindPicker';
import { ProfessionalFinder } from '../components/directory/ProfessionalFinder';
import { FindProfessionalPrompt } from '../components/directory/FindProfessionalPrompt';

const KIND_ORDER: AdvisorKind[] = ['attorney', 'cpa', 'financial', 'insurance', 'realtor', 'doctor', 'other'];

interface Props {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}

export const AdvisorsSection: React.FC<Props> = ({ onRefresh }) => {
  const { currentPacket, activeScope, setActiveTab } = useAppContext() as any;
  const [activeView, setActiveView] = useState<'list' | 'find'>('list');
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchRows = React.useCallback(async () => {
    if (!currentPacket) return;
    setLoading(true);
    const { data } = await advisorService.list(currentPacket.id);
    const filtered = activeScope
      ? (data || []).filter((r: any) => !r.scope || r.scope === activeScope || r.scope === 'shared')
      : (data || []);
    // Backfill first/last from legacy `name` for display only (not persisted until edit/save)
    const enriched = filtered.map((r: any) => {
      if (!r.first_name && !r.last_name && r.name) {
        const { first, last } = splitName(r.name);
        return { ...r, first_name: first, last_name: last };
      }
      return r;
    });
    setRows(enriched);
    setLoading(false);
  }, [currentPacket, activeScope]);

  useEffect(() => { fetchRows(); }, [fetchRows]);
  useEffect(() => { if (onRefresh) onRefresh(fetchRows); }, [onRefresh, fetchRows]);

  const rowsByKind = useMemo(() => {
    const map: Partial<Record<AdvisorKind, any[]>> = {};
    for (const r of rows) {
      const k = kindFromAdvisorType(r.advisor_type);
      (map[k] ||= []).push(r);
    }
    return map;
  }, [rows]);

  const orderedRows = useMemo(() => {
    const out: { kind: AdvisorKind; row: any }[] = [];
    for (const k of KIND_ORDER) {
      for (const r of (rowsByKind[k] || [])) out.push({ kind: k, row: r });
    }
    return out;
  }, [rowsByKind]);

  const handleAddDraft = (kind: AdvisorKind) => {
    if (!currentPacket) return;
    const draftId = `draft-${kind}-${Date.now()}`;
    const newDraft: any = {
      id: draftId,
      packet_id: currentPacket.id,
      scope: activeScope || 'shared',
      advisor_type: kind,
      advisor_status: 'active',
      first_name: '',
      last_name: '',
      details: {},
    };
    setRows((prev) => [newDraft, ...prev]);
    setExpandedId(draftId);
  };

  const handleSaved = (saved: any, prevDraftId?: string) => {
    setRows((prev) => {
      const without = prev.filter((d) => d.id !== prevDraftId && d.id !== saved.id);
      return [saved, ...without];
    });
    setExpandedId(saved.id);
  };

  const handleDeleted = (id: string) => {
    setRows((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleCancelDraft = (id: string) => {
    setRows((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleOpenMedical = () => {
    if (typeof setActiveTab === 'function') setActiveTab('medical');
  };

  const isEmpty = !loading && rows.length === 0;

  return (
    <div>
      {/* Tab toggle (kept from previous version) */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
              activeView === 'list' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            My Advisors
          </button>
          <button
            onClick={() => setActiveView('find')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeView === 'find' ? 'bg-white text-stone-900 shadow-sm' : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Search className="w-3 h-3" />
            Find a Professional
          </button>
        </div>
      </div>

      {activeView === 'list' ? (
        <div className="p-6 pb-32 space-y-6">
          {/* Header */}
          <div className="rounded-2xl bg-gradient-to-br from-navy-muted to-navy-muted/80 text-white p-5 shadow-sm">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-widest opacity-80">Advisors</p>
                <p className="text-3xl font-bold mt-1">{rows.length}</p>
                <p className="text-xs opacity-80 mt-1">
                  {rows.length === 1 ? 'professional on file' : 'professionals on file'}
                </p>
              </div>
              <div className="rounded-xl bg-white/10 p-3">
                <Users className="h-6 w-6" />
              </div>
            </div>
          </div>

          {/* Add chips — always visible */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Add an advisor</p>
            <AdvisorKindPicker onPick={handleAddDraft} />
          </div>

          {/* Empty state */}
          {isEmpty && (
            <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center space-y-2">
              <p className="text-stone-700 font-medium">No advisors yet</p>
              <p className="text-sm text-stone-500">
                Start by adding your attorney, CPA, or financial advisor — pick from the chips above.
              </p>
            </div>
          )}

          {/* Cards */}
          {!isEmpty && (
            <div className="space-y-3">
              {orderedRows.map(({ kind, row }) => (
                <AdvisorCard
                  key={row.id}
                  packetId={currentPacket!.id}
                  scope={activeScope || row.scope || 'shared'}
                  kind={kind}
                  row={row}
                  expanded={expandedId === row.id}
                  onToggle={() => setExpandedId((prev) => (prev === row.id ? null : row.id))}
                  onSaved={handleSaved}
                  onDeleted={handleDeleted}
                  onCancelDraft={handleCancelDraft}
                  onOpenMedical={handleOpenMedical}
                />
              ))}
            </div>
          )}

          {/* Find a pro CTA */}
          {isEmpty && (
            <FindProfessionalPrompt
              variant="block"
              message="Need to find an attorney, CPA, or financial advisor?"
              query="Estate Planning Attorney"
            />
          )}
        </div>
      ) : (
        <div className="p-6 pb-32">
          <div className="mb-4">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">Find a Professional</h2>
            <p className="text-xs text-stone-500">Search for estate planning professionals near you and save them directly to your advisors list.</p>
          </div>
          <ProfessionalFinder />
        </div>
      )}
    </div>
  );
};
