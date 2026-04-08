import React from 'react';
import { X, FileText, Paperclip, RefreshCw } from 'lucide-react';

interface SelectedFilePreviewProps {
  file: File;
  onRemove: () => void;
  onReplace: () => void;
  disabled?: boolean;
}

export const SelectedFilePreview = ({
  file,
  onRemove,
  onReplace,
  disabled = false
}: SelectedFilePreviewProps) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 bg-manila/20 rounded-2xl border border-folder-edge/50 flex items-center justify-between shadow-sm animate-in fade-in slide-in-from-bottom-2">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 bg-manila rounded-xl flex items-center justify-center text-navy-muted shrink-0">
          <Paperclip size={20} />
        </div>
        <div className="overflow-hidden">
          <p className="text-sm font-bold text-navy-muted truncate">{file.name}</p>
          <p className="text-[10px] text-stone-400 uppercase font-bold">{formatSize(file.size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={onReplace}
          disabled={disabled}
          className="p-2 hover:bg-white/50 rounded-lg text-stone-400 hover:text-navy-muted transition-colors disabled:opacity-50"
          title="Replace file"
        >
          <RefreshCw size={18} />
        </button>
        <button
          type="button"
          onClick={onRemove}
          disabled={disabled}
          className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
          title="Remove file"
        >
          <X size={20} />
        </button>
      </div>
    </div>
  );
};
