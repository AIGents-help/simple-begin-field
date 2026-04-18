import { supabase } from '@/integrations/supabase/client';

export type CouplePermissionLevel = 'hidden' | 'view' | 'collaborate';
export type CoupleLinkStatus = 'pending' | 'active' | 'unlinked';

export interface CoupleLink {
  id: string;
  user_id_1: string;
  user_id_2: string | null;
  invite_email: string | null;
  invite_token: string | null;
  invite_expires_at: string | null;
  initiated_by: string;
  status: CoupleLinkStatus;
  linked_at: string | null;
  unlinked_at: string | null;
  unlinked_by: string | null;
  last_review_at: string | null;
  email_notifications_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface CouplePermission {
  id: string;
  couple_link_id: string;
  granting_user_id: string;
  receiving_user_id: string;
  section_key: string;
  permission_level: CouplePermissionLevel;
}

export interface CoupleActivityEntry {
  id: string;
  couple_link_id: string;
  user_id: string;
  action_type: string;
  section_key: string | null;
  record_id: string | null;
  record_table: string | null;
  description: string | null;
  created_at: string;
}

export interface CoupleNotification {
  id: string;
  couple_link_id: string;
  recipient_user_id: string;
  actor_user_id: string;
  notification_type: string;
  title: string;
  body: string | null;
  link_to: string | null;
  is_read: boolean;
  created_at: string;
}

export interface BeneficiaryAlignment {
  linked: boolean;
  mismatches: Array<{
    severity: 'warn' | 'critical';
    section: string;
    side: 'me' | 'partner';
    count: number;
    message: string;
  }>;
}

export interface DocumentGap {
  section: string;
  label: string;
  cta: string;
}

export interface CombinedFamilyMember {
  id: string;
  packet_id: string;
  owner_side: 'me' | 'partner';
  name: string;
  relationship: string | null;
  is_deceased: boolean;
  birthday: string | null;
  email: string | null;
  phone: string | null;
  photo_path: string | null;
  parent_member_id: string | null;
}

// Sections that can be shared. Passwords + Private are intentionally excluded — they are hard-blocked at the DB layer.
export const SHARABLE_SECTIONS: { id: string; label: string }[] = [
  { id: 'info', label: 'Identity & Info' },
  { id: 'family', label: 'Family' },
  { id: 'medical', label: 'Medical' },
  { id: 'real-estate', label: 'Real Estate' },
  { id: 'banking', label: 'Banking' },
  { id: 'investments', label: 'Investments' },
  { id: 'retirement', label: 'Retirement' },
  { id: 'vehicles', label: 'Vehicles' },
  { id: 'advisors', label: 'Advisors' },
  { id: 'property', label: 'Personal Property' },
  { id: 'pets', label: 'Pets' },
  { id: 'funeral', label: 'Funeral Wishes' },
  { id: 'memories', label: 'Memories' },
  { id: 'legal', label: 'Legal' },
];

export const coupleService = {
  async getActiveLink(userId: string): Promise<CoupleLink | null> {
    const { data, error } = await (supabase as any)
      .from('couple_links')
      .select('*')
      .or(`user_id_1.eq.${userId},user_id_2.eq.${userId}`)
      .in('status', ['active', 'pending'])
      .maybeSingle();
    if (error) {
      console.error('coupleService.getActiveLink error:', error);
      return null;
    }
    return data as CoupleLink | null;
  },

  async getPartnerProfile(partnerId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, last_login_at, avatar_path')
      .eq('id', partnerId)
      .maybeSingle();
    if (error) {
      console.error('coupleService.getPartnerProfile error:', error);
      return null;
    }
    return data;
  },

  async getPartnerPacket(partnerId: string) {
    const { data, error } = await supabase
      .from('packets')
      .select('id, title, owner_user_id, household_mode')
      .eq('owner_user_id', partnerId)
      .maybeSingle();
    if (error) {
      console.error('coupleService.getPartnerPacket error:', error);
      return null;
    }
    return data;
  },

  async getPartnerHealthScore(partnerId: string) {
    const { data, error } = await supabase
      .from('health_scores')
      .select('total_score, score_change, calculated_at')
      .eq('user_id', partnerId)
      .maybeSingle();
    if (error) {
      console.error('coupleService.getPartnerHealthScore error:', error);
      return null;
    }
    return data;
  },

  async getMyHealthScore(userId: string) {
    const { data, error } = await supabase
      .from('health_scores')
      .select('total_score')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) return null;
    return data;
  },

  async getPermissions(linkId: string, grantingUserId: string): Promise<CouplePermission[]> {
    const { data, error } = await (supabase as any)
      .from('couple_permissions')
      .select('*')
      .eq('couple_link_id', linkId)
      .eq('granting_user_id', grantingUserId);
    if (error) {
      console.error('coupleService.getPermissions error:', error);
      return [];
    }
    return (data || []) as CouplePermission[];
  },

  async setPermission(
    linkId: string,
    grantingUserId: string,
    receivingUserId: string,
    sectionKey: string,
    level: CouplePermissionLevel,
  ) {
    const { error } = await (supabase as any)
      .from('couple_permissions')
      .upsert(
        {
          couple_link_id: linkId,
          granting_user_id: grantingUserId,
          receiving_user_id: receivingUserId,
          section_key: sectionKey,
          permission_level: level,
        },
        { onConflict: 'couple_link_id,granting_user_id,section_key' },
      );
    if (error) throw error;

    // Notify partner of permission change (best-effort; ignore failures)
    try {
      await (supabase as any).rpc('notify_partner', {
        p_notification_type: 'permission_changed',
        p_title: 'Sharing settings updated',
        p_body: `${sectionKey} → ${level}`,
        p_link_to: '/profile',
      });
    } catch (e) {
      console.warn('notify_partner failed (non-fatal):', e);
    }
  },

  async getRecentActivity(linkId: string, limit = 10): Promise<CoupleActivityEntry[]> {
    const { data, error } = await (supabase as any)
      .from('couple_activity')
      .select('*')
      .eq('couple_link_id', linkId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('coupleService.getRecentActivity error:', error);
      return [];
    }
    return (data || []) as CoupleActivityEntry[];
  },

  async sendInvite(partnerEmail: string) {
    const { data, error } = await supabase.functions.invoke('send-couple-invite', {
      body: { partnerEmail },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as { ok: true; linkId: string; inviteUrl: string; partnerHasAccount: boolean };
  },

  async acceptInvite(token: string) {
    const { data, error } = await supabase.functions.invoke('accept-couple-invite', {
      body: { token },
    });
    if (error) throw error;
    if ((data as any)?.error) throw new Error((data as any).error);
    return data as { ok: true; linkId: string };
  },

  async unlink(linkId: string, userId: string) {
    const { error } = await (supabase as any)
      .from('couple_links')
      .update({
        status: 'unlinked',
        unlinked_at: new Date().toISOString(),
        unlinked_by: userId,
      })
      .eq('id', linkId);
    if (error) throw error;
  },

  async cancelPendingInvite(linkId: string) {
    const { error } = await (supabase as any)
      .from('couple_links')
      .delete()
      .eq('id', linkId)
      .eq('status', 'pending');
    if (error) throw error;
  },

  // ========== NEW: Phase 2 ==========

  async getCombinedFamilyTree(): Promise<CombinedFamilyMember[]> {
    const { data, error } = await (supabase as any).rpc('get_combined_family_tree');
    if (error) {
      console.error('getCombinedFamilyTree error:', error);
      return [];
    }
    return (data || []) as CombinedFamilyMember[];
  },

  async checkBeneficiaryAlignment(): Promise<BeneficiaryAlignment> {
    const { data, error } = await (supabase as any).rpc('check_beneficiary_alignment');
    if (error) {
      console.error('checkBeneficiaryAlignment error:', error);
      return { linked: false, mismatches: [] };
    }
    return (data as BeneficiaryAlignment) || { linked: false, mismatches: [] };
  },

  async getDocumentGaps(): Promise<DocumentGap[]> {
    const { data, error } = await (supabase as any).rpc('get_partner_document_gaps');
    if (error) {
      console.error('getDocumentGaps error:', error);
      return [];
    }
    return (data || []) as DocumentGap[];
  },

  async getNotifications(userId: string, limit = 20): Promise<CoupleNotification[]> {
    const { data, error } = await (supabase as any)
      .from('couple_notifications')
      .select('*')
      .eq('recipient_user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);
    if (error) {
      console.error('getNotifications error:', error);
      return [];
    }
    return (data || []) as CoupleNotification[];
  },

  async getUnreadNotificationCount(userId: string): Promise<number> {
    const { count, error } = await (supabase as any)
      .from('couple_notifications')
      .select('id', { count: 'exact', head: true })
      .eq('recipient_user_id', userId)
      .eq('is_read', false);
    if (error) {
      console.error('getUnreadNotificationCount error:', error);
      return 0;
    }
    return count ?? 0;
  },

  async markNotificationRead(notificationId: string) {
    const { error } = await (supabase as any)
      .from('couple_notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    if (error) throw error;
  },

  async markAllNotificationsRead(userId: string) {
    const { error } = await (supabase as any)
      .from('couple_notifications')
      .update({ is_read: true })
      .eq('recipient_user_id', userId)
      .eq('is_read', false);
    if (error) throw error;
  },

  async markReviewCompleted(notes?: string) {
    const { error } = await (supabase as any).rpc('mark_couple_review_completed', {
      p_notes: notes ?? null,
    });
    if (error) throw error;
  },

  async setEmailNotifications(linkId: string, enabled: boolean) {
    const { error } = await (supabase as any)
      .from('couple_links')
      .update({ email_notifications_enabled: enabled })
      .eq('id', linkId);
    if (error) throw error;
  },
};
