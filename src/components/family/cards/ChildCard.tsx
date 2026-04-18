import React from 'react';
import { FamilyCardShell, FamilySection } from '../FamilyCardShell';
import { isMinorFromBirthday } from '@/services/familyService';

export const ChildCard: React.FC<any> = (props) => {
  const buildSummary = (f: any) => {
    const out: { label: string; tone?: string }[] = [];
    const minor = isMinorFromBirthday(f.birthday);
    if (minor) out.push({ label: 'Minor', tone: 'border-amber-200 bg-amber-50 text-amber-700' });
    if (f.relationship_subtype) out.push({ label: f.relationship_subtype });
    if (f.is_dependent) out.push({ label: 'Dependent', tone: 'border-blue-200 bg-blue-50 text-blue-700' });
    if (f.is_beneficiary) out.push({ label: 'Beneficiary', tone: 'border-emerald-200 bg-emerald-50 text-emerald-700' });
    if (f.has_special_needs) out.push({ label: 'Special needs', tone: 'border-violet-200 bg-violet-50 text-violet-700' });
    return out;
  };

  const sections: FamilySection[] = [
    {
      id: 'child_details',
      label: 'Child Details',
      fields: [
        { name: 'relationship_subtype', label: 'Relationship type', type: 'select', options: ['Biological', 'Adopted', 'Step-child'] },
        { name: 'is_dependent', label: 'Is a dependent', type: 'boolean' },
        { name: 'is_beneficiary', label: 'Is a beneficiary', type: 'boolean' },
        { name: 'lives_with_user', label: 'Lives with me', type: 'boolean',
          showIf: (f) => isMinorFromBirthday(f.birthday) },
        { name: 'school_name', label: 'School',
          showIf: (f) => isMinorFromBirthday(f.birthday) },
        { name: 'occupation', label: 'Occupation',
          showIf: (f) => !isMinorFromBirthday(f.birthday) },
      ],
    },
    {
      id: 'guardian',
      label: 'Guardianship (for minors)',
      render: ({ form, setField }) => {
        if (!isMinorFromBirthday(form.birthday)) {
          return (
            <p className="text-xs text-stone-500">
              Guardianship fields appear automatically when this child is under 18.
            </p>
          );
        }
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">Guardian name</span>
              <input
                type="text"
                value={form.guardian_name || ''}
                onChange={(e) => setField('guardian_name', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">Guardian relationship</span>
              <input
                type="text"
                value={form.guardian_relationship || ''}
                onChange={(e) => setField('guardian_relationship', e.target.value)}
                placeholder="e.g. Aunt, Family friend"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
            <label className="block">
              <span className="mb-1 block text-[10px] font-bold uppercase tracking-widest text-stone-500">Guardian phone</span>
              <input
                type="tel"
                value={form.guardian_phone || ''}
                onChange={(e) => setField('guardian_phone', e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              />
            </label>
          </div>
        );
      },
    },
    {
      id: 'special_needs',
      label: 'Special Needs',
      fields: [
        { name: 'has_special_needs', label: 'Has special needs', type: 'boolean' },
        { name: 'special_needs_notes', label: 'Description, care instructions, contacts', type: 'textarea', rows: 4,
          showIf: (f) => f.has_special_needs === true },
      ],
    },
  ];

  const documentSlots = [
    { category: 'birth_certificate', label: 'Birth Certificate', description: 'Official birth certificate' },
    { category: 'adoption_papers', label: 'Adoption Papers',
      description: 'Required for adopted children',
      showIf: (f: any) => f.relationship_subtype === 'Adopted' },
    { category: 'guardianship_docs', label: 'Guardianship Documents',
      description: 'Legal guardianship papers',
      showIf: (f: any) => !!f.guardian_name },
  ];

  return (
    <FamilyCardShell
      {...props}
      relationshipBadge="Child"
      extraSections={sections}
      documentSlots={documentSlots}
      buildSummary={buildSummary}
    />
  );
};
