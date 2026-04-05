import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Flower2, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const FuneralSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.arrangement_type || 'Arrangement'}
              subtitle={`${record.location_name || ''} • ${record.notes || ''}`}
              icon={Flower2}
              badge={record.scope === 'shared' ? 'Shared' : 'Individual'}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
