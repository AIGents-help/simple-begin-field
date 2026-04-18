import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Car, Loader2, Plus, AlertTriangle } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import { VehicleCard, createEmptyVehicle } from '../components/vehicles/VehicleCard';
import { supabase } from '@/integrations/supabase/client';

const BODY_FILTERS = ['All', 'Car', 'Truck', 'Motorcycle', 'Boat', 'RV', 'Other'];

const matchesFilter = (v: any, filter: string) => {
  if (filter === 'All') return true;
  const body = (v.body_style || '').toLowerCase();
  if (filter === 'Car') return ['sedan', 'coupe', 'convertible', 'wagon'].some((s) => body.includes(s));
  if (filter === 'Truck') return body.includes('truck') || body.includes('suv') || body.includes('van');
  if (filter === 'Motorcycle') return body.includes('motorcycle') || body.includes('atv');
  if (filter === 'Boat') return body.includes('boat');
  if (filter === 'RV') return body.includes('rv');
  if (filter === 'Other') return !body || body.includes('other');
  return true;
};

const daysUntil = (dateStr?: string | null): number | null => {
  if (!dateStr) return null;
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return null;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.floor((d.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency', currency: 'USD', maximumFractionDigits: 0,
});

const buildLabel = (v: any) => [v.year, v.make, v.model].filter(Boolean).join(' ') || 'Vehicle';

export const VehiclesSection = ({
  onAddClick: _onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: (newRecord?: any) => void) => void;
}) => {
  const { currentPacket, activeScope } = useAppContext();
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('All');

  const fetchVehicles = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const query = supabase
      .from('vehicle_records')
      .select('*')
      .eq('packet_id', currentPacket.id)
      .order('created_at', { ascending: false });

    const scopedQuery = activeScope === 'shared'
      ? query.eq('scope', 'shared')
      : query.or(`scope.eq.${activeScope},scope.eq.shared`);

    const { data, error } = await scopedQuery;
    if (error) {
      console.error('Failed to load vehicles', error);
    } else {
      setVehicles(data || []);
      setExpandedId((current) => current && (data || []).some((item) => item.id === current) ? current : null);
    }
    setLoading(false);
  }, [activeScope, currentPacket?.id]);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  useEffect(() => {
    if (onRefresh) onRefresh(() => fetchVehicles());
  }, [fetchVehicles, onRefresh]);

  const filteredVehicles = useMemo(
    () => vehicles.filter((v) => matchesFilter(v, filter)),
    [vehicles, filter],
  );

  const fleetValue = useMemo(() => {
    return vehicles.reduce((sum, v) => {
      const val = Number(v.estimated_value);
      return Number.isFinite(val) ? sum + val : sum;
    }, 0);
  }, [vehicles]);

  const expiringAlerts = useMemo(() => {
    const alerts: { label: string; type: string; days: number }[] = [];
    for (const v of vehicles) {
      const insDays = daysUntil(v.insurance_renewal_date);
      if (insDays !== null && insDays <= 30) {
        alerts.push({ label: buildLabel(v), type: 'Insurance', days: insDays });
      }
      const regDays = daysUntil(v.registration_expiry_date);
      if (regDays !== null && regDays <= 30) {
        alerts.push({ label: buildLabel(v), type: 'Registration', days: regDays });
      }
    }
    return alerts.sort((a, b) => a.days - b.days);
  }, [vehicles]);

  const handleAdd = () => {
    const draft = createEmptyVehicle(activeScope || 'shared');
    setVehicles((current) => [draft, ...current]);
    setExpandedId(draft.id);
  };

  const handleSaved = (saved: any, prevDraftId?: string) => {
    setVehicles((current) => {
      const filtered = current.filter((item) => item.id !== (prevDraftId || saved.id));
      return [saved, ...filtered];
    });
    setExpandedId(saved.id);
  };

  const handleDeleted = (deletedId: string) => {
    setVehicles((current) => current.filter((item) => item.id !== deletedId));
    setExpandedId((current) => (current === deletedId ? null : current));
  };

  const handleCancelDraft = (draftId: string) => {
    setVehicles((current) => current.filter((item) => item.id !== draftId));
    setExpandedId((current) => (current === draftId ? null : current));
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">Vehicles</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Each vehicle is one expandable card with registration, insurance, financing, valuation, maintenance, photos, and disposition instructions attached directly to it.
          </p>
        </div>
        {fleetValue > 0 && (
          <div className="rounded-2xl border border-border bg-card px-4 py-3 text-right shadow-sm">
            <p className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Fleet value</p>
            <p className="text-xl font-bold text-foreground">{currencyFormatter.format(fleetValue)}</p>
          </div>
        )}
      </div>

      {expiringAlerts.length > 0 && (
        <div className="mb-4 rounded-2xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                {expiringAlerts.length} expiring soon
              </p>
              <ul className="mt-1 space-y-0.5 text-xs text-amber-800">
                {expiringAlerts.slice(0, 5).map((a, i) => (
                  <li key={i}>
                    • <strong>{a.label}</strong> — {a.type} {a.days < 0 ? `expired ${Math.abs(a.days)} days ago` : `in ${a.days} days`}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {BODY_FILTERS.map((f) => (
          <button
            key={f}
            type="button"
            onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
              filter === f
                ? 'bg-navy-muted text-white'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
          >
            {f}
          </button>
        ))}
        <div className="ml-auto">
          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={16} />
            Add Vehicle
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
          <p className="text-muted-foreground text-sm">Loading vehicles...</p>
        </div>
      ) : vehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-card rounded-3xl border border-border shadow-sm text-center">
          <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
            <Car size={32} className="text-muted-foreground" />
          </div>
          <h3 className="text-lg font-bold text-navy-muted mb-2">No vehicles added yet.</h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Add each vehicle as one structured card — registration, insurance, financing, photos, and disposition all in one place.
          </p>
          <button
            onClick={handleAdd}
            className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Add Vehicle
          </button>
        </div>
      ) : filteredVehicles.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 px-6 bg-card rounded-2xl border border-dashed border-border text-center">
          <p className="text-sm text-muted-foreground">No vehicles match the "{filter}" filter.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredVehicles.map((vehicle) => (
            <VehicleCard
              key={vehicle.id}
              packetId={currentPacket!.id}
              scope={activeScope || 'shared'}
              vehicle={vehicle}
              expanded={expandedId === vehicle.id}
              onToggle={() => setExpandedId((current) => (current === vehicle.id ? null : vehicle.id))}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onCancelDraft={handleCancelDraft}
            />
          ))}

          <button
            onClick={handleAdd}
            className="w-full py-4 border-2 border-dashed border-border rounded-2xl flex items-center justify-center gap-2 text-muted-foreground hover:border-navy-muted hover:text-navy-muted transition-colors"
          >
            <Plus size={18} />
            <span className="font-bold text-sm">Add Another Vehicle</span>
          </button>
        </div>
      )}
    </div>
  );
};
