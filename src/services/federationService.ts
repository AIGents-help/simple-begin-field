/**
 * Cross-section data federation service.
 *
 * One read-side helper that gathers federated source values for a packet:
 *   - Home address  (Real Estate primary residence, fallback first property)
 *   - Spouse        (Family member with relationship='Spouse', not deceased)
 *   - Children      (Family members with relationship='Child' or 'Grandchild')
 *   - Attorney      (Advisor with advisor_type='Attorney')
 *   - Financial advisor (Advisor with advisor_type='Financial Advisor')
 *   - Primary doctor (First medical record provider)
 *   - Funeral home  (Funeral record funeral_home / phone / email)
 *
 * Pure read layer — destination forms / hooks decide which values to apply.
 */
import { supabase } from '@/integrations/supabase/client';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_FAMILY_MEMBERS, DEMO_ADVISORS, DEMO_MEDICAL_RECORDS, DEMO_FUNERAL, DEMO_REAL_ESTATE } from '../demo/morganFamilyData';

export type FederationSources = {
  homeAddress: string | null;
  spouse: {
    id: string;
    name: string;
    first_name?: string | null;
    last_name?: string | null;
    address?: string | null;
  } | null;
  children: Array<{ id: string; name: string }>;
  attorney: {
    id: string;
    name: string;
    firm?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  financialAdvisor: {
    id: string;
    name: string;
    firm?: string | null;
    phone?: string | null;
    email?: string | null;
  } | null;
  primaryDoctor: {
    id: string;
    name: string;
    phone?: string | null;
  } | null;
  funeralHome: {
    name: string | null;
    phone: string | null;
    email: string | null;
  } | null;
};

export const EMPTY_FEDERATION_SOURCES: FederationSources = {
  homeAddress: null,
  spouse: null,
  children: [],
  attorney: null,
  financialAdvisor: null,
  primaryDoctor: null,
  funeralHome: null,
};

/**
 * Fetches all federated source values for a packet in parallel.
 * Returns a stable object — missing sources are null/[] not undefined.
 */
export async function loadFederationSources(packetId: string): Promise<FederationSources> {
  if (!packetId) return EMPTY_FEDERATION_SOURCES;
  if (isDemoMode()) {
    const properties = DEMO_REAL_ESTATE as any[];
    const family = DEMO_FAMILY_MEMBERS as any[];
    const advisors = DEMO_ADVISORS as any[];
    const medical = DEMO_MEDICAL_RECORDS as any[];
    const funeral = DEMO_FUNERAL as any[];

    const primary = properties.find((p) => p.property_type === 'primary_residence' && p.address?.trim()) || properties.find((p) => p.address?.trim());
    const homeAddress = primary?.address?.trim() || null;
    const spouseRow = family.find((f) => String(f.relationship || '').toLowerCase() === 'spouse' && !f.is_deceased) || null;
    const spouse = spouseRow ? {
      id: spouseRow.id,
      name: spouseRow.name || `${spouseRow.first_name || ''} ${spouseRow.last_name || ''}`.trim(),
      first_name: spouseRow.first_name,
      last_name: spouseRow.last_name,
      address: spouseRow.address || null,
    } : null;
    const children = family
      .filter((f) => {
        const rel = String(f.relationship || '').toLowerCase();
        return (rel === 'child' || rel === 'grandchild') && !f.is_deceased;
      })
      .map((f) => ({ id: f.id, name: f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim() }))
      .filter((c) => !!c.name);
    const attorneyRow = advisors.find((a) => String(a.advisor_type || '').toLowerCase().includes('attorney')) || null;
    const financialAdvisorRow = advisors.find((a) => String(a.advisor_type || '').toLowerCase().includes('financial')) || null;
    const doctorRow = medical.find((m) => String(m.record_type || '').toLowerCase() === 'doctor' && String(m.specialty || '').toLowerCase().includes('primary'))
      || medical.find((m) => String(m.record_type || '').toLowerCase() === 'doctor')
      || null;
    const funeralRow = funeral.find((f) => String(f.category || '').toLowerCase() === 'funeral_home') || null;

    return {
      homeAddress,
      spouse,
      children,
      attorney: attorneyRow ? { id: attorneyRow.id, name: attorneyRow.name || '', firm: attorneyRow.firm, phone: attorneyRow.phone, email: attorneyRow.email } : null,
      financialAdvisor: financialAdvisorRow ? { id: financialAdvisorRow.id, name: financialAdvisorRow.name || '', firm: financialAdvisorRow.firm, phone: financialAdvisorRow.phone, email: financialAdvisorRow.email } : null,
      primaryDoctor: doctorRow ? { id: doctorRow.id, name: doctorRow.name || doctorRow.provider_name || '', phone: doctorRow.phone } : null,
      funeralHome: funeralRow ? { name: funeralRow.title || funeralRow.funeral_home || null, phone: funeralRow.funeral_home_phone || null, email: funeralRow.funeral_home_email || null } : null,
    };
  }

  const [
    realEstateRes,
    familyRes,
    advisorsRes,
    medicalRes,
    funeralRes,
  ] = await Promise.all([
    supabase
      .from('real_estate_records')
      .select('id, address, property_type, property_label, created_at')
      .eq('packet_id', packetId),
    supabase
      .from('family_members')
      .select('id, name, first_name, last_name, relationship, address, is_deceased, created_at')
      .eq('packet_id', packetId),
    supabase
      .from('advisor_records')
      .select('id, name, firm, phone, email, advisor_type, advisor_status, created_at')
      .eq('packet_id', packetId),
    supabase
      .from('medical_records')
      .select('id, provider_name, phone, specialty, created_at')
      .eq('packet_id', packetId),
    supabase
      .from('funeral_records')
      .select('id, funeral_home, funeral_home_phone, funeral_home_email, created_at')
      .eq('packet_id', packetId),
  ]);

  // ---- Home address ----
  const properties = (realEstateRes.data as any[]) || [];
  const primary = properties.find((p) => p.property_type === 'Primary Residence' && p.address?.trim()) ||
                  properties.find((p) => p.address?.trim());
  const homeAddress = primary?.address?.trim() || null;

  // ---- Spouse (alive, prefer most recent) ----
  const family = (familyRes.data as any[]) || [];
  const spouseRow = family
    .filter((f) => String(f.relationship || '').toLowerCase() === 'spouse' && !f.is_deceased)
    .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null;
  const spouse = spouseRow ? {
    id: spouseRow.id,
    name: spouseRow.name || `${spouseRow.first_name || ''} ${spouseRow.last_name || ''}`.trim(),
    first_name: spouseRow.first_name,
    last_name: spouseRow.last_name,
    address: spouseRow.address || null,
  } : null;

  // ---- Children (any age, alive) ----
  const children = family
    .filter((f) => {
      const rel = String(f.relationship || '').toLowerCase();
      return (rel === 'child' || rel === 'grandchild') && !f.is_deceased;
    })
    .map((f) => ({
      id: f.id,
      name: f.name || `${f.first_name || ''} ${f.last_name || ''}`.trim(),
    }))
    .filter((c) => !!c.name);

  // ---- Advisors ----
  const advisors = (advisorsRes.data as any[]) || [];
  const activeAdvisors = advisors.filter((a) => a.advisor_status !== 'former' && a.advisor_status !== 'deceased');
  const findAdvisor = (type: string) =>
    activeAdvisors
      .filter((a) => String(a.advisor_type || '').toLowerCase() === type.toLowerCase())
      .sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')))[0] || null;

  const attorneyRow = findAdvisor('Attorney');
  const financialAdvisorRow = findAdvisor('Financial Advisor');

  const attorney = attorneyRow ? {
    id: attorneyRow.id,
    name: attorneyRow.name || '',
    firm: attorneyRow.firm,
    phone: attorneyRow.phone,
    email: attorneyRow.email,
  } : null;

  const financialAdvisor = financialAdvisorRow ? {
    id: financialAdvisorRow.id,
    name: financialAdvisorRow.name || '',
    firm: financialAdvisorRow.firm,
    phone: financialAdvisorRow.phone,
    email: financialAdvisorRow.email,
  } : null;

  // ---- Primary doctor (first medical provider, prefer "Primary Care") ----
  const medical = (medicalRes.data as any[]) || [];
  const doctorRow = medical.find((m) => String(m.specialty || '').toLowerCase().includes('primary')) || medical[0] || null;
  const primaryDoctor = doctorRow ? {
    id: doctorRow.id,
    name: doctorRow.provider_name || '',
    phone: doctorRow.phone,
  } : null;

  // ---- Funeral home ----
  const funeral = (funeralRes.data as any[]) || [];
  const funeralRow = funeral.find((f) => f.funeral_home?.trim()) || null;
  const funeralHome = funeralRow ? {
    name: funeralRow.funeral_home?.trim() || null,
    phone: funeralRow.funeral_home_phone || null,
    email: funeralRow.funeral_home_email || null,
  } : null;

  return {
    homeAddress,
    spouse,
    children,
    attorney,
    financialAdvisor,
    primaryDoctor,
    funeralHome,
  };
}

// ---------------------------------------------------------------------------
// Field-level federation rules — destination field → source descriptor.
//
// Each rule says: "for this section + field, look up `getValue(sources)` and
// pre-fill if the field is empty. Show 'Auto-filled from {sourceLabel}'."
// Multiple rules per field ARE allowed (first non-empty wins).
// ---------------------------------------------------------------------------

export type FederationRule = {
  /** Section id (matches SectionId) */
  section: string;
  /** Form field name on the destination record */
  field: string;
  /** Where the value came from, shown in the chip */
  sourceLabel: string;
  /** Pull the suggested value from the source bundle */
  getValue: (sources: FederationSources) => string | null;
};

export const FEDERATION_RULES: FederationRule[] = [
  // ---- Home address ----
  {
    section: 'real-estate',
    field: 'address',
    sourceLabel: 'Profile',
    getValue: (s) => s.homeAddress, // no-op once a property exists, but covers spouse/parent address fallbacks
  },
  {
    section: 'family',
    field: 'address',
    sourceLabel: 'Home address',
    getValue: (s) => s.homeAddress,
  },
  {
    section: 'vehicles',
    field: 'garaging_address',
    sourceLabel: 'Home address',
    getValue: (s) => s.homeAddress,
  },
  // ---- Spouse name → joint owner / beneficiary ----
  {
    section: 'real-estate',
    field: 'joint_owner_name',
    sourceLabel: 'Spouse',
    getValue: (s) => s.spouse?.name || null,
  },
  {
    section: 'banking',
    field: 'joint_account_holder',
    sourceLabel: 'Spouse',
    getValue: (s) => s.spouse?.name || null,
  },
  {
    section: 'banking',
    field: 'beneficiary_notes',
    sourceLabel: 'Spouse',
    getValue: (s) => s.spouse?.name ? `Primary beneficiary: ${s.spouse.name}` : null,
  },
  {
    section: 'retirement',
    field: 'beneficiary_notes',
    sourceLabel: 'Spouse',
    getValue: (s) => s.spouse?.name ? `Primary beneficiary: ${s.spouse.name}` : null,
  },
  // ---- Attorney → Funeral / Legal ----
  {
    section: 'funeral',
    field: 'attorney_to_notify',
    sourceLabel: 'Advisors → Attorney',
    getValue: (s) => s.attorney ? [s.attorney.name, s.attorney.firm, s.attorney.phone].filter(Boolean).join(' • ') : null,
  },
  // ---- Financial Advisor → Retirement / Banking ----
  {
    section: 'retirement',
    field: 'contact_info',
    sourceLabel: 'Advisors → Financial Advisor',
    getValue: (s) => s.financialAdvisor ? [s.financialAdvisor.name, s.financialAdvisor.firm, s.financialAdvisor.phone].filter(Boolean).join(' • ') : null,
  },
  {
    section: 'banking',
    field: 'contact_info',
    sourceLabel: 'Advisors → Financial Advisor',
    getValue: (s) => s.financialAdvisor ? [s.financialAdvisor.name, s.financialAdvisor.firm, s.financialAdvisor.phone].filter(Boolean).join(' • ') : null,
  },
  // ---- Primary doctor → Medical insurance referring physician ----
  {
    section: 'medical',
    field: 'referring_physician',
    sourceLabel: 'Medical → Primary Care',
    getValue: (s) => s.primaryDoctor?.name || null,
  },
];

export type AppliedFederation = {
  /** field-name → label of source (for chip rendering) */
  origins: Record<string, string>;
  /** new form data with empty federated fields filled in */
  data: Record<string, any>;
};

/**
 * Apply federation defaults to a form for a given section.
 * - Only fills fields that are currently empty (null / '' / undefined).
 * - Returns the filled data + a map of which fields were auto-filled.
 */
export function applyFederationDefaults<T extends Record<string, any>>(
  section: string,
  formData: T,
  sources: FederationSources,
  isExistingRecord: boolean,
): AppliedFederation {
  // Don't overwrite anything on an existing saved record — only fresh "Add" forms.
  if (isExistingRecord) return { origins: {}, data: formData };

  const origins: Record<string, string> = {};
  const data: Record<string, any> = { ...formData };

  for (const rule of FEDERATION_RULES) {
    if (rule.section !== section) continue;
    const current = data[rule.field];
    const isEmpty = current === null || current === undefined || String(current).trim() === '';
    if (!isEmpty) continue;
    const suggested = rule.getValue(sources);
    if (suggested && String(suggested).trim() !== '') {
      data[rule.field] = suggested;
      origins[rule.field] = rule.sourceLabel;
    }
  }

  return { origins, data };
}
