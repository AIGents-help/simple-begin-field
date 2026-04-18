import React from 'react';
import { Scissors } from 'lucide-react';
import { MedicalCardShell, MedicalSection } from './MedicalCardShell';
import { medicalService, MedicalRecord } from '@/services/medicalService';

const PROCEDURE_TYPES = ['Surgery','Diagnostic','Therapeutic','Cosmetic','Dental','Other'];

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

export const SurgicalHistoryCard: React.FC<Props> = ({
  record, packetId, scope, expanded, onToggle, onSaved, onDeleted, onCancelDraft, doctors,
}) => {
  const doctorOptions = doctors.map((d) => d.provider_name).filter((n): n is string => !!n);

  const sections: MedicalSection[] = [
    {
      id: 'basic',
      label: 'Procedure Details',
      fields: [
        { name: 'procedure_name', label: 'Procedure name', type: 'text' },
        { name: 'procedure_type', label: 'Procedure type', type: 'select', options: PROCEDURE_TYPES },
        { name: 'date_performed', label: 'Date performed', type: 'date' },
        { name: 'facility_name', label: 'Hospital / facility name' },
        { name: 'facility_address', label: 'Facility address', type: 'textarea', rows: 2 },
        { name: 'surgeon_picker', label: 'Surgeon (from your providers)', type: 'select',
          options: doctorOptions.length ? doctorOptions : ['(no providers yet)'] },
        { name: 'surgeon_freeform', label: 'Surgeon (other)' },
      ],
    },
    {
      id: 'outcome',
      label: 'Anesthesia & Outcome',
      fields: [
        { name: 'anesthesia_used', label: 'Anesthesia used', type: 'boolean' },
        { name: 'anesthesia_type', label: 'Anesthesia type' },
        { name: 'outcome', label: 'Outcome / result', type: 'textarea' },
        { name: 'recovery_notes', label: 'Recovery notes', type: 'textarea' },
        { name: 'complications', label: 'Complications', type: 'textarea' },
      ],
    },
    {
      id: 'followup',
      label: 'Follow-up',
      fields: [
        { name: 'followup_required', label: 'Follow-up required', type: 'boolean' },
        { name: 'followup_date', label: 'Follow-up date', type: 'date' },
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
      title={(record.details as any)?.procedure_name || 'New Procedure'}
      icon={<Scissors size={18} />}
      documentCategory="surgical-history"
      sections={sections}
      buildSummary={(d: MedicalRecord) => {
        const out: { label: string; tone?: string }[] = [];
        if ((d.details as any)?.procedure_type) out.push({ label: (d.details as any).procedure_type });
        if ((d.details as any)?.date_performed) out.push({ label: (d.details as any).date_performed });
        if ((d.details as any)?.facility_name) out.push({ label: (d.details as any).facility_name });
        return out;
      }}
      onSave={(data) => medicalService.upsert({
        ...data,
        record_type: 'surgery',
        provider_name: (data.details || {}).procedure_name || 'Procedure',
      })}
      onDelete={(id) => medicalService.remove(id)}
      onSaved={onSaved}
      onDeleted={onDeleted}
      onCancelDraft={onCancelDraft}
    />
  );
};
