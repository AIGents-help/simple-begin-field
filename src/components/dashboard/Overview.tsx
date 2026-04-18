import React, { useEffect, useState } from 'react';
import { CheckInAlertCard } from './CheckInAlertCard';
import { 
  Users, 
  Package, 
  CreditCard, 
  Mail, 
  Share2, 
  Activity,
  ArrowUpRight,
  TrendingUp,
  Clock,
  CheckCircle2,
  AlertCircle,
  Link as LinkIcon,
  DollarSign,
  User
} from 'lucide-react';
import { KPIStatCard, DataTable, StatusPill } from './DashboardComponents';
import { adminService, affiliateService } from '../../services/adminService';
import { useAppContext } from '../../context/AppContext';
import { User as SupabaseUser } from '@supabase/supabase-js';

export const AdminOverview: React.FC = () => {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getStats().then(data => {
      setStats(data);
      setLoading(false);
    });
  }, []);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-stone-100 rounded-xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStatCard title="Total Customers" value={stats.totalCustomers} icon={Users} trend={{ value: 12, isPositive: true }} />
        <KPIStatCard title="Active Packets" value={stats.activePackets} icon={Package} description={`${stats.singlePackets} Single / ${stats.couplePackets} Couple`} />
        <KPIStatCard title="Paid Users" value={stats.paidUsers} icon={CreditCard} trend={{ value: 8, isPositive: true }} />
        <KPIStatCard title="Active Affiliates" value={stats.activeAffiliates} icon={Share2} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif italic text-stone-900">Recent Conversions</h3>
            <button className="text-xs font-medium text-stone-500 hover:text-stone-900 uppercase tracking-wider">View All</button>
          </div>
          <div className="space-y-4">
            {/* Placeholder for recent activity list */}
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center">
                    <TrendingUp className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">New Purchase - Annual Plan</p>
                    <p className="text-xs text-stone-400">2 hours ago • Referred by DAVE10</p>
                  </div>
                </div>
                <StatusPill status="Completed" type="success" />
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
            <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-4">Invite Status</h3>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-500" />
                  <span className="text-sm text-stone-600">Pending Invites</span>
                </div>
                <span className="text-sm font-semibold text-stone-900">{stats.pendingInvites}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span className="text-sm text-stone-600">Accepted Invites</span>
                </div>
                <span className="text-sm font-semibold text-stone-900">{stats.acceptedInvites}</span>
              </div>
            </div>
          </div>

          <div className="bg-stone-900 p-6 rounded-xl shadow-lg text-white">
            <h3 className="text-sm font-medium opacity-60 uppercase tracking-wider mb-4">System Health</h3>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-sm font-medium">All systems operational</span>
            </div>
            <button className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-medium transition-colors">
              View Status Page
            </button>
          </div>
        </div>
      </div>

      {/* Inactivity Check-In status */}
      <CheckInAlertCard />
    </div>
  );
};

export const ProfessionalOverview: React.FC = () => {
  const { profile } = useAppContext();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (profile?.id) {
      affiliateService.getMyStats(profile.id).then(data => {
        setStats(data);
        setLoading(false);
      });
    }
  }, [profile?.id]);

  if (loading) return <div className="animate-pulse space-y-8">
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      {[...Array(4)].map((_, i) => <div key={i} className="h-32 bg-stone-100 rounded-xl" />)}
    </div>
  </div>;

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPIStatCard title="My Referral Code" value={stats.referralCode} icon={LinkIcon} />
        <KPIStatCard title="Total Signups" value={stats.signups} icon={Users} />
        <KPIStatCard title="Total Purchases" value={stats.purchases} icon={CreditCard} />
        <KPIStatCard title="Estimated Earnings" value={`$${stats.payoutSummary}`} icon={DollarSign} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-serif italic text-stone-900">My Recent Referrals</h3>
            <button className="text-xs font-medium text-stone-500 hover:text-stone-900 uppercase tracking-wider">View All</button>
          </div>
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="flex items-center justify-between py-3 border-b border-stone-50 last:border-0">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-stone-50 flex items-center justify-center">
                    <User className="w-4 h-4 text-stone-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-stone-900">John D. (Masked)</p>
                    <p className="text-xs text-stone-400">Signed up 1 day ago</p>
                  </div>
                </div>
                <StatusPill status="Signup" type="info" />
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm">
          <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider mb-6">Quick Actions</h3>
          <div className="space-y-3">
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors group">
              <span className="text-sm font-medium text-stone-700">Copy Referral Link</span>
              <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors group">
              <span className="text-sm font-medium text-stone-700">Download QR Code</span>
              <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
            </button>
            <button className="w-full flex items-center justify-between p-3 rounded-lg border border-stone-100 hover:bg-stone-50 transition-colors group">
              <span className="text-sm font-medium text-stone-700">View Marketing Assets</span>
              <ArrowUpRight className="w-4 h-4 text-stone-400 group-hover:text-stone-900" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
