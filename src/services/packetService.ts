import { supabase } from '@/lib/supabase';
import { Database } from '../types/database';
import { isDemoMode } from '../demo/demoMode';
import { DEMO_PACKET, DEMO_SECTION_COMPLETION } from '../demo/morganFamilyData';

type Packet = Database['public']['Tables']['packets']['Row'];
type PacketInsert = Database['public']['Tables']['packets']['Insert'];
type PacketMember = Database['public']['Tables']['packet_members']['Row'];

export const packetService = {
  async getPacketsForUser(userId: string) {
    if (isDemoMode()) {
      return {
        data: [{ packet_id: DEMO_PACKET.id, role: 'owner', household_scope: 'full', packets: DEMO_PACKET }],
        error: null,
      };
    }
    const { data, error } = await supabase
      .from('packet_members')
      .select(`
        packet_id,
        role,
        household_scope,
        packets (*)
      `)
      .eq('user_id', userId);
    
    return { data, error };
  },

  async getPacketById(packetId: string) {
    const { data, error } = await supabase
      .from('packets')
      .select('*')
      .eq('id', packetId)
      .single();
    
    return { data, error };
  },

  async createPacket(packet: PacketInsert) {
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log("Authenticated User ID:", user?.id);

    if (userError || !user) {
      console.error("Auth error:", userError);
      return { data: null, error: userError || new Error("No authenticated user") };
    }

    const payload = { ...packet, owner_user_id: user.id };
    console.log("Packet Insert Payload:", payload);

    // 1. Create the packet
    const { data: newPacket, error: packetError } = await supabase
      .from('packets')
      .insert(payload)
      .select()
      .single();
    
    if (packetError) {
      console.error("Supabase Insert Error:", packetError);
      return { data: null, error: packetError };
    }

    if (!newPacket) return { data: null, error: new Error("Failed to create packet") };

    // 2. Add the owner as a member
    const { error: memberError } = await supabase
      .from('packet_members')
      .insert({
        packet_id: newPacket.id,
        user_id: user.id,
        role: 'owner',
        household_scope: 'full'
      });
    
    if (memberError) {
      console.error("Member Insert Error:", memberError);
      return { data: null, error: memberError };
    }

    return { data: newPacket, error: null };
  },

  async updatePacket(packetId: string, updates: Partial<Packet>) {
    const { data, error } = await supabase
      .from('packets')
      .update(updates)
      .eq('id', packetId)
      .select()
      .single();
    
    return { data, error };
  },

  async getPacketMembers(packetId: string) {
    const { data, error } = await supabase
      .from('packet_members')
      .select(`
        *,
        profiles (full_name, email)
      `)
      .eq('packet_id', packetId);
    
    return { data, error };
  },

  async getSectionCompletion(packetId: string) {
    const { data, error } = await supabase
      .from('section_completion')
      .select('*')
      .eq('packet_id', packetId);
    
    return { data, error };
  },

  async updateSectionCompletion(
    packetId: string, 
    sectionKey: string, 
    scope: 'personA' | 'personB' | 'shared',
    updates: { status: 'empty' | 'in_progress' | 'complete' | 'not_applicable', percent_complete: number }
  ) {
    const { data, error } = await supabase
      .from('section_completion')
      .upsert({
        packet_id: packetId,
        section_key: sectionKey,
        scope,
        ...updates,
        updated_at: new Date().toISOString()
      }, { onConflict: 'packet_id,section_key,scope' })
      .select()
      .single();
    
    return { data, error };
  },

  async uploadPacketDocument(params: {
    bucket?: 'packet-documents'
    packetId: string
    sectionKey: string
    recordId: string
    file: File
  }) {
    const bucket = params.bucket ?? 'packet-documents';
    const ext = params.file.name.split('.').pop();
    const safeFileName = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
    const path = `${params.packetId}/${params.sectionKey}/${params.recordId}/${safeFileName}`;

    const { data, error } = await supabase.storage
      .from(bucket)
      .upload(path, params.file, {
        upsert: false,
        cacheControl: '3600',
      });

    if (error) throw error;
    return data;
  },

  async uploadPrivateDocument(params: {
    packetId: string
    privateItemId: string
    file: File
  }) {
    const ext = params.file.name.split('.').pop();
    const safeFileName = `${crypto.randomUUID()}${ext ? `.${ext}` : ''}`;
    const path = `${params.packetId}/${params.privateItemId}/${safeFileName}`;

    const { data, error } = await supabase.storage
      .from('packet-private-documents')
      .upload(path, params.file, {
        upsert: false,
        cacheControl: '3600',
      });

    if (error) throw error;
    return data;
  },

  async getSignedFileUrl(bucket: string, filePath: string) {
    const { data, error } = await supabase.storage
      .from(bucket)
      .createSignedUrl(filePath, 60 * 5);

    if (error) throw error;
    return data.signedUrl;
  }
};
