import React from 'react';
import { UploadStatus } from './types';
import { CheckCircle2, AlertCircle, Loader2, FileText, Paperclip } from 'lucide-react';

interface UploadStatusBadgeProps {
  status: UploadStatus;
  className?: string;
}

export const UploadStatusBadge = ({ status, className = '' }: UploadStatusBadgeProps) => {
  switch (status) {
    case 'empty':
      return (
        <span className={`px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold uppercase text-stone-400 border border-stone-200 flex items-center gap-1 ${className}`}>
          <FileText size={10} />
          No file
        </span>
      );
    case 'fileSelected':
      return (
        <span className={`px-2 py-0.5 bg-manila rounded text-[10px] font-bold uppercase text-navy-muted border border-folder-edge flex items-center gap-1 ${className}`}>
          <Paperclip size={10} />
          File selected
        </span>
      );
    case 'uploading':
      return (
        <span className={`px-2 py-0.5 bg-blue-50 rounded text-[10px] font-bold uppercase text-blue-600 border border-blue-100 flex items-center gap-1 ${className}`}>
          <Loader2 size={10} className="animate-spin" />
          Uploading
        </span>
      );
    case 'uploaded':
      return (
        <span className={`px-2 py-0.5 bg-emerald-50 rounded text-[10px] font-bold uppercase text-emerald-600 border border-emerald-100 flex items-center gap-1 ${className}`}>
          <CheckCircle2 size={10} />
          Uploaded
        </span>
      );
    case 'error':
      return (
        <span className={`px-2 py-0.5 bg-red-50 rounded text-[10px] font-bold uppercase text-red-600 border border-red-100 flex items-center gap-1 ${className}`}>
          <AlertCircle size={10} />
          Failed
        </span>
      );
    default:
      return null;
  }
};
