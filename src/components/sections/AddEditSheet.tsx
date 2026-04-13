import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
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
  onSuccess?: (newRecord?: any) => void;
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

  // Section-specific field definitions
  const getSectionFields = (): { name: string; label: string; required?: boolean; type?: string; placeholder?: string; options?: string[]; rows?: number }[] | null => {
    switch (activeTab) {
      case 'family':
        return [
          { name: 'name', label: 'Full Name', required: true, placeholder: 'e.g. Jane Doe' },
          { name: 'relationship', label: 'Relationship', required: true, type: 'select', options: ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'Friend', 'Other'] },
          { name: 'phone', label: 'Phone Number', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'email', label: 'Email Address', type: 'email', placeholder: 'jane@example.com' },
          { name: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
          { name: 'birthday', label: 'Birthday', type: 'date' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'medical':
        return [
          { name: 'provider_name', label: 'Provider Name', required: true, placeholder: 'e.g. Dr. Smith' },
          { name: 'specialty', label: 'Specialty', placeholder: 'e.g. Cardiologist' },
          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'advisors':
        return [
          { name: 'advisor_type', label: 'Advisor Type', required: true, type: 'select', options: ['Attorney', 'Financial Advisor', 'CPA/Accountant', 'Insurance Agent', 'Doctor', 'Other'] },
          { name: 'name', label: 'Name', required: true, placeholder: 'e.g. John Smith' },
          { name: 'firm', label: 'Firm / Company', placeholder: 'e.g. Smith & Associates' },
          { name: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'advisor@firm.com' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'banking':
        return [
          { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g. Chase, Wells Fargo' },
          { name: 'account_type', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Money Market', 'CD', 'Other'] },
          { name: 'account_number_masked', label: 'Account Number', placeholder: 'Last 4 digits only for security' },
          { name: 'routing_number_masked', label: 'Routing Number', placeholder: 'Last 4 digits only' },
          { name: 'contact_info', label: 'Contact / Branch Info', placeholder: 'Branch address or phone' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'retirement':
        return [
          { name: 'account_type', label: 'Account Type', type: 'select', options: ['401(k)', 'IRA', 'Roth IRA', 'Pension', '403(b)', 'Other'] },
          { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g. Fidelity, Vanguard' },
          { name: 'account_number_masked', label: 'Account Number', placeholder: 'Last 4 digits only' },
          { name: 'beneficiary_notes', label: 'Beneficiary Notes', type: 'textarea', placeholder: 'Who is the beneficiary?' },
          { name: 'contact_info', label: 'Contact Info', placeholder: 'Advisor or institution contact' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'vehicles':
        return [
          { name: 'year', label: 'Year', placeholder: '4-digit year, e.g. 2022' },
          { name: 'make', label: 'Make', placeholder: 'e.g. Toyota' },
          { name: 'model', label: 'Model', placeholder: 'e.g. Camry' },
          { name: 'vin', label: 'VIN', placeholder: '17-character VIN' },
          { name: 'license_plate', label: 'License Plate', placeholder: 'ABC-1234' },
          { name: 'insurance', label: 'Insurance', placeholder: 'Carrier and policy number' },
          { name: 'lien_info', label: 'Lien Info', placeholder: 'Lien holder if any' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'real-estate':
        return [
          { name: 'property_label', label: 'Property Label', required: true, placeholder: 'e.g. Primary Home' },
          { name: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
          { name: 'insurance_details', label: 'Insurance Details', type: 'textarea', placeholder: 'Carrier and policy number', rows: 2 },
          { name: 'security_system_details', label: 'Security System Details', placeholder: 'Alarm code, provider, etc.' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'passwords':
        return [
          { name: 'service_name', label: 'Service Name', required: true, placeholder: 'e.g. Gmail, Netflix' },
          { name: 'username', label: 'Username', placeholder: 'Login username or email' },
          { name: 'access_instructions', label: 'Access Instructions', type: 'textarea', placeholder: 'How to access this account — write for a survivor to read' },
          { name: 'recovery_email', label: 'Recovery Email', type: 'email', placeholder: 'Recovery email address' },
          { name: 'two_fa_notes', label: 'Two-Factor Auth Notes', placeholder: 'How to access 2FA codes' },
          { name: 'who_should_access', label: 'Who Should Access', placeholder: 'Who needs this after you?' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'property':
        return [
          { name: 'item_name', label: 'Item Name', required: true, placeholder: 'e.g. Grandmother\'s Ring' },
          { name: 'description', label: 'Description', placeholder: 'Brief description' },
          { name: 'location', label: 'Location', placeholder: 'Where is it stored?' },
          { name: 'estimated_value', label: 'Estimated Value', placeholder: '$0.00' },
          { name: 'beneficiary', label: 'Intended Recipient', placeholder: 'Who should receive this?' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'pets':
        return [
          { name: 'pet_name', label: 'Pet Name', required: true, placeholder: 'e.g. Buddy' },
          { name: 'species_breed', label: 'Species & Breed', placeholder: 'e.g. Golden Retriever' },
          { name: 'age', label: 'Age', placeholder: 'e.g. 5 years' },
          { name: 'veterinarian_contact', label: 'Veterinarian Contact', placeholder: 'Vet name and phone' },
          { name: 'medications', label: 'Medications', type: 'textarea', placeholder: 'Current medications' },
          { name: 'feeding_instructions', label: 'Feeding Instructions', type: 'textarea', placeholder: 'Diet and feeding schedule' },
          { name: 'care_instructions', label: 'Care Instructions', type: 'textarea', placeholder: 'Daily care routine' },
          { name: 'emergency_notes', label: 'Emergency Notes', type: 'textarea', placeholder: 'Emergency care info' },
        ];
      case 'funeral':
        return [
          { name: 'funeral_home', label: 'Funeral Home', placeholder: 'Name of funeral home' },
          { name: 'funeral_director', label: 'Funeral Director', placeholder: 'Contact person' },
          { name: 'burial_or_cremation', label: 'Burial or Cremation', type: 'select', options: ['Burial', 'Cremation', 'No Preference', 'Pre-arranged'] },
          { name: 'service_preferences', label: 'Service Preferences', type: 'textarea', placeholder: 'Type of service desired' },
          { name: 'religious_cultural_preferences', label: 'Religious / Cultural Preferences', placeholder: 'Any traditions or customs' },
          { name: 'cemetery_plot_details', label: 'Cemetery / Plot Details', placeholder: 'Location and plot info' },
          { name: 'prepaid_arrangements', label: 'Prepaid Arrangements', placeholder: 'Details of prepaid plans' },
          { name: 'obituary_notes', label: 'Obituary Notes', type: 'textarea', placeholder: 'Key points for obituary' },
          { name: 'additional_instructions', label: 'Additional Instructions', type: 'textarea', placeholder: 'Anything else...' },
        ];
      case 'private':
        return [
          { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Safe combination' },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about this private item' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional notes...' },
        ];
      default:
        return null; // Use generic form
    }
  };

  const sectionFields = getSectionFields();
  const hasSectionFields = sectionFields !== null && !isEntryOnly;

  const getDisplayTitle = (data: any) => {
    if (sectionFields) {
      const primaryField = sectionFields[0];
      return data[primaryField.name] || '';
    }
    return data.title || data.name || data.item_name || data.institution || 
           data.service_name || data.property_label || data.model || 
           data.service_preferences || data.burial_or_cremation || 
           data.funeral_home || data.prepaid_arrangements || '';
  };

  const setDisplayTitle = (val: string) => {
    if (sectionFields) {
      const primaryField = sectionFields[0];
      setFormData({ ...formData, [primaryField.name]: val });
      return;
    }
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
    if (!currentPacket || !activeTab) {
      toast.error("Unable to save: missing packet or section context.", { duration: 5000, position: "bottom-center" });
      return;
    }
    
    // Validation for section-specific fields
    if (!isNA && hasSectionFields && sectionFields) {
      const newErrors: Record<string, string> = {};
      sectionFields.forEach(field => {
        if (field.required && !formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
        }
      });
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

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
      let savedRecord: any = null;
      if (recordId) {
        const { data: updatedRecord, error: recordError } = await sectionService.updateRecord(activeTab, recordId, recordToSave);
        if (recordError) {
          console.error(`${activeTab} update error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        savedRecord = updatedRecord;
        console.log(`${activeTab} update result: Success`, updatedRecord);
      } else {
        const { data: newRecord, error: recordError } = await sectionService.createRecord(activeTab, recordToSave);
        if (recordError) {
          console.error(`${activeTab} insert error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        recordId = newRecord?.id;
        savedRecord = newRecord;
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
          fileName: selectedFile.name,
          scope: activeScope || 'personA',
          isPrivate: activeTab === 'private'
        });
        
        if (uploadError) {
          console.error("Upload sequence failed:", JSON.stringify(uploadError, null, 2));
          throw uploadError;
        }
        console.log("File upload and metadata storage successful:", docData);
      }
      
      console.log("Final save success");
      toast.success("Information saved successfully!", { icon: <CheckCircle size={18} className="text-emerald-500" />, duration: 3000, position: "bottom-center" });
      if (onSuccess) onSuccess(savedRecord);
      handleClose();
    } catch (err: any) {
      console.error("Error saving record:", err);
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      toast.error(`Failed to save record: ${errorMessage}`, { duration: 5000, position: "bottom-center" });
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
            <h2 className="text-xl font-serif font-bold text-navy-muted">
              {title || (() => {
                // Section-specific default modal titles
                const sectionTitles: Record<string, string> = {
                  'medical': 'Add Medical Provider',
                  'banking': 'Add Bank Account',
                  'real-estate': 'Add Property',
                  'retirement': 'Add Retirement Account',
                  'vehicles': 'Add Vehicle',
                  'advisors': 'Add Advisor',
                  'passwords': 'Add Password / Access',
                  'property': 'Add Personal Property',
                  'pets': 'Add Pet',
                  'funeral': 'Add Funeral Wishes',
                  'private': 'Add Private Item',
                  'family': 'Add Family Member',
                };
                // Dynamic title based on prefilled select field
                if (sectionFields && initialData) {
                  const prefilledSelect = sectionFields.find(f => f.type === 'select' && initialData[f.name]);
                  if (prefilledSelect) return `Add ${initialData[prefilledSelect.name]}`;
                }
                return (activeTab && sectionTitles[activeTab]) || `Add ${config?.label}`;
              })()}
            </h2>
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

                {!isNA && hasSectionFields && sectionFields && (
                  <>
                    {/* Show read-only label for pre-filled select fields */}
                    {sectionFields && initialData && (() => {
                      const prefilledSelect = sectionFields.find(f => f.type === 'select' && initialData[f.name] && formData[f.name]);
                      if (!prefilledSelect) return null;
                      return (
                        <div className="p-4 bg-manila/30 border border-manila rounded-2xl flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Adding:</span>
                          <span className="text-sm font-bold text-navy-muted">{formData[prefilledSelect.name]}</span>
                        </div>
                      );
                    })()}

                    {sectionFields
                      .filter((field) => {
                        if (field.type === 'select' && initialData?.[field.name] && formData[field.name]) return false;
                        return true;
                      })
                      .map((field) => (
                      <div key={field.name} className="space-y-2">
                        <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                          {field.label} {field.required && <span className="text-red-500">*</span>}
                        </label>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={field.rows || 3}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm resize-none font-medium"
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            disabled={loading}
                          />
                        ) : field.type === 'select' && field.options ? (
                          <select
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium appearance-none"
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            disabled={loading}
                          >
                            <option value="">Select {field.label.toLowerCase()}...</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : (
                          <input
                            type={field.type || 'text'}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                            value={formData[field.name] || ''}
                            onChange={(e) => setFormData({ ...formData, [field.name]: e.target.value })}
                            disabled={loading}
                          />
                        )}
                        {errors[field.name] && (
                          <p className="text-xs font-bold text-red-500 mt-1">{errors[field.name]}</p>
                        )}
                      </div>
                    ))}

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
                  </>
                )}

                {!isNA && !hasSectionFields && (
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
