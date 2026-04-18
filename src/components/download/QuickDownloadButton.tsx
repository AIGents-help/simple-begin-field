import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { packetPdfService, PdfDownloadType } from '@/services/packetPdfService';

interface QuickDownloadButtonProps {
  downloadType: PdfDownloadType;
  packetId?: string;
  sections?: string[];
  redactSensitive?: boolean;
  label: string;
  icon?: React.ElementType;
  className?: string;
  variant?: 'solid' | 'outline' | 'ghost';
  onComplete?: () => void;
}

/**
 * One-click PDF download (no config modal) — used for:
 *  - "Download Funeral Instructions" (funeral_instructions)
 *  - "Download Emergency Medical" (emergency_medical)
 *  - "Download This Section" from a section header
 */
export const QuickDownloadButton: React.FC<QuickDownloadButtonProps> = ({
  downloadType,
  packetId,
  sections,
  redactSensitive = true,
  label,
  icon: Icon = Download,
  className = '',
  variant = 'outline',
  onComplete,
}) => {
  const [busy, setBusy] = useState(false);

  const run = async () => {
    setBusy(true);
    try {
      const result = await packetPdfService.generate({
        packetId,
        sections,
        redactSensitive,
        downloadType,
        includeCover: downloadType === 'full_packet',
      });
      toast.success(`Downloaded ${result.filename}`);
      onComplete?.();
    } catch (err: any) {
      console.error('[QuickDownloadButton] failed', err);
      toast.error(err?.message || 'PDF generation failed', {
        action: { label: 'Retry', onClick: () => void run() },
        duration: 8000,
      });
    } finally {
      setBusy(false);
    }
  };

  const baseClasses = 'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-bold transition-colors disabled:opacity-60';
  const variantClasses =
    variant === 'solid'
      ? 'bg-teal-600 text-white hover:bg-teal-700 px-4 py-2.5'
      : variant === 'ghost'
        ? 'text-teal-700 hover:bg-teal-50 px-3 py-2'
        : 'border border-teal-300 text-teal-700 hover:bg-teal-50 px-3 py-2';

  return (
    <button
      type="button"
      onClick={run}
      disabled={busy}
      className={`${baseClasses} ${variantClasses} ${className}`}
    >
      {busy ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
      {busy ? 'Preparing…' : label}
    </button>
  );
};
