import React from 'react';
import { LayoutDashboard, Layers, Plus, Briefcase, User } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { isDemoMode } from '../../demo/demoMode';

export const BottomNav = ({ onAddClick }: { onAddClick: () => void }) => {
  const { view, setView } = useAppContext();
  const demoMode = isDemoMode();

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-stone-100 px-6 py-3 flex justify-between items-center z-40 shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
      <button
        onClick={() => setView('dashboard')}
        className={`bottom-nav-item ${view === 'dashboard' ? 'text-navy-muted' : 'text-stone-300'}`}
      >
        <LayoutDashboard size={20} />
        <span>Home</span>
      </button>
      <button
        onClick={() => setView('sections')}
        className={`bottom-nav-item ${view === 'sections' ? 'text-navy-muted' : 'text-stone-300'}`}
      >
        <Layers size={20} />
        <span>Sections</span>
      </button>
      {demoMode ? (
        <div className="w-12 h-12" aria-hidden="true" />
      ) : (
        <button
          onClick={onAddClick}
          className="w-12 h-12 bg-navy-muted rounded-2xl flex items-center justify-center shadow-lg active:scale-90 transition-transform -mt-8 border-4 border-[#fdfaf3]"
        >
          <Plus size={24} className="text-white" />
        </button>
      )}
      <button
        onClick={() => setView('directory')}
        className={`bottom-nav-item ${view === 'directory' ? 'text-navy-muted' : 'text-stone-300'}`}
      >
        <Briefcase size={20} />
        <span>Find Pro</span>
      </button>
      <button
        onClick={() => setView('profile')}
        className={`bottom-nav-item ${view === 'profile' ? 'text-navy-muted' : 'text-stone-300'}`}
      >
        <User size={20} />
        <span>Profile</span>
      </button>
    </nav>
  );
};
