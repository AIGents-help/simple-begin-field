import React from 'react';

interface HavenOwlSvgProps {
  size?: number;
  className?: string;
}

export const HavenOwlSvg: React.FC<HavenOwlSvgProps> = ({ size = 64, className }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <defs>
      <linearGradient id="owl-head" x1="50" y1="10" x2="50" y2="50" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#3a6cc0" />
        <stop offset="100%" stopColor="#1e4080" />
      </linearGradient>
      <linearGradient id="owl-body" x1="50" y1="48" x2="50" y2="92" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#2e5fa3" />
        <stop offset="100%" stopColor="#1a3a6b" />
      </linearGradient>
      <radialGradient id="owl-eye-l" cx="38" cy="40" r="6" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffe566" />
        <stop offset="100%" stopColor="#c9a84c" />
      </radialGradient>
      <radialGradient id="owl-eye-r" cx="62" cy="40" r="6" gradientUnits="userSpaceOnUse">
        <stop offset="0%" stopColor="#ffe566" />
        <stop offset="100%" stopColor="#c9a84c" />
      </radialGradient>
    </defs>
    {/* Ear tufts — soft rounded */}
    <ellipse cx="32" cy="16" rx="6" ry="9" fill="#1e4080" />
    <ellipse cx="68" cy="16" rx="6" ry="9" fill="#1e4080" />
    {/* Head */}
    <circle cx="50" cy="36" r="22" fill="url(#owl-head)" />
    {/* Face disc */}
    <ellipse cx="50" cy="40" rx="16" ry="13" fill="#2a4a7a" opacity="0.6" />
    {/* Eyes */}
    <circle cx="38" cy="38" r="7" fill="url(#owl-eye-l)" />
    <circle cx="62" cy="38" r="7" fill="url(#owl-eye-r)" />
    {/* Pupils */}
    <circle cx="38" cy="39" r="3" fill="#1a2744" />
    <circle cx="62" cy="39" r="3" fill="#1a2744" />
    {/* Catchlights */}
    <circle cx="36" cy="37" r="1.2" fill="white" opacity="0.9" />
    <circle cx="60" cy="37" r="1.2" fill="white" opacity="0.9" />
    {/* Beak */}
    <polygon points="47,47 53,47 50,52" fill="#c9a84c" />
    {/* Gold collar */}
    <ellipse cx="50" cy="56" rx="18" ry="4" fill="#c9a84c" opacity="0.85" />
    {/* Body */}
    <ellipse cx="50" cy="74" rx="22" ry="18" fill="url(#owl-body)" />
    {/* Feet */}
    <path d="M40 90 L36 96 M40 90 L40 96 M40 90 L44 96" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
    <path d="M60 90 L56 96 M60 90 L60 96 M60 90 L64 96" stroke="#c9a84c" strokeWidth="1.8" strokeLinecap="round" />
  </svg>
);
