import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Users, 
  UserPlus, 
  Mail, 
  Shield, 
  Trash2, 
  RefreshCw, 
  CheckCircle2, 
  Clock, 
  AlertTriangle,
  ChevronRight,
  User,
  Settings,
  ArrowLeft
} from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { inviteService } from '../../services/inviteService';
import { packetService } from '../../services/packetService';
import { coupleService } from '../../services/coupleService';
import { PlanGate } from '../billing/PlanGate';
import { useConfirm } from '../../context/ConfirmDialogContext';

interface HouseholdSettingsProps {
  onBack: () => void;
}

export const HouseholdSettings: React.FC<HouseholdSettingsProps> = ({ onBack }) => {
  const { packet, user, refreshPacketData, refreshBilling } = useAppContext();
  const confirm = useConfirm();
  const [members, setMembers] = useState<any[]>([]);
  const [invites, setInvites] = useState<any[]>([]);
  const [coupleLink, setCoupleLink] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [sendingInvite, setSendingInvite] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!packet || !user) return;
    setLoading(true);
    try {
      const [membersRes, invitesRes, link] = await Promise.all([
        inviteService.getPacketMembers(packet.id),
        inviteService.getPacketInvites(packet.id),
        coupleService.getActiveLink(user.id),
      ]);

      const baseMembers = membersRes.data || [];
      const merged: any[] = [...baseMembers];

      // Merge active couple_links partner as a household member.
      // The linked partner record lives in couple_links, not packet_members,
      // so we synthesize a row here and de-dupe by user_id.
      if (link && link.status === 'active') {
        const partnerId = link.user_id_1 === user.id ? link.user_id_2 : link.user_id_1;
        if (partnerId && !merged.some((m) => m.user_id === partnerId)) {
          const partnerProfile = await coupleService.getPartnerProfile(partnerId);
          merged.push({
            id: `couple-link-${link.id}`,
            user_id: partnerId,
            role: 'partner',
            isCoupleLink: true,
            coupleLinkId: link.id,
            profiles: partnerProfile
              ? { full_name: partnerProfile.full_name, email: partnerProfile.email }
              : { full_name: link.invite_email || 'Linked Partner', email: link.invite_email || '' },
          });
        }
      }

      setMembers(merged);
      setInvites(invitesRes.data || []);
      setCoupleLink(link);
    } catch (err) {
      console.error('Error fetching household data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Force a fresh plan check so any recent plan upgrade is reflected
    // immediately without waiting for a session refresh.
    void refreshBilling?.();
  }, [packet?.id, user?.id]);

  const handleSendInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!packet || !user) return;
    
    setSendingInvite(true);
    setError(null);
    
    const { error: inviteError, token } = await inviteService.invitePartner(
      packet.id,
      inviteEmail,
      inviteName,
      user.id
    );

    if (inviteError) {
      setError(inviteError.message);
    } else {
      // In a real app, you'd send an email here.
      // For this demo, we'll just show the link.
      const inviteLink = `${window.location.origin}/invite/${token}`;
      console.log('Invite Link:', inviteLink);
      toast.success("Invite sent! Link copied to clipboard.", { duration: 4000, position: "bottom-center" });
      navigator.clipboard.writeText(inviteLink).catch(() => {});
      
      setInviteEmail('');
      setInviteName('');
      setShowInviteForm(false);
      fetchData();
    }
    setSendingInvite(false);
  };

  const handleRevokeInvite = async (id: string) => {
    const ok = await confirm({
      title: 'Revoke this invite?',
      description: 'The recipient will no longer be able to use this invitation link.',
      confirmLabel: 'Revoke',
    });
    if (!ok) return;
    await inviteService.revokeInvite(id);
    fetchData();
  };

  const handleRemoveMember = async (id: string) => {
    const ok = await confirm({
      title: 'Remove this household member?',
      description: 'They will immediately lose access. This action cannot be undone.',
      confirmLabel: 'Remove',
    });
    if (!ok) return;
    await inviteService.removeMember(id);
    fetchData();
  };

  const handleToggleMode = async () => {
    if (!packet) return;
    const newMode = packet.household_mode === 'single' ? 'couple' : 'single';
    if (newMode === 'single' && members.length > 1) {
      const ok = await confirm({
        title: 'Switch to single mode?',
        description: 'Members are not removed, but data scoping will change. Continue?',
        confirmLabel: 'Switch mode',
        variant: 'warning',
      });
      if (!ok) return;
    }
    await packetService.updatePacket(packet.id, { household_mode: newMode });
    refreshPacketData();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-4 h-16 flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <h1 className="text-lg font-semibold">Household Management</h1>
        </div>
      </div>

      <div className="p-4 space-y-6">
        {/* Packet Details */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Packet Details</h2>
            <Settings className="w-4 h-4 text-gray-400" />
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-gray-400 block mb-1">Packet Title</label>
              <p className="font-medium text-gray-900">{packet?.title || 'Untitled Packet'}</p>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100">
              <div>
                <p className="text-sm font-medium text-gray-900">Household Mode</p>
                <p className="text-xs text-gray-500 capitalize">{packet?.household_mode} Mode</p>
              </div>
              <button 
                onClick={handleToggleMode}
                className="text-xs font-semibold text-primary hover:underline"
              >
                Switch to {packet?.household_mode === 'single' ? 'Couple' : 'Single'}
              </button>
            </div>
          </div>
        </section>

        {/* Household Members */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Household Members</h2>
            <span className="text-xs text-gray-400">{members.length} Active</span>
          </div>
          
          <div className="space-y-3">
            {members.map((member) => (
              <div key={member.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <User className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{member.profiles?.full_name || 'Unknown'}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{member.profiles?.email}</span>
                      <span className="w-1 h-1 rounded-full bg-gray-300" />
                      <span className="text-xs font-medium text-primary capitalize">{member.role}</span>
                    </div>
                  </div>
                </div>
                {member.user_id !== user?.id && (
                  <button 
                    onClick={() => handleRemoveMember(member.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </section>

        {/* Pending Invites */}
        <section className="space-y-3">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider">Pending Invites</h2>
            <PlanGate feature="partner" fallback={null}>
              <button 
                onClick={() => setShowInviteForm(true)}
                className="text-xs font-semibold text-primary flex items-center gap-1 hover:underline"
              >
                <UserPlus className="w-3 h-3" />
                Invite Partner
              </button>
            </PlanGate>
          </div>

          <div className="space-y-3">
            {invites.filter(i => i.status === 'pending').length === 0 && !showInviteForm && (
              <div className="bg-white rounded-2xl p-8 border border-dashed border-gray-200 text-center">
                <Mail className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No pending invitations</p>
              </div>
            )}

            <AnimatePresence>
              {showInviteForm && (
                <motion.form 
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  onSubmit={handleSendInvite}
                  className="bg-white rounded-2xl p-4 shadow-md border border-primary/20 space-y-4"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-semibold">Invite Partner</h3>
                    <button 
                      type="button" 
                      onClick={() => setShowInviteForm(false)}
                      className="text-xs text-gray-400 hover:text-gray-600"
                    >
                      Cancel
                    </button>
                  </div>
                  <div className="space-y-3">
                    <input 
                      type="text"
                      placeholder="Partner's Full Name"
                      required
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                    <input 
                      type="email"
                      placeholder="Partner's Email Address"
                      required
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      className="w-full p-3 bg-gray-50 rounded-xl border border-gray-100 text-sm focus:ring-2 focus:ring-primary/20 outline-none"
                    />
                  </div>
                  {error && <p className="text-xs text-red-500">{error}</p>}
                  <button 
                    disabled={sendingInvite}
                    className="w-full py-3 bg-primary text-white rounded-xl font-semibold text-sm shadow-lg shadow-primary/20 disabled:opacity-50"
                  >
                    {sendingInvite ? 'Sending...' : 'Send Invitation'}
                  </button>
                </motion.form>
              )}
            </AnimatePresence>

            {invites.filter(i => i.status === 'pending').map((invite) => (
              <div key={invite.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center">
                    <Clock className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{invite.invited_name}</p>
                    <p className="text-xs text-gray-500">{invite.invited_email}</p>
                    <span className="text-[10px] font-bold text-amber-600 uppercase tracking-tighter">Pending Invite</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => handleRevokeInvite(invite.id)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Access & Permissions */}
        <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Access & Permissions</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <Shield className="w-5 h-5 text-primary shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Shared Access</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Partners can view and edit all shared household records and documents.
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-900">Private Items</p>
                <p className="text-xs text-gray-500 leading-relaxed">
                  Items marked "Only Me" are never visible to your partner.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Danger Zone */}
        <section className="bg-red-50 rounded-2xl p-6 border border-red-100">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            <h2 className="text-sm font-semibold text-red-900 uppercase tracking-wider">Danger Zone</h2>
          </div>
          <div className="space-y-4">
            <p className="text-xs text-red-700 leading-relaxed">
              Removing your partner will immediately revoke their access to all shared records and documents. This action cannot be undone.
            </p>
            <button className="w-full py-3 bg-white text-red-600 border border-red-200 rounded-xl font-semibold text-sm hover:bg-red-50 transition-colors">
              Revoke All Partner Access
            </button>
          </div>
        </section>
      </div>
    </div>
  );
};
