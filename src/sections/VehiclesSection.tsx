import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, DocumentUploadCard } from '../components/sections/SectionScreenTemplate';
import { Car, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';

export const VehiclesSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, docs) => (
        <div className="space-y-6">
          {records.map(record => (
            <RecordCard 
              key={record.id}
              title={`${record.year || ''} ${record.make || ''} ${record.model || ''}`}
              subtitle={`License: ${record.license_plate || 'N/A'} • VIN: ${record.vin || 'N/A'}`}
              icon={Car}
            />
          ))}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Documents</h3>
            <DocumentUploadCard 
              label="Vehicle Title" 
              status={docs.some(d => d.category === 'title') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.model === 'Vehicle Title')}
            />
            <DocumentUploadCard 
              label="Insurance Card" 
              status={docs.some(d => d.category === 'insurance') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.model === 'Insurance Card')}
            />
            <DocumentUploadCard 
              label="Registration" 
              status={docs.some(d => d.category === 'registration') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.model === 'Registration')}
            />
          </div>
        </div>
      )}
    </SectionScreenTemplate>
  );
};
