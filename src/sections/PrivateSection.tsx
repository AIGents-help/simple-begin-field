import React from 'react';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Lock, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const PrivateSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-4">
          <div className="mb-6 p-4 bg-navy-muted/5 border border-navy-muted/10 rounded-2xl flex gap-3">
            <ShieldCheck size={18} className="text-navy-muted shrink-0" />
            <p className="text-xs text-navy-muted leading-relaxed">
              These items are only visible to you. Even your household partner cannot see these records unless you explicitly share them.
            </p>
          </div>
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={record.title}
              subtitle={record.description || 'Private Item'}
              icon={Lock}
              badge="Private"
              data={record}
              onClick={() => onAddClick(undefined, record)}
            />
          ))}
          {records.length === 0 && (
            <div className="py-12 text-center">
              <Lock size={48} className="text-stone-200 mx-auto mb-4" />
              <p className="text-stone-400 text-sm">No private items yet.</p>
            </div>
          )}
        </div>
      )}
    </SectionScreenTemplate>
  );
};
