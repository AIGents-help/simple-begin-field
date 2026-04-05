import React, { useState, useEffect } from 'react';
import { Gift, Check, Loader2 } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export const AffiliateSection = () => {
  const { user, profile } = useAppContext();
  const [code, setCode] = useState('');
  const [savedCode, setSavedCode] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validating, setValidating] = useState(false);

  useEffect(() => {
    if (profile?.affiliate_id) {
      // Look up the code from the referral
      supabase
        .from('affiliate_referrals')
        .select('affiliate_code')
        .eq('id', profile.affiliate_id)
        .single()
        .then(({ data }) => {
          if (data?.affiliate_code) {
            setSavedCode(data.affiliate_code);
            setCode(data.affiliate_code);
          }
        });
    }
  }, [profile?.affiliate_id]);

  const handleSave = async () => {
    if (!code.trim() || !user?.id) return;

    setSaving(true);
    setValidating(true);

    try {
      // Validate the code exists and is active
      const { data: referral, error: lookupError } = await supabase
        .from('affiliate_referrals')
        .select('id, affiliate_code')
        .eq('affiliate_code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      // Also check the new referral_codes table
      const { data: refCode } = await supabase
        .from('referral_codes' as any)
        .select('id, code')
        .eq('code', code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      setValidating(false);

      if (!referral && !refCode) {
        toast.error('Invalid referral code. Please check and try again.');
        setSaving(false);
        return;
      }

      const affiliateId = referral?.id || null;

      const { error } = await supabase
        .from('profiles')
        .update({ affiliate_id: affiliateId })
        .eq('id', user.id);

      if (error) throw error;

      setSavedCode(code.trim().toUpperCase());
      toast.success('Referral code saved successfully');
    } catch (err) {
      toast.error('Failed to save referral code');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="px-1 py-4">
      <div className="bg-white rounded-2xl border border-stone-100 p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Gift className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">Referral Code</h3>
            <p className="text-xs text-stone-400">
              {savedCode ? 'Your referral code is saved.' : 'Enter a code if you were referred by someone.'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="e.g. SMITH2025"
            disabled={!!savedCode}
            className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-sm font-mono text-stone-900 placeholder:text-stone-300 focus:outline-none focus:ring-2 focus:ring-emerald-200 focus:border-emerald-300 disabled:opacity-60 disabled:cursor-not-allowed"
          />
          {!savedCode ? (
            <button
              onClick={handleSave}
              disabled={!code.trim() || saving}
              className="px-4 py-2.5 bg-stone-900 text-white rounded-xl text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              Save
            </button>
          ) : (
            <div className="px-3 py-2.5 bg-emerald-50 rounded-xl flex items-center gap-1.5">
              <Check className="w-4 h-4 text-emerald-600" />
              <span className="text-xs font-medium text-emerald-700">Saved</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
