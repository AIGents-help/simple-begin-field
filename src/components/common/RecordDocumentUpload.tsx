import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadService } from '@/services/uploadService';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useFileDropzone } from '@/hooks/useFileDropzone';

interface Props {
  packetId: string;
  /** DB table this record belongs to (e.g. 'family_members'). */
  relatedTable: string;
  /** Record id. Pass null for new (unsaved) records — the upload UI prompts to save first. */
  relatedRecordId: string | null;
  /** Document category — used as the discriminator when listing/loading. */
  category: string;
  /** Title shown above the field. */
  label: string;
  /** Helper line under the title. */
  description?: string;
  /** Bucket to upload into. Defaults to private. */
  isPrivate?: boolean;
  /** Override the upload-button label. */
  uploadLabel?: string;
}

/**
 * Reusable single-document attachment field, scoped to a specific record + category.
 *
 * Use anywhere we want a clearly-labelled document slot attached to a parent record
 * (e.g. Marriage Certificate inside a Spouse record, Vehicle Title inside a Vehicle, etc.).
 */
export const RecordDocumentUpload: React.FC<Props> = ({
  packetId,
  relatedTable,
  relatedRecordId,
  category,
  label,
  description,
  isPrivate = true,
  uploadLabel,
}) => {
  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  const bucket = isPrivate ? 'packet-private-documents' : 'packet-documents';

  useEffect(() => {
    let cancelled = false;
    if (!relatedRecordId) {
      setDoc(null);
      return;
    }
    setLoading(true);
    supabase
      .from('documents')
      .select('id, file_name, file_path, mime_type, file_size, created_at, is_private')
      .eq('packet_id', packetId)
      .eq('related_table', relatedTable)
      .eq('related_record_id', relatedRecordId)
      .eq('category', category)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle()
      .then(({ data }) => {
        if (!cancelled) setDoc(data || null);
      })
      .then(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, [packetId, relatedTable, relatedRecordId, category]);

  const processFile = async (file: File) => {
    if (!relatedRecordId) {
      toast.error('Save the record first, then upload the document', {
        duration: 4000, position: 'bottom-center',
      });
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('This file type is not supported. Accepted: PDF, JPG, PNG', {
        duration: 4000, position: 'bottom-center',
      });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      toast.error('File must be under 20MB', { duration: 4000, position: 'bottom-center' });
      return;
    }

    setBusy(true);
    try {
      const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const path = `${packetId}/${category}/${relatedTable}/${relatedRecordId}/${Date.now()}_${safe}`;
      const { error: upErr } = await uploadService.uploadFile(bucket, path, file);
      if (upErr) throw new Error(upErr.message || 'Upload failed');

      const { data, error } = await supabase
        .from('documents')
        .insert({
          packet_id: packetId,
          related_table: relatedTable,
          related_record_id: relatedRecordId,
          category,
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          is_private: isPrivate,
        })
        .select()
        .single();
      if (error) throw error;

      setDoc(data);
      toast.success(`${label} uploaded`, { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      console.error(`${label} upload failed`, err);
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const { isDragging, isTouch, dropzoneProps } = useFileDropzone({
    onFiles: (files) => files[0] && processFile(files[0]),
    disabled: busy || !relatedRecordId,
    multiple: false,
  });

  const handleView = async () => {
    if (!doc) return;
    const { url, error } = await uploadService.getSignedUrl(bucket, doc.file_path, 300);
    if (error || !url) {
      toast.error('Could not open file', { duration: 4000, position: 'bottom-center' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!doc) return;
    const ok = await confirm({
      title: `Remove this ${label.toLowerCase()}?`,
      description: 'The file will be permanently deleted. This action cannot be undone.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await uploadService.deleteFile(bucket, doc.file_path);
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      setDoc(null);
      toast.success('Document removed', { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="rounded-xl border border-stone-200 bg-stone-50 p-3 space-y-2">
      <div>
        <p className="text-xs font-bold text-navy-muted">{label}</p>
        {description && <p className="text-[10px] text-stone-500">{description}</p>}
      </div>

      {!relatedRecordId ? (
        <p className="text-[11px] text-stone-500 italic">Save this record first to attach a document.</p>
      ) : loading ? (
        <div className="flex items-center gap-2 text-stone-500 text-xs">
          <Loader2 size={14} className="animate-spin" /> Loading…
        </div>
      ) : doc ? (
        <div className="flex items-center gap-2 bg-white border border-stone-200 rounded-lg px-3 py-2">
          <FileText size={16} className="text-navy-muted shrink-0" />
          <button
            type="button"
            onClick={handleView}
            className="flex-1 text-left text-xs font-medium text-navy-muted truncate hover:underline"
            title={doc.file_name || doc.file_path}
          >
            {doc.file_name || label}
          </button>
          <button
            type="button"
            onClick={handleView}
            className="p-1.5 text-stone-400 hover:text-navy-muted"
            aria-label="Open document"
          >
            <ExternalLink size={14} />
          </button>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            className="text-[10px] font-bold uppercase tracking-wider text-navy-muted hover:underline disabled:opacity-50"
          >
            Replace
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={busy}
            className="p-1.5 text-rose-500 hover:bg-rose-50 rounded disabled:opacity-50"
            aria-label="Delete document"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          {...dropzoneProps}
          className={`w-full flex flex-col items-center justify-center gap-1.5 px-3 py-4 rounded-lg border-2 border-dashed text-xs font-bold transition-all disabled:opacity-50 min-h-[88px] ${
            isDragging
              ? 'border-solid border-amber-500 bg-amber-50 text-amber-700 scale-[1.01]'
              : 'border-stone-300 text-navy-muted hover:bg-white'
          }`}
        >
          {busy ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          <span>
            {busy
              ? 'Uploading…'
              : isDragging
                ? 'Drop to upload'
                : isTouch
                  ? (uploadLabel || `Tap to upload ${label}`)
                  : 'Drag & drop or tap to upload'}
          </span>
          {!busy && !isDragging && (
            <span className="text-[9px] uppercase tracking-wider text-stone-400 font-bold">PDF, JPG, PNG · Max 20MB</span>
          )}
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="application/pdf,image/jpeg,image/png"
        className="hidden"
        onChange={handleSelect}
      />
    </div>
  );
};
