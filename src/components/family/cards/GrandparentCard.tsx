import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';

export const GrandparentCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    if (f.parent_side) out.push({ label: `${f.parent_side} side` });
    if (f.relationship_subtype) out.push({ label: f.relationship_subtype });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'grandparent_details',
      label: 'Grandparent Details',
      fields: [
        { name: 'parent_side', label: 'Which side', type: 'select', options: ['Maternal', 'Paternal'] },
        { name: 'relationship_subtype', label: 'Relationship type', type: 'select', options: ['Biological', 'Step'] },
        { name: 'occupation', label: 'Occupation (or "Retired")' },
      ],
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge="Grandparent"
      extraSections={sections}
      buildSummary={buildSummary}
    />
  );
};
