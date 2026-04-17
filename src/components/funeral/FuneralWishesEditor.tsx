import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Save, FileDown, Send } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { RichTextEditor } from '@/components/ui/rich-text-editor';
import { useAppContext } from '@/context/AppContext';
import { generateFuneralPdf } from '@/services/funeralPdfService';

const BURIAL_OPTIONS = ['Burial', 'Cremation', 'Green burial', 'Donation to science', 'Undecided'];

interface Props {
  record: any;
  onSaved: (updated: any) => void;
  onSendClick: () => void;
}

export const FuneralWishesEditor: React.FC<Props> = ({ record, onSaved, onSendClick }) => {
  const { currentPacket } = useAppContext();
  const [form, setForm] = useState<any>(record);
  const [saving, setSaving] = useState(false);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => setForm(record), [record]);

  const update = (patch: any) => setForm((f: any) => ({ ...f, ...patch }));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { ...form, updated_at: new Date().toISOString() };
      delete payload.id;
      const { data, error } = await supabase
        .from('funeral_records')
        .update(payload)
        .eq('id', record.id)
        .select()
        .single();
      if (error) throw error;
      onSaved(data);
      toast.success('Funeral wishes saved', { duration: 2500, position: 'bottom-center' });
    } catch (err: any) {
      console.error('Save funeral wishes failed', err);
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const downloadSection = async (section: 'obituary' | 'eulogy' | 'full') => {
    setDownloading(section);
    try {
      await generateFuneralPdf({
        section,
        packetTitle: currentPacket?.title || 'Survivor Packet',
        personName: currentPacket?.person_a_name || '',
        record: form,
      });
    } catch (err: any) {
      toast.error(`PDF generation failed: ${err?.message || 'Unknown'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setDownloading(null);
    }
  };

  // Estimated reading time for eulogy (~150 wpm)
  const eulogyText = (form.eulogy_text || '').replace(/<[^>]+>/g, ' ').trim();
  const wordCount = eulogyText ? eulogyText.split(/\s+/).length : 0;
  const eulogyMinutes = Math.max(1, Math.round(wordCount / 150));
  const obituaryChars = (form.obituary_text || '').replace(/<[^>]+>/g, '').length;

  const hasFuneralHomeEmail = !!form.funeral_home_email;

  return (
    <div className="space-y-6">
      {/* Send to Funeral Home banner */}
      {hasFuneralHomeEmail && (
        <div className="rounded-2xl border border-navy-muted/20 bg-gradient-to-br from-navy-muted/5 to-amber-50 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-sm font-bold text-navy-muted">Send to Funeral Home</p>
              <p className="text-xs text-stone-600 mt-0.5">
                Send all funeral instructions to <strong>{form.funeral_home_email}</strong> as a PDF.
              </p>
              {form.last_sent_to_funeral_home_at && (
                <p className="text-[11px] text-stone-500 mt-1">
                  Last sent {new Date(form.last_sent_to_funeral_home_at).toLocaleString()}
                  {form.last_sent_to_email ? ` to ${form.last_sent_to_email}` : ''}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={onSendClick}
              className="px-4 py-2 rounded-xl bg-navy-muted text-white text-xs font-bold flex items-center gap-1.5 active:scale-95 shrink-0"
            >
              <Send size={14} />
              Send
            </button>
          </div>
        </div>
      )}

      {/* Service preferences */}
      <Card title="Service Preferences">
        <div className="space-y-3">
          <Field label="Burial or Cremation">
            <select
              value={form.burial_or_cremation || ''}
              onChange={(e) => update({ burial_or_cremation: e.target.value })}
              className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="">Select...</option>
              {BURIAL_OPTIONS.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Service preferences">
            <Textarea
              rows={3}
              value={form.service_preferences || ''}
              onChange={(e) => update({ service_preferences: e.target.value })}
              placeholder="Religious service, military honors, open vs. closed casket, etc."
            />
          </Field>
          <Field label="Religious / cultural preferences">
            <Textarea
              rows={2}
              value={form.religious_cultural_preferences || ''}
              onChange={(e) => update({ religious_cultural_preferences: e.target.value })}
            />
          </Field>
          <Field label="Cemetery / plot details">
            <Textarea
              rows={2}
              value={form.cemetery_plot_details || ''}
              onChange={(e) => update({ cemetery_plot_details: e.target.value })}
            />
          </Field>
          <Field label="Prepaid arrangements">
            <Textarea
              rows={2}
              value={form.prepaid_arrangements || ''}
              onChange={(e) => update({ prepaid_arrangements: e.target.value })}
              placeholder="Policy number, provider, payment status…"
            />
          </Field>
        </div>
      </Card>

      {/* Funeral Home contact */}
      <Card title="Funeral Home Contact">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field label="Funeral home">
            <Input
              value={form.funeral_home || ''}
              onChange={(e) => update({ funeral_home: e.target.value })}
            />
          </Field>
          <Field label="Funeral director">
            <Input
              value={form.funeral_director || ''}
              onChange={(e) => update({ funeral_director: e.target.value })}
            />
          </Field>
          <Field label="Email">
            <Input
              type="email"
              value={form.funeral_home_email || ''}
              onChange={(e) => update({ funeral_home_email: e.target.value })}
              placeholder="info@funeralhome.com"
            />
          </Field>
          <Field label="Phone">
            <Input
              value={form.funeral_home_phone || ''}
              onChange={(e) => update({ funeral_home_phone: e.target.value })}
            />
          </Field>
        </div>
      </Card>

      {/* Obituary */}
      <Card
        title="Obituary"
        action={
          <button
            type="button"
            onClick={() => downloadSection('obituary')}
            disabled={downloading === 'obituary' || !form.obituary_text}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-navy-muted flex items-center gap-1.5 disabled:opacity-50"
          >
            {downloading === 'obituary' ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            PDF
          </button>
        }
      >
        <RichTextEditor
          value={form.obituary_text || ''}
          onChange={(html) => update({ obituary_text: html })}
          placeholder="Write the obituary you'd like published…"
          minHeight={200}
          showCharCount
        />
        <p className="text-[11px] text-stone-500 mt-1">{obituaryChars.toLocaleString()} characters</p>
        <Field label="Notes for editor" className="mt-3">
          <Textarea
            rows={2}
            value={form.obituary_notes || ''}
            onChange={(e) => update({ obituary_notes: e.target.value })}
            placeholder="Where to publish, photo to include, etc."
          />
        </Field>
      </Card>

      {/* Eulogy */}
      <Card
        title="Eulogy"
        action={
          <button
            type="button"
            onClick={() => downloadSection('eulogy')}
            disabled={downloading === 'eulogy' || !form.eulogy_text}
            className="px-3 py-1.5 rounded-lg border border-stone-200 text-xs font-bold text-navy-muted flex items-center gap-1.5 disabled:opacity-50"
          >
            {downloading === 'eulogy' ? <Loader2 size={12} className="animate-spin" /> : <FileDown size={12} />}
            PDF
          </button>
        }
      >
        <Field label="Author">
          <Input
            value={form.eulogy_author || ''}
            onChange={(e) => update({ eulogy_author: e.target.value })}
            placeholder="Who will read this?"
          />
        </Field>
        <div className="mt-3">
          <RichTextEditor
            value={form.eulogy_text || ''}
            onChange={(html) => update({ eulogy_text: html })}
            placeholder="Write the eulogy you'd like delivered…"
            minHeight={240}
          />
          {wordCount > 0 && (
            <p className="text-[11px] text-stone-500 mt-1">
              ~{wordCount.toLocaleString()} words · est. {eulogyMinutes} min reading
            </p>
          )}
        </div>
      </Card>

      {/* Flowers & Reception & Personal Messages */}
      <Card title="Flowers & Arrangements">
        <Textarea
          rows={3}
          value={form.flowers_preferences || ''}
          onChange={(e) => update({ flowers_preferences: e.target.value })}
          placeholder="Favorite flowers, colors, florist, 'donations in lieu of flowers'…"
        />
      </Card>

      <Card title="Reception Wishes">
        <Textarea
          rows={3}
          value={form.reception_wishes || ''}
          onChange={(e) => update({ reception_wishes: e.target.value })}
          placeholder="Location, food, atmosphere, dress code…"
        />
      </Card>

      <Card title="Personal Messages">
        <Textarea
          rows={3}
          value={form.personal_messages || ''}
          onChange={(e) => update({ personal_messages: e.target.value })}
          placeholder="Short messages to display on the program or memorial board."
        />
      </Card>

      <Card title="Additional Instructions">
        <Textarea
          rows={3}
          value={form.additional_instructions || ''}
          onChange={(e) => update({ additional_instructions: e.target.value })}
        />
      </Card>

      <div className="flex items-center gap-2 sticky bottom-4">
        <button
          onClick={save}
          disabled={saving}
          className="flex-1 h-12 rounded-xl bg-navy-muted text-white font-bold text-sm flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-50"
        >
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          Save Funeral Wishes
        </button>
        <button
          type="button"
          onClick={() => downloadSection('full')}
          disabled={downloading === 'full'}
          className="h-12 px-4 rounded-xl border border-stone-200 bg-white text-xs font-bold text-navy-muted flex items-center gap-1.5 disabled:opacity-50"
        >
          {downloading === 'full' ? <Loader2 size={14} className="animate-spin" /> : <FileDown size={14} />}
          Full PDF
        </button>
      </div>
    </div>
  );
};

const Card: React.FC<{ title: string; action?: React.ReactNode; children: React.ReactNode }> = ({
  title,
  action,
  children,
}) => (
  <div className="rounded-2xl border border-stone-200 bg-white p-4">
    <div className="flex items-center justify-between mb-3">
      <h3 className="text-sm font-bold text-navy-muted">{title}</h3>
      {action}
    </div>
    {children}
  </div>
);

const Field: React.FC<{ label: string; className?: string; children: React.ReactNode }> = ({
  label,
  className,
  children,
}) => (
  <div className={className}>
    <Label className="text-xs text-stone-600 mb-1 block">{label}</Label>
    {children}
  </div>
);
