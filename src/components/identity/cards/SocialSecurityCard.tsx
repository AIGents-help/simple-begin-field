import React from 'react';
import { Hash } from 'lucide-react';
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
    id: 'number',
    label: 'Number',
    fields: [
      { name: 'ssn', label: 'Social Security Number', type: 'masked', placeholder: '•••-••-••••' },
    ],
  },
  {
    id: 'location',
    label: 'Where it lives',
    fields: [
      { name: 'physical_card_location', label: 'Physical card location', type: 'textarea', rows: 2, placeholder: 'e.g. fireproof safe in master bedroom closet' },
      { name: 'documented_location', label: 'Where the number is documented', type: 'textarea', rows: 2, placeholder: 'e.g. password manager under "SSN"' },
      { name: 'who_else_knows', label: 'Who else knows this number', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', topLevel: true, rows: 3 }],
  },
];

export const SocialSecurityCard: React.FC<Props> = (props) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.ssn) {
      const s = String(r.details.ssn).replace(/\D/g, '');
      if (s.length >= 4) out.push({ label: `••• -•• -${s.slice(-4)}` });
      else out.push({ label: 'SSN on file' });
    }
    if (r.details?.physical_card_location) out.push({ label: 'Card location noted' });
    return out;
  };

  return (
    <IdentityDocumentCard
      {...props}
      title="Social Security"
      icon={<Hash size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
    />
  );
};
