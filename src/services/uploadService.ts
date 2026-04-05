import { supabase } from '@/integrations/supabase/client';

export const uploadService = {
  async uploadFile(bucket: string, path: string, file: File) {
    console.log(`Uploading to bucket: ${bucket}, path: ${path}`);
    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true
      });
    
    if (error) {
      console.error(`Upload error for ${path}:`, error);
    } else {
      console.log(`Upload success for ${path}:`, data);
    }
    
    return { data, error };
  },

  async deleteFile(bucket: string, path: string) {
    const { error } = await supabase.storage
      .from(bucket)
      .remove([path]);
    
    return { error };
  },

  async getSignedUrl(bucket: string, path: string, expiresIn: number = 60) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(path, expiresIn);
    
    return { url: data?.signedUrl, error };
  },

  getPublicUrl(bucket: string, path: string) {
    const { data } = supabase.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return { url: data.publicUrl };
  }
};
