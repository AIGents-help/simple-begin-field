export type UploadStatus = 'empty' | 'fileSelected' | 'uploading' | 'uploaded' | 'error';

export interface FileMetadata {
  id?: string;
  file_name: string;
  file_path?: string;
  file_size: number;
  mime_type: string;
  category?: string;
  is_private?: boolean;
}

export interface CategoryOption {
  value: string;
  label: string;
  hasCustomLabel?: boolean;
}

export interface UploadProps {
  sectionKey: string;
  packetId: string;
  recordId?: string;
  scope: 'personA' | 'personB' | 'shared';
  categoryOptions?: CategoryOption[];
  requiredCategory?: boolean;
  initialAttachment?: FileMetadata | null;
  onFileSelected?: (file: File) => void;
  onFileRemoved?: () => void;
  onUploadComplete?: (doc: any) => void;
  onUploadError?: (error: any) => void;
  disabled?: boolean;
  isPrivate?: boolean;
}
