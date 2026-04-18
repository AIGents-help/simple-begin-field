import { supabase } from '@/integrations/supabase/client';

export type TemplateComplexity = 'Simple' | 'Moderate' | 'Complex';

export interface TemplateSection {
  id: string;
  title: string;
  body: string;
}

export interface TemplateContent {
  intro?: string;
  sections: TemplateSection[];
}

export interface GuidanceNote {
  section: string;
  tip: string;
}

export interface DocumentTemplate {
  id: string;
  template_type: string;
  version: string;
  name: string;
  description: string | null;
  complexity: TemplateComplexity;
  icon: string | null;
  state_specific: boolean;
  template_content: TemplateContent;
  guidance_notes: GuidanceNote[];
  is_active: boolean;
}

export interface TemplateDraft {
  id: string;
  user_id: string;
  packet_id: string;
  template_type: string;
  template_version: string;
  title: string | null;
  content: { sections?: TemplateSection[] };
  placeholder_values: Record<string, string>;
  last_saved_at: string;
  is_complete: boolean;
  share_token: string | null;
  share_token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

const TABLE = 'user_template_drafts' as const;
const TEMPLATES_TABLE = 'document_templates' as const;

export const legalTemplatesService = {
  async listTemplates(): Promise<DocumentTemplate[]> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE as any)
      .select('*')
      .eq('is_active', true)
      .order('name');
    if (error) throw error;
    return (data || []) as unknown as DocumentTemplate[];
  },

  async getTemplate(templateType: string): Promise<DocumentTemplate | null> {
    const { data, error } = await supabase
      .from(TEMPLATES_TABLE as any)
      .select('*')
      .eq('template_type', templateType)
      .eq('is_active', true)
      .order('version', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as DocumentTemplate) || null;
  },

  async listDrafts(packetId: string): Promise<TemplateDraft[]> {
    const { data, error } = await supabase
      .from(TABLE as any)
      .select('*')
      .eq('packet_id', packetId)
      .order('updated_at', { ascending: false });
    if (error) throw error;
    return (data || []) as unknown as TemplateDraft[];
  },

  async getDraft(draftId: string): Promise<TemplateDraft | null> {
    const { data, error } = await supabase
      .from(TABLE as any)
      .select('*')
      .eq('id', draftId)
      .maybeSingle();
    if (error) throw error;
    return (data as unknown as TemplateDraft) || null;
  },

  async createDraft(input: {
    user_id: string;
    packet_id: string;
    template_type: string;
    template_version: string;
    title?: string;
    placeholder_values?: Record<string, string>;
    content?: { sections?: TemplateSection[] };
  }): Promise<TemplateDraft> {
    const { data, error } = await supabase
      .from(TABLE as any)
      .insert({
        user_id: input.user_id,
        packet_id: input.packet_id,
        template_type: input.template_type,
        template_version: input.template_version,
        title: input.title ?? null,
        placeholder_values: input.placeholder_values ?? {},
        content: input.content ?? {},
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as TemplateDraft;
  },

  async updateDraft(
    draftId: string,
    patch: Partial<Pick<TemplateDraft, 'title' | 'content' | 'placeholder_values' | 'is_complete'>>,
  ): Promise<TemplateDraft> {
    const { data, error } = await supabase
      .from(TABLE as any)
      .update({ ...patch, last_saved_at: new Date().toISOString() })
      .eq('id', draftId)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as TemplateDraft;
  },

  async deleteDraft(draftId: string): Promise<void> {
    const { error } = await supabase.from(TABLE as any).delete().eq('id', draftId);
    if (error) throw error;
  },

  async generateShareLink(draftId: string, daysValid = 7): Promise<{ token: string; expiresAt: string }> {
    // Generate a random token client-side; store it on the draft.
    const buf = new Uint8Array(24);
    crypto.getRandomValues(buf);
    const token = Array.from(buf).map((b) => b.toString(16).padStart(2, '0')).join('');
    const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000).toISOString();
    const { error } = await supabase
      .from(TABLE as any)
      .update({ share_token: token, share_token_expires_at: expiresAt })
      .eq('id', draftId);
    if (error) throw error;
    return { token, expiresAt };
  },

  async revokeShareLink(draftId: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE as any)
      .update({ share_token: null, share_token_expires_at: null })
      .eq('id', draftId);
    if (error) throw error;
  },

  /**
   * Pull packet data needed to auto-fill template placeholders.
   * Returns a flat map of placeholder name -> value (where known).
   */
  async fetchAutofillValues(packetId: string): Promise<Record<string, string>> {
    const out: Record<string, string> = {};
    out.SIGNING_DATE = new Date().toLocaleDateString();

    const [{ data: family }, { data: advisors }, { data: funeral }, { data: packet }] = await Promise.all([
      supabase.from('family_members').select('name, first_name, middle_name, last_name, relationship, birthday, address, scope').eq('packet_id', packetId),
      supabase.from('advisor_records').select('name, advisor_type, firm, phone, email').eq('packet_id', packetId),
      supabase.from('funeral_records').select('funeral_home, funeral_director, burial_or_cremation, service_preferences, obituary_text, flowers_preferences, reception_wishes, prepaid_arrangements').eq('packet_id', packetId).maybeSingle(),
      supabase.from('packets').select('person_a_name, person_b_name, household_mode').eq('id', packetId).maybeSingle(),
    ]);

    // Owner / spouse
    const personA = packet?.person_a_name || '';
    const personB = packet?.person_b_name || '';
    if (personA) out.FULL_LEGAL_NAME = personA;
    if (personB) out.SPOUSE_NAME = personB;

    // Family
    const fam = family || [];
    const self = fam.find((m: any) => /self|me|owner/i.test(m.relationship || ''));
    if (self) {
      if (self.address) out.ADDRESS = self.address;
      if (self.birthday) out.DATE_OF_BIRTH = new Date(self.birthday).toLocaleDateString();
    }
    const spouse = fam.find((m: any) => /spouse|wife|husband|partner/i.test(m.relationship || ''));
    if (spouse?.name && !out.SPOUSE_NAME) out.SPOUSE_NAME = spouse.name;

    const children = fam.filter((m: any) => /child|son|daughter/i.test(m.relationship || ''));
    if (children.length) {
      out.CHILDREN_NAMES = children.map((c: any) => c.name).join(', ');
    }

    // Attorney
    const attorney = (advisors || []).find((a: any) => /attorney|lawyer|legal/i.test(`${a.advisor_type || ''} ${a.firm || ''}`));
    if (attorney) {
      if (attorney.name) out.ATTORNEY_NAME = attorney.name;
      if (attorney.phone) out.ATTORNEY_PHONE = attorney.phone;
    }

    // Funeral
    if (funeral) {
      if (funeral.funeral_home) out.FUNERAL_HOME = funeral.funeral_home;
      if (funeral.burial_or_cremation) out.BURIAL_OR_CREMATION = funeral.burial_or_cremation;
      if (funeral.service_preferences) out.SERVICE_PREFERENCES = funeral.service_preferences;
      if (funeral.obituary_text) out.OBITUARY_TEXT = funeral.obituary_text;
      if (funeral.flowers_preferences) out.FLOWERS_PREFERENCES = funeral.flowers_preferences;
      if (funeral.reception_wishes) out.RECEPTION_WISHES = funeral.reception_wishes;
      if (funeral.prepaid_arrangements) out.PREPAID_ARRANGEMENTS = funeral.prepaid_arrangements;
    }

    return out;
  },
};

/** Extract [PLACEHOLDER] tokens from a template's full body. */
export function extractPlaceholders(template: DocumentTemplate): string[] {
  const all: string[] = [];
  template.template_content.sections.forEach((s) => {
    const matches = s.body.match(/\[([A-Z0-9_]+)\]/g) || [];
    matches.forEach((m) => {
      const name = m.slice(1, -1);
      if (!all.includes(name)) all.push(name);
    });
  });
  return all;
}

/** Render a section body by substituting placeholder values. Unfilled placeholders remain as [NAME]. */
export function renderSectionBody(body: string, values: Record<string, string>): string {
  return body.replace(/\[([A-Z0-9_]+)\]/g, (_, key) => {
    const v = values[key];
    return v && v.trim() ? v : `[${key}]`;
  });
}

/** Friendly label from a placeholder name. e.g. FULL_LEGAL_NAME -> "Full Legal Name" */
export function humanizePlaceholder(name: string): string {
  return name
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}
