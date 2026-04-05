import { supabase } from '@/integrations/supabase/client';
import { documentService } from './documentService';

export const sectionService = {
  // Mapping SectionId to table names
  tableMap: {
    'info': 'info_records',
    'family': 'family_members',
    'real-estate': 'real_estate_records',
    'banking': 'banking_records',
    'retirement': 'retirement_records',
    'vehicles': 'vehicle_records',
    'advisors': 'advisor_records',
    'passwords': 'password_records',
    'property': 'personal_property_records',
    'pets': 'pet_records',
    'funeral': 'funeral_records',
    'private': 'private_items',
    'medical': 'medical_records'
  } as Record<string, string>,

  async getRecords(packetId: string, sectionKey: string, scope?: 'personA' | 'personB' | 'shared') {
    const tableName = this.tableMap[sectionKey];
    if (!tableName) return { data: [], error: new Error(`No table mapped for section: ${sectionKey}`) };

    let query = (supabase as any)
      .from(tableName)
      .select('*')
      .eq('packet_id', packetId);
    
    if (scope) {
      query = query.eq('scope', scope);
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createRecord(sectionKey: string, record: any) {
    const tableName = this.tableMap[sectionKey];
    console.log(`Creating record in ${tableName}:`, record);
    if (!tableName) return { data: null, error: new Error(`No table mapped for section: ${sectionKey}`) };

    const { data, error } = await (supabase as any)
      .from(tableName)
      .insert(record)
      .select()
      .single();
    
    if (error) {
      console.error(`Error creating record in ${tableName}:`, error);
    } else {
      console.log(`Successfully created record in ${tableName}:`, data);
    }
    
    return { data, error };
  },

  async updateRecord(sectionKey: string, recordId: string, updates: any) {
    const tableName = this.tableMap[sectionKey];
    console.log(`Updating record ${recordId} in ${tableName}:`, updates);
    if (!tableName) return { data: null, error: new Error(`No table mapped for section: ${sectionKey}`) };

    const { data, error } = await (supabase as any)
      .from(tableName)
      .update(updates)
      .eq('id', recordId)
      .select()
      .single();
    
    if (error) {
      console.error(`Error updating record ${recordId} in ${tableName}:`, error);
    } else {
      console.log(`Successfully updated record ${recordId} in ${tableName}:`, data);
    }
    
    return { data, error };
  },

  async deleteRecord(sectionKey: string, recordId: string) {
    const tableName = this.tableMap[sectionKey];
    if (!tableName) return { data: null, error: new Error(`No table mapped for section: ${sectionKey}`) };

    const { error } = await (supabase as any)
      .from(tableName)
      .delete()
      .eq('id', recordId);
    
    return { error };
  },

  // Document management (Delegated to documentService)
  async getDocuments(packetId: string, sectionKey?: string, recordId?: string) {
    return documentService.getDocuments(packetId, sectionKey, recordId);
  },

  async uploadDocument(
    packetId: string, 
    file: File, 
    metadata: { 
      sectionKey: string, 
      recordId?: string, 
      category?: string,
      fileName?: string,
      scope: 'personA' | 'personB' | 'shared',
      isPrivate?: boolean
    }
  ) {
    return documentService.uploadAndCreate(file, {
      packetId,
      sectionKey: metadata.sectionKey,
      recordId: metadata.recordId,
      category: metadata.category,
      fileName: metadata.fileName,
      scope: metadata.scope,
      isPrivate: metadata.isPrivate
    });
  },

  async getDocumentUrl(filePath: string, isPrivate: boolean = false) {
    return documentService.getDocumentUrl(filePath, isPrivate);
  },

  async getCompletionStats(packetId: string) {
    const { data, error } = await supabase
      .from('section_completion')
      .select('*')
      .eq('packet_id', packetId);
    
    return { data, error };
  },

  async searchRecords(packetId: string, query: string) {
    const { data, error } = await supabase
      .from('section_records')
      .select('*')
      .eq('packet_id', packetId)
      .or(`title.ilike.%${query}%,description.ilike.%${query}%`);
    
    return { data, error };
  }
};

