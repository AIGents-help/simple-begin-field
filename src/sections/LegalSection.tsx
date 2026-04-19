import React, { useEffect, useMemo, useState } from 'react';
import { Plus, AlertTriangle, Scale } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import {
  legalService,
  yearsSince,
  kindFromDocumentType,
  KIND_LABELS,
  SINGLE_INSTANCE_KINDS,
  type LegalKind,
} from '../services/legalService';
import { LegalDocumentCard } from '../components/legal/LegalDocumentCard';
import { FindProfessionalPrompt } from '../components/directory/FindProfessionalPrompt';
import { SectionRecommendations } from '../components/sections/SectionRecommendations';
import { CrossPacketLegalDocs } from '../components/legal/CrossPacketLegalDocs';
import { supabase } from '@/integrations/supabase/client';

const ALL_KINDS: LegalKind[] = [
  'will', 'trust', 'fin_poa', 'hcpoa', 'living_will', 'guardianship', 'other',
];

interface Props {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}

export const LegalSection: React.FC<Props> = ({ onRefresh }) => {
  const { currentPacket, activeScope } = useAppContext();
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [hasMinorChildren, setHasMinorChildren] = useState(false);

  const fetchDocs = React.useCallback(async () => {
    if (!currentPacket) return;
    setLoading(true);
    const { data } = await legalService.list(currentPacket.id);
    const filtered = activeScope
      ? (data || []).filter((r: any) => !r.scope || r.scope === activeScope || r.scope === 'shared')
      : (data || []);
    setDocs(filtered);
    setLoading(false);
  }, [currentPacket, activeScope]);

  // Detect minor children in family section to surface guardianship prompt
  useEffect(() => {
    if (!currentPacket) return;
    let cancelled = false;
    supabase
      .from('family_members')
      .select('birthday, is_dependent, relationship')
      .eq('packet_id', currentPacket.id)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const today = new Date();
        const minor = data.some((m: any) => {
          if (!m.birthday) return !!m.is_dependent && (m.relationship || '').toLowerCase().includes('child');
          const dob = new Date(m.birthday);
          if (Number.isNaN(dob.getTime())) return false;
          const age = (today.getTime() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
          return age < 18;
        });
        setHasMinorChildren(minor);
      });
    return () => { cancelled = true; };
  }, [currentPacket]);

  useEffect(() => { fetchDocs(); }, [fetchDocs]);

  useEffect(() => {
    if (onRefresh) onRefresh(fetchDocs);
  }, [onRefresh, fetchDocs]);

  // Group docs by kind
  const docsByKind = useMemo(() => {
    const map: Partial<Record<LegalKind, any[]>> = {};
    for (const d of docs) {
      const k = kindFromDocumentType(d.document_type);
      (map[k] ||= []).push(d);
    }
    return map;
  }, [docs]);

  const existingKinds = useMemo(() => new Set(Object.keys(docsByKind) as LegalKind[]), [docsByKind]);

  // Critical-review alert: Will or POA stale
  const criticalStale = useMemo(() => {
    const critical: LegalKind[] = ['will', 'fin_poa', 'hcpoa'];
    return docs.filter((d) => {
      const k = kindFromDocumentType(d.document_type);
      if (!critical.includes(k)) return false;
      const yrs = yearsSince(d.last_reviewed_date);
      return yrs !== null && yrs >= 3;
    }).length;
  }, [docs]);

  const handleAddDraft = (kind: LegalKind) => {
    if (!currentPacket) return;
    // Single-instance: bail if already exists
    if (SINGLE_INSTANCE_KINDS.includes(kind) && existingKinds.has(kind)) {
      const existing = (docsByKind[kind] || [])[0];
      if (existing) setExpandedId(existing.id);
      return;
    }
    const draftId = `draft-${kind}-${Date.now()}`;
    const newDraft: any = {
      id: draftId,
      packet_id: currentPacket.id,
      scope: activeScope || 'shared',
      document_type: kind,
      details: {},
    };
    setDocs((prev) => [newDraft, ...prev]);
    setExpandedId(draftId);
  };

  const handleSaved = (saved: any, prevDraftId?: string) => {
    setDocs((prev) => {
      const without = prev.filter((d) => d.id !== prevDraftId && d.id !== saved.id);
      return [saved, ...without];
    });
    setExpandedId(saved.id);
  };

  const handleDeleted = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleCancelDraft = (id: string) => {
    setDocs((prev) => prev.filter((d) => d.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const isEmpty = !loading && docs.length === 0;

  // Order kinds for display: Will, Fin POA, HCPOA, Living Will, Trust, Guardianship, Other
  const KIND_ORDER: LegalKind[] = ['will', 'fin_poa', 'hcpoa', 'living_will', 'trust', 'guardianship', 'other'];
  const orderedDocs = useMemo(() => {
    const out: { kind: LegalKind; doc: any }[] = [];
    for (const k of KIND_ORDER) {
      for (const d of (docsByKind[k] || [])) {
        out.push({ kind: k, doc: d });
      }
    }
    return out;
  }, [docsByKind]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl bg-gradient-to-br from-navy-muted to-navy-muted/80 text-white p-5 shadow-sm">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest opacity-80">Legal documents</p>
            <p className="text-3xl font-bold mt-1">{docs.length}</p>
            <p className="text-xs opacity-80 mt-1">
              {docs.length === 1 ? 'document on file' : 'documents on file'}
            </p>
          </div>
          <div className="rounded-xl bg-white/10 p-3">
            <Scale className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Critical review alert */}
      {criticalStale > 0 && (
        <div className="rounded-xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-red-900">
              {criticalStale} critical {criticalStale === 1 ? 'document has' : 'documents have'} not been reviewed in 3+ years
            </p>
            <p className="text-xs text-red-700 mt-1">
              Wills and powers of attorney should be reviewed every 3 years or after major life events.
            </p>
          </div>
        </div>
      )}

      {/* Guardianship prompt */}
      {hasMinorChildren && !existingKinds.has('guardianship') && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-amber-900">You have minor children listed in Family</p>
            <p className="text-xs text-amber-800 mt-1">
              Consider adding a guardianship nomination so guardians are clearly identified.
            </p>
            <Button size="sm" variant="outline" className="mt-2" onClick={() => handleAddDraft('guardianship')}>
              <Plus className="h-4 w-4" /> Add guardianship nomination
            </Button>
          </div>
        </div>
      )}

      {/* Recommended chips — always visible */}
      <div className="space-y-2">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-500">Add a document</p>
        <div className="flex flex-wrap gap-2">
          {ALL_KINDS.map((k) => {
            const isSingle = SINGLE_INSTANCE_KINDS.includes(k);
            const exists = existingKinds.has(k);
            const grayed = isSingle && exists;
            return (
              <button
                key={k}
                type="button"
                onClick={() => handleAddDraft(k)}
                className={
                  grayed
                    ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-stone-100 text-stone-400 border border-stone-200 cursor-default'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white hover:bg-stone-100 text-stone-700 border border-stone-300'
                }
                title={grayed ? 'Already added — tap card to edit' : `Add ${KIND_LABELS[k]}`}
              >
                {grayed ? '✓ ' : '+ '}{KIND_LABELS[k]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Empty state */}
      {isEmpty && (
        <div className="rounded-2xl border border-dashed border-stone-300 p-6 text-center space-y-2">
          <p className="text-stone-700 font-medium">No legal documents yet</p>
          <p className="text-sm text-stone-500">
            Start with your Will or a Power of Attorney — pick from the chips above.
          </p>
        </div>
      )}

      {/* Document cards */}
      {!isEmpty && (
        <div className="space-y-3">
          {orderedDocs.map(({ kind, doc }) => (
            <LegalDocumentCard
              key={doc.id}
              packetId={currentPacket!.id}
              scope={activeScope || doc.scope || 'shared'}
              kind={kind}
              doc={doc}
              expanded={expandedId === doc.id}
              onToggle={() => setExpandedId((prev) => (prev === doc.id ? null : doc.id))}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onCancelDraft={handleCancelDraft}
            />
          ))}
        </div>
      )}

      {/* Find a Pro CTA */}
      {isEmpty && (
        <FindProfessionalPrompt
          variant="block"
          message="Need help drafting a will or estate plan?"
          query="Estate Planning Attorney"
        />
      )}
    </div>
  );
};
