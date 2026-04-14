import React, { useEffect, useState } from 'react';
import { 
  MoreVertical, 
  Share2, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  Loader2,
  X
} from 'lucide-react';
import { DataTable, StatusPill } from './DashboardComponents';
import { adminService } from '../../services/adminService';
import { AffiliateDetail } from './AdminDetailScreens';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const generateCode = () => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = 'SP-';
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const NewAffiliateModal = ({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [payoutValue, setPayoutValue] = useState('10');
  const [code, setCode] = useState(generateCode());
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) { toast.error('Name is required'); return; }
    setSaving(true);
    try {
      const { error } = await supabase.from('affiliate_referrals').insert({
        affiliate_name: name.trim(),
        affiliate_email: email.trim() || null,
        affiliate_code: code,
        payout_type: 'percent',
        payout_value: parseFloat(payoutValue) || 10,
        is_active: true,
        status: 'approved',
      } as any);
      if (error) throw error;
      toast.success('Affiliate created successfully');
      onCreated();
      onClose();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create affiliate');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md mx-4 p-6 space-y-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-serif font-bold text-stone-900">New Affiliate</h3>
          <button onClick={onClose} className="p-1 hover:bg-stone-100 rounded-lg"><X className="w-5 h-5 text-stone-400" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Name *</label>
            <input type="text" value={name} onChange={e => setName(e.target.value)} required
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" placeholder="Affiliate name" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Email</label>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" placeholder="affiliate@email.com" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Commission Rate (%)</label>
            <input type="number" min="0" max="100" step="0.5" value={payoutValue} onChange={e => setPayoutValue(e.target.value)}
              className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-stone-400 outline-none text-sm" />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-bold uppercase tracking-widest text-stone-500">Referral Code</label>
            <div className="flex gap-2">
              <code className="flex-1 p-3 bg-stone-50 rounded-xl border border-stone-200 text-sm font-mono">{code}</code>
              <button type="button" onClick={() => setCode(generateCode())}
                className="px-3 py-2 bg-stone-100 hover:bg-stone-200 rounded-xl text-xs font-medium text-stone-600 transition-colors">
                Generate
              </button>
            </div>
          </div>
          <button type="submit" disabled={saving}
            className="w-full py-3 bg-stone-900 text-white rounded-xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-stone-800 transition-colors disabled:opacity-50">
            {saving ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating...</> : 'Create Affiliate'}
          </button>
        </form>
      </div>
    </div>
  );
};

export const AdminAffiliates: React.FC = () => {
  const [affiliates, setAffiliates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAffiliate, setSelectedAffiliate] = useState<any | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const loadAffiliates = () => {
    setLoading(true);
    adminService.getAffiliates().then(data => {
      setAffiliates(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    loadAffiliates();
  }, []);

  const handleApprove = async (affiliate: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(affiliate.id);
    try {
      // Approve the affiliate
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ status: 'approved', is_active: true } as any)
        .eq('id', affiliate.id);
      if (error) throw error;

      // If the affiliate has an owner_id, grant them individual plan access
      if (affiliate.owner_id) {
        // Find the individual_monthly plan
        const { data: plans } = await supabase
          .from('pricing_plans')
          .select('id')
          .eq('plan_key', 'individual_monthly')
          .eq('is_active', true)
          .limit(1);

        if (plans && plans.length > 0) {
          // Insert a purchase record for free individual access
          await supabase.from('purchases').insert({
            user_id: affiliate.owner_id,
            pricing_plan_id: plans[0].id,
            status: 'active',
            billing_type: 'affiliate_comp',
          } as any);
        }
      }

      toast.success(`${affiliate.affiliate_name} approved`);
      loadAffiliates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to approve');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (affiliate: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setActionLoading(affiliate.id);
    try {
      const { error } = await supabase
        .from('affiliate_referrals')
        .update({ status: 'rejected', is_active: false } as any)
        .eq('id', affiliate.id);
      if (error) throw error;
      toast.success(`${affiliate.affiliate_name} rejected`);
      loadAffiliates();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject');
    } finally {
      setActionLoading(null);
    }
  };

  if (selectedAffiliate) {
    return <AffiliateDetail affiliate={selectedAffiliate} onClose={() => setSelectedAffiliate(null)} />;
  }

  // Separate pending from rest
  const pendingAffiliates = affiliates.filter((a: any) => a.status === 'pending');
  const otherAffiliates = affiliates.filter((a: any) => a.status !== 'pending');

  const columns = [
    {
      header: 'Affiliate',
      accessorKey: 'affiliate_name',
      cell: (row: any) => (
        <div className="text-sm">
          <p className="font-medium text-stone-900">{row.affiliate_name || 'Unnamed'}</p>
          <p className="text-xs text-stone-400">{row.affiliate_email}</p>
        </div>
      )
    },
    {
      header: 'Code',
      accessorKey: 'affiliate_code',
      cell: (row: any) => (
        <code className="px-1.5 py-0.5 bg-stone-100 rounded text-xs font-mono text-stone-600">
          {row.affiliate_code}
        </code>
      )
    },
    {
      header: 'Payout',
      accessorKey: 'payout',
      cell: (row: any) => (
        <div className="text-xs">
          <span className="font-medium text-stone-900">
            {row.payout_type === 'percent' ? `${row.payout_value}%` : `$${row.payout_value}`}
          </span>
          <span className="text-stone-400 ml-1 uppercase tracking-wider">{row.payout_type}</span>
        </div>
      )
    },
    {
      header: 'Conversions',
      accessorKey: 'conversions',
      cell: (row: any) => (
        <span className="text-xs font-medium text-stone-900">{row.affiliate_conversions?.length || 0}</span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const statusMap: Record<string, any> = {
          approved: { label: 'Approved', type: 'success' },
          pending: { label: 'Pending', type: 'warning' },
          rejected: { label: 'Rejected', type: 'error' },
        };
        const s = statusMap[row.status] || { label: row.status || 'Unknown', type: 'info' };
        return <StatusPill status={s.label} type={s.type} />;
      }
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <Copy className="w-4 h-4 text-stone-400" />
          </button>
          <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <MoreVertical className="w-4 h-4 text-stone-400" />
          </button>
        </div>
      )
    }
  ];

  const pendingColumns = [
    {
      header: 'Applicant',
      accessorKey: 'affiliate_name',
      cell: (row: any) => (
        <div className="text-sm">
          <p className="font-medium text-stone-900">{row.affiliate_name || 'Unnamed'}</p>
          <p className="text-xs text-stone-400">{row.affiliate_email}</p>
        </div>
      )
    },
    {
      header: 'Code',
      accessorKey: 'affiliate_code',
      cell: (row: any) => (
        <code className="px-1.5 py-0.5 bg-stone-100 rounded text-xs font-mono text-stone-600">
          {row.affiliate_code}
        </code>
      )
    },
    {
      header: 'Applied',
      accessorKey: 'created_at',
      cell: (row: any) => (
        <span className="text-xs text-stone-400">
          {new Date(row.created_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          {actionLoading === row.id ? (
            <Loader2 className="w-4 h-4 animate-spin text-stone-400" />
          ) : (
            <>
              <button
                onClick={(e) => handleApprove(row, e)}
                className="flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-medium hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Approve
              </button>
              <button
                onClick={(e) => handleReject(row, e)}
                className="flex items-center gap-1 px-3 py-1.5 bg-rose-50 text-rose-700 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors"
              >
                <XCircle className="w-3.5 h-3.5" />
                Reject
              </button>
            </>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900">Affiliate Management</h3>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
          <Share2 className="w-4 h-4" />
          New Affiliate
        </button>
      </div>

      {/* Pending Applications */}
      {pendingAffiliates.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-bold text-amber-700 uppercase tracking-wider flex items-center gap-2">
            <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
            Pending Applications ({pendingAffiliates.length})
          </h4>
          <div className="bg-white rounded-xl border border-amber-200 shadow-sm overflow-hidden">
            <DataTable columns={pendingColumns} data={pendingAffiliates} isLoading={loading} />
          </div>
        </div>
      )}

      {/* All Affiliates */}
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={otherAffiliates} 
          isLoading={loading} 
          onRowClick={(row) => setSelectedAffiliate(row)}
        />
      </div>
      {showNewModal && <NewAffiliateModal onClose={() => setShowNewModal(false)} onCreated={loadAffiliates} />}
    </div>
  );
};

export { AdminInvites } from './AdminInvites';
