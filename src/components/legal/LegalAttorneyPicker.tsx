import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface Props {
  packetId: string;
  value: string;
  onPick: (advisor: { name: string; firm?: string; phone?: string; email?: string }) => void;
  onChangeText: (val: string) => void;
  placeholder?: string;
  listId?: string;
}

/**
 * Free-text input that suggests names from advisor_records (filtered to
 * attorney-type advisors when possible). When the typed value matches a
 * known advisor, calls onPick to autofill firm/phone/email.
 */
export const LegalAttorneyPicker: React.FC<Props> = ({
  packetId,
  value,
  onPick,
  onChangeText,
  placeholder = 'Attorney name',
  listId,
}) => {
  const [advisors, setAdvisors] = useState<
    Array<{ name: string; firm?: string; phone?: string; email?: string }>
  >([]);
  const datalistId = listId || `legal-attorney-suggestions-${packetId}`;

  useEffect(() => {
    if (!packetId) return;
    let cancelled = false;
    supabase
      .from('advisor_records')
      .select('name, firm, phone, email, advisor_type')
      .eq('packet_id', packetId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        // Prefer attorney-types but fall back to all advisors if none match
        const attorneys = data.filter((r: any) => {
          const t = (r.advisor_type || '').toLowerCase();
          return t.includes('attorney') || t.includes('lawyer') || t.includes('legal');
        });
        const source = attorneys.length > 0 ? attorneys : data;
        setAdvisors(
          source
            .filter((r: any) => r.name)
            .map((r: any) => ({
              name: r.name,
              firm: r.firm || undefined,
              phone: r.phone || undefined,
              email: r.email || undefined,
            })),
        );
      });
    return () => {
      cancelled = true;
    };
  }, [packetId]);

  const handleChange = (next: string) => {
    const match = advisors.find((a) => a.name.toLowerCase() === next.toLowerCase());
    if (match) onPick(match);
    else onChangeText(next);
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
        {advisors.map((a) => (
          <option key={a.name} value={a.name}>
            {a.firm || ''}
          </option>
        ))}
      </datalist>
    </>
  );
};
