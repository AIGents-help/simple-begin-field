import React from 'react';
import { CreditCard } from 'lucide-react';
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
    id: 'basic',
    label: 'License Details',
    fields: [
      { name: 'license_number', label: 'License number', type: 'masked', placeholder: '••••••••••' },
      { name: 'issuing_state', label: 'Issuing state', placeholder: 'CA' },
      { name: 'license_class', label: 'License class', type: 'select', options: ['A', 'B', 'C', 'D', 'M', 'Other'] },
      { name: 'restrictions', label: 'Restrictions', placeholder: 'e.g. corrective lenses' },
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
    id: 'physical',
    label: 'Physical Description (optional)',
    fields: [
      { name: 'height', label: 'Height', placeholder: '5\'10"' },
      { name: 'weight', label: 'Weight', placeholder: '170 lbs' },
      { name: 'eye_color', label: 'Eye color', placeholder: 'Brown' },
      { name: 'organ_donor', label: 'Organ donor', type: 'select', options: ['Yes', 'No'] },
    ],
  },
  {
    id: 'notes',
    label: 'Notes',
    fields: [{ name: 'notes', label: 'Notes', type: 'textarea', topLevel: true, rows: 3 }],
  },
];

export const DriversLicenseCard: React.FC<Props> = (props) => {
  const buildSummary = (r: IdentityRecord) => {
    const out: { label: string; tone?: string }[] = [];
    if (r.details?.issuing_state) out.push({ label: r.details.issuing_state });
    if (r.details?.license_number) {
      const ln = String(r.details.license_number);
      out.push({ label: `••• ${ln.slice(-4)}` });
    }
    const days = daysUntil(r.expiry_date);
    if (days !== null) {
      out.push({
        label: days < 0 ? `Expired ${Math.abs(days)}d ago` : `Expires in ${days}d`,
        tone: expiryTone(days),
      });
    }
    if (r.details?.organ_donor === 'Yes') out.push({ label: 'Organ donor' });
    return out;
  };

  return (
    <IdentityDocumentCard
      {...props}
      title="Driver's License"
      icon={<CreditCard size={18} />}
      sections={SECTIONS}
      buildSummary={buildSummary}
    />
  );
};
