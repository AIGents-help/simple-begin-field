import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, DocumentUploadCard } from '../components/sections/SectionScreenTemplate';
import { Home as HomeIcon, MapPin, ShieldCheck } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { HomeInventoryVideo } from '../components/realestate/HomeInventoryVideo';

export const RealEstateSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { currentPacket, activeScope } = useAppContext();

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, docs) => (
        <div className="space-y-6">
          {records.map(record => (
            <React.Fragment key={record.id}>
              <RecordCard 
                title={record.property_label}
                subtitle={record.address}
                icon={HomeIcon}
                badge={record.scope === 'shared' ? 'Shared' : undefined}
                data={record}
              />
              {currentPacket && record.id && !(record.is_na || record.status === 'not_applicable') && (
                <HomeInventoryVideo
                  packetId={currentPacket.id}
                  propertyRecordId={record.id}
                  scope={activeScope}
                />
              )}
            </React.Fragment>
          ))}
          <div className="space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Documents</h3>
            <DocumentUploadCard 
              label="Property Deed" 
              status={docs.some(d => d.category === 'deed') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.property_label === 'Property Deed')}
            />
            <DocumentUploadCard 
              label="Mortgage Statement" 
              status={docs.some(d => d.category === 'mortgage') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.property_label === 'Mortgage Statement')}
            />
            <DocumentUploadCard 
              label="Property Tax Bill" 
              status={docs.some(d => d.category === 'tax_bill') ? 'uploaded' : 'missing'} 
              isNA={records.some(r => r.status === 'not_applicable' && r.property_label === 'Property Tax Documents')}
            />
          </div>
        </div>
      )}
    </SectionScreenTemplate>
  );
};
