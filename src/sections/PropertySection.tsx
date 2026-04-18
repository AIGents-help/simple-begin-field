import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getCategoryIcon } from '../config/categoryIcons';

export const PropertySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({

      title: 'Delete this record?',

      description: `Delete "${record.item_name || 'this item'}"? This action cannot be undone.`,

    });

    if (!ok) return;
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
              icon={getCategoryIcon('property', record)}
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