import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { CreditCard } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';

export const BankingSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete "${record.institution || 'this account'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('banking', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Account deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard
              key={record.id}
              title={record.institution}
              subtitle={buildSubtitle(record.account_type, record.account_number_masked)}
              subtitlePlaceholder="No account details added"
              icon={CreditCard}
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
