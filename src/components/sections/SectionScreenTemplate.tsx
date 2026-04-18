import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Upload, ChevronRight, Loader2, Clock, UserPlus, FileText, Edit2, Trash2 } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { ScopeToggle } from '../layout/ScopeToggle';
import { sectionService } from '../../services/sectionService';
import { documentService } from '../../services/documentService';

import { SectionRecommendations } from './SectionRecommendations';

import { CategoryOption } from '../upload/types';

interface SectionScreenTemplateProps {
  children?: (records: any[], docs: any[], refresh: () => void) => React.ReactNode;
  onAddClick?: (file?: File, data?: any, options?: CategoryOption[], entryOnly?: boolean) => void;
  onEntryClick?: (label: string) => void;
  emptyState?: React.ReactNode;
  onRefresh?: (refreshFn: (newRecord?: any) => void) => void;
}

export const SectionScreenTemplate = ({ 
  children, 
  onAddClick, 
  onEntryClick,
  emptyState,
  onRefresh
}: SectionScreenTemplateProps) => {
  const { activeTab, activeScope, currentPacket, setView, packets, bumpCompletion } = useAppContext();
  const [records, setRecords] = useState<any[]>([]);
  const [docs, setDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Check if partner is joined
  const isPartnerJoined = currentPacket?.household_mode === 'couple' && 
    packets.some(p => p.id === currentPacket.id && p.userRole === 'partner');

  const config = SECTIONS_CONFIG.find(s => s.id === activeTab);

  const fetchData = React.useCallback(async () => {
    if (!currentPacket || !activeTab) return;
    setLoading(true);
    try {
      const { data: recordsData } = await sectionService.getRecords(currentPacket.id, activeTab, activeScope);
      const { data: docsData } = await documentService.getDocuments(currentPacket.id, activeTab);
      
      setRecords(recordsData || []);
      setDocs(docsData || []);
    } catch (err) {
      console.error("Error fetching section data:", err);
    } finally {
      setLoading(false);
    }
  }, [currentPacket, activeTab, activeScope]);

  // Optimistic prepend: add a new record to the top of the list immediately
  const addRecordOptimistic = React.useCallback((newRecord: any) => {
    if (newRecord) {
      setRecords(prev => [newRecord, ...prev.filter(r => r.id !== newRecord.id)]);
    }
    // Also do a background refetch to ensure consistency
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (currentPacket && activeTab) {
      fetchData();
    }
  }, [fetchData, currentPacket, activeTab]);

  useEffect(() => {
    if (onRefresh) {
      onRefresh(addRecordOptimistic);
    }
  }, [onRefresh, addRecordOptimistic]);

  if (!config) return null;

  const hasData = records.length > 0 || docs.length > 0;

  return (
    <div className="p-6 pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">{config.label}</h2>
        <p className="text-sm text-stone-500">{config.description}</p>
      </div>

      <ScopeToggle />

      <SectionRecommendations 
        sectionId={activeTab} 
        existingRecords={records}
        onSuggestionClick={(prefill) => onAddClick?.(undefined, prefill, undefined, prefill.entryOnly)} 
        onEntryClick={onEntryClick}
        onMarkNA={async (prefill) => {
          if (!currentPacket || !activeTab) return;
          try {
            const record = {
              packet_id: currentPacket.id,
              scope: activeScope,
              ...prefill,
              category: prefill.category || 'Other',
              status: 'not_applicable',
              is_na: true
            };
            const { error } = await sectionService.createRecord(activeTab, record);
            if (error) throw error;
            fetchData();
            bumpCompletion();
          } catch (err) {
            console.error("Error marking as N/A:", err);
            toast.error("Failed to mark as N/A", { duration: 4000, position: "bottom-center" });
          }
        }}
        onRestoreNA={async (prefill) => {
          if (!currentPacket || !activeTab) return;
          try {
            // Find the record that matches this prefill and is marked as NA
            const { data: existing } = await sectionService.getRecords(currentPacket.id, activeTab, activeScope);
            const record = existing?.find(r => 
              (r.is_na || r.status === 'not_applicable') && 
              (r.title === prefill.title || r.name === prefill.name || r.item_name === prefill.item_name || r.institution === prefill.institution)
            );
            
            if (record) {
              const { error } = await sectionService.deleteRecord(activeTab, record.id);
              if (error) throw error;
              fetchData();
              bumpCompletion();
            }
          } catch (err) {
            console.error("Error restoring N/A item:", err);
            toast.error("Failed to restore item", { duration: 4000, position: "bottom-center" });
          }
        }}
      />

      {activeScope === 'personB' && !isPartnerJoined && (
        <div className="mt-4 p-4 bg-amber-50 rounded-2xl border border-amber-100 flex items-start gap-3">
          <Clock className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-bold text-amber-900">Partner Access Pending</p>
            <p className="text-[10px] text-amber-700 leading-relaxed mb-2">
              You can draft records for your partner, but they won't be able to access them until they join your household.
            </p>
            <button 
              onClick={() => setView('household')}
              className="text-[10px] font-bold text-amber-900 flex items-center gap-1 hover:underline"
            >
              <UserPlus className="w-3 h-3" />
              Manage Household
            </button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
          <p className="text-stone-500 text-sm">Loading {config.label.toLowerCase()}...</p>
        </div>
      ) : hasData ? (
        <div className="space-y-4">
          {children && children(records, docs, fetchData)}
          <button 
            onClick={() => onAddClick?.()}
            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:border-navy-muted hover:text-navy-muted transition-colors"
          >
            <Plus size={18} />
            <span className="font-bold text-sm">{config.addButtonLabel}</span>
          </button>
        </div>
      ) : (
        emptyState || (
          <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
            <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
              <config.icon size={32} className="text-stone-300" />
            </div>
            <h3 className="text-lg font-bold text-navy-muted mb-2">{config.emptyStateText}</h3>
            <p className="text-sm text-stone-500 mb-6">Keep your family prepared by organizing your {config.label.toLowerCase()} information here.</p>
            <button 
              onClick={() => onAddClick?.()}
              className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
            >
              <Plus size={18} />
              {config.addButtonLabel}
            </button>
          </div>
        )
      )}
    </div>
  );
};

/**
 * Sanitize a value for display — converts null/undefined and the literal
 * strings "null"/"undefined" into an empty string so the UI never renders raw "null".
 */
const sanitize = (val: any): string => {
  if (val === null || val === undefined) return '';
  const s = String(val).trim();
  if (s === '' || s.toLowerCase() === 'null' || s.toLowerCase() === 'undefined') return '';
  return s;
};

/**
 * Build a subtitle from a list of parts joined by " • ", dropping any null/empty
 * pieces. Returns '' if nothing is left.
 */
export const buildSubtitle = (...parts: any[]): string => {
  return parts.map(sanitize).filter(Boolean).join(' • ');
};

export const RecordCard = ({
  title,
  subtitle,
  description,
  icon: Icon,
  avatar,
  onClick,
  onEdit,
  onDelete,
  badge,
  data,
  subtitlePlaceholder,
}: {
  key?: React.Key;
  title?: string;
  subtitle?: string;
  description?: string;
  icon?: React.ElementType;
  /** Optional custom node to render instead of the icon — used for person avatars. */
  avatar?: React.ReactNode;
  onClick?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  badge?: string;
  data?: any;
  subtitlePlaceholder?: string;
}) => {
  const isNA = data?.is_na || data?.status === 'not_applicable';
  // Person/animal lifecycle dimming — applies to family/pets/trusted contacts (is_deceased)
  // and advisors (advisor_status !== 'active').
  const isDeceased = data?.is_deceased === true;
  const advisorStatus = data?.advisor_status as string | undefined;
  const isInactiveAdvisor = advisorStatus && advisorStatus !== 'active';
  const isMuted = isDeceased || isInactiveAdvisor;
  const cleanTitle = sanitize(title) ||
    sanitize(data?.title) || sanitize(data?.name) || sanitize(data?.item_name) ||
    sanitize(data?.institution) || sanitize(data?.service_name) || sanitize(data?.firm) ||
    'Untitled Record';
  const cleanSubtitle = sanitize(subtitle) || sanitize(description);
  const cleanBadge = sanitize(badge);
  // Default tap behavior is to edit (so cards are never "stuck" without an action)
  const handleCardClick = onClick || onEdit;

  // Status badge text
  const statusBadge = isDeceased
    ? '† Deceased'
    : advisorStatus === 'retired'
    ? 'Retired'
    : advisorStatus === 'former'
    ? 'Former'
    : null;

  return (
    <div
      className={`w-full paper-sheet p-5 group transition-all relative overflow-hidden ${isNA ? 'opacity-60 bg-stone-50/50' : ''} ${isMuted && !isNA ? 'opacity-75 bg-stone-50/40' : ''}`}
    >
      <button
        type="button"
        onClick={handleCardClick}
        disabled={!handleCardClick}
        className="w-full text-left flex items-center justify-between active:scale-[0.99] transition-transform disabled:cursor-default"
      >
        <div className="flex items-center gap-4 min-w-0">
          {Icon && (
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${isNA || isMuted ? 'bg-stone-100 text-stone-400' : 'bg-stone-50 text-navy-muted'}`}>
              <Icon size={20} />
            </div>
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className={`font-bold ${isNA ? 'text-stone-400 line-through' : isMuted ? 'text-stone-500' : 'text-navy-muted'}`}>{cleanTitle}</h4>
              {isNA && (
                <span className="px-2 py-0.5 bg-stone-200 rounded text-[10px] font-bold uppercase text-stone-500 border border-stone-300">
                  N/A
                </span>
              )}
              {!isNA && statusBadge && (
                <span className="px-2 py-0.5 bg-stone-200 rounded text-[10px] font-bold uppercase text-stone-600 border border-stone-300">
                  {statusBadge}
                </span>
              )}
              {cleanBadge && !isNA && !statusBadge && (
                <span className="px-2 py-0.5 bg-manila rounded text-[10px] font-bold uppercase text-navy-muted border border-folder-edge">
                  {cleanBadge}
                </span>
              )}
            </div>
            {!isNA && (
              cleanSubtitle ? (
                <p className="text-xs text-stone-500 mt-0.5 truncate">{cleanSubtitle}</p>
              ) : subtitlePlaceholder ? (
                <p className="text-xs text-stone-400 italic mt-0.5 truncate">{subtitlePlaceholder}</p>
              ) : null
            )}
            {isNA && <p className="text-[10px] text-stone-400 italic mt-0.5">Marked as Not Applicable</p>}
          </div>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {onEdit && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onEdit(); } }}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-400 hover:text-navy-muted transition-colors cursor-pointer"
              aria-label="Edit"
            >
              <Edit2 size={14} />
            </span>
          )}
          {onDelete && (
            <span
              role="button"
              tabIndex={0}
              onClick={(e) => { e.stopPropagation(); onDelete(); }}
              onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.stopPropagation(); onDelete(); } }}
              className="p-1.5 hover:bg-red-50 rounded-lg text-stone-400 hover:text-red-500 transition-colors cursor-pointer"
              aria-label="Delete"
            >
              <Trash2 size={14} />
            </span>
          )}
          <ChevronRight size={18} className="text-stone-300 group-hover:text-navy-muted transition-colors" />
        </div>
      </button>
    </div>
  );
};

export const DocumentUploadCard = ({ 
  label, 
  status = 'missing', 
  onUpload,
  onView,
  isNA = false
}: { 
  label: string, 
  status?: 'uploaded' | 'missing' | 'optional',
  onUpload?: (file: File) => void,
  onView?: () => void,
  isNA?: boolean
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && onUpload) {
      setIsUploading(true);
      try {
        await onUpload(file);
      } finally {
        setIsUploading(false);
      }
    }
  };

  if (isNA) {
    return (
      <div className="p-4 bg-stone-50/50 rounded-2xl border border-stone-200 flex items-center justify-between opacity-60">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-stone-200 text-stone-400">
            <FileText size={16} />
          </div>
          <div>
            <p className="text-sm font-bold text-stone-400 line-through">{label}</p>
            <p className="text-[10px] text-stone-400 italic">Marked as Not Applicable</p>
          </div>
        </div>
        <div className="px-2 py-0.5 bg-stone-200 rounded text-[10px] font-bold uppercase text-stone-500 border border-stone-300">
          N/A
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-stone-50 rounded-2xl border border-stone-200 flex items-center justify-between">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
      />
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${status === 'uploaded' ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-200 text-stone-400'}`}>
          {isUploading ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
        </div>
        <div>
          <p className="text-xs font-bold text-navy-muted">{label}</p>
          <p className={`text-[10px] uppercase font-bold tracking-wider ${status === 'uploaded' ? 'text-emerald-600' : 'text-stone-400'}`}>
            {isUploading ? 'Uploading...' : status}
          </p>
        </div>
      </div>
      <button 
        onClick={() => {
          if (status === 'uploaded' && onView) {
            onView();
          } else if (!isUploading) {
            fileInputRef.current?.click();
          }
        }}
        disabled={isUploading}
        className="px-3 py-1.5 bg-white rounded-lg text-[10px] font-bold uppercase text-navy-muted border border-stone-200 shadow-sm active:scale-95 transition-all disabled:opacity-50"
      >
        {status === 'uploaded' ? 'View' : 'Upload'}
      </button>
    </div>
  );
};
