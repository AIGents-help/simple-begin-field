import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';

export const ParentCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    if (f.which_parent) out.push({ label: f.which_parent });
    if (f.relationship_subtype) out.push({ label: f.relationship_subtype });
    if (f.occupation) out.push({ label: f.occupation });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'parent_details',
      label: 'Parent Details',
      fields: [
        { name: 'which_parent', label: 'Which parent', type: 'select', options: ['Mother', 'Father', 'Other'] },
        { name: 'relationship_subtype', label: 'Relationship type', type: 'select', options: ['Biological', 'Adoptive', 'Step-parent'] },
        { name: 'occupation', label: 'Occupation' },
        { name: 'employer', label: 'Employer (or "Retired")' },
      ],
    },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge="Parent"
      extraSections={sections}
      buildSummary={buildSummary}
    />
  );
};
