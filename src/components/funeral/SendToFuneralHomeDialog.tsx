import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send, X, FileDown, Image as ImageIcon } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { buildFuneralPdfBlob, generateFuneralPdf } from '@/services/funeralPdfService';
import { funeralPhotoService, FuneralPhoto } from '@/services/funeralPhotoService';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  onSent: (timestamp: string, email: string) => void;
}

const blobToBase64 = (blob: Blob): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      resolve(result.split(',')[1] || '');
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });

export const SendToFuneralHomeDialog: React.FC<Props> = ({ isOpen, onClose, record, onSent }) => {
  const { currentPacket } = useAppContext();
  const [email, setEmail] = useState(record.funeral_home_email || '');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [photos, setPhotos] = useState<FuneralPhoto[]>([]);
  const [includePhotos, setIncludePhotos] = useState(true);

  useEffect(() => {
    if (isOpen) {
      setEmail(record.funeral_home_email || '');
      setMessage('');
      funeralPhotoService.list(record.id).then(setPhotos).catch(() => setPhotos([]));
    }
  }, [isOpen, record.funeral_home_email, record.id]);

  if (!isOpen) return null;

  const personName = currentPacket?.person_a_name || '';

  const includes = {
    obituary: !!record.obituary_text,
    eulogy: !!record.eulogy_text,
    burial: !!record.burial_or_cremation,
    service: !!record.service_preferences,
    flowers: !!record.flowers_preferences,
    reception: !!record.reception_wishes,
  };

  const send = async () => {
    if (!email || !email.includes('@')) {
      toast.error('Enter a valid funeral home email', { duration: 4000, position: 'bottom-center' });
      return;
    }
    setSending(true);
    try {
      const blob = await buildFuneralPdfBlob({
        section: 'full',
        packetTitle: currentPacket?.title || 'Survivor Packet',
        personName,
        record,
      });
      const base64 = await blobToBase64(blob);
      const filename = `funeral-instructions-${(personName || 'survivor-packet').replace(/\s+/g, '-').toLowerCase()}.pdf`;

      // Compress photos to JPEG attachments (cap total to keep email under provider limits)
      let photoAttachments: { filename: string; content: string; mime: string }[] = [];
      if (includePhotos && photos.length > 0) {
        const MAX_BYTES = 5_500_000; // ~5.5MB across all photos
        let total = 0;
        for (const p of photos) {
          const compressed = await funeralPhotoService.compressToBase64(p.file_path, {
            maxDim: 1400,
            quality: 0.78,
          });
          if (!compressed) continue;
          // Approx decoded byte size (3/4 of base64 length)
          const bytes = (compressed.base64.length * 3) / 4;
          if (total + bytes > MAX_BYTES) {
            toast.message(`Some photos were skipped to stay under the email size limit.`, {
              duration: 4000,
              position: 'bottom-center',
            });
            break;
          }
          total += bytes;
          photoAttachments.push({
            filename: compressed.filename,
            content: compressed.base64,
            mime: compressed.mime,
          });
        }
      }

      const { data, error } = await supabase.functions.invoke('send-funeral-instructions', {
        body: {
          to: email,
          personName,
          packetId: currentPacket?.id,
          funeralRecordId: record.id,
          message,
          pdfBase64: base64,
          filename,
          photoAttachments,
        },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);

      const ts = new Date().toISOString();
      onSent(ts, email);
      toast.success(`Sent to ${email}`, { duration: 4000, position: 'bottom-center' });
      onClose();
    } catch (err: any) {
      console.error('Send failed', err);
      toast.error(`Send failed: ${err?.message || 'Unknown error'}`, {
        duration: 6000,
        position: 'bottom-center',
      });
    } finally {
      setSending(false);
    }
  };

  const downloadPreview = () =>
    generateFuneralPdf({
      section: 'full',
      packetTitle: currentPacket?.title || 'Survivor Packet',
      personName,
      record,
    });

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 p-4">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between p-4 border-b border-stone-100">
          <div>
            <h3 className="text-base font-bold text-navy-muted">Send to Funeral Home</h3>
            <p className="text-xs text-stone-500">Preview what will be sent before confirming.</p>
          </div>
          <button onClick={onClose} className="p-1 text-stone-400 hover:text-navy-muted">
            <X size={18} />
          </button>
        </div>
        <div className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
          <div>
            <Label className="text-xs text-stone-600 mb-1 block">Recipient email</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="info@funeralhome.com"
            />
          </div>

          <div>
            <Label className="text-xs text-stone-600 mb-1 block">Message (optional)</Label>
            <Textarea
              rows={3}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a short note for the funeral home…"
            />
          </div>

          <div className="rounded-xl bg-stone-50 border border-stone-200 p-3 text-xs space-y-1.5">
            <p className="font-bold text-navy-muted mb-2">Package contents</p>
            <Bullet ok>Identity: {personName || '—'}</Bullet>
            <Bullet ok={includes.burial}>Burial/cremation preference</Bullet>
            <Bullet ok={includes.service}>Service preferences</Bullet>
            <Bullet ok={includes.obituary}>Obituary</Bullet>
            <Bullet ok={includes.eulogy}>Eulogy</Bullet>
            <Bullet ok>Music list (if any)</Bullet>
            <Bullet ok>Readings (if any)</Bullet>
            <Bullet ok={includes.flowers}>Flowers & arrangements</Bullet>
            <Bullet ok={includes.reception}>Reception wishes</Bullet>
            <Bullet ok={photos.length > 0}>
              Photos ({photos.length}) — compressed and attached
            </Bullet>
          </div>

          {photos.length > 0 && (
            <label className="flex items-center justify-between gap-2 rounded-xl border border-stone-200 bg-white p-3 text-xs">
              <span className="flex items-center gap-2 font-bold text-navy-muted">
                <ImageIcon size={14} />
                Attach {photos.length} photo{photos.length === 1 ? '' : 's'} to email
              </span>
              <input
                type="checkbox"
                checked={includePhotos}
                onChange={(e) => setIncludePhotos(e.target.checked)}
                className="h-4 w-4 accent-navy-muted"
              />
            </label>
          )}

          <button
            type="button"
            onClick={downloadPreview}
            className="w-full h-10 rounded-xl border border-stone-200 text-xs font-bold text-navy-muted flex items-center justify-center gap-1.5"
          >
            <FileDown size={14} />
            Download Preview PDF
          </button>
        </div>
        <div className="p-4 border-t border-stone-100 flex items-center gap-2">
          <button
            onClick={onClose}
            className="flex-1 h-11 rounded-xl border border-stone-200 text-sm font-bold text-stone-600"
          >
            Cancel
          </button>
          <button
            onClick={send}
            disabled={sending}
            className="flex-[2] h-11 rounded-xl bg-navy-muted text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Confirm & Send
          </button>
        </div>
      </div>
    </div>
  );
};

const Bullet: React.FC<{ ok?: boolean; children: React.ReactNode }> = ({ ok, children }) => (
  <p className={ok ? 'text-stone-700' : 'text-stone-400 line-through'}>
    {ok ? '✓' : '○'} {children}
  </p>
);
