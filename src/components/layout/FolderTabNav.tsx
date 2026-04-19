import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { getCustomSectionIcon } from '../../config/customSectionIcons';
import { CustomSectionModal } from '../sections/CustomSectionModal';

export const FolderTabNav = () => {
  const {
    activeTab,
    activeCustomSectionId,
    setTab,
    setActiveCustomSection,
    view,
    customSections,
    refreshCustomSections,
  } = useAppContext();
  const [showCreate, setShowCreate] = useState(false);

  // Only show on mobile and when in sections view
  if (view !== 'sections') return null;

  const customLimitReached = customSections.length >= 3;

  return (
    <>
      <div className="lg:hidden sticky top-[69px] z-20 bg-[#fdfaf3] pt-4 pb-0 border-b border-folder-edge overflow-hidden">
        <div className="flex items-center justify-between px-6 mb-2">
          <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Packet Sections</span>
        </div>

        <div className="flex overflow-x-auto no-scrollbar px-6 gap-1 items-end">
          {SECTIONS_CONFIG.map((section) => {
            const isActive = activeTab === section.id && !activeCustomSectionId;
            return (
              <button
                key={section.id}
                onClick={() => { setActiveCustomSection(null); setTab(section.id); }}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-xl text-[10px] font-bold transition-all border-t border-l border-r shrink-0
                  ${isActive 
                    ? 'bg-manila text-navy-muted border-folder-edge shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-[1px] z-10' 
                    : 'bg-stone-100/50 text-stone-400 border-transparent hover:bg-stone-100'}
                `}
              >
                <section.icon size={12} className={isActive ? 'text-navy-muted' : 'text-stone-300'} />
                <span className="whitespace-nowrap">{section.label}</span>
              </button>
            );
          })}

          {/* Custom sections */}
          {customSections.map((cs) => {
            const Icon = getCustomSectionIcon(cs.icon);
            const isActive = activeTab === 'custom' && activeCustomSectionId === cs.id;
            return (
              <button
                key={cs.id}
                onClick={() => { setActiveCustomSection(cs.id); setTab('custom'); }}
                className={`
                  flex items-center gap-2 px-4 py-3 rounded-t-xl text-[10px] font-bold transition-all border-t border-l border-r shrink-0
                  ${isActive 
                    ? 'bg-manila text-navy-muted border-folder-edge shadow-[0_-2px_10px_rgba(0,0,0,0.02)] translate-y-[1px] z-10' 
                    : 'bg-amber-50/70 text-amber-800 border-amber-200/60 hover:bg-amber-100'}
                `}
                title={`${cs.name} (Custom)`}
              >
                <Icon size={12} className={isActive ? 'text-navy-muted' : 'text-amber-700'} />
                <span className="whitespace-nowrap">{cs.name}</span>
                <span className="text-[8px] opacity-70">•</span>
              </button>
            );
          })}

          {/* Create custom section button OR limit indicator */}
          {customLimitReached ? (
            <div className="flex items-center gap-1 px-3 py-3 text-[10px] font-bold text-stone-400 shrink-0">
              <span className="whitespace-nowrap">Custom (3/3)</span>
            </div>
          ) : (
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-2 px-4 py-3 rounded-t-xl text-[10px] font-bold border-t border-l border-r border-dashed border-amber-300 text-amber-700 bg-amber-50/40 hover:bg-amber-100/60 shrink-0"
            >
              <Plus size={12} />
              <span className="whitespace-nowrap">Create Your Own</span>
            </button>
          )}
        </div>
      </div>

      <CustomSectionModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        onSaved={(s) => {
          void refreshCustomSections();
          setActiveCustomSection(s.id);
          setTab('custom');
        }}
      />
    </>
  );
};
