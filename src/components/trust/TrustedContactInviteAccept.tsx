import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2, ShieldCheck, AlertCircle, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { trustedContactPortalService } from '@/services/trustedContactPortalService';

/**
 * Trusted contact invite acceptance screen.
 *
 * Reached via /trusted/invite/:token (public route).
 * Flow:
 *   1. Look up the invite by token to show the owner's name.
 *   2. Trusted contact creates a password (or signs in if email already exists).
 *   3. We link the auth user to the trusted_contacts row.
 *   4. Redirect into the trusted-contact dashboard at /trusted.
 */
export const TrustedContactInviteAccept: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [invite, setInvite] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const [mode, setMode] = useState<'register' | 'signin'>('register');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setError('No invitation token provided.');
        setLoading(false);
        return;
      }
      try {
        const { data, error: fetchErr } = await trustedContactPortalService.getInviteByToken(token);
        if (fetchErr) throw fetchErr;
        if (!data) {
          setError('This invitation is invalid or has expired.');
        } else {
          setInvite(data);
          if (data.invite_accepted_at) {
            setMode('signin');
          }
        }
      } catch (err: any) {
        setError(err?.message || 'Could not load invitation.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!invite || !token) return;

    if (mode === 'register') {
      if (password.length < 8) {
        toast.error('Password must be at least 8 characters.');
        return;
      }
      if (password !== confirmPassword) {
        toast.error('Passwords do not match.');
        return;
      }
    }

    setSubmitting(true);
    try {
      let userId: string | null = null;

      if (mode === 'register') {
        const { data, error: signUpErr } = await supabase.auth.signUp({
          email: invite.contact_email,
          password,
          options: {
            data: { full_name: invite.contact_name, role: 'trusted_contact' },
            emailRedirectTo: `${window.location.origin}/trusted`,
          },
        });
        if (signUpErr) {
          // If user already exists, switch to sign-in mode
          if (/already|registered/i.test(signUpErr.message)) {
            setMode('signin');
            toast.info('Account already exists — please sign in to accept.');
            setSubmitting(false);
            return;
          }
          throw signUpErr;
        }
        userId = data.user?.id ?? null;
        // If email confirmation is required, session will be null
        if (!data.session) {
          toast.success('Check your email to confirm your account, then return to this link.');
          setSubmitting(false);
          return;
        }
      } else {
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: invite.contact_email,
          password,
        });
        if (signInErr) throw signInErr;
        userId = data.user?.id ?? null;
      }

      if (!userId) throw new Error('Could not establish your session.');

      await trustedContactPortalService.linkInviteToUser(token, userId);
      toast.success('Welcome — your trusted-contact access is set up.');
      navigate('/trusted', { replace: true });
    } catch (err: any) {
      console.error('Invite accept failed:', err);
      toast.error(err?.message || 'Could not accept invitation.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3]">
        <Loader2 className="w-8 h-8 animate-spin text-navy-muted" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3] p-6">
        <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl text-center space-y-4 border border-stone-200">
          <div className="w-16 h-16 rounded-full bg-red-50 flex items-center justify-center mx-auto">
            <AlertCircle className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted">Invitation Error</h1>
          <p className="text-sm text-stone-600">{error}</p>
          <button
            onClick={() => navigate('/')}
            className="px-5 py-2.5 rounded-lg bg-stone-100 text-stone-700 font-bold text-sm hover:bg-stone-200"
          >
            Go to Home
          </button>
        </div>
      </div>
    );
  }

  const ownerName = invite?.packets?.person_a_name || 'Someone';

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#fdfaf3] p-6">
      <div className="max-w-md w-full bg-white rounded-2xl p-8 shadow-xl space-y-6 border border-stone-200">
        <div className="text-center space-y-3">
          <div className="w-16 h-16 rounded-2xl bg-navy-muted/10 flex items-center justify-center mx-auto">
            <ShieldCheck className="w-8 h-8 text-navy-muted" />
          </div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted">
            You've Been Trusted
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed">
            <span className="font-semibold">{ownerName}</span> has added you as a trusted
            contact on The Survivor Packet. {mode === 'register'
              ? 'Create a password to access their packet when needed.'
              : 'Sign in to confirm your access.'}
          </p>
        </div>

        <div className="bg-stone-50 rounded-lg p-4 border border-stone-100">
          <div className="text-[10px] font-bold uppercase tracking-widest text-stone-500">
            Your trusted-contact email
          </div>
          <div className="text-sm font-semibold text-navy-muted mt-1">
            {invite.contact_email}
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
              {mode === 'register' ? 'Choose a password' : 'Password'}
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={mode === 'register' ? 8 : undefined}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-muted/30"
              placeholder="••••••••"
            />
          </div>

          {mode === 'register' && (
            <div>
              <label className="text-xs font-bold uppercase tracking-widest text-stone-500">
                Confirm password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1 w-full px-3 py-2.5 border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-navy-muted/30"
                placeholder="••••••••"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-3 bg-navy-muted text-white rounded-lg font-bold text-sm hover:bg-navy-muted/90 disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
            {mode === 'register' ? 'Create my access' : 'Sign in & accept'}
          </button>

          <button
            type="button"
            onClick={() => setMode(mode === 'register' ? 'signin' : 'register')}
            className="w-full text-center text-xs text-stone-500 hover:text-navy-muted underline"
          >
            {mode === 'register'
              ? 'Already have an account? Sign in.'
              : 'New here? Create a password.'}
          </button>
        </form>

        <p className="text-[10px] text-center text-stone-400 leading-relaxed">
          Your trusted-contact account is separate from any other Survivor Packet account
          you may own. You will only see what {ownerName} explicitly grants you.
        </p>
      </div>
    </div>
  );
};
