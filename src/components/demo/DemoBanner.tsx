import React from 'react';
import { Sparkles, ArrowRight } from 'lucide-react';
import { exitDemoMode } from '../../demo/demoMode';

export const DemoBanner = () => {
  const handleSignUp = () => {
    exitDemoMode();
    window.location.href = '/?signup=1';
  };

  return (
    <div className="sticky top-0 z-50 bg-gradient-to-r from-amber-300 via-amber-200 to-amber-300 border-b border-amber-400/60 shadow-sm">
      <div className="max-w-[1280px] mx-auto px-4 py-2.5 flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-2 text-navy-muted min-w-0">
          <Sparkles size={16} className="shrink-0" />
          <span className="text-xs sm:text-sm font-semibold truncate">
            You're viewing the Morgan Family's sample packet
          </span>
        </div>
        <button
          onClick={handleSignUp}
          className="text-xs sm:text-sm font-bold text-navy-muted underline decoration-2 underline-offset-2 hover:no-underline flex items-center gap-1 shrink-0"
        >
          Sign up to create your own
          <ArrowRight size={14} />
        </button>
      </div>
    </div>
  );
};
