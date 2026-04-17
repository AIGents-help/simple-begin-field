import React, { useEffect, useState } from 'react';
import { ChevronRight, PawPrint } from 'lucide-react';
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

  return (
    <button
      onClick={onClick}
      className="w-full text-left paper-sheet p-4 flex items-center justify-between group active:scale-[0.98] transition-all"
    >
      <div className="flex items-center gap-4 min-w-0">
        <div className="w-14 h-14 rounded-full bg-stone-100 overflow-hidden flex items-center justify-center shrink-0 border border-stone-200">
          {photoUrl ? (
            <img src={photoUrl} alt={pet?.pet_name || 'Pet'} className="w-full h-full object-cover" />
          ) : (
            <PawPrint size={24} className="text-stone-400" />
          )}
        </div>
        <div className="min-w-0">
          <h4 className="font-bold text-navy-muted truncate">
            {pet?.pet_name || 'Unnamed pet'}
          </h4>
          {subtitle && (
            <p className="text-xs text-stone-500 mt-0.5 truncate">{subtitle}</p>
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
