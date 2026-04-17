import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { User, List, GitBranch } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { FamilyTreeView } from '../components/family/FamilyTreeView';
import { sectionService } from '../services/sectionService';

export const FamilySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');
  const { bumpCompletion } = useAppContext();

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
        <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
          {(records, _docs, refresh) => (
            <div className="space-y-4">
              {records.map(record => (
                <RecordCard
                  key={record.id}
                  title={record.name}
                  subtitle={buildSubtitle(record.relationship, record.phone, record.email)}
                  subtitlePlaceholder="No contact details added"
                  icon={User}
                  badge={record.birthday ? 'Birthday' : undefined}
                  data={record}
                  onEdit={() => onAddClick(undefined, record)}
                  onDelete={() => handleDelete(record, refresh)}
                />
              ))}
            </div>
          )}
        </SectionScreenTemplate>
      ) : (
        <div className="p-6 pb-32">
          <div className="mb-4">
            <h2 className="text-2xl font-serif font-bold text-navy-muted mb-1">Family Tree</h2>
            <p className="text-xs text-stone-500">Visual overview of your family connections.</p>
          </div>
          <FamilyTreeView
            onAddMember={() => onAddClick?.()}
            onEditMember={(member) => onAddClick?.(undefined, member)}
          />
        </div>
      )}
    </div>
  );
};
