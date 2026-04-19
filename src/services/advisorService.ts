import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PACKET_ID, DEMO_ADVISORS } from '../demo/morganFamilyData';

/**
 * Whitelist of REAL columns on advisor_records. Anything outside this set
 * gets folded into legacy_notes so we never silently discard data.
 *
 * Mirrors Legal/Retirement service patterns.
 */
const ALLOWED_COLUMNS = new Set<string>([
  // Core / identity
  'id', 'packet_id', 'scope', 'category', 'is_na',
  'name', 'first_name', 'last_name',
  // Contact
  'firm', 'phone', 'email', 'address', 'website', 'photo_path',
  // Type + status (we keep BOTH advisor_status and status — write to advisor_status, read either)
  'advisor_type', 'advisor_status', 'status',
  // Lifecycle
  'is_deceased', 'date_of_death', 'death_certificate_path',
  // Per-kind structured columns
  'specialty', 'license_type', 'license_number', 'license_states',
  'client_reference', 'license_expiry_date',
  'software_used', 'tax_reminders',
  'firm_regulatory_status', 'aum_estimate', 'fee_structure',
  'insurance_lines', 'agency_name',
  'realtor_specialties', 'areas_handled',
  // Free-form
  'notes', 'details', 'legacy_notes',
  // Timestamps
  'created_at', 'updated_at',
]);

/** Advisor kinds used by the card UI. */
export type AdvisorKind =
  | 'attorney'
  | 'cpa'
  | 'financial'
  | 'insurance'
  | 'realtor'
  | 'doctor'
  | 'other';

export const KIND_LABELS: Record<AdvisorKind, string> = {
  attorney: 'Attorney',
  cpa: 'CPA / Accountant',
  financial: 'Financial Advisor',
  insurance: 'Insurance Agent',
  realtor: 'Realtor',
  doctor: 'Primary Care Doctor',
  other: 'Other Advisor',
};

export const KIND_PRO_QUERY: Record<AdvisorKind, string> = {
  attorney: 'Attorney',
  cpa: 'Certified Public Accountant',
  financial: 'Financial Advisor',
  insurance: 'Insurance Agent',
  realtor: 'Realtor',
  doctor: 'Primary Care Physician',
  other: 'Estate Planning Attorney',
};

/** Stored advisor_type strings — keep stable so existing pickers (Legal/Retirement) keep matching. */
export const KIND_DB_VALUE: Record<AdvisorKind, string> = {
  attorney: 'attorney',
  cpa: 'cpa',
  financial: 'financial',
  insurance: 'insurance',
  realtor: 'realtor',
  doctor: 'doctor',
  other: 'other',
};

/** Normalise an arbitrary legacy advisor_type string into an AdvisorKind. */
export const kindFromAdvisorType = (raw?: string | null): AdvisorKind => {
  const s = (raw || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!s) return 'other';
  if (s.includes('attorney') || s.includes('lawyer') || s.includes('legal')) return 'attorney';
  if (s.includes('cpa') || s.includes('account') || s.includes('bookkeep') || s.includes('tax')) return 'cpa';
  if (s.includes('financial') || s.includes('cfp') || s.includes('ria') || s.includes('broker') || s.includes('wealth')) return 'financial';
  if (s.includes('insurance') || s.includes('agent')) return 'insurance';
  if (s.includes('realtor') || s.includes('realestate') || s.includes('agent')) return 'realtor';
  if (s.includes('doctor') || s.includes('physician') || s.includes('md') || s.includes('primarycare')) return 'doctor';
  return 'other';
};

/** Split a legacy single "name" into first/last on the LAST space. */
export const splitName = (full?: string | null): { first: string; last: string } => {
  const t = (full || '').trim();
  if (!t) return { first: '', last: '' };
  const idx = t.lastIndexOf(' ');
  if (idx === -1) return { first: t, last: '' };
  return { first: t.slice(0, idx).trim(), last: t.slice(idx + 1).trim() };
};

/** Resolve effective status, preferring advisor_status, falling back to status. */
export const effectiveStatus = (row: any): string => {
  return (row?.advisor_status || row?.status || 'active').toString();
};

/**
 * Sanitize payload before save:
 * - Strip unknown columns into legacy_notes (additive — preserves prior).
 * - Coerce booleans / empty dates / numbers / arrays.
 * - Ensure name = "${first} ${last}" whenever first/last present (DB trigger
 *   also enforces this; we set it client-side so optimistic UI is correct).
 */
export const sanitizeAdvisorPayload = (form: Record<string, any>) => {
  const clean: Record<string, any> = {};
  const legacyExtras: Record<string, any> = {};

  for (const [k, v] of Object.entries(form)) {
    if (ALLOWED_COLUMNS.has(k)) clean[k] = v;
    else if (v !== null && v !== undefined && v !== '') legacyExtras[k] = v;
  }

  // Compose name from first/last if either is set — never null
  const fn = (clean.first_name || '').toString().trim();
  const ln = (clean.last_name || '').toString().trim();
  const composed = `${fn} ${ln}`.trim();
  if (composed) clean.name = composed;
  else if (!clean.name) clean.name = ''; // satisfy NOT NULL

  // Boolean coercion
  if (clean.is_deceased !== undefined) clean.is_deceased = !!clean.is_deceased;
  if (clean.tax_reminders !== undefined) clean.tax_reminders = !!clean.tax_reminders;
  if (clean.is_na !== undefined) clean.is_na = !!clean.is_na;

  // Empty-string dates -> null
  for (const dateField of ['date_of_death', 'license_expiry_date']) {
    if (clean[dateField] === '') clean[dateField] = null;
  }

  // Numeric coercion
  if (clean.aum_estimate === '' || clean.aum_estimate === null || clean.aum_estimate === undefined) {
    clean.aum_estimate = null;
  } else if (typeof clean.aum_estimate === 'string') {
    const n = Number(clean.aum_estimate.replace(/[^0-9.\\-]/g, ''));
    clean.aum_estimate = Number.isFinite(n) ? n : null;
  }

  // Ensure arrays are arrays (not strings)
  for (const arrField of ['license_states', 'software_used', 'insurance_lines', 'realtor_specialties', 'areas_handled']) {
    const v = clean[arrField];
    if (v === undefined || v === null || v === '') clean[arrField] = null;
    else if (Array.isArray(v)) clean[arrField] = v.filter((x) => x !== null && x !== undefined && String(x).trim() !== '');
    else if (typeof v === 'string') {
      clean[arrField] = v.split(',').map((s) => s.trim()).filter(Boolean);
    }
  }

  // If is_deceased toggled false, surface that as advisor_status (without dropping it)
  if (clean.is_deceased === true) {
    clean.advisor_status = 'deceased';
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

export const advisorService = {
  async list(packetId: string) {
    if (isDemoMode() && packetId === DEMO_PACKET_ID) {
      return { data: DEMO_ADVISORS as any[], error: null };
    }
    const { data, error } = await supabase
      .from('advisor_records')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async upsert(record: Record<string, any>) {
    const payload = sanitizeAdvisorPayload(record);
    if (payload.id && !String(payload.id).startsWith('draft-')) {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from('advisor_records')
        .update(rest as any)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
    const { id: _drop, ...insertPayload } = payload;
    const { data, error } = await supabase
      .from('advisor_records')
      .insert(insertPayload as any)
      .select()
      .single();
    return { data, error };
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('advisor_records')
      .delete()
      .eq('id', id);
    return { error };
  },
};
