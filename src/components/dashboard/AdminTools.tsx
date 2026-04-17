import React, { useState } from 'react';
import { KeyRound, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

export const AdminTools: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast.error('Email and password are required');
      return;
    }
    if (password.length < 8) {
      toast.error('Password must be at least 8 characters');
      return;
    }
    if (password !== confirm) {
      toast.error('Passwords do not match');
      return;
    }
    if (!confirm) return;

    if (
      !window.confirm(
        `Set a new password for ${email.trim()}? They will be able to log in immediately with this password.`,
      )
    ) {
      return;
    }

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke(
        'admin-reset-password',
        { body: { email: email.trim(), newPassword: password } },
      );

      if (error) {
        console.error('[AdminTools] reset password error', error);
        toast.error(error.message || 'Failed to reset password');
        return;
      }
      if (data?.error) {
        console.error('[AdminTools] reset password api error', data.error);
        toast.error(data.error);
        return;
      }

      toast.success(`Password updated for ${data?.email || email.trim()}`);
      setPassword('');
      setConfirm('');
    } catch (err: any) {
      console.error('[AdminTools] unexpected error', err);
      toast.error(err?.message || 'Unexpected error resetting password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h3 className="text-lg font-serif italic text-stone-900">Admin Tools</h3>
        <p className="text-sm text-stone-500 mt-1">
          Sensitive operations restricted to admin accounts.
        </p>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-1">
          <div className="w-9 h-9 rounded-lg bg-stone-100 flex items-center justify-center">
            <KeyRound className="w-4 h-4 text-stone-700" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-stone-900">
              Reset User Password
            </h4>
            <p className="text-xs text-stone-500">
              Force-set a new password for any user by email.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-stone-600 mb-1">
              User email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
              className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
              disabled={loading}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                New password
              </label>
              <input
                type="text"
                required
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Min 8 characters"
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                disabled={loading}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-stone-600 mb-1">
                Confirm password
              </label>
              <input
                type="text"
                required
                minLength={8}
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="Re-enter password"
                className="w-full px-3 py-2 bg-white border border-stone-200 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-stone-900/10 transition-all"
                disabled={loading}
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-2">
            <p className="text-[11px] text-stone-400">
              The user can log in immediately with this password. Share it
              securely.
            </p>
            <button
              type="submit"
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <KeyRound className="w-4 h-4" />
                  Set Password
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
