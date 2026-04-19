import React from 'react';
import { Sparkles } from 'lucide-react';
import { enterDemoMode } from '../../demo/demoMode';

export const ExploreSampleButton = () => {
  const handleClick = () => {
    enterDemoMode();
    // Reload so AppContext picks up the demo flag and bypasses auth.
    window.location.href = '/';
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      className="w-full p-5 rounded-2xl bg-gradient-to-br from-amber-300 to-amber-400 text-navy-muted font-bold flex flex-col items-center gap-1.5 shadow-lg hover:shadow-xl active:scale-[0.98] transition-all border-2 border-amber-500/40"
    >
      <span className="flex items-center gap-2 text-base">
        <Sparkles size={18} />
        Explore a Sample Packet
      </span>
      <span className="text-xs font-medium opacity-80">
        See what a complete Survivor Packet looks like — no account needed
      </span>
    </button>
  );
};
