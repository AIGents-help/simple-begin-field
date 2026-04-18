import { supabase } from '@/integrations/supabase/client';

export type SettingsKey =
  | 'general'
  | 'user_defaults'
  | 'billing'
  | 'email'
  | 'affiliate'
  | 'security'
  | 'storage';

export const appSettingsService = {
  async getAll(): Promise<Record<string, any>> {
    const { data, error } = await supabase
      .from('app_settings')
      .select('key, value, updated_at');
    if (error) throw error;
    const map: Record<string, any> = {};
    (data || []).forEach((row: any) => {
      map[row.key] = { ...row.value, _updated_at: row.updated_at };
    });
    return map;
  },

  async save(key: SettingsKey, value: Record<string, any>) {
    // Strip our internal _updated_at marker
    const clean = { ...value };
    delete clean._updated_at;

    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;

    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        {
          key,
          value: clean,
          updated_by: userId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'key' },
      )
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async listAdmins() {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, email, full_name, created_at, role')
      .eq('role', 'admin')
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  },

  async grantAdmin(email: string, actingAdminEmail?: string | null) {
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) throw new Error('Email is required');

    const { data: profile, error: findErr } = await supabase
      .from('profiles')
      .select('id, email, role')
      .ilike('email', trimmed)
      .maybeSingle();
    if (findErr) throw findErr;
    if (!profile) throw new Error(`No user found with email ${trimmed}`);
    if (profile.role === 'admin') throw new Error('User is already an admin');

    const { error: updErr } = await supabase
      .from('profiles')
      .update({ role: 'admin' })
      .eq('id', profile.id);
    if (updErr) throw updErr;

    await supabase.from('admin_activity_log').insert({
      action: 'grant_admin_role',
      target_user_id: profile.id,
      target_user_email: profile.email,
      admin_email: actingAdminEmail || null,
      old_value: { role: profile.role },
      new_value: { role: 'admin' },
    });

    return profile;
  },

  async revokeAdmin(userId: string, userEmail: string, actingAdminEmail?: string | null) {
    const { data: userData } = await supabase.auth.getUser();
    if (userData?.user?.id === userId) {
      throw new Error('You cannot revoke your own admin access');
    }

    const { error } = await supabase
      .from('profiles')
      .update({ role: 'customer' })
      .eq('id', userId);
    if (error) throw error;

    await supabase.from('admin_activity_log').insert({
      action: 'revoke_admin_role',
      target_user_id: userId,
      target_user_email: userEmail,
      admin_email: actingAdminEmail || null,
      old_value: { role: 'admin' },
      new_value: { role: 'customer' },
    });
  },

  async getStorageStats() {
    // Best-effort: tally documents.file_size
    const { data, error } = await supabase
      .from('documents')
      .select('file_size');
    if (error) return { total_bytes: 0, count: 0 };
    const total = (data || []).reduce((s: number, r: any) => s + (Number(r.file_size) || 0), 0);
    return { total_bytes: total, count: (data || []).length };
  },

  async getActivePlans() {
    const { data, error } = await supabase
      .from('pricing_plans')
      .select('plan_key, name, price_cents, billing_type, household_mode, is_active')
      .order('price_cents');
    if (error) throw error;
    return data || [];
  },

  async logSettingChange(
    section: SettingsKey,
    oldValue: any,
    newValue: any,
    actingAdminEmail?: string | null,
  ) {
    await supabase.from('admin_activity_log').insert({
      action: `update_settings_${section}`,
      admin_email: actingAdminEmail || null,
      old_value: oldValue,
      new_value: newValue,
    });
  },
};
