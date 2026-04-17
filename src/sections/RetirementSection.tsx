import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, DocumentUploadCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { Briefcase } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';

export const RetirementSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    if (!window.confirm(`Delete "${record.institution || record.account_type || 'this account'}"? This cannot be undone.`)) return;
    const { error } = await sectionService.deleteRecord('retirement', record.id);
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
      {(records, docs, refresh) => (
        <div className="space-y-6">
          {records.map(record => (
            <RecordCard
              key={record.id}
              title={record.institution || record.account_type}
              subtitle={buildSubtitle(record.account_type, record.beneficiary_notes, record.account_number_masked)}
              subtitlePlaceholder="No account details added"
              icon={Briefcase}
              data={record}
              onEdit={() => onAddClick(undefined, record)}
              onDelete={() => handleDelete(record, refresh)}
            />
          ))}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Documents</h3>
            <DocumentUploadCard
              label="Latest Statement"
              status={docs.some(d => d.category === 'statement') ? 'uploaded' : 'missing'}
              isNA={records.some(r => r.status === 'not_applicable' && r.institution === 'Retirement Statement')}
            />
            <DocumentUploadCard
              label="Beneficiary Form"
              status={docs.some(d => d.category === 'beneficiary') ? 'uploaded' : 'missing'}
              isNA={records.some(r => r.status === 'not_applicable' && r.institution === 'Beneficiary Form')}
            />
          </div>
        </div>
      )}
    </SectionScreenTemplate>
  );
};
