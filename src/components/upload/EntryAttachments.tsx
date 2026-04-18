import React, { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import {
  Paperclip, Image as ImageIcon, X, Loader2, Upload, FileText, Eye,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { documentService } from '@/services/documentService';
import { useFileDropzone } from '@/hooks/useFileDropzone';
import { StorageImage } from '@/components/common/StorageImage';

const MAX_IMAGE = 25 * 1024 * 1024;   // 25MB
const MAX_DOC   = 50 * 1024 * 1024;   // 50MB
const MAX_VIDEO = 500 * 1024 * 1024;  // 500MB

const IMAGE_MIMES = ['image/jpeg', 'image/jpg', 'image/png', 'image/heic', 'image/heif', 'image/webp'];
const VIDEO_MIMES_PREFIX = 'video/';

const isImage = (f: { mime_type?: string | null; file_name?: string | null }) =>
  IMAGE_MIMES.includes((f.mime_type || '').toLowerCase()) ||
  /\.(jpe?g|png|heic|heif|webp)$/i.test(f.file_name || '');
const isVideo = (f: { mime_type?: string | null; file_name?: string | null }) =>
  (f.mime_type || '').startsWith(VIDEO_MIMES_PREFIX) ||
  /\.(mp4|mov|webm|m4v|avi)$/i.test(f.file_name || '');

const formatSize = (bytes?: number | null) => {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const validateFile = (file: File): string | null => {
  const mime = (file.type || '').toLowerCase();
  if (mime.startsWith('video/')) {
    if (file.size > MAX_VIDEO) return `Video "${file.name}" is too large (max 500MB).`;
    return null;
  }
  if (IMAGE_MIMES.includes(mime) || /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name)) {
    if (file.size > MAX_IMAGE) return `Image "${file.name}" is too large (max 25MB).`;
    return null;
  }
  if (file.size > MAX_DOC) return `File "${file.name}" is too large (max 50MB).`;
  return null;
};

export interface AttachedDoc {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  mime_type: string | null;
  category: string | null;
}

interface EntryAttachmentsProps {
  /** packet id */
  packetId: string;
  /** logical section key — e.g. 'custom' or 'info' */
  sectionKey: string;
  /** related record id (entry id). When null, uploads are deferred until the parent saves and re-renders with an id. */
  recordId: string | null;
  /** scope */
  scope: 'personA' | 'personB' | 'shared';
  /** Optional sub-section id (custom_section_id) — embedded in the storage path for organization. */
  subKey?: string;
  /** Disabled state. */
  disabled?: boolean;
}

/**
 * Multi-file + multi-photo attachments for an entry.
 * - Drag/drop on desktop, tap to browse on mobile
 * - Photos rendered as thumbnail grid; documents rendered as chips
 * - Per-file size limits: 25MB images, 50MB docs, 500MB videos
 * - Errors surfaced via toast (never silent)
 */
export const EntryAttachments: React.FC<EntryAttachmentsProps> = ({
  packetId, sectionKey, recordId, scope, subKey, disabled,
}) => {
  const [docs, setDocs] = useState<AttachedDoc[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState<{ name: string; pct: number }[]>([]);
  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const fileInputRef  = React.useRef<HTMLInputElement>(null);

  const reload = useCallback(async () => {
    if (!recordId) { setDocs([]); return; }
    setLoading(true);
    const { data, error } = await documentService.getDocuments(packetId, sectionKey, recordId);
    setLoading(false);
    if (error) { toast.error('Failed to load attachments'); return; }
    setDocs((data || []) as AttachedDoc[]);
  }, [packetId, sectionKey, recordId]);

  useEffect(() => { void reload(); }, [reload]);

  const upload = useCallback(async (files: File[], asPhoto: boolean) => {
    if (disabled) return;
    if (!recordId) {
      toast.error('Please save the entry first, then add attachments.');
      return;
    }
    const valid: File[] = [];
    for (const f of files) {
      const err = validateFile(f);
      if (err) { toast.error(err); continue; }
      valid.push(f);
    }
    if (valid.length === 0) return;

    setUploading((prev) => [...prev, ...valid.map((f) => ({ name: f.name, pct: 0 }))]);

    let ok = 0;
    for (const file of valid) {
      const category = asPhoto || file.type.startsWith('image/') ? 'photo' : 'document';
      const fileName = subKey
        ? file.name
        : file.name; // path is set inside documentService
      // documentService builds path as packetId/sectionKey/recordId/timestamp_filename — good
      const { error } = await documentService.uploadAndCreate(file, {
        packetId,
        sectionKey,
        recordId: subKey ? `${subKey}/${recordId}` : recordId,
        category,
        fileName,
        scope,
        isPrivate: false,
      });
      setUploading((prev) => prev.filter((u) => u.name !== file.name));
      if (error) {
        toast.error(`Upload failed for ${file.name}: ${(error as any).message || 'unknown error'}`);
      } else {
        ok += 1;
      }
    }
    if (ok > 0) {
      toast.success(`Uploaded ${ok} ${ok === 1 ? 'file' : 'files'}`);
      await reload();
    }
  }, [disabled, packetId, recordId, scope, sectionKey, subKey, reload]);

  const handleDelete = async (doc: AttachedDoc) => {
    const { error } = await documentService.deleteDocument(doc.id, doc.file_path, false);
    if (error) {
      toast.error('Failed to remove attachment');
      return;
    }
    setDocs((prev) => prev.filter((d) => d.id !== doc.id));
    toast.success('Removed');
  };

  const openDoc = async (doc: AttachedDoc) => {
    const { url } = await documentService.getDocumentUrl(doc.file_path, false);
    if (url) window.open(url, '_blank');
  };

  const photoDz = useFileDropzone({
    onFiles: (f) => void upload(f, true),
    disabled: disabled || !recordId,
    multiple: true,
  });
  const fileDz = useFileDropzone({
    onFiles: (f) => void upload(f, false),
    disabled: disabled || !recordId,
    multiple: true,
  });

  const photos = docs.filter((d) => isImage(d) || (d.category === 'photo'));
  const files  = docs.filter((d) => !photos.includes(d));

  const lockedHint = !recordId ? (
    <p className="text-[11px] text-stone-400 italic">
      Save the entry first to enable attachments.
    </p>
  ) : null;

  return (
    <div className="space-y-5">
      {/* Photos */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Photos
        </label>
        <input
          ref={photoInputRef}
          type="file"
          multiple
          accept=".jpg,.jpeg,.png,.heic,.heif,.webp,image/*"
          className="hidden"
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            e.target.value = '';
            void upload(list, true);
          }}
        />
        <div
          {...photoDz.dropzoneProps}
          onClick={() => !disabled && recordId && photoInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            photoDz.isDragging
              ? 'border-amber-500 bg-amber-50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          } ${(disabled || !recordId) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <ImageIcon size={20} className="mx-auto text-stone-400 mb-1" />
          <p className="text-xs font-bold text-navy-muted">
            {photoDz.isDragging ? 'Drop photos to upload' : photoDz.isTouch ? 'Tap to add photos' : 'Drag & drop photos or tap to browse'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">JPG, PNG, HEIC · Max 25MB each</p>
        </div>

        {photos.length > 0 && (
          <div className="grid grid-cols-3 gap-2">
            {photos.map((p) => (
              <div key={p.id} className="relative group rounded-lg overflow-hidden border border-stone-200 bg-stone-50">
                <button
                  type="button"
                  onClick={() => void openDoc(p)}
                  className="block w-full aspect-square"
                  aria-label={`View ${p.file_name}`}
                >
                  <StorageImage
                    path={p.file_path}
                    alt={p.file_name}
                    className="w-full h-full object-cover"
                  />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(p)}
                  className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                  aria-label="Remove photo"
                >
                  <X size={12} />
                </button>
                <div className="absolute bottom-0 inset-x-0 px-1.5 py-0.5 bg-gradient-to-t from-black/60 to-transparent">
                  <p className="text-[9px] text-white truncate">{p.file_name}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Files */}
      <div className="space-y-2">
        <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500">
          Attachments
        </label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => {
            const list = Array.from(e.target.files || []);
            e.target.value = '';
            void upload(list, false);
          }}
        />
        <div
          {...fileDz.dropzoneProps}
          onClick={() => !disabled && recordId && fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
            fileDz.isDragging
              ? 'border-amber-500 bg-amber-50'
              : 'border-stone-200 bg-white hover:border-stone-300'
          } ${(disabled || !recordId) ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <Upload size={20} className="mx-auto text-stone-400 mb-1" />
          <p className="text-xs font-bold text-navy-muted">
            {fileDz.isDragging ? 'Drop files to upload' : fileDz.isTouch ? 'Tap to add files' : 'Drag & drop files or tap to browse'}
          </p>
          <p className="text-[10px] text-stone-400 mt-0.5">PDF, DOC, any file · Max 50MB (videos 500MB)</p>
        </div>

        {files.length > 0 && (
          <ul className="space-y-1.5">
            {files.map((f) => (
              <li
                key={f.id}
                className="flex items-center gap-2 px-3 py-2 bg-white border border-stone-200 rounded-lg"
              >
                {isVideo(f) ? (
                  <FileText size={14} className="text-violet-500 shrink-0" />
                ) : (
                  <Paperclip size={14} className="text-navy-muted shrink-0" />
                )}
                <span className="flex-1 min-w-0 text-xs text-navy-muted font-medium truncate">
                  {f.file_name}
                </span>
                <span className="text-[10px] text-stone-400 shrink-0">{formatSize(f.file_size)}</span>
                <button
                  type="button"
                  onClick={() => void openDoc(f)}
                  className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500"
                  aria-label="View"
                >
                  <Eye size={12} />
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(f)}
                  className="p-1.5 rounded-md hover:bg-rose-50 text-rose-500"
                  aria-label="Remove"
                >
                  <X size={12} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {uploading.length > 0 && (
        <div className="rounded-lg border border-stone-200 bg-stone-50 p-2 space-y-1">
          {uploading.map((u) => (
            <div key={u.name} className="flex items-center gap-2 text-[11px] text-stone-600">
              <Loader2 size={12} className="animate-spin text-navy-muted" />
              <span className="flex-1 truncate">{u.name}</span>
              <span>uploading…</span>
            </div>
          ))}
        </div>
      )}

      {loading && (
        <div className="flex items-center gap-2 text-xs text-stone-400">
          <Loader2 size={12} className="animate-spin" /> Loading attachments…
        </div>
      )}

      {lockedHint}
    </div>
  );
};
