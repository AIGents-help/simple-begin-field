import { supabase } from '@/integrations/supabase/client';

/**
 * Whitelist of real columns on retirement_records.
 * Anything outside this set gets folded into legacy_notes so we never
 * silently discard data.
 */
const ALLOWED_COLUMNS = new Set([
  'id', 'packet_id', 'scope',
  'account_type', 'institution', 'category',
  'account_number_encrypted', 'account_number_masked',
  'beneficiary_notes', 'contact_info', 'notes',
  'status', 'is_na',
  'created_at', 'updated_at',
  'beneficiary_last_reviewed_date',
  'approximate_value',
  'details', 'nickname', 'employer_name', 'legacy_notes', 'loan_balance',
]);

/** Mask all but last 4 of an account number. */
export const maskAccountNumber = (raw?: string | null): string => {
  const digits = (raw || '').replace(/\s+/g, '');
  if (!digits) return '';
  if (digits.length <= 4) return digits;
  return `••••${digits.slice(-4)}`;
};

/**
 * Sanitize payload before save:
 * - Strip unknown columns into legacy_notes (additive — preserves prior legacy_notes).
 * - Coerce numeric fields.
 */
export const sanitizeRetirementPayload = (form: Record<string, any>) => {
  const clean: Record<string, any> = {};
  const legacyExtras: Record<string, any> = {};

  for (const [k, v] of Object.entries(form)) {
    if (ALLOWED_COLUMNS.has(k)) {
      clean[k] = v;
    } else if (v !== null && v !== undefined && v !== '') {
      legacyExtras[k] = v;
    }
  }

  // Numeric coercion
  if (clean.approximate_value !== undefined && clean.approximate_value !== null && clean.approximate_value !== '') {
    const n = Number(clean.approximate_value);
    clean.approximate_value = Number.isFinite(n) ? n : null;
  }
  if (clean.loan_balance !== undefined && clean.loan_balance !== null && clean.loan_balance !== '') {
    const n = Number(clean.loan_balance);
    clean.loan_balance = Number.isFinite(n) ? n : null;
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

  // Empty-string -> null for date fields
  if (clean.beneficiary_last_reviewed_date === '') clean.beneficiary_last_reviewed_date = null;

  return clean;
};

/**
 * Years since the beneficiary review date. Returns null if unknown.
 */
export const yearsSince = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const t = new Date(dateStr).getTime();
  if (Number.isNaN(t)) return null;
  return (Date.now() - t) / (365.25 * 24 * 60 * 60 * 1000);
};

export const retirementService = {
  async list(packetId: string) {
    const { data, error } = await supabase
      .from('retirement_records')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false });
    return { data: data || [], error };
  },

  async upsert(record: Record<string, any>) {
    const payload = sanitizeRetirementPayload(record);
    if (payload.id && !String(payload.id).startsWith('draft-')) {
      const { id, ...rest } = payload;
      const { data, error } = await supabase
        .from('retirement_records')
        .update(rest)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }
    // Insert (drop any draft id)
    const { id: _drop, ...insertPayload } = payload;
    const { data, error } = await supabase
      .from('retirement_records')
      .insert(insertPayload)
      .select()
      .single();
    return { data, error };
  },

  async remove(id: string) {
    const { error } = await supabase
      .from('retirement_records')
      .delete()
      .eq('id', id);
    return { error };
  },
};
