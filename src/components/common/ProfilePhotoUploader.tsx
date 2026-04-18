import React, { useEffect, useRef, useState } from 'react';
import { Camera, X } from 'lucide-react';
import { toast } from 'sonner';
import { uploadService } from '@/services/uploadService';
import { PersonAvatar } from './PersonAvatar';

interface Props {
  /** Existing storage path (already saved). */
  photoPath?: string | null;
  /** Locally selected file pending save. Takes priority over photoPath preview. */
  pendingFile?: File | null;
  /** Person/pet name for the monogram fallback. */
  name?: string | null;
  /** Visually grayscale for deceased records. */
  isDeceased?: boolean;
  /** Fired when the user picks a new file (caller uploads on save). */
  onFileSelected: (file: File) => void;
  /** Fired when the user removes the photo (caller clears photoPath on save). */
  onRemove?: () => void;
  /** Diameter in px. Defaults to 96. */
  size?: number;
  disabled?: boolean;
}

/**
 * Big tappable round avatar used inside edit forms. Shows the existing photo
 * (or a freshly picked file's preview) with a camera badge overlay. Falls back
 * to a navy/gold monogram. Tap anywhere on the avatar to pick a new image.
 */
export const ProfilePhotoUploader: React.FC<Props> = ({
  photoPath,
  pendingFile,
  name,
  isDeceased = false,
  onFileSelected,
  onRemove,
  size = 96,
  disabled = false,
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [pendingPreview, setPendingPreview] = useState<string | null>(null);
  const [signedUrl, setSignedUrl] = useState<string | null>(null);

  // Build object URL preview for newly picked file
  useEffect(() => {
    if (!pendingFile) {
      setPendingPreview(null);
      return;
    }
    const url = URL.createObjectURL(pendingFile);
    setPendingPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [pendingFile]);

  // Resolve signed URL for already-saved photo
  useEffect(() => {
    let cancelled = false;
    if (photoPath && !pendingFile) {
      uploadService.getSignedUrl('packet-documents', photoPath, 3600).then((res) => {
        if (!cancelled) setSignedUrl(res?.url || null);
      });
    } else {
      setSignedUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [photoPath, pendingFile]);

  const previewUrl = pendingPreview || signedUrl;

  const handlePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-picking same file
    if (!file) return;
    const isImage =
      file.type.startsWith('image/') ||
      /\.(jpe?g|png|heic|heif|webp)$/i.test(file.name);
    if (!isImage) {
      toast.error('Please select an image file (JPG, PNG, HEIC).', {
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB.', {
        duration: 4000,
        position: 'bottom-center',
      });
      return;
    }
    onFileSelected(file);
  };

  const grayClass = isDeceased ? 'grayscale opacity-90' : '';
  const cameraBadge = Math.max(28, Math.round(size * 0.32));

  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <div className="relative">
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          className={`relative rounded-full overflow-hidden ${grayClass} active:scale-95 transition-transform disabled:opacity-50`}
          style={{ width: size, height: size }}
          aria-label="Upload profile photo"
        >
          {previewUrl ? (
            <img
              src={previewUrl}
              alt={name || 'Profile'}
              className="w-full h-full object-cover rounded-full border-2 border-white shadow-sm"
            />
          ) : (
            <PersonAvatar name={name} size={size} ring />
          )}
        </button>

        {/* Camera badge overlay */}
        <button
          type="button"
          onClick={() => !disabled && inputRef.current?.click()}
          disabled={disabled}
          className="absolute -bottom-1 -right-1 rounded-full bg-navy-muted text-white flex items-center justify-center shadow-md active:scale-95 disabled:opacity-50"
          style={{ width: cameraBadge, height: cameraBadge }}
          aria-label="Change photo"
        >
          <Camera size={Math.round(cameraBadge * 0.5)} />
        </button>

        {/* Remove button — only shown when a photo exists */}
        {(photoPath || pendingFile) && onRemove && !disabled && (
          <button
            type="button"
            onClick={onRemove}
            className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white text-stone-500 border border-stone-200 flex items-center justify-center shadow-sm active:scale-95 hover:text-rose-500"
            aria-label="Remove photo"
          >
            <X size={12} />
          </button>
        )}

        <input
          ref={inputRef}
          type="file"
          accept="image/*,.heic,.heif"
          className="hidden"
          onChange={handlePick}
        />
      </div>
      <p className="text-[11px] text-stone-500">
        {previewUrl ? 'Tap to change photo' : 'Tap to add a photo'}
      </p>
    </div>
  );
};
