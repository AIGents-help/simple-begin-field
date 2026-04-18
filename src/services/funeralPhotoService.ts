import { supabase } from '@/integrations/supabase/client';

export interface FuneralPhoto {
  id: string;
  funeral_record_id: string;
  packet_id: string;
  file_path: string;
  caption: string | null;
  display_order: number | null;
  is_hero: boolean;
  created_at: string;
}

export const funeralPhotoService = {
  async list(funeralRecordId: string): Promise<FuneralPhoto[]> {
    const { data, error } = await supabase
      .from('funeral_photos' as any)
      .select('*')
      .eq('funeral_record_id', funeralRecordId)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true });
    if (error) throw error;
    return (data as unknown as FuneralPhoto[]) || [];
  },

  async upload(args: { packetId: string; recordId: string; file: File; caption?: string }) {
    const ext = args.file.name.split('.').pop() || 'jpg';
    const path = `${args.packetId}/funeral/${args.recordId}/${Date.now()}-${Math.random()
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
      .from('funeral_photos' as any)
      .insert({
        funeral_record_id: args.recordId,
        packet_id: args.packetId,
        file_path: path,
        caption: args.caption || null,
        display_order: nextOrder,
        is_hero: isHero,
      })
      .select()
      .single();
    if (error) throw error;
    return data as unknown as FuneralPhoto;
  },

  async updateCaption(photoId: string, caption: string) {
    const { error } = await supabase
      .from('funeral_photos' as any)
      .update({ caption })
      .eq('id', photoId);
    if (error) throw error;
  },

  async remove(photoId: string, filePath: string) {
    await supabase.storage.from('packet-documents').remove([filePath]);
    const { error } = await supabase
      .from('funeral_photos' as any)
      .delete()
      .eq('id', photoId);
    if (error) throw error;
  },

  async signedUrl(filePath: string, expiresIn = 3600): Promise<string | null> {
    const { data, error } = await supabase.storage
      .from('packet-documents')
      .createSignedUrl(filePath, expiresIn);
    if (error) return null;
    return data?.signedUrl || null;
  },

  /**
   * Download + compress a photo to a JPEG of approximately the requested max dimension/quality.
   * Returns base64 (no data URL prefix) suitable for email attachments.
   */
  async compressToBase64(
    filePath: string,
    opts: { maxDim?: number; quality?: number } = {},
  ): Promise<{ base64: string; filename: string; mime: string } | null> {
    const maxDim = opts.maxDim ?? 1400;
    const quality = opts.quality ?? 0.78;
    const url = await this.signedUrl(filePath, 600);
    if (!url) return null;

    const blob = await fetch(url).then((r) => r.blob());
    const bitmap = await createImageBitmap(blob);
    const scale = Math.min(1, maxDim / Math.max(bitmap.width, bitmap.height));
    const w = Math.round(bitmap.width * scale);
    const h = Math.round(bitmap.height * scale);

    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.drawImage(bitmap, 0, 0, w, h);

    const compressed: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error('compression failed'))),
        'image/jpeg',
        quality,
      ),
    );

    const base64 = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1] || '');
      };
      reader.onerror = reject;
      reader.readAsDataURL(compressed);
    });

    const baseName = filePath.split('/').pop()?.replace(/\.[^.]+$/, '') || 'photo';
    return { base64, filename: `${baseName}.jpg`, mime: 'image/jpeg' };
  },
};
