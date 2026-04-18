import React, { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Image as ImageIcon, Plus, Trash2, Upload } from 'lucide-react';
import { funeralPhotoService, FuneralPhoto } from '@/services/funeralPhotoService';
import { supabase } from '@/integrations/supabase/client';
import { useFileDropzone } from '@/hooks/useFileDropzone';

interface Props {
  packetId: string;
  funeralRecordId: string;
}

export const FuneralPhotoGallery: React.FC<Props> = ({ packetId, funeralRecordId }) => {
  const [photos, setPhotos] = useState<FuneralPhoto[]>([]);
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const list = await funeralPhotoService.list(funeralRecordId);
      setPhotos(list);
      const entries = await Promise.all(
        list.map(async (p) => {
          const { data } = await supabase.storage
            .from('packet-documents')
            .createSignedUrl(p.file_path, 3600);
          return [p.id, data?.signedUrl || ''] as const;
        }),
      );
      setUrls(Object.fromEntries(entries));
    } catch (err: any) {
      toast.error(`Could not load photos: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setLoading(false);
    }
  }, [funeralRecordId]);

  useEffect(() => {
    load();
  }, [load]);

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (!file.type.startsWith('image/')) {
          toast.error(`Skipped ${file.name}: not an image`, {
            duration: 4000,
            position: 'bottom-center',
          });
          continue;
        }
        await funeralPhotoService.upload({ packetId, recordId: funeralRecordId, file });
      }
      await load();
      toast.success('Photos added', { duration: 2500, position: 'bottom-center' });
    } catch (err: any) {
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const remove = async (photo: FuneralPhoto) => {
    if (!confirm('Delete this photo?')) return;
    try {
      await funeralPhotoService.remove(photo.id, photo.file_path);
      setPhotos((p) => p.filter((x) => x.id !== photo.id));
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    }
  };

  const onFilesArray = (files: File[]) => {
    const dt = new DataTransfer();
    files.forEach((f) => dt.items.add(f));
    onFiles(dt.files);
  };

  const { isDragging, isTouch, dropzoneProps } = useFileDropzone({
    onFiles: onFilesArray,
    disabled: uploading,
  });

  return (
    <div
      {...dropzoneProps}
      className={`relative rounded-2xl bg-white border p-4 shadow-sm transition-all ${
        isDragging ? 'border-amber-500 border-2 ring-4 ring-amber-200' : 'border-stone-200'
      }`}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ImageIcon size={18} className="text-navy-muted" />
          <h3 className="font-bold text-navy-muted">Photos for Funeral Home</h3>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="text-xs font-bold text-navy-muted flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-200 hover:bg-stone-50 disabled:opacity-50"
        >
          {uploading ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
          Add Photo
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => onFiles(e.target.files)}
          className="hidden"
        />
      </div>

      <p className="text-xs text-stone-500 mb-3">
        Add photos for slideshows, programs, or memorial display. Images are compressed before
        emailing to the funeral home.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-6">
          <Loader2 className="animate-spin text-navy-muted" size={20} />
        </div>
      ) : photos.length === 0 ? (
        <div className="text-xs text-stone-400 text-center py-6 border border-dashed border-stone-200 rounded-xl">
          No photos added yet.
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((p) => (
            <div key={p.id} className="relative group aspect-square rounded-lg overflow-hidden bg-stone-100">
              {urls[p.id] ? (
                <img src={urls[p.id]} alt={p.caption || 'Funeral photo'} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-stone-300">
                  <ImageIcon size={20} />
                </div>
              )}
              <button
                type="button"
                onClick={() => remove(p)}
                className="absolute top-1 right-1 p-1 rounded-md bg-white/90 text-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"
                aria-label="Delete photo"
              >
                <Trash2 size={12} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
