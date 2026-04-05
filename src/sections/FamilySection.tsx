import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { User, Mail, Phone, Calendar } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const FamilySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.name}
              subtitle={`${record.relationship} • ${record.phone || record.email || ''}`}
              icon={User}
              badge={record.birthday ? 'Birthday' : undefined}
              data={record}
              onClick={() => onAddClick(undefined, record)}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
