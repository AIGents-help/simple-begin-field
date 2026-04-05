import { supabase } from '@/integrations/supabase/client';
import { Database } from '../types/database';

type Profile = Database['public']['Tables']['profiles']['Row'];
type Packet = Database['public']['Tables']['packets']['Row'];
type Purchase = Database['public']['Tables']['purchases']['Row'];
type AffiliateReferral = Database['public']['Tables']['affiliate_referrals']['Row'];
type PacketInvite = Database['public']['Tables']['packet_invites']['Row'];

export const adminService = {
  async getStats() {
    const [
      { count: customersCount },
      { count: activePacketsCount },
      { count: singlePacketsCount },
      { count: couplePacketsCount },
      { count: paidUsersCount },
      { count: pendingInvitesCount },
      { count: acceptedInvitesCount },
      { count: activeAffiliatesCount },
      { count: recentConversionsCount }
    ] = await Promise.all([
      supabase.from('profiles').select('*', { count: 'exact', head: true }),
      supabase.from('packets').select('*', { count: 'exact', head: true }),
      supabase.from('packets').select('*', { count: 'exact', head: true }).eq('household_mode', 'single'),
      supabase.from('packets').select('*', { count: 'exact', head: true }).eq('household_mode', 'couple'),
      supabase.from('purchases').select('*', { count: 'exact', head: true }).in('status', ['active', 'one_time_paid']),
      supabase.from('packet_invites').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('packet_invites').select('*', { count: 'exact', head: true }).eq('status', 'accepted'),
      supabase.from('affiliate_referrals').select('*', { count: 'exact', head: true }).eq('is_active', true),
      supabase.from('affiliate_conversions').select('*', { count: 'exact', head: true }).gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    ]);

    return {
      totalCustomers: customersCount || 0,
      activePackets: activePacketsCount || 0,
      singlePackets: singlePacketsCount || 0,
      couplePackets: couplePacketsCount || 0,
      paidUsers: paidUsersCount || 0,
      pendingInvites: pendingInvitesCount || 0,
      acceptedInvites: acceptedInvitesCount || 0,
      activeAffiliates: activeAffiliatesCount || 0,
      recentConversions: recentConversionsCount || 0
    };
  },

  async getCustomers(filters?: { name?: string; email?: string; plan?: string; status?: string }) {
    let query = supabase.from('profiles').select(`
      *,
      purchases (
        status,
        pricing_plans (
          name
        )
      ),
      packets (
        id,
        household_mode
      )
    `);

    if (filters?.name) query = query.ilike('full_name', `%${filters.name}%`);
    if (filters?.email) query = query.ilike('email', `%${filters.email}%`);

    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return data;
  },

  async getPackets() {
    const { data, error } = await supabase.from('packets').select(`
      *,
      profiles (
        full_name,
        email
      ),
      packet_members (
        user_id,
        role
      )
    `).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getBilling() {
    const { data, error } = await supabase.from('purchases').select(`
      *,
      profiles (
        full_name,
        email
      ),
      pricing_plans (
        name,
        billing_type
      )
    `).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getInvites() {
    const { data, error } = await supabase.from('packet_invites').select(`
      *,
      packets (
        title
      ),
      profiles!packet_invites_invited_by_fkey (
        full_name
      )
    `).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  },

  async getAffiliates() {
    const { data, error } = await supabase.from('affiliate_referrals').select(`
      *,
      affiliate_conversions (
        id,
        conversion_status
      )
    `).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};

export const affiliateService = {
  async getMyStats(affiliateId: string) {
    const [
      { data: referral },
      { count: signupsCount },
      { count: purchasesCount },
      { count: activeCustomersCount }
    ] = await Promise.all([
      supabase.from('affiliate_referrals').select('*').eq('id', affiliateId).single(),
      supabase.from('affiliate_conversions').select('*', { count: 'exact', head: true }).eq('affiliate_referral_id', affiliateId).eq('conversion_status', 'signup'),
      supabase.from('affiliate_conversions').select('*', { count: 'exact', head: true }).eq('affiliate_referral_id', affiliateId).eq('conversion_status', 'purchase'),
      supabase.from('affiliate_conversions').select('*', { count: 'exact', head: true }).eq('affiliate_referral_id', affiliateId).in('conversion_status', ['purchase', 'paid_out'])
    ]);

    return {
      referralCode: referral?.affiliate_code || '',
      signups: signupsCount || 0,
      purchases: purchasesCount || 0,
      activeCustomers: activeCustomersCount || 0,
      payoutSummary: 0 // Placeholder
    };
  },

  async getMyConversions(affiliateId: string) {
    const { data, error } = await supabase.from('affiliate_conversions').select(`
      *,
      profiles (
        full_name
      ),
      purchases (
        status,
        pricing_plans (
          name
        )
      )
    `).eq('affiliate_referral_id', affiliateId).order('created_at', { ascending: false });

    if (error) throw error;
    return data;
  }
};
