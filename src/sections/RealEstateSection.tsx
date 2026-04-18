import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Home, Loader2, Plus } from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import {
  createEmptyRealEstateProperty,
  RealEstatePropertyCard,
} from '../components/realestate/RealEstatePropertyCard';
import { supabase } from '@/integrations/supabase/client';

export const RealEstateSection = ({ onAddClick: _onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: (newRecord?: any) => void) => void }) => {
  const { currentPacket, activeScope } = useAppContext();
  const [properties, setProperties] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchProperties = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const query = supabase
      .from('real_estate_records')
      .select('*')
      .eq('packet_id', currentPacket.id)
      .order('created_at', { ascending: true });

    const scopedQuery = activeScope === 'shared'
      ? query.eq('scope', 'shared')
      : query.or(`scope.eq.${activeScope},scope.eq.shared`);

    const { data, error } = await scopedQuery;
    if (error) {
      console.error('Failed to load properties', error);
    } else {
      setProperties(data || []);
      setExpandedId((current) => current && (data || []).some((item) => item.id === current) ? current : null);
    }
    setLoading(false);
  }, [activeScope, currentPacket?.id]);

  useEffect(() => {
    fetchProperties();
  }, [fetchProperties]);

  useEffect(() => {
    if (onRefresh) {
      onRefresh(() => fetchProperties());
    }
  }, [fetchProperties, onRefresh]);

  const sortedProperties = useMemo(
    () => [...properties].sort((a, b) => Number(a.created_at > b.created_at ? -1 : 1)),
    [properties],
  );

  const handleAddProperty = () => {
    const draft = createEmptyRealEstateProperty(activeScope || 'shared');
    setProperties((current) => [draft, ...current]);
    setExpandedId(draft.id);
  };

  const handleSaved = (savedProperty: any, previousDraftId?: string) => {
    setProperties((current) => {
      const filtered = current.filter((item) => item.id !== (previousDraftId || savedProperty.id));
      return [savedProperty, ...filtered];
    });
    setExpandedId(savedProperty.id);
  };

  const handleDeleted = (deletedId: string) => {
    setProperties((current) => current.filter((item) => item.id !== deletedId));
    setExpandedId((current) => (current === deletedId ? null : current));
  };

  const handleCancelDraft = (draftId: string) => {
    setProperties((current) => current.filter((item) => item.id !== draftId));
    setExpandedId((current) => (current === draftId ? null : current));
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">Real Estate</h2>
        <p className="text-sm text-stone-500">
          Each property is one expandable card with mortgage, insurance, utilities, security, contacts, documents, and home inventory video attached directly to it.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
          <p className="text-stone-500 text-sm">Loading properties...</p>
        </div>
      ) : sortedProperties.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
            <Home size={32} className="text-stone-300" />
          </div>
          <h3 className="text-lg font-bold text-navy-muted mb-2">No properties added yet.</h3>
          <p className="text-sm text-stone-500 mb-6">
            Add each property as one structured card instead of splitting mortgage, utilities, insurance, or security into standalone entries.
          </p>
          <button
            onClick={handleAddProperty}
            className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Add Property
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {sortedProperties.map((property) => (
            <RealEstatePropertyCard
              key={property.id}
              packetId={currentPacket!.id}
              scope={activeScope || 'shared'}
              property={property}
              expanded={expandedId === property.id}
              onToggle={() => setExpandedId((current) => (current === property.id ? null : property.id))}
              onSaved={handleSaved}
              onDeleted={handleDeleted}
              onCancelDraft={handleCancelDraft}
            />
          ))}

          <button
            onClick={handleAddProperty}
            className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:border-navy-muted hover:text-navy-muted transition-colors"
          >
            <Plus size={18} />
            <span className="font-bold text-sm">Add Another Property</span>
          </button>
        </div>
      )}
    </div>
  );
};
