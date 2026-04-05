import { supabase } from '@/integrations/supabase/client';

export const authService = {
  async signUp(email: string, password?: string) {
    if (password) {
      return await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: window.location.origin,
        },
      });
    } else {
      return await supabase.auth.signInWithOtp({ email });
    }
  },

  async signIn(email: string, password?: string) {
    if (password) {
      return await supabase.auth.signInWithPassword({ email, password });
    } else {
      return await supabase.auth.signInWithOtp({ email });
    }
  },

  async signOut() {
    return await supabase.auth.signOut();
  },

  async getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    return user;
  },

  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  },

  async updateProfile(userId: string, updates: {
    full_name?: string;
    consent_timestamp?: string;
    legal_version_accepted?: string;
    private_pin?: string;
    affiliate_id?: string;
    [key: string]: any;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...updates }, { onConflict: 'id' })
      .select()
      .single();
    return { data, error };
  },

  async updatePrivatePin(userId: string, newPin: string) {
    if (!/^\d{4,8}$/.test(newPin)) {
      return { data: null, error: new Error('PIN must be 4-8 digits.') };
    }
    return this.updateProfile(userId, { private_pin: newPin });
  },

  onAuthStateChange(callback: (user: any) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(session?.user ?? null);
    });
  }
};
