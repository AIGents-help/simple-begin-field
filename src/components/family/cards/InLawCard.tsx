import React, { useEffect, useState } from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';

export const InLawCard: React.FC<any> = (props) => {
  const { currentPacket } = useAppContext();
  const [spouseOptions, setSpouseOptions] = useState<Array<{ id: string; name: string }>>([]);

  useEffect(() => {
    if (!currentPacket?.id) return;
    supabase
      .from('family_members')
      .select('id, name, first_name, last_name')
      .eq('packet_id', currentPacket.id)
      .ilike('relationship', '%spouse%')
      .then(({ data }) => {
        if (!data) return;
        setSpouseOptions(data.map((s: any) => ({
          id: s.id,
          name: s.name || `${s.first_name || ''} ${s.last_name || ''}`.trim() || 'Spouse',
        })));
      });
  }, [currentPacket?.id]);

  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    if (f.inlaw_subtype) out.push({ label: f.inlaw_subtype });
    const spouse = spouseOptions.find((s) => s.id === f.related_to_spouse_id);
    if (spouse) out.push({ label: `Through ${spouse.name}` });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'inlaw_details',
      label: 'In-Law Details',
      render: ({ form, setField }) => (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">In-law type</span>
            <select
              value={form.inlaw_subtype || ''}
              onChange={(e) => setField('inlaw_subtype', e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select…</option>
              <option value="Mother-in-law">Mother-in-law</option>
              <option value="Father-in-law">Father-in-law</option>
              <option value="Brother-in-law">Brother-in-law</option>
              <option value="Sister-in-law">Sister-in-law</option>
              <option value="Other">Other</option>
            </select>
          </label>
          <label className="block">
            <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">Related through</span>
            <select
              value={form.related_to_spouse_id || ''}
              onChange={(e) => setField('related_to_spouse_id', e.target.value || null)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Select a spouse…</option>
              {spouseOptions.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </label>
        </div>
      ),
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge="In-Law"
      extraSections={sections}
      buildSummary={buildSummary}
    />
  );
};
