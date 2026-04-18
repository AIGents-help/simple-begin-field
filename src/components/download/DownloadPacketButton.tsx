import React, { useState } from 'react';
import { Download, Loader2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { DownloadConfigModal } from './DownloadConfigModal';

interface DownloadPacketButtonProps {
  variant?: 'primary' | 'sidebar' | 'settings';
  packetId?: string;          // override (admin or trusted contact)
  defaultSection?: string;    // open modal targeting one section
  label?: string;
}

export const DownloadPacketButton = ({
  variant = 'primary',
  packetId,
  defaultSection,
  label,
}: DownloadPacketButtonProps) => {
  const [open, setOpen] = useState(false);
  const { user, currentPacket } = useAppContext();
  const [downloading] = useState(false);

  const onClick = () => {
    if (!user) return;
    setOpen(true);
  };

  const resolvedPacketId = packetId || currentPacket?.id;

  if (variant === 'sidebar') {
    return (
      <>
        <button
          onClick={onClick}
          className="w-full flex items-center gap-3 px-4 py-2.5 rounded-xl text-stone-500 hover:bg-teal-50 hover:text-teal-700 transition-all group"
        >
          {downloading ? (
            <Loader2 size={18} className="animate-spin text-stone-400" />
          ) : (
            <Download size={18} className="text-stone-400 group-hover:text-teal-600" />
          )}
          <span className="font-bold text-sm tracking-tight">{label || 'Download Packet'}</span>
        </button>
        <DownloadConfigModal
          isOpen={open}
          onClose={() => setOpen(false)}
          packetId={resolvedPacketId}
          defaultSection={defaultSection}
        />
      </>
    );
  }

  if (variant === 'settings') {
    return (
      <>
        <button
          onClick={onClick}
          className="w-full py-3 bg-teal-600 text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-teal-700 transition-colors disabled:opacity-50"
        >
          <Download size={16} />
          {label || 'Download My Packet'}
        </button>
        <DownloadConfigModal
          isOpen={open}
          onClose={() => setOpen(false)}
          packetId={resolvedPacketId}
          defaultSection={defaultSection}
        />
      </>
    );
  }

  return (
    <>
      <button
        onClick={onClick}
        className="flex-shrink-0 px-5 py-3 bg-teal-600 text-white rounded-xl font-bold text-sm flex items-center gap-2 hover:bg-teal-700 transition-colors shadow-md shadow-teal-600/20 disabled:opacity-50"
      >
        <Download size={16} />
        {label || 'Download My Packet'}
      </button>
      <DownloadConfigModal
        isOpen={open}
        onClose={() => setOpen(false)}
        packetId={resolvedPacketId}
        defaultSection={defaultSection}
      />
    </>
  );
};
