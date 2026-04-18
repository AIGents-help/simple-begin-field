import React from 'react';
import { HeartPulse } from 'lucide-react';
import { MedicalCardShell, MedicalSection } from './MedicalCardShell';
import { medicalService, MedicalRecord } from '@/services/medicalService';

interface Props {
  record: MedicalRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: MedicalRecord, prevDraftId?: string) => void;
}

export const EmergencyMedicalCard: React.FC<Props> = ({ record, packetId, scope, expanded, onToggle, onSaved }) => {
  const sections: MedicalSection[] = [
    {
      id: 'vitals',
      label: 'Vitals & Donor Status',
      fields: [
        { name: 'blood_type', label: 'Blood type', type: 'select', topLevel: true,
          options: ['A+','A-','B+','B-','AB+','AB-','O+','O-','Unknown'] },
        { name: 'organ_donor_status', label: 'Organ donor status', type: 'select',
          options: ['yes','no','not decided'] },
      ],
    },
    {
      id: 'dnr',
      label: 'DNR & Advance Directive',
      fields: [
        { name: 'dnr_on_file', label: 'DNR on file', type: 'boolean' },
        { name: 'dnr_location', label: 'Location of DNR document', type: 'text' },
        { name: 'advance_directive_on_file', label: 'Advance directive on file', type: 'boolean' },
      ],
    },
    {
      id: 'critical',
      label: 'Critical Info for First Responders',
      fields: [
        { name: 'allergies', label: 'Known life-threatening allergies', type: 'textarea', topLevel: true,
          placeholder: 'e.g. penicillin (anaphylactic)' },
        { name: 'critical_medications', label: 'Current critical medications', type: 'textarea',
          placeholder: 'Briefly list meds that must not be missed.' },
        { name: 'first_responder_notes', label: 'Notes for first responders', type: 'textarea' },
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
      title="Emergency Medical Info"
      icon={<HeartPulse size={18} />}
      pinned
      hideDocumentUpload={false}
      documentCategory="emergency"
      sections={sections}
      buildSummary={(d: MedicalRecord) => {
        const out: { label: string; tone?: string }[] = [];
        if (d.blood_type) out.push({ label: `Blood: ${d.blood_type}` });
        const donor = (d.details as any)?.organ_donor_status;
        if (donor) out.push({ label: `Donor: ${donor}` });
        if ((d.details as any)?.dnr_on_file) out.push({ label: 'DNR on file', tone: 'border-red-300 bg-red-50 text-red-700' });
        if (d.allergies) out.push({ label: 'Allergies listed', tone: 'border-amber-300 bg-amber-50 text-amber-700' });
        return out;
      }}
      onSave={async (data) => {
        // Sync organ_donor boolean on legacy column for downstream packet PDF / QR.
        const donorStr = (data.details || {}).organ_donor_status;
        const organDonor = donorStr === 'yes' ? true : donorStr === 'no' ? false : null;
        const saved = await medicalService.upsert({
          ...data,
          record_type: 'emergency',
          provider_name: 'Emergency Medical Info',
          organ_donor: organDonor,
          dnr_status: (data.details || {}).dnr_on_file ? 'yes' : 'no',
        });
        // Bidirectional sync to Identity → Driver's License
        await medicalService.syncOrganDonorToIdentity(packetId, scope, organDonor);
        return saved;
      }}
      onDelete={async () => { /* pinned — not deletable */ }}
      onSaved={onSaved}
      onDeleted={() => { /* pinned */ }}
    />
  );
};
