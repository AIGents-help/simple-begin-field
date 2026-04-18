import React from 'react';
import { toast } from 'sonner';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useAppContext } from '../context/AppContext';
import { useConfirm } from '../context/ConfirmDialogContext';
import { getCategoryIcon } from '../config/categoryIcons';

export const MedicalSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({

      title: 'Delete this record?',

      description: `Delete "${record.provider_name || 'this provider'}"? This action cannot be undone.`,

    });

    if (!ok) return;
    const { error } = await sectionService.deleteRecord('medical', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Record deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard
              key={record.id}
              title={record.provider_name || record.title}
              subtitle={buildSubtitle(record.specialty, record.phone)}
              subtitlePlaceholder="No specialty or phone added"
              icon={getCategoryIcon('medical', record)}
              badge={record.scope === 'shared' ? 'Shared' : undefined}
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