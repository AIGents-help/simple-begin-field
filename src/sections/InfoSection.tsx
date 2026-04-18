import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, Plus, AlertTriangle, ShieldAlert, Check } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import {
  identityService,
  IdentityRecord,
  IdentityCategory,
} from '../services/identityService';
import { PersonalInfoCard } from '../components/identity/PersonalInfoCard';
import { DriversLicenseCard } from '../components/identity/cards/DriversLicenseCard';
import { PassportCard } from '../components/identity/cards/PassportCard';
import { SocialSecurityCard } from '../components/identity/cards/SocialSecurityCard';
import { BirthCertificateCard } from '../components/identity/cards/BirthCertificateCard';
import { CitizenshipCard } from '../components/identity/cards/CitizenshipCard';
import { OtherGovernmentIdCard } from '../components/identity/cards/OtherGovernmentIdCard';

const RECOMMENDED: { label: string; category: IdentityCategory; details?: Record<string, any> }[] = [
  { label: "Driver's License", category: 'drivers_license' },
  { label: 'Passport', category: 'passport' },
  { label: 'Social Security Card', category: 'social_security' },
  { label: 'Birth Certificate', category: 'birth_certificate' },
  { label: 'Citizenship Papers', category: 'citizenship' },
  { label: 'Global Entry / TSA Precheck', category: 'other_government_id', details: { id_type: 'Global Entry' } },
  { label: 'State ID', category: 'other_government_id', details: { id_type: 'State ID' } },
  { label: 'Military ID', category: 'other_government_id', details: { id_type: 'Military ID' } },
];

const SINGLETON_CATEGORIES: IdentityCategory[] = [
  'drivers_license', 'social_security', 'birth_certificate', 'citizenship',
];

const daysUntil = (d?: string | null) => {
  if (!d) return null;
  const t = new Date(d).getTime();
  if (Number.isNaN(t)) return null;
  const today = new Date(); today.setHours(0, 0, 0, 0);
  return Math.floor((t - today.getTime()) / 86400000);
};

const createDraft = (
  category: IdentityCategory,
  scope: string,
  details?: Record<string, any>,
): IdentityRecord => ({
  id: `draft-${crypto.randomUUID()}`,
  packet_id: '',
  scope,
  category,
  title: null,
  notes: null,
  expiry_date: null,
  details: details || {},
});

export const InfoSection = ({
  onAddClick: _onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: (newRecord?: any) => void) => void;
}) => {
  const { currentPacket, activeScope } = useAppContext();
  const scope = activeScope || 'personA';
  const [records, setRecords] = useState<IdentityRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showAddMenu, setShowAddMenu] = useState(false);

  const fetchRecords = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    try {
      const data = await identityService.list(currentPacket.id, scope);
      setRecords(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [currentPacket?.id, scope]);

  useEffect(() => { fetchRecords(); }, [fetchRecords]);
  useEffect(() => {
    if (onRefresh) onRefresh(() => fetchRecords());
  }, [onRefresh, fetchRecords]);

  const handleSaved = (saved: IdentityRecord, prevDraftId?: string) => {
    setRecords((curr) => {
      if (prevDraftId) {
        return curr.map((r) => (r.id === prevDraftId ? saved : r));
      }
      const exists = curr.findIndex((r) => r.id === saved.id);
      if (exists >= 0) {
        const next = [...curr];
        next[exists] = saved;
        return next;
      }
      return [...curr, saved];
    });
    setExpandedId(saved.id);
  };

  const handleDeleted = (id: string) => {
    setRecords((curr) => curr.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const handleCancelDraft = (id: string) => {
    setRecords((curr) => curr.filter((r) => r.id !== id));
    if (expandedId === id) setExpandedId(null);
  };

  const addCard = (category: IdentityCategory, details?: Record<string, any>) => {
    if (!currentPacket?.id) return;
    if (SINGLETON_CATEGORIES.includes(category) && records.some((r) => r.category === category)) {
      // already exists — just expand it
      const existing = records.find((r) => r.category === category);
      if (existing) setExpandedId(existing.id);
      setShowAddMenu(false);
      return;
    }
    const draft = createDraft(category, scope, details);
    draft.packet_id = currentPacket.id;
    setRecords((curr) => [...curr, draft]);
    setExpandedId(draft.id);
    setShowAddMenu(false);
  };

  const expiringSoon = useMemo(() => {
    return records
      .map((r) => ({ r, days: daysUntil(r.expiry_date) }))
      .filter((x) => x.days !== null && x.days! <= 90)
      .sort((a, b) => (a.days! - b.days!));
  }, [records]);

  const cardCommonProps = (r: IdentityRecord) => ({
    record: r,
    packetId: currentPacket?.id || '',
    scope,
    expanded: expandedId === r.id,
    onToggle: () => setExpandedId((c) => (c === r.id ? null : r.id)),
    onSaved: handleSaved,
    onDeleted: handleDeleted,
    onCancelDraft: handleCancelDraft,
  });

  const renderCard = (r: IdentityRecord) => {
    const common = cardCommonProps(r);
    switch (r.category as IdentityCategory) {
      case 'drivers_license': return <DriversLicenseCard key={r.id} {...common} />;
      case 'passport': return <PassportCard key={r.id} {...common} />;
      case 'social_security': return <SocialSecurityCard key={r.id} {...common} />;
      case 'birth_certificate': return <BirthCertificateCard key={r.id} {...common} />;
      case 'citizenship': return <CitizenshipCard key={r.id} {...common} />;
      case 'other_government_id': return <OtherGovernmentIdCard key={r.id} {...common} />;
      default: return null;
    }
  };

  if (!currentPacket?.id) {
    return (
      <div className="py-12 text-center text-stone-400">
        <Loader2 className="animate-spin mx-auto" size={20} />
      </div>
    );
  }

  return (
    <div className="space-y-5 pb-24">
      {/* Expiry alerts */}
      {expiringSoon.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 flex items-start gap-3">
          <AlertTriangle size={18} className="text-amber-700 mt-0.5 shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-amber-900">
              {expiringSoon.length} document{expiringSoon.length === 1 ? '' : 's'} expiring within 90 days
            </p>
            <ul className="mt-1 space-y-0.5">
              {expiringSoon.slice(0, 3).map(({ r, days }) => (
                <li key={r.id} className="text-[11px] text-amber-800">
                  {r.title || r.category.replace('_', ' ')} —{' '}
                  {days! < 0 ? `expired ${Math.abs(days!)}d ago` : `${days}d`}
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}

      {/* Personal Info pinned card */}
      <PersonalInfoCard />

      {/* Identity cards */}
      {loading ? (
        <div className="py-8 text-center text-stone-400">
          <Loader2 className="animate-spin mx-auto" size={20} />
        </div>
      ) : records.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-stone-300 bg-stone-50 p-6 text-center">
          <ShieldAlert className="mx-auto text-stone-400 mb-2" size={24} />
          <p className="text-sm font-bold text-navy-muted">No identity documents yet</p>
          <p className="text-xs text-stone-500 mt-1">Add your license, passport, SSN, and more.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {records.map(renderCard)}
        </div>
      )}

      {/* Add document button + recommended chips */}
      <div className="space-y-3">
        <button
          onClick={() => setShowAddMenu((v) => !v)}
          className="w-full flex items-center justify-center gap-2 p-3.5 bg-navy-muted text-primary-foreground rounded-xl font-bold text-sm shadow-sm active:scale-95 transition-transform"
        >
          <Plus size={18} />
          Add Document
        </button>
        {showAddMenu && (
          <div className="rounded-xl border border-stone-200 bg-white p-3 space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-stone-500 px-1">Recommended</p>
            <div className="flex flex-wrap gap-2">
              {RECOMMENDED.map((r) => (
                <button
                  key={r.label}
                  onClick={() => addCard(r.category, r.details)}
                  className="px-3 py-1.5 rounded-full text-xs font-bold bg-stone-50 text-navy-muted border border-stone-200 hover:border-navy-muted/40 active:scale-95 transition-transform"
                >
                  + {r.label}
                </button>
              ))}
            </div>
          </div>
        )}
        <p className="text-[11px] text-center text-stone-400">
          {records.length} document{records.length === 1 ? '' : 's'} on file
        </p>
      </div>
    </div>
  );
};
