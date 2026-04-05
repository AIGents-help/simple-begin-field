import React, { useState, useRef } from 'react';
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

const CATEGORY_GROUPS: Record<string, string[]> = {
  'Legal': ['Will', 'Living Will', 'HCPOA', 'Financial POA', 'Trust', 'Special Needs Trust', 'Medical Directive'],
  'Identity': ['Driver’s License', 'Passport', 'Birth Certificate', 'Social Security'],
  'Medical': ['Living Will', 'HCPOA', 'Medical Directive'],
  'Financial': ['Financial POA', 'Trust'],
  'Insurance': ['Insurance'],
  'Other': ['Other']
};

const FILTERS = ['All', 'Legal', 'Identity', 'Medical', 'Financial', 'Insurance', 'Other'];

export const InfoSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const { activeScope, currentPacket } = useAppContext();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedRecord, setSelectedRecord] = useState<any>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedEntryLabel, setSelectedEntryLabel] = useState<string | null>(null);
  const [isEntryFormOpen, setIsEntryFormOpen] = useState(false);
  const refreshRef = useRef<(() => void) | null>(null);

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
    
    if (window.confirm("Are you sure you want to delete this record? This will also remove any attached documents.")) {
      setIsDeleting(true);
      try {
        const { error } = await sectionService.deleteRecord('info', selectedRecord.id);
        if (error) throw error;
        
        setIsDetailOpen(false);
        setSelectedRecord(null);
        refresh();
      } catch (err) {
        console.error("Error deleting record:", err);
        alert("Failed to delete record.");
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
    <>
      <SectionScreenTemplate 
        onAddClick={(file, data, options) => onAddClick(file, data, options || INFO_CATEGORY_OPTIONS)} 
        onEntryClick={handleEntryClick}
        onRefresh={(fn) => {
          refreshRef.current = fn;
          onRefresh?.(fn);
        }}
      >
        {(records, docs, refresh) => {
          // Store refresh for EntryForm usage
          if (refreshRef.current !== refresh) {
            refreshRef.current = refresh;
          }
          // Filter records based on active filter
          const filteredRecords = records.filter(record => {
            if (activeFilter === 'All') return true;
            const groupCategories = CATEGORY_GROUPS[activeFilter] || [];
            return groupCategories.includes(record.category);
          });

          return (
            <div className="space-y-6">
              {/* Section Header Explanation */}
              <div className="bg-white p-4 rounded-2xl border border-stone-100 shadow-sm flex gap-3 items-start">
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
                  className="flex items-center justify-center gap-2 p-4 bg-navy-muted text-white rounded-2xl font-bold text-sm shadow-md active:scale-95 transition-all"
                >
                  <Plus size={18} />
                  Add Info
                </button>
                <button 
                  onClick={handleQuickUploadClick}
                  className="flex items-center justify-center gap-2 p-4 bg-white text-navy-muted border border-stone-200 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
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
                          ? 'bg-navy-muted text-white shadow-md' 
                          : 'bg-white text-stone-500 border border-stone-200 hover:border-stone-300'
                      }`}
                    >
                      {filter}
                    </button>
                  ))}
                </div>
              </div>

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
                          if (confirm("Are you sure you want to delete this record?")) {
                            await sectionService.deleteRecord('info', record.id);
                            refresh();
                          }
                        }}
                      />
                    );
                  })
                ) : (
                  <div className="py-12 text-center bg-white/50 rounded-3xl border border-dashed border-stone-200">
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
            </div>
          );
        }}
      </SectionScreenTemplate>

      <EntryForm 
        isOpen={isEntryFormOpen}
        onClose={() => setIsEntryFormOpen(false)}
        entryLabel={selectedEntryLabel || ''}
        onSuccess={() => refreshRef.current?.()}
      />
    </>
  );
};
