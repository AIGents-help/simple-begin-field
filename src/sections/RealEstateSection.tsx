import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Home as HomeIcon } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { HomeInventoryVideo } from '../components/realestate/HomeInventoryVideo';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';

export const RealEstateSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { currentPacket, activeScope, bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const ok = await confirm({
      title: 'Delete this record?',
      description: `Delete "${record.property_label || 'this property'}"? This action cannot be undone.`,
    });

    if (!ok) return;
    const { error } = await sectionService.deleteRecord('real-estate', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Property deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, _docs, refresh) => (
        <div className="space-y-6">
          {records.map(record => (
            <React.Fragment key={record.id}>
              <RecordCard
                title={record.property_label}
                subtitle={record.address}
                subtitlePlaceholder="No address added"
                icon={HomeIcon}
                badge={record.scope === 'shared' ? 'Shared' : undefined}
                data={record}
                onEdit={() => onAddClick(undefined, record)}
                onDelete={() => handleDelete(record, refresh)}
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
        </div>
      )}
    </SectionScreenTemplate>
  );
};
