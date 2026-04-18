import { supabase } from '@/integrations/supabase/client';

export interface EmergencyToken {
  id: string;
  user_id: string;
  packet_id: string;
  token: string;
  pin_hint: string | null;
  is_active: boolean;
  visible_sections: Record<string, boolean>;
  custom_field_text: string | null;
  failed_attempts: number;
  locked_until: string | null;
  created_at: string;
  regenerated_at: string | null;
}

export interface EmergencyAccessLogEntry {
  id: string;
  accessed_at: string;
  device_type: string | null;
  browser: string | null;
  city: string | null;
  region: string | null;
  country: string | null;
  pin_correct: boolean;
}

export const emergencyService = {
  async getMyToken(): Promise<EmergencyToken | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return null;
    const { data, error } = await supabase
      .from('emergency_tokens')
      .select('*')
      .eq('user_id', userData.user.id)
      .maybeSingle();
    if (error) throw error;
    return data as any;
  },

  async setPin(pin: string, hint?: string): Promise<void> {
    const { error } = await supabase.rpc('set_emergency_pin', { p_pin: pin, p_hint: hint || null });
    if (error) throw error;
  },

  async updateVisibleSections(visible: Record<string, boolean>, customText?: string | null): Promise<void> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) throw new Error('Not authenticated');
    const { error } = await supabase
      .from('emergency_tokens')
      .update({ visible_sections: visible, custom_field_text: customText ?? null })
      .eq('user_id', userData.user.id);
    if (error) throw error;
  },

  async regenerateToken(): Promise<string> {
    const { data, error } = await supabase.rpc('regenerate_emergency_token');
    if (error) throw error;
    return data as string;
  },

  async getAccessLog(limit = 25): Promise<EmergencyAccessLogEntry[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];
    const { data, error } = await supabase
      .from('emergency_access_log')
      .select('id, accessed_at, device_type, browser, city, region, country, pin_correct')
      .eq('user_id', userData.user.id)
      .order('accessed_at', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data || []) as any;
  },

  async getEmergencyUrl(token: string): Promise<string> {
    return `${window.location.origin}/emergency/${token}`;
  },
};
