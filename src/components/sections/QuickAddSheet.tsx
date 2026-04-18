import React, { useState } from 'react';
import { X, ChevronRight, Upload, Plus, FileText, Users, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { RECOMMENDATIONS_CONFIG } from '../../config/recommendationsConfig';
import { SectionId } from '../../config/types';
import { useAppContext } from '../../context/AppContext';
import { CustomSectionModal } from './CustomSectionModal';

export const QuickAddSheet = ({ 
  isOpen, 
  onClose, 
  onSelect 
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onSelect: (sectionId: SectionId, prefill?: any) => void;
}) => {
  const [step, setStep] = useState<'section' | 'category'>('section');
  const [selectedSection, setSelectedSection] = useState<SectionId | null>(null);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const { customSections, refreshCustomSections, setActiveCustomSection, setTab, setView } = useAppContext();

  const handleSectionSelect = (sectionId: SectionId) => {
    setSelectedSection(sectionId);
    setStep('category');
  };

  const handleCategorySelect = (prefill?: any) => {
    if (selectedSection) {
      onSelect(selectedSection, prefill);
      handleClose();
    }
  };

  const handleClose = () => {
    onClose();
    setTimeout(() => {
      setStep('section');
      setSelectedSection(null);
    }, 300);
  };

  const recommendations = selectedSection ? RECOMMENDATIONS_CONFIG[selectedSection] : null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for desktop/tablet */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[55] hidden md:block"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 md:inset-auto md:top-10 md:bottom-10 md:left-1/2 md:-translate-x-1/2 z-[60] bg-white flex flex-col w-full md:max-w-[640px] md:rounded-3xl md:shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#fdfaf3]/80 backdrop-blur-md sticky top-0 z-10">
            <div>
              <h2 className="text-xl font-serif font-bold text-navy-muted">
                {step === 'section' ? 'Quick Add' : `Add to ${SECTIONS_CONFIG.find(s => s.id === selectedSection)?.label}`}
              </h2>
              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                {step === 'section' ? 'Select a section to begin' : 'What would you like to add?'}
              </p>
            </div>
            <button 
              onClick={handleClose}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X size={24} className="text-stone-400" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-[#fdfaf3]">
            {step === 'section' ? (
              <div className="grid grid-cols-1 gap-3">
                {/* New Custom Section entry */}
                {customSections.length < 3 && (
                  <button
                    onClick={() => setShowCustomModal(true)}
                    className="w-full p-4 bg-amber-50/60 border-2 border-dashed border-amber-300 rounded-2xl flex items-center justify-between group hover:border-amber-400 hover:bg-amber-50 transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center text-amber-700">
                        <Sparkles size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-navy-muted">New Custom Section</p>
                        <p className="text-[10px] text-stone-400 font-medium">Create your own folder ({customSections.length}/3)</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-amber-400" />
                  </button>
                )}
                {SECTIONS_CONFIG.map(section => (
                  <button
                    key={section.id}
                    onClick={() => handleSectionSelect(section.id)}
                    className="w-full p-4 bg-white border border-stone-100 rounded-2xl flex items-center justify-between group hover:border-manila hover:bg-manila/5 transition-all shadow-sm active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-stone-50 rounded-xl flex items-center justify-center text-navy-muted group-hover:bg-manila group-hover:text-navy-muted transition-colors">
                        <section.icon size={20} />
                      </div>
                      <div className="text-left">
                        <p className="font-bold text-navy-muted">{section.label}</p>
                        <p className="text-[10px] text-stone-400 font-medium">{section.description}</p>
                      </div>
                    </div>
                    <ChevronRight size={18} className="text-stone-300 group-hover:text-navy-muted transition-colors" />
                  </button>
                ))}
              </div>
            ) : (
              <div className="space-y-6">
                <button 
                  onClick={() => setStep('section')}
                  className="text-[10px] font-bold text-stone-400 uppercase tracking-widest flex items-center gap-1 hover:text-navy-muted transition-colors"
                >
                  ← Back to Sections
                </button>

                {/* Generic Add Option */}
                <button
                  onClick={() => handleCategorySelect()}
                  className="w-full p-5 bg-navy-muted text-white rounded-2xl flex items-center justify-between shadow-lg active:scale-[0.98] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 bg-white/10 rounded-xl flex items-center justify-center">
                      <Plus size={20} />
                    </div>
                    <div className="text-left">
                      <p className="font-bold">Generic Entry</p>
                      <p className="text-[10px] text-white/60 font-medium">Add something not listed below</p>
                    </div>
                  </div>
                  <ChevronRight size={18} className="text-white/40" />
                </button>

                {/* Recommended Documents */}
                {recommendations?.documents && recommendations.documents.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-stone-400">
                      <FileText size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Upload Document</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {recommendations.documents.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCategorySelect({ ...item.prefill, entryOnly: false })}
                          className="w-full p-4 bg-white border border-stone-100 rounded-2xl flex items-center justify-between group hover:border-manila transition-all shadow-sm active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-navy-muted">{item.label}</span>
                          <Upload size={16} className="text-stone-300 group-hover:text-navy-muted" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Entries */}
                {recommendations?.entries && recommendations.entries.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Plus size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add Information</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {recommendations.entries.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCategorySelect({ ...item.prefill, entryOnly: true })}
                          className="w-full p-4 bg-white border border-stone-100 rounded-2xl flex items-center justify-between group hover:border-manila transition-all shadow-sm active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-navy-muted">{item.label}</span>
                          <Plus size={16} className="text-stone-300 group-hover:text-navy-muted" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Recommended Contacts */}
                {recommendations?.contacts && recommendations.contacts.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-stone-400">
                      <Users size={14} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">Add Contact</span>
                    </div>
                    <div className="grid grid-cols-1 gap-2">
                      {recommendations.contacts.map((item, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleCategorySelect({ ...item.prefill, entryOnly: true })}
                          className="w-full p-4 bg-white border border-stone-100 rounded-2xl flex items-center justify-between group hover:border-manila transition-all shadow-sm active:scale-[0.98]"
                        >
                          <span className="text-sm font-bold text-navy-muted">{item.label}</span>
                          <Users size={16} className="text-stone-300 group-hover:text-navy-muted" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </motion.div>
        </>
      )}

      <CustomSectionModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSaved={(s) => {
          void refreshCustomSections();
          setActiveCustomSection(s.id);
          setTab('custom');
          setView('sections');
          handleClose();
        }}
      />
    </AnimatePresence>
  );
};
