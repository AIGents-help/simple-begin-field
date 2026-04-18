import React, { useEffect, useState } from 'react';
import { Paperclip, Image as ImageIcon } from 'lucide-react';
import { documentService } from '@/services/documentService';
import { StorageImage } from '@/components/common/StorageImage';

interface Props {
  packetId: string;
  sectionKey: string;
  recordId: string;
}

const isImg = (mime?: string | null, name?: string | null) =>
  /^image\//i.test(mime || '') || /\.(jpe?g|png|heic|heif|webp|gif)$/i.test(name || '');

/**
 * Compact summary for entry list cards: shows first photo thumbnail and a paperclip with file count.
 * Renders nothing when the entry has no attachments.
 */
export const EntryAttachmentSummary: React.FC<Props> = ({ packetId, sectionKey, recordId }) => {
  const [photoPath, setPhotoPath] = useState<string | null>(null);
  const [docCount, setDocCount] = useState(0);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data } = await documentService.getDocuments(packetId, sectionKey, recordId);
      if (cancelled || !data) return;
      const firstPhoto = (data as any[]).find((d) => isImg(d.mime_type, d.file_name));
      const nonPhoto = (data as any[]).filter((d) => !isImg(d.mime_type, d.file_name));
      setPhotoPath(firstPhoto?.file_path || null);
      setDocCount(nonPhoto.length);
    })();
    return () => { cancelled = true; };
  }, [packetId, sectionKey, recordId]);

  if (!photoPath && docCount === 0) return null;

  return (
    <div className="flex items-center gap-2 mt-2">
      {photoPath && (
        <div className="w-12 h-12 rounded-lg overflow-hidden border border-stone-200 bg-stone-50 shrink-0">
          <StorageImage path={photoPath} alt="Attachment thumbnail" className="w-full h-full object-cover" />
        </div>
      )}
      {docCount > 0 && (
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-stone-100 text-stone-600 text-[11px] font-bold">
          <Paperclip size={11} /> {docCount}
        </span>
      )}
      {photoPath && docCount === 0 && (
        <span className="inline-flex items-center gap-1 text-[11px] text-stone-500">
          <ImageIcon size={11} /> Photo attached
        </span>
      )}
    </div>
  );
};
