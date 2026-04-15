import React, { useEffect, useState } from 'react';
import { Copy, Download, Users, DollarSign, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';
import { KPIStatCard } from './DashboardComponents';

const SECTION_TABLES = [
  'info_records', 'family_members', 'medical_records', 'banking_records',
  'real_estate_records', 'retirement_records', 'vehicle_records', 'advisor_records',
  'password_records', 'personal_property_records', 'pet_records', 'funeral_records',
  'private_items', 'trusted_contacts', 'documents',
] as const;

function anonymizeEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  const visible = local.slice(0, 3);
  return `${visible}***@${domain}`;
}

interface ClientRow {
  anonymizedEmail: string;
  plan: string;
  status: string;
  joinedDate: string;
  completionPct: number;
  packetId: string | null;
}

export const AttorneyPortal: React.FC = () => {
  const { profile } = useAppContext();
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [clients, setClients] = useState<ClientRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!profile?.id) return;
    loadData();
  }, [profile?.id]);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Get this user's affiliate referral code
      const { data: affData } = await supabase
        .from('affiliate_referrals')
        .select('affiliate_code')
        .eq('owner_id', profile!.id)
        .limit(1)
        .maybeSingle();

      if (!affData) {
        setLoading(false);
        return;
      }

      setReferralCode(affData.affiliate_code);

      // 2. Get purchases that used this code
      const { data: purchases } = await supabase
        .from('purchases')
        .select('*, profiles:user_id(email, full_name)')
        .eq('affiliate_code_used', affData.affiliate_code);

      if (!purchases || purchases.length === 0) {
        setClients([]);
        setLoading(false);
        return;
      }

      // 3. For each client, compute completion %
      const clientRows: ClientRow[] = await Promise.all(
        purchases.map(async (p: any) => {
          const email = p.profiles?.email || 'unknown';
          const packetId = p.packet_id;
          let completionPct = 0;

          if (packetId) {
            const counts = await Promise.all(
              SECTION_TABLES.map(async (table) => {
                const { count } = await supabase
                  .from(table)
                  .select('id', { count: 'exact', head: true })
                  .eq('packet_id', packetId);
                return (count || 0) > 0 ? 1 : 0;
              })
            );
            completionPct = Math.round((counts.reduce((a, b) => a + b, 0) / 15) * 100);
          }

          return {
            anonymizedEmail: anonymizeEmail(email),
            plan: p.billing_type || 'N/A',
            status: p.status === 'active' || p.status === 'one_time_paid' ? 'Active' : 'Inactive',
            joinedDate: p.created_at
              ? new Date(p.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
              : 'N/A',
            completionPct,
            packetId,
          };
        })
      );

      setClients(clientRows);
    } catch (err) {
      console.error('Attorney portal load error:', err);
      toast.error('Failed to load portal data', { position: 'bottom-center' });
    } finally {
      setLoading(false);
    }
  };

  const totalReferred = clients.length;
  const activeSubscribers = clients.filter(c => c.status === 'Active').length;
  const monthlyEarnings = activeSubscribers * 10 * 0.2; // 20% of $10/mo

  const handleCopyLink = () => {
    const link = `${window.location.origin}/signup?ref=${referralCode}`;
    navigator.clipboard.writeText(link);
    toast.success('Referral link copied!', { position: 'bottom-center' });
  };

  const handleDownloadCSV = () => {
    const header = 'anonymized_email,plan,status,joined_date,completion_pct';
    const rows = clients.map(c =>
      `"${c.anonymizedEmail}","${c.plan}","${c.status}","${c.joinedDate}",${c.completionPct}`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Report downloaded', { position: 'bottom-center' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-stone-400" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Section 1 — Header */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm p-6 md:p-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-serif italic text-stone-900">Attorney Portal</h1>
            <p className="text-sm text-stone-500">Track your referred clients and their progress</p>
          </div>
          <button
            onClick={handleDownloadCSV}
            disabled={clients.length === 0}
            className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-40"
          >
            <Download className="w-4 h-4" />
            Download Client Report
          </button>
        </div>

        {referralCode && (
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Referral Code</label>
              <div className="flex items-center gap-2">
                <code className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-lg text-sm font-mono text-stone-900">
                  {referralCode}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(referralCode); toast.success('Code copied!', { position: 'bottom-center' }); }} className="p-2.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-50">
                  <Copy className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>
            <div className="flex-1">
              <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block mb-1">Referral Link</label>
              <div className="flex items-center gap-2">
                <input readOnly value={`${window.location.origin}/signup?ref=${referralCode}`} className="flex-1 px-4 py-2.5 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-600" />
                <button onClick={handleCopyLink} className="p-2.5 bg-white border border-stone-200 rounded-lg hover:bg-stone-50">
                  <Copy className="w-4 h-4 text-stone-400" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 2 — Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIStatCard title="Total Referred Clients" value={totalReferred} icon={Users} />
        <KPIStatCard title="Active Subscribers" value={activeSubscribers} icon={TrendingUp} />
        <KPIStatCard title="Est. Monthly Earnings" value={`$${monthlyEarnings.toFixed(2)}`} icon={DollarSign} />
      </div>

      {/* Section 3 — Client List */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <div className="px-6 py-4 border-b border-stone-100">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wider">Referred Clients</h2>
        </div>

        {clients.length === 0 ? (
          <div className="py-16 text-center">
            <Users className="w-10 h-10 text-stone-200 mx-auto mb-3" />
            <p className="text-sm text-stone-400">No referred clients yet. Share your referral link to get started.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-stone-100 text-left">
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Client</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Plan</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Status</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Member Since</th>
                  <th className="px-6 py-3 text-[10px] font-bold uppercase tracking-widest text-stone-400">Completion</th>
                </tr>
              </thead>
              <tbody>
                {clients.map((client, i) => (
                  <tr key={i} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                    <td className="px-6 py-3 font-mono text-stone-700">{client.anonymizedEmail}</td>
                    <td className="px-6 py-3 text-stone-600 capitalize">{client.plan}</td>
                    <td className="px-6 py-3">
                      <span className={`inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'Active'
                          ? 'bg-emerald-50 text-emerald-700'
                          : 'bg-stone-100 text-stone-500'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-stone-500">{client.joinedDate}</td>
                    <td className="px-6 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 bg-stone-100 rounded-full overflow-hidden max-w-[100px]">
                          <div
                            className={`h-full rounded-full transition-all ${
                              client.completionPct >= 67 ? 'bg-emerald-500'
                              : client.completionPct >= 34 ? 'bg-amber-500'
                              : 'bg-rose-400'
                            }`}
                            style={{ width: `${client.completionPct}%` }}
                          />
                        </div>
                        <span className="text-xs font-medium text-stone-600 w-8">{client.completionPct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
