import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Trash2, Save, Loader2, ChevronDown, ChevronUp, FileText, Eye, EyeOff } from 'lucide-react';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { identityService, IdentityRecord } from '@/services/identityService';
import { RecordDocumentUpload } from '@/components/common/RecordDocumentUpload';

export type FieldType = 'text' | 'textarea' | 'date' | 'masked' | 'select' | 'tel' | 'number';

export interface IdentityFieldConfig {
  name: string;            // stored under details[name] (or top-level for title/notes/expiry_date)
  label: string;
  type?: FieldType;
  options?: string[];
  placeholder?: string;
  rows?: number;
  topLevel?: boolean;      // when true, store on the record root (notes, expiry_date, title)
}

export interface IdentitySection {
  id: string;
  label: string;
  fields?: IdentityFieldConfig[];
  render?: (ctx: { record: IdentityRecord; setField: (n: string, v: any) => void; topLevel: (n: string, v: any) => void }) => React.ReactNode;
}

export interface IdentityDocumentCardProps {
  record: IdentityRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: IdentityRecord, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft?: (id: string) => void;
  /** Heading shown on the card face (e.g. "Driver's License") */
  title: string;
  /** Icon component */
  icon: React.ReactNode;
  /** Sections of the accordion */
  sections: IdentitySection[];
  /** Builds collapsed-card summary pills */
  buildSummary: (record: IdentityRecord) => Array<{ label: string; tone?: string }>;
  /** Optional Find-a-pro CTA shown when card is empty */
  findProCta?: { label: string; onClick: () => void };
  /** Mark this card as the primary travel doc, etc. */
  badge?: string;
}

export const expiryTone = (days: number | null) => {
  if (days === null) return undefined;
  if (days < 0) return 'border-red-300 bg-red-50 text-red-700';
  if (days <= 30) return 'border-red-300 bg-red-50 text-red-700';
  if (days <= 60) return 'border-amber-300 bg-amber-50 text-amber-700';
  if (days <= 90) return 'border-yellow-300 bg-yellow-50 text-yellow-700';
  return undefined;
};

export const daysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const isDraft = (id: string) => id.startsWith('draft-');

const SummaryPill: React.FC<{ label: string; tone?: string }> = ({ label, tone }) => (
  <span className={cn('rounded-full border px-2.5 py-1 text-[11px] font-semibold', tone || 'border-stone-200 bg-stone-50 text-stone-600')}>
    {label}
  </span>
);

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">{children}</span>
);

export const IdentityField: React.FC<{
  field: IdentityFieldConfig;
  value: any;
  onChange: (v: any) => void;
  revealed?: boolean;
  onToggleReveal?: () => void;
}> = ({ field, value, onChange, revealed, onToggleReveal }) => {
  const v = value ?? '';
  if (field.type === 'textarea') {
    return (
      <label className="block">
        <FieldLabel>{field.label}</FieldLabel>
        <Textarea rows={field.rows || 3} value={v} placeholder={field.placeholder} onChange={(e) => onChange(e.target.value)} />
      </label>
    );
  }
  if (field.type === 'select' && field.options) {
    return (
      <label className="block">
        <FieldLabel>{field.label}</FieldLabel>
        <select
          value={v}
          onChange={(e) => onChange(e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {field.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </label>
    );
  }
  if (field.type === 'masked') {
    return (
      <label className="block">
        <FieldLabel>{field.label}</FieldLabel>
        <div className="relative">
          <Input
            type={revealed ? 'text' : 'password'}
            value={v}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
            className="pr-10 font-mono tracking-wider"
          />
          <button
            type="button"
            onClick={onToggleReveal}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-navy-muted rounded"
            aria-label={revealed ? 'Hide value' : 'Reveal value'}
          >
            {revealed ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
      </label>
    );
  }
  return (
    <label className="block">
      <FieldLabel>{field.label}</FieldLabel>
      <Input
        type={field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : field.type === 'number' ? 'number' : 'text'}
        value={v}
        placeholder={field.placeholder}
        onChange={(e) => onChange(field.type === 'number' ? (e.target.value === '' ? null : Number(e.target.value)) : e.target.value)}
      />
    </label>
  );
};

export const IdentityDocumentCard: React.FC<IdentityDocumentCardProps> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft,
  title, icon, sections, buildSummary, findProCta, badge,
}) => {
  const confirm = useConfirm();
  const [data, setData] = useState<IdentityRecord>(record);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(isDraft(record.id));
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setData(record);
    setDirty(isDraft(record.id));
  }, [record.id, record.updated_at]);

  const setField = (name: string, value: any) => {
    setData((d) => ({ ...d, details: { ...(d.details || {}), [name]: value } }));
    setDirty(true);
  };

  const setTopLevel = (name: string, value: any) => {
    setData((d) => ({ ...d, [name]: value } as IdentityRecord));
    setDirty(true);
  };

  const toggleReveal = (n: string) => setRevealed((r) => ({ ...r, [n]: !r[n] }));

  const summary = useMemo(() => buildSummary(data), [data, buildSummary]);
  const isEmpty = !data.title && Object.keys(data.details || {}).length === 0;

  const handleSave = async () => {
    setSaving(true);
    try {
      const saved = await identityService.upsert({
        ...data,
        packet_id: packetId,
        scope: data.scope || scope,
      });
      toast.success(`${title} saved`, { position: 'bottom-center' });
      onSaved(saved, isDraft(record.id) ? record.id : undefined);
      setDirty(false);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not save', { position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: 'Are you sure?',
      description: 'This will permanently remove this document record.',
      confirmText: 'Delete',
    });
    if (!ok) return;
    if (isDraft(data.id)) {
      onCancelDraft?.(data.id);
      return;
    }
    setDeleting(true);
    try {
      await identityService.remove(data.id);
      toast.success(`${title} removed`, { position: 'bottom-center' });
      onDeleted(data.id);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || 'Could not delete', { position: 'bottom-center' });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      <button type="button" onClick={onToggle} className="w-full p-4 flex items-start gap-3 text-left active:bg-stone-50">
        <div className="w-10 h-10 rounded-lg bg-manila/60 text-navy-muted flex items-center justify-center shrink-0">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-bold text-navy-muted truncate">{title}</p>
            {badge && <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-navy-muted text-primary-foreground">{badge}</span>}
          </div>
          {summary.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.map((s, i) => <SummaryPill key={i} label={s.label} tone={s.tone} />)}
            </div>
          ) : (
            <p className="text-xs text-stone-400 mt-1">Tap to add details</p>
          )}
        </div>
        <div className="text-stone-400 shrink-0 mt-1">{expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</div>
      </button>

      {expanded && (
        <div className="border-t border-stone-200 p-4 space-y-4">
          {findProCta && isEmpty && (
            <button
              type="button"
              onClick={findProCta.onClick}
              className="w-full text-left rounded-lg border border-dashed border-stone-300 bg-stone-50 p-3 text-xs text-stone-600 hover:border-navy-muted/40"
            >
              {findProCta.label} →
            </button>
          )}

          <Accordion type="multiple" defaultValue={[sections[0]?.id]} className="w-full">
            {sections.map((sec) => (
              <AccordionItem key={sec.id} value={sec.id}>
                <AccordionTrigger className="text-sm font-bold">{sec.label}</AccordionTrigger>
                <AccordionContent>
                  {sec.render
                    ? sec.render({ record: data, setField, topLevel: setTopLevel })
                    : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(sec.fields || []).map((f) => (
                          <IdentityField
                            key={f.name}
                            field={f}
                            value={f.topLevel ? (data as any)[f.name] : data.details?.[f.name]}
                            onChange={(v) => f.topLevel ? setTopLevel(f.name, v) : setField(f.name, v)}
                            revealed={!!revealed[f.name]}
                            onToggleReveal={() => toggleReveal(f.name)}
                          />
                        ))}
                      </div>
                    )}
                </AccordionContent>
              </AccordionItem>
            ))}

            {!isDraft(data.id) && (
              <AccordionItem value="documents">
                <AccordionTrigger className="text-sm font-bold">Document upload</AccordionTrigger>
                <AccordionContent>
                  <div className="flex items-center gap-2 mb-3 text-xs text-stone-500">
                    <FileText size={14} /> Attach scans or photos. Stored privately in your packet.
                  </div>
                  <RecordDocumentUpload
                    sectionKey="identity"
                    packetId={packetId}
                    recordId={data.id}
                    scope={(data.scope as any) || (scope as any)}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting} className="text-red-600 hover:text-red-700">
              {deleting ? <Loader2 className="animate-spin" size={14} /> : <Trash2 size={14} />}
              <span className="ml-1.5">Delete</span>
            </Button>
            <Button onClick={handleSave} disabled={!dirty || saving} size="sm">
              {saving ? <Loader2 className="animate-spin" size={14} /> : <Save size={14} />}
              <span className="ml-1.5">Save</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
