import React, { useEffect, useState } from 'react';
import QRCode from 'qrcode';

interface Props {
  value: string;
  size: number;
  /** Foreground (dark) color */
  dark?: string;
  /** Background (light) color */
  light?: string;
  className?: string;
}

/** Renders a QR code as a data-URL image. Caches per-value/size in module memory. */
const cache = new Map<string, string>();

export const QrCodeImg: React.FC<Props> = ({ value, size, dark = '#0f172a', light = '#ffffff', className }) => {
  const key = `${value}|${size}|${dark}|${light}`;
  const [src, setSrc] = useState<string>(() => cache.get(key) || '');

  useEffect(() => {
    let cancelled = false;
    if (!value) { setSrc(''); return; }
    if (cache.has(key)) { setSrc(cache.get(key)!); return; }
    QRCode.toDataURL(value, {
      width: Math.max(120, Math.round(size * 2)),
      margin: 1,
      color: { dark, light },
      errorCorrectionLevel: 'M',
    }).then((url) => {
      cache.set(key, url);
      if (!cancelled) setSrc(url);
    }).catch(() => { /* swallow */ });
    return () => { cancelled = true; };
  }, [key, value, size, dark, light]);

  if (!src) {
    return (
      <div
        className={`bg-stone-200 animate-pulse rounded ${className || ''}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return <img src={src} width={size} height={size} alt="" className={className} style={{ width: size, height: size, imageRendering: 'pixelated' }} />;
};
