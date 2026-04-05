import React, { useState, useEffect } from 'react';
import { X, Save, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { sectionService } from '../../services/sectionService';
import { documentService } from '../../services/documentService';
import { FileAttachmentField } from '../upload/FileAttachmentField';
import { CategorySelector } from '../upload/CategorySelector';
import { CategoryOption, FileMetadata } from '../upload/types';
import { INFO_CATEGORY_OPTIONS } from '../../config/categories';

export const AddEditSheet = ({ 
  isOpen, 
  onClose, 
  children,
  title,
  onSuccess,
  initialFile,
  initialData,
  categoryOptions = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children?: React.ReactNode;
  title?: string;
  onSuccess?: () => void;
  initialFile?: File | null;
  initialData?: any;
  categoryOptions?: CategoryOption[];
}) => {
  const { activeTab, activeScope, currentPacket } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [isNA, setIsNA] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [initialAttachment, setInitialAttachment] = useState<FileMetadata | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Determine if this is an entry-only form (no file upload)
  const isEntryOnly = initialData?.entryOnly === true || formData?.entryOnly === true;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setErrors({});
        if (initialData) {
          const data = { ...initialData };
          if (data.entryOnly && !data.category) {
            data.category = 'Other';
          }
          setFormData(data);
          setIsNA(initialData.is_na || initialData.status === 'not_applicable');
          // Fetch existing document if editing
          if (currentPacket && activeTab && initialData.id) {
            const { data: docs } = await documentService.getDocuments(currentPacket.id, activeTab, initialData.id);
            if (docs && docs.length > 0) {
              setInitialAttachment(docs[0] as FileMetadata);
            } else {
              setInitialAttachment(null);
            }
          }
        } else {
          setFormData({});
          setIsNA(false);
          setSelectedFile(null);
          setInitialAttachment(null);
        }
      }
    };
    loadData();
  }, [initialData, isOpen, currentPacket, activeTab]);

  const config = SECTIONS_CONFIG.find(s => s.id === activeTab);

  const getDisplayTitle = (data: any) => {
    return data.title || data.name || data.item_name || data.institution || 
           data.service_name || data.property_label || data.model || 
           data.service_preferences || data.burial_or_cremation || 
           data.funeral_home || data.prepaid_arrangements || '';
  };

  const setDisplayTitle = (val: string) => {
    const field = activeTab === 'family' || activeTab === 'advisors' || activeTab === 'pets' ? 'name' : 
                 activeTab === 'real-estate' ? 'property_label' :
                 activeTab === 'banking' || activeTab === 'retirement' ? 'institution' :
                 activeTab === 'passwords' ? 'service_name' :
                 activeTab === 'property' ? 'item_name' :
                 activeTab === 'vehicles' ? 'model' :
                 activeTab === 'funeral' ? 'service_preferences' : 'title';
    setFormData({ 
      ...formData, 
      [field]: val
    });
  };

  const handleSave = async () => {
    if (!currentPacket || !activeTab) return;
    
    // Validation for Info section
    if (activeTab === 'info' && !formData.category && !isNA && !isEntryOnly) {
      setErrors({ category: "Please select a category." });
      return;
    }

    setLoading(true);
    try {
      // 0. Get current user for created_by/uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 1. Create or Update the record metadata
      let recordToSave: any;
      
      if (activeTab === 'info') {
        recordToSave = {
          packet_id: currentPacket.id,
          scope: activeScope || 'personA',
          category: formData.category || 'Other',
          title: formData.name || formData.title || '',
          notes: formData.notes || '',
          status: isNA ? 'not_applicable' : 'completed',
          is_na: isNA,
          created_by: user.id
        };
      } else {
        const record = {
          packet_id: currentPacket.id,
          scope: activeScope || 'personA',
          ...formData,
          category: formData.category || 'Other',
          status: isNA ? 'not_applicable' : 'completed',
          is_na: isNA
        };
        const { id, created_at, updated_at, entryOnly, ...rest } = record;
        recordToSave = rest;
      }

      console.log(`${activeTab} insert payload:`, JSON.stringify(recordToSave, null, 2));

      let recordId = initialData?.id;
      if (recordId) {
        const { data: updatedRecord, error: recordError } = await sectionService.updateRecord(activeTab, recordId, recordToSave);
        if (recordError) {
          console.error(`${activeTab} update error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        console.log(`${activeTab} update result: Success`, updatedRecord);
      } else {
        const { data: newRecord, error: recordError } = await sectionService.createRecord(activeTab, recordToSave);
        if (recordError) {
          console.error(`${activeTab} insert error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        recordId = newRecord?.id;
        console.log(`${activeTab} insert result:`, newRecord);
      }

      // 2. Upload file if selected (ONLY after record creation succeeds)
      if (selectedFile && recordId && !isNA && !isEntryOnly) {
        console.log("Starting file upload sequence for record:", recordId);
        const recordTitle = formData.name || formData.property_label || formData.institution || formData.service_name || formData.item_name || formData.title;
        
        const { data: docData, error: uploadError } = await documentService.uploadAndCreate(selectedFile, {
          packetId: currentPacket.id,
          sectionKey: activeTab,
          recordId: recordId,
          category: formData.category,
          fileName: recordTitle || selectedFile.name,
          scope: activeScope || 'personA',
          isPrivate: true // Use packet-private-documents bucket as requested
        });
        
        if (uploadError) {
          console.error("Upload sequence failed:", JSON.stringify(uploadError, null, 2));
          throw uploadError;
        }
        console.log("File upload and metadata storage successful:", docData);
      }
      
      console.log("Final save success");
      alert("Information saved successfully!");
      if (onSuccess) onSuccess();
      handleClose();
    } catch (err: any) {
      console.error("Error saving record:", err);
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      alert(`Failed to save record: ${errorMessage}`);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({});
    setIsNA(false);
    setSelectedFile(null);
    setInitialAttachment(null);
    setErrors({});
  };

  const effectiveCategoryOptions = categoryOptions.length > 0 ? categoryOptions : (activeTab === 'info' ? INFO_CATEGORY_OPTIONS : []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for desktop/tablet */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 hidden md:block"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 md:inset-auto md:top-10 md:bottom-10 md:left-1/2 md:-translate-x-1/2 z-50 bg-white flex flex-col w-full md:max-w-[640px] md:rounded-3xl md:shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#fdfaf3]/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-xl font-serif font-bold text-navy-muted">{title || `Add ${config?.label}`}</h2>
            <button 
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X size={24} className="text-stone-400" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfaf3]">
            {children || (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-bold text-navy-muted">Not Applicable</h4>
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Mark this item as N/A</p>
                  </div>
                  <button
                    onClick={() => setIsNA(!isNA)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isNA ? 'bg-navy-muted' : 'bg-stone-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isNA ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {!isNA && (
                  <>
                    {activeTab === 'info' && !isEntryOnly && effectiveCategoryOptions.length > 0 && (
                      <div className="space-y-1">
                        <CategorySelector
                          options={effectiveCategoryOptions}
                          value={formData.category || ''}
                          onChange={(val) => {
                            setFormData({ ...formData, category: val });
                            if (errors.category) {
                              const newErrors = { ...errors };
                              delete newErrors.category;
                              setErrors(newErrors);
                            }
                          }}
                          required
                          disabled={loading}
                        />
                        {errors.category && (
                          <p className="text-xs font-bold text-red-500 mt-1">{errors.category}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                        {activeTab === 'info' && formData.category === 'Other' ? 'Custom Label / Title' : 'Title / Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={isEntryOnly ? `Enter ${formData.label || 'details'}...` : "Enter a descriptive title..."}
                        className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                        value={getDisplayTitle(formData)}
                        onChange={(e) => setDisplayTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Description / Notes</label>
                      <textarea 
                        rows={4}
                        placeholder="Add any additional details..."
                        className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm resize-none font-medium"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    {!isEntryOnly && (
                      <FileAttachmentField
                        sectionKey={activeTab || ''}
                        packetId={currentPacket?.id || ''}
                        recordId={initialData?.id}
                        scope={activeScope}
                        initialAttachment={initialAttachment}
                        onFileSelected={setSelectedFile}
                        onFileRemoved={() => setSelectedFile(null)}
                        disabled={loading}
                        isPrivate={activeTab === 'private'}
                      />
                    )}
                  </>
                )}

                {isNA && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Item Title (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="What is not applicable?"
                      className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                      value={getDisplayTitle(formData)}
                      onChange={(e) => setDisplayTitle(e.target.value)}
                    />
                    <p className="text-[10px] text-stone-400 italic">
                      Marking this as N/A will clear any existing data for this record upon saving.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-white">
            <button 
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isNA ? 'Confirm N/A Status' : 'Save Information'}
            </button>
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
