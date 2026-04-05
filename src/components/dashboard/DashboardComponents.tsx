import React from 'react';
import { motion } from 'motion/react';
import { LucideIcon } from 'lucide-react';

interface KPIStatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export const KPIStatCard: React.FC<KPIStatCardProps> = ({ title, value, icon: Icon, description, trend }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-2 bg-stone-50 rounded-lg">
          <Icon className="w-5 h-5 text-stone-600" />
        </div>
        {trend && (
          <span className={`text-xs font-medium ${trend.isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
            {trend.isPositive ? '+' : '-'}{trend.value}%
          </span>
        )}
      </div>
      <div>
        <h3 className="text-sm font-medium text-stone-500 uppercase tracking-wider">{title}</h3>
        <p className="text-2xl font-semibold text-stone-900 mt-1">{value}</p>
        {description && <p className="text-xs text-stone-400 mt-1">{description}</p>}
      </div>
    </motion.div>
  );
};

interface DataTableProps<T> {
  columns: {
    header: string;
    accessorKey: keyof T | string;
    cell?: (row: T) => React.ReactNode;
  }[];
  data: T[];
  onRowClick?: (row: T) => void;
  isLoading?: boolean;
}

export const DataTable = <T extends { id: string }>({ columns, data, onRowClick, isLoading }: DataTableProps<T>) => {
  if (isLoading) {
    return (
      <div className="w-full h-64 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-stone-900"></div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50/50">
            {columns.map((col, idx) => (
              <th key={idx} className="px-4 py-3 text-xs font-semibold text-stone-500 uppercase tracking-wider">
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-stone-100">
          {data.map((row) => (
            <tr
              key={row.id}
              onClick={() => onRowClick?.(row)}
              className={`hover:bg-stone-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
            >
              {columns.map((col, idx) => (
                <td key={idx} className="px-4 py-4 text-sm text-stone-600">
                  {col.cell ? col.cell(row) : (row[col.accessorKey as keyof T] as any)}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
      {data.length === 0 && (
        <div className="py-12 text-center text-stone-400 text-sm">
          No records found.
        </div>
      )}
    </div>
  );
};

export const StatusPill: React.FC<{ status: string; type?: 'success' | 'warning' | 'error' | 'info' }> = ({ status, type = 'info' }) => {
  const colors = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-100',
    warning: 'bg-amber-50 text-amber-700 border-amber-100',
    error: 'bg-rose-50 text-rose-700 border-rose-100',
    info: 'bg-stone-50 text-stone-700 border-stone-100',
  };

  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${colors[type]}`}>
      {status}
    </span>
  );
};
