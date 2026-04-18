import React, { useEffect, useState, useCallback } from 'react';
import { useAppContext } from '@/context/AppContext';
import { toast } from 'sonner';
import {
  Loader2, ShieldCheck, Mail, Send, Unlock, Lock, AlertTriangle,
  Clock, CheckCircle2, ChevronDown, ChevronRight,
} from 'lucide-react';
import {
  trustedContactPortalService,
  PortalContactWithPermissions,
  ReleaseMethod,
  PortalSectionPermission,
} from '@/services/trustedContactPortalService';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';

// Section keys used for permission toggles. Includes all SECTIONS_CONFIG entries
// (excluding affiliate) plus identity/legal which exist as separate concepts.
const PORTAL_SECTIONS: Array<{ key: string; label: string }> = [
  ...SECTIONS_CONFIG
    .filter((s) => s.id !== 'affiliate')
    .map((s) => ({ key: s.id, label: s.label })),
  { key: 'legal', label: 'Legal Documents' },
  { key: 'identity', label: 'Identity' },
];

export const TrustedContactPortal: React.FC = () => {
  const { user } = useAppContext();
  const [loading, setLoading] = useState(true);
  const [contacts, setContacts] = useState<PortalContactWithPermissions[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [confirmReleaseAll, setConfirmReleaseAll] = useState(false);
  const [releasing, setReleasing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const list = await trustedContactPortalService.listForOwner(user.id);
      setContacts(list);
    } catch (err: any) {
      console.error('Load portal contacts:', err);
      toast.error(err?.message || 'Could not load trusted contacts');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { load(); }, [load]);

  const setPermissionLocal = (
    contactId: string,
    sectionKey: string,
    isPermitted: boolean
  ) => {
    setContacts((prev) => prev.map((c) => {
      if (c.id !== contactId) return c;
      const existing = c.permissions.find((p) => p.section_key === sectionKey);
      let next: PortalSectionPermission[];
      if (existing) {
        next = c.permissions.map((p) =>
          p.section_key === sectionKey ? { ...p, is_permitted: isPermitted } : p
        );
      } else {
        next = [...c.permissions, { section_key: sectionKey, is_permitted: isPermitted }];
      }
      return { ...c, permissions: next };
    }));
  };

  const handleSavePermissions = async (c: PortalContactWithPermissions) => {
    setSavingId(c.id);
    try {
      // Ensure every section has an explicit row (default false if missing)
      const full: PortalSectionPermission[] = PORTAL_SECTIONS.map((s) => {
        const found = c.permissions.find((p) => p.section_key === s.key);
        return { section_key: s.key, is_permitted: found?.is_permitted ?? false };
      });
      await trustedContactPortalService.setPermissions(c.id, c.packet_id, full);
      toast.success(`Permissions saved for ${c.contact_name}`);
    } catch (err: any) {
      console.error('Save permissions:', err);
      toast.error(err?.message || 'Failed to save permissions');
    } finally {
      setSavingId(null);
    }
  };

  const handleReleaseMethodChange = async (
    c: PortalContactWithPermissions,
    method: ReleaseMethod,
    days?: number
  ) => {
    try {
      await trustedContactPortalService.updateReleaseSettings(c.id, {
        release_method: method,
        inactivity_days: method === 'inactivity' ? (days ?? c.inactivity_days ?? 30) : null,
      });
      toast.success('Release settings updated');
      await load();
    } catch (err: any) {
      console.error('Release method update:', err);
      toast.error(err?.message || 'Failed to update');
    }
  };

  const handleSendInvite = async (c: PortalContactWithPermissions) => {
    setSavingId(c.id);
    try {
      await trustedContactPortalService.sendInvitation(c.id);
      toast.success(`Invitation sent to ${c.contact_email}`);
      await load();
    } catch (err: any) {
      console.error('Send invite:', err);
      toast.error(err?.message || 'Failed to send invitation');
    } finally {
      setSavingId(null);
    }
  };

  const handleRevoke = async (c: PortalContactWithPermissions) => {
    try {
      await trustedContactPortalService.revokeAccess(c.id);
      toast.success(`Access revoked for ${c.contact_name}`);
      await load();
    } catch (err: any) {
      console.error('Revoke:', err);
      toast.error(err?.message || 'Failed to revoke');
    }
  };

  const handleReleaseAll = async () => {
    if (!user) return;
    setReleasing(true);
    try {
      const { released } = await trustedContactPortalService.releasePacket(user.id);
      toast.success(`Packet released to ${released} trusted contact${released === 1 ? '' : 's'}`);
      setConfirmReleaseAll(false);
      await load();
    } catch (err: any) {
      console.error('Release packet:', err);
      toast.error(err?.message || 'Failed to release packet');
    } finally {
      setReleasing(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-xl font-serif font-bold text-navy-muted flex items-center gap-2">
            <ShieldCheck className="w-5 h-5" /> Trusted Contact Access Portal
          </h2>
          <p className="text-xs text-stone-500 mt-1 max-w-xl">
            Choose exactly what each trusted contact can see, how access is released,
            and send their secure invitation when you are ready.
          </p>
        </div>
        <button
          onClick={() => setConfirmReleaseAll(true)}
          disabled={contacts.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-amber-600 text-white rounded-xl text-sm font-bold hover:bg-amber-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Unlock size={16} /> Release My Packet
        </button>
      </div>

      {contacts.length === 0 ? (
        <div className="paper-sheet p-8 text-center">
          <p className="text-sm text-stone-500">
            Add a trusted contact below to configure portal access.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {contacts.map((c) => {
            const isExpanded = expandedId === c.id;
            const grantedCount = c.permissions.filter((p) => p.is_permitted).length;
            return (
              <div key={c.id} className="paper-sheet overflow-hidden">
                <button
                  onClick={() => setExpandedId(isExpanded ? null : c.id)}
                  className="w-full p-4 flex items-center justify-between gap-3 hover:bg-stone-50/60 transition-colors text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {isExpanded ? <ChevronDown size={16} className="text-stone-400" /> : <ChevronRight size={16} className="text-stone-400" />}
                    <div className="min-w-0">
                      <div className="font-bold text-navy-muted truncate">{c.contact_name}</div>
                      <div className="text-xs text-stone-500 truncate">{c.contact_email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {c.access_released ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-emerald-50 text-emerald-700 flex items-center gap-1">
                        <CheckCircle2 size={10} /> Released
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-stone-100 text-stone-500 flex items-center gap-1">
                        <Lock size={10} /> Locked
                      </span>
                    )}
                    {c.invite_sent_at && !c.invite_accepted_at && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-amber-50 text-amber-700 flex items-center gap-1">
                        <Clock size={10} /> Invited
                      </span>
                    )}
                    {c.invite_accepted_at && (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-widest bg-indigo-50 text-indigo-700">
                        Account Created
                      </span>
                    )}
                    <span className="text-[10px] text-stone-500 hidden sm:inline">
                      {grantedCount}/{PORTAL_SECTIONS.length} sections
                    </span>
                  </div>
                </button>

                {isExpanded && (
                  <div className="border-t border-stone-100 p-4 space-y-5">
                    {/* Release method */}
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">
                        Release Method
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {(['manual', 'inactivity', 'immediate'] as ReleaseMethod[]).map((m) => (
                          <button
                            key={m}
                            onClick={() => handleReleaseMethodChange(c, m)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-colors ${
                              c.release_method === m
                                ? 'bg-navy-muted text-white border-navy-muted'
                                : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                            }`}
                          >
                            {m === 'manual' && 'Manual release only'}
                            {m === 'inactivity' && 'After inactivity'}
                            {m === 'immediate' && 'Immediate access'}
                          </button>
                        ))}
                      </div>
                      {c.release_method === 'inactivity' && (
                        <div className="mt-2 flex items-center gap-2">
                          <label className="text-xs text-stone-500">Days of inactivity:</label>
                          <input
                            type="number"
                            min={7}
                            max={365}
                            defaultValue={c.inactivity_days ?? 30}
                            onBlur={(e) => {
                              const days = Math.max(7, Math.min(365, parseInt(e.target.value) || 30));
                              handleReleaseMethodChange(c, 'inactivity', days);
                            }}
                            className="w-20 px-2 py-1 border border-stone-200 rounded text-xs"
                          />
                        </div>
                      )}
                    </div>

                    {/* Permissions */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">
                          Section Permissions
                        </h4>
                        <button
                          onClick={() => handleSavePermissions(c)}
                          disabled={savingId === c.id}
                          className="text-xs font-bold text-navy-muted hover:underline disabled:opacity-50"
                        >
                          {savingId === c.id ? 'Saving…' : 'Save permissions'}
                        </button>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {PORTAL_SECTIONS.map((s) => {
                          const perm = c.permissions.find((p) => p.section_key === s.key);
                          const checked = !!perm?.is_permitted;
                          return (
                            <label
                              key={s.key}
                              className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-stone-50 cursor-pointer text-sm"
                            >
                              <input
                                type="checkbox"
                                checked={checked}
                                onChange={(e) => setPermissionLocal(c.id, s.key, e.target.checked)}
                                className="w-4 h-4 rounded border-stone-300 text-navy-muted focus:ring-navy-muted"
                              />
                              <span className="text-stone-700">{s.label}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    {/* Invitation + revoke actions */}
                    <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-stone-100">
                      <button
                        onClick={() => handleSendInvite(c)}
                        disabled={savingId === c.id}
                        className="flex items-center gap-2 px-3 py-2 bg-navy-muted text-white rounded-lg text-xs font-bold hover:bg-navy-muted/90 disabled:opacity-50"
                      >
                        {c.invite_sent_at ? <Mail size={14} /> : <Send size={14} />}
                        {c.invite_sent_at ? 'Resend Invitation' : 'Send Invitation'}
                      </button>
                      {c.invite_sent_at && (
                        <span className="text-[10px] text-stone-500">
                          Last sent {new Date(c.invite_sent_at).toLocaleDateString()}
                        </span>
                      )}
                      {c.access_released && (
                        <button
                          onClick={() => handleRevoke(c)}
                          className="ml-auto flex items-center gap-2 px-3 py-2 bg-stone-100 text-stone-700 rounded-lg text-xs font-bold hover:bg-stone-200"
                        >
                          <Lock size={14} /> Revoke Access
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Release-all confirmation */}
      {confirmReleaseAll && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center flex-shrink-0">
                <AlertTriangle size={20} />
              </div>
              <div>
                <h3 className="font-bold text-navy-muted text-lg">Release your packet?</h3>
                <p className="text-sm text-stone-600 mt-1">
                  This grants access to <strong>all trusted contacts</strong> per the
                  permissions you have configured. They will receive an email
                  notification immediately.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setConfirmReleaseAll(false)}
                disabled={releasing}
                className="px-4 py-2 text-sm font-bold text-stone-600 hover:bg-stone-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleReleaseAll}
                disabled={releasing}
                className="px-4 py-2 text-sm font-bold bg-amber-600 text-white rounded-lg hover:bg-amber-700 disabled:opacity-50 flex items-center gap-2"
              >
                {releasing && <Loader2 size={14} className="animate-spin" />}
                Yes, release my packet
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
