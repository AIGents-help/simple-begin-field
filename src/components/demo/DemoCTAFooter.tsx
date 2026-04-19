import React from 'react';
import { ArrowRight, Sparkles } from 'lucide-react';
import { exitDemoMode } from '../../demo/demoMode';

export const DemoCTAFooter = () => {
  const handleClick = () => {
    exitDemoMode();
    window.location.href = '/?signup=1';
  };

  return (
    <div className="mt-8 p-6 rounded-3xl bg-gradient-to-br from-navy-muted to-navy-muted/90 text-white shadow-lg">
      <div className="flex items-center gap-2 mb-2 text-amber-300">
        <Sparkles size={18} />
        <p className="text-xs font-bold uppercase tracking-widest">Ready to build your own?</p>
      </div>
      <h3 className="font-serif text-2xl font-bold mb-2">
        Create your Survivor Packet
      </h3>
      <p className="text-sm text-white/80 mb-5 leading-relaxed">
        Everything you just saw — your identity documents, family, medical, legal, and more — organized so the people you love don't have to guess.
      </p>
      <button
        type="button"
        onClick={handleClick}
        className="w-full sm:w-auto px-6 py-3 bg-amber-400 text-navy-muted rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-amber-300 active:scale-[0.98] transition-all"
      >
        Create Your Own
        <ArrowRight size={18} />
      </button>
    </div>
  );
};
