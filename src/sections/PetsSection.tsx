import React, { useCallback, useEffect, useState } from 'react';
import { Plus, Loader2, PawPrint } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '../context/AppContext';
import { CategoryOption } from '../components/upload/types';
import { PetCard } from '../components/pets/PetCard';
import { PetProfileSheet } from '../components/pets/PetProfileSheet';

// PetsSection is fully self-contained — it does NOT use SectionScreenTemplate,
// chip recommendations, or the generic AddEditSheet. Each pet is one card
// with its full profile inside an accordion sheet.
export const PetsSection = ({
  onAddClick,
  onRefresh,
}: {
  onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void;
  onRefresh?: (fn: (newRecord?: any) => void) => void;
}) => {
  const { currentPacket } = useAppContext();
  const [pets, setPets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingPet, setEditingPet] = useState<any | null>(null);
  const [sheetOpen, setSheetOpen] = useState(false);

  const fetchPets = useCallback(async () => {
    if (!currentPacket?.id) return;
    setLoading(true);
    const { data, error } = await supabase
      .from('pet_records')
      .select('*')
      .eq('packet_id', currentPacket.id)
      .order('created_at', { ascending: true });
    if (error) {
      console.error('Failed to load pets', error);
    } else {
      setPets(data || []);
    }
    setLoading(false);
  }, [currentPacket?.id]);

  useEffect(() => {
    fetchPets();
  }, [fetchPets]);

  // Allow parent shell refresh hook (kept for API compatibility)
  useEffect(() => {
    if (onRefresh) {
      onRefresh(() => fetchPets());
    }
  }, [onRefresh, fetchPets]);

  const openAdd = () => {
    setEditingPet(null);
    setSheetOpen(true);
  };

  const openEdit = (pet: any) => {
    setEditingPet(pet);
    setSheetOpen(true);
  };

  return (
    <div className="p-6 pb-32">
      <div className="mb-6">
        <h2 className="text-2xl font-serif font-bold text-navy-muted mb-2">Pets</h2>
        <p className="text-sm text-stone-500">
          A complete profile for each pet — vet, meds, care, and emergency info.
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <Loader2 className="animate-spin text-navy-muted mb-4" size={32} />
          <p className="text-stone-500 text-sm">Loading pets...</p>
        </div>
      ) : pets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-6 bg-white rounded-3xl border border-stone-100 shadow-sm text-center">
          <div className="w-16 h-16 bg-stone-50 rounded-full flex items-center justify-center mb-4">
            <PawPrint size={32} className="text-stone-300" />
          </div>
          <h3 className="text-lg font-bold text-navy-muted mb-2">No pets added yet.</h3>
          <p className="text-sm text-stone-500 mb-6">
            Add a profile for each pet so caregivers have everything in one place.
          </p>
          <button
            onClick={openAdd}
            className="px-6 py-3 bg-navy-muted text-white rounded-xl font-bold text-sm flex items-center gap-2"
          >
            <Plus size={18} />
            Add Pet
          </button>
        </div>
      ) : (
        (() => {
          const livingPets = pets.filter((p) => !p?.is_deceased);
          const pastPets = pets.filter((p) => !!p?.is_deceased);
          return (
            <div className="space-y-6">
              {livingPets.length > 0 && (
                <div className="space-y-3">
                  {livingPets.map((pet) => (
                    <PetCard key={pet.id} pet={pet} onClick={() => openEdit(pet)} />
                  ))}
                </div>
              )}

              <button
                onClick={openAdd}
                className="w-full py-4 border-2 border-dashed border-stone-200 rounded-2xl flex items-center justify-center gap-2 text-stone-400 hover:border-navy-muted hover:text-navy-muted transition-colors"
              >
                <Plus size={18} />
                <span className="font-bold text-sm">Add Pet</span>
              </button>

              {pastPets.length > 0 && (
                <div className="pt-2">
                  <div className="flex items-center gap-3 mb-3">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-stone-400">
                      Past Pets · In Memory
                    </h3>
                    <div className="flex-1 h-px bg-stone-200" />
                    <span className="text-[10px] text-stone-400">{pastPets.length}</span>
                  </div>
                  <div className="space-y-3">
                    {pastPets.map((pet) => (
                      <PetCard key={pet.id} pet={pet} onClick={() => openEdit(pet)} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()
      )}

      <PetProfileSheet
        isOpen={sheetOpen}
        onClose={() => setSheetOpen(false)}
        pet={editingPet}
        onSaved={fetchPets}
      />
    </div>
  );
};
