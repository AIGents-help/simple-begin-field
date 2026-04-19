import React, { useState } from 'react';
import { Loader2, Mail, X, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface SendQrCardModalProps {
  open: boolean;
  onClose: () => void;
  qrPngDataUrl: string; // data:image/png;base64,XXX
  emergencyUrl: string;
}

const isEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());

export const SendQrCardModal: React.FC<SendQrCardModalProps> = ({
  open,
  onClose,
  qrPngDataUrl,
  emergencyUrl,
}) => {
  const [to, setTo] = useState('');
  const [name, setName] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  if (!open) return null;

  const handleSend = async () => {
    if (!isEmail(to)) {
      toast.error('Enter a valid email address', { duration: 4000, position: 'bottom-center' });
      return;
    }
    if (!qrPngDataUrl) {
      toast.error("Couldn't send — check the email address and try again.", {
        duration: 5000,
        position: 'bottom-center',
      });
      return;
    }
    setSending(true);
    try {
      const base64 = qrPngDataUrl.includes(',') ? qrPngDataUrl.split(',')[1] : qrPngDataUrl;
      const { data, error } = await supabase.functions.invoke('send-emergency-card', {
        body: {
          to: to.trim(),
          recipientName: name.trim(),
          message: message.trim(),
          qrPngBase64: base64,
          emergencyUrl,
        },
      });
      if (error || (data && (data as any).error)) {
        throw new Error(error?.message || (data as any)?.error || 'Send failed');
      }
      toast.success(`Emergency card sent to ${name.trim() || to.trim()}.`, {
        duration: 4000,
        position: 'bottom-center',
      });
      setTo(''); setName(''); setMessage('');
      onClose();
    } catch (e: any) {
      console.error('send-emergency-card error', e);
      toast.error("Couldn't send — check the email address and try again.", {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="w-full sm:max-w-md bg-white rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 sm:p-6 animate-in slide-in-from-bottom duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Mail className="w-4 h-4 text-navy-muted" />
            <h3 className="text-sm font-bold text-navy-muted">Send Emergency QR Card</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-stone-100 text-stone-500"
            aria-label="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-stone-500 leading-relaxed mb-4">
          Email your QR card with simple instructions for using it in an emergency.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              To (email)
            </label>
            <input
              type="email"
              autoComplete="email"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              placeholder="contact@example.com"
              className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Their name
            </label>
            <input
              type="text"
              maxLength={80}
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Sarah"
              className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm"
            />
          </div>

          <div>
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">
              Personal note (optional)
            </label>
            <textarea
              rows={3}
              maxLength={500}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Add a personal note..."
              className="w-full mt-1 p-3 bg-white rounded-xl border border-stone-200 text-sm resize-none"
            />
          </div>
        </div>

        <div className="flex gap-2 mt-5">
          <button
            onClick={onClose}
            disabled={sending}
            className="flex-1 py-3 rounded-xl text-sm font-semibold bg-stone-100 text-stone-700 hover:bg-stone-200 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !to.trim()}
            className="flex-1 py-3 rounded-xl text-sm font-bold bg-navy-muted text-white flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Send className="w-3.5 h-3.5" /> Send
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default SendQrCardModal;
