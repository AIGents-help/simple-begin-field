import { useEffect } from 'react';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';

const DEFAULT_FAVICON = '/favicon.png';
const FAVICON_SIZE = 64;

/**
 * Swaps the browser tab favicon to the user's profile photo when logged in.
 * Falls back to the static branded favicon when logged out or no photo exists.
 *
 * Renders the avatar into a rounded canvas so it looks like a proper app icon.
 */
export const useDynamicFavicon = () => {
  const { user, profile } = useAppContext();
  const avatarPath: string | null = (profile as any)?.avatar_path ?? null;

  useEffect(() => {
    let cancelled = false;

    const setFavicon = (href: string) => {
      // Remove all existing icon links to avoid the browser preferring an old one
      document.querySelectorAll("link[rel*='icon']").forEach((el) => el.parentNode?.removeChild(el));
      const link = document.createElement('link');
      link.rel = 'icon';
      link.type = href.startsWith('data:') ? 'image/png' : 'image/png';
      link.href = href;
      document.head.appendChild(link);
    };

    const restoreDefault = () => setFavicon(DEFAULT_FAVICON);

    const renderFromUrl = async (url: string) => {
      try {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        await new Promise<void>((resolve, reject) => {
          img.onload = () => resolve();
          img.onerror = () => reject(new Error('image load failed'));
          img.src = url;
        });
        if (cancelled) return;

        const canvas = document.createElement('canvas');
        canvas.width = FAVICON_SIZE;
        canvas.height = FAVICON_SIZE;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Rounded square clip
        const r = FAVICON_SIZE * 0.22;
        ctx.beginPath();
        ctx.moveTo(r, 0);
        ctx.lineTo(FAVICON_SIZE - r, 0);
        ctx.quadraticCurveTo(FAVICON_SIZE, 0, FAVICON_SIZE, r);
        ctx.lineTo(FAVICON_SIZE, FAVICON_SIZE - r);
        ctx.quadraticCurveTo(FAVICON_SIZE, FAVICON_SIZE, FAVICON_SIZE - r, FAVICON_SIZE);
        ctx.lineTo(r, FAVICON_SIZE);
        ctx.quadraticCurveTo(0, FAVICON_SIZE, 0, FAVICON_SIZE - r);
        ctx.lineTo(0, r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.closePath();
        ctx.clip();

        // Cover-fit the image
        const scale = Math.max(FAVICON_SIZE / img.width, FAVICON_SIZE / img.height);
        const drawW = img.width * scale;
        const drawH = img.height * scale;
        const dx = (FAVICON_SIZE - drawW) / 2;
        const dy = (FAVICON_SIZE - drawH) / 2;
        ctx.drawImage(img, dx, dy, drawW, drawH);

        if (cancelled) return;
        setFavicon(canvas.toDataURL('image/png'));
      } catch {
        if (!cancelled) restoreDefault();
      }
    };

    (async () => {
      if (!user || !avatarPath) {
        restoreDefault();
        return;
      }
      const { data, error } = await supabase.storage
        .from('packet-documents')
        .createSignedUrl(avatarPath, 3600);
      if (cancelled) return;
      if (error || !data?.signedUrl) {
        restoreDefault();
        return;
      }
      await renderFromUrl(data.signedUrl);
    })();

    return () => {
      cancelled = true;
    };
  }, [user?.id, avatarPath]);
};
