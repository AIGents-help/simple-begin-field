import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { sectionService } from '../../services/sectionService';

interface EntryFormProps {
  isOpen: boolean;
  onClose: () => void;
  entryLabel: string;
  onSuccess?: () => void;
}

export const EntryForm = ({ isOpen, onClose, entryLabel, onSuccess }: EntryFormProps) => {
  const { activeScope, currentPacket } = useAppContext();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setFormData({});
      setErrors({});
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    const fields = getFields();
    
    fields.forEach(field => {
      if (field.required && !formData[field.name]) {
        newErrors[field.name] = `${field.label} is required`;
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!currentPacket) return;
    if (!validate()) return;

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      const recordToSave = {
        packet_id: currentPacket.id,
        scope: activeScope || 'personA',
        category: 'Other',
        title: entryLabel,
        notes: JSON.stringify(formData),
        status: 'completed',
        is_na: false,
        created_by: user.id
      };

      const { error } = await sectionService.createRecord('info', recordToSave);
      if (error) throw error;

      toast.success("Information saved successfully!", { icon: <CheckCircle size={18} className="text-emerald-500" />, duration: 3000, position: "bottom-center" });
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      console.error("Error saving entry:", err);
      toast.error(`Failed to save entry: ${err.message}`, { duration: 5000, position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  const getFields = () => {
    switch (entryLabel) {
      case "Full Legal Name":
        return [
          { name: "firstName", label: "First Name", required: true },
          { name: "middleName", label: "Middle Name", required: false },
          { name: "lastName", label: "Last Name", required: true },
          { name: "suffix", label: "Suffix", required: false },
        ];
      case "Date of Birth":
        return [
          { name: "dob", label: "Date of Birth", required: true, type: "date" },
          { name: "pob", label: "Place of Birth", required: false },
        ];
      case "Home Address":
        return [
          { name: "street", label: "Street Address", required: true },
          { name: "city", label: "City", required: true },
          { name: "state", label: "State", required: true },
          { name: "zip", label: "Zip Code", required: true },
          { name: "country", label: "Country", required: false, defaultValue: "USA" },
        ];
      case "Phone Number":
        return [
          { name: "primaryPhone", label: "Primary Phone", required: true, type: "tel" },
          { name: "phoneType", label: "Phone Type (Mobile/Home/Work)", required: true },
          { name: "secondaryPhone", label: "Secondary Phone", required: false, type: "tel" },
        ];
      case "Email Address":
        return [
          { name: "primaryEmail", label: "Primary Email", required: true, type: "email" },
          { name: "secondaryEmail", label: "Secondary Email", required: false, type: "email" },
        ];
      case "Emergency Contact":
        return [
          { name: "contactName", label: "Contact Name", required: true },
          { name: "relationship", label: "Relationship", required: true },
          { name: "phone", label: "Phone", required: true, type: "tel" },
          { name: "secondaryPhone", label: "Secondary Phone", required: false, type: "tel" },
          { name: "email", label: "Email", required: false, type: "email" },
        ];
      case "Driver's License Details":
        return [
          { name: "licenseNumber", label: "License Number", required: true },
          { name: "stateIssued", label: "State Issued", required: true },
          { name: "expiryDate", label: "Expiry Date", required: true, type: "date" },
          { name: "licenseClass", label: "License Class", required: false },
        ];
      case "Passport Details":
        return [
          { name: "passportNumber", label: "Passport Number", required: true },
          { name: "countryOfIssue", label: "Country of Issue", required: true },
          { name: "issueDate", label: "Issue Date", required: true, type: "date" },
          { name: "expiryDate", label: "Expiry Date", required: true, type: "date" },
          { name: "placeOfIssue", label: "Place of Issue", required: false },
        ];
      case "Social Security Card":
        return [
          { name: "cardLocation", label: "Where is physical card stored?", required: false },
          { name: "numberLocation", label: "Where is number documented?", required: false },
          { name: "whoKnows", label: "Who else knows this?", required: false },
        ];
      case "Marriage Information":
        return [
          { name: "spouseName", label: "Spouse Full Name", required: true },
          { name: "marriageDate", label: "Date of Marriage", required: true, type: "date" },
          { name: "marriageLocation", label: "Location of Marriage", required: true },
          { name: "certLocation", label: "Certificate Location", required: true },
          { name: "officiant", label: "Officiant Name", required: false },
        ];
      default:
        return [
          { name: "notes", label: "Notes", required: false, type: "textarea" },
        ];
    }
  };

  const fields = getFields();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
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
              <h2 className="text-xl font-serif font-bold text-navy-muted">{entryLabel}</h2>
              <button 
                onClick={onClose}
                disabled={loading}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} className="text-stone-400" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfaf3]">
              <div className="space-y-4">
                {fields.map((field) => (
                  <div key={field.name} className="space-y-1.5">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      {field.label} {field.required && <span className="text-red-500">*</span>}
                    </label>
                    {field.type === 'textarea' ? (
                      <textarea
                        rows={4}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                        className={`w-full p-4 bg-white rounded-2xl border ${errors[field.name] ? 'border-red-500' : 'border-stone-200'} focus:border-navy-muted outline-none shadow-sm resize-none font-medium`}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        disabled={loading}
                      />
                    ) : (
                      <input 
                        type={field.type || 'text'}
                        placeholder={field.defaultValue || `Enter ${field.label.toLowerCase()}...`}
                        className={`w-full p-4 bg-white rounded-2xl border ${errors[field.name] ? 'border-red-500' : 'border-stone-200'} focus:border-navy-muted outline-none shadow-sm font-medium`}
                        value={formData[field.name] || ''}
                        onChange={(e) => handleInputChange(field.name, e.target.value)}
                        disabled={loading}
                      />
                    )}
                    {errors[field.name] && (
                      <p className="text-[10px] font-bold text-red-500 ml-1">{errors[field.name]}</p>
                    )}
                  </div>
                ))}
              </div>
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
                Save Entry
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
