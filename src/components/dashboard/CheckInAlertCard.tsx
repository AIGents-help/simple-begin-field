import React, { useEffect, useState } from 'react';
import { ShieldAlert, ChevronRight, ShieldCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { inactivityCheckInService } from '@/services/inactivityCheckInService';

/**
 * Compact card surfaced on Admin Overview that highlights any users
 * currently in grace period or triggered. Click → /dashboard/checkins.
 */
export const CheckInAlertCard: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState<number | null>(null);

  useEffect(() => {
    inactivityCheckInService
      .adminCountAlerts()
      .then(setCount)
      .catch(() => setCount(0));
  }, []);

  if (count === null) {
    return (
      <div className="bg-white p-6 rounded-xl border border-stone-200 shadow-sm animate-pulse h-32" />
    );
  }

  const hasAlerts = count > 0;

  return (
    <button
      onClick={() => navigate('/dashboard/checkins')}
      className={`w-full text-left p-6 rounded-xl border shadow-sm transition-all hover:shadow-md ${
        hasAlerts
          ? 'bg-rose-50 border-rose-200 hover:bg-rose-100/60'
          : 'bg-white border-stone-200 hover:bg-stone-50'
      }`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div
            className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${
              hasAlerts ? 'bg-rose-100' : 'bg-emerald-100'
            }`}
          >
            {hasAlerts ? (
              <ShieldAlert className="w-5 h-5 text-rose-700" />
            ) : (
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            )}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-stone-900">
              Inactivity Check-Ins
            </h3>
            <p className="text-xs text-stone-500 mt-0.5">
              {hasAlerts
                ? `${count} user${count === 1 ? '' : 's'} in grace period or triggered`
                : 'All users responding on schedule'}
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-stone-400 mt-3" />
      </div>
    </button>
  );
};
