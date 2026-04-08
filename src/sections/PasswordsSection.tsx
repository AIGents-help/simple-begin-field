import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Key, AlertTriangle } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const PasswordsSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
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
                icon={Key}
                badge={record.requires_reauth ? 'Secure' : undefined}
              />
            ))}
          </div>
        </>
      )}
    </SectionScreenTemplate>
  );
};
