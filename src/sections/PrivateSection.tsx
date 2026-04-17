import React from 'react';
import { toast } from 'sonner';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Lock, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useAppContext } from '../context/AppContext';

export const PrivateSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete "${record.title || 'this private item'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('private', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Item deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => (
        <div className="space-y-4">
          <div className="mb-6 p-4 bg-navy-muted/5 border border-navy-muted/10 rounded-2xl flex gap-3">
            <ShieldCheck size={18} className="text-navy-muted shrink-0" />
            <p className="text-xs text-navy-muted leading-relaxed">
              These items are only visible to you. Even your household partner cannot see these records unless you explicitly share them.
            </p>
          </div>
          {records.map(record => (
            <RecordCard
              key={record.id}
              title={record.title}
              subtitle={record.description}
              subtitlePlaceholder="No description added"
              icon={Lock}
              badge="Private"
              data={record}
              onEdit={() => onAddClick(undefined, record)}
              onDelete={() => handleDelete(record, refresh)}
            />
          ))}
          {records.length === 0 && (
            <div className="py-12 text-center">
              <Lock size={48} className="text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 text-sm">No private items yet.</p>
            </div>
          )}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
