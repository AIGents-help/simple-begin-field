import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { sectionService } from '../services/sectionService';
import { SECTIONS_CONFIG } from '../config/sectionsConfig';
import { useAppContext } from '../context/AppContext';

/**
 * SINGLE SOURCE OF TRUTH for packet completion.
 *
 * Definitions:
 *  - A section is "complete" when it has at least 1 record in its
 *    mapped table OR at least 1 uploaded document.
 *  - sectionPercent: 0 (empty) or 100 (has content). Sections do not
 *    have intermediate completion — the dashboard treats presence as
 *    a binary signal.
 *  - overallPercent: percentage of countable sections that are complete.
 *
 * The 'affiliate' and 'private' sections are excluded from the overall
 * count because they are optional / role-gated.
 *
 * Re-runs whenever `completionVersion` from AppContext is bumped, which
 * happens after every save in AddEditSheet — so all consumers (header
 * badge, progress circle, folder cards) refresh together immediately.
 */

export interface SectionCompletion {
  count: number;
  hasContent: boolean;
  percent: number; // 0 or 100
}

export interface PacketCompletion {
  loading: boolean;
  overallPercent: number;
  completedSections: number;
  totalSections: number;
  sectionStatus: Record<string, SectionCompletion>;
  refresh: () => void;
}

// Sections that should NOT count toward overall progress
const EXCLUDED_FROM_OVERALL = new Set(['affiliate']);

export function usePacketCompletion(packetId: string | undefined): PacketCompletion {
  const { completionVersion } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [sectionStatus, setSectionStatus] = useState<Record<string, SectionCompletion>>({});

  const load = useCallback(async () => {
    if (!packetId) {
      setSectionStatus({});
      setLoading(false);
      return;
    }
    try {
      const counts = await sectionService.getSectionCounts(packetId);
      const next: Record<string, SectionCompletion> = {};
      for (const section of SECTIONS_CONFIG) {
        const count = counts[section.id] ?? 0;
        const hasContent = count > 0;
        next[section.id] = {
          count,
          hasContent,
          percent: hasContent ? 100 : 0,
        };
      }
      setSectionStatus(next);
    } catch (err) {
      console.error('usePacketCompletion: failed to load counts', err);
    } finally {
      setLoading(false);
    }
  }, [packetId]);

  useEffect(() => {
    setLoading(true);
    void load();
  }, [load, completionVersion]);

  const countable = SECTIONS_CONFIG.filter(s => !EXCLUDED_FROM_OVERALL.has(s.id));
  const completedSections = countable.filter(s => sectionStatus[s.id]?.hasContent).length;
  const totalSections = countable.length;
  const overallPercent = totalSections > 0
    ? Math.round((completedSections / totalSections) * 100)
    : 0;

  return {
    loading,
    overallPercent,
    completedSections,
    totalSections,
    sectionStatus,
    refresh: load,
  };
}
