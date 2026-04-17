import React, { useCallback, useEffect, useState } from 'react';
import { Loader2, Flower2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import { FuneralWishesEditor } from '../components/funeral/FuneralWishesEditor';
import { FuneralMusicList } from '../components/funeral/FuneralMusicList';
import { FuneralReadings } from '../components/funeral/FuneralReadings';
import { SendToFuneralHomeDialog } from '../components/funeral/SendToFuneralHomeDialog';

/**
 * FuneralSection — single structured editor per packet (one funeral_records row).
 * Replaces the old generic recommendation chips. Includes obituary, eulogy,
 * music list, readings, and "Send to Funeral Home" packaging via PDF email.
 */
export const FuneralSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: () => void) => void;
}) => {
  const { currentPacket, bumpCompletion } = useAppContext();
  const [record, setRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [sendOpen, setSendOpen] = useState(false);

  const fetchOrCreate = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('funeral_records')
      .select('*')
      .eq('packet_id', currentPacket.id)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();
    if (error) {
      console.error('Load funeral record failed', error);
      toast.error(`Could not load funeral wishes: ${error.message}`, {
        duration: 5000,
        position: 'bottom-center',
      });
      setLoading(false);
      return;
    }
    if (data) {
      setRecord(data);
      setLoading(false);
      return;
    }
    // Create one if missing
    const { data: created, error: createErr } = await supabase
      .from('funeral_records')
      .insert({ packet_id: currentPacket.id, scope: 'shared' })
      .select()
      .single();
    if (createErr) {
      toast.error(`Could not initialize funeral record: ${createErr.message}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } else {
      setRecord(created);
    }
    setLoading(false);
  }, [currentPacket?.id]);

  useEffect(() => {
    fetchOrCreate();
  }, [fetchOrCreate]);

  useEffect(() => {
    if (onRefresh) onRefresh(() => fetchOrCreate());
  }, [onRefresh, fetchOrCreate]);

  const handleSaved = (updated: any) => {
    setRecord(updated);
    bumpCompletion();
  };

  const handleSent = (timestamp: string, email: string) => {
    setRecord((r: any) => ({
      ...r,
      last_sent_to_funeral_home_at: timestamp,
      last_sent_to_email: email,
    }));
  };

  if (loading) {
    return (
      <div className="p-6 pb-32 flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
        <p className="text-stone-500 text-sm">Loading funeral wishes…</p>
      </div>
    );
  }

  if (!record) {
    return (
      <div className="p-6 pb-32">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
          Could not load funeral record.
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 pb-32 space-y-4">
      <div className="mb-2">
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2 flex items-center gap-2">
          <Flower2 size={22} /> Funeral Wishes
        </h2>
        <p className="text-sm text-stone-500">
          Service preferences, obituary, eulogy, music, readings, and a send-to-funeral-home package.
        </p>
      </div>

      <FuneralWishesEditor
        record={record}
        onSaved={handleSaved}
        onSendClick={() => setSendOpen(true)}
      />

      <FuneralMusicList packetId={currentPacket!.id} funeralRecordId={record.id} />
      <FuneralReadings packetId={currentPacket!.id} funeralRecordId={record.id} />

      <SendToFuneralHomeDialog
        isOpen={sendOpen}
        onClose={() => setSendOpen(false)}
        record={record}
        onSent={handleSent}
      />
    </div>
  );
};
