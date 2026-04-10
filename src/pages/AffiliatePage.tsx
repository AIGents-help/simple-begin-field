import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '@/lib/supabase';
import { Share2, Copy, Check, TrendingUp, Users, DollarSign } from 'lucide-react';
import { toast } from 'sonner';

interface AffiliateStats {
  total_referrals: number;
  total_conversions: number;
  total_earned: number;
}

interface Conversion {
  id: string;
  code_used: string;
  conversion_status: string;
  created_at: string;
  referred_user_id: string;
}

export const AffiliatePage = () => {
  const { user } = useAppContext();
  const [referralLink, setReferralLink] = useState('');
  const [stats, setStats] = useState<AffiliateStats | null>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      // Get referral code from affiliate_referrals
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('owner_id', user!.id)
        .eq('is_active', true)
        .limit(1);

      if (referrals && referrals.length > 0) {
        const code = referrals[0].affiliate_code;
        setReferralLink(`${window.location.origin}?ref=${code}`);
      }

      // Get stats via RPC
      const { data: statsData } = await supabase.rpc('get_affiliate_stats' as any);
      if (statsData) {
        setStats(Array.isArray(statsData) ? statsData[0] : statsData);
      }

      // Get conversions
      const { data: convData } = await supabase
        .from('affiliate_conversions')
        .select('*')
        .order('created_at', { ascending: false });

      if (convData) setConversions(convData);
    } catch (err) {
      console.error('Failed to load affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = async () => {
    if (!referralLink) return;
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    toast.success('Referral link copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-[300px]">
        <div className="w-8 h-8 border-4 border-navy-muted border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-navy-muted rounded-xl flex items-center justify-center text-white">
            <Share2 size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-serif font-bold text-navy-muted">Affiliate Program</h1>
            <p className="text-xs text-stone-400 font-medium">Share & earn with your referral link</p>
          </div>
        </div>
      </div>

      {/* Referral Link */}
      {referralLink ? (
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm space-y-3">
          <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Your Referral Link</p>
          <div className="flex items-center gap-2">
            <input
              readOnly
              value={referralLink}
              className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm text-navy-muted font-medium truncate"
            />
            <button
              onClick={handleCopy}
              className="p-3 bg-navy-muted text-white rounded-xl hover:bg-navy-muted/90 transition-colors flex-shrink-0"
            >
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
        </div>
      ) : (
        <div className="bg-white p-5 rounded-2xl border border-stone-100 shadow-sm text-center">
          <p className="text-stone-500 text-sm">No active referral code found. Contact support to get set up.</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Referrals</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">
            {stats?.total_referrals ?? 0}
          </div>
        </div>
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Conversions</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">
            {stats?.total_conversions ?? 0}
          </div>
        </div>
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Earned</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">
            ${stats?.total_earned ?? 0}
          </div>
        </div>
      </div>

      {/* Conversions List */}
      <div className="space-y-3">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400">Recent Conversions</p>
        {conversions.length === 0 ? (
          <div className="bg-white p-6 rounded-2xl border border-stone-100 text-center">
            <p className="text-stone-400 text-sm italic">No conversions yet. Share your link to get started!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {conversions.map((c) => (
              <div key={c.id} className="bg-white p-4 rounded-2xl border border-stone-100 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-navy-muted">Code: {c.code_used}</p>
                  <p className="text-xs text-stone-400">
                    {new Date(c.created_at).toLocaleDateString()}
                  </p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.conversion_status === 'completed' 
                    ? 'bg-emerald-50 text-emerald-600' 
                    : 'bg-amber-50 text-amber-600'
                }`}>
                  {c.conversion_status || 'pending'}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
