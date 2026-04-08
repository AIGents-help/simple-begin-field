import { supabase } from '@/lib/supabase';
import { Database } from '../types/database';

type Tables = Database['public']['Tables'];

export const inviteService = {
  async invitePartner(packetId: string, email: string, name: string, invitedBy: string) {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const { data, error } = await supabase
      .from('partner_invites')
      .insert({
        packet_id: packetId,
        invited_email: email,
        invited_name: name,
        invited_by: invitedBy,
        token: token,
        expires_at: expiresAt.toISOString(),
        role: 'partner',
        household_scope: 'personB',
        status: 'pending'
      })
      .select()
      .single();

    return { data, error, token };
  },

  async getInviteByToken(token: string) {
    const { data, error } = await supabase
      .from('partner_invites')
      .select('*, packets(title, person_a_name)')
      .eq('token', token)
      .single();
    return { data, error };
  },

  async acceptInvite(token: string, userId: string) {
    const { data: invite, error: inviteError } = await this.getInviteByToken(token);
    if (inviteError || !invite) return { error: inviteError || new Error('Invite not found') };
    if (invite.status !== 'pending') return { error: new Error(`Invite is already ${invite.status}`) };
    if (new Date(invite.expires_at) < new Date()) return { error: new Error('Invite has expired') };

    const { error: memberError } = await supabase
      .from('packet_members')
      .insert({
        packet_id: invite.packet_id,
        user_id: userId,
        role: invite.role as any,
        household_scope: invite.household_scope as any
      });

    if (memberError) return { error: memberError };

    const { error: updateError } = await supabase
      .from('partner_invites')
      .update({ status: 'accepted', created_at: new Date().toISOString() })
      .eq('id', invite.id);

    await supabase
      .from('packets')
      .update({ household_mode: 'couple' })
      .eq('id', invite.packet_id);

    return { success: true, error: updateError, packetId: invite.packet_id };
  },

  async revokeInvite(inviteId: string) {
    const { error } = await supabase
      .from('partner_invites')
      .update({ status: 'revoked' })
      .eq('id', inviteId);
    return { error };
  },

  async getPacketInvites(packetId: string) {
    const { data, error } = await supabase
      .from('partner_invites')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false });
    return { data, error };
  },

  async getPacketMembers(packetId: string) {
    const { data, error } = await supabase
      .from('packet_members')
      .select('*, profiles:user_id(full_name, email)')
      .eq('packet_id', packetId);
    return { data, error };
  },

  async removeMember(memberId: string) {
    const { error } = await supabase
      .from('packet_members')
      .delete()
      .eq('id', memberId);
    return { error };
  }
};
