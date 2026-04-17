import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { Package } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';

export const PropertySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete "${record.item_name || 'this item'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('property', record.id);
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
          {records.map(record => (
            <RecordCard
              key={record.id}
              title={record.item_name}
              subtitle={buildSubtitle(record.category, record.location, record.beneficiary)}
              subtitlePlaceholder="No location or beneficiary added"
              icon={Package}
              badge={record.category}
              data={record}
              onEdit={() => onAddClick(undefined, record)}
              onDelete={() => handleDelete(record, refresh)}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
