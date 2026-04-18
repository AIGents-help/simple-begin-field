import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Heart, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { coupleService } from '../../services/coupleService';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';

export const CoupleInviteAccept: React.FC = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const { user, loading: appLoading } = useAppContext();
  const [status, setStatus] = useState<'idle' | 'accepting' | 'done' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);

  // Stash the token so a sign-up flow can pick it up after auth
  useEffect(() => {
    if (token) sessionStorage.setItem('pendingCoupleInviteToken', token);
  }, [token]);

  const handleAccept = async () => {
    if (!token) return;
    setStatus('accepting');
    setError(null);
    try {
      await coupleService.acceptInvite(token);
      sessionStorage.removeItem('pendingCoupleInviteToken');
      setStatus('done');
      setTimeout(() => navigate('/'), 1500);
    } catch (err: any) {
      setError(err?.message || 'Could not accept invitation.');
      setStatus('error');
    }
  };

  if (appLoading) {
    return (
      <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center">
        <Loader2 className="animate-spin text-navy-muted" size={28} />
      </div>
    );
  }

  // Not signed in → drop into the onboarding/sign-up flow. After they finish,
  // the AppShell mounts and they can return to /couple/invite/:token to accept.
  if (!user) {
    return <OnboardingFlow />;
  }

  return (
    <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center p-6">
      <div className="w-full max-w-md paper-sheet p-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
          <Heart size={28} />
        </div>
        <h1 className="text-2xl font-serif font-bold text-navy-muted">
          You&rsquo;ve been invited to collaborate
        </h1>
        <p className="text-sm text-stone-500 mt-2 leading-relaxed">
          Your partner wants to share parts of their Survivor Packet with you. Your information stays private
          unless you choose to share it back.
        </p>

        {status === 'done' ? (
          <div className="mt-6 flex flex-col items-center gap-2 text-emerald-700">
            <CheckCircle2 size={28} />
            <p className="text-sm font-bold">Linked! Taking you to your packet...</p>
          </div>
        ) : (
          <>
            <button
              onClick={handleAccept}
              disabled={status === 'accepting'}
              className="mt-6 w-full py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {status === 'accepting' ? (
                <><Loader2 size={16} className="animate-spin" /> Accepting...</>
              ) : (
                'Accept Invitation'
              )}
            </button>
            <button
              onClick={() => navigate('/')}
              className="mt-2 w-full py-2 text-xs font-bold text-stone-500 hover:text-navy-muted"
            >
              Not now
            </button>
            {error ? (
              <div className="mt-4 flex items-start gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-left">
                <AlertCircle size={14} className="text-rose-600 mt-0.5 shrink-0" />
                <p className="text-[11px] text-rose-700">{error}</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );
};
