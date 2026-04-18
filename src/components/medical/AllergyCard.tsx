import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { MedicalCardShell, MedicalSection } from './MedicalCardShell';
import { medicalService, MedicalRecord } from '@/services/medicalService';

const SEVERITIES = ['Mild','Moderate','Severe','Anaphylactic'];
const ALLERGY_TYPES = ['Medication','Food','Environmental','Latex','Contrast dye','Other'];

interface Props {
  record: MedicalRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: MedicalRecord, prevDraftId?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft: (id: string) => void;
  doctors: MedicalRecord[];
}

export const AllergyCard: React.FC<Props> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft, doctors,
}) => {
  const doctorOptions = doctors.map((d) => d.provider_name).filter((n): n is string => !!n);

  const sections: MedicalSection[] = [
    {
      id: 'basic',
      label: 'Allergy Details',
      fields: [
        { name: 'allergen', label: 'Allergen', type: 'text' },
        { name: 'allergy_type', label: 'Allergy type', type: 'select', options: ALLERGY_TYPES },
        { name: 'severity', label: 'Severity', type: 'select', options: SEVERITIES },
        { name: 'reaction', label: 'Reaction / symptoms', type: 'textarea' },
      ],
    },
    {
      id: 'response',
      label: 'Response & Diagnosis',
      fields: [
        { name: 'carries_epipen', label: 'Carries EpiPen', type: 'boolean' },
        { name: 'epipen_location', label: 'EpiPen location' },
        { name: 'date_first_identified', label: 'Date first identified', type: 'date' },
        { name: 'diagnosed_by', label: 'Diagnosed by', type: 'select',
          options: doctorOptions.length ? doctorOptions : ['(no providers yet)'] },
        { name: 'show_on_emergency_qr', label: 'Show on Emergency QR', type: 'boolean' },
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
      title={(record.details as any)?.allergen || 'New Allergy'}
      icon={<AlertTriangle size={18} />}
      documentCategory="allergy"
      sections={sections}
      buildSummary={(d: MedicalRecord) => {
        const out: { label: string; tone?: string }[] = [];
        const sev = (d.details as any)?.severity;
        if (sev) {
          const tone = sev === 'Anaphylactic' || sev === 'Severe'
            ? 'border-red-300 bg-red-50 text-red-700'
            : sev === 'Moderate' ? 'border-amber-300 bg-amber-50 text-amber-700' : undefined;
          out.push({ label: sev, tone });
        }
        if ((d.details as any)?.allergy_type) out.push({ label: (d.details as any).allergy_type });
        if ((d.details as any)?.carries_epipen) out.push({ label: 'EpiPen' });
        return out;
      }}
      onSave={(data) => {
        const sev = (data.details || {}).severity;
        const showQr = (data.details || {}).show_on_emergency_qr;
        // Default severe/anaphylactic to QR
        if (showQr === undefined && (sev === 'Severe' || sev === 'Anaphylactic')) {
          data.details = { ...(data.details || {}), show_on_emergency_qr: true };
        }
        return medicalService.upsert({ ...data, record_type: 'allergy', provider_name: (data.details || {}).allergen || 'Allergy' });
      }}
      onDelete={(id) => medicalService.remove(id)}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onCancelDraft={onCancelDraft}
    />
  );
};
