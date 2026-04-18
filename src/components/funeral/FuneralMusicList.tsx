import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Trash2, ChevronUp, ChevronDown, Music, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Input } from '@/components/ui/input';
import { useConfirm } from '@/context/ConfirmDialogContext';

const PLAY_OPTIONS = [
  'Processional',
  'During service',
  'Recessional',
  'Reception',
  'Other',
];

interface Song {
  id: string;
  song_title: string;
  artist: string | null;
  when_to_play: string | null;
  notes: string | null;
  display_order: number;
}

interface Props {
  packetId: string;
  funeralRecordId: string;
}

export const FuneralMusicList: React.FC<Props> = ({ packetId, funeralRecordId }) => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const confirm = useConfirm();

  const load = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from('funeral_music')
      .select('*')
      .eq('funeral_record_id', funeralRecordId)
      .order('display_order', { ascending: true });
    if (error) {
      toast.error(`Failed to load music: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setSongs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (funeralRecordId) load();
  }, [funeralRecordId]);

  const addSong = async () => {
    setAdding(true);
    const next: any = {
      packet_id: packetId,
      funeral_record_id: funeralRecordId,
      song_title: 'New song',
      artist: '',
      when_to_play: 'During service',
      notes: '',
      display_order: songs.length,
    };
    const { data, error } = await (supabase as any).from('funeral_music').insert(next).select().single();
    setAdding(false);
    if (error) {
      toast.error(`Add song failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setSongs([...songs, data]);
    }
  };

  const updateSong = async (id: string, patch: Partial<Song>) => {
    setSongs((prev) => prev.map((s) => (s.id === id ? { ...s, ...patch } : s)));
    const { error } = await (supabase as any).from('funeral_music').update(patch).eq('id', id);
    if (error) {
      toast.error(`Update failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
      load();
    }
  };

  const removeSong = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this song?',
      description: 'This action cannot be undone.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    const { error } = await (supabase as any).from('funeral_music').delete().eq('id', id);
    if (error) {
      toast.error(`Delete failed: ${error.message}`, { duration: 4000, position: 'bottom-center' });
    } else {
      setSongs(songs.filter((s) => s.id !== id));
    }
  };

  const move = async (idx: number, dir: -1 | 1) => {
    const target = idx + dir;
    if (target < 0 || target >= songs.length) return;
    const reordered = [...songs];
    [reordered[idx], reordered[target]] = [reordered[target], reordered[idx]];
    const updated = reordered.map((s, i) => ({ ...s, display_order: i }));
    setSongs(updated);
    await Promise.all(
      updated.map((s) =>
        (supabase as any).from('funeral_music').update({ display_order: s.display_order }).eq('id', s.id),
      ),
    );
  };

  return (
    <div className="rounded-2xl border border-stone-200 bg-white p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-bold text-navy-muted flex items-center gap-2">
          <Music size={14} />
          Music List
        </h3>
        <button
          onClick={addSong}
          disabled={adding}
          className="px-3 py-1.5 rounded-lg bg-navy-muted text-white text-xs font-bold flex items-center gap-1.5 disabled:opacity-50"
        >
          {adding ? <Loader2 size={12} className="animate-spin" /> : <Plus size={12} />}
          Add Song
        </button>
      </div>
      {loading ? (
        <p className="text-xs text-stone-400">Loading…</p>
      ) : songs.length === 0 ? (
        <p className="text-xs text-stone-400 italic">No songs added yet.</p>
      ) : (
        <ul className="space-y-2">
          {songs.map((s, i) => (
            <li key={s.id} className="rounded-lg border border-stone-100 bg-stone-50/60 p-3 space-y-2">
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-stone-400 w-5">{i + 1}.</span>
                <Input
                  value={s.song_title}
                  onChange={(e) => updateSong(s.id, { song_title: e.target.value })}
                  placeholder="Song title"
                  className="h-8 text-sm flex-1"
                />
                <button
                  type="button"
                  onClick={() => move(i, -1)}
                  className="p-1 text-stone-400 hover:text-navy-muted"
                  aria-label="Move up"
                >
                  <ChevronUp size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => move(i, 1)}
                  className="p-1 text-stone-400 hover:text-navy-muted"
                  aria-label="Move down"
                >
                  <ChevronDown size={14} />
                </button>
                <button
                  type="button"
                  onClick={() => removeSong(s.id)}
                  className="p-1 text-stone-400 hover:text-rose-600"
                  aria-label="Remove"
                >
                  <Trash2 size={14} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 pl-6">
                <Input
                  value={s.artist || ''}
                  onChange={(e) => updateSong(s.id, { artist: e.target.value })}
                  placeholder="Artist"
                  className="h-8 text-xs"
                />
                <select
                  value={s.when_to_play || ''}
                  onChange={(e) => updateSong(s.id, { when_to_play: e.target.value })}
                  className="h-8 rounded-md border border-input bg-background px-2 text-xs"
                >
                  {PLAY_OPTIONS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                value={s.notes || ''}
                onChange={(e) => updateSong(s.id, { notes: e.target.value })}
                placeholder="Notes (optional)"
                className="h-8 text-xs ml-6 w-[calc(100%-1.5rem)]"
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};
