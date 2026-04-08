import React from 'react';
import { FileText, Paperclip, ChevronRight, Eye, Edit2, Trash2, ClipboardList } from 'lucide-react';
import { format } from 'date-fns';

interface InfoRecordCardProps {
  record: any;
  hasFile: boolean;
  onClick?: () => void;
  onEdit?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onView?: (e: React.MouseEvent) => void;
}

const formatKey = (key: string) => {
  const specificMappings: Record<string, string> = {
    firstName: "First Name",
    middleName: "Middle Name",
    lastName: "Last Name",
    suffix: "Suffix",
    dob: "Date of Birth",
    pob: "Place of Birth",
    street: "Street Address",
    city: "City",
    state: "State",
    zip: "Zip Code",
    country: "Country",
    primaryPhone: "Primary Phone",
    phoneType: "Phone Type",
    secondaryPhone: "Secondary Phone",
    primaryEmail: "Primary Email",
    secondaryEmail: "Secondary Email",
    contactName: "Contact Name",
    relationship: "Relationship",
    phone: "Phone",
    email: "Email",
    licenseNumber: "License Number",
    stateIssued: "State Issued",
    expiryDate: "Expiry Date",
    licenseClass: "License Class",
    passportNumber: "Passport Number",
    countryOfIssue: "Country of Issue",
    issueDate: "Issue Date",
    placeOfIssue: "Place of Issue",
    cardLocation: "Card Location",
    numberLocation: "Number Location",
    whoKnows: "Who else knows",
    spouseName: "Spouse Name",
    marriageDate: "Marriage Date",
    marriageLocation: "Marriage Location",
    certLocation: "Certificate Location",
    officiant: "Officiant Name",
  };

  if (specificMappings[key]) return specificMappings[key];

  return key
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export const InfoRecordCard = ({ record, hasFile, onClick, onEdit, onDelete, onView }: InfoRecordCardProps) => {
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

  const displayTitle = record.title || record.name || record.item_name || record.institution || record.service_name;

  // If it's N/A and has no title, we might want to hide it or show a placeholder
  // but the user specifically asked to fix the "Untitled Record" showing at the top.
  if (isNA && !displayTitle) return null;

  return (
    <button 
      onClick={onClick}
      className={`w-full text-left paper-sheet p-5 group active:scale-[0.98] transition-all relative overflow-hidden ${isNA ? 'opacity-60 bg-stone-50/50' : ''}`}
    >
      <div className="flex justify-between items-start mb-3">
        <div className="flex flex-wrap gap-2">
          {!isNA && (
            <>
              {isEntryType ? (
                <span className="px-2 py-0.5 bg-stone-100 rounded text-[10px] font-bold uppercase text-stone-500 border border-stone-200 flex items-center gap-1">
                  <ClipboardList size={10} />
                  Entry
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-manila rounded text-[10px] font-bold uppercase text-navy-muted border border-folder-edge">
                  {record.category}
                </span>
              )}
            </>
          )}
          {isNA && (
            <span className="px-2 py-0.5 bg-stone-200 rounded text-[10px] font-bold uppercase text-stone-500 border border-stone-300">
              N/A
            </span>
          )}
          {hasFile && !isNA && (
            <span className="px-2 py-0.5 bg-emerald-50 rounded text-[10px] font-bold uppercase text-emerald-600 border border-emerald-100 flex items-center gap-1">
              <Paperclip size={10} />
              Attached
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          {onView && !isNA && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onView(e);
              }} 
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-navy-muted transition-colors"
            >
              <Eye size={14} />
            </button>
          )}
          {onEdit && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onEdit(e);
              }} 
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-navy-muted transition-colors"
            >
              <Edit2 size={14} />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => {
                e.stopPropagation();
                onDelete(e);
              }} 
              className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex-1 pr-4">
          <h4 className={`font-bold text-lg mb-2 ${isNA ? 'text-stone-400 line-through' : 'text-navy-muted'}`}>
            {displayTitle || 'Untitled Record'}
          </h4>
          
          {isEntryType && entryData && !isNA ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1 mb-3">
              {Object.entries(entryData).map(([key, value]) => (
                <div key={key} className="flex items-baseline gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-stone-400 shrink-0">
                    {formatKey(key)}:
                  </span>
                  <span className="text-xs text-stone-600 font-medium truncate">
                    {String(value)}
                  </span>
                </div>
              ))}
            </div>
          ) : record.notes && !isNA && (
            <p className="text-xs text-stone-500 line-clamp-2 mb-2">{record.notes}</p>
          )}

          {isNA && (
            <p className="text-[10px] text-stone-400 italic mb-2">Marked as Not Applicable</p>
          )}
          <div className="flex items-center gap-3 text-[10px] text-stone-400 font-medium">
            {!isNA && (
              <span className="flex items-center gap-1">
                <FileText size={10} />
                {hasFile ? 'Document attached' : 'No document attached'}
              </span>
            )}
            {record.updated_at && (
              <span>Updated {format(new Date(record.updated_at), 'MMM d, yyyy')}</span>
            )}
          </div>
        </div>
        <ChevronRight size={20} className="text-stone-300 group-hover:text-navy-muted transition-colors shrink-0" />
      </div>
    </button>
  );
};
