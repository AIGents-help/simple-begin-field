import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';

export const FolderTabNav = () => {
  const { activeTab, setTab, view } = useAppContext();

  // Only show on mobile and when in sections view
  if (view !== 'sections') return null;

  return (
    <div className="lg:hidden sticky top-[61px] z-20 bg-[#fdfaf3] pt-4 pb-0 border-b border-folder-edge overflow-hidden">
      <div className="flex items-center justify-between px-6 mb-2">
        <span className="text-[10px] font-bold text-stone-400 uppercase tracking-widest">Packet Sections</span>
      </div>

      <div className="flex overflow-x-auto no-scrollbar px-6 gap-1 items-end">
        {SECTIONS_CONFIG.map((section) => {
          const isActive = activeTab === section.id;
          return (
            <button
              key={section.id}
              onClick={() => setTab(section.id)}
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
      </div>
    </div>
  );
};
