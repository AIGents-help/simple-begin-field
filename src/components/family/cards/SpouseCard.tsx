import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';

/**
 * Spouse / Partner card. Marriage details + conditional divorce / death cert uploads.
 * Multiple records supported (for previous marriages).
 */
export const SpouseCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    const status = (f.marital_status || 'married').toLowerCase();
    if (status === 'married') out.push({ label: 'Currently married', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' });
    else if (status === 'divorced') out.push({ label: 'Divorced', tone: 'border-stone-200 bg-stone-50 text-stone-600' });
    else if (status === 'separated') out.push({ label: 'Separated', tone: 'border-amber-200 bg-amber-50 text-amber-700' });
    else if (status === 'widowed') out.push({ label: 'Widowed', tone: 'border-stone-200 bg-stone-50 text-stone-600' });
    else if (status === 'partner') out.push({ label: 'Partner', tone: 'border-rose-200 bg-rose-50 text-rose-700' });
    if (f.marriage_date) out.push({ label: `Married ${new Date(f.marriage_date).getFullYear()}` });
    if (f.phone) out.push({ label: f.phone });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'marriage',
      label: 'Marriage Details',
      fields: [
        { name: 'marital_status', label: 'Marital status', type: 'select', options: ['Married', 'Separated', 'Divorced', 'Widowed', 'Partner'] },
        { name: 'marriage_date', label: 'Date of marriage', type: 'date' },
        { name: 'marriage_place', label: 'Place of marriage', placeholder: 'City, State' },
        { name: 'separation_date', label: 'Date of separation', type: 'date',
          showIf: (f) => /(separated|divorced)/i.test(f.marital_status || '') },
        { name: 'divorce_finalized_date', label: 'Date divorce finalized', type: 'date',
          showIf: (f) => /divorced/i.test(f.marital_status || '') },
        { name: 'divorce_finalized', label: 'Divorce finalized', type: 'boolean',
          showIf: (f) => /divorced/i.test(f.marital_status || '') },
        { name: 'divorce_attorney', label: 'Divorce attorney',
          showIf: (f) => /(separated|divorced)/i.test(f.marital_status || '') },
        { name: 'divorce_jurisdiction', label: 'Jurisdiction / court',
          showIf: (f) => /(separated|divorced)/i.test(f.marital_status || '') },
        { name: 'divorce_settlement_notes', label: 'Settlement notes', type: 'textarea',
          showIf: (f) => /(separated|divorced)/i.test(f.marital_status || '') },
      ],
    },
    {
      id: 'work',
      label: 'Occupation',
      fields: [
        { name: 'occupation', label: 'Occupation' },
        { name: 'employer', label: 'Employer' },
      ],
    },
  ];

  const documentSlots = [
    {
      category: 'marriage_certificate',
      label: 'Marriage Certificate',
      description: 'Upload a scan or photo (PDF, JPG, PNG)',
      showIf: (f: any) => /^(married|separated|widowed|divorced)$/i.test(f.marital_status || 'married'),
    },
    {
      category: 'divorce_decree',
      label: 'Divorce Decree',
      description: 'Required for divorced/separated spouses',
      showIf: (f: any) => /^(divorced|separated)$/i.test(f.marital_status || ''),
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge={(props.record.marital_status || 'spouse').toLowerCase() === 'partner' ? 'Partner' : 'Spouse'}
      extraSections={sections}
      documentSlots={documentSlots}
      buildSummary={buildSummary}
    />
  );
};
