import { QrDesign } from './qrShopDesigns';
import QRCode from 'qrcode';

/**
 * Renders a design as a PNG by drawing on an offscreen canvas.
 * For simplicity we render at 4x for crispness.
 */
export async function downloadDesignPng(design: QrDesign, emergencyUrl: string) {
  const scale = 4;
  const w = design.width * scale;
  const h = design.height * scale;
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d')!;

  // Background fill per design (mirrors the SVG/HTML preview's main palette).
  const bg: Record<string, string> = {
    'classic': '#ffffff',
    'midnight': '#0b1530',
    'sunshine': '#fde047',
    'retro-diner': '#fdf6e3',
    'galaxy': '#1e1b4b',
    'tropical': '#14b8a6',
    'minimalist': '#ffffff',
    'pet-parent': '#fdf3e7',
    'game-over': '#000000',
    'holiday': '#b91c1c',
    'wallet-pro': '#0a0a0a',
    'haven-owl': '#0b1530',
  };
  ctx.fillStyle = bg[design.id] || '#ffffff';
  ctx.fillRect(0, 0, w, h);

  // Draw QR
  const qrSize = Math.min(w, h) * 0.55;
  const qrDataUrl = await QRCode.toDataURL(emergencyUrl, {
    width: Math.round(qrSize),
    margin: 1,
    color: { dark: '#000000', light: '#ffffff' },
    errorCorrectionLevel: 'M',
  });
  const img = new Image();
  await new Promise<void>((res, rej) => { img.onload = () => res(); img.onerror = rej; img.src = qrDataUrl; });

  // White rounded plate behind the QR for legibility on dark backgrounds
  const padding = qrSize * 0.06;
  const plateSize = qrSize + padding * 2;
  const px = (w - plateSize) / 2;
  const py = (h - plateSize) / 2;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(px, py, plateSize, plateSize);
  ctx.drawImage(img, px + padding, py + padding, qrSize, qrSize);

  // Tiny label at bottom
  ctx.fillStyle = ['midnight', 'galaxy', 'haven-owl', 'wallet-pro', 'game-over', 'holiday', 'tropical'].includes(design.id) ? '#ffffff' : '#0f172a';
  ctx.font = `bold ${Math.round(h * 0.05)}px sans-serif`;
  ctx.textAlign = 'center';
  ctx.fillText(design.name.toUpperCase(), w / 2, h - h * 0.05);

  return new Promise<void>((resolve) => {
    canvas.toBlob((blob) => {
      if (!blob) return resolve();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `qr-card-${design.id}.png`;
      a.click();
      URL.revokeObjectURL(a.href);
      resolve();
    }, 'image/png');
  });
}
