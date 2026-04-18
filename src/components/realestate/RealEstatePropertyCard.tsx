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
  Building2,
  ChevronDown,
  ChevronUp,
  FileText,
  Home,
  Loader2,
  MapPin,
  Plus,
  Save,
  ShieldCheck,
  Trash2,
  Video,
  Wrench,
} from 'lucide-react';
import { toast } from 'sonner';
import { HomeInventoryVideo } from './HomeInventoryVideo';
import { AIValuationPanel } from '@/components/common/AIValuationPanel';

type RealEstateProperty = Record<string, any> & {
  id: string;
  packet_id?: string | null;
  scope?: string | null;
  property_label?: string | null;
  property_type?: string | null;
  address?: string | null;
  updated_at?: string | null;
};

type PropertyCardProps = {
  packetId: string;
  scope: string;
  property: RealEstateProperty;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (savedProperty: RealEstateProperty, previousDraftId?: string) => void;
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

type FieldRendererProps = {
  field: FieldConfig;
  value: any;
  onChange: (fieldName: string, value: any) => void;
  revealed: boolean;
  onToggleReveal: (fieldName: string) => void;
};

const PROPERTY_TYPE_OPTIONS = [
  'Primary Residence',
  'Vacation',
  'Rental',
  'Commercial',
  'Land',
  'Other',
];

const OWNERSHIP_OPTIONS = ['Sole', 'Joint', 'Trust', 'LLC'];
const LOAN_TYPE_OPTIONS = ['Fixed', 'ARM', 'Other'];

const BASIC_FIELDS: FieldConfig[] = [
  { name: 'property_label', label: 'Property nickname / label', placeholder: 'e.g. Primary Home' },
  { name: 'property_type', label: 'Property type', type: 'select', options: PROPERTY_TYPE_OPTIONS },
  { name: 'ownership_type', label: 'Ownership type', type: 'select', options: OWNERSHIP_OPTIONS },
  { name: 'year_purchased', label: 'Year purchased', type: 'number', placeholder: 'e.g. 2018', step: '1' },
  { name: 'purchase_price', label: 'Purchase price', type: 'currency', placeholder: '0.00' },
  { name: 'estimated_value', label: 'Current estimated value', type: 'currency', placeholder: '0.00' },
  { name: 'property_tax_account_number', label: 'Property tax account number', placeholder: 'Tax account #' },
  { name: 'annual_property_tax_amount', label: 'Annual property tax amount', type: 'currency', placeholder: '0.00' },
  { name: 'tax_due_date', label: 'Tax due date', type: 'date' },
  { name: 'municipality_contact', label: 'Municipality / tax assessor contact', placeholder: 'Phone, office, website' },
  { name: 'address', label: 'Full address', type: 'textarea', placeholder: 'Street, city, state, zip', rows: 3 },
];

const MORTGAGE_FIELDS: FieldConfig[] = [
  { name: 'mortgage_lender_name', label: 'Lender name', placeholder: 'Lender name' },
  { name: 'mortgage_account_number', label: 'Account number', placeholder: 'Loan account #' },
  { name: 'mortgage_monthly_payment', label: 'Monthly payment', type: 'currency', placeholder: '0.00' },
  { name: 'mortgage_interest_rate', label: 'Interest rate', type: 'number', placeholder: 'e.g. 6.25', step: '0.01' },
  { name: 'mortgage_payoff_date', label: 'Payoff date', type: 'date' },
  { name: 'mortgage_lender_phone', label: 'Lender phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'mortgage_lender_website', label: 'Lender website', placeholder: 'https://example.com' },
  { name: 'mortgage_loan_type', label: 'Loan type', type: 'select', options: LOAN_TYPE_OPTIONS },
];

const INSURANCE_FIELDS: FieldConfig[] = [
  { name: 'insurance_provider_name', label: 'Provider name', placeholder: 'Insurance company' },
  { name: 'insurance_policy_number', label: 'Policy number', placeholder: 'Policy #' },
  { name: 'insurance_agent_name', label: 'Agent name', placeholder: 'Agent name' },
  { name: 'insurance_agent_phone', label: 'Agent phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'insurance_annual_premium', label: 'Annual premium', type: 'currency', placeholder: '0.00' },
  { name: 'insurance_coverage_amount', label: 'Coverage amount', type: 'currency', placeholder: '0.00' },
  { name: 'insurance_policy_renewal_date', label: 'Policy renewal date', type: 'date' },
];

const ELECTRIC_FIELDS: FieldConfig[] = [
  { name: 'electric_company_name', label: 'Company name', placeholder: 'Electric company' },
  { name: 'electric_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'electric_monthly_estimate', label: 'Monthly estimate', type: 'currency', placeholder: '0.00' },
  { name: 'electric_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const GAS_FIELDS: FieldConfig[] = [
  { name: 'gas_company_name', label: 'Company name', placeholder: 'Gas provider' },
  { name: 'gas_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'gas_monthly_estimate', label: 'Monthly estimate', type: 'currency', placeholder: '0.00' },
  { name: 'gas_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const WATER_FIELDS: FieldConfig[] = [
  { name: 'water_sewer_company_name', label: 'Company name', placeholder: 'Water / sewer provider' },
  { name: 'water_sewer_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'water_sewer_monthly_estimate', label: 'Monthly estimate', type: 'currency', placeholder: '0.00' },
  { name: 'water_sewer_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const INTERNET_FIELDS: FieldConfig[] = [
  { name: 'internet_cable_provider', label: 'Provider', placeholder: 'Internet / cable provider' },
  { name: 'internet_cable_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'internet_cable_monthly_estimate', label: 'Monthly estimate', type: 'currency', placeholder: '0.00' },
  { name: 'internet_cable_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const TRASH_FIELDS: FieldConfig[] = [
  { name: 'trash_recycling_provider', label: 'Provider', placeholder: 'Trash / recycling provider' },
  { name: 'trash_recycling_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'trash_recycling_pickup_day', label: 'Pickup day', placeholder: 'e.g. Tuesday' },
];

const HOA_FIELDS: FieldConfig[] = [
  { name: 'hoa_name', label: 'HOA name', placeholder: 'HOA name' },
  { name: 'hoa_monthly_fee', label: 'Monthly fee', type: 'currency', placeholder: '0.00' },
  { name: 'hoa_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'hoa_management_company', label: 'Management company', placeholder: 'Management company' },
  { name: 'hoa_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const SECURITY_FIELDS: FieldConfig[] = [
  { name: 'security_company_name', label: 'Security company name', placeholder: 'Security provider' },
  { name: 'security_account_number', label: 'Account number', placeholder: 'Account #' },
  { name: 'security_monitoring_phone', label: 'Monitoring phone number', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'alarm_code', label: 'Alarm code / PIN', type: 'masked', placeholder: 'Alarm code' },
  { name: 'gate_code', label: 'Gate code', type: 'masked', placeholder: 'Gate code' },
  { name: 'key_location_notes', label: 'Key location notes', type: 'textarea', placeholder: 'Special access notes', rows: 2 },
];

const ACCESS_FIELDS: FieldConfig[] = [
  { name: 'key_location', label: 'Key location', placeholder: 'Where are spare keys kept?' },
  { name: 'lockbox_code', label: 'Lockbox code', type: 'masked', placeholder: 'Lockbox code' },
  { name: 'garage_code', label: 'Garage code', type: 'masked', placeholder: 'Garage code' },
  { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Anything a survivor should know', rows: 3 },
];

const REALTOR_FIELDS: FieldConfig[] = [
  { name: 'realtor_name', label: 'Name', placeholder: 'Realtor name' },
  { name: 'realtor_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'realtor_email', label: 'Email', placeholder: 'realtor@example.com' },
  { name: 'realtor_agency', label: 'Agency', placeholder: 'Agency name' },
];

const PROPERTY_MANAGER_FIELDS: FieldConfig[] = [
  { name: 'property_manager_name', label: 'Name', placeholder: 'Manager name' },
  { name: 'property_manager_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
  { name: 'property_manager_email', label: 'Email', placeholder: 'manager@example.com' },
  { name: 'property_manager_company', label: 'Company', placeholder: 'Management company' },
];

const MAINTENANCE_FIELDS: FieldConfig[] = [
  { name: 'maintenance_contact_name', label: 'Handyman / maintenance contact', placeholder: 'Maintenance contact' },
  { name: 'maintenance_contact_phone', label: 'Phone', type: 'phone', placeholder: '(555) 123-4567' },
];

const DOCUMENT_SLOTS = [
  { category: 'mortgage_document', label: 'Mortgage Document', description: 'Loan paperwork or recent statement' },
  { category: 'insurance_card', label: 'Insurance Card', description: 'Proof of active homeowners coverage' },
  { category: 'deed', label: 'Deed', description: 'Recorded deed' },
  { category: 'title_insurance', label: 'Title Insurance', description: 'Owner or lender title policy' },
  { category: 'survey', label: 'Survey', description: 'Boundary / lot survey' },
  { category: 'home_warranty', label: 'Home Warranty', description: 'Current warranty contract' },
  { category: 'purchase_agreement', label: 'Purchase Agreement', description: 'Executed purchase contract' },
  { category: 'closing_documents', label: 'Closing Documents', description: 'Closing disclosure or settlement papers' },
  { category: 'other_property_documents', label: 'Other Property Documents', description: 'Any other property-specific paperwork' },
];

const TABLE_NAME = 'real_estate_records';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const isDraftId = (id?: string | null) => !!id && id.startsWith('draft-');

const normalizeProperty = (property: RealEstateProperty): RealEstateProperty => ({
  property_type: 'Primary Residence',
  ownership_type: 'Sole',
  has_mortgage: false,
  ...property,
});

const isFilled = (value: any) => value !== null && value !== undefined && String(value).trim() !== '';

const formatCurrencySummary = (value: any) => {
  const numeric = typeof value === 'number' ? value : Number(value);
  if (!Number.isFinite(numeric) || numeric <= 0) return null;
  return currencyFormatter.format(numeric);
};

const buildUtilitySummary = (formData: RealEstateProperty) => ({
  electric: {
    company_name: formData.electric_company_name || null,
    account_number: formData.electric_account_number || null,
    monthly_estimate: formData.electric_monthly_estimate ?? null,
    phone: formData.electric_phone || null,
  },
  gas: {
    company_name: formData.gas_company_name || null,
    account_number: formData.gas_account_number || null,
    monthly_estimate: formData.gas_monthly_estimate ?? null,
    phone: formData.gas_phone || null,
  },
  water_sewer: {
    company_name: formData.water_sewer_company_name || null,
    account_number: formData.water_sewer_account_number || null,
    monthly_estimate: formData.water_sewer_monthly_estimate ?? null,
    phone: formData.water_sewer_phone || null,
  },
  internet_cable: {
    provider: formData.internet_cable_provider || null,
    account_number: formData.internet_cable_account_number || null,
    monthly_estimate: formData.internet_cable_monthly_estimate ?? null,
    phone: formData.internet_cable_phone || null,
  },
  trash_recycling: {
    provider: formData.trash_recycling_provider || null,
    account_number: formData.trash_recycling_account_number || null,
    pickup_day: formData.trash_recycling_pickup_day || null,
  },
  hoa: {
    name: formData.hoa_name || null,
    monthly_fee: formData.hoa_monthly_fee ?? null,
    account_number: formData.hoa_account_number || null,
    management_company: formData.hoa_management_company || null,
    phone: formData.hoa_phone || null,
  },
});

const buildInsuranceSummary = (formData: RealEstateProperty) => {
  const parts = [
    formData.insurance_provider_name,
    formData.insurance_policy_number ? `Policy ${formData.insurance_policy_number}` : null,
    formData.insurance_agent_name,
  ].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
};

const buildSecuritySummary = (formData: RealEstateProperty) => {
  const parts = [
    formData.security_company_name,
    formData.security_account_number ? `Acct ${formData.security_account_number}` : null,
    formData.security_monitoring_phone,
  ].filter(Boolean);
  return parts.length ? parts.join(' • ') : null;
};

const createPersistedPayload = (formData: RealEstateProperty, packetId: string, scope: string) => {
  const payload: Record<string, any> = {
    ...formData,
    packet_id: packetId,
    scope: formData.scope || scope,
    property_label: formData.property_label?.trim() || '',
    property_type: formData.property_type || 'Primary Residence',
    ownership_type: formData.ownership_type || 'Sole',
    status: 'completed',
    is_na: false,
    utilities_account_numbers: buildUtilitySummary(formData),
    insurance_details: buildInsuranceSummary(formData),
    security_system_details: buildSecuritySummary(formData),
  };

  if (!payload.has_mortgage) {
    payload.mortgage_lender_name = null;
    payload.mortgage_account_number = null;
    payload.mortgage_monthly_payment = null;
    payload.mortgage_interest_rate = null;
    payload.mortgage_payoff_date = null;
    payload.mortgage_lender_phone = null;
    payload.mortgage_lender_website = null;
    payload.mortgage_loan_type = null;
  }

  delete payload.id;
  delete payload.created_at;
  delete payload.updated_at;

  return payload;
};

const PropertyField = ({ label, description, children }: { label: string; description?: string; children: React.ReactNode }) => (
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
      <option key={option} value={option}>
        {option}
      </option>
    ))}
  </select>
);

const PropertyInputField = ({ field, value, onChange, revealed, onToggleReveal }: FieldRendererProps) => {
  const currentValue = value ?? '';

  if (field.type === 'textarea') {
    return (
      <PropertyField label={field.label} description={field.description}>
        <Textarea
          rows={field.rows || 3}
          value={currentValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value)}
        />
      </PropertyField>
    );
  }

  if (field.type === 'select' && field.options) {
    return (
      <PropertyField label={field.label} description={field.description}>
        <NativeSelect
          value={currentValue}
          options={field.options}
          placeholder={field.placeholder}
          onChange={(nextValue) => onChange(field.name, nextValue)}
        />
      </PropertyField>
    );
  }

  if (field.type === 'masked') {
    return (
      <PropertyField label={field.label} description={field.description}>
        <div className="flex items-center gap-2">
          <Input
            type={revealed ? 'text' : 'password'}
            value={currentValue}
            placeholder={field.placeholder}
            onChange={(event) => onChange(field.name, event.target.value)}
            className="flex-1"
          />
          <Button type="button" variant="outline" size="sm" onClick={() => onToggleReveal(field.name)}>
            {revealed ? 'Hide' : 'Reveal'}
          </Button>
        </div>
      </PropertyField>
    );
  }

  if (field.type === 'number' || field.type === 'currency') {
    return (
      <PropertyField label={field.label} description={field.description}>
        <Input
          type="number"
          step={field.step || (field.type === 'currency' ? '0.01' : '1')}
          value={currentValue}
          placeholder={field.placeholder}
          onChange={(event) => onChange(field.name, event.target.value === '' ? null : Number(event.target.value))}
        />
      </PropertyField>
    );
  }

  return (
    <PropertyField label={field.label} description={field.description}>
      <Input
        type={field.type === 'date' ? 'date' : field.type === 'phone' ? 'tel' : 'text'}
        value={currentValue}
        placeholder={field.placeholder}
        onChange={(event) => onChange(field.name, event.target.value)}
      />
    </PropertyField>
  );
};

const FieldGrid = ({ fields, formData, revealedFields, onToggleReveal, onChange, columns = 'md:grid-cols-2' }: {
  fields: FieldConfig[];
  formData: RealEstateProperty;
  revealedFields: Record<string, boolean>;
  onToggleReveal: (fieldName: string) => void;
  onChange: (fieldName: string, value: any) => void;
  columns?: string;
}) => (
  <div className={cn('grid grid-cols-1 gap-4', columns)}>
    {fields.map((field) => (
      <PropertyInputField
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

const UtilityPanel = ({
  title,
  fields,
  formData,
  onChange,
  revealedFields,
  onToggleReveal,
}: {
  title: string;
  fields: FieldConfig[];
  formData: RealEstateProperty;
  onChange: (fieldName: string, value: any) => void;
  revealedFields: Record<string, boolean>;
  onToggleReveal: (fieldName: string) => void;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <div className="mb-4 flex items-center gap-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
        <Building2 className="h-4 w-4" />
      </div>
      <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    </div>
    <FieldGrid
      fields={fields}
      formData={formData}
      onChange={onChange}
      revealedFields={revealedFields}
      onToggleReveal={onToggleReveal}
    />
  </div>
);

const ContactPanel = ({
  title,
  description,
  fields,
  formData,
  onChange,
  revealedFields,
  onToggleReveal,
}: {
  title: string;
  description: string;
  fields: FieldConfig[];
  formData: RealEstateProperty;
  onChange: (fieldName: string, value: any) => void;
  revealedFields: Record<string, boolean>;
  onToggleReveal: (fieldName: string) => void;
}) => (
  <div className="rounded-2xl border border-border bg-card p-4 shadow-sm">
    <h4 className="text-sm font-semibold text-foreground">{title}</h4>
    <p className="mb-4 mt-1 text-xs text-muted-foreground">{description}</p>
    <FieldGrid
      fields={fields}
      formData={formData}
      onChange={onChange}
      revealedFields={revealedFields}
      onToggleReveal={onToggleReveal}
    />
  </div>
);

const SummaryPill = ({ label }: { label: string }) => (
  <span className="rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
    {label}
  </span>
);

export const createEmptyRealEstateProperty = (scope: string): RealEstateProperty => ({
  id: `draft-${crypto.randomUUID()}`,
  scope,
  property_label: '',
  property_type: 'Primary Residence',
  ownership_type: 'Sole',
  has_mortgage: false,
  notes: '',
});

export const RealEstatePropertyCard: React.FC<PropertyCardProps> = ({
  packetId,
  scope,
  property,
  expanded,
  onToggle,
  onSaved,
  onDeleted,
  onCancelDraft,
}) => {
  const confirm = useConfirm();
  const { bumpCompletion } = useAppContext();
  const [formData, setFormData] = useState<RealEstateProperty>(() => normalizeProperty(property));
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [hasChanges, setHasChanges] = useState(isDraftId(property.id));
  const [revealedFields, setRevealedFields] = useState<Record<string, boolean>>({});

  useEffect(() => {
    setFormData(normalizeProperty(property));
    setHasChanges(isDraftId(property.id));
  }, [property.id, property.updated_at]);

  const summary = useMemo(() => {
    const bits = [
      formData.property_type,
      formData.ownership_type,
      formatCurrencySummary(formData.estimated_value),
      formData.has_mortgage ? 'Mortgage on file' : 'No mortgage',
    ].filter(Boolean) as string[];

    return bits;
  }, [formData]);

  const savedPropertyId = isDraftId(formData.id) ? null : formData.id;

  const setFieldValue = (fieldName: string, value: any) => {
    setFormData((current) => ({ ...current, [fieldName]: value }));
    setHasChanges(true);
  };

  const toggleReveal = (fieldName: string) => {
    setRevealedFields((current) => ({ ...current, [fieldName]: !current[fieldName] }));
  };

  const handleSave = async () => {
    if (!formData.property_label?.trim()) {
      toast.error('Property nickname / label is required.', { duration: 5000, position: 'bottom-center' });
      return;
    }

    setSaving(true);
    try {
      const payload = createPersistedPayload(formData, packetId, scope);
      const table = (supabase as any).from(TABLE_NAME);

      const result = savedPropertyId
        ? await table.update(payload).eq('id', savedPropertyId).select().single()
        : await table.insert(payload).select().single();

      if (result.error) {
        throw result.error;
      }

      const savedRecord = normalizeProperty(result.data as RealEstateProperty);
      const wasNewRecord = isDraftId(property.id);
      setFormData(savedRecord);
      setHasChanges(false);
      onSaved(savedRecord, wasNewRecord ? property.id : undefined);
      bumpCompletion();
      toast.success(`${savedRecord.property_label || 'Property'} saved.`, {
        duration: 3000,
        position: 'bottom-center',
      });
      // Collapse on save for new records; keep open when editing existing.
      if (wasNewRecord && expanded) onToggle();
    } catch (error: any) {
      console.error('Failed to save property', error);
      toast.error(`Failed to save property: ${error?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (isDraftId(property.id)) {
      onCancelDraft(property.id);
      return;
    }

    const confirmed = await confirm({
      title: 'Delete this property?',
      description: `Delete "${formData.property_label || 'this property'}" and all attached details? This cannot be undone.`,
      confirmLabel: 'Delete',
    });

    if (!confirmed) return;

    setDeleting(true);
    try {
      const table = (supabase as any).from(TABLE_NAME);
      const { error } = await table.delete().eq('id', property.id);
      if (error) throw error;

      onDeleted(property.id);
      bumpCompletion();
      toast.success('Property deleted.', { duration: 3000, position: 'bottom-center' });
    } catch (error: any) {
      console.error('Failed to delete property', error);
      toast.error(`Failed to delete property: ${error?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <article className="paper-sheet overflow-hidden border border-border bg-card">
      <div className="flex items-start gap-3 px-5 py-4">
        <button type="button" onClick={onToggle} className="flex flex-1 items-start gap-4 text-left">
          <div className="mt-1 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <Home className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="text-base font-semibold text-foreground">
                {formData.property_label || 'New Property'}
              </h3>
              {isDraftId(property.id) ? <SummaryPill label="Unsaved" /> : null}
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <MapPin className="h-4 w-4 shrink-0" />
              <span className="truncate">{formData.address || 'Full address not added yet'}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {summary.map((item) => (
                <SummaryPill key={item} label={item} />
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
          <Accordion type="multiple" defaultValue={['basic', 'mortgage', 'insurance']} className="space-y-3">
            <AccordionItem value="basic" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Basic Info
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid
                  fields={BASIC_FIELDS}
                  formData={formData}
                  onChange={setFieldValue}
                  revealedFields={revealedFields}
                  onToggleReveal={toggleReveal}
                />
                <AIValuationPanel
                  variant="real_estate"
                  enabled={Boolean(String(formData.address || '').trim().length >= 5)}
                  disabledHint="Enter the property's full address to use AI estimation."
                  input={() => ({
                    property_type: formData.property_type ?? undefined,
                    address: formData.address ?? '',
                    year_built: formData.year_purchased ?? undefined,
                  })}
                  onAccept={(v) => setFieldValue('estimated_value', v)}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="mortgage" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Mortgage
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="flex items-center justify-between rounded-2xl border border-border bg-card px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Has mortgage</p>
                    <p className="text-xs text-muted-foreground">Turn this on to capture lender and loan details.</p>
                  </div>
                  <Switch checked={!!formData.has_mortgage} onCheckedChange={(checked) => setFieldValue('has_mortgage', checked)} />
                </div>
                {formData.has_mortgage ? (
                  <>
                    <FieldGrid
                      fields={MORTGAGE_FIELDS}
                      formData={formData}
                      onChange={setFieldValue}
                      revealedFields={revealedFields}
                      onToggleReveal={toggleReveal}
                    />
                    <RecordDocumentUpload
                      packetId={packetId}
                      relatedTable={TABLE_NAME}
                      relatedRecordId={savedPropertyId}
                      category="mortgage_document"
                      label="Mortgage Document Upload"
                      description="Upload the mortgage statement, note, or loan paperwork attached to this property."
                    />
                  </>
                ) : (
                  <p className="text-sm text-muted-foreground">No mortgage details needed for this property.</p>
                )}
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="insurance" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Insurance
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid
                  fields={INSURANCE_FIELDS}
                  formData={formData}
                  onChange={setFieldValue}
                  revealedFields={revealedFields}
                  onToggleReveal={toggleReveal}
                />
                <RecordDocumentUpload
                  packetId={packetId}
                  relatedTable={TABLE_NAME}
                  relatedRecordId={savedPropertyId}
                  category="insurance_card"
                  label="Insurance Card Upload"
                  description="Attach the homeowners insurance card or proof of coverage for this property."
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="video" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Home Inventory Video
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-3 flex items-start gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
                      <Video className="h-5 w-5" />
                    </div>
                    <div>
                      <h4 className="text-sm font-semibold text-foreground">Record one video per property</h4>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Walk through each room and narrate what you own. Insurance companies require video documentation to process fire, theft, or flood claims.
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Accepted formats: video/mp4, video/quicktime, video/* · Max 500MB.
                      </p>
                    </div>
                  </div>
                  {savedPropertyId ? (
                    <HomeInventoryVideo packetId={packetId} propertyRecordId={savedPropertyId} scope={scope} />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-background px-4 py-3 text-sm text-muted-foreground">
                      Save this property first to attach the home inventory video.
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="utilities" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Utilities
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  <UtilityPanel title="Electric" fields={ELECTRIC_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                  <UtilityPanel title="Gas" fields={GAS_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                  <UtilityPanel title="Water / Sewer" fields={WATER_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                  <UtilityPanel title="Internet / Cable" fields={INTERNET_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                  <UtilityPanel title="Trash / Recycling" fields={TRASH_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                  <UtilityPanel title="HOA" fields={HOA_FIELDS} formData={formData} onChange={setFieldValue} revealedFields={revealedFields} onToggleReveal={toggleReveal} />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="security" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Security
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid
                  fields={SECURITY_FIELDS}
                  formData={formData}
                  onChange={setFieldValue}
                  revealedFields={revealedFields}
                  onToggleReveal={toggleReveal}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="access" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Access & Other
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <FieldGrid
                  fields={ACCESS_FIELDS}
                  formData={formData}
                  onChange={setFieldValue}
                  revealedFields={revealedFields}
                  onToggleReveal={toggleReveal}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contacts" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Contacts Attached to This Property
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                  <ContactPanel
                    title="Realtor"
                    description="Keep the listing or purchase contact with this property instead of as a standalone entry."
                    fields={REALTOR_FIELDS}
                    formData={formData}
                    onChange={setFieldValue}
                    revealedFields={revealedFields}
                    onToggleReveal={toggleReveal}
                  />
                  <ContactPanel
                    title="Property Manager"
                    description="Use this for rentals or any property with a dedicated manager."
                    fields={PROPERTY_MANAGER_FIELDS}
                    formData={formData}
                    onChange={setFieldValue}
                    revealedFields={revealedFields}
                    onToggleReveal={toggleReveal}
                  />
                  <ContactPanel
                    title="Handyman / Maintenance"
                    description="Keep the most relevant maintenance contact attached to the property card."
                    fields={MAINTENANCE_FIELDS}
                    formData={formData}
                    onChange={setFieldValue}
                    revealedFields={revealedFields}
                    onToggleReveal={toggleReveal}
                  />
                </div>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="documents" className="rounded-2xl border border-border bg-background px-4">
              <AccordionTrigger className="text-sm font-semibold text-foreground hover:no-underline">
                Documents Attached to This Property
              </AccordionTrigger>
              <AccordionContent className="space-y-4 pb-4">
                <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                  {DOCUMENT_SLOTS.map((slot) => (
                    <RecordDocumentUpload
                      key={slot.category}
                      packetId={packetId}
                      relatedTable={TABLE_NAME}
                      relatedRecordId={savedPropertyId}
                      category={slot.category}
                      label={slot.label}
                      description={slot.description}
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
                {savedPropertyId
                  ? 'Documents and video uploads stay attached to this property record.'
                  : 'Save this property once to unlock document and video attachments.'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {isDraftId(property.id) ? (
                <Button type="button" variant="outline" onClick={() => onCancelDraft(property.id)} disabled={saving || deleting}>
                  Remove Draft
                </Button>
              ) : null}
              <Button type="button" onClick={handleSave} disabled={saving || deleting || !hasChanges}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                Save Property
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </article>
  );
};