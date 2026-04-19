import { supabase } from '@/lib/supabase';
import { isDemoMode } from '../demo/demoMode';
import {
  DEMO_PACKET_ID,
  DEMO_CUSTOM_SECTIONS,
  DEMO_CUSTOM_SECTION_RECORDS,
} from '../demo/morganFamilyData';

export interface CustomSection {
  id: string;
  packet_id: string;
  user_id: string;
  name: string;
  icon: string;
  description: string | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface CustomSectionRecord {
  id: string;
  custom_section_id: string;
  packet_id: string;
  title: string;
  notes: string | null;
  entry_date: string | null;
  scope: string | null;
  status: string | null;
  created_at: string;
  updated_at: string;
}

export const customSectionService = {
  async list(packetId: string): Promise<CustomSection[]> {
    if (isDemoMode() && packetId === DEMO_PACKET_ID) {
      return DEMO_CUSTOM_SECTIONS as unknown as CustomSection[];
    }
    const { data, error } = await supabase
      .from('custom_sections' as any)
      .select('*')
      .eq('packet_id', packetId)
      .order('sort_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) {
      console.error('[customSectionService.list]', error);
      throw error;
    }
    return (data || []) as unknown as CustomSection[];
  },

  async create(input: {
    packetId: string;
    userId: string;
    name: string;
    icon: string;
    description?: string | null;
  }): Promise<CustomSection> {
    const { data, error } = await supabase
      .from('custom_sections' as any)
      .insert({
        packet_id: input.packetId,
        user_id: input.userId,
        name: input.name.trim(),
        icon: input.icon,
        description: input.description?.trim() || null,
      } as any)
      .select()
      .single();
    if (error) {
      console.error('[customSectionService.create]', error);
      throw error;
    }
    return data as unknown as CustomSection;
  },

  async update(id: string, updates: Partial<Pick<CustomSection, 'name' | 'icon' | 'description' | 'sort_order'>>): Promise<CustomSection> {
    const { data, error } = await supabase
      .from('custom_sections' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[customSectionService.update]', error);
      throw error;
    }
    return data as unknown as CustomSection;
  },

  async remove(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_sections' as any)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[customSectionService.remove]', error);
      throw error;
    }
  },

  async listRecords(customSectionId: string): Promise<CustomSectionRecord[]> {
    if (isDemoMode() && DEMO_CUSTOM_SECTION_RECORDS[customSectionId]) {
      return DEMO_CUSTOM_SECTION_RECORDS[customSectionId] as unknown as CustomSectionRecord[];
    }
    const { data, error } = await supabase
      .from('custom_section_records' as any)
      .select('*')
      .eq('custom_section_id', customSectionId)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('[customSectionService.listRecords]', error);
      throw error;
    }
    return (data || []) as unknown as CustomSectionRecord[];
  },

  async createRecord(input: {
    customSectionId: string;
    packetId: string;
    title: string;
    notes?: string | null;
    entryDate?: string | null;
  }): Promise<CustomSectionRecord> {
    const { data, error } = await supabase
      .from('custom_section_records' as any)
      .insert({
        custom_section_id: input.customSectionId,
        packet_id: input.packetId,
        title: input.title.trim(),
        notes: input.notes?.trim() || null,
        entry_date: input.entryDate || null,
      } as any)
      .select()
      .single();
    if (error) {
      console.error('[customSectionService.createRecord]', error);
      throw error;
    }
    return data as unknown as CustomSectionRecord;
  },

  async updateRecord(id: string, updates: Partial<Pick<CustomSectionRecord, 'title' | 'notes' | 'entry_date'>>): Promise<CustomSectionRecord> {
    const { data, error } = await supabase
      .from('custom_section_records' as any)
      .update(updates as any)
      .eq('id', id)
      .select()
      .single();
    if (error) {
      console.error('[customSectionService.updateRecord]', error);
      throw error;
    }
    return data as unknown as CustomSectionRecord;
  },

  async removeRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('custom_section_records' as any)
      .delete()
      .eq('id', id);
    if (error) {
      console.error('[customSectionService.removeRecord]', error);
      throw error;
    }
  },
};
