import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Renders a hidden <datalist> of family-member names for the current packet
 * so the property "Specific recipient" input can suggest existing family.
 */
export const PropertyFamilyDatalist: React.FC<{ packetId: string }> = ({ packetId }) => {
  const [names, setNames] = useState<string[]>([]);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from('family_members')
      .select('name, first_name, last_name')
      .eq('packet_id', packetId)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const list = data
          .map((r: any) => r.name || `${r.first_name || ''} ${r.last_name || ''}`.trim())
          .filter(Boolean);
        setNames(Array.from(new Set(list)));
      });
    return () => {
      cancelled = true;
    };
  }, [packetId]);

  return (
    <datalist id="family-recipients">
      {names.map((n) => (
        <option key={n} value={n} />
      ))}
    </datalist>
  );
};
