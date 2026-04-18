import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { Search } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { ProfessionalFinder } from '../components/directory/ProfessionalFinder';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getCategoryIcon } from '../config/categoryIcons';
import { PersonAvatar } from '../components/common/PersonAvatar';

export const AdvisorsSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [activeView, setActiveView] = useState<'list' | 'find'>('list');
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({

      title: 'Delete this record?',

      description: `Delete "${record.name || 'this advisor'}"? This action cannot be undone.`,

    });

    if (!ok) return;
    const { error } = await sectionService.deleteRecord('advisors', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Advisor deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <div>
      {/* Tab Toggle */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
              activeView === 'list'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            My Advisors
          </button>
          <button
            onClick={() => setActiveView('find')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeView === 'find'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Search className="w-3 h-3" />
            Find a Professional
          </button>
        </div>
      </div>

      {activeView === 'list' ? (
        <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
          {(records, _docs, refresh) => (
            <div className="space-y-4">
              {records.map(record => (
                <RecordCard
                  key={record.id}
                  title={record.name}
                  subtitle={buildSubtitle(record.advisor_type, record.firm, record.phone)}
                  subtitlePlaceholder="No contact details added"
                  avatar={
                    <PersonAvatar
                      photoPath={record.photo_path}
                      name={record.name}
                      isDeceased={record.advisor_status === 'deceased'}
                      size={52}
                    />
                  }
                  badge={record.advisor_type}
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
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">Find a Professional</h2>
            <p className="text-xs text-stone-500">Search for estate planning professionals near you and save them directly to your advisors list.</p>
          </div>
          <ProfessionalFinder />
        </div>
      )}
    </div>
  );
};