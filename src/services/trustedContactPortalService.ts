import { supabase } from '@/integrations/supabase/client';

/**
 * Trusted Contact Portal — Phase 1 service layer
 *
 * Manages the new "portal" capabilities on top of the existing trusted_contacts
 * table: granular per-section permissions, release method, invitations, and
 * the access log.
 */

export type ReleaseMethod = 'manual' | 'inactivity' | 'immediate';

export interface PortalSectionPermission {
  section_key: string;
  is_permitted: boolean;
}

export interface PortalContactRow {
  id: string;
  packet_id: string;
  user_id: string; // owner
  contact_name: string;
  contact_email: string;
  contact_phone: string | null;
  relationship: string | null;
  photo_path: string | null;
  is_deceased: boolean | null;

  // Portal fields
  portal_user_id: string | null; // the trusted contact's own auth user (if registered)
  invite_token: string | null;
  invite_sent_at: string | null;
  invite_accepted_at: string | null;
  access_released: boolean;
  access_released_at: string | null;
  release_method: ReleaseMethod;
  inactivity_days: number | null;
}

export interface PortalContactWithPermissions extends PortalContactRow {
  permissions: PortalSectionPermission[];
}

const SELECT_COLUMNS = `
  id, packet_id, user_id, contact_name, contact_email, contact_phone,
  relationship, photo_path, is_deceased,
  invite_token, invite_sent_at, invite_accepted_at,
  access_released, access_released_at, release_method, inactivity_days,
  portal_user_id:user_id
`;

function mapContact(raw: any): PortalContactRow {
  return {
    id: raw.id,
    packet_id: raw.packet_id,
    user_id: raw.user_id,
    contact_name: raw.contact_name,
    contact_email: raw.contact_email,
    contact_phone: raw.contact_phone,
    relationship: raw.relationship,
    photo_path: raw.photo_path,
    is_deceased: raw.is_deceased,
    portal_user_id: raw.user_id_link ?? null, // not used yet — placeholder
    invite_token: raw.invite_token,
    invite_sent_at: raw.invite_sent_at,
    invite_accepted_at: raw.invite_accepted_at,
    access_released: !!raw.access_released,
    access_released_at: raw.access_released_at,
    release_method: (raw.release_method as ReleaseMethod) || 'manual',
    inactivity_days: raw.inactivity_days,
  };
}

export const trustedContactPortalService = {
  async listForOwner(ownerUserId: string): Promise<PortalContactWithPermissions[]> {
    const { data: contacts, error } = await supabase
      .from('trusted_contacts')
      .select(`
        id, packet_id, user_id, contact_name, contact_email, contact_phone,
        relationship, photo_path, is_deceased,
        invite_token, invite_sent_at, invite_accepted_at,
        access_released, access_released_at, release_method, inactivity_days
      `)
      .eq('user_id', ownerUserId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const ids = (contacts || []).map((c: any) => c.id);
    let permsByContact: Record<string, PortalSectionPermission[]> = {};
    if (ids.length) {
      const { data: perms, error: pErr } = await supabase
        .from('trusted_contact_permissions')
        .select('trusted_contact_id, section_key, is_permitted')
        .in('trusted_contact_id', ids);
      if (pErr) throw pErr;
      for (const p of perms || []) {
        const cid = (p as any).trusted_contact_id as string;
        if (!permsByContact[cid]) permsByContact[cid] = [];
        permsByContact[cid].push({
          section_key: (p as any).section_key,
          is_permitted: !!(p as any).is_permitted,
        });
      }
    }

    return (contacts || []).map((c: any) => ({
      ...mapContact(c),
      permissions: permsByContact[c.id] || [],
    }));
  },

  async setPermissions(
    contactId: string,
    packetId: string,
    permissions: PortalSectionPermission[]
  ) {
    if (!permissions.length) return;
    const rows = permissions.map((p) => ({
      trusted_contact_id: contactId,
      packet_id: packetId,
      section_key: p.section_key,
      is_permitted: p.is_permitted,
    }));
    const { error } = await supabase
      .from('trusted_contact_permissions')
      .upsert(rows, { onConflict: 'trusted_contact_id,section_key' });
    if (error) throw error;
  },

  async updateReleaseSettings(
    contactId: string,
    settings: {
      release_method: ReleaseMethod;
      inactivity_days?: number | null;
    }
  ) {
    const payload: any = {
      release_method: settings.release_method,
      updated_at: new Date().toISOString(),
    };
    if (settings.release_method === 'inactivity') {
      payload.inactivity_days = settings.inactivity_days ?? 30;
    } else {
      payload.inactivity_days = null;
    }
    // immediate => auto-release
    if (settings.release_method === 'immediate') {
      payload.access_released = true;
      payload.access_released_at = new Date().toISOString();
    }
    const { error } = await supabase
      .from('trusted_contacts')
      .update(payload)
      .eq('id', contactId);
    if (error) throw error;
  },

  async sendInvitation(contactId: string): Promise<{ token: string }> {
    const token = crypto.randomUUID().replace(/-/g, '') + crypto.randomUUID().replace(/-/g, '');
    const { error } = await supabase
      .from('trusted_contacts')
      .update({
        invite_token: token,
        invite_sent_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);
    if (error) throw error;

    // Fire-and-forward email via edge function (does not block UI on email failure)
    const { error: fnError } = await supabase.functions.invoke('send-trusted-contact-invite', {
      body: { contact_id: contactId, token },
    });
    if (fnError) {
      // Surface the error so the UI can show it — never silent
      throw new Error(`Invitation saved but email failed: ${fnError.message}`);
    }

    return { token };
  },

  async releasePacket(ownerUserId: string): Promise<{ released: number }> {
    const nowIso = new Date().toISOString();
    const { data, error } = await supabase
      .from('trusted_contacts')
      .update({
        access_released: true,
        access_released_at: nowIso,
        updated_at: nowIso,
      })
      .eq('user_id', ownerUserId)
      .select('id, contact_email, contact_name');
    if (error) throw error;

    // Notify each released contact (best-effort — surfaces error if function fails)
    const contacts = (data as any[]) || [];
    for (const c of contacts) {
      await supabase.functions.invoke('send-trusted-contact-invite', {
        body: { contact_id: c.id, mode: 'release_notification' },
      }).catch((e) => {
        console.error('release notify failed for', c.contact_email, e);
      });
    }
    return { released: contacts.length };
  },

  async revokeAccess(contactId: string) {
    const { error } = await supabase
      .from('trusted_contacts')
      .update({
        access_released: false,
        access_released_at: null,
        updated_at: new Date().toISOString(),
      })
      .eq('id', contactId);
    if (error) throw error;
  },

  // ====== Trusted Contact (viewer) side ======

  /** Look up a pending invite by token (public read uses RPC-safe filter on token). */
  async getInviteByToken(token: string) {
    const { data, error } = await supabase
      .from('trusted_contacts')
      .select('id, contact_name, contact_email, packet_id, invite_accepted_at, packets(title, person_a_name, owner_user_id)')
      .eq('invite_token', token)
      .maybeSingle();
    return { data, error };
  },

  /** Link a freshly-registered auth user to the trusted_contacts row matching the token. */
  async linkInviteToUser(token: string, userId: string) {
    const { data, error } = await supabase
      .from('trusted_contacts')
      .update({
        user_id: userId,
        invite_accepted_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('invite_token', token)
      .select('id, packet_id')
      .maybeSingle();
    if (error) throw error;
    return data;
  },

  /** List packets the current viewer (trusted contact) has been released access to. */
  async listViewerPackets() {
    // First find trusted_contact rows for the current user
    const { data: tcRows, error } = await supabase
      .from('trusted_contacts')
      .select('id, packet_id, access_released, access_released_at, contact_name, packets(id, title, person_a_name, person_b_name, owner_user_id)')
      .eq('user_id', (await supabase.auth.getUser()).data.user?.id ?? '');
    if (error) throw error;
    return tcRows || [];
  },

  /** Sections the viewer is permitted to see for a packet. */
  async listViewerPermittedSections(packetId: string): Promise<string[]> {
    const { data: tc, error: tcErr } = await supabase
      .from('trusted_contacts')
      .select('id')
      .eq('packet_id', packetId)
      .maybeSingle();
    if (tcErr) throw tcErr;
    if (!tc) return [];

    const { data: perms, error: permErr } = await supabase
      .from('trusted_contact_permissions')
      .select('section_key, is_permitted')
      .eq('trusted_contact_id', (tc as any).id);
    if (permErr) throw permErr;

    return (perms || [])
      .filter((p: any) => p.is_permitted)
      .map((p: any) => p.section_key);
  },

  /** Record an access-log entry when a trusted contact opens a section. */
  async logSectionView(packetId: string, sectionKey: string) {
    const userId = (await supabase.auth.getUser()).data.user?.id;
    if (!userId) return;
    const { error } = await supabase.from('trusted_contact_access_log').insert({
      trusted_contact_user_id: userId,
      packet_id: packetId,
      section_key: sectionKey,
      action: 'view',
    });
    if (error) {
      // Non-blocking — surface in console but do not throw
      console.error('Failed to log section view:', error);
    }
  },

  /** Owner-side: read access log for their packet. */
  async getAccessLog(packetId: string) {
    const { data, error } = await supabase
      .from('trusted_contact_access_log')
      .select('*')
      .eq('packet_id', packetId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return data || [];
  },
};
