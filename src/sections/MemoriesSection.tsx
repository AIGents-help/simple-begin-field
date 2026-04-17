import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2, Sparkles } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';
import { MemoryCard } from '../components/memories/MemoryCard';
import { MemoryEntrySheet } from '../components/memories/MemoryEntrySheet';
import { MemoryTypePicker } from '../components/memories/MemoryTypePicker';
import type { MemoryEntryType } from '../config/memoryTypes';

/**
 * Memories — letters, advice, photos, videos, voice notes, bucket lists,
 * and messages for loved ones. Self-contained section (no chip recommendations,
 * no SectionScreenTemplate). Each entry is a structured card.
 */
export const MemoriesSection: React.FC = () => {
  const { currentPacket, bumpCompletion } = useAppContext();
  const [memories, setMemories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<any | null>(null);
  const [creatingType, setCreatingType] = useState<MemoryEntryType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchMemories = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('memories')
      .select('*')
      .eq('packet_id', currentPacket.id)
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Failed to load memories', error);
    } else {
      setMemories(data || []);
    }
    setLoading(false);
  }, [currentPacket?.id]);

  useEffect(() => {
    fetchMemories();
  }, [fetchMemories]);

  const openAdd = () => setPickerOpen(true);

  const handleTypeSelected = (type: MemoryEntryType) => {
    setPickerOpen(false);
    setEditing(null);
    setCreatingType(type);
    setSheetOpen(true);
  };

  const openEdit = (mem: any) => {
    setEditing(mem);
    setCreatingType(null);
    setSheetOpen(true);
  };

  const onSaved = () => {
    setSheetOpen(false);
    setEditing(null);
    setCreatingType(null);
    bumpCompletion();
    fetchMemories();
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">Memories</h2>
        <p className="text-sm text-stone-500">
          Letters, advice, photos, videos, and personal messages — meaningful things to leave behind for the people you love.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
          <p className="text-stone-500 text-sm">Loading memories...</p>
        </div>
      ) : memories.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-amber-50 rounded-full flex items-center justify-center mb-4">
            <Sparkles size={32} className="text-amber-400" />
          </div>
          <h3 className="text-lg font-bold text-navy-muted mb-2">Leave something meaningful behind.</h3>
          <p className="text-sm text-stone-500 mb-6 max-w-sm">
            A letter, a favorite memory, a piece of advice — small things that mean everything to the people you love.
          </p>
          <button
            onClick={openAdd}
            className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Add Memory
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {memories.map((mem) => (
            <MemoryCard key={mem.id} memory={mem} onClick={() => openEdit(mem)} />
          ))}
          <button
            onClick={openAdd}
            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:border-navy-muted hover:text-navy-muted transition-colors"
          >
            <Plus size={18} />
            <span className="font-bold text-sm">Add Memory</span>
          </button>
        </div>
      )}

      <MemoryTypePicker
        isOpen={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={handleTypeSelected}
      />

      <MemoryEntrySheet
        isOpen={sheetOpen}
        onClose={() => {
          setSheetOpen(false);
          setEditing(null);
          setCreatingType(null);
        }}
        memory={editing}
        entryType={creatingType}
        onSaved={onSaved}
      />
    </div>
  );
};
