import { supabase } from '@/lib/supabase';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PROFILE, DEMO_USER_ID } from '../demo/morganFamilyData';

export const authService = {
  async signUp(email: string, password?: string) {
    if (password) {
      return await supabase.auth.signUp({ email, password });
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
    if (isDemoMode() && userId === DEMO_USER_ID) {
      return { data: DEMO_PROFILE as any, error: null };
    }
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
    affiliate_id?: string;
    [key: string]: any;
  }) {
    const { private_pin, ...safeUpdates } = updates as any;
    const { data, error } = await supabase
      .from('profiles')
      .upsert({ id: userId, ...safeUpdates } as any, { onConflict: 'id' })
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

  onAuthStateChange(callback: (user: any, event?: string) => void) {
    return supabase.auth.onAuthStateChange((event, session) => {
      callback(session?.user ?? null, event);
    });
  }
};
