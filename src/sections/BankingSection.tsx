import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { CreditCard, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const BankingSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.institution}
              subtitle={`${record.account_type} • ${record.account_number_masked || '****'}`}
              icon={CreditCard}
              badge={record.scope === 'shared' ? 'Shared' : undefined}
              data={record}
              onClick={() => onAddClick(undefined, record)}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
