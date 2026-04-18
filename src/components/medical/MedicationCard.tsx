import React from 'react';
import { Pill } from 'lucide-react';
import { MedicalCardShell, MedicalSection, daysUntil, expiryTone } from './MedicalCardShell';
import { medicalService, MedicationRecord, MedicalRecord } from '@/services/medicalService';

const FREQUENCIES = ['Once daily','Twice daily','Three times daily','As needed','Weekly','Other'];
const ROUTES = ['Oral','Topical','Injection','Inhaled','Other'];
const DOSE_UNITS = ['mg','ml','mcg','g','IU','units','other'];

interface Props {
  record: MedicationRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: MedicationRecord, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
  doctors: MedicalRecord[];
}

export const MedicationCard: React.FC<Props> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft, doctors,
}) => {
  const doctorOptions = doctors
    .map((d) => d.provider_name)
    .filter((n): n is string => !!n);

  const sections: MedicalSection[] = [
    {
      id: 'basic',
      label: 'Medication Details',
      fields: [
        { name: 'name', label: 'Medication name', type: 'text', topLevel: true },
        { name: 'generic_name', label: 'Generic name (if different)' },
        { name: 'dose', label: 'Dose', topLevel: true, placeholder: '500' },
        { name: 'dose_unit', label: 'Unit', type: 'select', topLevel: true, options: DOSE_UNITS },
        { name: 'frequency', label: 'Frequency', type: 'select', topLevel: true, options: FREQUENCIES },
        { name: 'route', label: 'Route', type: 'select', topLevel: true, options: ROUTES },
        { name: 'condition_treated', label: 'What it treats', topLevel: true },
        { name: 'is_critical', label: 'Critical (show on Emergency QR)', type: 'boolean', topLevel: true },
      ],
    },
    {
      id: 'prescription',
      label: 'Prescription & Pharmacy',
      fields: [
        { name: 'prescribing_doctor', label: 'Prescribing doctor', type: 'select', topLevel: true,
          options: doctorOptions.length ? doctorOptions : ['(no providers yet)'] },
        { name: 'pharmacy', label: 'Pharmacy', topLevel: true },
        { name: 'pharmacy_phone', label: 'Pharmacy phone', type: 'tel', topLevel: true },
        { name: 'prescription_number', label: 'Prescription number', type: 'masked', topLevel: true },
        { name: 'refill_due_date', label: 'Refill due date', type: 'date', topLevel: true },
        { name: 'is_generic_available', label: 'Generic available', type: 'boolean', topLevel: true },
      ],
    },
    {
      id: 'safety',
      label: 'Safety & Notes',
      fields: [
        { name: 'side_effects', label: 'Side effects to note', type: 'textarea', topLevel: true },
        { name: 'special_instructions', label: 'Special instructions', type: 'textarea', topLevel: true,
          placeholder: 'e.g. take with food, avoid sunlight' },
        { name: 'notes', label: 'Notes', type: 'textarea', topLevel: true },
      ],
    },
  ];

  const titleParts = [record.name, record.dose && `${record.dose}${record.dose_unit ? ' ' + record.dose_unit : ''}`].filter(Boolean);

  return (
    <MedicalCardShell
      record={record}
      packetId={packetId}
      scope={scope}
      expanded={expanded}
      onToggle={onToggle}
      title={titleParts.join(' · ') || 'New Medication'}
      icon={<Pill size={18} />}
      badge={record.is_critical ? 'Critical' : undefined}
      documentTable="medications"
      documentCategory="medication"
      sections={sections}
      buildSummary={(d: MedicationRecord) => {
        const out: { label: string; tone?: string }[] = [];
        if (d.frequency) out.push({ label: d.frequency });
        if (d.prescribing_doctor) out.push({ label: `Rx: ${d.prescribing_doctor}` });
        const days = daysUntil(d.refill_due_date);
        if (days !== null) {
          const tone = days <= 14 ? 'border-red-300 bg-red-50 text-red-700' : undefined;
          out.push({ label: `Refill ${d.refill_due_date}`, tone });
        }
        if (d.is_critical) out.push({ label: 'Critical', tone: 'border-red-300 bg-red-50 text-red-700' });
        return out;
      }}
      onSave={(data) => medicalService.upsertMedication(data)}
      onDelete={(id) => medicalService.removeMedication(id)}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onCancelDraft={onCancelDraft}
    />
  );
};
