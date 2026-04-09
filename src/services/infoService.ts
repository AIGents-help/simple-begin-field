// src/services/infoService.ts

import { supabase } from '../lib/supabase'

export interface InfoRecord {
  id: string
  packet_id: string
  scope: 'personA' | 'personB' | 'shared'
  category: string
  title: string
  notes: string | null
  status: string
  created_by: string
  created_at: string
  updated_at: string
}

export interface InfoDocument {
  id: string
  file_name: string
  file_path: string
  mime_type: string | null
  file_size: number | null
  created_at: string
}

export interface SaveInfoResult {
  record: InfoRecord
  document: InfoDocument | null
  error: null
}

export interface SaveInfoError {
  record: null
  document: null
  error: string
}

export type SaveInfoResponse = SaveInfoResult | SaveInfoError

/**
 * Fetch all info_records for a given packet.
 * Returns records newest-first.
 */
export async function fetchInfoRecords(packetId: string): Promise<InfoRecord[]> {
  const { data, error } = await supabase
    .from('info_records')
    .select('*')
    .eq('packet_id', packetId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[infoService] fetchInfoRecords error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Fetch documents linked to a specific info_record.
 */
export async function fetchInfoDocuments(
  packetId: string,
  infoRecordId: string
): Promise<InfoDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, file_name, file_path, mime_type, file_size, created_at')
    .eq('packet_id', packetId)
    .eq('related_table', 'info_records')
    .eq('related_record_id', infoRecordId)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[infoService] fetchInfoDocuments error:', error)
    throw new Error(error.message)
  }

  return data ?? []
}

/**
 * Core save flow:
 * 1. Get current user (required for RLS)
 * 2. Insert info_record → get ID
 * 3. If file provided → upload to Storage → insert documents row
 * 4. Return full result or structured error
 */
export async function saveInfoRecord(params: {
  packetId: string
  scope: 'personA' | 'personB' | 'shared'
  category: string
  title: string
  notes: string
  file: File | null
}): Promise<SaveInfoResponse> {
  const { packetId, scope, category, title, notes, file } = params

  // Step 0: Verify auth — RLS will reject without this
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      record: null,
      document: null,
      error: 'You must be logged in to save information.',
    }
  }

  // Step 1: Insert info_record
  // NOTE: We explicitly set created_by = user.id to satisfy the
  // `info_records_insert_member_access` RLS policy check.
  const { data: recordData, error: recordError } = await supabase
    .from('info_records')
    .insert({
      packet_id: packetId,
      scope,
      category,
      title,
      notes,
      status: 'in_progress',
      created_by: user.id, // Required: RLS policy checks created_by = auth.uid()
    })
    .select()
    .single()

  if (recordError || !recordData) {
    console.error('[infoService] insert info_record failed:', recordError)
    return {
      record: null,
      document: null,
      error: recordError?.message ?? 'Failed to save record. Please try again.',
    }
  }

  const record = recordData as InfoRecord

  let document: InfoDocument | null = null

  // Step 2: Upload file if provided
  if (file) {
    const uploadResult = await uploadInfoDocument({
      file,
      packetId,
      infoRecordId: record.id,
      scope,
      userId: user.id,
    })

    if (uploadResult.error) {
      // Record saved successfully, but file upload failed.
      // Return the record with the file error surfaced — do NOT silently ignore.
      return {
        record: null,
        document: null,
        error: `Record saved but file upload failed: ${uploadResult.error}`,
      }
    }

    document = uploadResult.document
  }

  return { record, document, error: null }
}

/**
 * Internal: upload file to Supabase Storage and create documents row.
 * Path convention: {packetId}/info/{infoRecordId}/{timestamp}_{filename}
 */
async function uploadInfoDocument(params: {
  file: File
  packetId: string
  infoRecordId: string
  scope: 'personA' | 'personB' | 'shared'
  userId: string
}): Promise<{ document: InfoDocument; error: null } | { document: null; error: string }> {
  const { file, packetId, infoRecordId, scope, userId } = params

  const timestamp = Date.now()
  const safeFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
  const storagePath = `${packetId}/info/${infoRecordId}/${timestamp}_${safeFileName}`

  // Step 2a: Upload to Storage
  const { error: storageError } = await supabase.storage
    .from('packet-documents')
    .upload(storagePath, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type || 'application/octet-stream',
    })

  if (storageError) {
    console.error('[infoService] storage upload failed:', storageError)
    return { document: null, error: storageError.message }
  }

  // Step 2b: Insert documents metadata row
  // NOTE: uploaded_by = userId is required by documents RLS:
  // `documents_insert_member_access` checks uploaded_by = auth.uid()
  const { data: docData, error: docError } = await supabase
    .from('documents')
    .insert({
      packet_id: packetId,
      related_table: 'info_records',
      related_record_id: infoRecordId,
      scope,
      section_key: 'info',
      category: 'info',
      file_name: file.name,
      file_path: storagePath,
      mime_type: file.type || null,
      file_size: file.size,
      uploaded_by: userId, // Required: RLS checks uploaded_by = auth.uid()
      is_private: true,
    })
    .select()
    .single()

  if (docError || !docData) {
    console.error('[infoService] documents insert failed:', docError)
    // Storage upload succeeded but DB record failed — log for cleanup
    console.warn('[infoService] Orphaned storage file:', storagePath)
    return { document: null, error: docError?.message ?? 'Failed to save document metadata.' }
  }

  return { document: docData as InfoDocument, error: null }
}

/**
 * Delete an info_record and its associated documents.
 */
export async function deleteInfoRecord(
  recordId: string,
  packetId: string
): Promise<{ success: boolean; error: string | null }> {
  // First fetch associated document paths for storage cleanup
  const { data: docs } = await supabase
    .from('documents')
    .select('file_path')
    .eq('related_table', 'info_records')
    .eq('related_record_id', recordId)

  // Delete the record (cascade will handle documents row via FK if set,
  // but documents table has no FK cascade, so delete manually)
  const { error: docDeleteError } = await supabase
    .from('documents')
    .delete()
    .eq('related_table', 'info_records')
    .eq('related_record_id', recordId)

  if (docDeleteError) {
    console.error('[infoService] deleteInfoRecord: docs delete failed', docDeleteError)
  }

  // Delete storage files
  if (docs && docs.length > 0) {
    const paths = docs.map((d) => d.file_path)
    const { error: storageDeleteError } = await supabase.storage
      .from('packet-documents')
      .remove(paths)

    if (storageDeleteError) {
      console.warn('[infoService] storage cleanup partial failure:', storageDeleteError)
    }
  }

  // Delete the record itself
  const { error: recordDeleteError } = await supabase
    .from('info_records')
    .delete()
    .eq('id', recordId)
    .eq('packet_id', packetId)

  if (recordDeleteError) {
    console.error('[infoService] deleteInfoRecord failed:', recordDeleteError)
    return { success: false, error: recordDeleteError.message }
  }

  return { success: true, error: null }
}
