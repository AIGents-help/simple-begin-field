import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { ShieldCheck, User, Phone, Mail } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const AdvisorsSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.name}
              subtitle={`${record.advisor_type} • ${record.firm || ''}`}
              icon={ShieldCheck}
              badge={record.advisor_type}
              data={record}
              onClick={() => onAddClick(undefined, record)}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
