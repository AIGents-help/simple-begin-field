import React, { useState } from 'react';
import { toast } from 'sonner';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate } from '../components/sections/SectionScreenTemplate';
import { InfoRecordCard } from '../components/sections/InfoRecordCard';
import { InfoRecordDetailSheet } from '../components/sections/InfoRecordDetailSheet';
import { EntryForm } from '../components/sections/EntryForm';
import { Plus, Upload, Filter, Info, Loader2 } from 'lucide-react';
import { sectionService } from '../services/sectionService';
import { documentService } from '../services/documentService';
import { CategoryOption } from '../components/upload/types';
import { INFO_CATEGORY_OPTIONS } from '../config/categories';
import { useConfirm } from '../context/ConfirmDialogContext';
import { TemplateLauncher } from '../components/templates/TemplateLauncher';

const CATEGORY_GROUPS: Record<string, string[]> = {
  'Legal': ['Will', 'Living Will', 'HCPOA', 'Financial POA', 'Trust', 'Special Needs Trust', 'Medical Directive'],
  'Identity': ['Driver’s License', 'Passport', 'Birth Certificate', 'Social Security'],
  'Medical': ['Living Will', 'HCPOA', 'Medical Directive'],
  'Financial': ['Financial POA', 'Trust'],
  'Insurance': ['Insurance'],
  'Other': ['Other']
};

const FILTERS = ['All', 'Legal', 'Identity', 'Medical', 'Financial', 'Insurance', 'Other'];

export const InfoSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: (newRecord?: any) => void) => void }) => {
  const { activeScope, currentPacket } = useAppContext();
  const confirm = useConfirm();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEntryLabel, setSelectedEntryLabel] = useState<string | null>(null);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);

  const handleQuickUploadClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.pdf,.doc,.docx,.jpg,.jpeg,.png';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        onAddClick(file, undefined, INFO_CATEGORY_OPTIONS);
      }
    };
    input.click();
  };

  const handleRecordClick = (record: any) => {
    setSelectedRecord(record);
    setIsDetailOpen(true);
  };

  const handleEdit = () => {
    if (selectedRecord) {
      onAddClick(undefined, selectedRecord, INFO_CATEGORY_OPTIONS);
      setIsDetailOpen(false);
    }
  };

  const handleDelete = async (refresh: () => void) => {
    if (!selectedRecord) return;
    
    const ok = await confirm({
      title: 'Delete this record?',
      description: 'This will also remove any attached documents. This action cannot be undone.',
    });
    if (ok) {
      setIsDeleting(true);
      try {
        const { error } = await sectionService.deleteRecord('info', selectedRecord.id);
        if (error) throw error;
        
        setIsDetailOpen(false);
        setSelectedRecord(null);
        refresh();
      } catch (err) {
        console.error("Error deleting record:", err);
        toast.error("Failed to delete record.", { duration: 4000, position: "bottom-center" });
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleViewFile = async (doc: any) => {
    if (!doc?.file_path) return;
    try {
      const { url } = await documentService.getDocumentUrl(doc.file_path, doc.is_private);
      if (url) window.open(url, '_blank');
    } catch (err) {
      console.error("Failed to get URL:", err);
    }
  };

  const handleEntryClick = (label: string) => {
    setSelectedEntryLabel(label);
    setIsEntryFormOpen(true);
  };

  return (
    <SectionScreenTemplate 
      onAddClick={(file, data, options) => onAddClick(file, data, options || INFO_CATEGORY_OPTIONS)} 
      onEntryClick={handleEntryClick}
      onRefresh={onRefresh}
    >
      {(records, docs, refresh) => {
        // Filter records based on active filter
        const filteredRecords = records.filter(record => {
          if (activeFilter === 'All') return true;
          const groupCategories = CATEGORY_GROUPS[activeFilter] || [];
          return groupCategories.includes(record.category);
        });

        return (
          <div className="space-y-6">
            {/* Section Header Explanation */}
            <div className="paper-sheet p-4 flex gap-3 items-start">
              <div className="w-8 h-8 bg-manila rounded-lg flex items-center justify-center text-navy-muted shrink-0">
                <Info size={18} />
              </div>
              <p className="text-xs text-stone-600 leading-relaxed">
                Store critical personal records and documents in one organized place.
              </p>
            </div>

            {/* Quick Actions Row */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => onAddClick(undefined, undefined, INFO_CATEGORY_OPTIONS)}
                className="flex items-center justify-center gap-2 p-4 bg-navy-muted text-primary-foreground rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Plus size={18} />
                Add Info
              </button>
              <button 
                onClick={handleQuickUploadClick}
                className="flex items-center justify-center gap-2 p-4 bg-paper text-navy-muted border border-stone-200 rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Upload size={18} />
                Quick Upload
              </button>
            </div>

            {/* Category Filters */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-6 px-6 no-scrollbar">
              <div className="flex items-center gap-2">
                {FILTERS.map(filter => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      activeFilter === filter 
                        ? 'bg-navy-muted text-primary-foreground shadow-sm' 
                        : 'bg-paper text-stone-500 border border-stone-200 hover:border-stone-300'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>
            </div>

            {/* Template entry point */}
            <TemplateLauncher
              templateType="digital_asset_letter"
              title="Organize your digital footprint"
              description="The Digital Asset Instruction Letter template helps you document accounts, social media, crypto, and what should happen to each — pulled from your packet data."
              buttonLabel="Open Digital Asset Template"
            />

            {/* Info Record List */}
            <div className="space-y-4">
              {filteredRecords.length > 0 ? (
                filteredRecords.map(record => {
                  const doc = docs.find(d => d.related_record_id === record.id);
                  return (
                    <InfoRecordCard 
                      key={record.id}
                      record={record}
                      hasFile={!!doc}
                      onClick={() => handleRecordClick(record)}
                      onEdit={() => {
                        setSelectedRecord(record);
                        onAddClick(undefined, record, INFO_CATEGORY_OPTIONS);
                      }}
                      onDelete={async (e) => {
                        e.stopPropagation();
                        const ok = await confirm({
                          title: 'Delete this record?',
                          description: 'This action cannot be undone.',
                        });
                        if (ok) {
                          await sectionService.deleteRecord('info', record.id);
                          refresh();
                        }
                      }}
                    />
                  );
                })
              ) : (
                <div className="py-12 text-center bg-parchment rounded-xl border border-dashed border-stone-200">
                  <p className="text-stone-400 text-sm font-medium">No information records added yet.</p>
                  <div className="mt-4 flex justify-center gap-3">
                    <button onClick={() => onAddClick(undefined, undefined, INFO_CATEGORY_OPTIONS)} className="text-xs font-bold text-navy-muted hover:underline">Add Info</button>
                    <span className="text-stone-300">•</span>
                    <button onClick={handleQuickUploadClick} className="text-xs font-bold text-navy-muted hover:underline">Quick Upload</button>
                  </div>
                </div>
              )}
            </div>

            <InfoRecordDetailSheet 
              isOpen={isDetailOpen}
              onClose={() => setIsDetailOpen(false)}
              record={selectedRecord}
              document={docs.find(d => d.related_record_id === selectedRecord?.id)}
              onEdit={handleEdit}
              onDelete={() => handleDelete(refresh)}
              onViewFile={() => handleViewFile(docs.find(d => d.related_record_id === selectedRecord?.id))}
            />

            <EntryForm 
              isOpen={isEntryFormOpen}
              onClose={() => setIsEntryFormOpen(false)}
              entryLabel={selectedEntryLabel || ''}
              onSuccess={refresh}
            />
          </div>
        );
      }}
    </SectionScreenTemplate>
  );
};
