import { supabase } from '@/lib/supabase';
import { Database } from '../types/database';
import { documentService } from './documentService';

type Tables = Database['public']['Tables'];

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
    'memories': 'memories',
    'private': 'private_items',
    'medical': 'medical_records'
  } as Record<string, any>,

  async getRecords(packetId: string, sectionKey: string, scope?: 'personA' | 'personB' | 'shared') {
    const tableName = this.tableMap[sectionKey];
    if (!tableName) return { data: [], error: new Error(`No table mapped for section: ${sectionKey}`) };

    let query = supabase
      .from(tableName)
      .select('*')
      .eq('packet_id', packetId);
    
    if (scope) {
      if (sectionKey === 'family' && scope !== 'shared') {
        query = query.or(`scope.eq.${scope},scope.eq.shared`);
      } else {
        query = query.eq('scope', scope);
      }
    }

    const { data, error } = await query;
    return { data, error };
  },

  async createRecord(sectionKey: string, record: any) {
    const tableName = this.tableMap[sectionKey];
    console.log(`Creating record in ${tableName}:`, record);
    if (!tableName) return { data: null, error: new Error(`No table mapped for section: ${sectionKey}`) };

    const { data, error } = await supabase
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

    const { data, error } = await supabase
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

    const { error } = await supabase
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

  /**
   * Returns a map of sectionKey -> total count (records + uploaded documents)
   * for the given packet. Used by the dashboard folder cards.
   *
   * Counts are derived from the *actual* tables (and the documents table),
   * not from the section_completion bookkeeping table — which historically
   * lacked a record_count column and always returned 0.
   */
  async getSectionCounts(packetId: string): Promise<Record<string, number>> {
    const sectionKeys = Object.keys(this.tableMap);

    // Count records per section table (one head request per table)
    const recordCounts = await Promise.all(
      sectionKeys.map(async (key) => {
        const tableName = this.tableMap[key];
        const { count } = await supabase
          .from(tableName)
          .select('id', { count: 'exact', head: true })
          .eq('packet_id', packetId);
        return [key, count ?? 0] as const;
      })
    );

    // Count documents grouped by section_key (single query)
    const { data: docRows } = await supabase
      .from('documents')
      .select('section_key')
      .eq('packet_id', packetId);

    const docCounts: Record<string, number> = {};
    for (const row of docRows || []) {
      const k = (row as any).section_key as string | null;
      if (!k) continue;
      docCounts[k] = (docCounts[k] || 0) + 1;
    }

    const result: Record<string, number> = {};
    for (const [key, recordCount] of recordCounts) {
      result[key] = recordCount + (docCounts[key] || 0);
    }
    return result;
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

