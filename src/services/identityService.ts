import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PACKET_ID, DEMO_IDENTITY_RECORDS } from '../demo/morganFamilyData';

export type IdentityCategory =
  | 'personal_info'
  | 'drivers_license'
  | 'passport'
  | 'social_security'
  | 'birth_certificate'
  | 'citizenship'
  | 'other_government_id';

export const IDENTITY_CATEGORIES: IdentityCategory[] = [
  'drivers_license',
  'passport',
  'social_security',
  'birth_certificate',
  'citizenship',
  'other_government_id',
];

export const IDENTITY_CATEGORY_LABELS: Record<IdentityCategory, string> = {
  personal_info: 'Personal Information',
  drivers_license: "Driver's License",
  passport: 'Passport',
  social_security: 'Social Security',
  birth_certificate: 'Birth Certificate',
  citizenship: 'Citizenship / Naturalization',
  other_government_id: 'Other Government ID',
};

export interface IdentityRecord {
  id: string;
  packet_id: string;
  scope: string;
  category: IdentityCategory | string;
  title: string | null;
  notes: string | null;
  expiry_date: string | null;
  details: Record<string, any>;
  created_at?: string;
  updated_at?: string;
  status?: string | null;
}

export const identityService = {
  async list(packetId: string, scope?: string) {
    if (isDemoMode()) {
      return DEMO_IDENTITY_RECORDS as unknown as IdentityRecord[];
    }
    // Pull modern category-tagged records.
    let modernQ = supabase
      .from('info_records')
      .select('*')
      .eq('packet_id', packetId)
      .in('category', IDENTITY_CATEGORIES as unknown as string[])
      .order('created_at', { ascending: true });
    if (scope) modernQ = modernQ.eq('scope', scope);
    const { data: modern, error: modernErr } = await modernQ;
    if (modernErr) throw modernErr;

    // Pull legacy records saved with category='Other' but a recognizable title
    // (e.g. "Driver's License Details", "Passport Details") so older data still shows
    // up in the new cards without any data migration.
    let legacyQ = supabase
      .from('info_records')
      .select('*')
      .eq('packet_id', packetId)
      .or(
        [
          "title.ilike.%driver%license%",
          "title.ilike.%passport%",
          "title.ilike.%social security%",
          "title.ilike.%birth certificate%",
          "title.ilike.%citizenship%",
          "title.ilike.%naturalization%",
          "title.ilike.%global entry%",
          "title.ilike.%tsa precheck%",
          "title.ilike.%state id%",
        ].join(',')
      )
      .order('created_at', { ascending: true });
    if (scope) legacyQ = legacyQ.eq('scope', scope);
    const { data: legacy } = await legacyQ;

    // Merge, mapping each legacy row's category to the matching IdentityCategory
    // so the card components render & filter correctly. The DB row is untouched.
    const byId = new Map<string, IdentityRecord>();
    for (const row of (modern || []) as unknown as IdentityRecord[]) byId.set(row.id, row);
    for (const row of (legacy || []) as any[]) {
      if (byId.has(row.id)) continue;
      const t = String(row.title || '').toLowerCase();
      let mapped: IdentityCategory | null = null;
      if (t.includes('driver') && t.includes('license')) mapped = 'drivers_license';
      else if (t.includes('passport')) mapped = 'passport';
      else if (t.includes('social security')) mapped = 'social_security';
      else if (t.includes('birth certificate')) mapped = 'birth_certificate';
      else if (t.includes('citizenship') || t.includes('naturalization')) mapped = 'citizenship';
      else if (t.includes('global entry') || t.includes('tsa precheck') || t.includes('state id')) mapped = 'other_government_id';
      if (!mapped) continue;
      byId.set(row.id, { ...row, category: mapped } as IdentityRecord);
    }
    return Array.from(byId.values());
  },

  async upsert(record: Partial<IdentityRecord> & { packet_id: string; category: string; scope: string }) {
    // Guarantee a non-null title — the info_records table has a NOT NULL constraint.
    // Fall back to the human label for the category so cards never need to set it manually.
    const fallbackTitle =
      IDENTITY_CATEGORY_LABELS[record.category as IdentityCategory] || 'Identity Document';
    const cleanTitle = (record.title ?? '').trim();
    const payload: any = {
      packet_id: record.packet_id,
      scope: record.scope,
      category: record.category,
      title: cleanTitle.length > 0 ? cleanTitle : fallbackTitle,
      notes: record.notes ?? null,
      expiry_date: record.expiry_date ?? null,
      details: record.details ?? {},
      status: 'completed',
    };

    if (record.id && !record.id.startsWith('draft-')) {
      const { data, error } = await supabase
        .from('info_records')
        .update(payload)
        .eq('id', record.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as IdentityRecord;
    }

    const { data, error } = await supabase
      .from('info_records')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as IdentityRecord;
  },

  async remove(id: string) {
    const { error } = await supabase.from('info_records').delete().eq('id', id);
    if (error) throw error;
  },
};
