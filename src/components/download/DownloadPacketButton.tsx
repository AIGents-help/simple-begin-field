import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAppContext } from '../../context/AppContext';
import { generatePacketPDF } from '../../services/pdfExportService';

interface DownloadPacketButtonProps {
  variant?: 'primary' | 'sidebar' | 'settings';
}

export const DownloadPacketButton = ({ variant = 'primary' }: DownloadPacketButtonProps) => {
  const [downloading, setDownloading] = useState(false);
  const { user } = useAppContext();

  const handleDownload = async () => {
    if (!user) {
      toast.error('You must be signed in to download');
      return;
    }
    setDownloading(true);
    try {
      await generatePacketPDF(user.id);
      toast.success('Your Packet has been downloaded');
    } catch (err: any) {
      console.error('PDF export error:', err);
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
        <span className="font-bold text-sm tracking-tight">{downloading ? 'Preparing...' : 'Download Packet'}</span>
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
        {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
        {downloading ? 'Preparing...' : 'Download My Packet'}
      </button>
    );
  }

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="flex-shrink-0 px-5 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
    >
      {downloading ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
      {downloading ? 'Preparing...' : 'Download My Packet'}
    </button>
  );
};
