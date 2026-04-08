import React, { useState, useRef, useEffect } from 'react';
import { UploadProps, UploadStatus, FileMetadata } from './types';
import { SelectedFilePreview } from './SelectedFilePreview';
import { UploadedFileCard } from './UploadedFileCard';
import { UploadStatusBadge } from './UploadStatusBadge';
import { Plus, Loader2, AlertCircle } from 'lucide-react';
import { documentService } from '../../services/documentService';
import { PlanGate } from '../billing/PlanGate';

export const FileAttachmentField = ({
  sectionKey,
  packetId,
  recordId,
  scope,
  initialAttachment = null,
  onFileSelected,
  onFileRemoved,
  onUploadComplete,
  onUploadError,
  disabled = false,
  isPrivate = false
}: UploadProps) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [status, setStatus] = useState<UploadStatus>(initialAttachment ? 'uploaded' : 'empty');
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (initialAttachment) {
      setStatus('uploaded');
    } else if (!selectedFile) {
      setStatus('empty');
    }
  }, [initialAttachment, selectedFile]);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setStatus('fileSelected');
    setError(null);
    if (onFileSelected) onFileSelected(file);
  };

  const handleRemove = () => {
    setSelectedFile(null);
    setStatus('empty');
    setError(null);
    if (onFileRemoved) onFileRemoved();
  };

  const handleReplace = () => {
    fileInputRef.current?.click();
  };

  const handleView = async () => {
    if (!initialAttachment?.file_path) return;
    try {
      const { url } = await documentService.getDocumentUrl(initialAttachment.file_path, isPrivate);
      if (url) window.open(url, '_blank');
    } catch (err) {
      console.error("Failed to get URL:", err);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
          Document Attachment
        </label>
        <UploadStatusBadge status={status} />
      </div>

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled}
      />

      {status === 'empty' && (
        <PlanGate feature="upload">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="w-full p-6 border-2 border-dashed border-stone-200 rounded-3xl flex flex-col items-center justify-center gap-2 text-stone-400 bg-white hover:border-stone-300 transition-all disabled:opacity-50"
          >
            <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-stone-300">
              <Plus size={24} />
            </div>
            <span className="font-bold text-sm">Attach a document</span>
            <span className="text-[10px] uppercase tracking-widest font-bold opacity-60">PDF, DOC, or Image</span>
          </button>
        </PlanGate>
      )}

      {status === 'fileSelected' && selectedFile && (
        <SelectedFilePreview
          file={selectedFile}
          onRemove={handleRemove}
          onReplace={handleReplace}
          disabled={disabled}
        />
      )}

      {status === 'uploaded' && initialAttachment && (
        <UploadedFileCard
          file={initialAttachment}
          onView={handleView}
          onDelete={handleRemove}
          disabled={disabled}
        />
      )}

      {status === 'uploading' && (
        <div className="p-6 border border-stone-100 rounded-3xl bg-white flex flex-col items-center justify-center gap-3 shadow-sm">
          <Loader2 size={24} className="text-navy-muted animate-spin" />
          <p className="text-sm font-bold text-navy-muted">Uploading document...</p>
        </div>
      )}

      {status === 'error' && (
        <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600">
          <AlertCircle size={20} />
          <div className="flex-1">
            <p className="text-sm font-bold">Upload failed</p>
            <p className="text-[10px] uppercase font-bold opacity-70">{error || 'Please try again'}</p>
          </div>
          <button
            type="button"
            onClick={() => setStatus('fileSelected')}
            className="text-xs font-bold underline"
          >
            Retry
          </button>
        </div>
      )}
    </div>
  );
};
