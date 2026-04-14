import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Share2, 
  Copy, 
  CheckCircle2, 
  XCircle, 
  RefreshCw,
  Mail,
  Package,
  User,
  ExternalLink,
  Loader2,
  X
} from 'lucide-react';
import { DataTable, StatusPill } from './DashboardComponents';
import { adminService } from '../../services/adminService';
import { AffiliateDetail } from './AdminDetailScreens';
import { supabase } from '@/lib/supabase';
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
      });
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

  if (selectedAffiliate) {
    return <AffiliateDetail affiliate={selectedAffiliate} onClose={() => setSelectedAffiliate(null)} />;
  }

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
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-stone-900">{row.affiliate_conversions?.length || 0}</span>
          <span className="text-[10px] text-stone-400 uppercase tracking-wider">Total</span>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'is_active',
      cell: (row: any) => (
        <StatusPill 
          status={row.is_active ? 'Active' : 'Inactive'} 
          type={row.is_active ? 'success' : 'error'} 
        />
      )
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

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900">Affiliate Management</h3>
        <button onClick={() => setShowNewModal(true)} className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
          <Share2 className="w-4 h-4" />
          New Affiliate
        </button>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable 
          columns={columns} 
          data={affiliates} 
          isLoading={loading} 
          onRowClick={(row) => setSelectedAffiliate(row)}
        />
      </div>
      {showNewModal && <NewAffiliateModal onClose={() => setShowNewModal(false)} onCreated={loadAffiliates} />}
    </div>
  );
};

export const AdminInvites: React.FC = () => {
  const [invites, setInvites] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getInvites().then(data => {
      setInvites(data);
      setLoading(false);
    });
  }, []);

  const columns = [
    {
      header: 'Invited Name',
      accessorKey: 'invited_name',
      cell: (row: any) => (
        <div className="text-sm">
          <p className="font-medium text-stone-900">{row.invited_name}</p>
          <p className="text-xs text-stone-400">{row.invited_email}</p>
        </div>
      )
    },
    {
      header: 'Packet',
      accessorKey: 'packet',
      cell: (row: any) => (
        <div className="flex items-center gap-2">
          <Package className="w-3 h-3 text-stone-400" />
          <span className="text-xs text-stone-600">{row.packets?.title}</span>
        </div>
      )
    },
    {
      header: 'Invited By',
      accessorKey: 'invited_by',
      cell: (row: any) => (
        <span className="text-xs text-stone-600">{row.profiles?.full_name}</span>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const typeMap: Record<string, any> = {
          pending: 'warning',
          accepted: 'success',
          declined: 'error',
          expired: 'info',
        };
        return <StatusPill status={row.status} type={typeMap[row.status] || 'info'} />;
      }
    },
    {
      header: 'Created',
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
          <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
            <RefreshCw className="w-4 h-4 text-stone-400" />
          </button>
          <button className="p-1 hover:bg-rose-50 rounded-lg transition-colors">
            <XCircle className="w-4 h-4 text-rose-400" />
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900">Partner Invites</h3>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            Clean Expired
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={invites} isLoading={loading} />
      </div>
    </div>
  );
};
