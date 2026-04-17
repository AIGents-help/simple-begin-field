import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Key, AlertTriangle } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';

export const PasswordsSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete access info for "${record.service_name || 'this service'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('passwords', record.id);
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
        <>
          <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-2xl flex gap-3">
            <AlertTriangle size={18} className="text-amber-600 shrink-0" />
            <p className="text-xs text-amber-800 leading-relaxed">
              This section is for <strong>access instructions</strong> and emergency recovery info.
              Do not store master passwords here.
            </p>
          </div>
          <div className="space-y-4">
            {records.map(record => (
              <RecordCard
                key={record.id}
                title={record.service_name}
                subtitle={record.username}
                subtitlePlaceholder="No username added"
                icon={Key}
                badge={record.requires_reauth ? 'Secure' : undefined}
                data={record}
                onEdit={() => onAddClick(undefined, record)}
                onDelete={() => handleDelete(record, refresh)}
              />
            ))}
          </div>
        </>
      )}
    </SectionScreenTemplate>
  );
};
