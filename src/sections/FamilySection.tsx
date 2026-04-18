import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { User, List, GitBranch, Heart } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { FamilyTreeView } from '../components/family/FamilyTreeView';
import { SpouseProfileSheet } from '../components/family/SpouseProfileSheet';
import { sectionService } from '../services/sectionService';
import { StorageImage } from '../components/common/StorageImage';

export const FamilySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [spouseSheetOpen, setSpouseSheetOpen] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState<any | null>(null);
  const { bumpCompletion } = useAppContext();

  const isSpouse = (record: any) =>
    (record?.relationship || '').toLowerCase() === 'spouse';

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) {
      toast.error('Cannot delete: this record is missing an ID.', { duration: 4000, position: 'bottom-center' });
      return;
    }
    if (!window.confirm(`Delete "${record.name || 'this family member'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('family', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Family member deleted.', { duration: 3000, position: 'bottom-center' });
  };

  const openSpouseSheet = (records: any[], record?: any) => {
    if (record) {
      setEditingSpouse(record);
      setSpouseSheetOpen(true);
      return;
    }
    // Adding new — enforce single-active-spouse rule
    const activeSpouse = records.find(
      (r) => isSpouse(r) && !r.is_deceased && !['divorced', 'separated'].includes((r.marital_status || '').toLowerCase())
    );
    if (activeSpouse) {
      toast.error('You already have an active spouse on file. Mark them as divorced, separated, widowed, or deceased before adding another.', {
        duration: 6000,
        position: 'bottom-center',
      });
      return;
    }
    setEditingSpouse(null);
    setSpouseSheetOpen(true);
  };

  // Hand-rolled add button so we can intercept "Add Spouse" via the relationship picker
  // For now, the "Add Family Member" button still flows through the generic sheet.
  // When the user picks "Spouse" from the relationship dropdown there, the generic sheet
  // saves a basic record — but they can also tap a spouse card to open the rich editor.
  // To make spouse-add explicit, we surface a dedicated Add Spouse CTA at the top of the list.

  return (
    <div>
      {/* View Toggle */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setViewMode('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'list'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <List className="w-3 h-3" />
            List View
          </button>
          <button
            onClick={() => setViewMode('tree')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              viewMode === 'tree'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <GitBranch className="w-3 h-3" />
            Tree View
          </button>
        </div>
      </div>

      {viewMode === 'list' ? (
        <SectionScreenTemplate
          onAddClick={(file, data, options) => {
            // If the prefilled data already says Spouse, route to the rich sheet
            if (data?.relationship && (data.relationship as string).toLowerCase() === 'spouse') {
              setEditingSpouse(data);
              setSpouseSheetOpen(true);
              return;
            }
            onAddClick(file, data, options);
          }}
          onRefresh={onRefresh}
        >
          {(records, _docs, refresh) => {
            const hasSpouse = records.some((r) => isSpouse(r));
            return (
              <div className="space-y-4">
                {/* Dedicated "Add Spouse" CTA when there is no spouse yet */}
                {!hasSpouse && (
                  <button
                    type="button"
                    onClick={() => openSpouseSheet(records)}
                    className="w-full p-4 border-2 border-dashed border-rose-200 rounded-2xl flex items-center justify-center gap-2 text-rose-500 hover:border-rose-400 hover:bg-rose-50/40 transition-colors"
                  >
                    <Heart size={18} />
                    <span className="font-bold text-sm">Add Spouse / Partner</span>
                  </button>
                )}

                {records.map((record) => {
                  const spouse = isSpouse(record);
                  const subtitleParts = spouse
                    ? [
                        record.preferred_name ? `"${record.preferred_name}"` : '',
                        record.marriage_date ? `Married ${new Date(record.marriage_date).getFullYear()}` : '',
                        record.phone,
                        record.email,
                      ]
                    : [record.relationship, record.phone, record.email];

                  const badge = spouse
                    ? (record.marital_status && record.marital_status !== 'married'
                        ? record.marital_status.charAt(0).toUpperCase() + record.marital_status.slice(1)
                        : 'Spouse')
                    : record.birthday
                    ? 'Birthday'
                    : undefined;

                  // Custom avatar for spouses with a photo
                  if (spouse && record.photo_path) {
                    return (
                      <div key={record.id} className="relative">
                        <RecordCard
                          title={record.name}
                          subtitle={buildSubtitle(...subtitleParts)}
                          subtitlePlaceholder="No contact details added"
                          icon={Heart}
                          badge={badge}
                          data={record}
                          onEdit={() => openSpouseSheet(records, record)}
                          onDelete={() => handleDelete(record, refresh)}
                        />
                        {/* Avatar overlay on top of the icon slot */}
                        <div className={`absolute left-5 top-1/2 -translate-y-1/2 pointer-events-none ${record.is_deceased ? 'grayscale' : ''}`}>
                          <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-sm">
                            <StorageImage
                              path={record.photo_path}
                              alt={record.name}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </div>
                      </div>
                    );
                  }

                  return (
                    <RecordCard
                      key={record.id}
                      title={record.name}
                      subtitle={buildSubtitle(...subtitleParts)}
                      subtitlePlaceholder="No contact details added"
                      icon={spouse ? Heart : User}
                      badge={badge}
                      data={record}
                      onEdit={() =>
                        spouse
                          ? openSpouseSheet(records, record)
                          : onAddClick(undefined, record)
                      }
                      onDelete={() => handleDelete(record, refresh)}
                    />
                  );
                })}
              </div>
            );
          }}
        </SectionScreenTemplate>
      ) : (
        <div className="p-6 pb-32">
          <div className="mb-4">
            <h2 className="text-2xl font-serif font-bold text-navy-muted mb-1">Family Tree</h2>
            <p className="text-xs text-stone-500">Visual overview of your family connections.</p>
          </div>
          <FamilyTreeView
            onAddMember={() => onAddClick?.()}
            onEditMember={(member) => {
              if (isSpouse(member)) {
                setEditingSpouse(member);
                setSpouseSheetOpen(true);
              } else {
                onAddClick?.(undefined, member);
              }
            }}
          />
        </div>
      )}

      <SpouseProfileSheet
        isOpen={spouseSheetOpen}
        onClose={() => setSpouseSheetOpen(false)}
        spouse={editingSpouse}
        onSaved={() => {
          // Trigger the SectionScreenTemplate refresh by re-invoking the parent refresh
          if (onRefresh) onRefresh(() => {});
          // The template's internal fetchData will run via its useEffect when records change.
          // To be safe, we reload the page-level data by emitting a synthetic re-render:
          window.dispatchEvent(new CustomEvent('family-refresh'));
        }}
      />
    </div>
  );
};
