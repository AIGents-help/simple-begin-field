import React from 'react';
import { X, Edit2, Trash2, FileText, Paperclip, Download, ExternalLink, Clock, Info } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';

import { UploadedFileCard } from '../upload/UploadedFileCard';
import { FileMetadata } from '../upload/types';

interface InfoRecordDetailSheetProps {
  isOpen: boolean;
  onClose: () => void;
  record: any;
  document?: any;
  onEdit: () => void;
  onDelete: () => void;
  onViewFile: () => void;
}

const formatKey = (key: string) => {
  const specificMappings: Record<string, string> = {
    firstName: "First Name",
    lastName: "Last Name",
    dob: "Date of Birth",
    pob: "Place of Birth",
    streetAddress: "Street Address",
    zipCode: "Zip Code",
    phoneType: "Phone Type",
    primaryPhone: "Primary Phone",
    secondaryPhone: "Secondary Phone",
    primaryEmail: "Primary Email",
    secondaryEmail: "Secondary Email",
    licenseNumber: "License Number",
    stateIssued: "State Issued",
    expiryDate: "Expiry Date",
    passportNumber: "Passport Number",
    countryOfIssue: "Country of Issue",
    issueDate: "Issue Date",
    placeOfIssue: "Place of Issue",
    spouseName: "Spouse Name",
    dateOfMarriage: "Date of Marriage",
    locationOfMarriage: "Location of Marriage",
    certificateLocation: "Certificate Location",
    officiantName: "Officiant Name",
    // Adding mappings from EntryForm.tsx as well for robustness
    street: "Street Address",
    zip: "Zip Code",
    marriageDate: "Date of Marriage",
    marriageLocation: "Location of Marriage",
    certLocation: "Certificate Location",
    officiant: "Officiant Name",
    cardLocation: "Card Location",
    numberLocation: "Number Location",
    whoKnows: "Who else knows",
  };

  if (specificMappings[key]) return specificMappings[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const InfoRecordDetailSheet = ({
  isOpen,
  onClose,
  record,
  document,
  onEdit,
  onDelete,
  onViewFile
}: InfoRecordDetailSheetProps) => {
  if (!record) return null;

  const isNA = record.is_na || record.status === 'not_applicable';
  
  let entryData: any = null;
  const isEntryType = record.notes?.startsWith('{');
  
  if (isEntryType) {
    try {
      entryData = JSON.parse(record.notes);
    } catch (e) {
      console.error("Failed to parse entry data JSON", e);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-stone-900/40 backdrop-blur-sm z-50"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 z-50 bg-white rounded-t-[32px] max-w-md mx-auto flex flex-col max-h-[90vh]"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center sticky top-0 bg-white rounded-t-[32px] z-10">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isNA ? 'bg-stone-100 text-stone-400' : 'bg-manila text-navy-muted'}`}>
                  <Info size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-serif font-bold text-navy-muted">Record Details</h2>
                  <p className="text-[10px] uppercase font-bold tracking-widest text-stone-400">
                    {isNA ? 'Not Applicable' : record.category}
                  </p>
                </div>
              </div>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-stone-100 rounded-full transition-colors"
              >
                <X size={24} className="text-stone-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-8 bg-[#fdfaf3]">
              {isNA && (
                <div className="p-4 bg-stone-100 border border-stone-200 rounded-2xl flex items-center gap-3 text-stone-600">
                  <Info size={18} className="shrink-0" />
                  <p className="text-xs font-medium">This item has been marked as Not Applicable (N/A).</p>
                </div>
              )}

              {/* Main Info */}
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 block">Title / Name</label>
                  <p className={`text-lg font-bold leading-tight ${isNA ? 'text-stone-400 line-through' : 'text-navy-muted'}`}>
                    {record.title || record.name || record.item_name || record.institution || record.service_name || 'Untitled Record'}
                  </p>
                </div>

                {isEntryType && entryData && !isNA ? (
                  <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden divide-y divide-stone-50 shadow-sm">
                    {Object.entries(entryData).map(([key, value]) => {
                      if (value === null || value === undefined || value === '') return null;
                      return (
                        <div key={key} className="p-4 space-y-1">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                            {formatKey(key)}
                          </label>
                          <p className="text-sm font-bold text-navy-muted">
                            {String(value)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                ) : record.notes && !isNA && (
                  <div>
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 mb-1 block">Description / Notes</label>
                    <div className="bg-white p-4 rounded-2xl border border-stone-100 text-sm text-stone-600 leading-relaxed">
                      {record.notes}
                    </div>
                  </div>
                )}
              </div>

              {/* Document Section */}
              {!isNA && (
                <div className="space-y-4">
                  {document ? (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Attached Document</label>
                      <UploadedFileCard
                        file={document as FileMetadata}
                        onView={onViewFile}
                      />
                    </>
                  ) : !isEntryType && (
                    <>
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Attached Document</label>
                      <div className="p-8 border-2 border-dashed border-stone-200 rounded-2xl flex flex-col items-center justify-center gap-2 text-stone-400 bg-white/50">
                        <FileText size={24} />
                        <span className="font-bold text-sm">No document attached</span>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Metadata */}
              <div className="pt-4 border-t border-stone-100 flex items-center gap-4 text-[10px] text-stone-400 font-bold uppercase tracking-widest">
                <div className="flex items-center gap-1">
                  <Clock size={12} />
                  Updated {format(new Date(record.updated_at), 'MMM d, yyyy')}
                </div>
                <div className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-manila" />
                  {record.scope} scope
                </div>
              </div>
            </div>

            <div className="p-6 border-t border-stone-100 bg-white grid grid-cols-2 gap-3">
              <button 
                onClick={onEdit}
                className="flex items-center justify-center gap-2 py-4 bg-white text-navy-muted border border-stone-200 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Edit2 size={18} />
                Edit
              </button>
              <button 
                onClick={onDelete}
                className="flex items-center justify-center gap-2 py-4 bg-red-50 text-red-600 border border-red-100 rounded-2xl font-bold text-sm shadow-sm active:scale-95 transition-all"
              >
                <Trash2 size={18} />
                Delete
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
