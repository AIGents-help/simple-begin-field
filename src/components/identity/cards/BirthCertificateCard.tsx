import React from 'react';
import { Baby } from 'lucide-react';
import { IdentityDocumentCard, IdentitySection } from '../IdentityDocumentCard';
import { IdentityRecord } from '@/services/identityService';

interface Props {
  record: IdentityRecord;
  packetId: string;
  scope: string;
  expanded: boolean;
  onToggle: () => void;
  onSaved: (saved: IdentityRecord, prev?: string) => void;
  onDeleted: (id: string) => void;
  onCancelDraft?: (id: string) => void;
}

const SECTIONS: IdentitySection[] = [
  {
    id: 'details',
    label: 'Certificate Details',
    fields: [
      { name: 'full_name', label: 'Full name as on certificate' },
      { name: 'dob', label: 'Date of birth on certificate', type: 'date' },
      { name: 'place_of_birth', label: 'Place of birth (city, county, state, country)' },
      { name: 'issuing_authority', label: 'Issuing authority' },
      { name: 'certificate_number', label: 'Certificate number', placeholder: 'optional' },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    fields: [
      { name: 'original_location', label: 'Location of original document', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', topLevel: true, rows: 3 }],
  },
];

export const BirthCertificateCard: React.FC<Props> = (props) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.full_name) out.push({ label: r.details.full_name });
    if (r.details?.dob) out.push({ label: `Born ${r.details.dob}` });
    if (r.details?.original_location) out.push({ label: 'Original located' });
    return out;
  };
  return (
    <IdentityDocumentCard
      {...props}
      title="Birth Certificate"
      icon={<Baby size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
    />
  );
};
