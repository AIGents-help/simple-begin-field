import React, { useEffect, useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { supabase } from '@/lib/supabase';
import { Share2, Copy, Check, TrendingUp, Users, DollarSign, AlertTriangle, Loader2, Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { BackButton } from '../components/common/BackButton';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SP-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const GUIDELINES_DISMISSED_KEY = 'sp_affiliate_guidelines_dismissed';

const AffiliateGuidelines = () => {
  const [dismissed, setDismissed] = useState(() => localStorage.getItem(GUIDELINES_DISMISSED_KEY) === 'true');
  const [expanded, setExpanded] = useState(!dismissed);

  const handleAcknowledge = () => {
    localStorage.setItem(GUIDELINES_DISMISSED_KEY, 'true');
    setDismissed(true);
    setExpanded(false);
  };

  return (
    <div className="bg-white rounded-2xl border border-stone-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded(prev => !prev)}
        className="w-full flex items-center justify-between p-5 text-left hover:bg-stone-50/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          {dismissed ? (
            <CheckCircle2 size={20} className="text-emerald-500 flex-shrink-0" />
          ) : (
            <Info size={20} className="text-navy-muted flex-shrink-0" />
          )}
          <div>
            <h3 className="text-sm font-bold text-stone-900">Affiliate Program Guidelines</h3>
            {dismissed && !expanded && (
              <p className="text-[10px] text-stone-400 mt-0.5">Tap to review program rules</p>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
      </button>

      {expanded && (
        <div className="px-5 pb-5 space-y-5 border-t border-stone-100 pt-4">
          {/* Eligibility */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-navy-muted">Eligibility</h4>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Must be an approved affiliate with an active account in good standing.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Affiliates receive a complimentary Individual plan as long as they maintain the minimum referral activity.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Minimum activity requirement: 3 active referrals per month to retain the free plan benefit.</li>
            </ul>
          </div>

          {/* Referral Rules */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-navy-muted">Referral Rules</h4>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Share your unique referral link or code with potential users.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>A referral is counted when a new user signs up using your link and creates an account.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>A conversion is counted when a referred user purchases a paid plan.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Self-referrals and duplicate accounts are not permitted and will be disqualified.</li>
            </ul>
          </div>

          {/* Commission */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-navy-muted">Commission</h4>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Commission is earned on each paid conversion attributed to your referral code.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Commission rates are set at the time of approval and displayed on your dashboard.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Payouts are processed monthly for commissions exceeding the minimum threshold.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>The Survivor Packet reserves the right to adjust commission rates with 30 days notice.</li>
            </ul>
          </div>

          {/* Code of Conduct */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-widest text-navy-muted">Code of Conduct</h4>
            <ul className="space-y-1.5 text-sm text-stone-600">
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Represent The Survivor Packet honestly and accurately in all communications.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Do not use spam, misleading advertising, or deceptive practices to generate referrals.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Do not bid on branded keywords or create ads that could be confused with official materials.</li>
              <li className="flex gap-2"><span className="text-stone-400 flex-shrink-0">&#8226;</span>Violation of these guidelines may result in immediate removal from the program and forfeiture of unpaid commissions.</li>
            </ul>
          </div>

          {!dismissed && (
            <button
              onClick={handleAcknowledge}
              className="w-full py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-navy-muted/90 transition-colors"
            >
              <CheckCircle2 size={16} />
              I understand the terms
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export const AffiliatePage = () => {
  const { user, profile } = useAppContext();
  const [referralLink, setReferralLink] = useState('');
  const [affiliate, setAffiliate] = useState<any>(null);
  const [conversions, setConversions] = useState<any[]>([]);
  const [monthlyReferrals, setMonthlyReferrals] = useState(0);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadAffiliateData();
  }, [user]);

  const loadAffiliateData = async () => {
    setLoading(true);
    try {
      const { data: referrals } = await supabase
        .from('affiliate_referrals')
        .select('*')
        .eq('owner_id', user!.id)
        .limit(1);

      if (referrals && referrals.length > 0) {
        const aff = referrals[0];
        setAffiliate(aff);

        if ((aff as any).status === 'approved') {
          setReferralLink(`${window.location.origin}?ref=${aff.affiliate_code}`);

          const { data: convData } = await supabase
            .from('affiliate_conversions')
            .select('*')
            .eq('affiliate_referral_id', aff.id)
            .order('created_at', { ascending: false });
          if (convData) setConversions(convData);

          const startOfMonth = new Date();
          startOfMonth.setDate(1);
          startOfMonth.setHours(0, 0, 0, 0);
          const { count } = await supabase
            .from('affiliate_conversions')
            .select('*', { count: 'exact', head: true })
            .eq('affiliate_referral_id', aff.id)
            .gte('created_at', startOfMonth.toISOString());
          setMonthlyReferrals(count || 0);
        }
      }
    } catch (err) {
      console.error('Failed to load affiliate data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleApply = async () => {
    if (!user) return;
    setApplying(true);
    try {
      const { error } = await supabase.from('affiliate_referrals').insert({
        affiliate_name: profile?.full_name || user.email?.split('@')[0] || 'Affiliate',
        affiliate_email: user.email || null,
        affiliate_code: generateCode(),
        owner_id: user.id,
        payout_type: 'percent',
        payout_value: 10,
        is_active: false,
        status: 'pending',
      } as any);
      if (error) throw error;
      toast.success('Application submitted! You will be notified when approved.');
      loadAffiliateData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit application');
    } finally {
      setApplying(false);
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

  // No affiliate record — show apply form
  if (!affiliate) {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-8 text-center">
        <div className="text-left"><BackButton /></div>
        <div className="w-16 h-16 bg-navy-muted/10 rounded-2xl flex items-center justify-center mx-auto">
          <Share2 size={28} className="text-navy-muted" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted mb-2">Become an Affiliate</h1>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Earn commission by referring users to The Survivor Packet. Approved affiliates get a free Individual plan.
          </p>
        </div>
        <button
          onClick={handleApply}
          disabled={applying}
          className="px-8 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm hover:bg-navy-muted/90 transition-colors disabled:opacity-50 flex items-center gap-2 mx-auto"
        >
          {applying ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : 'Apply Now'}
        </button>
      </div>
    );
  }

  // Pending status
  if ((affiliate as any).status === 'pending') {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-6 text-center">
        <div className="text-left"><BackButton /></div>
        <div className="w-16 h-16 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-amber-500" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted mb-2">Application Pending</h1>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Your affiliate application is being reviewed. You will receive access once approved by our team.
          </p>
        </div>
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-sm text-amber-700">
          Applied on {new Date(affiliate.created_at).toLocaleDateString()}
        </div>
      </div>
    );
  }

  // Rejected
  if ((affiliate as any).status === 'rejected') {
    return (
      <div className="p-6 max-w-lg mx-auto space-y-6 text-center">
        <div className="text-left"><BackButton /></div>
        <div className="w-16 h-16 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto">
          <AlertTriangle size={28} className="text-rose-500" />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted mb-2">Application Not Approved</h1>
          <p className="text-sm text-stone-500 max-w-sm mx-auto">
            Your affiliate application was not approved at this time. Please contact support for more info.
          </p>
        </div>
      </div>
    );
  }

  // Approved — full dashboard
  const isAffiliate = profile?.role === 'affiliate' || profile?.role === 'admin';
  const totalReferrals = conversions.length;
  const MIN_MONTHLY_REFERRALS = 3;

  return (
    <div className="p-6 max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-navy-muted rounded-xl flex items-center justify-center text-white">
          <Share2 size={20} />
        </div>
        <div>
          <h1 className="text-2xl font-serif font-bold text-navy-muted">Affiliate Dashboard</h1>
          <p className="text-xs text-stone-400 font-medium">Your referral performance</p>
        </div>
      </div>

      {/* Guidelines — shown to approved affiliates and admins */}
      {isAffiliate && <AffiliateGuidelines />}

      {/* Referral Link */}
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
        <p className="text-xs text-stone-400">
          Code: <code className="bg-stone-100 px-2 py-0.5 rounded font-mono">{affiliate.affiliate_code}</code>
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <TrendingUp size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">This Month</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">{monthlyReferrals}</div>
        </div>
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <Users size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">All Time</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">{totalReferrals}</div>
        </div>
        <div className="p-4 bg-white border border-stone-100 rounded-2xl">
          <div className="flex items-center gap-2 text-stone-400 mb-1">
            <DollarSign size={14} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Earned</span>
          </div>
          <div className="text-2xl font-serif font-bold text-navy-muted">$0</div>
        </div>
      </div>

      {/* Minimum Activity Rule */}
      <div className={`p-4 rounded-2xl border ${monthlyReferrals >= MIN_MONTHLY_REFERRALS ? 'bg-emerald-50 border-emerald-200' : 'bg-amber-50 border-amber-200'}`}>
        <div className="flex items-start gap-3">
          <AlertTriangle size={18} className={monthlyReferrals >= MIN_MONTHLY_REFERRALS ? 'text-emerald-600 mt-0.5' : 'text-amber-600 mt-0.5'} />
          <div>
            <p className={`text-sm font-bold ${monthlyReferrals >= MIN_MONTHLY_REFERRALS ? 'text-emerald-800' : 'text-amber-800'}`}>
              Minimum Activity: {monthlyReferrals}/{MIN_MONTHLY_REFERRALS} referrals this month
            </p>
            <p className={`text-xs mt-1 ${monthlyReferrals >= MIN_MONTHLY_REFERRALS ? 'text-emerald-600' : 'text-amber-600'}`}>
              {monthlyReferrals >= MIN_MONTHLY_REFERRALS
                ? 'You are on track! Your free Individual plan is secure.'
                : `You need ${MIN_MONTHLY_REFERRALS - monthlyReferrals} more active referral${MIN_MONTHLY_REFERRALS - monthlyReferrals === 1 ? '' : 's'} this month to keep your free Individual plan.`}
            </p>
          </div>
        </div>
      </div>

      {/* Conversions */}
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
                  <p className="text-xs text-stone-400">{new Date(c.created_at).toLocaleDateString()}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                  c.conversion_status === 'purchase' ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
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
