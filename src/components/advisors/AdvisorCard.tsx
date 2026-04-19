import React, { useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import {
  ChevronDown, ChevronUp, Save, Trash2, ExternalLink, Phone, Mail, Globe, MapPin,
  Scale, Calculator, TrendingUp, Shield, Home as HomeIcon, Stethoscope, UserPlus,
} from 'lucide-react';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAppContext } from '@/context/AppContext';
import {
  advisorService,
  KIND_LABELS,
  KIND_PRO_QUERY,
  KIND_DB_VALUE,
  effectiveStatus,
  type AdvisorKind,
} from '@/services/advisorService';
import { ProfilePhotoUploader } from '@/components/common/ProfilePhotoUploader';
import { PersonAvatar } from '@/components/common/PersonAvatar';
import { DeathCertificateUpload } from '@/components/common/DeathCertificateUpload';
import { FindProfessionalPrompt } from '@/components/directory/FindProfessionalPrompt';
import { uploadService } from '@/services/uploadService';

type Row = Record<string, any> & { id: string };

type Props = {
  packetId: string;
  scope: string;
  kind: AdvisorKind;
  row: Row;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: Row, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
  onOpenMedical?: () => void;
};

const isDraftId = (id?: string | null) => !!id && id.startsWith('draft-');

const ATTORNEY_SPECIALTIES = ['Estate Planning', 'Elder Law', 'Family Law', 'Tax', 'Business', 'Real Estate', 'Criminal', 'Immigration', 'Other'];
const ATTORNEY_AREAS = ['Will', 'Trust', 'POA', 'Real Estate', 'Business', 'Other'];
const CPA_LICENSE_TYPES = ['CPA', 'EA', 'Bookkeeper', 'Other'];
const CPA_SOFTWARE = ['QuickBooks', 'TurboTax', 'Xero', 'FreshBooks', 'Other'];
const FA_LICENSE_TYPES = ['CFP', 'RIA', 'Broker-Dealer', 'Insurance Only', 'Other'];
const FA_FEE_STRUCTURES = ['Fee-only', 'Commission', 'Hybrid'];
const INSURANCE_LINES = ['Life', 'Health', 'Auto', 'Home', 'Umbrella', 'Long-term care', 'Disability', 'Other'];
const REALTOR_SPECIALTIES = ['Residential', 'Commercial', 'Property Management', 'Land', 'Other'];
const STATUS_OPTIONS = [
  { value: 'active', label: 'Active' },
  { value: 'retired', label: 'Retired' },
  { value: 'former', label: 'No longer my advisor' },
];

const KindIcon: React.FC<{ kind: AdvisorKind; className?: string }> = ({ kind, className }) => {
  const map: Record<AdvisorKind, React.ElementType> = {
    attorney: Scale, cpa: Calculator, financial: TrendingUp, insurance: Shield,
    realtor: HomeIcon, doctor: Stethoscope, other: UserPlus,
  };
  const Icon = map[kind];
  return <Icon className={className} />;
};

const toggleArrayValue = (arr: string[] | null | undefined, value: string): string[] => {
  const cur = Array.isArray(arr) ? arr : [];
  return cur.includes(value) ? cur.filter((x) => x !== value) : [...cur, value];
};

export const AdvisorCard: React.FC<Props> = ({
  packetId, scope, kind, row, expanded, onToggle, onSaved, onDeleted, onCancelDraft, onOpenMedical,
}) => {
  const confirm = useConfirm();
  const { bumpCompletion } = useAppContext();
  const [form, setForm] = useState<Row>(() => ({
    ...row,
    advisor_type: row.advisor_type || KIND_DB_VALUE[kind],
    details: row.details || {},
  }));
  const [saving, setSaving] = useState(false);
  const [pendingPhoto, setPendingPhoto] = useState<File | null>(null);
  const isDraft = isDraftId(row.id);

  const setField = (name: string, value: any) =>
    setForm((prev) => ({ ...prev, [name]: value }));

  const hasLegacy = !!(form.legacy_notes && String(form.legacy_notes).trim());
  const status = effectiveStatus(form);
  const isDeceased = !!form.is_deceased || status === 'deceased';

  const cardSubtitle = useMemo(() => {
    const parts: string[] = [];
    if (form.firm) parts.push(form.firm);
    if (form.phone) parts.push(form.phone);
    return parts.join(' • ');
  }, [form]);

  const headerName = useMemo(() => {
    const composed = `${form.first_name || ''} ${form.last_name || ''}`.trim();
    return composed || form.name || 'Unnamed advisor';
  }, [form]);

  const handleSave = async () => {
    if (!(form.first_name || '').trim() || !(form.last_name || '').trim()) {
      toast.error('First name and last name are required.', {
        duration: 3500, position: 'bottom-center',
      });
      return;
    }
    setSaving(true);
    try {
      let photoPath = form.photo_path;
      // Upload photo if newly picked
      if (pendingPhoto) {
        const safe = pendingPhoto.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${packetId}/advisors/${Date.now()}_${safe}`;
        const { error: upErr } = await uploadService.uploadFile('packet-documents', path, pendingPhoto);
        if (upErr) {
          toast.error(`Photo upload failed: ${upErr.message || 'Unknown error'}`, {
            duration: 4000, position: 'bottom-center',
          });
          setSaving(false);
          return;
        }
        photoPath = path;
      }

      const payload: any = {
        ...form,
        photo_path: photoPath,
        packet_id: packetId,
        scope,
        advisor_type: form.advisor_type || KIND_DB_VALUE[kind],
      };
      const { data, error } = await advisorService.upsert(payload);
      if (error || !data) {
        toast.error(`Save failed: ${error?.message || 'Unknown error'}`, {
          duration: 4000, position: 'bottom-center',
        });
        return;
      }
      onSaved(data as Row, isDraft ? row.id : undefined);
      setPendingPhoto(null);
      bumpCompletion();
      toast.success(isDraft ? 'Advisor added.' : 'Advisor saved.', {
        duration: 2500, position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDraft) {
      onCancelDraft(row.id);
      return;
    }
    const ok = await confirm({
      title: `Delete this advisor?`,
      description: `Delete "${headerName}"? This cannot be undone.`,
      confirmLabel: 'Delete',
      variant: 'danger',
    });
    if (!ok) return;
    const { error } = await advisorService.remove(row.id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    onDeleted(row.id);
    bumpCompletion();
    toast.success('Advisor deleted.', { duration: 2500, position: 'bottom-center' });
  };

  // ============= Per-kind extra fields =============

  const renderAttorneyExtras = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>Specialty</Label>
        <select
          value={form.specialty || ''}
          onChange={(e) => setField('specialty', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {ATTORNEY_SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <Label>Bar / license number</Label>
        <Input value={form.license_number || ''} onChange={(e) => setField('license_number', e.target.value)} />
      </div>
      <div>
        <Label>State(s) licensed</Label>
        <Input
          value={(form.license_states || []).join(', ')}
          onChange={(e) => setField('license_states', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
          placeholder="e.g. CA, NY"
        />
      </div>
      <div>
        <Label>Client / matter reference</Label>
        <Input value={form.client_reference || ''} onChange={(e) => setField('client_reference', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Areas they handle for you</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {ATTORNEY_AREAS.map((a) => {
            const active = (form.areas_handled || []).includes(a);
            return (
              <button
                key={a}
                type="button"
                onClick={() => setField('areas_handled', toggleArrayValue(form.areas_handled, a))}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-navy-muted text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }
              >
                {a}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const renderCpaExtras = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>License type</Label>
        <select
          value={form.license_type || ''}
          onChange={(e) => setField('license_type', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {CPA_LICENSE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <Label>License number</Label>
        <Input value={form.license_number || ''} onChange={(e) => setField('license_number', e.target.value)} />
      </div>
      <div>
        <Label>State licensed</Label>
        <Input
          value={(form.license_states || []).join(', ')}
          onChange={(e) => setField('license_states', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
          placeholder="e.g. CA"
        />
      </div>
      <div>
        <Label>Client ID / account number</Label>
        <Input value={form.client_reference || ''} onChange={(e) => setField('client_reference', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Software they use</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {CPA_SOFTWARE.map((s) => {
            const active = (form.software_used || []).includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setField('software_used', toggleArrayValue(form.software_used, s))}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-navy-muted text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <div className="sm:col-span-2 flex items-center gap-3">
        <Switch checked={!!form.tax_reminders} onCheckedChange={(v) => setField('tax_reminders', v)} />
        <Label className="!mt-0">Tax filing deadline reminders</Label>
      </div>
    </div>
  );

  const renderFinancialExtras = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>License type</Label>
        <select
          value={form.license_type || ''}
          onChange={(e) => setField('license_type', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {FA_LICENSE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <div>
        <Label>License / CRD number</Label>
        <Input value={form.license_number || ''} onChange={(e) => setField('license_number', e.target.value)} />
      </div>
      <div>
        <Label>Firm regulatory status</Label>
        <Input
          value={form.firm_regulatory_status || ''}
          onChange={(e) => setField('firm_regulatory_status', e.target.value)}
          placeholder="e.g. SEC-registered"
        />
      </div>
      <div>
        <Label>Client / account number</Label>
        <Input value={form.client_reference || ''} onChange={(e) => setField('client_reference', e.target.value)} />
      </div>
      <div>
        <Label>AUM estimate ($)</Label>
        <Input
          type="number"
          value={form.aum_estimate ?? ''}
          onChange={(e) => setField('aum_estimate', e.target.value)}
        />
      </div>
      <div>
        <Label>Fee structure</Label>
        <select
          value={form.fee_structure || ''}
          onChange={(e) => setField('fee_structure', e.target.value)}
          className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Select…</option>
          {FA_FEE_STRUCTURES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      <p className="sm:col-span-2 text-[11px] text-stone-500 italic">
        Accounts they manage are linked from the Investments and Retirement sections.
      </p>
    </div>
  );

  const renderInsuranceExtras = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>License type</Label>
        <Input value={form.license_type || ''} onChange={(e) => setField('license_type', e.target.value)} placeholder="e.g. P&C, Life" />
      </div>
      <div>
        <Label>License number</Label>
        <Input value={form.license_number || ''} onChange={(e) => setField('license_number', e.target.value)} />
      </div>
      <div>
        <Label>State licensed</Label>
        <Input
          value={(form.license_states || []).join(', ')}
          onChange={(e) => setField('license_states', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
        />
      </div>
      <div>
        <Label>Agency name</Label>
        <Input value={form.agency_name || ''} onChange={(e) => setField('agency_name', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Lines of insurance</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {INSURANCE_LINES.map((s) => {
            const active = (form.insurance_lines || []).includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setField('insurance_lines', toggleArrayValue(form.insurance_lines, s))}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-navy-muted text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <p className="sm:col-span-2 text-[11px] text-stone-500 italic">
        Policies they manage are linked from Medical, Vehicles, and Real Estate sections.
      </p>
    </div>
  );

  const renderRealtorExtras = () => (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      <div>
        <Label>License number</Label>
        <Input value={form.license_number || ''} onChange={(e) => setField('license_number', e.target.value)} />
      </div>
      <div>
        <Label>State licensed</Label>
        <Input
          value={(form.license_states || []).join(', ')}
          onChange={(e) => setField('license_states', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))}
        />
      </div>
      <div className="sm:col-span-2">
        <Label>Agency / brokerage</Label>
        <Input value={form.agency_name || ''} onChange={(e) => setField('agency_name', e.target.value)} />
      </div>
      <div className="sm:col-span-2">
        <Label>Specialties</Label>
        <div className="flex flex-wrap gap-2 mt-1">
          {REALTOR_SPECIALTIES.map((s) => {
            const active = (form.realtor_specialties || []).includes(s);
            return (
              <button
                key={s}
                type="button"
                onClick={() => setField('realtor_specialties', toggleArrayValue(form.realtor_specialties, s))}
                className={
                  active
                    ? 'px-3 py-1.5 rounded-full text-xs font-medium bg-navy-muted text-white'
                    : 'px-3 py-1.5 rounded-full text-xs font-medium bg-white border border-stone-300 text-stone-700 hover:bg-stone-100'
                }
              >
                {s}
              </button>
            );
          })}
        </div>
      </div>
      <p className="sm:col-span-2 text-[11px] text-stone-500 italic">
        Properties they helped with are linked from the Real Estate section.
      </p>
    </div>
  );

  const renderDoctorExtras = () => (
    <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 space-y-2">
      <p className="text-xs font-semibold text-amber-900">Contact card only</p>
      <p className="text-[11px] text-amber-800">
        For full medical records, prescriptions, and emergency information, open the Medical section.
      </p>
      {onOpenMedical && (
        <Button size="sm" variant="outline" onClick={onOpenMedical}>
          Open in Medical <ExternalLink className="h-3.5 w-3.5 ml-1" />
        </Button>
      )}
    </div>
  );

  const renderOtherExtras = () => (
    <div>
      <Label>Advisor type (free-form)</Label>
      <Input
        value={form.specialty || ''}
        onChange={(e) => setField('specialty', e.target.value)}
        placeholder="e.g. Tax preparer, Business consultant…"
      />
    </div>
  );

  const renderKindExtras = () => {
    switch (kind) {
      case 'attorney': return renderAttorneyExtras();
      case 'cpa': return renderCpaExtras();
      case 'financial': return renderFinancialExtras();
      case 'insurance': return renderInsuranceExtras();
      case 'realtor': return renderRealtorExtras();
      case 'doctor': return renderDoctorExtras();
      case 'other': return renderOtherExtras();
    }
  };

  // ============= Card chrome =============
  const statusBadgeClass = isDeceased
    ? 'bg-stone-200 text-stone-600'
    : status === 'retired'
      ? 'bg-amber-100 text-amber-800'
      : status === 'former'
        ? 'bg-stone-100 text-stone-600'
        : 'bg-emerald-100 text-emerald-800';

  const statusLabel = isDeceased
    ? 'Deceased'
    : status === 'retired' ? 'Retired'
    : status === 'former' ? 'Former'
    : 'Active';

  const containerCls = `rounded-2xl border bg-white shadow-sm overflow-hidden ${
    isDeceased ? 'border-stone-200 opacity-80' : 'border-stone-200'
  }`;

  return (
    <div className={containerCls}>
      {/* Card face */}
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-4 text-left hover:bg-stone-50"
      >
        <PersonAvatar
          photoPath={form.photo_path}
          name={headerName}
          isDeceased={isDeceased}
          size={48}
        />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className={`font-semibold truncate ${isDeceased ? 'text-stone-500' : 'text-stone-900'}`}>
              {headerName}
            </p>
            <span className="inline-flex items-center gap-1 rounded-full bg-stone-100 px-2 py-0.5 text-[10px] font-medium text-stone-700">
              <KindIcon kind={kind} className="h-3 w-3" />
              {KIND_LABELS[kind]}
            </span>
            <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${statusBadgeClass}`}>
              {statusLabel}
            </span>
          </div>
          {cardSubtitle && (
            <p className="text-xs text-stone-500 truncate mt-0.5">{cardSubtitle}</p>
          )}
        </div>
        {expanded ? <ChevronUp className="h-5 w-5 text-stone-400" /> : <ChevronDown className="h-5 w-5 text-stone-400" />}
      </button>

      {expanded && (
        <div className="border-t border-stone-100 p-4 space-y-4 bg-stone-50/60">
          {/* Photo + base identity */}
          <div className="flex flex-col sm:flex-row gap-4 items-start">
            <ProfilePhotoUploader
              photoPath={form.photo_path}
              pendingFile={pendingPhoto}
              name={headerName}
              isDeceased={isDeceased}
              onFileSelected={(f) => setPendingPhoto(f)}
              onRemove={() => { setPendingPhoto(null); setField('photo_path', null); }}
              size={88}
            />
            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              <div>
                <Label>First name <span className="text-red-500">*</span></Label>
                <Input value={form.first_name || ''} onChange={(e) => setField('first_name', e.target.value)} />
              </div>
              <div>
                <Label>Last name <span className="text-red-500">*</span></Label>
                <Input value={form.last_name || ''} onChange={(e) => setField('last_name', e.target.value)} />
              </div>
              <div className="sm:col-span-2">
                <Label>Firm / company</Label>
                <Input value={form.firm || ''} onChange={(e) => setField('firm', e.target.value)} />
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label className="flex items-center gap-1"><Phone className="h-3 w-3" /> Phone</Label>
              <Input type="tel" value={form.phone || ''} onChange={(e) => setField('phone', e.target.value)} />
            </div>
            <div>
              <Label className="flex items-center gap-1"><Mail className="h-3 w-3" /> Email</Label>
              <Input type="email" value={form.email || ''} onChange={(e) => setField('email', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="flex items-center gap-1"><MapPin className="h-3 w-3" /> Office address</Label>
              <Input value={form.address || ''} onChange={(e) => setField('address', e.target.value)} />
            </div>
            <div className="sm:col-span-2">
              <Label className="flex items-center gap-1"><Globe className="h-3 w-3" /> Website</Label>
              <Input type="url" value={form.website || ''} onChange={(e) => setField('website', e.target.value)} placeholder="https://" />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <Label>Status</Label>
              <select
                value={form.advisor_status || form.status || 'active'}
                onChange={(e) => setField('advisor_status', e.target.value)}
                disabled={isDeceased}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm disabled:opacity-50"
              >
                {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex items-center gap-3 pt-6">
              <Switch
                checked={!!form.is_deceased}
                onCheckedChange={(v) => {
                  setField('is_deceased', v);
                  if (v) setField('advisor_status', 'deceased');
                  else if ((form.advisor_status || '') === 'deceased') setField('advisor_status', 'active');
                }}
              />
              <Label className="!mt-0">Deceased</Label>
            </div>
            {isDeceased && (
              <div>
                <Label>Date of death</Label>
                <Input
                  type="date"
                  value={form.date_of_death || ''}
                  onChange={(e) => setField('date_of_death', e.target.value)}
                />
              </div>
            )}
          </div>

          {/* Death certificate (only when deceased + saved) */}
          {isDeceased && !isDraft && (
            <DeathCertificateUpload
              packetId={packetId}
              relatedTable="advisor_records"
              relatedRecordId={row.id}
            />
          )}

          {/* Per-kind extras */}
          <div className="rounded-xl bg-white border border-stone-200 p-3 space-y-3">
            <p className="text-xs font-bold uppercase tracking-widest text-stone-500 inline-flex items-center gap-1.5">
              <KindIcon kind={kind} className="h-3.5 w-3.5" /> {KIND_LABELS[kind]} details
            </p>
            {renderKindExtras()}
          </div>

          {/* Notes */}
          <div>
            <Label>Notes</Label>
            <Textarea rows={3} value={form.notes || ''} onChange={(e) => setField('notes', e.target.value)} />
          </div>

          {/* Advanced / Legacy accordion — only when legacy data exists */}
          {hasLegacy && (
            <Accordion type="single" collapsible>
              <AccordionItem value="legacy">
                <AccordionTrigger className="text-xs font-bold uppercase tracking-widest text-stone-500">
                  Advanced / Legacy notes
                </AccordionTrigger>
                <AccordionContent>
                  <Textarea
                    rows={4}
                    value={form.legacy_notes || ''}
                    onChange={(e) => setField('legacy_notes', e.target.value)}
                    className="text-xs font-mono"
                  />
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          )}

          {/* Find a Pro */}
          {kind !== 'doctor' && (
            <FindProfessionalPrompt
              variant="block"
              message={`Need to find a ${KIND_LABELS[kind].toLowerCase()}?`}
              query={KIND_PRO_QUERY[kind]}
            />
          )}

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={handleDelete} className="text-red-600 hover:text-red-700 hover:bg-red-50">
              <Trash2 className="h-4 w-4" /> {isDraft ? 'Cancel' : 'Delete'}
            </Button>
            <Button size="sm" onClick={handleSave} disabled={saving}>
              <Save className="h-4 w-4" /> {saving ? 'Saving…' : 'Save advisor'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
