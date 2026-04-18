import React, { useEffect, useState } from 'react';
import { X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { customSectionService, CustomSection } from '../../services/customSectionService';
import { CUSTOM_SECTION_ICONS, CUSTOM_SECTION_ICON_NAMES, getCustomSectionIcon } from '../../config/customSectionIcons';
import { useAppContext } from '../../context/AppContext';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (section: CustomSection) => void;
  existing?: CustomSection | null;
}

export const CustomSectionModal: React.FC<Props> = ({ isOpen, onClose, onSaved, existing }) => {
  const { user, currentPacket } = useAppContext();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<string>('Folder');
  const [description, setDescription] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(existing?.name ?? '');
      setIcon(existing?.icon ?? 'Folder');
      setDescription(existing?.description ?? '');
    }
  }, [isOpen, existing]);

  const handleSave = async () => {
    if (!user || !currentPacket) {
      toast.error('You must be signed in to create a section.');
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error('Section name is required.');
      return;
    }
    if (trimmed.length > 30) {
      toast.error('Section name must be 30 characters or less.');
      return;
    }
    if (description.length > 100) {
      toast.error('Description must be 100 characters or less.');
      return;
    }
    setSaving(true);
    try {
      const saved = existing
        ? await customSectionService.update(existing.id, { name: trimmed, icon, description: description.trim() || null })
        : await customSectionService.create({
            packetId: currentPacket.id,
            userId: user.id,
            name: trimmed,
            icon,
            description: description.trim() || null,
          });
      toast.success(existing ? 'Section updated' : 'Custom section created');
      onSaved(saved);
      onClose();
    } catch (err: any) {
      const msg = err?.message?.includes('at most 3')
        ? 'You can have at most 3 custom sections.'
        : err?.message || 'Failed to save section';
      toast.error(msg);
    } finally {
      setSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[70]"
          />
          <motion.div
            initial={{ y: '100%', opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 28, stiffness: 220 }}
            className="fixed inset-x-0 bottom-0 md:inset-auto md:top-1/2 md:left-1/2 md:-translate-x-1/2 md:-translate-y-1/2 z-[71] bg-[#fdfaf3] w-full md:max-w-lg md:rounded-3xl rounded-t-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="px-6 py-5 border-b border-stone-200/60 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif font-bold text-navy-muted">
                  {existing ? 'Edit Custom Section' : 'Create Custom Section'}
                </h2>
                <p className="text-[10px] text-stone-400 font-bold uppercase tracking-widest mt-1">
                  Personalized folder
                </p>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-stone-100 rounded-full">
                <X size={22} className="text-stone-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Section Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value.slice(0, 30))}
                  placeholder="e.g. Travel, Hobbies, Subscriptions"
                  maxLength={30}
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-navy-muted focus:outline-none focus:border-navy-muted"
                />
                <p className="text-[10px] text-stone-400 mt-1">{name.length}/30</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-3">
                  Icon
                </label>
                <div className="grid grid-cols-5 gap-2">
                  {CUSTOM_SECTION_ICON_NAMES.map((iconName) => {
                    const Icon = CUSTOM_SECTION_ICONS[iconName];
                    const selected = icon === iconName;
                    return (
                      <button
                        key={iconName}
                        type="button"
                        onClick={() => setIcon(iconName)}
                        className={`aspect-square flex items-center justify-center rounded-xl border-2 transition-all ${
                          selected
                            ? 'bg-navy-muted text-white border-navy-muted shadow-md'
                            : 'bg-white border-stone-200 text-stone-500 hover:border-navy-muted/40'
                        }`}
                        aria-label={iconName}
                      >
                        <Icon size={20} />
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase tracking-widest text-stone-500 mb-2">
                  Description <span className="text-stone-400 normal-case font-normal tracking-normal">(optional)</span>
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 100))}
                  rows={2}
                  maxLength={100}
                  placeholder="What lives in this folder?"
                  className="w-full px-4 py-3 bg-white border border-stone-200 rounded-xl text-navy-muted focus:outline-none focus:border-navy-muted resize-none"
                />
                <p className="text-[10px] text-stone-400 mt-1">{description.length}/100</p>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-stone-200/60 flex gap-3 bg-white">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 rounded-xl border border-stone-200 text-stone-600 font-bold hover:bg-stone-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving || !name.trim()}
                className="flex-1 px-4 py-3 rounded-xl bg-navy-muted text-white font-bold disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving && <Loader2 size={16} className="animate-spin" />}
                {existing ? 'Save Changes' : 'Create Section'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
