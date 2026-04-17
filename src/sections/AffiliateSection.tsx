import React from 'react';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { Share2, TrendingUp, Users } from 'lucide-react';

export const AffiliateSection = ({ onAddClick, onRefresh }: { onAddClick: () => void, onRefresh?: (fn: () => void) => void }) => {
  return (
    <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
      {(records) => (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl">
              <div className="flex items-center gap-2 text-emerald-600 mb-1">
                <TrendingUp size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Total Referrals</span>
              </div>
              <div className="text-2xl font-serif font-bold text-navy-muted">{records.length}</div>
            </div>
            <div className="p-4 bg-navy-muted/5 border border-navy-muted/10 rounded-2xl">
              <div className="flex items-center gap-2 text-navy-muted mb-1">
                <Users size={16} />
                <span className="text-[10px] font-bold uppercase tracking-wider">Active Codes</span>
              </div>
              <div className="text-2xl font-serif font-bold text-navy-muted">
                {records.filter(r => r.data?.status === 'active').length}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {records.map(record => (
              <RecordCard
                key={record.id}
                title={record.title}
                subtitle={record.description}
                subtitlePlaceholder="No description"
                icon={Share2}
                data={record.data}
              />
            ))}
          </div>
        </div>
      )}
    </SectionScreenTemplate>
  );
};
