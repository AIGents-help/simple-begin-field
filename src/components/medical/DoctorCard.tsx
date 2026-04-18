import React from 'react';
import { Stethoscope } from 'lucide-react';
import { MedicalCardShell, MedicalSection, daysUntil, expiryTone } from './MedicalCardShell';
import { medicalService, MedicalRecord } from '@/services/medicalService';

const PROVIDER_TYPES = [
  'Primary Care Physician',
  'Cardiologist',
  'Dermatologist',
  'Endocrinologist',
  'Gastroenterologist',
  'Neurologist',
  'Oncologist',
  'Orthopedic Surgeon',
  'OB-GYN',
  'Ophthalmologist',
  'Psychiatrist',
  'Psychologist / Therapist',
  'Pulmonologist',
  'Rheumatologist',
  'Urologist',
  'Dentist',
  'Orthodontist',
  'Oral Surgeon',
  'Chiropractor',
  'Physical Therapist',
  'Urgent Care',
  'Hospital / ER',
  'Specialist (Other)',
];

interface Props {
  record: MedicalRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: MedicalRecord, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
  onFindPro: (query: string) => void;
}

export const DoctorCard: React.FC<Props> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft, onFindPro,
}) => {
  const sections: MedicalSection[] = [
    {
      id: 'basic',
      label: 'Provider Details',
      fields: [
        { name: 'provider_type', label: 'Provider type', type: 'select', options: PROVIDER_TYPES },
        { name: 'provider_name', label: 'Provider name', type: 'text', topLevel: true, placeholder: 'Dr. Jane Smith' },
        { name: 'practice_name', label: 'Practice / clinic' },
        { name: 'phone', label: 'Phone', type: 'tel', topLevel: true },
        { name: 'fax', label: 'Fax', type: 'tel' },
        { name: 'address', label: 'Address', type: 'textarea', topLevel: true, rows: 2 },
        { name: 'patient_id', label: 'Patient / chart number', type: 'masked' },
      ],
    },
    {
      id: 'portal',
      label: 'Patient Portal',
      fields: [
        { name: 'portal_url', label: 'Portal URL' },
        { name: 'portal_username_hint', label: 'Username hint' },
      ],
    },
    {
      id: 'care',
      label: 'Care & Appointments',
      fields: [
        { name: 'insurance_accepted', label: 'Insurance accepted' },
        { name: 'conditions_treated', label: 'Conditions being treated', type: 'textarea' },
        { name: 'last_visit_date', label: 'Last visit date', type: 'date' },
        { name: 'next_appointment_date', label: 'Next appointment', type: 'date', topLevel: true },
        { name: 'provider_status', label: 'Status', type: 'select', options: ['Active','No longer my provider'] },
        { name: 'notes', label: 'Notes', type: 'textarea', topLevel: true },
      ],
    },
  ];

  return (
    <MedicalCardShell
      record={record}
      packetId={packetId}
      scope={scope}
      expanded={expanded}
      onToggle={onToggle}
      title={record.provider_name || (record.details as any)?.provider_type || 'New Provider'}
      icon={<Stethoscope size={18} />}
      documentCategory="medical-provider"
      sections={sections}
      findProCta={{ label: 'Need to find a doctor? Find a Primary Care Physician', onClick: () => onFindPro('Primary Care Physician') }}
      buildSummary={(d: MedicalRecord) => {
        const out: { label: string; tone?: string }[] = [];
        if ((d.details as any)?.provider_type) out.push({ label: (d.details as any).provider_type });
        if (d.phone) out.push({ label: d.phone });
        const days = daysUntil(d.next_appointment_date);
        if (days !== null) {
          const tone = days <= 7 ? 'border-red-300 bg-red-50 text-red-700' : undefined;
          out.push({ label: `Next visit: ${d.next_appointment_date}`, tone });
        }
        return out;
      }}
      onSave={(data) => medicalService.upsert({ ...data, record_type: 'doctor' })}
      onDelete={(id) => medicalService.remove(id)}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onCancelDraft={onCancelDraft}
    />
  );
};
