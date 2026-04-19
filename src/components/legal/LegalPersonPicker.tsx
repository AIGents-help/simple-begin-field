import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';

interface Person {
  name: string;
  relationship?: string;
  phone?: string;
  email?: string;
  source: 'family' | 'trusted';
}

interface Props {
  packetId: string;
  value: string;
  onChange: (val: string, match?: Omit<Person, 'name'>) => void;
  placeholder?: string;
  listId?: string;
}

/**
 * Unified picker that suggests names from BOTH family_members and
 * trusted_contacts. Used for executors, agents, guardians, etc.
 */
export const LegalPersonPicker: React.FC<Props> = ({
  packetId,
  value,
  onChange,
  placeholder = 'Type or pick a name',
  listId,
}) => {
  const [people, setPeople] = useState<Person[]>([]);
  const datalistId = listId || `legal-people-${packetId}`;

  useEffect(() => {
    if (!packetId) return;
    let cancelled = false;

    Promise.all([
      supabase
        .from('family_members')
        .select('name, first_name, last_name, relationship, phone, email')
        .eq('packet_id', packetId),
      supabase
        .from('trusted_contacts')
        .select('name, relationship, phone, email')
        .eq('packet_id', packetId),
    ]).then(([famRes, trustRes]) => {
      if (cancelled) return;
      const family: Person[] = (famRes.data || [])
        .map((r: any) => ({
          name: r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim(),
          relationship: r.relationship || undefined,
          phone: r.phone || undefined,
          email: r.email || undefined,
          source: 'family' as const,
        }))
        .filter((m) => m.name);
      const trusted: Person[] = (trustRes.data || [])
        .map((r: any) => ({
          name: r.name,
          relationship: r.relationship || 'Trusted Contact',
          phone: r.phone || undefined,
          email: r.email || undefined,
          source: 'trusted' as const,
        }))
        .filter((m) => m.name);

      // De-dupe by lowercase name (family wins over trusted)
      const map = new Map<string, Person>();
      for (const p of [...family, ...trusted]) {
        const key = p.name.toLowerCase();
        if (!map.has(key)) map.set(key, p);
      }
      setPeople(Array.from(map.values()));
    });

    return () => {
      cancelled = true;
    };
  }, [packetId]);

  const handleChange = (next: string) => {
    const match = people.find((p) => p.name.toLowerCase() === next.toLowerCase());
    if (match) {
      const { name: _n, ...rest } = match;
      onChange(next, rest);
    } else {
      onChange(next);
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
        {people.map((p) => (
          <option key={`${p.source}-${p.name}`} value={p.name}>
            {p.relationship || ''}
          </option>
        ))}
      </datalist>
    </>
  );
};
