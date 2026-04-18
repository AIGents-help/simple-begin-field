import React from 'react';
import { Award } from 'lucide-react';
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
  onFindPro?: () => void;
}

const SECTIONS: IdentitySection[] = [
  {
    id: 'details',
    label: 'Certificate Details',
    fields: [
      {
        name: 'certificate_type', label: 'Certificate type', type: 'select',
        options: ['Certificate of Naturalization', 'Certificate of Citizenship', 'Other'],
      },
      { name: 'certificate_number', label: 'Certificate number', type: 'masked', placeholder: '••••••' },
      { name: 'country_of_origin', label: 'Country of origin' },
      { name: 'naturalization_date', label: 'Date of naturalization', type: 'date' },
      { name: 'court_or_uscis', label: 'Court / USCIS office' },
    ],
  },
  {
    id: 'storage',
    label: 'Storage',
    fields: [
      { name: 'original_location', label: 'Location of original certificate', type: 'textarea', rows: 2 },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', topLevel: true, rows: 3 }],
  },
];

export const CitizenshipCard: React.FC<Props> = ({ onFindPro, ...props }) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.certificate_type) out.push({ label: r.details.certificate_type });
    if (r.details?.country_of_origin) out.push({ label: r.details.country_of_origin });
    return out;
  };
  return (
    <IdentityDocumentCard
      {...props}
      title="Citizenship / Naturalization"
      icon={<Award size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
      findProCta={onFindPro ? { label: 'Need immigration assistance? Find an immigration attorney', onClick: onFindPro } : undefined}
    />
  );
};
