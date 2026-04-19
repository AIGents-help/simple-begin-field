import React, { useState } from 'react';
import { Lightbulb, ChevronDown, ChevronUp, Plus, FileText, HelpCircle, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { RECOMMENDATIONS_CONFIG } from '../../config/recommendationsConfig';
import { SectionId } from '../../config/types';

interface SectionRecommendationsProps {
  sectionId: SectionId;
  onSuggestionClick: (prefill: any) => void;
  onEntryClick?: (label: string) => void;
  onMarkNA?: (prefill: any) => void;
  onRestoreNA?: (prefill: any) => void;
  existingRecords?: any[];
}

export const SectionRecommendations = ({
  sectionId,
  onSuggestionClick,
  onEntryClick,
  onMarkNA,
  onRestoreNA,
  existingRecords = []
}: SectionRecommendationsProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [showHidden, setShowHidden] = useState(false);
  const recommendations = RECOMMENDATIONS_CONFIG[sectionId];

  if (!recommendations) return null;

  const getExistingRecord = (item: any) => {
    if (!existingRecords || existingRecords.length === 0) return null;
    
    const normalize = (str: string) => str
      .toLowerCase()
      .trim()
      .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035']/g, "'");

    const label = normalize(item.label || '');
    if (!label) return null;

    return existingRecords.find(record => {
      const recordTitle = normalize(
        record.title || record.name || record.item_name || record.institution || 
        record.service_name || record.property_label || record.model || 
        record.service_preferences || record.burial_or_cremation || 
        record.funeral_home || record.prepaid_arrangements || ''
      );
      const recordCategory = normalize(record.category || '');

      // Match against title, name, or category
      const titleMatch = recordTitle && (recordTitle.includes(label) || label.includes(recordTitle));
      const categoryMatch = recordCategory && (recordCategory.includes(label) || label.includes(recordCategory));

      return titleMatch || categoryMatch;
    });
  };

  const processItems = (items: any[]) => {
    const active: any[] = [];
    const hidden: any[] = [];
    
    items.forEach(item => {
      const record = getExistingRecord(item);
      if (!record) {
        active.push(item);
      } else if (record.is_na || record.status === 'not_applicable') {
        hidden.push({ ...item, recordId: record.id });
      }
      // If record exists and is NOT N/A, it's already added, so we don't show it at all
    });
    
    return { active, hidden };
  };

  const entries = processItems(recommendations.entries);
  const documents = processItems(recommendations.documents);
  const contacts = processItems(recommendations.contacts || []);

  const totalHidden = entries.hidden.length + documents.hidden.length + contacts.hidden.length;
  const hasActive = entries.active.length > 0 || documents.active.length > 0 || contacts.active.length > 0;

  if (!hasActive && totalHidden === 0) {
    return null;
  }

  return (
    <div className="mb-6">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between p-4 bg-manila/30 border border-manila rounded-2xl text-navy-muted transition-all hover:bg-manila/40"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-manila rounded-lg flex items-center justify-center text-navy-muted shadow-sm">
            <Lightbulb size={18} />
          </div>
          <div className="text-left">
            <h3 className="text-sm font-bold">Recommended Information to Add</h3>
            <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Guided Suggestions</p>
            {!isExpanded && (
              <p className="text-[11px] text-stone-500 italic mt-1 normal-case tracking-normal font-normal">
                Expand for suggested entries to consider adding to this section.
              </p>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronUp size={20} className="text-stone-400 shrink-0" /> : <ChevronDown size={20} className="text-stone-400 shrink-0" />}
      </button>

      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="mt-3 p-5 bg-white border border-stone-100 rounded-3xl shadow-sm space-y-6">
              {(entries.active.length > 0 || (showHidden && entries.hidden.length > 0)) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Plus size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recommended Entries</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {entries.active.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <button
                          onClick={() => onEntryClick ? onEntryClick(item.label) : onSuggestionClick({ ...item.prefill, entryOnly: true })}
                          className="px-3 py-2 bg-stone-50 hover:bg-manila/20 border border-stone-200 hover:border-manila rounded-xl text-xs font-bold text-navy-muted transition-all active:scale-95"
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                    {showHidden && entries.hidden.map((item, idx) => (
                      <div key={`hidden-${idx}`} className="flex items-center gap-1">
                        <span className="px-3 py-2 bg-stone-50/50 border border-stone-100 rounded-xl text-xs font-medium text-stone-400 italic">
                          {item.label}
                        </span>
                        {onRestoreNA && (
                          <button
                            onClick={() => onRestoreNA(item.prefill)}
                            className="p-2 text-[10px] font-bold text-navy-muted hover:underline transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(documents.active.length > 0 || (showHidden && documents.hidden.length > 0)) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <FileText size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recommended Documents</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {documents.active.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <button
                          onClick={() => onSuggestionClick({ ...item.prefill, entryOnly: false })}
                          className="px-3 py-2 bg-stone-50 hover:bg-manila/20 border border-stone-200 hover:border-manila rounded-xl text-xs font-bold text-navy-muted transition-all active:scale-95"
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                    {showHidden && documents.hidden.map((item, idx) => (
                      <div key={`hidden-${idx}`} className="flex items-center gap-1">
                        <span className="px-3 py-2 bg-stone-50/50 border border-stone-100 rounded-xl text-xs font-medium text-stone-400 italic">
                          {item.label}
                        </span>
                        {onRestoreNA && (
                          <button
                            onClick={() => onRestoreNA(item.prefill)}
                            className="p-2 text-[10px] font-bold text-navy-muted hover:underline transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {(contacts.active.length > 0 || (showHidden && contacts.hidden.length > 0)) && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <Users size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Recommended Contacts</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {contacts.active.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1">
                        <button
                          onClick={() => onSuggestionClick({ ...item.prefill, entryOnly: true })}
                          className="px-3 py-2 bg-stone-50 hover:bg-manila/20 border border-stone-200 hover:border-manila rounded-xl text-xs font-bold text-navy-muted transition-all active:scale-95"
                        >
                          {item.label}
                        </button>
                      </div>
                    ))}
                    {showHidden && contacts.hidden.map((item, idx) => (
                      <div key={`hidden-${idx}`} className="flex items-center gap-1">
                        <span className="px-3 py-2 bg-stone-50/50 border border-stone-100 rounded-xl text-xs font-medium text-stone-400 italic">
                          {item.label}
                        </span>
                        {onRestoreNA && (
                          <button
                            onClick={() => onRestoreNA(item.prefill)}
                            className="p-2 text-[10px] font-bold text-navy-muted hover:underline transition-colors"
                          >
                            Restore
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {totalHidden > 0 && (
                <div className="pt-2 border-t border-stone-50 flex justify-center">
                  <button
                    onClick={() => setShowHidden(!showHidden)}
                    className="text-[10px] font-bold text-stone-400 hover:text-navy-muted transition-colors uppercase tracking-widest"
                  >
                    {showHidden ? 'Hide' : `Show ${totalHidden} hidden items`}
                  </button>
                </div>
              )}

              {recommendations.considerations.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-stone-400">
                    <HelpCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Important Considerations</span>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {recommendations.considerations.map((text, idx) => (
                      <div
                        key={idx}
                        className="p-3 bg-manila/10 border border-manila/20 rounded-xl text-xs text-stone-600 leading-relaxed italic"
                      >
                        "{text}"
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
