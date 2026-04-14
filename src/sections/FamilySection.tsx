import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { User, List, GitBranch } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { FamilyTreeView } from '../components/family/FamilyTreeView';

export const FamilySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [viewMode, setViewMode] = useState<'list' | 'tree'>('list');

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
          {(records) => (
            <div className="space-y-4">
              {records.map(record => (
                <RecordCard 
                  key={record.id}
                  title={record.name}
                  subtitle={`${record.relationship} • ${record.phone || record.email || ''}`}
                  icon={User}
                  badge={record.birthday ? 'Birthday' : undefined}
                  data={record}
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
