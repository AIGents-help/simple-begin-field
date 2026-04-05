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
  QrCode,
  Plus,
  Loader2,
  Check
} from 'lucide-react';
import { DataTable, StatusPill, KPIStatCard } from './DashboardComponents';
import { affiliateService } from '../../services/adminService';
import { referralCodeService } from '../../services/referralCodeService';
import { useAppContext } from '../../context/AppContext';
import { toast } from 'sonner';

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
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={referrals} isLoading={loading} />
      </div>
    </div>
  );
};

export const MyLinks: React.FC = () => {
  const { user, profile } = useAppContext();
  const [codes, setCodes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const loadCodes = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const data = await referralCodeService.getMyCodes(user.id);
      setCodes(data);
    } catch (err) {
      console.error('Failed to load codes', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCodes();
  }, [user?.id]);

  const handleGenerate = async () => {
    if (!user?.id || !profile) return;
    setGenerating(true);
    try {
      await referralCodeService.generateCode(
        user.id,
        profile.full_name || 'Professional',
        profile.email || ''
      );
      toast.success('Referral code generated');
      await loadCodes();
    } catch (err: any) {
      if (err?.code === '23505') {
        toast.error('Code collision — please try again');
      } else {
        toast.error('Failed to generate code');
      }
    } finally {
      setGenerating(false);
    }
  };

  const handleCopy = (code: string, id: string) => {
    const link = `${window.location.origin}?ref=${code}`;
    navigator.clipboard.writeText(link);
    setCopiedId(id);
    toast.success('Referral link copied');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="max-w-3xl space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-serif italic text-stone-900">My Referral Codes</h3>
          <p className="text-sm text-stone-400 mt-1">Generate and manage your unique referral codes.</p>
        </div>
        <button
          onClick={handleGenerate}
          disabled={generating}
          className="px-4 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          Generate Code
        </button>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map(i => <div key={i} className="h-20 bg-stone-100 rounded-xl animate-pulse" />)}
        </div>
      ) : codes.length === 0 ? (
        <div className="bg-white p-12 rounded-xl border border-stone-200 shadow-sm text-center">
          <div className="w-14 h-14 bg-stone-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <LinkIcon className="w-7 h-7 text-stone-300" />
          </div>
          <h4 className="text-lg font-serif italic text-stone-900 mb-2">No Codes Yet</h4>
          <p className="text-sm text-stone-400 max-w-sm mx-auto mb-6">
            Generate your first referral code to start tracking signups.
          </p>
          <button
            onClick={handleGenerate}
            disabled={generating}
            className="px-5 py-2.5 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors disabled:opacity-50"
          >
            Generate Code
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {codes.map((rc: any) => (
            <div key={rc.id} className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-stone-900 rounded-lg flex items-center justify-center">
                  <LinkIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <code className="text-lg font-mono font-semibold text-stone-900">{rc.code}</code>
                  <p className="text-xs text-stone-400 mt-0.5">
                    Created {new Date(rc.created_at).toLocaleDateString()} · {rc.is_active ? 'Active' : 'Inactive'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleCopy(rc.code, rc.id)}
                className="p-2.5 bg-stone-50 border border-stone-200 rounded-lg hover:bg-stone-100 transition-colors"
              >
                {copiedId === rc.id ? (
                  <Check className="w-4 h-4 text-emerald-600" />
                ) : (
                  <Copy className="w-4 h-4 text-stone-500" />
                )}
              </button>
            </div>
          ))}
        </div>
      )}
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
