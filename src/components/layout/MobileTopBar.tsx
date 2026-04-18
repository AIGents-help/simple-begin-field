import React from 'react';
import { Menu } from 'lucide-react';
import { CoupleNotificationBell } from '../couple/CoupleNotificationBell';

export const MobileTopBar = ({ onMenuClick }: { onMenuClick: () => void }) => {
  return (
    <header className="lg:hidden sticky top-0 z-30 bg-[#fdfaf3] px-6 py-4 flex justify-between items-center border-b border-stone-100">
      <h1 className="text-lg font-serif font-bold text-navy-muted">The Survivor Packet</h1>
      <div className="flex items-center gap-2">
        <CoupleNotificationBell />
        <button
          onClick={onMenuClick}
          className="p-2 hover:bg-stone-100 rounded-full transition-colors"
        >
          <Menu size={20} className="text-navy-muted" />
        </button>
      </div>
    </header>
  );
};
