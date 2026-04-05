import React, { useEffect, useState } from 'react';
import { 
  Copy, 
  ExternalLink, 
  Users, 
  TrendingUp, 
  Activity,
  DollarSign,
  User,
  Link as LinkIcon,
  QrCode
} from 'lucide-react';
import { DataTable, StatusPill, KPIStatCard } from './DashboardComponents';
import { affiliateService } from '../../services/adminService';
import { useAppContext } from '../../context/AppContext';

export const MyReferrals: React.FC = () => {
  const { profile } = useAppContext();
  const [referrals, setReferrals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      affiliateService.getMyConversions(profile.id).then(data => {
        setReferrals(data);
        setLoading(false);
      });
    }
  }, [profile?.id]);

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'full_name',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-xs">
            {row.profiles?.full_name?.charAt(0) || 'U'}
          </div>
          <span className="font-medium text-stone-900">{row.profiles?.full_name || 'Anonymous User'}</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'conversion_status',
      cell: (row: any) => {
        const typeMap: Record<string, any> = {
          lead: 'info',
          signup: 'warning',
          purchase: 'success',
          paid_out: 'success',
        };
        return <StatusPill status={row.conversion_status} type={typeMap[row.conversion_status] || 'info'} />;
      }
    },
    {
      header: 'Plan',
      accessorKey: 'plan',
      cell: (row: any) => (
        <span className="text-xs text-stone-600">
          {row.purchases?.pricing_plans?.name || 'N/A'}
        </span>
      )
    },
    {
      header: 'Created',
      accessorKey: 'created_at',
      cell: (row: any) => (
        <span className="text-xs text-stone-400">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900">My Referrals</h3>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            Export Referrals
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={referrals} isLoading={loading} />
      </div>
    </div>
  );
};

export const MyLinks: React.FC = () => {
  const { profile } = useAppContext();
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    if (profile?.id) {
      affiliateService.getMyStats(profile.id).then(setStats);
    }
  }, [profile?.id]);

  const referralLink = `${window.location.origin}/signup?ref=${stats?.referralCode}`;

  return (
    <div className="max-w-2xl space-y-8">
      <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm">
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 bg-stone-900 rounded-xl flex items-center justify-center">
            <LinkIcon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-xl font-serif italic text-stone-900">Your Referral Link</h3>
            <p className="text-sm text-stone-400">Share this link to track your referrals and earn rewards.</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Referral Code</label>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-4 py-3 bg-stone-50 border border-stone-100 rounded-lg text-lg font-mono text-stone-900">
                {stats?.referralCode || '...'}
              </code>
              <button 
                onClick={() => navigator.clipboard.writeText(stats?.referralCode)}
                className="p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <Copy className="w-5 h-5 text-stone-400" />
              </button>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-stone-500 uppercase tracking-wider">Full Referral Link</label>
            <div className="flex items-center gap-2">
              <input
                readOnly
                value={referralLink}
                className="flex-1 px-4 py-3 bg-stone-50 border border-stone-100 rounded-lg text-sm text-stone-600 focus:outline-none"
              />
              <button 
                onClick={() => navigator.clipboard.writeText(referralLink)}
                className="p-3 bg-white border border-stone-200 rounded-lg hover:bg-stone-50 transition-colors"
              >
                <Copy className="w-5 h-5 text-stone-400" />
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm flex flex-col items-center text-center">
          <div className="w-32 h-32 bg-stone-50 rounded-lg border border-stone-100 flex items-center justify-center mb-4">
            <QrCode className="w-16 h-16 text-stone-200" />
          </div>
          <h4 className="font-medium text-stone-900 mb-1">Download QR Code</h4>
          <p className="text-xs text-stone-400 mb-4">Perfect for business cards or printed materials.</p>
          <button className="w-full py-2 bg-stone-900 text-white rounded-lg text-xs font-medium hover:bg-stone-800 transition-colors">
            Download PNG
          </button>
        </div>

        <div className="bg-stone-900 p-6 rounded-xl shadow-lg text-white">
          <h4 className="font-serif italic text-lg mb-2">Marketing Assets</h4>
          <p className="text-xs opacity-60 mb-6">Access our library of logos, banners, and social media templates.</p>
          <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors flex items-center justify-center gap-2">
            <ExternalLink className="w-3 h-3" />
            Open Asset Drive
          </button>
        </div>
      </div>
    </div>
  );
};

export const MyPayouts: React.FC = () => {
  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <KPIStatCard title="Total Earned" value="$0.00" icon={DollarSign} />
        <KPIStatCard title="Pending Payout" value="$0.00" icon={Activity} />
        <KPIStatCard title="Last Payout" value="N/A" icon={TrendingUp} />
      </div>

      <div className="bg-white p-8 rounded-xl border border-stone-200 shadow-sm text-center py-16">
        <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <DollarSign className="w-8 h-8 text-stone-300" />
        </div>
        <h3 className="text-xl font-serif italic text-stone-900 mb-2">No Payout History</h3>
        <p className="text-sm text-stone-400 max-w-sm mx-auto">
          Once your referrals convert to paid customers, your earnings will appear here.
        </p>
      </div>
    </div>
  );
};
