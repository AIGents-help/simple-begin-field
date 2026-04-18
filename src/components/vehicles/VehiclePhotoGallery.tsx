import React, { useEffect, useState } from 'react';
import { Upload, Star, Trash2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { vehiclePhotoService, type VehiclePhoto } from '@/services/vehiclePhotoService';
import { StorageImage } from '@/components/common/StorageImage';
import { useFileDropzone } from '@/hooks/useFileDropzone';

interface Props {
  packetId: string;
  recordId: string | null;
  onHeroChanged?: () => void;
}

const PROMPTS = ['Exterior front', 'Exterior rear', 'Interior', 'Odometer', 'Any damage'];

export const VehiclePhotoGallery: React.FC<Props> = ({ packetId, recordId, onHeroChanged }) => {
  const [photos, setPhotos] = useState<VehiclePhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const refresh = async () => {
    if (!recordId) return;
    setLoading(true);
    try {
      const list = await vehiclePhotoService.list(recordId);
      setPhotos(list);
    } catch (e: any) {
      toast.error(e?.message || 'Failed to load photos', { duration: 4000, position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordId]);

  const processFiles = async (files: File[]) => {
    if (!files.length || !recordId) return;
    const images = files.filter((f) => f.type.startsWith('image/'));
    if (images.length !== files.length) {
      toast.error('Only image files are supported here.', { duration: 4000, position: 'bottom-center' });
    }
    if (!images.length) return;
    setUploading(true);
    try {
      for (const file of images) {
        await vehiclePhotoService.upload({ packetId, recordId, file });
      }
      toast.success(`${images.length} photo${images.length > 1 ? 's' : ''} added`, {
        duration: 3000, position: 'bottom-center',
      });
      await refresh();
      onHeroChanged?.();
    } catch (err: any) {
      toast.error(err?.message || 'Upload failed', { duration: 4000, position: 'bottom-center' });
    } finally {
      setUploading(false);
    }
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    await processFiles(files);
    e.target.value = '';
  };

  const { isDragging, isTouch, dropzoneProps } = useFileDropzone({
    onFiles: processFiles,
    disabled: uploading || !recordId,
  });

  const setHero = async (photo: VehiclePhoto) => {
    if (!recordId) return;
    try {
      await vehiclePhotoService.setHero(photo.id, recordId);
      toast.success('Hero photo updated', { duration: 3000, position: 'bottom-center' });
      await refresh();
      onHeroChanged?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update', { duration: 4000, position: 'bottom-center' });
    }
  };

  const remove = async (photo: VehiclePhoto) => {
    try {
      await vehiclePhotoService.remove(photo.id, photo.file_path);
      toast.success('Photo removed', { duration: 3000, position: 'bottom-center' });
      await refresh();
      onHeroChanged?.();
    } catch (e: any) {
      toast.error(e?.message || 'Failed to remove', { duration: 4000, position: 'bottom-center' });
    }
  };

  const updateCaption = async (photo: VehiclePhoto, caption: string) => {
    try {
      await vehiclePhotoService.updateCaption(photo.id, caption);
      setPhotos((prev) => prev.map((p) => (p.id === photo.id ? { ...p, caption } : p)));
    } catch (e: any) {
      toast.error(e?.message || 'Failed to update caption', { duration: 4000, position: 'bottom-center' });
    }
  };

  if (!recordId) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-muted p-4 text-center text-xs text-muted-foreground">
        Save this vehicle first, then add photos.
      </div>
    );
  }

  return (
    <div
      {...dropzoneProps}
      className={`relative space-y-3 rounded-2xl transition-all ${
        isDragging ? 'ring-4 ring-amber-300 ring-offset-2 bg-amber-50/30 p-2' : ''
      }`}
    >
      {isDragging && (
        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-amber-50/95 rounded-2xl pointer-events-none">
          <Upload size={32} className="text-amber-600" />
          <p className="font-bold text-amber-700">Drop photos to upload</p>
        </div>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">Vehicle Photos</h4>
          <p className="text-[10px] text-muted-foreground mt-0.5">
            Suggested shots: {PROMPTS.join(' • ')}
          </p>
        </div>
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
        <div className="text-xs text-muted-foreground py-4 text-center">Loading photos...</div>
      ) : photos.length === 0 ? (
        <div className="p-6 bg-muted border border-dashed border-border rounded-2xl text-center text-xs text-muted-foreground">
          No photos yet. The first photo becomes the hero shown on the card face.
          {!isTouch && <div className="mt-1">Drag & drop images, or tap "Add photos".</div>}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {photos.map((photo) => (
            <div
              key={photo.id}
              className="relative group bg-card border border-border rounded-xl overflow-hidden shadow-sm"
            >
              <div className="relative aspect-square bg-muted">
                <StorageImage
                  path={photo.file_path}
                  alt={photo.caption || 'Vehicle photo'}
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
                className="w-full px-2 py-1.5 text-[11px] border-t border-border outline-none bg-card"
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
