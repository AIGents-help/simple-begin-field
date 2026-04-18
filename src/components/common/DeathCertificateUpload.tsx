import React, { useEffect, useRef, useState } from 'react';
import { Upload, FileText, Trash2, Loader2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { uploadService } from '@/services/uploadService';
import { useConfirm } from '@/context/ConfirmDialogContext';

interface DeathCertificateUploadProps {
  packetId: string;
  /** The DB table this record belongs to (e.g. 'family_members', 'pet_records', 'advisor_records', 'trusted_contacts'). */
  relatedTable: string;
  /** The record's id. Pass null for new (unsaved) records — upload UI is hidden until saved. */
  relatedRecordId: string | null;
}

/**
 * Reusable death-certificate upload field.
 *
 * Shown directly under a Living/Deceased toggle whenever the record is marked deceased.
 * Hides itself when the record reverts to living, but never deletes the underlying file
 * (the parent should preserve historical data).
 *
 * Persists into the documents table with category='death_certificate' and ties to the
 * record via related_table + related_record_id. Files live in the packet-documents bucket.
 */
export const DeathCertificateUpload: React.FC<DeathCertificateUploadProps> = ({
  packetId,
  relatedTable,
  relatedRecordId,
}) => {
  const [doc, setDoc] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const confirm = useConfirm();

  // Load existing certificate, if any
  useEffect(() => {
    let cancelled = false;
    if (!relatedRecordId) {
      setDoc(null);
      return;
    }
    setLoading(true);
    supabase
      .from('documents')
      .select('id, file_name, file_path, mime_type, file_size, created_at')
      .eq('packet_id', packetId)
      .eq('related_table', relatedTable)
      .eq('related_record_id', relatedRecordId)
      .eq('category', 'death_certificate')
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
  }, [packetId, relatedTable, relatedRecordId]);

  const handleSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!relatedRecordId) {
      toast.error('Save the record first, then upload the certificate', {
        duration: 4000, position: 'bottom-center',
      });
      return;
    }
    const allowed = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    if (!allowed.includes(file.type)) {
      toast.error('Only PDF, JPG, or PNG files are allowed', {
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
      const path = `${packetId}/death-certificates/${relatedTable}/${relatedRecordId}/${Date.now()}_${safe}`;
      const { error: upErr } = await uploadService.uploadFile('packet-documents', path, file);
      if (upErr) throw new Error(upErr.message || 'Upload failed');

      const { data, error } = await supabase
        .from('documents')
        .insert({
          packet_id: packetId,
          related_table: relatedTable,
          related_record_id: relatedRecordId,
          category: 'death_certificate',
          file_path: path,
          file_name: file.name,
          mime_type: file.type,
          file_size: file.size,
          is_private: true,
        })
        .select()
        .single();
      if (error) throw error;

      setDoc(data);
      toast.success('Death certificate uploaded', { duration: 3000, position: 'bottom-center' });
    } catch (err: any) {
      console.error('Death certificate upload failed', err);
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const handleView = async () => {
    if (!doc) return;
    const { url, error } = await uploadService.getSignedUrl('packet-documents', doc.file_path, 300);
    if (error || !url) {
      toast.error('Could not open file', { duration: 4000, position: 'bottom-center' });
      return;
    }
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    if (!doc) return;
    const ok = await confirm({
      title: 'Remove this death certificate?',
      description: 'The file will be permanently deleted. This action cannot be undone.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    setBusy(true);
    try {
      await uploadService.deleteFile('packet-documents', doc.file_path);
      const { error } = await supabase.from('documents').delete().eq('id', doc.id);
      if (error) throw error;
      setDoc(null);
      toast.success('Certificate removed', { duration: 3000, position: 'bottom-center' });
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
        <p className="text-xs font-bold text-navy-muted">Death Certificate</p>
        <p className="text-[10px] text-stone-500">Upload a copy of the official death certificate (PDF, JPG, PNG)</p>
      </div>

      {!relatedRecordId ? (
        <p className="text-[11px] text-stone-500 italic">Save this record first to attach a certificate.</p>
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
            {doc.file_name || 'Death certificate'}
          </button>
          <button
            type="button"
            onClick={handleView}
            className="p-1.5 text-stone-400 hover:text-navy-muted"
            aria-label="Open certificate"
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
            aria-label="Delete certificate"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-lg border-2 border-dashed border-stone-300 text-xs font-bold text-navy-muted hover:bg-white transition-colors disabled:opacity-50"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Upload size={14} />}
          {busy ? 'Uploading…' : 'Upload Death Certificate'}
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
