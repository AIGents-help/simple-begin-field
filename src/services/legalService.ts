import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PACKET_ID, DEMO_LEGAL_DOCUMENTS } from '../demo/morganFamilyData';

/**
 * Whitelist of REAL columns on legal_documents.
 * Anything outside this set gets folded into legacy_notes so we never
 * silently discard data.
 *
 * Mirrors the Retirement service pattern.
 */
const ALLOWED_COLUMNS = new Set<string>([
  // Core
  'id', 'packet_id', 'scope',
  'document_type', 'document_name',
  'category', 'status', 'is_na',
  'created_at', 'updated_at',
  // Existing legacy columns we keep using
  'attorney_name', 'attorney_firm', 'attorney_phone', 'attorney_email',
  'document_date', 'original_location', 'notes', 'last_reviewed_date',
  // New per-kind structured columns
  'executor_name', 'alternate_executor_name',
  'trust_type', 'trustee_name', 'successor_trustee_name', 'assets_in_trust',
  'agent_name', 'agent_phone', 'agent_email', 'alternate_agent_name',
  'effective_when', 'is_durable',
  'life_sustaining_preference', 'artificial_nutrition_preference',
  'pain_management_preference', 'organ_donation_preference',
  'guardian_name', 'guardian_phone', 'guardian_email',
  'alternate_guardian_name', 'guardian_reasoning',
  'parties_involved', 'other_subtype',
  // Catch-all + preservation
  'details', 'legacy_notes',
]);

/** Legal document kinds used by the card UI. */
export type LegalKind =
  | 'will'
  | 'trust'
  | 'fin_poa'
  | 'hcpoa'
  | 'living_will'
  | 'guardianship'
  | 'other';

/** Single-instance kinds: only one card per packet (gray out chip after add). */
export const SINGLE_INSTANCE_KINDS: LegalKind[] = [
  'will', 'fin_poa', 'hcpoa', 'living_will',
];

export const KIND_LABELS: Record<LegalKind, string> = {
  will: 'Will',
  trust: 'Trust',
  fin_poa: 'Financial Power of Attorney',
  hcpoa: 'Healthcare Power of Attorney',
  living_will: 'Living Will / Advance Directive',
  guardianship: 'Guardianship Nomination',
  other: 'Other Legal Document',
};

/** Find-a-Pro search query per kind. */
export const KIND_PRO_QUERY: Record<LegalKind, string> = {
  will: 'Estate Planning Attorney',
  trust: 'Trust Attorney',
  fin_poa: 'Estate Planning Attorney',
  hcpoa: 'Elder Law Attorney',
  living_will: 'Elder Law Attorney',
  guardianship: 'Family Law Attorney',
  other: 'Estate Planning Attorney',
};

/**
 * Database `document_type` value stored per kind.
 * Existing rows may use other casings (will, Will, last_will, etc.) — the
 * `kindFromDocumentType` helper normalises them.
 */
export const KIND_DB_VALUE: Record<LegalKind, string> = {
  will: 'will',
  trust: 'trust',
  fin_poa: 'financial_poa',
  hcpoa: 'healthcare_poa',
  living_will: 'living_will',
  guardianship: 'guardianship',
  other: 'other',
};

/** Normalise an arbitrary legacy document_type string into a LegalKind. */
export const kindFromDocumentType = (raw?: string | null): LegalKind => {
  const s = (raw || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return 'other';
  if (s.includes('living') || s.includes('advance') || s.includes('directive')) return 'living_will';
  if (s.includes('healthcare') || s.includes('hcpoa') || s.includes('medicalpoa')) return 'hcpoa';
  if (s.includes('financialpoa') || s.includes('finpoa') || s.includes('financialpowerofattorney')) return 'fin_poa';
  if (s.includes('poa') || s.includes('powerofattorney')) return 'fin_poa';
  if (s.includes('guardian')) return 'guardianship';
  if (s.includes('trust')) return 'trust';
  if (s.includes('will')) return 'will';
  return 'other';
};

/**
 * Sanitize payload before save:
 * - Strip unknown columns into legacy_notes (additive — preserves prior).
 * - Coerce booleans / empty dates.
 */
export const sanitizeLegalPayload = (form: Record<string, any>) => {
  const clean: Record<string, any> = {};
  const legacyExtras: Record<string, any> = {};

  for (const [k, v] of Object.entries(form)) {
    if (ALLOWED_COLUMNS.has(k)) {
      clean[k] = v;
    } else if (v !== null && v !== undefined && v !== '') {
      legacyExtras[k] = v;
    }
  }

  // Boolean coercion
  if (clean.is_durable !== undefined) {
    if (clean.is_durable === '' || clean.is_durable === null) clean.is_durable = null;
    else clean.is_durable = !!clean.is_durable;
  }

  // Empty-string -> null for dates
  for (const dateField of ['document_date', 'last_reviewed_date']) {
    if (clean[dateField] === '') clean[dateField] = null;
  }

  // Append unknown fields to legacy_notes as a JSON-ish block
  if (Object.keys(legacyExtras).length > 0) {
    const stamp = new Date().toISOString().slice(0, 10);
    const block = `\n\n[Legacy fields preserved ${stamp}]\n` +
      Object.entries(legacyExtras)
        .map(([k, v]) => `• ${k}: ${typeof v === 'object' ? JSON.stringify(v) : String(v)}`)
        .join('\n');
    clean.legacy_notes = (clean.legacy_notes || '') + block;
  }

  return clean;
};

/** Years since a YYYY-MM-DD date string. Returns null if invalid. */
export const yearsSince = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000);
};

export const legalService = {
  async list(packetId: string) {
    if (isDemoMode() && packetId === DEMO_PACKET_ID) {
      return { data: DEMO_LEGAL_DOCUMENTS as any[], error: null };
    }
    const { data, error } = await supabase
      .from('legal_documents')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async upsert(record: Record<string, any>) {
    const payload = sanitizeLegalPayload(record);
    if (payload.id && !String(payload.id).startsWith('draft-')) {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from('legal_documents')
        .update(rest as any)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
    const { id: _drop, ...insertPayload } = payload;
    const { data, error } = await supabase
      .from('legal_documents')
      .insert(insertPayload as any)
      .select()
      .single();
    return { data, error };
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('legal_documents')
      .delete()
      .eq('id', id);
    return { error };
  },
};
