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
 * Free-text input that suggests names from advisor_records.
 * When the typed value matches a known advisor, calls onPick to autofill
 * firm/phone/email; otherwise just propagates the text via onChangeText.
 */
export const RetirementAdvisorPicker: React.FC<Props> = ({
  packetId,
  value,
  onPick,
  onChangeText,
  placeholder = 'Advisor name',
  listId,
}) => {
  const [advisors, setAdvisors] = useState<
    Array<{ name: string; firm?: string; phone?: string; email?: string }>
  >([]);
  const datalistId = listId || `advisor-suggestions-${packetId}`;

  useEffect(() => {
    if (!packetId) return;
    let cancelled = false;
    supabase
      .from('advisor_records')
      .select('name, firm, phone, email')
      .eq('packet_id', packetId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        setAdvisors(
          data
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
    if (match) {
      onPick(match);
    } else {
      onChangeText(next);
    }
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
