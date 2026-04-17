import React, { useEffect, useState } from 'react';
import { ChevronRight, PawPrint, Cross } from 'lucide-react';
import { uploadService } from '@/services/uploadService';

interface Props {
  pet: any;
  onClick: () => void;
}

export const PetCard: React.FC<Props> = ({ pet, onClick }) => {
  const [photoUrl, setPhotoUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    if (pet?.photo_path) {
      uploadService.getSignedUrl('packet-documents', pet.photo_path, 3600).then((res) => {
        if (!cancelled) setPhotoUrl(res?.url || null);
      });
    } else {
      setPhotoUrl(null);
    }
    return () => {
      cancelled = true;
    };
  }, [pet?.photo_path]);

  const subtitle = [pet?.species, pet?.breed].filter(Boolean).join(' • ');
  const isDeceased = !!pet?.is_deceased;
  const dod = pet?.date_of_death
    ? new Date(pet.date_of_death).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
    : null;

  return (
    <button
      onClick={onClick}
      className={`w-full text-left paper-sheet p-4 flex items-center justify-between group active:scale-[0.98] transition-all ${
        isDeceased ? 'opacity-70 bg-stone-50/60' : ''
      }`}
    >
      <div className="flex items-center gap-4 min-w-0">
        <div
          className={`w-14 h-14 rounded-full overflow-hidden flex items-center justify-center shrink-0 border ${
            isDeceased ? 'bg-stone-200 border-stone-300 grayscale' : 'bg-stone-100 border-stone-200'
          }`}
        >
          {photoUrl ? (
            <img src={photoUrl} alt={pet?.pet_name || 'Pet'} className="w-full h-full object-cover" />
          ) : (
            <PawPrint size={24} className="text-stone-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h4 className={`font-bold truncate ${isDeceased ? 'text-stone-500' : 'text-navy-muted'}`}>
              {pet?.pet_name || 'Unnamed pet'}
            </h4>
            {isDeceased && (
              <span className="inline-flex items-center gap-1 px-1.5 py-0.5 bg-stone-200 rounded text-[9px] font-bold uppercase tracking-wider text-stone-600 border border-stone-300">
                <Cross size={9} /> In Memory
              </span>
            )}
          </div>
          {subtitle && (
            <p className="text-xs text-stone-500 mt-0.5 truncate">{subtitle}</p>
          )}
          {isDeceased && dod && (
            <p className="text-[10px] italic text-stone-400 mt-0.5">Passed {dod}</p>
          )}
        </div>
      </div>
      <ChevronRight
        size={18}
        className="text-stone-300 group-hover:text-navy-muted transition-colors shrink-0"
      />
    </button>
  );
};
