import React, { useRef, useState } from 'react';
import { Upload, FileText, Paperclip, AlertCircle } from 'lucide-react';

interface FileUploadAreaProps {
  onFileSelected: (file: File) => void;
  disabled?: boolean;
  acceptedFileTypes?: string;
  maxFileSize?: number; // in bytes
  label?: string;
  description?: string;
}

export const FileUploadArea = ({
  onFileSelected,
  disabled = false,
  acceptedFileTypes = '.pdf,.doc,.docx,.jpg,.jpeg,.png',
  maxFileSize = 10 * 1024 * 1024, // 10MB default
  label = 'Attach Document',
  description = 'PDF, DOC, or Image (Max 10MB)'
}: FileUploadAreaProps) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File) => {
    setError(null);
    if (maxFileSize && file.size > maxFileSize) {
      setError(`File is too large. Max size is ${maxFileSize / 1024 / 1024}MB.`);
      return;
    }
    onFileSelected(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) setIsDragging(true);
  };

  const onDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <div
        onClick={() => !disabled && fileInputRef.current?.click()}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        className={`
          relative border-2 border-dashed rounded-3xl p-8 flex flex-col items-center justify-center gap-3 transition-all cursor-pointer
          ${isDragging ? 'border-navy-muted bg-navy-muted/5' : 'border-stone-200 bg-white hover:border-stone-300'}
          ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={onFileChange}
          disabled={disabled}
        />
        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${isDragging ? 'bg-navy-muted text-white' : 'bg-stone-100 text-stone-400'}`}>
          <Upload size={24} />
        </div>
        <div className="text-center">
          <p className="font-bold text-navy-muted">{label}</p>
          <p className="text-[10px] text-stone-400 uppercase font-bold tracking-wider mt-1">{description}</p>
        </div>
      </div>
      {error && (
        <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-2 animate-in fade-in slide-in-from-top-1">
          <AlertCircle size={14} />
          {error}
        </div>
      )}
    </div>
  );
};
