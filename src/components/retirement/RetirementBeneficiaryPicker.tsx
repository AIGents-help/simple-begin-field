import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface Props {
  packetId: string;
  value: string;
  onChange: (val: string, relationship?: string) => void;
  placeholder?: string;
  listId?: string;
}

/**
 * Free-text input that auto-suggests names from the family_members table.
 * Falls back gracefully — user can type any name not in the list.
 */
export const RetirementBeneficiaryPicker: React.FC<Props> = ({
  packetId,
  value,
  onChange,
  placeholder = 'Type or pick a name',
  listId,
}) => {
  const [members, setMembers] = useState<Array<{ name: string; relationship?: string }>>([]);
  const datalistId = listId || `family-beneficiaries-${packetId}`;

  useEffect(() => {
    if (!packetId) return;
    let cancelled = false;
    supabase
      .from('family_members')
      .select('name, first_name, last_name, relationship')
      .eq('packet_id', packetId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const list = data
          .map((r: any) => ({
            name: r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
            relationship: r.relationship || undefined,
          }))
          .filter((m) => m.name);
        setMembers(list);
      });
    return () => {
      cancelled = true;
    };
  }, [packetId]);

  const handleChange = (next: string) => {
    const match = members.find((m) => m.name.toLowerCase() === next.toLowerCase());
    onChange(next, match?.relationship);
  };

  return (
    <>
      <Input
        list={datalistId}
        value={value || ''}
        onChange={(e) => handleChange(e.target.value)}
        placeholder={placeholder}
      />
      <datalist id={datalistId}>
        {members.map((m) => (
          <option key={m.name} value={m.name}>
            {m.relationship ? `${m.relationship}` : ''}
          </option>
        ))}
      </datalist>
    </>
  );
};
