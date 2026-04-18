import { supabase } from '@/integrations/supabase/client';

export type MedicalRecordType = 'emergency' | 'doctor' | 'insurance' | 'allergy' | 'surgery';

export const MEDICAL_RECORD_TYPES: MedicalRecordType[] = [
  'emergency', 'doctor', 'insurance', 'allergy', 'surgery',
];

export const MEDICAL_TYPE_LABELS: Record<MedicalRecordType, string> = {
  emergency: 'Emergency Medical Info',
  doctor: 'Doctor / Provider',
  insurance: 'Health Insurance',
  allergy: 'Allergy',
  surgery: 'Surgical / Procedure History',
};

export interface MedicalRecord {
  id: string;
  packet_id: string;
  scope: string | null;
  record_type: MedicalRecordType | string;
  provider_name: string;
  details: Record<string, any>;
  notes: string | null;
  legacy_notes: string | null;
  expiry_date: string | null;          // insurance renewal
  next_appointment_date: string | null; // doctor next appt
  status: string | null;
  // Top-level legacy columns we still surface for the Emergency card
  blood_type: string | null;
  organ_donor: boolean | null;
  dnr_status: string | null;
  allergies: string | null;
  conditions: string | null;
  // Doctor extras (legacy top-level)
  specialty: string | null;
  phone: string | null;
  address: string | null;
  // Insurance extras (legacy top-level)
  insurance_provider: string | null;
  insurance_member_id: string | null;
  insurance_group_number: string | null;
  insurance_phone: string | null;
  member_id: string | null;
  group_number: string | null;
  insurance_renewal_date: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface MedicationRecord {
  id: string;
  packet_id: string;
  scope: string | null;
  name: string;
  dose: string | null;
  dose_unit: string | null;
  frequency: string | null;
  route: string | null;
  condition_treated: string | null;
  prescribing_doctor: string | null;
  pharmacy: string | null;
  pharmacy_phone: string | null;
  prescription_number: string | null;
  refill_due_date: string | null;
  is_generic_available: boolean | null;
  is_critical: boolean;
  side_effects: string | null;
  special_instructions: string | null;
  notes: string | null;
  legacy_notes: string | null;
  details: Record<string, any>;
  status: string | null;
  created_at?: string;
  updated_at?: string;
}

export const medicalService = {
  // ---------- medical_records (everything except medications) ----------
  async list(packetId: string, scope?: string): Promise<MedicalRecord[]> {
    let q = supabase
      .from('medical_records')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: true });
    if (scope) q = q.eq('scope', scope);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as MedicalRecord[];
  },

  async upsert(record: Partial<MedicalRecord> & { packet_id: string; record_type: string; scope: string }) {
    const payload: any = {
      packet_id: record.packet_id,
      scope: record.scope,
      record_type: record.record_type,
      provider_name: record.provider_name || (record.record_type === 'emergency' ? 'Emergency Medical Info' : ''),
      details: record.details ?? {},
      notes: record.notes ?? null,
      legacy_notes: record.legacy_notes ?? null,
      expiry_date: record.expiry_date ?? null,
      next_appointment_date: record.next_appointment_date ?? null,
      blood_type: record.blood_type ?? null,
      organ_donor: record.organ_donor ?? null,
      dnr_status: record.dnr_status ?? null,
      allergies: record.allergies ?? null,
      conditions: record.conditions ?? null,
      specialty: record.specialty ?? null,
      phone: record.phone ?? null,
      address: record.address ?? null,
      insurance_provider: record.insurance_provider ?? null,
      insurance_member_id: record.insurance_member_id ?? null,
      insurance_group_number: record.insurance_group_number ?? null,
      insurance_phone: record.insurance_phone ?? null,
      member_id: record.member_id ?? null,
      group_number: record.group_number ?? null,
      insurance_renewal_date: record.insurance_renewal_date ?? null,
      status: record.status ?? 'completed',
    };

    if (record.id && !String(record.id).startsWith('draft-')) {
      const { data, error } = await supabase
        .from('medical_records')
        .update(payload)
        .eq('id', record.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MedicalRecord;
    }

    const { data, error } = await supabase
      .from('medical_records')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as MedicalRecord;
  },

  async remove(id: string) {
    const { error } = await supabase.from('medical_records').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- medications ----------
  async listMedications(packetId: string, scope?: string): Promise<MedicationRecord[]> {
    let q = supabase
      .from('medications')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: true });
    if (scope) q = q.eq('scope', scope);
    const { data, error } = await q;
    if (error) throw error;
    return (data || []) as unknown as MedicationRecord[];
  },

  async upsertMedication(record: Partial<MedicationRecord> & { packet_id: string; scope: string }) {
    const payload: any = {
      packet_id: record.packet_id,
      scope: record.scope,
      name: record.name || 'Medication',
      dose: record.dose ?? null,
      dose_unit: record.dose_unit ?? null,
      frequency: record.frequency ?? null,
      route: record.route ?? null,
      condition_treated: record.condition_treated ?? null,
      prescribing_doctor: record.prescribing_doctor ?? null,
      pharmacy: record.pharmacy ?? null,
      pharmacy_phone: record.pharmacy_phone ?? null,
      prescription_number: record.prescription_number ?? null,
      refill_due_date: record.refill_due_date ?? null,
      is_generic_available: record.is_generic_available ?? null,
      is_critical: !!record.is_critical,
      side_effects: record.side_effects ?? null,
      special_instructions: record.special_instructions ?? null,
      notes: record.notes ?? null,
      legacy_notes: record.legacy_notes ?? null,
      details: record.details ?? {},
      status: record.status ?? 'completed',
    };

    if (record.id && !String(record.id).startsWith('draft-')) {
      const { data, error } = await supabase
        .from('medications')
        .update(payload)
        .eq('id', record.id)
        .select()
        .single();
      if (error) throw error;
      return data as unknown as MedicationRecord;
    }

    const { data, error } = await supabase
      .from('medications')
      .insert(payload)
      .select()
      .single();
    if (error) throw error;
    return data as unknown as MedicationRecord;
  },

  async removeMedication(id: string) {
    const { error } = await supabase.from('medications').delete().eq('id', id);
    if (error) throw error;
  },

  // ---------- cross-section sync ----------
  /** Sync organ donor flag from Emergency card → Identity Driver's License. */
  async syncOrganDonorToIdentity(packetId: string, scope: string, organDonor: boolean | null) {
    if (organDonor === null) return;
    const { data: lic } = await supabase
      .from('info_records')
      .select('id, details')
      .eq('packet_id', packetId)
      .eq('scope', scope)
      .eq('category', 'drivers_license')
      .maybeSingle();
    if (!lic?.id) return;
    const newDetails = { ...(lic.details as any || {}), organ_donor: organDonor ? 'yes' : 'no' };
    await supabase.from('info_records').update({ details: newDetails }).eq('id', lic.id);
  },
};
