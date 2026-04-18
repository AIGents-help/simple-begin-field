import { supabase } from '@/integrations/supabase/client';

export interface VehiclePhoto {
  id: string;
  vehicle_record_id: string;
  packet_id: string;
  file_path: string;
  caption: string | null;
  display_order: number | null;
  is_hero: boolean;
  created_at: string;
}

export const vehiclePhotoService = {
  async list(vehicleRecordId: string): Promise<VehiclePhoto[]> {
    const { data, error } = await supabase
      .from('vehicle_photos' as any)
      .select('*')
      .eq('vehicle_record_id', vehicleRecordId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return ((data as unknown) as VehiclePhoto[]) || [];
  },

  async upload(args: { packetId: string; recordId: string; file: File; caption?: string }) {
    const ext = args.file.name.split('.').pop() || 'jpg';
    const path = `${args.packetId}/vehicles/${args.recordId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}.${ext}`;
    const { error: upErr } = await supabase.storage
      .from('packet-documents')
      .upload(path, args.file, { upsert: false });
    if (upErr) throw upErr;

    const existing = await this.list(args.recordId);
    const isHero = existing.length === 0;
    const nextOrder = existing.length;

    const { data, error } = await supabase
      .from('vehicle_photos' as any)
      .insert({
        vehicle_record_id: args.recordId,
        packet_id: args.packetId,
        file_path: path,
        caption: args.caption || null,
        display_order: nextOrder,
        is_hero: isHero,
      })
      .select()
      .single();
    if (error) throw error;
    return (data as unknown) as VehiclePhoto;
  },

  async setHero(photoId: string, vehicleRecordId: string) {
    await supabase
      .from('vehicle_photos' as any)
      .update({ is_hero: false })
      .eq('vehicle_record_id', vehicleRecordId);
    const { error } = await supabase
      .from('vehicle_photos' as any)
      .update({ is_hero: true })
      .eq('id', photoId);
    if (error) throw error;
  },

  async updateCaption(photoId: string, caption: string) {
    const { error } = await supabase
      .from('vehicle_photos' as any)
      .update({ caption })
      .eq('id', photoId);
    if (error) throw error;
  },

  async remove(photoId: string, filePath: string) {
    await supabase.storage.from('packet-documents').remove([filePath]);
    const { error } = await supabase
      .from('vehicle_photos' as any)
      .delete()
      .eq('id', photoId);
    if (error) throw error;
  },

  async getHeroForRecord(vehicleRecordId: string): Promise<VehiclePhoto | null> {
    const { data, error } = await supabase
      .from('vehicle_photos' as any)
      .select('*')
      .eq('vehicle_record_id', vehicleRecordId)
      .eq('is_hero', true)
      .maybeSingle();
    if (error) return null;
    return (data as unknown) as VehiclePhoto | null;
  },
};
