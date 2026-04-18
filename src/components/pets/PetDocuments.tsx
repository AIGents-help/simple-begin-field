import React, { useEffect, useRef, useState } from 'react';
import { Upload, Trash2, FileText, Loader2, Download } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { documentService } from '@/services/documentService';
import { useConfirm } from '@/context/ConfirmDialogContext';

const PET_DOC_CATEGORIES: { key: string; label: string }[] = [
  { key: 'vaccination_records', label: 'Vaccination records' },
  { key: 'vet_records', label: 'Vet records' },
  { key: 'insurance_card', label: 'Insurance card' },
  { key: 'microchip_certificate', label: 'Microchip certificate' },
];

interface Props {
  packetId: string;
  petRecordId: string;
}

interface DocRow {
  id: string;
  file_name: string;
  file_path: string;
  file_size: number;
  category: string;
  is_private: boolean;
  created_at: string;
}

export const PetDocuments: React.FC<Props> = ({ packetId, petRecordId }) => {
  const [docs, setDocs] = useState<DocRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const inputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const confirm = useConfirm();

  const load = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('documents')
      .select('id, file_name, file_path, file_size, category, is_private, created_at')
      .eq('packet_id', packetId)
      .eq('related_table', 'pet_records')
      .eq('related_record_id', petRecordId);
    if (error) {
      console.error('Failed to load pet documents', error);
      toast.error('Could not load pet documents', { duration: 4000, position: 'bottom-center' });
    } else {
      setDocs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [packetId, petRecordId]);

  const handleUpload = async (categoryKey: string, file: File) => {
    setUploadingKey(categoryKey);
    try {
      const { error } = await documentService.uploadAndCreate(file, {
        packetId,
        sectionKey: 'pets',
        recordId: petRecordId,
        category: categoryKey,
        scope: 'shared',
        isPrivate: false,
      });
      if (error) throw error;
      toast.success('Document uploaded', { duration: 3000, position: 'bottom-center' });
      await load();
    } catch (err: any) {
      console.error('Pet document upload failed', err);
      toast.error(`Upload failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setUploadingKey(null);
    }
  };

  const handleDelete = async (doc: DocRow) => {
    const ok = await confirm({
      title: 'Delete this document?',
      description: `Delete "${doc.file_name}"? This action cannot be undone.`,
    });
    if (!ok) return;
    const { error } = await documentService.deleteDocument(doc.id, doc.file_path, doc.is_private);
    if (error) {
      toast.error(`Delete failed: ${error.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } else {
      toast.success('Document deleted', { duration: 3000, position: 'bottom-center' });
      load();
    }
  };

  const handleDownload = async (doc: DocRow) => {
    const res: any = await documentService.getDocumentUrl(doc.file_path, doc.is_private);
    const href = res?.url || (typeof res === 'string' ? res : null);
    if (href) {
      window.open(href, '_blank');
    } else {
      toast.error('Could not generate download link', {
        duration: 4000,
        position: 'bottom-center',
      });
    }
  };

  return (
    <div className="space-y-3">
      {PET_DOC_CATEGORIES.map((cat) => {
        const existing = docs.filter((d) => d.category === cat.key);
        const isUploading = uploadingKey === cat.key;
        return (
          <div key={cat.key} className="rounded-xl border border-stone-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold text-navy-muted">{cat.label}</p>
              <input
                ref={(el) => (inputRefs.current[cat.key] = el)}
                type="file"
                className="hidden"
                accept=".pdf,.jpg,.jpeg,.png,.heic,.doc,.docx"
                onChange={(e) => {
                  const f = e.target.files?.[0];
                  if (f) handleUpload(cat.key, f);
                  e.target.value = '';
                }}
              />
              <button
                type="button"
                onClick={() => inputRefs.current[cat.key]?.click()}
                disabled={isUploading}
                className="px-3 py-1.5 rounded-lg bg-navy-muted text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 transition-all disabled:opacity-50"
              >
                {isUploading ? (
                  <Loader2 size={12} className="animate-spin" />
                ) : (
                  <Upload size={12} />
                )}
                Upload
              </button>
            </div>
            {loading ? (
              <p className="text-xs text-stone-400">Loading...</p>
            ) : existing.length === 0 ? (
              <p className="text-xs text-stone-400 italic">None uploaded</p>
            ) : (
              <ul className="space-y-1.5">
                {existing.map((d) => (
                  <li
                    key={d.id}
                    className="flex items-center justify-between gap-2 text-xs bg-stone-50 rounded-lg px-2.5 py-2"
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <FileText size={14} className="text-stone-400 shrink-0" />
                      <span className="truncate text-navy-muted font-medium">{d.file_name}</span>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => handleDownload(d)}
                        className="p-1.5 rounded text-stone-500 hover:text-navy-muted hover:bg-white"
                        aria-label="Download"
                      >
                        <Download size={14} />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(d)}
                        className="p-1.5 rounded text-stone-500 hover:text-rose-600 hover:bg-white"
                        aria-label="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        );
      })}
    </div>
  );
};
