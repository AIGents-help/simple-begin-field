import { supabase } from '@/integrations/supabase/client';

export const referralCodeService = {
  async generateCode(userId: string, professionalName: string, email: string) {
    // Generate a unique code from the name
    const baseCode = professionalName
      .replace(/[^a-zA-Z]/g, '')
      .toUpperCase()
      .slice(0, 6);
    const suffix = Math.floor(1000 + Math.random() * 9000);
    const code = `${baseCode}${suffix}`;

    const { data, error } = await supabase
      .from('referral_codes' as any)
      .insert({
        code,
        professional_name: professionalName,
        email,
        owner_id: userId,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async getMyCodes(userId: string) {
    const { data, error } = await supabase
      .from('referral_codes' as any)
      .select('*')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  },

  async toggleCode(codeId: string, isActive: boolean) {
    const { error } = await supabase
      .from('referral_codes' as any)
      .update({ is_active: isActive })
      .eq('id', codeId);

    if (error) throw error;
  },
};
