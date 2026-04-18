import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';

export const SiblingCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    if (f.relationship_subtype) out.push({ label: f.relationship_subtype });
    if (f.occupation) out.push({ label: f.occupation });
    if (f.phone) out.push({ label: f.phone });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'sibling_details',
      label: 'Sibling Details',
      fields: [
        { name: 'relationship_subtype', label: 'Relationship type', type: 'select', options: ['Biological', 'Half', 'Step'] },
        { name: 'occupation', label: 'Occupation' },
      ],
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge="Sibling"
      extraSections={sections}
      buildSummary={buildSummary}
    />
  );
};
