import { useCallback, useEffect, useState } from 'react';
import { customSectionService, CustomSection } from '../services/customSectionService';

export const useCustomSections = (packetId: string | undefined) => {
  const [sections, setSections] = useState<CustomSection[]>([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!packetId) {
      setSections([]);
      return;
    }
    setLoading(true);
    try {
      const data = await customSectionService.list(packetId);
      setSections(data);
    } catch (err) {
      console.error('[useCustomSections] load failed', err);
      setSections([]);
    } finally {
      setLoading(false);
    }
  }, [packetId]);

  useEffect(() => {
    void load();
  }, [load]);

  return { sections, loading, reload: load, setSections };
};
