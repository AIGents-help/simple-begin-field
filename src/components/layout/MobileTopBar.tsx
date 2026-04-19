import React from 'react';
import { Menu, ArrowLeft } from 'lucide-react';
import { CoupleNotificationBell } from '../couple/CoupleNotificationBell';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';

export const MobileTopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  const {
    view,
    activeTab,
    activeCustomSectionId,
    customSections,
    setView,
  } = useAppContext();

  // Compute current title shown in the header
  let title = 'The Survivor Packet';
  let showBack = false;

  if (view === 'sections') {
    showBack = true;
    if (activeTab === 'custom' && activeCustomSectionId) {
      const cs = customSections.find((s) => s.id === activeCustomSectionId);
      title = cs?.name || 'Section';
    } else {
      const section = SECTIONS_CONFIG.find((s) => s.id === activeTab);
      title = section?.label || 'Section';
    }
  } else if (view === 'profile') {
    title = 'Profile';
    showBack = true;
  } else if (view === 'security') {
    title = 'Security';
    showBack = true;
  } else if (view === 'trust') {
    title = 'Trusted Contacts';
    showBack = true;
  } else if (view === 'search') {
    title = 'Search';
    showBack = true;
  } else if (view === 'household') {
    title = 'Household';
    showBack = true;
  } else if (view === 'affiliate') {
    title = 'Affiliate';
    showBack = true;
  } else if (view === 'pricing') {
    title = 'Pricing';
    showBack = true;
  } else if (view === 'directory') {
    title = 'Find a Professional';
    showBack = true;
  } else if (view === 'admin') {
    title = 'Admin';
    showBack = true;
  } else if (view === 'estate') {
    title = 'Estate Summary';
    showBack = true;
  } else if (view === 'templates') {
    title = 'Templates';
    showBack = true;
  } else if (view === 'partner') {
    title = 'Partner';
    showBack = true;
  }

  return (
    <header className="lg:hidden sticky top-0 z-30 bg-[#fdfaf3] px-4 py-4 flex justify-between items-center border-b border-stone-100 gap-2">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        {showBack && (
          <button
            onClick={() => setView('dashboard')}
            className="p-2 -ml-2 hover:bg-stone-100 rounded-full transition-colors shrink-0"
            aria-label="Back to dashboard"
          >
            <ArrowLeft size={20} className="text-navy-muted" />
          </button>
        )}
        <h1 className={`font-serif font-bold text-navy-muted truncate ${showBack ? 'text-base' : 'text-lg'}`}>
          {title}
        </h1>
      </div>
      <div className="flex items-center gap-1 shrink-0">
        <CoupleNotificationBell />
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
          aria-label="Open menu"
        >
          <Menu size={20} className="text-navy-muted" />
        </button>
      </div>
    </header>
  );
};
