import React, { useEffect, useState } from 'react';
import { uploadService } from '@/services/uploadService';

interface Props {
  /** Storage path inside packet-documents bucket (signed URL will be generated). */
  photoPath?: string | null;
  /** Person's display name — used for monogram fallback. */
  name?: string | null;
  /** Apply grayscale filter for deceased/inactive people. */
  isDeceased?: boolean;
  /** Pixel size of the round avatar. Defaults to 48. */
  size?: number;
  className?: string;
  /** Optional border ring styling. */
  ring?: boolean;
}

/** Compute initials from a person/pet name. Falls back to "?" when empty. */
const getInitials = (name?: string | null): string => {
  const clean = (name || '').trim();
  if (!clean) return '?';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0][0].toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Round avatar for a person record. Shows their photo if available, otherwise
 * a tasteful navy/gold monogram with their initials. Applies grayscale when
 * `isDeceased` is true. Used across Family, Advisors, Pets, Trusted Contacts,
 * and the Family Tree.
 */
export const PersonAvatar: React.FC<Props> = ({
  photoPath,
  name,
  isDeceased = false,
  size = 48,
  className = '',
  ring = true,
}) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (photoPath) {
      uploadService.getSignedUrl('packet-documents', photoPath, 3600).then((res) => {
        if (!cancelled) setPhotoUrl(res?.url || null);
      });
    } else {
      setPhotoUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [photoPath]);

  const fontSize = Math.max(11, Math.round(size * 0.38));
  const ringClass = ring ? 'border-2 border-white shadow-sm' : '';
  const grayClass = isDeceased ? 'grayscale opacity-90' : '';

  return (
    <div
      className={`rounded-full overflow-hidden flex items-center justify-center shrink-0 ${ringClass} ${grayClass} ${className}`}
      style={{
        width: size,
        height: size,
        backgroundColor: '#1B2A4A', // navy
      }}
      aria-hidden="true"
    >
      {photoUrl ? (
        <img
          src={photoUrl}
          alt={name || 'Profile'}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      ) : (
        <span
          className="font-serif font-bold leading-none select-none"
          style={{
            color: '#C9A84C', // gold
            fontSize,
            letterSpacing: '0.02em',
          }}
        >
          {getInitials(name)}
        </span>
      )}
    </div>
  );
};
