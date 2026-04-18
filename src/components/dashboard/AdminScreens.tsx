import React, { useEffect, useState } from 'react';
import { 
  Search, 
  Filter, 
  MoreVertical, 
  Eye, 
  UserPlus, 
  Shield, 
  CreditCard,
  Package,
  ChevronRight,
  Mail,
  Calendar,
  ExternalLink
} from 'lucide-react';
import { DataTable, StatusPill } from './DashboardComponents';
import { adminService } from '../../services/adminService';
import { CustomerDetail, PacketDetail } from './AdminDetailScreens';

export const AdminCustomers: React.FC = () => {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<any>(null);
  const [viewingPacket, setViewingPacket] = useState<any>(null);

  useEffect(() => {
    adminService.getCustomers().then(data => {
      setCustomers(data);
      setLoading(false);
    });
  }, []);

  if (viewingPacket) {
    return (
      <PacketDetail
        packet={viewingPacket}
        onClose={() => setViewingPacket(null)}
      />
    );
  }

  if (selectedCustomer) {
    return (
      <CustomerDetail
        customer={selectedCustomer}
        onClose={() => setSelectedCustomer(null)}
        onViewPacket={(packet) => setViewingPacket(packet)}
      />
    );
  }

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'full_name',
      cell: (row: any) => (
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center text-stone-600 font-medium text-xs">
            {row.full_name?.charAt(0) || row.email?.charAt(0)}
          </div>
          <div>
            <p className="font-medium text-stone-900">{row.full_name || 'Unnamed'}</p>
            <p className="text-xs text-stone-400">{row.email}</p>
          </div>
        </div>
      )
    },
    {
      header: 'Plan',
      accessorKey: 'plan',
      cell: (row: any) => {
        const plan = row.purchases?.[0]?.pricing_plans?.name || 'Free';
        return <StatusPill status={plan} type={plan === 'Free' ? 'info' : 'success'} />;
      }
    },
    {
      header: 'Packet',
      accessorKey: 'packet_status',
      cell: (row: any) => {
        const packet = row.packets?.[0];
        if (!packet) return <span className="text-stone-400 italic">No Packet</span>;
        return (
          <div className="flex items-center gap-2">
            <Package className="w-3 h-3 text-stone-400" />
            <span className="text-xs font-medium text-stone-600 uppercase tracking-wider">
              {packet.household_mode}
            </span>
          </div>
        );
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
        <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
          <MoreVertical className="w-4 h-4 text-stone-400" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search customers by name or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
          />
        </div>
        <div className="flex items-center gap-3">
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            <Filter className="w-4 h-4" />
            Filters
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-stone-900 text-white rounded-lg text-sm font-medium hover:bg-stone-800 transition-colors">
            <UserPlus className="w-4 h-4" />
            Add Customer
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={customers} isLoading={loading} onRowClick={setSelectedCustomer} />
      </div>
    </div>
  );
};

export const AdminPackets: React.FC = () => {
  const [packets, setPackets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPacket, setSelectedPacket] = useState<any>(null);

  useEffect(() => {
    adminService.getPackets().then(data => {
      setPackets(data);
      setLoading(false);
    });
  }, []);

  if (selectedPacket) {
    return <PacketDetail packet={selectedPacket} onClose={() => setSelectedPacket(null)} />;
  }

  const columns = [
    {
      header: 'Packet Title',
      accessorKey: 'title',
      cell: (row: any) => (
        <div>
          <p className="font-medium text-stone-900">{row.title}</p>
          <p className="text-xs text-stone-400">ID: {row.id.slice(0, 8)}...</p>
        </div>
      )
    },
    {
      header: 'Owner',
      accessorKey: 'owner',
      cell: (row: any) => (
        <div className="text-sm">
          <p className="text-stone-900">{row.profiles?.full_name || 'Unnamed'}</p>
          <p className="text-xs text-stone-400">{row.profiles?.email}</p>
        </div>
      )
    },
    {
      header: 'Mode',
      accessorKey: 'household_mode',
      cell: (row: any) => (
        <StatusPill 
          status={row.household_mode} 
          type={row.household_mode === 'couple' ? 'success' : 'info'} 
        />
      )
    },
    {
      header: 'Completion',
      accessorKey: 'completion',
      cell: (row: any) => (
        <div className="w-32">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[10px] font-semibold text-stone-400 uppercase tracking-wider">Progress</span>
            <span className="text-[10px] font-semibold text-stone-900">45%</span>
          </div>
          <div className="h-1.5 w-full bg-stone-100 rounded-full overflow-hidden">
            <div className="h-full bg-stone-900 rounded-full" style={{ width: '45%' }} />
          </div>
        </div>
      )
    },
    {
      header: 'Last Active',
      accessorKey: 'updated_at',
      cell: (row: any) => (
        <span className="text-xs text-stone-400">
          {new Date(row.updated_at).toLocaleDateString()}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
          <Eye className="w-4 h-4 text-stone-400" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-400" />
          <input
            type="text"
            placeholder="Search packets by title or owner..."
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-stone-900/5 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
          <Filter className="w-4 h-4" />
          Filters
        </button>
      </div>

      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={packets} isLoading={loading} onRowClick={setSelectedPacket} />
      </div>
    </div>
  );
};

export const AdminBilling: React.FC = () => {
  const [billing, setBilling] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminService.getBilling().then(data => {
      setBilling(data);
      setLoading(false);
    });
  }, []);

  const columns = [
    {
      header: 'Customer',
      accessorKey: 'customer',
      cell: (row: any) => (
        <div className="text-sm">
          <p className="font-medium text-stone-900">{row.profiles?.full_name || 'Unnamed'}</p>
          <p className="text-xs text-stone-400">{row.profiles?.email}</p>
        </div>
      )
    },
    {
      header: 'Plan',
      accessorKey: 'plan',
      cell: (row: any) => (
        <div>
          <p className="text-sm font-medium text-stone-900">{row.pricing_plans?.name}</p>
          <p className="text-[10px] text-stone-400 uppercase tracking-wider">{row.billing_type}</p>
        </div>
      )
    },
    {
      header: 'Status',
      accessorKey: 'status',
      cell: (row: any) => {
        const statusMap: Record<string, any> = {
          active: { label: 'Active', type: 'success' },
          one_time_paid: { label: 'Paid', type: 'success' },
          pending: { label: 'Pending', type: 'warning' },
          failed: { label: 'Failed', type: 'error' },
          canceled: { label: 'Canceled', type: 'error' },
        };
        const s = statusMap[row.status] || { label: row.status, type: 'info' };
        return <StatusPill status={s.label} type={s.type} />;
      }
    },
    {
      header: 'Period End',
      accessorKey: 'current_period_end',
      cell: (row: any) => (
        <span className="text-xs text-stone-400">
          {row.current_period_end ? new Date(row.current_period_end).toLocaleDateString() : 'N/A'}
        </span>
      )
    },
    {
      header: 'Actions',
      accessorKey: 'actions',
      cell: (row: any) => (
        <button className="p-1 hover:bg-stone-100 rounded-lg transition-colors">
          <ExternalLink className="w-4 h-4 text-stone-400" />
        </button>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-serif italic text-stone-900">Billing Operations</h3>
        <div className="flex items-center gap-3">
          <button className="px-4 py-2 bg-white border border-stone-200 rounded-lg text-sm font-medium text-stone-600 hover:bg-stone-50 transition-colors">
            Export CSV
          </button>
        </div>
      </div>
      <div className="bg-white rounded-xl border border-stone-200 shadow-sm overflow-hidden">
        <DataTable columns={columns} data={billing} isLoading={loading} />
      </div>
    </div>
  );
};
