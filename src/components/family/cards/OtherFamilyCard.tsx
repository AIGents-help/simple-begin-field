import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';

export const OtherFamilyCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    if (f.relationship) out.push({ label: f.relationship });
    if (f.phone) out.push({ label: f.phone });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'relationship',
      label: 'Relationship',
      fields: [
        { name: 'relationship', label: 'Relationship description', placeholder: 'e.g. Aunt, Cousin, Godparent' },
        { name: 'occupation', label: 'Occupation' },
      ],
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge={props.record.relationship || 'Family'}
      extraSections={sections}
      buildSummary={buildSummary}
    />
  );
};
