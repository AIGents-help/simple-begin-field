import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

interface Reading {
  id: string;
  title: string;
  author: string | null;
  full_text: string | null;
  reader_name: string | null;
  display_order: number;
}

interface Props {
  packetId: string;
  funeralRecordId: string;
}

export const FuneralReadings: React.FC<Props> = ({ packetId, funeralRecordId }) => {
  const [items, setItems] = useState<Reading[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('funeral_readings')
      .select('*')
      .eq('funeral_record_id', funeralRecordId)
      .order('display_order', { ascending: true });
    if (error) {
      toast.error(`Failed to load readings: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setItems(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (funeralRecordId) load();
  }, [funeralRecordId]);

  const addOne = async () => {
    setAdding(true);
    const { data, error } = await (supabase as any)
      .from('funeral_readings')
      .insert({
        packet_id: packetId,
        funeral_record_id: funeralRecordId,
        title: 'New reading',
        display_order: items.length,
      })
      .select()
      .single();
    setAdding(false);
    if (error) {
      toast.error(`Add reading failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setItems([...items, data]);
    }
  };

  const update = async (id: string, patch: Partial<Reading>) => {
    setItems((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    const { error } = await (supabase as any).from('funeral_readings').update(patch).eq('id', id);
    if (error) {
      toast.error(`Update failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      load();
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Remove this reading?')) return;
    const { error } = await (supabase as any).from('funeral_readings').delete().eq('id', id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setItems(items.filter((r) => r.id !== id));
    }
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-navy-muted flex items-center gap-2">
          <BookOpen size={14} />
          Readings & Poems
        </h3>
        <button
          onClick={addOne}
          disabled={adding}
          className="px-3 py-1.5 rounded-lg bg-navy-muted text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
        >
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add Reading
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-stone-400">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-stone-400 italic">No readings added yet.</p>
      ) : (
        <ul className="space-y-3">
          {items.map((r) => (
            <li key={r.id} className="rounded-lg border border-stone-100 bg-stone-50/60 p-3 space-y-2">
              <div className="flex items-center gap-2">
                <Input
                  value={r.title}
                  onChange={(e) => update(r.id, { title: e.target.value })}
                  placeholder="Title"
                  className="h-8 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => remove(r.id)}
                  className="p-1 text-stone-400 hover:text-rose-600"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <Input
                  value={r.author || ''}
                  onChange={(e) => update(r.id, { author: e.target.value })}
                  placeholder="Author"
                  className="h-8 text-xs"
                />
                <Input
                  value={r.reader_name || ''}
                  onChange={(e) => update(r.id, { reader_name: e.target.value })}
                  placeholder="Who should read it"
                  className="h-8 text-xs"
                />
              </div>
              <Textarea
                rows={3}
                value={r.full_text || ''}
                onChange={(e) => update(r.id, { full_text: e.target.value })}
                placeholder="Full text…"
                className="text-xs"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
