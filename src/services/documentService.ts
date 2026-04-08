import { supabase } from '../lib/supabase';
import { uploadService } from './uploadService';
import { FileMetadata } from '../components/upload/types';

export interface DocumentMetadata {
  packetId: string;
  sectionKey: string;
  recordId?: string;
  category?: string;
  fileName?: string;
  scope: 'personA' | 'personB' | 'shared';
  isPrivate?: boolean;
}

export const documentService = {
  async getDocuments(packetId: string, sectionKey?: string, recordId?: string) {
    let query = supabase
      .from('documents')
      .select('*')
      .eq('packet_id', packetId);
    
    if (sectionKey) query = query.eq('section_key', sectionKey);
    if (recordId) query = query.eq('related_record_id', recordId);

    const { data, error } = await query;
    return { data, error };
  },

  async uploadAndCreate(file: File, metadata: DocumentMetadata) {
    console.log("Starting upload for file:", file.name, "size:", file.size);
    
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `${metadata.packetId}/${metadata.sectionKey}/${metadata.recordId || 'general'}/${fileName}`;
    const bucket = metadata.isPrivate ? 'packet-private-documents' : 'packet-documents';

    console.log("Upload path:", filePath, "Bucket:", bucket);

    // 1. Get current user
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error("No authenticated user found for upload");
      return { data: null, error: new Error("Authentication required") };
    }

    // 2. Upload to storage
    const { error: uploadError } = await uploadService.uploadFile(bucket, filePath, file);
    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return { data: null, error: { message: `Storage upload failed: ${uploadError.message || JSON.stringify(uploadError)}`, ...uploadError } };
    }
    
    console.log("File uploaded successfully to storage");

    // 3. Create document record in DB
    const docData = {
      packet_id: metadata.packetId,
      section_key: metadata.sectionKey,
      related_record_id: metadata.recordId,
      category: metadata.category,
      scope: metadata.scope,
      file_name: metadata.fileName || file.name,
      file_path: filePath,
      mime_type: file.type,
      file_size: file.size,
      is_private: metadata.isPrivate ?? false,
      uploaded_by: user.id
    };

    console.log("Inserting document metadata:", docData);

    const { data, error: dbError } = await supabase
      .from('documents')
      .insert(docData)
      .select()
      .single();
    
    if (dbError) {
      console.error("Database insert error:", dbError);
      return { data: null, error: { message: `Database record creation failed: ${dbError.message || JSON.stringify(dbError)}`, ...dbError } };
    } else {
      console.log("Document metadata inserted successfully:", data);
    }

    return { data, error: null };
  },

  async getDocumentUrl(filePath: string, isPrivate: boolean = false) {
    const bucket = isPrivate ? 'packet-private-documents' : 'packet-documents';
    
    if (isPrivate) {
      return await uploadService.getSignedUrl(bucket, filePath);
    } else {
      return uploadService.getPublicUrl(bucket, filePath);
    }
  },

  async deleteDocument(documentId: string, filePath: string, isPrivate: boolean = false) {
    const bucket = isPrivate ? 'packet-private-documents' : 'packet-documents';

    // 1. Delete from storage
    const { error: storageError } = await uploadService.deleteFile(bucket, filePath);
    if (storageError) console.warn("Could not delete file from storage:", storageError);

    // 2. Delete from DB
    const { error: dbError } = await supabase
      .from('documents')
      .delete()
      .eq('id', documentId);
    
    return { error: dbError };
  }
};
