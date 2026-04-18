import React from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard, DocumentUploadCard, buildSubtitle } from '../components/sections/SectionScreenTemplate';
import { Car } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { sectionService } from '../services/sectionService';
import { useConfirm } from '../context/ConfirmDialogContext';

export const VehiclesSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { bumpCompletion } = useAppContext();
  const confirm = useConfirm();

  const handleDelete = async (record: any, refresh: () => void) => {
    if (!record?.id) return;
    const label = [record.year, record.make, record.model].filter(Boolean).join(' ') || 'this vehicle';
    const ok = await confirm({

      title: 'Delete this record?',

      description: `Delete "${label}"? This action cannot be undone.`,

    });

    if (!ok) return;
    const { error } = await sectionService.deleteRecord('vehicles', record.id);
    if (error) {
      toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      return;
    }
    refresh();
    bumpCompletion();
    toast.success('Vehicle deleted.', { duration: 3000, position: 'bottom-center' });
  };

  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records, docs, refresh) => (
        <div className="space-y-6">
          {records.map(record => {
            const titleParts = [record.year, record.make, record.model].filter(Boolean);
            const title = titleParts.length > 0 ? titleParts.join(' ') : 'Untitled Vehicle';
            return (
              <RecordCard
                key={record.id}
                title={title}
                subtitle={buildSubtitle(
                  record.license_plate ? `License: ${record.license_plate}` : '',
                  record.vin ? `VIN: ${record.vin}` : ''
                )}
                subtitlePlaceholder="No license or VIN added"
                icon={Car}
                data={record}
                onEdit={() => onAddClick(undefined, record)}
                onDelete={() => handleDelete(record, refresh)}
              />
            );
          })}
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