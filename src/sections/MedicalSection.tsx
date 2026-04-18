import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import { medicalService, MedicalRecord, MedicationRecord } from '../services/medicalService';
import { EmergencyMedicalCard } from '../components/medical/EmergencyMedicalCard';
import { DoctorCard } from '../components/medical/DoctorCard';
import { HealthInsuranceCard } from '../components/medical/HealthInsuranceCard';
import { MedicationCard } from '../components/medical/MedicationCard';
import { AllergyCard } from '../components/medical/AllergyCard';
import { SurgicalHistoryCard } from '../components/medical/SurgicalHistoryCard';
import { daysUntil } from '../components/medical/MedicalCardShell';
import { LegacyMedicalRecordCard, isLegacyMedicalRecord } from '../components/medical/LegacyMedicalRecordCard';

const draftMedical = (record_type: MedicalRecord['record_type'], scope: string, defaults: Partial<MedicalRecord> = {}): MedicalRecord => ({
  id: `draft-${crypto.randomUUID()}`,
  packet_id: '',
  scope,
  record_type,
  provider_name: '',
  details: {},
  notes: null,
  legacy_notes: null,
  expiry_date: null,
  next_appointment_date: null,
  blood_type: null,
  organ_donor: null,
  dnr_status: null,
  allergies: null,
  conditions: null,
  specialty: null,
  phone: null,
  address: null,
  insurance_provider: null,
  insurance_member_id: null,
  insurance_group_number: null,
  insurance_phone: null,
  member_id: null,
  group_number: null,
  insurance_renewal_date: null,
  status: 'completed',
  ...defaults,
});

const draftMedication = (scope: string): MedicationRecord => ({
  id: `draft-${crypto.randomUUID()}`,
  packet_id: '',
  scope,
  name: '',
  dose: null,
  dose_unit: null,
  frequency: null,
  route: null,
  condition_treated: null,
  prescribing_doctor: null,
  pharmacy: null,
  pharmacy_phone: null,
  prescription_number: null,
  refill_due_date: null,
  is_generic_available: null,
  is_critical: false,
  side_effects: null,
  special_instructions: null,
  notes: null,
  legacy_notes: null,
  details: {},
  status: 'completed',
});

interface Props {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: (newRecord?: any) => void) => void;
}

export const MedicalSection: React.FC<Props> = ({ onRefresh }) => {
  const { currentPacket, activeScope, setView } = useAppContext();
  const scope = activeScope || 'personA';
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [meds, setMeds] = useState<MedicationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchAll = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    try {
      const [r, m] = await Promise.all([
        medicalService.list(currentPacket.id, scope),
        medicalService.listMedications(currentPacket.id, scope),
      ]);
      setRecords(r);
      setMeds(m);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [currentPacket?.id, scope]);

  useEffect(() => { fetchAll(); }, [fetchAll]);
  useEffect(() => { onRefresh?.(() => fetchAll()); }, [onRefresh, fetchAll]);

  // Ensure exactly one Emergency Medical Info card always exists in the list (real or draft).
  const emergencyCard = useMemo<MedicalRecord>(() => {
    const existing = records.find((r) => r.record_type === 'emergency');
    return existing || draftMedical('emergency', scope, { provider_name: 'Emergency Medical Info' });
  }, [records, scope]);

  const legacyRecords = useMemo(() => records.filter((r) => isLegacyMedicalRecord(r)), [records]);
  const doctors = useMemo(() => records.filter((r) => r.record_type === 'doctor' && !isLegacyMedicalRecord(r)), [records]);
  const insurances = useMemo(() => records.filter((r) => r.record_type === 'insurance' && !isLegacyMedicalRecord(r)), [records]);
  const allergies = useMemo(() => records.filter((r) => r.record_type === 'allergy' && !isLegacyMedicalRecord(r)), [records]);
  const surgeries = useMemo(() => records.filter((r) => r.record_type === 'surgery' && !isLegacyMedicalRecord(r)), [records]);

  // Insurance expiry alerts (within 60 days)
  const expiringInsurance = useMemo(
    () => insurances.filter((i) => {
      const d = daysUntil(i.expiry_date || i.insurance_renewal_date);
      return d !== null && d <= 60;
    }),
    [insurances],
  );

  const addRecord = (rt: MedicalRecord['record_type']) => {
    const draft = draftMedical(rt, scope);
    setRecords((prev) => [...prev, draft]);
    setExpandedId(draft.id);
  };

  const addMedication = () => {
    const draft = draftMedication(scope);
    setMeds((prev) => [...prev, draft]);
    setExpandedId(draft.id);
  };

  const handleSavedRecord = (saved: MedicalRecord, prevDraftId?: string) => {
    setRecords((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.id === (prevDraftId || saved.id));
      if (idx >= 0) next[idx] = saved; else next.push(saved);
      return next;
    });
    setExpandedId(saved.id);
  };

  const handleSavedMed = (saved: MedicationRecord, prevDraftId?: string) => {
    setMeds((prev) => {
      const next = [...prev];
      const idx = next.findIndex((r) => r.id === (prevDraftId || saved.id));
      if (idx >= 0) next[idx] = saved; else next.push(saved);
      return next;
    });
    setExpandedId(saved.id);
  };

  const handleDeletedRecord = (id: string) =>
    setRecords((prev) => prev.filter((r) => r.id !== id));
  const handleDeletedMed = (id: string) =>
    setMeds((prev) => prev.filter((r) => r.id !== id));
  const handleCancelDraftRecord = (id: string) => handleDeletedRecord(id);
  const handleCancelDraftMed = (id: string) => handleDeletedMed(id);

  const handleFindPro = (_query: string) => setView('directory');

  const toggleExpand = (id: string) => setExpandedId((cur) => (cur === id ? null : id));

  if (!currentPacket?.id) {
    return <div className="p-6 text-stone-500">Open a packet to manage medical info.</div>;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16 text-stone-500">
        <Loader2 className="animate-spin mr-2" size={18} /> Loading medical info…
      </div>
    );
  }

  const Group: React.FC<{ title: string; count: number; onAdd: () => void; addLabel: string; children: React.ReactNode }> = ({
    title, count, onAdd, addLabel, children,
  }) => (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">{title} {count > 0 && <span className="text-stone-400">({count})</span>}</h3>
        <button
          onClick={onAdd}
          className="text-[11px] font-bold uppercase tracking-wider text-navy-muted hover:underline flex items-center gap-1"
        >
          <Plus size={12} /> {addLabel}
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </section>
  );

  return (
    <div className="space-y-6">
      {expiringInsurance.length > 0 && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 flex items-start gap-3">
          <AlertTriangle className="text-amber-600 shrink-0 mt-0.5" size={18} />
          <div className="flex-1 text-sm">
            <p className="font-bold text-amber-900">
              {expiringInsurance.length} health insurance {expiringInsurance.length === 1 ? 'plan' : 'plans'} renewing soon
            </p>
            <p className="text-xs text-amber-800 mt-0.5">
              {expiringInsurance.map((i) => i.insurance_provider || 'Plan').join(', ')}
            </p>
          </div>
        </div>
      )}

      {/* Pinned Emergency Card */}
      <section className="space-y-3">
        <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Pinned</h3>
        <EmergencyMedicalCard
          record={emergencyCard}
          packetId={currentPacket.id}
          scope={scope}
          expanded={expandedId === emergencyCard.id}
          onToggle={() => toggleExpand(emergencyCard.id)}
          onSaved={(saved, prevDraftId) => handleSavedRecord(saved, prevDraftId)}
        />
      </section>

      <Group title="Doctors / Providers" count={doctors.length} onAdd={() => addRecord('doctor')} addLabel="Add doctor">
        {doctors.length === 0 && (
          <p className="text-xs text-stone-400 italic">No providers yet — tap “Add doctor”.</p>
        )}
        {doctors.map((r) => (
          <DoctorCard
            key={r.id}
            record={r}
            packetId={currentPacket.id}
            scope={scope}
            expanded={expandedId === r.id}
            onToggle={() => toggleExpand(r.id)}
            onSaved={handleSavedRecord}
            onDeleted={handleDeletedRecord}
            onCancelDraft={handleCancelDraftRecord}
            onFindPro={handleFindPro}
          />
        ))}
      </Group>

      <Group title="Health Insurance" count={insurances.length} onAdd={() => addRecord('insurance')} addLabel="Add insurance">
        {insurances.length === 0 && (
          <p className="text-xs text-stone-400 italic">No insurance plans yet — tap “Add insurance”.</p>
        )}
        {insurances.map((r) => (
          <HealthInsuranceCard
            key={r.id}
            record={r}
            packetId={currentPacket.id}
            scope={scope}
            expanded={expandedId === r.id}
            onToggle={() => toggleExpand(r.id)}
            onSaved={handleSavedRecord}
            onDeleted={handleDeletedRecord}
            onCancelDraft={handleCancelDraftRecord}
            onFindPro={handleFindPro}
          />
        ))}
      </Group>

      <Group title="Medications" count={meds.length} onAdd={addMedication} addLabel="Add medication">
        {meds.length === 0 && (
          <p className="text-xs text-stone-400 italic">No medications yet — tap “Add medication”.</p>
        )}
        {meds.map((m) => (
          <MedicationCard
            key={m.id}
            record={m}
            packetId={currentPacket.id}
            scope={scope}
            expanded={expandedId === m.id}
            onToggle={() => toggleExpand(m.id)}
            onSaved={handleSavedMed}
            onDeleted={handleDeletedMed}
            onCancelDraft={handleCancelDraftMed}
            doctors={doctors}
          />
        ))}
      </Group>

      <Group title="Allergies" count={allergies.length} onAdd={() => addRecord('allergy')} addLabel="Add allergy">
        {allergies.length === 0 && (
          <p className="text-xs text-stone-400 italic">No allergies recorded.</p>
        )}
        {allergies.map((r) => (
          <AllergyCard
            key={r.id}
            record={r}
            packetId={currentPacket.id}
            scope={scope}
            expanded={expandedId === r.id}
            onToggle={() => toggleExpand(r.id)}
            onSaved={handleSavedRecord}
            onDeleted={handleDeletedRecord}
            onCancelDraft={handleCancelDraftRecord}
            doctors={doctors}
          />
        ))}
      </Group>

      <Group title="Surgical / Procedure History" count={surgeries.length} onAdd={() => addRecord('surgery')} addLabel="Add procedure">
        {surgeries.length === 0 && (
          <p className="text-xs text-stone-400 italic">No procedures recorded.</p>
        )}
        {surgeries.map((r) => (
          <SurgicalHistoryCard
            key={r.id}
            record={r}
            packetId={currentPacket.id}
            scope={scope}
            expanded={expandedId === r.id}
            onToggle={() => toggleExpand(r.id)}
            onSaved={handleSavedRecord}
            onDeleted={handleDeletedRecord}
            onCancelDraft={handleCancelDraftRecord}
            doctors={doctors}
          />
        ))}
      </Group>

      {legacyRecords.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">
              Legacy Records <span className="text-stone-400">({legacyRecords.length})</span>
            </h3>
          </div>
          <p className="text-xs text-stone-500">
            These records were created before the Medical section was updated. View them as-is or move each one to the correct category.
          </p>
          <div className="space-y-3">
            {legacyRecords.map((r) => (
              <LegacyMedicalRecordCard
                key={r.id}
                record={r}
                onMigrated={fetchAll}
                onDeleted={handleDeletedRecord}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};
