import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Copy, User, ShieldCheck, LogOut, Loader2, LayoutDashboard, Shield, ShieldAlert, CreditCard, Download, X, TrendingUp, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../../services/authService';
import { DownloadPacketButton } from '../download/DownloadPacketButton';
import { DownloadHistoryList } from '../download/DownloadHistoryList';
import { CheckInPreferences } from '../checkin/CheckInPreferences';
import { InactivityCheckInCard } from '../checkin/InactivityCheckInCard';
import { AlertPreferences } from '../notifications/AlertPreferences';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

// ── Edit Profile Modal ──
const EditProfileModal = ({ isOpen, onClose, userId, currentName, email }: {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  currentName: string;
  email: string;
}) => {
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setFullName(currentName || '');
    }
  }, [isOpen, currentName]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: fullName.trim() })
        .eq('id', userId);
      if (error) throw error;
      toast.success('Profile updated', { duration: 3000, position: 'bottom-center' });
      onClose();
      // Reload to reflect changes in context
      window.location.reload();
    } catch (err: any) {
      console.error('Profile update error:', err);
      toast.error(err.message || 'Failed to update profile', { duration: 5000, position: 'bottom-center' });
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 space-y-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-stone-900">Edit Profile</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200">
            <X size={16} className="text-stone-500" />
          </button>
        </div>

        <div className="space-y-3">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Full Name</label>
            <input
              type="text"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
              placeholder="Your full name"
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Email</label>
            <input
              type="email"
              value={email}
              readOnly
              className="w-full p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm text-stone-400 cursor-not-allowed"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50"
        >
          {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};

export const ProfileScreen = () => {
  const { personA, personB, userMode, setState, setView, user, currentPacket, profile, userDisplayName, userInitials, planKey, planName, isPaid } = useAppContext();
  const [loading, setLoading] = React.useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const navigate = useNavigate();

  const isAdmin = profile?.role === 'admin';
  const isProfessional = profile?.role === 'professional';

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await authService.signOut();
      window.location.reload();
    } catch (err) {
      console.error("Error signing out:", err);
    } finally {
      setLoading(false);
    }
  };

  const Card = ({ children, className = "" }: { children: React.ReactNode, className?: string }) => (
    <div className={`paper-sheet p-5 mb-4 ${className}`}>
      {children}
    </div>
  );

  return (
    <div className="p-6 pb-32">
      <div className="mb-8">
        <h1 className="text-3xl font-serif font-bold text-navy-muted">Profile & Settings</h1>
      </div>

      <div className="space-y-6">
        {(isAdmin || isProfessional) && (
          <button 
            onClick={() => navigate('/dashboard')}
            className="w-full flex items-center justify-between p-5 mb-4 bg-stone-900 text-white rounded-2xl shadow-lg group"
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div className="text-left">
                <p className="text-lg font-serif italic">Operational Dashboard</p>
                <p className="text-[10px] opacity-60 uppercase tracking-widest font-bold">Manage {isAdmin ? 'System' : 'Referrals'}</p>
              </div>
            </div>
          </button>
        )}

        <Card>
          <div className="flex items-center gap-4 mb-6">
            <div className="w-16 h-16 bg-navy-muted rounded-2xl flex items-center justify-center text-manila text-2xl font-bold">
              {userInitials}
            </div>
            <div>
              <h3 className="text-xl font-bold text-navy-muted">{userDisplayName}</h3>
              <p className="text-sm text-stone-500">{user?.email}</p>
            </div>
          </div>
          <button 
            onClick={() => setEditOpen(true)}
            className="w-full py-2 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
          >
            Edit Profile
          </button>
        </Card>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Household Setup</h3>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-navy-muted">Household Mode</p>
                <p className="text-xs text-stone-500">{userMode === 'couple' ? 'Couple Mode' : 'Single Mode'}</p>
              </div>
              <button 
                onClick={() => setView('household')}
                className="px-3 py-1.5 bg-manila rounded-lg text-[10px] font-bold uppercase text-navy-muted border border-folder-edge"
              >
                Manage Household
              </button>
            </div>
            {userMode === 'couple' && (
              <div className="pt-4 border-t border-stone-100">
                <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Partner</p>
                <p className="text-sm font-bold text-navy-muted">{personB}</p>
              </div>
            )}
          </Card>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Security & Trust</h3>
          <div className="grid grid-cols-2 gap-4">
            <button 
              onClick={() => setView('security')}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-stone-100 shadow-sm hover:border-indigo-200 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <Shield size={24} />
              </div>
              <span className="text-xs font-bold text-navy-muted">Security</span>
            </button>
            <button 
              onClick={() => setView('trust')}
              className="flex flex-col items-center gap-3 p-6 bg-white rounded-3xl border border-stone-100 shadow-sm hover:border-indigo-200 transition-all"
            >
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-indigo-600">
                <ShieldAlert size={24} />
              </div>
              <span className="text-xs font-bold text-navy-muted">Trust Info</span>
            </button>
          </div>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Subscription</h3>
          <Card>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-bold text-navy-muted">Current Plan</p>
                <p className="text-xs text-stone-500">{planName || 'Free'}</p>
              </div>
              <div className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${isPaid ? 'bg-emerald-50 text-emerald-700' : 'bg-stone-100 text-stone-500'}`}>
                {isPaid ? 'Active' : 'Free'}
              </div>
            </div>
            {!isPaid && (
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-3 bg-navy-muted text-white rounded-xl text-sm font-bold flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-colors"
              >
                <CreditCard size={16} />
                Upgrade Plan
              </button>
            )}
            {isPaid && (
              <button
                onClick={() => navigate('/pricing')}
                className="w-full py-2 border border-stone-200 rounded-lg text-xs font-bold text-stone-600 hover:bg-stone-50 transition-colors"
              >
                Manage Plan
              </button>
            )}
          </Card>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Estate Overview</h3>
          <button
            onClick={() => setView('estate')}
            className="w-full flex items-center justify-between p-4 bg-white border border-stone-200 rounded-2xl hover:border-navy-muted/30 transition-colors group"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-navy-muted/5 rounded-xl flex items-center justify-center text-navy-muted">
                <TrendingUp size={18} />
              </div>
              <div className="text-left">
                <p className="text-sm font-bold text-navy-muted">Estate Value Summary</p>
                <p className="text-[11px] text-stone-500">Estimated assets, liabilities, and net estate</p>
              </div>
            </div>
            <ArrowRight size={16} className="text-stone-400 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        <AlertPreferences />

        <CheckInPreferences />

        <InactivityCheckInCard />

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Data Export</h3>
          <Card>
            <div className="space-y-3 mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-teal-50 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Download size={20} className="text-teal-600" />
                </div>
                <div>
                  <p className="text-sm font-bold text-navy-muted">Your Data, Always Yours</p>
                  <p className="text-xs text-stone-500 leading-relaxed">
                    Download a complete copy of your Survivor Packet anytime &mdash; all your information and documents in one ZIP file.
                  </p>
                </div>
              </div>
            </div>
            <DownloadPacketButton variant="settings" />
          </Card>
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Download History</h3>
          <DownloadHistoryList />
        </div>

        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-4">Packet Info</h3>
          <Card>
            <div className="space-y-3">
              <div>
                <p className="text-[10px] uppercase font-bold text-stone-400 mb-1">Packet ID</p>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono text-navy-muted truncate mr-2">{currentPacket?.id}</p>
                  <button 
                    onClick={() => navigator.clipboard.writeText(currentPacket?.id || '')}
                    className="p-1 hover:bg-stone-50 rounded"
                  >
                    <Copy size={12} className="text-stone-400" />
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </div>

        <button 
          onClick={handleSignOut}
          disabled={loading}
          className="w-full py-4 bg-stone-100 text-stone-400 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-200 transition-colors"
        >
          {loading ? <Loader2 className="animate-spin" size={18} /> : <LogOut size={18} />}
          Sign Out
        </button>
      </div>

      <EditProfileModal
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        userId={user?.id || ''}
        currentName={profile?.full_name || ''}
        email={user?.email || ''}
      />
    </div>
  );
};
