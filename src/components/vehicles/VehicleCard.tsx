import React, { useEffect, useMemo, useState } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Button } from '@/components/ui/button';
import { RecordDocumentUpload } from '@/components/common/RecordDocumentUpload';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useConfirm } from '@/context/ConfirmDialogContext';
import { useAppContext } from '@/context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import {
  Car,
  ChevronDown,
  ChevronUp,
  FileText,
  Loader2,
  Save,
  Trash2,
} from 'lucide-react';
import { toast } from 'sonner';
import { StorageImage } from '@/components/common/StorageImage';
import { vehiclePhotoService, type VehiclePhoto } from '@/services/vehiclePhotoService';
import { VehiclePhotoGallery } from './VehiclePhotoGallery';
import { AIValuationPanel } from '@/components/common/AIValuationPanel';

type VehicleRecord = Record<string, any> & {
  id: string;
  packet_id?: string | null;
  scope?: string | null;
  year?: string | null;
  make?: string | null;
  model?: string | null;
  vin?: string | null;
  updated_at?: string | null;
};

type VehicleCardProps = {
  packetId: string;
  scope: string;
  vehicle: VehicleRecord;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: VehicleRecord, previousDraftId?: string) => void;
  onDeleted: (deletedId: string) => void;
  onCancelDraft: (draftId: string) => void;
};

type FieldType = 'text' | 'textarea' | 'select' | 'number' | 'currency' | 'date' | 'phone' | 'masked';

type FieldConfig = {
  name: string;
  label: string;
  type?: FieldType;
  placeholder?: string;
  options?: string[];
  rows?: number;
  description?: string;
  step?: string;
};

const TABLE_NAME = 'vehicle_records';

const BODY_STYLE_OPTIONS = ['Sedan', 'SUV', 'Truck', 'Coupe', 'Convertible', 'Wagon', 'Van', 'Motorcycle', 'RV', 'Boat', 'ATV', 'Other'];
const OWNERSHIP_OPTIONS = ['Sole', 'Joint', 'Leased', 'Company'];
const TITLE_STATUS_OPTIONS = ['Clean', 'Salvage', 'Rebuilt', 'Lien'];
const COVERAGE_OPTIONS = ['Liability', 'Comprehensive', 'Full Coverage'];
const PREMIUM_FREQUENCY_OPTIONS = ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'];
const FINANCE_STATUS_OPTIONS = ['Owned', 'Financed', 'Leased'];
const PURCHASED_FROM_OPTIONS = ['Dealer', 'Private Seller', 'Auction', 'Family Member', 'Other'];
const DISPOSITION_OPTIONS = ['Transfer to family', 'Sell', 'Donate', 'Per my Will', 'Other'];

const BASIC_FIELDS: FieldConfig[] = [
  { name: 'year', label: 'Year *', placeholder: 'e.g. 2022' },
  { name: 'make', label: 'Make *', placeholder: 'e.g. Ford' },
  { name: 'model', label: 'Model *', placeholder: 'e.g. F-150' },
  { name: 'trim_package', label: 'Trim / Package', placeholder: 'e.g. XLT SuperCrew' },
  { name: 'body_style', label: 'Body style', type: 'select', options: BODY_STYLE_OPTIONS },
  { name: 'exterior_color', label: 'Exterior color', placeholder: 'e.g. Oxford White' },
  { name: 'interior_color', label: 'Interior color', placeholder: 'e.g. Black' },
  { name: 'vin', label: 'VIN *', type: 'masked', placeholder: '17-character VIN' },
  { name: 'license_plate', label: 'License plate', placeholder: 'Plate #' },
  { name: 'state', label: 'License plate state', placeholder: 'e.g. CA' },
  { name: 'odometer_reading', label: 'Odometer (miles)', type: 'number', placeholder: 'e.g. 45000' },
  { name: 'odometer_recorded_date', label: 'Odometer recorded date', type: 'date' },
  { name: 'ownership_type', label: 'Ownership type', type: 'select', options: OWNERSHIP_OPTIONS },
  { name: 'primary_driver', label: 'Primary driver', placeholder: 'Name' },
  { name: 'garaging_address', label: 'Garaging address', type: 'textarea', rows: 2, placeholder: 'Where the vehicle is normally kept' },
];

const REGISTRATION_FIELDS: FieldConfig[] = [
  { name: 'registration_expiry_date', label: 'Registration expiration', type: 'date' },
  { name: 'registration_state', label: 'Registration state', placeholder: 'e.g. CA' },
  { name: 'title_status', label: 'Title status', type: 'select', options: TITLE_STATUS_OPTIONS },
  { name: 'title_holder_name', label: 'Title holder (if lien)', placeholder: 'Lender / lienholder' },
  { name: 'inspection_due_date', label: 'Next inspection due', type: 'date' },
];

const INSURANCE_FIELDS: FieldConfig[] = [
  { name: 'insurance_provider', label: 'Insurance provider', placeholder: 'Provider name' },
  { name: 'policy_number', label: 'Policy number', placeholder: 'Policy #' },
  { name: 'insurance_agent_name', label: 'Agent name', placeholder: 'Agent' },
  { name: 'insurance_agent_phone', label: 'Agent phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'coverage_type', label: 'Coverage type', type: 'select', options: COVERAGE_OPTIONS },
  { name: 'premium_amount', label: 'Premium amount', type: 'currency', placeholder: '0.00' },
  { name: 'premium_frequency', label: 'Premium frequency', type: 'select', options: PREMIUM_FREQUENCY_OPTIONS },
  { name: 'insurance_renewal_date', label: 'Policy expiration', type: 'date' },
  { name: 'roadside_phone', label: 'Roadside assistance phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const FINANCED_FIELDS: FieldConfig[] = [
  { name: 'lender_name', label: 'Lender name', placeholder: 'Bank / lender' },
  { name: 'lender_account_number', label: 'Account number', type: 'masked', placeholder: 'Loan account #' },
  { name: 'monthly_payment', label: 'Monthly payment', type: 'currency', placeholder: '0.00' },
  { name: 'interest_rate', label: 'Interest rate (%)', type: 'number', step: '0.01', placeholder: 'e.g. 5.99' },
  { name: 'loan_start_date', label: 'Loan start date', type: 'date' },
  { name: 'loan_payoff_date', label: 'Payoff date', type: 'date' },
  { name: 'remaining_balance', label: 'Remaining balance (est.)', type: 'currency', placeholder: '0.00' },
  { name: 'lender_phone', label: 'Lender phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const LEASED_FIELDS: FieldConfig[] = [
  { name: 'leasing_company', label: 'Leasing company', placeholder: 'Lessor' },
  { name: 'lender_account_number', label: 'Account number', type: 'masked', placeholder: 'Lease account #' },
  { name: 'monthly_payment', label: 'Monthly payment', type: 'currency', placeholder: '0.00' },
  { name: 'lease_start_date', label: 'Lease start date', type: 'date' },
  { name: 'lease_end_date', label: 'Lease end date', type: 'date' },
  { name: 'lease_mileage_allowance', label: 'Mileage allowance/year', type: 'number', placeholder: 'e.g. 12000' },
  { name: 'lease_mileage_overage', label: 'Current mileage overage', type: 'number', placeholder: 'e.g. 0' },
  { name: 'lease_turnin_notes', label: 'Turn-in instructions / notes', type: 'textarea', rows: 3 },
];

const VALUATION_FIELDS: FieldConfig[] = [
  { name: 'purchase_price', label: 'Purchase price', type: 'currency', placeholder: '0.00' },
  { name: 'purchase_date', label: 'Purchase date', type: 'date' },
  { name: 'purchased_from', label: 'Purchased from', type: 'select', options: PURCHASED_FROM_OPTIONS },
  { name: 'estimated_value', label: 'Current estimated value', type: 'currency', placeholder: '0.00' },
  { name: 'valuation_reference_date', label: 'KBB / NADA reference date', type: 'date' },
  { name: 'appraised_value', label: 'Appraised value', type: 'currency', placeholder: '0.00' },
  { name: 'condition_notes', label: 'Notes on condition affecting value', type: 'textarea', rows: 3 },
];

const MAINTENANCE_FIELDS: FieldConfig[] = [
  { name: 'last_oil_change_date', label: 'Last oil change date', type: 'date' },
  { name: 'last_oil_change_mileage', label: 'Last oil change mileage', type: 'number', placeholder: 'e.g. 42000' },
  { name: 'next_service_due_date', label: 'Next service due (date)', type: 'date' },
  { name: 'next_service_due_mileage', label: 'Next service due (mileage)', type: 'number', placeholder: 'e.g. 50000' },
  { name: 'tire_brand', label: 'Tire brand', placeholder: 'e.g. Michelin' },
  { name: 'tire_size', label: 'Tire size', placeholder: 'e.g. 275/65R18' },
  { name: 'last_tire_rotation_date', label: 'Last tire rotation', type: 'date' },
  { name: 'mechanic_name', label: 'Mechanic / shop', placeholder: 'Shop name' },
  { name: 'mechanic_phone', label: 'Mechanic phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'known_issues', label: 'Known issues / repairs needed', type: 'textarea', rows: 3 },
  { name: 'service_history_notes', label: 'Service history notes', type: 'textarea', rows: 3 },
];

const KEY_FIELDS: FieldConfig[] = [
  { name: 'number_of_keys', label: 'Number of keys', type: 'number', placeholder: 'e.g. 2' },
  { name: 'key_location', label: 'Key location', placeholder: 'Where spare keys are kept' },
  { name: 'key_fob_notes', label: 'Key fob notes', type: 'textarea', rows: 2 },
  { name: 'garage_opener_code', label: 'Garage opener code', type: 'masked', placeholder: 'Code' },
  { name: 'parking_location', label: 'Parking location / notes', type: 'textarea', rows: 2 },
];

const DISPOSITION_FIELDS: FieldConfig[] = [
  { name: 'disposition_action', label: 'What should happen to this vehicle?', type: 'select', options: DISPOSITION_OPTIONS },
  { name: 'disposition_recipient', label: 'Recipient (family member / buyer)', placeholder: 'Name' },
  { name: 'asking_price', label: 'Asking price (if selling)', type: 'currency', placeholder: '0.00' },
  { name: 'donation_organization', label: 'Donation organization', placeholder: 'Name' },
  { name: 'disposition_instructions', label: 'Special instructions', type: 'textarea', rows: 3 },
  { name: 'sentimental_notes', label: 'Sentimental notes', type: 'textarea', rows: 3 },
];

const DOCUMENT_SLOTS = [
  { category: 'vehicle_title', label: 'Title' },
  { category: 'vehicle_registration', label: 'Registration' },
  { category: 'vehicle_insurance_card', label: 'Insurance Card' },
  { category: 'vehicle_loan_lease', label: 'Loan / Lease Agreement' },
  { category: 'vehicle_purchase_receipt', label: 'Purchase Receipt' },
  { category: 'vehicle_warranty', label: 'Warranty Documents' },
  { category: 'vehicle_appraisal', label: 'Appraisal Document' },
  { category: 'vehicle_service_records', label: 'Service Records' },
  { category: 'vehicle_other', label: 'Other Documents' },
];

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const isDraftId = (id?: string | null) => !!id && id.startsWith('draft-');

const normalizeVehicle = (v: VehicleRecord): VehicleRecord => ({
  ownership_type: 'Sole',
  finance_status: 'Owned',
  owner_is_deceased: false,
  roadside_assistance: false,
  has_garage_opener: false,
  ...v,
});

const formatCurrencySummary = (value: any) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return currencyFormatter.format(numeric);
};

const daysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const diff = Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  return diff;
};

const expiryTone = (days: number | null): string => {
  if (days === null) return 'bg-muted text-muted-foreground border-border';
  if (days < 0) return 'bg-red-100 text-red-800 border-red-200';
  if (days <= 30) return 'bg-amber-100 text-amber-800 border-amber-200';
  return 'bg-emerald-100 text-emerald-800 border-emerald-200';
};

const buildTitle = (v: VehicleRecord) =>
  [v.year, v.make, v.model].filter(Boolean).join(' ') || 'New Vehicle';

const Field = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
  <label className="space-y-2 block">
    <div>
      <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
      {description ? <p className="mt-1 text-xs text-muted-foreground">{description}</p> : null}
    </div>
    {children}
  </label>
);

const NativeSelect = ({ value, onChange, options, placeholder }: { value: any; onChange: (value: string) => void; options: string[]; placeholder?: string }) => (
  <select
    value={value || ''}
    onChange={(event) => onChange(event.target.value)}
    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
  >
    <option value="">{placeholder || 'Select an option'}</option>
    {options.map((option) => (
      <option key={option} value={option}>{option}</option>
    ))}
  </select>
);

const InputField = ({
  field, value, onChange, revealed, onToggleReveal,
}: {
  field: FieldConfig;
  value: any;
  onChange: (name: string, value: any) => void;
  revealed: boolean;
  onToggleReveal: (name: string) => void;
}) => {
  const currentValue = value ?? '';

  if (field.type === 'textarea') {
    return (
      <Field label={field.label} description={field.description}>
        <Textarea
          rows={field.rows || 3}
          value={currentValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      </Field>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <Field label={field.label} description={field.description}>
        <NativeSelect
          value={currentValue}
          options={field.options}
          placeholder={field.placeholder}
          onChange={(nextValue) => onChange(field.name, nextValue)}
        />
      </Field>
    );
  }

  if (field.type === 'masked') {
    return (
      <Field label={field.label} description={field.description}>
        <div className="flex items-center gap-2">
          <Input
            type={revealed ? 'text' : 'password'}
            value={currentValue}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.name, event.target.value)}
            className="flex-1 font-mono"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => onToggleReveal(field.name)}>
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
        </div>
      </Field>
    );
  }

  if (field.type === 'number' || field.type === 'currency') {
    return (
      <Field label={field.label} description={field.description}>
        <Input
          type="number"
          step={field.step || (field.type === 'currency' ? '0.01' : '1')}
          value={currentValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value === '' ? null : Number(event.target.value))}
        />
      </Field>
    );
  }

  return (
    <Field label={field.label} description={field.description}>
      <Input
        type={field.type === 'date' ? 'date' : field.type === 'phone' ? 'tel' : 'text'}
        value={currentValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    </Field>
  );
};

const FieldGrid = ({
  fields, formData, revealedFields, onToggleReveal, onChange, columns = 'md:grid-cols-2',
}: {
  fields: FieldConfig[];
  formData: VehicleRecord;
  revealedFields: Record<string, boolean>;
  onToggleReveal: (n: string) => void;
  onChange: (n: string, v: any) => void;
  columns?: string;
}) => (
  <div className={cn('grid grid-cols-1 gap-4', columns)}>
    {fields.map((field) => (
      <InputField
        key={field.name}
        field={field}
        value={formData[field.name]}
        onChange={onChange}
        revealed={!!revealedFields[field.name]}
        onToggleReveal={onToggleReveal}
      />
    ))}
  </div>
);

const SummaryPill = ({ label, tone }: { label: string; tone?: string }) => (
  <span className={cn(
    'rounded-full border px-2.5 py-1 text-[11px] font-semibold',
    tone || 'border-border bg-muted text-muted-foreground',
  )}>
    {label}
  </span>
);

export const createEmptyVehicle = (scope: string): VehicleRecord => ({
  id: `draft-${crypto.randomUUID()}`,
  scope,
  year: '',
  make: '',
  model: '',
  vin: '',
  ownership_type: 'Sole',
  finance_status: 'Owned',
});

const createPersistedPayload = (formData: VehicleRecord, packetId: string, scope: string) => {
  const payload: Record<string, any> = {
    ...formData,
    packet_id: packetId,
    scope: formData.scope || scope,
    status: 'completed',
    is_na: false,
  };

  // Clear lender / lease fields based on finance_status
  if (formData.finance_status !== 'Financed') {
    payload.lender_name = null;
    payload.interest_rate = null;
    payload.loan_start_date = null;
    payload.loan_payoff_date = null;
    payload.remaining_balance = null;
    payload.lender_phone = null;
  }
  if (formData.finance_status !== 'Leased') {
    payload.leasing_company = null;
    payload.lease_start_date = null;
    payload.lease_end_date = null;
    payload.lease_mileage_allowance = null;
    payload.lease_mileage_overage = null;
    payload.lease_turnin_notes = null;
  }
  if (formData.finance_status === 'Owned') {
    payload.monthly_payment = null;
    payload.lender_account_number = null;
  }

  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  return payload;
};

export const VehicleCard: React.FC<VehicleCardProps> = ({
  packetId, scope, vehicle, expanded, onToggle, onSaved, onDeleted, onCancelDraft,
}) => {
  const confirm = useConfirm();
  const { bumpCompletion } = useAppContext();
  const [formData, setFormData] = useState<VehicleRecord>(() => normalizeVehicle(vehicle));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(isDraftId(vehicle.id));
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});
  const [heroPhoto, setHeroPhoto] = useState<VehiclePhoto | null>(null);

  useEffect(() => {
    setFormData(normalizeVehicle(vehicle));
    setHasChanges(isDraftId(vehicle.id));
  }, [vehicle.id, vehicle.updated_at]);

  const savedVehicleId = isDraftId(formData.id) ? null : formData.id;

  useEffect(() => {
    let cancelled = false;
    if (!savedVehicleId) { setHeroPhoto(null); return; }
    vehiclePhotoService.getHeroForRecord(savedVehicleId).then((p) => {
      if (!cancelled) setHeroPhoto(p);
    });
    return () => { cancelled = true; };
  }, [savedVehicleId]);

  const refreshHero = () => {
    if (!savedVehicleId) return;
    vehiclePhotoService.getHeroForRecord(savedVehicleId).then(setHeroPhoto);
  };

  const setFieldValue = (fieldName: string, value: any) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
    setHasChanges(true);
  };

  const toggleReveal = (fieldName: string) => {
    setRevealedFields((current) => ({ ...current, [fieldName]: !current[fieldName] }));
  };

  const insuranceDays = daysUntil(formData.insurance_renewal_date);
  const registrationDays = daysUntil(formData.registration_expiry_date);

  const summary = useMemo(() => {
    const items: { label: string; tone?: string }[] = [];
    if (formData.license_plate) items.push({ label: `Plate ${formData.license_plate}` });
    if (formData.body_style) items.push({ label: formData.body_style });
    if (formData.finance_status && formData.finance_status !== 'Owned') {
      items.push({ label: formData.finance_status });
    }
    const value = formatCurrencySummary(formData.estimated_value);
    if (value) items.push({ label: value });
    if (insuranceDays !== null) {
      const lbl = insuranceDays < 0
        ? `Insurance expired ${Math.abs(insuranceDays)}d ago`
        : `Insurance: ${insuranceDays}d`;
      items.push({ label: lbl, tone: expiryTone(insuranceDays) });
    }
    if (registrationDays !== null) {
      const lbl = registrationDays < 0
        ? `Registration expired ${Math.abs(registrationDays)}d ago`
        : `Registration: ${registrationDays}d`;
      items.push({ label: lbl, tone: expiryTone(registrationDays) });
    }
    return items;
  }, [formData, insuranceDays, registrationDays]);

  const handleSave = async () => {
    if (!formData.year?.toString().trim() || !formData.make?.trim() || !formData.model?.trim()) {
      toast.error('Year, Make, and Model are required.', { duration: 5000, position: 'bottom-center' });
      return;
    }
    if (!formData.vin?.trim()) {
      toast.error('VIN is required.', { duration: 5000, position: 'bottom-center' });
      return;
    }

    setSaving(true);
    try {
      const payload = createPersistedPayload(formData, packetId, scope);
      const table = (supabase as any).from(TABLE_NAME);

      const result = savedVehicleId
        ? await table.update(payload).eq('id', savedVehicleId).select().single()
        : await table.insert(payload).select().single();

      if (result.error) throw result.error;

      const savedRecord = normalizeVehicle(result.data as VehicleRecord);
      const wasNewRecord = isDraftId(vehicle.id);
      setFormData(savedRecord);
      setHasChanges(false);
      onSaved(savedRecord, wasNewRecord ? vehicle.id : undefined);
      bumpCompletion();
      toast.success(`${buildTitle(savedRecord)} saved.`, {
        duration: 3000, position: 'bottom-center',
      });
      // Collapse on save for new records (return to list view); keep open when editing existing.
      if (wasNewRecord && expanded) onToggle();
    } catch (error: any) {
      console.error('Failed to save vehicle', error);
      toast.error(`Failed to save vehicle: ${error?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDraftId(vehicle.id)) {
      onCancelDraft(vehicle.id);
      return;
    }
    const confirmed = await confirm({
      title: 'Delete this vehicle?',
      description: `Delete "${buildTitle(formData)}" and all attached details? This cannot be undone.`,
      confirmLabel: 'Delete',
    });
    if (!confirmed) return;

    setDeleting(true);
    try {
      const table = (supabase as any).from(TABLE_NAME);
      const { error } = await table.delete().eq('id', vehicle.id);
      if (error) throw error;
      onDeleted(vehicle.id);
      bumpCompletion();
      toast.success('Vehicle deleted.', { duration: 3000, position: 'bottom-center' });
    } catch (error: any) {
      console.error('Failed to delete vehicle', error);
      toast.error(`Failed to delete vehicle: ${error?.message || 'Unknown error'}`, {
        duration: 5000, position: 'bottom-center',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="paper-sheet overflow-hidden border border-border bg-card">
      <div className="flex items-start gap-3 px-5 py-4">
        <button type="button" onClick={onToggle} className="flex flex-1 items-start gap-4 text-left">
          <div className="mt-1 h-14 w-20 shrink-0 overflow-hidden rounded-xl bg-muted text-muted-foreground flex items-center justify-center">
            {heroPhoto ? (
              <StorageImage path={heroPhoto.file_path} alt={buildTitle(formData)} className="w-full h-full object-cover" />
            ) : (
              <Car className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">{buildTitle(formData)}</h3>
              {isDraftId(vehicle.id) ? <SummaryPill label="Unsaved" /> : null}
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.map((item, idx) => (
                <SummaryPill key={`${item.label}-${idx}`} label={item.label} tone={item.tone} />
              ))}
            </div>
          </div>
          <div className="pt-1 text-muted-foreground">{expanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}</div>
        </button>
        <Button type="button" variant="ghost" size="icon" onClick={handleDelete} disabled={deleting || saving}>
          {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
        </Button>
      </div>

      {expanded ? (
        <div className="space-y-5 border-t border-border px-5 py-5">
          <Accordion type="multiple" defaultValue={['basic']} className="space-y-3">
            <AccordionItem value="basic" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Basic Info</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid fields={BASIC_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Owner is deceased</p>
                    <p className="text-xs text-muted-foreground">Track ownership transfer status.</p>
                  </div>
                  <Switch checked={!!formData.owner_is_deceased} onCheckedChange={(checked) => setFieldValue('owner_is_deceased', checked)} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="registration" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Registration & Title</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid fields={REGISTRATION_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_title" label="Title document" />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_registration" label="Registration document" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="insurance" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Insurance</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Roadside assistance</p>
                    <p className="text-xs text-muted-foreground">Toggle on if covered.</p>
                  </div>
                  <Switch checked={!!formData.roadside_assistance} onCheckedChange={(checked) => setFieldValue('roadside_assistance', checked)} />
                </div>
                <FieldGrid fields={INSURANCE_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_insurance_card" label="Insurance card" />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_insurance_policy" label="Policy document" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="loan" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Loan / Lease</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <Field label="Status">
                  <NativeSelect
                    value={formData.finance_status || 'Owned'}
                    options={FINANCE_STATUS_OPTIONS}
                    onChange={(v) => setFieldValue('finance_status', v)}
                  />
                </Field>
                {formData.finance_status === 'Financed' && (
                  <>
                    <FieldGrid fields={FINANCED_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                    <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_loan_lease" label="Loan document" />
                  </>
                )}
                {formData.finance_status === 'Leased' && (
                  <>
                    <FieldGrid fields={LEASED_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                    <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_loan_lease" label="Lease agreement" />
                  </>
                )}
                {formData.finance_status === 'Owned' && (
                  <p className="text-sm text-muted-foreground">Vehicle is owned outright — no loan or lease details needed.</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="valuation" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Valuation</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <AIValuationPanel
                  variant="vehicle"
                  enabled={Boolean(
                    String(formData.year || '').trim() &&
                    String(formData.make || '').trim() &&
                    String(formData.model || '').trim() &&
                    formData.odometer_reading != null && formData.odometer_reading !== ''
                  )}
                  disabledHint="Enter Year, Make, Model, and Odometer (Basic Info) to use AI estimation."
                  input={() => ({
                    year: formData.year ?? '',
                    make: formData.make ?? '',
                    model: formData.model ?? '',
                    trim: formData.trim_package ?? undefined,
                    mileage: formData.odometer_reading ?? '',
                    condition: formData.condition_notes ? String(formData.condition_notes).slice(0, 80) : 'good',
                  })}
                  onAccept={(v) => setFieldValue('estimated_value', v)}
                />
                <FieldGrid fields={VALUATION_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_appraisal" label="Appraisal document" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="maintenance" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Maintenance</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid fields={MAINTENANCE_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                <RecordDocumentUpload packetId={packetId} relatedTable={TABLE_NAME} relatedRecordId={savedVehicleId} category="vehicle_service_records" label="Maintenance records" />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="photos" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Photos</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <VehiclePhotoGallery packetId={packetId} recordId={savedVehicleId} onHeroChanged={refreshHero} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="keys" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Key & Access</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Has garage opener</p>
                  </div>
                  <Switch checked={!!formData.has_garage_opener} onCheckedChange={(checked) => setFieldValue('has_garage_opener', checked)} />
                </div>
                <FieldGrid fields={KEY_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="disposition" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Disposition Instructions</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid fields={DISPOSITION_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="documents" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">Documents</AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {DOCUMENT_SLOTS.map((slot) => (
                    <RecordDocumentUpload
                      key={slot.category}
                      packetId={packetId}
                      relatedTable={TABLE_NAME}
                      relatedRecordId={savedVehicleId}
                      category={slot.category}
                      label={slot.label}
                    />
                  ))}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>

          <Separator />

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <FileText className="h-4 w-4" />
              <span>
                {savedVehicleId
                  ? 'Documents and photos stay attached to this vehicle record.'
                  : 'Save this vehicle once to unlock document and photo attachments.'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isDraftId(vehicle.id) ? (
                <Button type="button" variant="outline" onClick={() => onCancelDraft(vehicle.id)} disabled={saving || deleting}>
                  Remove Draft
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave} disabled={saving || deleting || !hasChanges}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Vehicle
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};
