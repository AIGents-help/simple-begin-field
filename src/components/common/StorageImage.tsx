import React, { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Image as ImageIcon } from 'lucide-react';

interface SignedImgProps {
  path: string;
  alt: string;
  className?: string;
  bucket?: string;
}

/**
 * Renders an image stored in a Supabase storage bucket via a signed URL.
 * Caches the URL for 1 hour. Falls back to an icon placeholder on error.
 */
export const StorageImage: React.FC<SignedImgProps> = ({
  path,
  alt,
  className,
  bucket = 'packet-documents',
}) => {
  const [url, setUrl] = useState<string | null>(null);
  const [errored, setErrored] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!path) return;
    (async () => {
      const { data, error } = await supabase.storage.from(bucket).createSignedUrl(path, 3600);
      if (cancelled) return;
      if (error || !data?.signedUrl) {
        setErrored(true);
        return;
      }
      setUrl(data.signedUrl);
    })();
    return () => {
      cancelled = true;
    };
  }, [path, bucket]);

  if (errored || !url) {
    return (
      <div className={`bg-muted flex items-center justify-center ${className || ''}`}>
        <ImageIcon className="text-muted-foreground" size={20} />
      </div>
    );
  }
  return <img src={url} alt={alt} className={className} loading="lazy" />;
};
