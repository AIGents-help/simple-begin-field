import React, { useEffect, useState } from 'react';
import { Upload, Star, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { propertyPhotoService, type PropertyPhoto } from '@/services/propertyPhotoService';
import { StorageImage } from '@/components/common/StorageImage';
import { useFileDropzone } from '@/hooks/useFileDropzone';

interface Props {
  packetId: string;
  recordId: string | null;
}

export const PropertyPhotoGallery: React.FC<Props> = ({ packetId, recordId }) => {
  const [photos, setPhotos] = useState<PropertyPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const list = await propertyPhotoService.list(recordId);
      setPhotos(list);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load photos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !recordId) return;
    setUploading(true);
    try {
      for (const file of files) {
        await propertyPhotoService.upload({ packetId, recordId, file });
      }
      toast.success(`${files.length} photo${files.length > 1 ? 's' : ''} added`);
      await refresh();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed');
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const setHero = async (photo: PropertyPhoto) => {
    if (!recordId) return;
    try {
      await propertyPhotoService.setHero(photo.id, recordId);
      toast.success('Hero photo updated');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update');
    }
  };

  const remove = async (photo: PropertyPhoto) => {
    try {
      await propertyPhotoService.remove(photo.id, photo.file_path);
      toast.success('Photo removed');
      refresh();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove');
    }
  };

  const updateCaption = async (photo: PropertyPhoto, caption: string) => {
    try {
      await propertyPhotoService.updateCaption(photo.id, caption);
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, caption } : p)));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update caption');
    }
  };

  if (!recordId) {
    return (
      <div className="p-4 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center text-xs text-stone-400">
        Save this item first, then add photos.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Photos</h3>
        <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-navy-muted text-white rounded-lg text-xs font-semibold hover:opacity-90 transition">
          {uploading ? <Loader2 size={12} className="animate-spin" /> : <Upload size={12} />}
          Add photos
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            onChange={handleUpload}
            disabled={uploading}
          />
        </label>
      </div>

      {loading ? (
        <div className="text-xs text-stone-400 py-4 text-center">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="p-6 bg-stone-50 border border-dashed border-stone-200 rounded-2xl text-center text-xs text-stone-400">
          No photos yet. Add at least one — the first photo becomes the hero image.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-white border border-stone-200 rounded-xl overflow-hidden shadow-sm"
            >
              <div className="relative aspect-square bg-stone-100">
                <StorageImage
                  path={photo.file_path}
                  alt={photo.caption || 'Property photo'}
                  className="w-full h-full object-cover"
                />
                {photo.is_hero && (
                  <span className="absolute top-1.5 left-1.5 bg-amber-400 text-stone-900 text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Star size={9} className="fill-current" /> Hero
                  </span>
                )}
                <div className="absolute top-1.5 right-1.5 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!photo.is_hero && (
                    <button
                      type="button"
                      onClick={() => setHero(photo)}
                      title="Set as hero"
                      className="p-1.5 bg-white/90 rounded-md hover:bg-white"
                    >
                      <Star size={12} className="text-amber-500" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => remove(photo)}
                    title="Remove"
                    className="p-1.5 bg-white/90 rounded-md hover:bg-rose-50"
                  >
                    <Trash2 size={12} className="text-rose-500" />
                  </button>
                </div>
              </div>
              <input
                type="text"
                placeholder="Add caption..."
                defaultValue={photo.caption || ''}
                onBlur={(e) => {
                  const v = e.target.value;
                  if (v !== (photo.caption || '')) updateCaption(photo, v);
                }}
                className="w-full px-2 py-1.5 text-[11px] border-t border-stone-100 outline-none"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
