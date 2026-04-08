import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { 
  Users, 
  CheckCircle2, 
  Shield, 
  Lock, 
  ArrowRight, 
  RefreshCw, 
  AlertCircle,
  Mail,
  Home
} from 'lucide-react';
import { inviteService } from '../../services/inviteService';
import { authService } from '../../services/authService';
import { useAppContext } from '../../context/AppContext';

interface InviteAcceptanceScreenProps {
  token: string;
  onSuccess: (packetId: string) => void;
}

export const InviteAcceptanceScreen: React.FC<InviteAcceptanceScreenProps> = ({ token, onSuccess }) => {
  const { user, refreshPacketData } = useAppContext();
  const [invite, setInvite] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [accepting, setAccepting] = useState(false);

  useEffect(() => {
    const fetchInvite = async () => {
      setLoading(true);
      const { data, error: fetchError } = await inviteService.getInviteByToken(token);
      if (fetchError || !data) {
        setError(fetchError?.message || 'Invalid or expired invitation link.');
      } else {
        setInvite(data);
      }
      setLoading(false);
    };
    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!user) {
      // If not logged in, we should prompt login/signup
      // For now, we'll just show an error, but in a real app, 
      // the parent component would handle the auth redirect.
      setError('Please sign in or create an account to accept this invitation.');
      return;
    }

    setAccepting(true);
    const { success, error: acceptError, packetId } = await inviteService.acceptInvite(token, user.id);
    
    if (acceptError) {
      setError(acceptError.message);
      setAccepting(false);
    } else if (packetId) {
      await refreshPacketData();
      onSuccess(packetId);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl text-center space-y-6">
          <div className="w-16 h-16 bg-red-50 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Invitation Error</h1>
          <p className="text-gray-500 leading-relaxed">{error}</p>
          <button 
            onClick={() => window.location.href = '/'}
            className="w-full py-4 bg-gray-100 text-gray-900 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-gray-200 transition-colors"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full bg-white rounded-3xl p-8 shadow-xl space-y-8"
      >
        {/* Logo & Header */}
        <div className="text-center space-y-4">
          <div className="w-20 h-20 bg-primary/10 rounded-3xl flex items-center justify-center mx-auto rotate-3">
            <Users className="w-10 h-10 text-primary" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-bold text-gray-900">Join Household Packet</h1>
            <p className="text-gray-500">
              <span className="font-semibold text-primary">{invite?.packets?.person_a_name || 'Someone'}</span> has invited you to join their shared Survivor Packet.
            </p>
          </div>
        </div>

        {/* Benefits/What to expect */}
        <div className="space-y-4 bg-gray-50 p-6 rounded-2xl border border-gray-100">
          <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest">What you'll access</h2>
          <div className="space-y-4">
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Access shared household information and documents.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center shrink-0">
                <Shield className="w-4 h-4 text-blue-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Add your own individual information to the packet.
              </p>
            </div>
            <div className="flex gap-3">
              <div className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                <Lock className="w-4 h-4 text-amber-600" />
              </div>
              <p className="text-sm text-gray-600 leading-relaxed">
                Keep sensitive items private with restricted visibility.
              </p>
            </div>
          </div>
        </div>

        {/* Action */}
        <div className="space-y-4">
          {!user ? (
            <div className="space-y-4">
              <p className="text-xs text-center text-gray-400">
                You need an account to join this packet.
              </p>
              <button 
                onClick={() => window.location.href = '/login'}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all"
              >
                Sign in to Accept
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-gray-400">Accepting as</p>
                  <p className="text-sm font-semibold text-gray-900">{user.email}</p>
                </div>
              </div>
              <button 
                onClick={handleAccept}
                disabled={accepting}
                className="w-full py-4 bg-primary text-white rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
              >
                {accepting ? 'Joining Packet...' : 'Accept Invitation'}
                <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => window.location.href = '/'}
                className="w-full py-4 bg-white text-gray-500 rounded-2xl font-bold hover:bg-gray-50 transition-colors"
              >
                Decline
              </button>
            </div>
          )}
        </div>

        <p className="text-[10px] text-center text-gray-400 leading-relaxed">
          By accepting, you agree to share your information with the packet owner. 
          The Survivor Packet uses end-to-end encryption for sensitive fields.
        </p>
      </motion.div>
    </div>
  );
};
