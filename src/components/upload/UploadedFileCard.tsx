import React from 'react';
import { FileText, Paperclip, ExternalLink, Trash2, CheckCircle2 } from 'lucide-react';
import { FileMetadata } from './types';

interface UploadedFileCardProps {
  file: FileMetadata;
  onView?: () => void;
  onDelete?: () => void;
  disabled?: boolean;
}

export const UploadedFileCard = ({
  file,
  onView,
  onDelete,
  disabled = false
}: UploadedFileCardProps) => {
  const formatSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="p-4 bg-white rounded-2xl border border-stone-200 flex items-center justify-between shadow-sm group hover:border-stone-300 transition-all">
      <div className="flex items-center gap-3 overflow-hidden">
        <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-emerald-600 shrink-0">
          <CheckCircle2 size={20} />
        </div>
        <div className="overflow-hidden">
          <div className="flex items-center gap-2">
            <p className="text-sm font-bold text-navy-muted truncate">{file.file_name}</p>
            {file.category && (
              <span className="px-1.5 py-0.5 bg-stone-100 rounded text-[8px] font-bold uppercase text-stone-400 border border-stone-200 shrink-0">
                {file.category}
              </span>
            )}
          </div>
          <p className="text-[10px] text-stone-400 uppercase font-bold">{formatSize(file.file_size)}</p>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {onView && (
          <button
            type="button"
            onClick={onView}
            disabled={disabled}
            className="px-4 py-2 bg-navy-muted text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-sm active:scale-95 transition-all disabled:opacity-50"
          >
            <ExternalLink size={14} />
            View
          </button>
        )}
        {onDelete && (
          <button
            type="button"
            onClick={onDelete}
            disabled={disabled}
            className="p-2 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors disabled:opacity-50"
            title="Delete file"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
};
