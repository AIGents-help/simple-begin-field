import { supabase } from '@/integrations/supabase/client';

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
    let query = supabase
      .from('info_records')
      .select('*')
      .eq('packet_id', packetId)
      .in('category', IDENTITY_CATEGORIES as unknown as string[])
      .order('created_at', { ascending: true });
    if (scope) query = query.eq('scope', scope);
    const { data, error } = await query;
    if (error) throw error;
    return (data || []) as unknown as IdentityRecord[];
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
