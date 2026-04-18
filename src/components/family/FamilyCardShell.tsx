import React, { useEffect, useRef, useState } from 'react';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import {
  Trash2, Save, Loader2, ChevronDown, ChevronUp, Camera, Eye, EyeOff,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { uploadService } from '@/services/uploadService';
import { useAppContext } from '@/context/AppContext';
import { familyService, sanitizeFamilyPayload, isMinorFromBirthday } from '@/services/familyService';
import { LifeStatusToggle } from '@/components/common/LifeStatusToggle';
import { DeathCertificateUpload } from '@/components/common/DeathCertificateUpload';
import { RecordDocumentUpload } from '@/components/common/RecordDocumentUpload';
import { PersonAvatar } from '@/components/common/PersonAvatar';

const isDraft = (id?: string) => !!id && String(id).startsWith('draft-');

const FieldLabel: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">
    {children}
  </span>
);

const SummaryPill: React.FC<{ label: string; tone?: string }> = ({ label, tone }) => (
  <span className={cn(
    'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
    tone || 'border-stone-200 bg-stone-50 text-stone-600',
  )}>
    {label}
  </span>
);

export type FamilyFieldType = 'text' | 'textarea' | 'date' | 'tel' | 'email' | 'select' | 'masked' | 'boolean';

export interface FamilyField {
  name: string;
  label: string;
  type?: FamilyFieldType;
  options?: string[];
  placeholder?: string;
  rows?: number;
  showIf?: (form: any) => boolean;
}

interface FieldRendererProps {
  field: FamilyField;
  value: any;
  onChange: (v: any) => void;
  revealed?: boolean;
  onToggleReveal?: () => void;
}

export const FamilyField: React.FC<FieldRendererProps> = ({
  field, value, onChange, revealed, onToggleReveal,
}) => {
  const v = value ?? '';
  if (field.type === 'textarea') {
    return (
      <label className="block sm:col-span-2">
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
  if (field.type === 'boolean') {
    return (
      <label className="block">
        <FieldLabel>{field.label}</FieldLabel>
        <select
          value={value === true ? 'yes' : value === false ? 'no' : ''}
          onChange={(e) => onChange(e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Not set</option>
          <option value="yes">Yes</option>
          <option value="no">No</option>
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
            autoComplete="off"
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
        type={field.type === 'date' ? 'date' : field.type === 'tel' ? 'tel' : field.type === 'email' ? 'email' : 'text'}
        value={v}
        placeholder={field.placeholder}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
};

export interface FamilySection {
  id: string;
  label: string;
  fields?: FamilyField[];
  render?: (ctx: { form: any; setField: (k: string, v: any) => void }) => React.ReactNode;
}

export interface FamilyCardShellProps {
  record: any;
  packetId: string;
  expanded: boolean;
  onToggle: () => void;
  relationshipBadge: string;
  extraSections?: FamilySection[];
  documentSlots?: Array<{
    category: string;
    label: string;
    description?: string;
    showIf?: (form: any) => boolean;
  }>;
  showSSN?: boolean;
  onSaved: (saved: any, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft?: (id: string) => void;
  buildSummary?: (form: any) => Array<{ label: string; tone?: string }>;
}

export const FamilyCardShell: React.FC<FamilyCardShellProps> = ({
  record, packetId, expanded, onToggle,
  relationshipBadge, extraSections = [], documentSlots = [], showSSN = true,
  onSaved, onDeleted, onCancelDraft, buildSummary,
}) => {
  const confirm = useConfirm();
  const { profile } = useAppContext();
  const [form, setForm] = useState<any>(record);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [dirty, setDirty] = useState(isDraft(record.id));
  const [revealSsn, setRevealSsn] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setForm(record);
    setDirty(isDraft(record.id));
    setPhotoFile(null);
    setPhotoPreview(null);
  }, [record.id, record.updated_at]);

  const setField = (name: string, value: any) => {
    setForm((f: any) => ({ ...f, [name]: value }));
    setDirty(true);
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { duration: 4000, position: 'bottom-center' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB', { duration: 4000, position: 'bottom-center' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setDirty(true);
  };

  const onSameAddress = (checked: boolean) => {
    if (checked) {
      const ownerAddress = (profile as any)?.address || '';
      if (ownerAddress) setField('address', ownerAddress);
      else toast.message('No saved address on your profile yet', { duration: 3000, position: 'bottom-center' });
    }
  };

  const handleSave = async () => {
    if (!form.first_name?.trim() && !form.last_name?.trim() && !form.name?.trim()) {
      toast.error('First or last name is required.', { duration: 4000, position: 'bottom-center' });
      return;
    }
    setSaving(true);
    try {
      const wasNewRecord = isDraft(record.id);
      let photo_path = form.photo_path || null;
      if (photoFile) {
        const safe = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${packetId}/family/${form.relationship || 'member'}/${Date.now()}_${safe}`;
        const { error: upErr } = await uploadService.uploadFile('packet-documents', path, photoFile);
        if (upErr) throw new Error(upErr.message || 'Photo upload failed');
        photo_path = path;
      }
      const { id, ...rest } = form;
      const payload = sanitizeFamilyPayload({
        ...rest,
        ...(wasNewRecord ? {} : { id }),
        packet_id: packetId,
        photo_path,
        status: 'completed',
      });
      const { data: saved, error } = await familyService.upsert(payload);
      if (error) throw error;
      toast.success('Saved successfully ✓', { duration: 2500, position: 'bottom-center' });
      onSaved(saved, wasNewRecord ? record.id : undefined);
      setDirty(false);
      setPhotoFile(null);
      setPhotoPreview(null);
      if (wasNewRecord && expanded) onToggle();
    } catch (err: any) {
      console.error('Family member save failed', err);
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const ok = await confirm({
      title: `Delete ${form.first_name || form.name || 'this record'}?`,
      description: "This action cannot be undone. The record and any attached documents will be removed.",
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    if (isDraft(form.id)) {
      onCancelDraft?.(form.id);
      return;
    }
    setDeleting(true);
    try {
      const { error } = await familyService.remove(form.id);
      if (error) throw error;
      toast.success('Family member deleted', { duration: 3000, position: 'bottom-center' });
      onDeleted(form.id);
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setDeleting(false);
    }
  };

  const summary = buildSummary?.(form) || [];
  const displayName = [form.first_name, form.last_name].filter(Boolean).join(' ') || form.name || 'Untitled';
  const isDeceased = !!form.is_deceased;
  const birthdayBadge = (() => {
    if (!form.birthday || isDeceased) return null;
    const dob = new Date(form.birthday);
    const today = new Date();
    const next = new Date(today.getFullYear(), dob.getMonth(), dob.getDate());
    if (next < today) next.setFullYear(today.getFullYear() + 1);
    const days = Math.ceil((next.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (days <= 7 && days >= 0) return days === 0 ? '🎂 Today' : `🎂 ${days}d`;
    return null;
  })();

  return (
    <div className={cn(
      'rounded-2xl border bg-white shadow-sm overflow-hidden',
      isDeceased ? 'border-stone-300 opacity-90' : 'border-stone-200',
    )}>
      <button
        type="button"
        onClick={onToggle}
        className="w-full p-4 flex items-start gap-3 text-left active:bg-stone-50"
      >
        <PersonAvatar
          photoPath={form.photo_path}
          name={displayName}
          isDeceased={isDeceased}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={cn(
              'text-sm font-bold truncate',
              isDeceased ? 'text-stone-500' : 'text-navy-muted',
            )}>
              {displayName}
              {isDeceased && <span className="ml-1.5 text-stone-400">†</span>}
            </p>
            <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-manila text-navy-muted border border-folder-edge">
              {relationshipBadge}
            </span>
            {birthdayBadge && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                {birthdayBadge}
              </span>
            )}
          </div>
          {summary.length > 0 ? (
            <div className="mt-2 flex flex-wrap gap-1.5">
              {summary.map((s, i) => <SummaryPill key={i} label={s.label} tone={s.tone} />)}
            </div>
          ) : (
            <p className="text-xs text-stone-400 mt-1">
              {form.phone || form.email || 'Tap to add details'}
            </p>
          )}
        </div>
        <div className="text-stone-400 shrink-0 mt-1">
          {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-200 p-4 space-y-4">
          <div className="flex flex-col items-center gap-2">
            <div className="relative">
              <div className={cn(
                'w-24 h-24 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center border-2 border-stone-200',
                isDeceased ? 'grayscale' : '',
              )}>
                {photoPreview ? (
                  <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                ) : (
                  <PersonAvatar
                    photoPath={form.photo_path}
                    name={displayName}
                    isDeceased={isDeceased}
                    size={92}
                    ring={false}
                  />
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-navy-muted text-white flex items-center justify-center shadow-md active:scale-95"
                aria-label="Upload photo"
              >
                <Camera size={16} />
              </button>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
            </div>
            <p className="text-[10px] text-stone-500">Tap camera to add a photo</p>
          </div>

          <Accordion type="multiple" defaultValue={['identity']} className="w-full">
            <AccordionItem value="identity">
              <AccordionTrigger className="text-sm font-bold">Identity</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FamilyField field={{ name: 'first_name', label: 'First name *', placeholder: 'Jane' }} value={form.first_name} onChange={(v) => setField('first_name', v)} />
                  <FamilyField field={{ name: 'middle_name', label: 'Middle name' }} value={form.middle_name} onChange={(v) => setField('middle_name', v)} />
                  <FamilyField field={{ name: 'last_name', label: 'Last name *', placeholder: 'Doe' }} value={form.last_name} onChange={(v) => setField('last_name', v)} />
                  <FamilyField field={{ name: 'suffix', label: 'Suffix', placeholder: 'Jr., Sr., III' }} value={form.suffix} onChange={(v) => setField('suffix', v)} />
                  <FamilyField field={{ name: 'preferred_name', label: 'Preferred name / nickname' }} value={form.preferred_name} onChange={(v) => setField('preferred_name', v)} />
                  <label className="block">
                    <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">Gender</span>
                    <GenderSelect value={form.gender ?? ''} onChange={(v) => setField('gender', v)} />
                  </label>
                  <FamilyField field={{ name: 'birthday', label: 'Date of birth', type: 'date' }} value={form.birthday} onChange={(v) => setField('birthday', v)} />
                  <FamilyField field={{ name: 'place_of_birth', label: 'Place of birth', placeholder: 'City, State' }} value={form.place_of_birth} onChange={(v) => setField('place_of_birth', v)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact">
              <AccordionTrigger className="text-sm font-bold">Contact &amp; Address</AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <FamilyField field={{ name: 'phone', label: 'Primary phone', type: 'tel' }} value={form.phone} onChange={(v) => setField('phone', v)} />
                  <FamilyField field={{ name: 'email', label: 'Primary email', type: 'email' }} value={form.email} onChange={(v) => setField('email', v)} />
                  <FamilyField field={{ name: 'address', label: 'Current address', type: 'textarea', rows: 2 }} value={form.address} onChange={(v) => setField('address', v)} />
                </div>
                <label className="mt-3 flex items-center gap-2 text-xs text-stone-600">
                  <input
                    type="checkbox"
                    onChange={(e) => onSameAddress(e.target.checked)}
                    className="rounded border-stone-300"
                  />
                  Same address as me
                </label>
              </AccordionContent>
            </AccordionItem>

            {extraSections.map((sec) => (
              <AccordionItem key={sec.id} value={sec.id}>
                <AccordionTrigger className="text-sm font-bold">{sec.label}</AccordionTrigger>
                <AccordionContent>
                  {sec.render
                    ? sec.render({ form, setField })
                    : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {(sec.fields || [])
                          .filter((f) => !f.showIf || f.showIf(form))
                          .map((f) => (
                            <FamilyField
                              key={f.name}
                              field={f}
                              value={form[f.name]}
                              onChange={(v) => setField(f.name, v)}
                            />
                          ))}
                      </div>
                    )}
                </AccordionContent>
              </AccordionItem>
            ))}

            {showSSN && (
              <AccordionItem value="sensitive">
                <AccordionTrigger className="text-sm font-bold">Sensitive Info</AccordionTrigger>
                <AccordionContent>
                  <FamilyField
                    field={{ name: 'ssn_encrypted', label: 'Social Security Number', type: 'masked', placeholder: '•••-••-••••' }}
                    value={form.ssn_encrypted}
                    onChange={(v) => setField('ssn_encrypted', v)}
                    revealed={revealSsn}
                    onToggleReveal={() => setRevealSsn((r) => !r)}
                  />
                  <p className="mt-2 text-[10px] text-stone-400">
                    Stored privately in your packet. Visible only to you and trusted contacts you authorize.
                  </p>
                </AccordionContent>
              </AccordionItem>
            )}

            <AccordionItem value="lifecycle">
              <AccordionTrigger className="text-sm font-bold">Life Status</AccordionTrigger>
              <AccordionContent>
                <LifeStatusToggle
                  value={!!form.is_deceased}
                  onChange={(d) => setField('is_deceased', d)}
                />
                {form.is_deceased && (
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <FamilyField field={{ name: 'date_of_death', label: 'Date of death', type: 'date' }} value={form.date_of_death} onChange={(v) => setField('date_of_death', v)} />
                    <FamilyField field={{ name: 'place_of_death', label: 'Place of death' }} value={form.place_of_death} onChange={(v) => setField('place_of_death', v)} />
                    <FamilyField field={{ name: 'cause_of_death', label: 'Cause of death (optional, private)', type: 'textarea', rows: 2 }} value={form.cause_of_death} onChange={(v) => setField('cause_of_death', v)} />
                  </div>
                )}
                {form.is_deceased && !isDraft(form.id) && (
                  <div className="mt-3">
                    <DeathCertificateUpload
                      packetId={packetId}
                      relatedTable="family_members"
                      relatedRecordId={form.id}
                    />
                  </div>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="notes">
              <AccordionTrigger className="text-sm font-bold">Notes</AccordionTrigger>
              <AccordionContent>
                <Textarea
                  rows={4}
                  value={form.reminder_notes || ''}
                  onChange={(e) => setField('reminder_notes', e.target.value)}
                  placeholder="Anything else worth remembering about this person…"
                />
              </AccordionContent>
            </AccordionItem>

            {!isDraft(form.id) && documentSlots.length > 0 && (
              <AccordionItem value="documents">
                <AccordionTrigger className="text-sm font-bold">Documents</AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-3">
                    {documentSlots
                      .filter((slot) => !slot.showIf || slot.showIf(form))
                      .map((slot) => (
                        <RecordDocumentUpload
                          key={slot.category}
                          packetId={packetId}
                          relatedTable="family_members"
                          relatedRecordId={form.id}
                          category={slot.category}
                          label={slot.label}
                          description={slot.description}
                          isPrivate
                        />
                      ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            )}

            {form.legacy_notes && (
              <AccordionItem value="legacy">
                <AccordionTrigger className="text-sm font-bold text-amber-700">Legacy notes (preserved)</AccordionTrigger>
                <AccordionContent>
                  <p className="text-xs text-stone-500 mb-2">
                    Imported from your previous record. Edit freely or move pieces into the structured fields above.
                  </p>
                  <Textarea
                    rows={4}
                    value={form.legacy_notes || ''}
                    onChange={(e) => setField('legacy_notes', e.target.value)}
                  />
                </AccordionContent>
              </AccordionItem>
            )}
          </Accordion>

          <div className="flex items-center justify-between pt-3 border-t border-stone-100">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
              className="text-red-600 hover:text-red-700"
            >
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
