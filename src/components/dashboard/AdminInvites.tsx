import React, { useEffect, useState } from 'react';
import { Package, RefreshCw, XCircle } from 'lucide-react';
import { DataTable, StatusPill } from './DashboardComponents';
import { adminService } from '../../services/adminService';

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
