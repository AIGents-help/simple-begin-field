import React from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { MEMORY_TYPES, type MemoryEntryType } from '@/config/memoryTypes';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: MemoryEntryType) => void;
}

export const MemoryTypePicker: React.FC<Props> = ({ isOpen, onClose, onSelect }) => {
  return (
    <Sheet open={isOpen} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className="h-[85vh] overflow-y-auto rounded-t-3xl">
        <SheetHeader className="text-left mb-4">
          <SheetTitle className="font-serif text-xl text-navy-muted">What would you like to add?</SheetTitle>
          <p className="text-sm text-stone-500">
            Pick the kind of memory you'd like to leave behind.
          </p>
        </SheetHeader>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
          {MEMORY_TYPES.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => onSelect(t.id)}
                className="flex items-start gap-3 p-4 rounded-2xl bg-white border border-stone-100 hover:border-navy-muted hover:shadow-sm transition-all text-left"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-amber-500" />
                </div>
                <div className="min-w-0">
                  <div className="font-bold text-sm text-navy-muted">{t.label}</div>
                  <div className="text-xs text-stone-500 leading-snug">{t.description}</div>
                </div>
              </button>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
};
