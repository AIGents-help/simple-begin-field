import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { User, List, GitBranch, Heart } from 'lucide-react';
import { getCategoryIcon } from '../config/categoryIcons';
import { CategoryOption } from '../components/upload/types';
import { FamilyTreeView } from '../components/family/FamilyTreeView';
import { SpouseProfileSheet } from '../components/family/SpouseProfileSheet';
import { sectionService } from '../services/sectionService';
import { StorageImage } from '../components/common/StorageImage';
import { PersonAvatar } from '../components/common/PersonAvatar';
import { useConfirm } from '../context/ConfirmDialogContext';

export const FamilySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const [spouseSheetOpen, setSpouseSheetOpen] = useState(false);
  const [editingSpouse, setEditingSpouse] = useState<any | null>(null);
  // Bumping this triggers FamilyTreeView to re-fetch family_members so the
  // tree never shows stale data after edits/saves/deletes.
  const [treeRefreshKey, setTreeRefreshKey] = useState(0);
  const refreshRef = React.useRef<(() => void) | null>(null);
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const isSpouse = (record: any) =>
    (record?.relationship || '').toLowerCase() === 'spouse';

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) {
      toast.error('Cannot delete: this record is missing an ID.', { duration: 4000, position: 'bottom-center' });
      return;
    }
    const ok = await confirm({

      title: 'Delete this record?',

      description: `Delete "${record.name || 'this family member'}"? This action cannot be undone.`,

    });

    if (!ok) return;
    const { error } = await sectionService.deleteRecord('family', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    setTreeRefreshKey((k) => k + 1);
    bumpCompletion();
    toast.success('Family member deleted.', { duration: 3000, position: 'bottom-center' });
  };

  const openSpouseSheet = (records: any[], record?: any) => {
    if (record) {
      setEditingSpouse(record);
      setSpouseSheetOpen(true);
      return;
    }
    // Adding new — only block if there is already an ACTIVE (currently married) spouse.
    // Past marriages (divorced/separated/widowed) are allowed alongside a current spouse,
    // and a person may have multiple historical spouse records.
    const activeMarriedSpouse = records.find(
      (r) => isSpouse(r) && !r.is_deceased && (r.marital_status || 'married').toLowerCase() === 'married'
    );
    if (activeMarriedSpouse) {
      toast.error('You already have a current spouse on file. Mark them as divorced, separated, widowed, or deceased before adding a new current spouse. Past marriages can still be added with a non-married status.', {
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
            // Family relationship entries (Parent, Child, Sibling, etc.) must use the
            // full structured form — strip `entryOnly` which would otherwise force the
            // generic Title/Notes layout.
            const cleaned = data ? { ...data } : data;
            if (cleaned && cleaned.relationship) {
              delete cleaned.entryOnly;
            }
            // If the prefilled data already says Spouse, route to the rich sheet
            if (cleaned?.relationship && (cleaned.relationship as string).toLowerCase() === 'spouse') {
              setEditingSpouse(cleaned);
              setSpouseSheetOpen(true);
              return;
            }
            onAddClick(file, cleaned, options);
          }}
          onRefresh={(fn) => {
            refreshRef.current = fn;
            // Wrap the upstream refresh so any save coming through AppShell's
            // AddEditSheet (non-spouse family edits) also bumps the tree key
            // and the tree refetches automatically.
            const wrapped = (newRecord?: any) => {
              fn(newRecord);
              setTreeRefreshKey((k) => k + 1);
            };
            if (onRefresh) onRefresh(wrapped);
          }}
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
                  const status = (record.marital_status || 'married').toLowerCase();
                  const isCurrentSpouse = spouse && status === 'married';
                  const subtitleParts = spouse
                    ? [
                        record.preferred_name ? `"${record.preferred_name}"` : '',
                        record.marriage_date ? `Married ${new Date(record.marriage_date).getFullYear()}` : '',
                        record.phone,
                        record.email,
                      ]
                    : [record.relationship, record.phone, record.email];

                  // Spouse status → human-readable badge
                  // Married → "Spouse", Divorced/Separated → "Ex-Spouse",
                  // Widowed → "Widowed Spouse", anything else → titlecased status.
                  const spouseBadge = (() => {
                    if (status === 'married') return 'Spouse';
                    if (status === 'divorced' || status === 'separated') return 'Ex-Spouse';
                    if (status === 'widowed') return 'Widowed Spouse';
                    return status.charAt(0).toUpperCase() + status.slice(1);
                  })();

                  const badge = spouse
                    ? spouseBadge
                    : record.birthday
                    ? 'Birthday'
                    : undefined;

                  return (
                    <RecordCard
                      key={record.id}
                      title={record.name}
                      subtitle={buildSubtitle(...subtitleParts)}
                      subtitlePlaceholder="No contact details added"
                      avatar={
                        <PersonAvatar
                          photoPath={record.photo_path}
                          name={record.name}
                          isDeceased={!!record.is_deceased}
                          size={52}
                        />
                      }
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
            refreshKey={treeRefreshKey}
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
          // Refresh the family list (template exposed its refresh via onRefresh)
          refreshRef.current?.();
          // Force the tree view to re-fetch so it never shows stale data
          setTreeRefreshKey((k) => k + 1);
        }}
      />
    </div>
  );
};