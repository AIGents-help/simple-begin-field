import React from 'react';
import { QrCodeImg } from './QrCodeImg';
import { QrDesign } from './qrShopDesigns';

interface Props {
  design: QrDesign;
  emergencyUrl: string;
  /** Render larger for download/preview modal */
  scale?: number;
}

/** Renders a single design tile. Pure presentation — composes the QR over a styled SVG/HTML background. */
export const QrDesignPreview: React.FC<Props> = ({ design, emergencyUrl, scale = 1 }) => {
  const w = design.width * scale;
  const h = design.height * scale;
  const style: React.CSSProperties = { width: w, height: h };

  switch (design.id) {
    case 'classic':
      return (
        <div style={style} className="relative bg-white border-2 border-[hsl(var(--navy-muted))] rounded-md overflow-hidden flex">
          <div className="flex-1 p-2 flex flex-col justify-between">
            <div className="text-[hsl(var(--navy-muted))]">
              {/* tiny owl glyph */}
              <svg viewBox="0 0 32 32" width={20 * scale} height={20 * scale} fill="currentColor"><circle cx="16" cy="18" r="10"/><circle cx="12" cy="16" r="2.5" fill="#fff"/><circle cx="20" cy="16" r="2.5" fill="#fff"/><circle cx="12" cy="16" r="1"/><circle cx="20" cy="16" r="1"/><path d="M9 8l3 4-3 1zM23 8l-3 4 3 1z"/></svg>
              <p className="font-bold tracking-wider mt-1" style={{ fontSize: 10 * scale }}>EMERGENCY INFO</p>
            </div>
            <p className="text-stone-500" style={{ fontSize: 7 * scale }}>Scan for medical details</p>
          </div>
          <div className="p-2 flex items-center justify-center">
            <QrCodeImg value={emergencyUrl} size={140 * scale} dark="hsl(var(--navy-muted))" />
          </div>
        </div>
      );

    case 'midnight':
      return (
        <div style={style} className="relative bg-[#0b1530] rounded-md overflow-hidden flex flex-col items-center justify-between p-3">
          <div className="flex gap-1 text-[#d4af37]" style={{ fontSize: 8 * scale }}>★ ★ ★ ★ ★</div>
          <div className="p-1.5 rounded" style={{ background: '#d4af37' }}>
            <QrCodeImg value={emergencyUrl} size={110 * scale} dark="#0b1530" light="#ffffff" />
          </div>
          <p className="text-[#d4af37] font-bold tracking-widest" style={{ fontSize: 7 * scale }}>THE SURVIVOR PACKET</p>
        </div>
      );

    case 'sunshine':
      return (
        <div style={style} className="relative bg-yellow-300 rounded-2xl overflow-hidden border-4 border-black flex flex-col items-center justify-between p-2">
          <p className="font-black text-black" style={{ fontSize: 14 * scale }}>SCAN ME 👋</p>
          <div className="bg-white rounded-full p-2 flex items-center justify-center" style={{ width: 110 * scale, height: 110 * scale }}>
            <QrCodeImg value={emergencyUrl} size={90 * scale} dark="#000" />
          </div>
          <span style={{ fontSize: 14 * scale }}>🌞</span>
        </div>
      );

    case 'retro-diner':
      return (
        <div style={style} className="relative bg-[#fdf6e3] rounded-md overflow-hidden flex flex-col items-center justify-between"
             // checkerboard border via gradient
             >
          <div className="absolute inset-0 pointer-events-none" style={{
            background: 'repeating-linear-gradient(90deg, #c0392b 0 10px, #fff 10px 20px)',
            height: 8 * scale, top: 0,
          }}/>
          <div className="absolute pointer-events-none" style={{
            background: 'repeating-linear-gradient(90deg, #c0392b 0 10px, #fff 10px 20px)',
            height: 8 * scale, bottom: 0, left: 0, right: 0,
          }}/>
          <p className="font-black text-[#c0392b] mt-3 px-2 text-center" style={{ fontSize: 11 * scale, fontFamily: 'Georgia, serif' }}>IN CASE OF EMERGENCY</p>
          <QrCodeImg value={emergencyUrl} size={100 * scale} dark="#1a1a1a" />
          <p className="italic text-[#c0392b] mb-3" style={{ fontSize: 9 * scale, fontFamily: 'Georgia, serif' }}>Scan for my info</p>
        </div>
      );

    case 'galaxy':
      return (
        <div className="relative rounded-md overflow-hidden flex flex-col items-center justify-between p-2"
             style={{ ...style, background: 'radial-gradient(circle at 30% 20%, #4338ca 0%, #1e1b4b 70%)' }}>
          {/* stars */}
          {Array.from({ length: 18 }).map((_, i) => (
            <span key={i} className="absolute bg-white rounded-full" style={{
              width: 2 * scale, height: 2 * scale,
              top: `${(i * 37) % 100}%`, left: `${(i * 53) % 100}%`, opacity: 0.7,
            }} />
          ))}
          <p className="text-white font-bold relative" style={{ fontSize: 11 * scale }}>🚀 SCAN FOR INFO</p>
          <div className="bg-white rounded-full p-2 relative shadow-[0_0_20px_rgba(255,255,255,0.6)]">
            <QrCodeImg value={emergencyUrl} size={90 * scale} dark="#1e1b4b" />
          </div>
          <span className="relative" style={{ fontSize: 16 * scale }}>🚀</span>
        </div>
      );

    case 'tropical':
      return (
        <div style={style} className="relative bg-teal-500 rounded-md overflow-hidden flex flex-col items-center justify-center p-3">
          <span className="absolute top-1 right-2" style={{ fontSize: 18 * scale }}>🌴</span>
          <div className="bg-white p-1 rounded">
            <QrCodeImg value={emergencyUrl} size={110 * scale} dark="#0f766e" />
          </div>
          <p className="text-white font-black mt-2 tracking-wider" style={{ fontSize: 11 * scale }}>EMERGENCY CARD</p>
          <div className="absolute bottom-0 left-0 right-0 h-2 opacity-40" style={{
            background: 'repeating-linear-gradient(90deg, transparent 0 6px, #fff 6px 12px)',
          }}/>
        </div>
      );

    case 'minimalist':
      return (
        <div style={style} className="relative bg-white rounded-full overflow-hidden border border-[hsl(var(--navy-muted))] flex flex-col items-center justify-center">
          <QrCodeImg value={emergencyUrl} size={110 * scale} dark="hsl(var(--navy-muted))" />
          <p className="text-[hsl(var(--navy-muted))] font-bold tracking-widest mt-1" style={{ fontSize: 8 * scale }}>SCAN</p>
        </div>
      );

    case 'pet-parent':
      return (
        <div style={style} className="relative bg-[#fdf3e7] rounded-md overflow-hidden flex flex-col items-center justify-between p-3">
          <span className="absolute top-1 left-1" style={{ fontSize: 12 * scale }}>🐾</span>
          <span className="absolute top-1 right-1" style={{ fontSize: 12 * scale }}>🐾</span>
          <span className="absolute bottom-1 left-1" style={{ fontSize: 12 * scale }}>🐾</span>
          <span className="absolute bottom-1 right-1" style={{ fontSize: 12 * scale }}>🐾</span>
          <p className="text-stone-800 font-bold mt-2" style={{ fontSize: 10 * scale }}>IMPORTANT INFO INSIDE →</p>
          <QrCodeImg value={emergencyUrl} size={100 * scale} dark="#3b2412" />
          <div style={{ fontSize: 14 * scale }}>🐶 🐱</div>
        </div>
      );

    case 'game-over':
      return (
        <div style={style} className="relative bg-black rounded-md overflow-hidden flex flex-col items-center justify-between p-2">
          <p className="text-white font-bold tracking-tight" style={{ fontSize: 9 * scale, fontFamily: 'monospace' }}>PLAYER 1 EMERGENCY CARD</p>
          <div className="border-4 border-white p-1 bg-white">
            <QrCodeImg value={emergencyUrl} size={100 * scale} dark="#000" />
          </div>
          <div className="text-green-400" style={{ fontSize: 12 * scale, fontFamily: 'monospace' }}>♥ ♥ ♥</div>
        </div>
      );

    case 'holiday':
      return (
        <div style={style} className="relative bg-red-700 rounded-md overflow-hidden flex flex-col items-center justify-between p-3">
          {Array.from({ length: 10 }).map((_, i) => (
            <span key={i} className="absolute text-white opacity-60" style={{
              fontSize: 8 * scale,
              top: `${(i * 23) % 100}%`, left: `${(i * 41) % 100}%`,
            }}>❄</span>
          ))}
          <p className="text-white font-bold relative" style={{ fontSize: 10 * scale }}>SCAN FOR MY INFO 🎄</p>
          <div className="bg-white p-1 rounded relative">
            <QrCodeImg value={emergencyUrl} size={95 * scale} dark="#7f1d1d" />
          </div>
          <p className="text-white relative text-center" style={{ fontSize: 7 * scale }}>Keep your family safe this season.</p>
        </div>
      );

    case 'wallet-pro':
      return (
        <div style={style} className="relative bg-[#0a0a0a] rounded-md overflow-hidden flex">
          <div className="flex-1 p-3 flex flex-col justify-center text-white">
            <p className="font-bold tracking-wide" style={{ fontSize: 11 * scale }}>ICE</p>
            <p className="text-stone-300" style={{ fontSize: 8 * scale }}>In Case of Emergency</p>
            <div className="flex flex-col gap-1 mt-2 text-white" style={{ fontSize: 10 * scale }}>
              <div className="flex items-center gap-1">✚ Medical</div>
              <div className="flex items-center gap-1">☎ Contact</div>
              <div className="flex items-center gap-1">👤 Identity</div>
            </div>
          </div>
          <div className="p-2 flex items-center justify-center">
            <div className="bg-white p-1 rounded">
              <QrCodeImg value={emergencyUrl} size={130 * scale} dark="#000" />
            </div>
          </div>
        </div>
      );

    case 'haven-owl':
      return (
        <div style={style} className="relative bg-[#0b1530] rounded-md overflow-hidden flex flex-col items-center justify-between p-2 pt-4">
          {/* keychain hole indicator */}
          <div className="absolute top-1 left-1/2 -translate-x-1/2 rounded-full bg-stone-900 border border-stone-700"
               style={{ width: 8 * scale, height: 8 * scale }} />
          {/* simplified haven owl */}
          <svg viewBox="0 0 100 100" width={50 * scale} height={50 * scale}>
            <ellipse cx="32" cy="16" rx="6" ry="9" fill="#1e4080" />
            <ellipse cx="68" cy="16" rx="6" ry="9" fill="#1e4080" />
            <circle cx="50" cy="40" r="22" fill="#3a6cc0" />
            <ellipse cx="50" cy="44" rx="16" ry="13" fill="#2a4a7a" opacity="0.6" />
            <circle cx="38" cy="42" r="6" fill="#ffe566" />
            <circle cx="62" cy="42" r="6" fill="#ffe566" />
            <circle cx="38" cy="43" r="2.5" fill="#1a2744" />
            <circle cx="62" cy="43" r="2.5" fill="#1a2744" />
            <polygon points="47,51 53,51 50,56" fill="#c9a84c" />
          </svg>
          <div className="bg-white p-1 rounded">
            <QrCodeImg value={emergencyUrl} size={85 * scale} dark="#0b1530" />
          </div>
          <p className="text-[#d4af37] font-bold tracking-widest" style={{ fontSize: 8 * scale }}>SCAN ME</p>
        </div>
      );

    default:
      return null;
  }
};
