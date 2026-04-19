import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAppContext } from '@/context/AppContext';
import {
  ChevronDown,
  ChevronUp,
  Save,
  Trash2,
  AlertTriangle,
  Scale,
  FileText,
  HeartPulse,
  Shield,
  Users,
  Briefcase,
  X,
} from 'lucide-react';
import {
  legalService,
  yearsSince,
  KIND_LABELS,
  KIND_PRO_QUERY,
  KIND_DB_VALUE,
  type LegalKind,
} from '@/services/legalService';
import { LegalAttorneyPicker } from './LegalAttorneyPicker';
import { LegalPersonPicker } from './LegalPersonPicker';
import { FindProfessionalPrompt } from '@/components/directory/FindProfessionalPrompt';

type Doc = Record<string, any> & { id: string; packet_id?: string | null };

type Props = {
  packetId: string;
  scope: string;
  kind: LegalKind;
  doc: Doc;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: Doc, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
};

const isDraftId = (id?: string | null) => !!id && id.startsWith('draft-');

const TRUST_TYPES = [
  'Revocable Living Trust',
  'Irrevocable Trust',
  'Testamentary Trust',
  'Special Needs Trust',
  'Charitable Trust',
  'Other',
];

const OTHER_SUBTYPES = [
  'Prenuptial Agreement',
  'Postnuptial Agreement',
  'Business Agreement',
  'Property Agreement',
  'Court Order',
  'Other',
];

const LIFE_SUSTAINING_OPTIONS = [
  { value: 'continue', label: 'Continue treatment' },
  { value: 'withhold', label: 'Withhold treatment' },
  { value: 'per_agent', label: 'Per my healthcare agent' },
];

const YES_NO_AGENT = [
  { value: 'yes', label: 'Yes' },
  { value: 'no', label: 'No' },
  { value: 'per_agent', label: 'Per my agent' },
];

const PAIN_MGMT_OPTIONS = [
  { value: 'aggressive', label: 'Aggressive' },
  { value: 'comfort_only', label: 'Comfort only' },
  { value: 'per_agent', label: 'Per my agent' },
];

const ORGAN_DONATION_OPTIONS = [
  { value: 'yes', label: 'Yes — all' },
  { value: 'no', label: 'No' },
  { value: 'specific', label: 'Specific organs only' },
];

const KindIcon: React.FC<{ kind: LegalKind; className?: string }> = ({ kind, className }) => {
  const map: Record<LegalKind, React.ElementType> = {
    will: Scale,
    trust: Shield,
    fin_poa: Briefcase,
    hcpoa: HeartPulse,
    living_will: HeartPulse,
    guardianship: Users,
    other: FileText,
  };
  const Icon = map[kind];
  return <Icon className={className} />;
};

export const LegalDocumentCard: React.FC<Props> = ({
  packetId,
  scope,
  kind,
  doc,
  expanded,
  onToggle,
  onSaved,
  onDeleted,
  onCancelDraft,
}) => {
  const confirm = useConfirm();
  const { bumpCompletion } = useAppContext();
  const [form, setForm] = useState<Doc>(() => ({
    ...doc,
    document_type: doc.document_type || KIND_DB_VALUE[kind],
    details: doc.details || {},
  }));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hintDismissed, setHintDismissed] = useState(false);
  const isDraft = isDraftId(doc.id);
  const showPersonHint = !hintDismissed && (kind === 'fin_poa' || kind === 'hcpoa' || kind === 'guardianship');

  const setField = (name: string, value: any) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const hasLegacy = !!(form.legacy_notes && String(form.legacy_notes).trim());

  const reviewYears = yearsSince(form.last_reviewed_date);
  const reviewStale = reviewYears !== null && reviewYears >= 3;

  const headerSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (kind === 'trust' && form.trust_type) parts.push(form.trust_type);
    if (kind === 'other' && form.other_subtype) parts.push(form.other_subtype);
    if (form.attorney_name) parts.push(form.attorney_name);
    else if (form.agent_name) parts.push(`Agent: ${form.agent_name}`);
    else if (form.executor_name) parts.push(`Executor: ${form.executor_name}`);
    else if (form.guardian_name) parts.push(`Guardian: ${form.guardian_name}`);
    else if (form.trustee_name) parts.push(`Trustee: ${form.trustee_name}`);
    if (form.document_date) parts.push(form.document_date);
    return parts.join(' • ');
  }, [form, kind]);

  // Hide "Use our template" once any meaningful content is filled in
  const hasContent = useMemo(() => {
    const fields = [
      form.attorney_name, form.document_date, form.original_location, form.notes,
      form.executor_name, form.trustee_name, form.agent_name, form.guardian_name,
    ];
    return fields.some((v) => v && String(v).trim());
  }, [form]);

  const titleForKind = useMemo(() => {
    if (kind === 'trust') return form.document_name || (form.trust_type ? form.trust_type : 'Trust');
    if (kind === 'other') return form.document_name || form.other_subtype || 'Other Legal Document';
    return KIND_LABELS[kind];
  }, [kind, form]);

  const handleSave = async () => {
    // Minimal validation per kind
    if (kind === 'trust' && !(form.document_name || '').trim()) {
      toast.error('Trust name is required.', { duration: 3500, position: 'bottom-center' });
      return;
    }
    if (kind === 'other' && !(form.other_subtype || '').trim()) {
      toast.error('Document type is required.', { duration: 3500, position: 'bottom-center' });
      return;
    }
    setSaving(true);
    try {
      const payload: any = {
        ...form,
        packet_id: packetId,
        scope,
        document_type: form.document_type || KIND_DB_VALUE[kind],
      };
      const { data, error } = await legalService.upsert(payload);
      if (error || !data) {
        toast.error(`Save failed: ${error?.message || 'Unknown error'}`, {
          duration: 4000,
          position: 'bottom-center',
        });
        return;
      }
      onSaved(data as Doc, isDraft ? doc.id : undefined);
      bumpCompletion();
      toast.success(isDraft ? 'Document added.' : 'Document saved.', {
        duration: 2500,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDraft) {
      onCancelDraft(doc.id);
      return;
    }
    const ok = await confirm({
      title: `Delete this ${KIND_LABELS[kind].toLowerCase()}?`,
      description: `Delete "${titleForKind}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    setDeleting(true);
    try {
      const { error } = await legalService.remove(doc.id);
      if (error) {
        toast.error(`Delete failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
        return;
      }
      onDeleted(doc.id);
      bumpCompletion();
      toast.success('Document deleted.', { duration: 2500, position: 'bottom-center' });
    } finally {
      setDeleting(false);
    }
  };

  // Sub-renderers per kind
  const renderWillFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Attorney name</Label>
        <LegalAttorneyPicker
          packetId={packetId}
          value={form.attorney_name || ''}
          onChangeText={(v) => setField('attorney_name', v)}
          onPick={(a) =>
            setForm((p) => ({
              ...p,
              attorney_name: a.name,
              attorney_firm: a.firm || p.attorney_firm || '',
              attorney_phone: a.phone || p.attorney_phone || '',
              attorney_email: a.email || p.attorney_email || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Attorney firm</Label>
        <Input value={form.attorney_firm || ''} onChange={(e) => setField('attorney_firm', e.target.value)} />
      </div>
      <div>
        <Label>Attorney phone</Label>
        <Input type="tel" value={form.attorney_phone || ''} onChange={(e) => setField('attorney_phone', e.target.value)} />
      </div>
      <div>
        <Label>Date executed</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} placeholder="Safe deposit box, attorney's office…" />
      </div>
      <div>
        <Label>Executor name</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`exec-${doc.id}`}
          value={form.executor_name || ''}
          onChange={(v) => setField('executor_name', v)}
        />
      </div>
      <div>
        <Label>Alternate executor</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`alt-exec-${doc.id}`}
          value={form.alternate_executor_name || ''}
          onChange={(v) => setField('alternate_executor_name', v)}
        />
      </div>
      <div>
        <Label>Last reviewed date</Label>
        <Input type="date" value={form.last_reviewed_date || ''} onChange={(e) => setField('last_reviewed_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes / key provisions</Label>
        <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );

  const renderTrustFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div className="sm:col-span-2">
        <Label>Trust name <span className="text-red-500">*</span></Label>
        <Input value={form.document_name || ''} onChange={(e) => setField('document_name', e.target.value)} placeholder="e.g. The Smith Family Revocable Trust" />
      </div>
      <div>
        <Label>Trust type</Label>
        <select
          value={form.trust_type || ''}
          onChange={(e) => setField('trust_type', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {TRUST_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <Label>Date established</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div>
        <Label>Trustee name</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`trustee-${doc.id}`}
          value={form.trustee_name || ''}
          onChange={(v) => setField('trustee_name', v)}
        />
      </div>
      <div>
        <Label>Successor trustee</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`succ-trustee-${doc.id}`}
          value={form.successor_trustee_name || ''}
          onChange={(v) => setField('successor_trustee_name', v)}
        />
      </div>
      <div>
        <Label>Attorney name</Label>
        <LegalAttorneyPicker
          packetId={packetId}
          value={form.attorney_name || ''}
          onChangeText={(v) => setField('attorney_name', v)}
          onPick={(a) =>
            setForm((p) => ({
              ...p,
              attorney_name: a.name,
              attorney_firm: a.firm || p.attorney_firm || '',
              attorney_phone: a.phone || p.attorney_phone || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Last reviewed date</Label>
        <Input type="date" value={form.last_reviewed_date || ''} onChange={(e) => setField('last_reviewed_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Assets held in trust</Label>
        <Textarea rows={2} value={form.assets_in_trust || ''} onChange={(e) => setField('assets_in_trust', e.target.value)} placeholder="Brief description (e.g. primary residence, brokerage account…)" />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );

  const renderPoaFields = (isHc: boolean) => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Agent name</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`agent-${doc.id}`}
          value={form.agent_name || ''}
          onChange={(v, m) =>
            setForm((p) => ({
              ...p,
              agent_name: v,
              agent_phone: m?.phone || p.agent_phone || '',
              agent_email: m?.email || p.agent_email || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Alternate agent</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`alt-agent-${doc.id}`}
          value={form.alternate_agent_name || ''}
          onChange={(v) => setField('alternate_agent_name', v)}
        />
      </div>
      <div>
        <Label>Agent phone</Label>
        <Input type="tel" value={form.agent_phone || ''} onChange={(e) => setField('agent_phone', e.target.value)} />
      </div>
      <div>
        <Label>Agent email</Label>
        <Input type="email" value={form.agent_email || ''} onChange={(e) => setField('agent_email', e.target.value)} />
      </div>
      <div>
        <Label>Attorney who drafted it</Label>
        <LegalAttorneyPicker
          packetId={packetId}
          value={form.attorney_name || ''}
          onChangeText={(v) => setField('attorney_name', v)}
          onPick={(a) =>
            setForm((p) => ({
              ...p,
              attorney_name: a.name,
              attorney_firm: a.firm || p.attorney_firm || '',
              attorney_phone: a.phone || p.attorney_phone || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Effective</Label>
        <select
          value={form.effective_when || ''}
          onChange={(e) => setField('effective_when', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          <option value="immediately">Immediately</option>
          <option value="upon_incapacity">Upon incapacity</option>
        </select>
      </div>
      {!isHc && (
        <div className="flex items-center gap-3 pt-6">
          <Switch
            checked={!!form.is_durable}
            onCheckedChange={(v) => setField('is_durable', v)}
          />
          <Label className="!mt-0">Durable POA</Label>
        </div>
      )}
      <div>
        <Label>Date executed</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div>
        <Label>Last reviewed date</Label>
        <Input type="date" value={form.last_reviewed_date || ''} onChange={(e) => setField('last_reviewed_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );

  const renderLivingWillFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Date executed</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div>
        <Label>Last reviewed date</Label>
        <Input type="date" value={form.last_reviewed_date || ''} onChange={(e) => setField('last_reviewed_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} />
      </div>
      <div>
        <Label>Life-sustaining treatment</Label>
        <select
          value={form.life_sustaining_preference || ''}
          onChange={(e) => setField('life_sustaining_preference', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {LIFE_SUSTAINING_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <Label>Artificial nutrition</Label>
        <select
          value={form.artificial_nutrition_preference || ''}
          onChange={(e) => setField('artificial_nutrition_preference', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {YES_NO_AGENT.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <Label>Pain management</Label>
        <select
          value={form.pain_management_preference || ''}
          onChange={(e) => setField('pain_management_preference', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {PAIN_MGMT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div>
        <Label>Organ donation</Label>
        <select
          value={form.organ_donation_preference || ''}
          onChange={(e) => setField('organ_donation_preference', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {ORGAN_DONATION_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </div>
      <div className="sm:col-span-2">
        <Label>Specific wishes / notes</Label>
        <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
      <div className="sm:col-span-2 rounded-lg bg-blue-50 border border-blue-200 p-3 text-xs text-blue-900">
        <strong>Linked:</strong> these wishes also appear in the Medical section's Emergency Medical Info card.
      </div>
    </div>
  );

  const renderGuardianshipFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Guardian name</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`guardian-${doc.id}`}
          value={form.guardian_name || ''}
          onChange={(v, m) =>
            setForm((p) => ({
              ...p,
              guardian_name: v,
              guardian_phone: m?.phone || p.guardian_phone || '',
              guardian_email: m?.email || p.guardian_email || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Alternate guardian</Label>
        <LegalPersonPicker
          packetId={packetId}
          listId={`alt-guardian-${doc.id}`}
          value={form.alternate_guardian_name || ''}
          onChange={(v) => setField('alternate_guardian_name', v)}
        />
      </div>
      <div>
        <Label>Guardian phone</Label>
        <Input type="tel" value={form.guardian_phone || ''} onChange={(e) => setField('guardian_phone', e.target.value)} />
      </div>
      <div>
        <Label>Guardian email</Label>
        <Input type="email" value={form.guardian_email || ''} onChange={(e) => setField('guardian_email', e.target.value)} />
      </div>
      <div>
        <Label>Date executed</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div>
        <Label>Attorney name</Label>
        <LegalAttorneyPicker
          packetId={packetId}
          value={form.attorney_name || ''}
          onChangeText={(v) => setField('attorney_name', v)}
          onPick={(a) =>
            setForm((p) => ({
              ...p,
              attorney_name: a.name,
              attorney_firm: a.firm || p.attorney_firm || '',
              attorney_phone: a.phone || p.attorney_phone || '',
            }))
          }
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Reasoning for guardian selection</Label>
        <Textarea rows={3} value={form.guardian_reasoning || ''} onChange={(e) => setField('guardian_reasoning', e.target.value)} placeholder="Why this person? Values, relationship, capacity…" />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea rows={2} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );

  const renderOtherFields = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Document type <span className="text-red-500">*</span></Label>
        <select
          value={form.other_subtype || ''}
          onChange={(e) => setField('other_subtype', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {OTHER_SUBTYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </select>
      </div>
      <div>
        <Label>Date executed</Label>
        <Input type="date" value={form.document_date || ''} onChange={(e) => setField('document_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Description</Label>
        <Input value={form.document_name || ''} onChange={(e) => setField('document_name', e.target.value)} placeholder="Short title for this document" />
      </div>
      <div className="sm:col-span-2">
        <Label>Parties involved</Label>
        <Input value={form.parties_involved || ''} onChange={(e) => setField('parties_involved', e.target.value)} />
      </div>
      <div>
        <Label>Attorney name</Label>
        <LegalAttorneyPicker
          packetId={packetId}
          value={form.attorney_name || ''}
          onChangeText={(v) => setField('attorney_name', v)}
          onPick={(a) =>
            setForm((p) => ({
              ...p,
              attorney_name: a.name,
              attorney_firm: a.firm || p.attorney_firm || '',
              attorney_phone: a.phone || p.attorney_phone || '',
            }))
          }
        />
      </div>
      <div>
        <Label>Last reviewed date</Label>
        <Input type="date" value={form.last_reviewed_date || ''} onChange={(e) => setField('last_reviewed_date', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Where is the original kept?</Label>
        <Input value={form.original_location || ''} onChange={(e) => setField('original_location', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Notes</Label>
        <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
      </div>
    </div>
  );

  const renderFieldsForKind = () => {
    switch (kind) {
      case 'will': return renderWillFields();
      case 'trust': return renderTrustFields();
      case 'fin_poa': return renderPoaFields(false);
      case 'hcpoa': return renderPoaFields(true);
      case 'living_will': return renderLivingWillFields();
      case 'guardianship': return renderGuardianshipFields();
      case 'other': return renderOtherFields();
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white shadow-sm overflow-hidden">
      {/* Header */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start gap-3 p-4 text-left hover:bg-stone-50 transition-colors"
      >
        <div className="rounded-xl bg-navy-muted/10 p-3 shrink-0">
          <KindIcon kind={kind} className="h-5 w-5 text-navy-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-semibold text-stone-900 truncate">
              {titleForKind}
            </h3>
          </div>
          {headerSubtitle && (
            <p className="text-xs text-stone-500 mt-0.5 truncate">{headerSubtitle}</p>
          )}
          {reviewStale && (
            <p className="mt-1.5 inline-flex items-center gap-1 text-xs font-medium text-red-600">
              <AlertTriangle className="h-3.5 w-3.5" />
              Not reviewed in {Math.floor(reviewYears!)} years
            </p>
          )}
        </div>
        <div className="shrink-0 text-stone-400">
          {expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-5 bg-stone-50/40">
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">
              {KIND_LABELS[kind]} details
            </h4>
            {renderFieldsForKind()}
          </div>

          {/* Document upload (placeholder — wires through existing upload flow) */}
          <div className="rounded-lg bg-white border border-stone-200 p-3">
            <p className="text-xs text-stone-500">
              Use the section's "Add Document" button (top of page) to attach a scanned copy of this document.
            </p>
          </div>

          {/* Advanced / legacy notes accordion */}
          {hasLegacy && (
            <Accordion type="single" collapsible>
              <AccordionItem value="advanced" className="border rounded-lg bg-white px-3">
                <AccordionTrigger className="text-sm font-medium">
                  Advanced / legacy notes
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={5}
                    value={form.legacy_notes || ''}
                    onChange={(e) => setField('legacy_notes', e.target.value)}
                    className="font-mono text-xs"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Find a Pro */}
          <FindProfessionalPrompt
            variant="inline"
            message="Have this reviewed by a qualified attorney"
            query={KIND_PRO_QUERY[kind]}
          />

          {/* Use our template — only when no content yet */}
          {!hasContent && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900">
              Need a starting point?{' '}
              <button
                type="button"
                className="underline font-medium"
                onClick={() => {
                  window.dispatchEvent(new CustomEvent('navigate-templates', { detail: { kind } }));
                }}
              >
                Use our template
              </button>
            </div>
          )}

          {/* Footer actions */}
          <div className="flex items-center justify-between pt-2">
            <Button variant="ghost" size="sm" onClick={handleDelete} disabled={deleting}>
              <Trash2 className="h-4 w-4 text-red-600" />
              <span className="text-red-600">{isDraft ? 'Cancel' : 'Delete'}</span>
            </Button>
            <Button onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" />
              {saving ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
