import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Package, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const PropertySection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.item_name}
              subtitle={`${record.category} • ${record.location || ''}`}
              icon={Package}
              badge={record.category}
              data={record}
              onClick={() => onAddClick(undefined, record)}
            />
          ))}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
