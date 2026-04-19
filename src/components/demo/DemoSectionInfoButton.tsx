import React, { useState } from 'react';
import { Info, X } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { DEMO_SECTION_TOOLTIPS } from '../../demo/demoTooltips';

/**
 * Floating ℹ️ button shown in demo mode that explains what each section is for.
 */
export const DemoSectionInfoButton = () => {
  const { activeTab } = useAppContext();
  const [open, setOpen] = useState(false);
  const copy = DEMO_SECTION_TOOLTIPS[activeTab];

  if (!copy) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="What is this section for?"
        className="fixed bottom-28 right-5 md:bottom-8 md:right-8 z-40 w-12 h-12 rounded-full bg-navy-muted text-white shadow-xl flex items-center justify-center hover:scale-105 active:scale-95 transition-transform"
      >
        <Info size={20} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/40 flex items-end sm:items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-stone-100"
              aria-label="Close"
            >
              <X size={18} className="text-stone-500" />
            </button>
            <div className="flex items-center gap-2 mb-3 text-amber-600">
              <Info size={20} />
              <h3 className="font-serif font-bold text-navy-muted text-lg">
                Why this section matters
              </h3>
            </div>
            <p className="text-sm text-stone-600 leading-relaxed">{copy}</p>
          </div>
        </div>
      )}
    </>
  );
};
