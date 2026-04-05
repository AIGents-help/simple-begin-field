import React from 'react';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Activity, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const MedicalSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.title}
              subtitle={record.category}
              icon={Activity}
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
