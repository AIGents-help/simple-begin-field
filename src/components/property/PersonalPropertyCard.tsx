import React, { useEffect, useMemo, useState } from 'react';
import { Edit2, Trash2, Image as ImageIcon, Tag, MapPin, DollarSign } from 'lucide-react';
import { StorageImage } from '@/components/common/StorageImage';
import { propertyPhotoService, type PropertyPhoto } from '@/services/propertyPhotoService';
import { getCategoryIcon } from '@/config/categoryIcons';

interface Props {
  record: any;
  onEdit: () => void;
  onDelete: () => void;
}

const fmtCurrency = (v: any) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  if (!isFinite(n) || n === 0) return null;
  return `$${n.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 2 })}`;
};

export const PersonalPropertyCard: React.FC<Props> = ({ record, onEdit, onDelete }) => {
  const [hero, setHero] = useState<PropertyPhoto | null>(null);
  const [photoCount, setPhotoCount] = useState(0);
  const Icon = useMemo(() => getCategoryIcon('property', record), [record]);

  useEffect(() => {
    let cancelled = false;
    propertyPhotoService
      .list(record.id)
      .then((photos) => {
        if (cancelled) return;
        setPhotoCount(photos.length);
        setHero(photos.find((p) => p.is_hero) || photos[0] || null);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [record.id]);

  const value = fmtCurrency(record.appraised_value || record.estimated_value);
  const title = record.title || record.item_name || 'Untitled item';

  return (
    <div className="bg-white border border-stone-200 rounded-2xl shadow-sm overflow-hidden">
      <div className="flex">
        <div className="relative w-24 h-24 sm:w-32 sm:h-32 flex-shrink-0 bg-stone-100">
          {hero ? (
            <StorageImage path={hero.file_path} alt={title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-stone-300">
              <ImageIcon size={28} />
            </div>
          )}
          {photoCount > 1 && (
            <span className="absolute bottom-1 right-1 bg-stone-900/70 text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
              +{photoCount - 1}
            </span>
          )}
        </div>

        <div className="flex-1 min-w-0 p-3 sm:p-4 flex flex-col justify-between">
          <div className="min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-start gap-2 min-w-0">
                <div className="w-7 h-7 rounded-lg bg-stone-50 flex-shrink-0 flex items-center justify-center text-navy-muted">
                  <Icon size={14} />
                </div>
                <div className="min-w-0">
                  <h3 className="font-semibold text-stone-900 truncate text-sm sm:text-base">{title}</h3>
                  {record.category && (
                    <p className="text-[11px] text-stone-500 mt-0.5 truncate">{record.category}</p>
                  )}
                </div>
              </div>
              {value && (
                <span className="text-sm font-bold text-navy-muted whitespace-nowrap">{value}</span>
              )}
            </div>

            <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-stone-500">
              {record.location && (
                <span className="flex items-center gap-1 min-w-0">
                  <MapPin size={10} />
                  <span className="truncate">{record.location}</span>
                </span>
              )}
              {record.condition && (
                <span className="flex items-center gap-1">
                  <Tag size={10} /> {record.condition}
                </span>
              )}
              {record.specific_recipient && (
                <span className="flex items-center gap-1 truncate">
                  → {record.specific_recipient}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center justify-end gap-1 mt-2">
            <button
              onClick={onEdit}
              className="p-1.5 hover:bg-stone-100 rounded-lg text-stone-500"
              title="Edit"
            >
              <Edit2 size={14} />
            </button>
            <button
              onClick={onDelete}
              className="p-1.5 hover:bg-rose-50 rounded-lg text-rose-500"
              title="Delete"
            >
              <Trash2 size={14} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
