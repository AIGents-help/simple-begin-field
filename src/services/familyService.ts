import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_FAMILY_MEMBERS } from '../demo/morganFamilyData';

/**
 * Whitelist of columns that exist on family_members. Anything outside this set
 * gets folded into legacy_notes so we never silently drop user data.
 */
const ALLOWED_COLUMNS = new Set([
  'id', 'packet_id', 'scope', 'name',
  'first_name', 'middle_name', 'last_name', 'suffix', 'preferred_name',
  'relationship', 'relationship_subtype', 'category',
  'birthday', 'place_of_birth', 'gender',
  'phone', 'email', 'address',
  'occupation', 'employer',
  'photo_path',
  'is_deceased', 'date_of_death', 'place_of_death', 'cause_of_death',
  'marital_status', 'marriage_date', 'marriage_place',
  'marriage_certificate_on_file',
  'separation_date', 'divorce_finalized_date', 'divorce_finalized',
  'divorce_attorney', 'divorce_jurisdiction', 'divorce_settlement_notes',
  'parent_member_id',
  'ssn_encrypted', 'ssn_masked',
  'reminder_notes', 'legacy_notes',
  'status', 'is_na',
  // New columns from the family revamp migration
  'is_dependent', 'is_beneficiary', 'has_special_needs', 'special_needs_notes',
  'guardian_name', 'guardian_relationship', 'guardian_phone',
  'school_name', 'lives_with_user',
  'which_parent', 'parent_side', 'inlaw_subtype', 'related_to_spouse_id',
  'related_to_member_id',
  'created_at', 'updated_at',
]);

/** Mask all but last 4 digits of an SSN-style string. */
export const maskSsn = (raw?: string | null): string => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  return `•••-••-${digits.slice(-4)}`;
};

/** Compose the legacy `name` column from first + last (NOT NULL constraint). */
export const composeName = (form: any): string => {
  const parts = [form.first_name, form.middle_name, form.last_name]
    .map((s: any) => (s || '').trim())
    .filter(Boolean);
  let n = parts.join(' ');
  if (form.suffix?.trim()) n += `, ${form.suffix.trim()}`;
  return n || form.name || form.preferred_name || 'Unnamed';
};

/** Returns true if the given DOB makes this person under 18. */
export const isMinorFromBirthday = (birthday?: string | null): boolean => {
  if (!birthday) return false;
  const t = new Date(birthday).getTime();
  if (Number.isNaN(t)) return false;
  const ageMs = Date.now() - t;
  const ageYrs = ageMs / (365.25 * 24 * 60 * 60 * 1000);
  return ageYrs >= 0 && ageYrs < 18;
};

/**
 * Sanitize a family_members payload before save:
 * - Compose `name` from first+last
 * - Whitelist DB columns
 * - Move any unknown UI-only fields into legacy_notes (never lose data)
 * - Coerce 'true'/'false' strings, empty dates → null
 */
export const sanitizeFamilyPayload = (form: any, opts?: { extraLegacy?: string[] }) => {
  const payload: any = { ...form };

  // Always compose the legacy name column
  payload.name = composeName(payload);

  // SSN mask helper
  if (payload.ssn_encrypted) {
    payload.ssn_masked = maskSsn(payload.ssn_encrypted);
  }

  // Coerce empty date strings → null (Postgres rejects '')
  const dateCols = [
    'birthday', 'date_of_death', 'marriage_date',
    'separation_date', 'divorce_finalized_date',
  ];
  dateCols.forEach((c) => { if (payload[c] === '') payload[c] = null; });

  // Coerce empty strings on FK columns to null
  if (payload.related_to_spouse_id === '') payload.related_to_spouse_id = null;
  if (payload.related_to_member_id === '') payload.related_to_member_id = null;
  if (payload.parent_member_id === '') payload.parent_member_id = null;

  // Normalize boolean-like values
  const boolCols = [
    'is_deceased', 'is_dependent', 'is_beneficiary', 'has_special_needs',
    'lives_with_user', 'divorce_finalized', 'marriage_certificate_on_file',
    'is_na',
  ];
  boolCols.forEach((c) => {
    const v = payload[c];
    if (v === 'true' || v === 'yes' || v === 'Yes') payload[c] = true;
    else if (v === 'false' || v === 'no' || v === 'No') payload[c] = false;
    else if (v === '') payload[c] = null;
  });

  // Strip UI-only meta fields (begin with __)
  Object.keys(payload).forEach((k) => {
    if (k.startsWith('__')) delete payload[k];
  });

  // Whitelist + collect anything else into legacy_notes
  const extras: string[] = [...(opts?.extraLegacy || [])];
  Object.keys(payload).forEach((k) => {
    if (!ALLOWED_COLUMNS.has(k)) {
      const v = payload[k];
      if (v !== undefined && v !== null && v !== '') {
        extras.push(`${k}: ${typeof v === 'object' ? JSON.stringify(v) : v}`);
      }
      delete payload[k];
    }
  });

  if (extras.length > 0) {
    const prefix = payload.legacy_notes ? `${payload.legacy_notes}\n\n` : '';
    payload.legacy_notes = `${prefix}${extras.join('\n')}`;
  }

  // Strip system-managed fields on insert/update
  delete payload.created_at;
  delete payload.updated_at;

  return payload;
};

export const familyService = {
  async list(packetId: string) {
    if (isDemoMode()) {
      return { data: DEMO_FAMILY_MEMBERS as any[], error: null };
    }
    return supabase
      .from('family_members')
      .select('*')
      .eq('packet_id', packetId)
      .order('relationship', { ascending: true })
      .order('birthday', { ascending: true });
  },

  async upsert(form: any) {
    const payload = sanitizeFamilyPayload(form);
    if (payload.id) {
      const { id, ...rest } = payload;
      return supabase.from('family_members').update(rest).eq('id', id).select().single();
    }
    return supabase.from('family_members').insert(payload).select().single();
  },

  async remove(id: string) {
    return supabase.from('family_members').delete().eq('id', id);
  },
};

/**
 * Standard relationship buckets used to group cards in the list view.
 *
 * Order in this array IS the top-to-bottom render order. Specific matchers
 * (e.g. step-child, grandchild, ex-spouse) MUST come before broader ones
 * (e.g. child, spouse) — first match wins. `other` is the catch-all.
 */
export const RELATIONSHIP_GROUPS: Array<{
  key: string;
  label: string;
  matches: (rel: string) => boolean;
}> = [
  // Current spouse / partner only — exes are filtered out by the section
  // renderer using marital_status, not by relationship text.
  { key: 'spouse',       label: 'Spouse / Partner',     matches: (r) => /(^|\s)(spouse|partner)/.test(r) && !/^ex[-\s]?(spouse|partner)/.test(r) },

  // Specific child variants before generic "child"
  { key: 'stepchild',    label: 'Step-Children',        matches: (r) => /step[-\s]?(child|son|daughter)/.test(r) },
  { key: 'grandchild',   label: 'Grandchildren',        matches: (r) => /grandchild|grandson|granddaughter/.test(r) },
  { key: 'child',        label: 'Children',             matches: (r) => /child|son|daughter/.test(r) },

  // Specific parent variants before generic "parent"
  { key: 'stepparent',   label: 'Step-Parents',         matches: (r) => /step[-\s]?(parent|mother|father|mom|dad)/.test(r) },
  { key: 'grandparent',  label: 'Grandparents',         matches: (r) => /grandparent|grandmother|grandfather/.test(r) },
  { key: 'parent',       label: 'Parents',              matches: (r) => /^parent|^mother|^father|^mom$|^dad$/.test(r) },

  // Specific sibling variants before generic "sibling"
  { key: 'stepsibling',  label: 'Step-Siblings',        matches: (r) => /step[-\s]?(sibling|brother|sister)/.test(r) },
  { key: 'sibling',      label: 'Siblings',             matches: (r) => /sibling|brother|sister/.test(r) },

  { key: 'inlaw',        label: 'In-Laws',              matches: (r) => /in.?law/.test(r) },
  { key: 'cousin',       label: 'Cousins',              matches: (r) => /cousin/.test(r) },
  { key: 'nieceNephew',  label: 'Nieces & Nephews',     matches: (r) => /niece|nephew/.test(r) },

  { key: 'other',        label: 'Other Family',         matches: () => true },

  // Always rendered LAST by the section, regardless of array position above.
  // Kept here so it has a label and matcher for any direct lookups.
  { key: 'ex',           label: 'Ex-Spouse / Partner',  matches: (r) => /^ex[-\s]?(spouse|partner)/.test(r) },
];

export const groupRelationship = (record: any): string => {
  const rel = (record?.relationship || '').toLowerCase().trim();
  // Ex bucket — explicit relationship label OR spouse with ex-style status
  if (/^ex[-\s]?(spouse|partner)/.test(rel)) return 'ex';
  const status = String(record?.marital_status || '').toLowerCase();
  if (/spouse|partner/.test(rel) && /(divorced|separated|former|ex)/.test(status)) {
    return 'ex';
  }
  for (const g of RELATIONSHIP_GROUPS) {
    if (g.key === 'ex') continue; // handled above
    if (g.matches(rel)) return g.key;
  }
  return 'other';
};

/** True if a spouse-group record represents an ex (used for sorting). */
export const isExPartner = (record: any): boolean => {
  const rel = String(record?.relationship || '').toLowerCase();
  if (/^ex[-\s]?(spouse|partner)/.test(rel)) return true;
  const status = String(record?.marital_status || '').toLowerCase();
  return /(divorced|separated|former|ex)/.test(status);
};

/** Display label for a relationship value, used in the "Related to" dropdown. */
export const relationshipDisplayLabel = (rel?: string | null): string => {
  if (!rel) return 'Family';
  return rel;
};
