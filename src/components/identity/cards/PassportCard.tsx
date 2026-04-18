import React from 'react';
import { BookOpen } from 'lucide-react';
import { IdentityDocumentCard, daysUntil, expiryTone, IdentitySection } from '../IdentityDocumentCard';
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
    id: 'basic',
    label: 'Passport Details',
    fields: [
      { name: 'passport_number', label: 'Passport number', type: 'masked', placeholder: '•••••••••' },
      { name: 'issuing_country', label: 'Issuing country', placeholder: 'United States' },
      { name: 'place_of_issue', label: 'Place of issue', placeholder: '' },
      { name: 'mrz', label: 'MRZ (machine readable zone)', placeholder: 'optional' },
      { name: 'is_primary', label: 'Primary travel document', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'dates',
    label: 'Dates',
    fields: [
      { name: 'issue_date', label: 'Issue date', type: 'date' },
      { name: 'expiry_date', label: 'Expiration date', type: 'date', topLevel: true },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', topLevel: true, rows: 3 }],
  },
];

export const PassportCard: React.FC<Props> = ({ onFindPro, ...props }) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.issuing_country) out.push({ label: r.details.issuing_country });
    const days = daysUntil(r.expiry_date);
    if (days !== null) {
      out.push({
        label: days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`,
        tone: expiryTone(days),
      });
    }
    return out;
  };

  return (
    <IdentityDocumentCard
      {...props}
      title="Passport"
      icon={<BookOpen size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
      badge={props.record.details?.is_primary === 'Yes' ? 'Primary' : undefined}
      findProCta={onFindPro ? { label: 'Need passport photos or expedited service? Find a passport service near you', onClick: onFindPro } : undefined}
    />
  );
};
