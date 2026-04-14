import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface DownloadPacketButtonProps {
  variant?: 'primary' | 'sidebar' | 'settings';
}

export const DownloadPacketButton = ({ variant = 'primary' }: DownloadPacketButtonProps) => {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      // Placeholder — will connect to an edge function for ZIP generation
      toast.info('Download feature coming soon! Your data export will be available here.');
    } catch (err: any) {
      toast.error(err.message || 'Download failed');
    } finally {
      setDownloading(false);
    }
  };

  if (variant === 'sidebar') {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-500 hover:bg-teal-50 hover:text-teal-700 transition-all group"
      >
        {downloading ? (
          <Loader2 size={18} className="animate-spin text-stone-400" />
        ) : (
          <Download size={18} className="text-stone-400 group-hover:text-teal-600" />
        )}
        <span className="font-bold text-sm tracking-tight">Download Packet</span>
      </button>
    );
  }

  if (variant === 'settings') {
    return (
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50"
      >
        {downloading ? (
          <Loader2 size={16} className="animate-spin" />
        ) : (
          <Download size={16} />
        )}
        {downloading ? 'Preparing...' : 'Download My Packet'}
      </button>
    );
  }

  // Primary (dashboard banner)
  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex-shrink-0 px-5 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
    >
      {downloading ? (
        <Loader2 size={16} className="animate-spin" />
      ) : (
        <Download size={16} />
      )}
      {downloading ? 'Preparing...' : 'Download My Packet'}
    </button>
  );
};
