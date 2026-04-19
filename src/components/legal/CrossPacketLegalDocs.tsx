import React, { useEffect, useState } from 'react';
import { FileText, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';
import type { SectionId } from '@/config/types';

const LEGAL_TYPES = [
  'power_of_attorney', 'guardianship', 'custody',
  'legal', 'directive', 'will', 'trust', 'court_order',
];

const NAME_PATTERNS = [
  'power of attorney', 'guardianship', 'custody',
  'will', 'trust', 'directive', 'court order', 'poa',
];

interface FoundDoc {
  id: string;
  file_name: string | null;
  category: string | null;
  section_key: string | null;
  related_table: string | null;
  related_record_id: string | null;
  related_record_name?: string;
}

const SECTION_LABEL: Record<string, string> = {
  family: 'Family',
  medical: 'Medical',
  info: 'Info',
  banking: 'Banking',
  retirement: 'Retirement',
  investments: 'Investments',
  'real-estate': 'Real Estate',
  pets: 'Pets',
  property: 'Property',
  vehicles: 'Vehicles',
  passwords: 'Passwords',
  advisors: 'Advisors',
  funeral: 'Funeral',
  memories: 'Memories',
};

export const CrossPacketLegalDocs: React.FC<{ packetId: string }> = ({ packetId }) => {
  const { setTab, setView } = useAppContext();
  const [docs, setDocs] = useState<FoundDoc[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      setLoading(true);
      const orParts = [
        ...LEGAL_TYPES.map((t) => `category.ilike.%${t}%`),
        ...NAME_PATTERNS.map((p) => `file_name.ilike.%${p}%`),
      ].join(',');

      const { data } = await supabase
        .from('documents')
        .select('id, file_name, category, section_key, related_table, related_record_id')
        .eq('packet_id', packetId)
        .neq('section_key', 'legal')
        .or(orParts);

      if (cancelled) return;
      const list = (data || []) as FoundDoc[];

      // Resolve related record names from family_members where possible (most legal docs land there)
      const familyIds = list
        .filter((d) => (d.related_table === 'family_members' || d.section_key === 'family') && d.related_record_id)
        .map((d) => d.related_record_id as string);

      let nameMap: Record<string, string> = {};
      if (familyIds.length) {
        const { data: fam } = await supabase
          .from('family_members')
          .select('id, name, first_name, last_name')
          .in('id', familyIds);
        for (const f of fam || []) {
          nameMap[f.id] = f.name || [f.first_name, f.last_name].filter(Boolean).join(' ') || 'Record';
        }
      }

      const enriched = list.map((d) => ({
        ...d,
        related_record_name: d.related_record_id ? nameMap[d.related_record_id] : undefined,
      }));

      setDocs(enriched);
      setLoading(false);
    };
    run();
    return () => { cancelled = true; };
  }, [packetId]);

  if (loading || docs.length === 0) return null;

  const navigate = (sectionKey: string | null) => {
    if (!sectionKey) return;
    const id = sectionKey as SectionId;
    if (SECTIONS_CONFIG.some((s) => s.id === id)) {
      setTab(id);
      setView('sections');
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm p-4 space-y-3">
      <div>
        <h3 className="text-sm font-bold text-navy-muted">Legal documents already stored in your packet</h3>
        <p className="text-xs text-stone-500 mt-1">
          Tap any entry to view it in its section. Add documents directly to records to keep them organized by person.
        </p>
      </div>
      <ul className="divide-y divide-stone-100">
        {docs.map((d) => {
          const sectionLabel = d.section_key ? (SECTION_LABEL[d.section_key] || d.section_key) : 'Other';
          const recordName = d.related_record_name || (d.category || 'Records');
          return (
            <li key={d.id}>
              <button
                type="button"
                onClick={() => navigate(d.section_key)}
                className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-stone-50 rounded-lg px-2 -mx-2 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-stone-50 text-navy-muted flex items-center justify-center shrink-0">
                  <FileText size={16} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-navy-muted truncate">{d.file_name || d.category || 'Document'}</p>
                  <p className="text-[11px] text-stone-500 truncate">{sectionLabel} \u203A {recordName}</p>
                </div>
                <ChevronRight size={16} className="text-stone-300 shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
