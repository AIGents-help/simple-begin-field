import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, DocumentUploadCard } from '../components/sections/SectionScreenTemplate';
import { Briefcase, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const RetirementSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, docs) => (
        <div className="space-y-6">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.institution || record.account_type}
              subtitle={record.beneficiary_notes || record.account_number_masked || '****'}
              icon={Briefcase}
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
