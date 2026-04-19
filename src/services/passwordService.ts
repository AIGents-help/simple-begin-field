import { supabase } from '@/integrations/supabase/client';

/**
 * Whitelist of REAL columns on password_records.
 * Anything outside this set gets folded into legacy_notes so we never
 * silently discard data. Mirrors legalService / advisorService pattern.
 */
const ALLOWED_COLUMNS = new Set<string>([
  // Core
  'id', 'packet_id', 'scope', 'category', 'status', 'is_na',
  'created_at', 'updated_at',
  // Existing legacy columns
  'service_name', 'username', 'password_encrypted', 'password_masked',
  'recovery_email', 'two_fa_notes', 'access_instructions',
  'who_should_access', 'notes', 'requires_reauth',
  // New account info
  'website_url',
  // New access details
  'two_fa_enabled', 'two_fa_method', 'authenticator_app', 'backup_codes_location',
  // New account details
  'account_phone', 'security_question_hint', 'account_created_date',
  'subscription_cost', 'renewal_date',
  // Trusted contact instructions
  'after_death_action', 'special_instructions', 'handler_contact_id',
  // Crypto
  'crypto_exchange', 'wallet_type', 'hardware_wallet_location', 'seed_phrase_location',
  // Social media
  'memorial_contact_name', 'download_archive_instructions',
  // Work
  'work_company_name', 'hr_contact_name', 'hr_contact_phone',
  // Password manager (sentinel)
  'manager_name', 'master_password_location', 'recovery_key_location',
  'emergency_instructions', 'trusted_person_name',
  // Catch-all + preservation
  'details', 'legacy_notes',
]);

export const PASSWORD_MANAGER_CATEGORY = '__password_manager__';

export type PasswordCategory =
  | 'banking' | 'email' | 'social' | 'government' | 'medical'
  | 'shopping' | 'streaming' | 'work' | 'utilities' | 'investment'
  | 'crypto' | 'other';

export const PASSWORD_CATEGORIES: { value: PasswordCategory; label: string }[] = [
  { value: 'banking', label: 'Banking' },
  { value: 'email', label: 'Email' },
  { value: 'social', label: 'Social Media' },
  { value: 'government', label: 'Government' },
  { value: 'medical', label: 'Medical' },
  { value: 'shopping', label: 'Shopping' },
  { value: 'streaming', label: 'Streaming' },
  { value: 'work', label: 'Work' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'investment', label: 'Investment' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' },
];

/** Split a payload into (whitelisted columns, legacy overflow). */
function splitPayload(payload: Record<string, any>) {
  const allowed: Record<string, any> = {};
  const overflow: Record<string, any> = {};
  for (const [k, v] of Object.entries(payload)) {
    if (v === undefined) continue;
    if (ALLOWED_COLUMNS.has(k)) {
      allowed[k] = v;
    } else {
      overflow[k] = v;
    }
  }
  return { allowed, overflow };
}

export const passwordService = {
  PASSWORD_MANAGER_CATEGORY,

  async listAll(packetId: string) {
    if (isDemoMode() && packetId === DEMO_PACKET_ID) {
      return { data: DEMO_PASSWORDS as any[], error: null };
    }
    const { data, error } = await (supabase as any)
      .from('password_records')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false });
    return { data: (data || []) as any[], error };
  },

  async getManager(packetId: string) {
    if (isDemoMode() && packetId === DEMO_PACKET_ID) {
      const mgr = (DEMO_PASSWORDS as any[]).find((p) => p.category === PASSWORD_MANAGER_CATEGORY) || null;
      return { data: mgr, error: null };
    }
    const { data, error } = await (supabase as any)
      .from('password_records')
      .select('*')
      .eq('packet_id', packetId)
      .eq('category', PASSWORD_MANAGER_CATEGORY)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    return { data, error };
  },

  /**
   * Sanitize + persist. Folds unmapped fields into legacy_notes so existing
   * data is never lost.
   */
  async save(packetId: string, record: any) {
    const { id, ...rest } = record || {};
    const { allowed, overflow } = splitPayload(rest);

    // Merge any overflow into legacy_notes
    let legacy_notes = allowed.legacy_notes || {};
    if (typeof legacy_notes === 'string') {
      try { legacy_notes = JSON.parse(legacy_notes); } catch { legacy_notes = {}; }
    }
    if (Object.keys(overflow).length > 0) {
      legacy_notes = { ...legacy_notes, ...overflow };
    }

    const payload = {
      ...allowed,
      legacy_notes,
      packet_id: packetId,
    };

    if (id) {
      const { data, error } = await (supabase as any)
        .from('password_records')
        .update(payload)
        .eq('id', id)
        .select()
        .single();
      return { data, error };
    }

    const { data, error } = await (supabase as any)
      .from('password_records')
      .insert(payload)
      .select()
      .single();
    return { data, error };
  },

  async remove(id: string) {
    const { error } = await (supabase as any)
      .from('password_records')
      .delete()
      .eq('id', id);
    return { error };
  },
};
