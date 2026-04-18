import React from 'react';
import { IdCard } from 'lucide-react';
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
}

const SECTIONS: IdentitySection[] = [
  {
    id: 'details',
    label: 'ID Details',
    fields: [
      {
        name: 'id_type', label: 'ID type', type: 'select',
        options: ['Global Entry', 'TSA Precheck', 'NEXUS', 'State ID', 'Military ID', 'Tribal ID', 'Other'],
      },
      { name: 'id_number', label: 'ID / membership number', type: 'masked', placeholder: '••••••' },
      { name: 'issuing_authority', label: 'Issuing authority' },
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

export const OtherGovernmentIdCard: React.FC<Props> = (props) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.id_type) out.push({ label: r.details.id_type });
    const days = daysUntil(r.expiry_date);
    if (days !== null) {
      out.push({
        label: days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`,
        tone: expiryTone(days),
      });
    }
    return out;
  };

  const title = props.record.details?.id_type || 'Government ID';
  return (
    <IdentityDocumentCard
      {...props}
      title={title}
      icon={<IdCard size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
    />
  );
};
