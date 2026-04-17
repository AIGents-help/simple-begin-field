import React from 'react';
import { MEMORY_TYPE_BY_ID, type MemoryEntryType } from '@/config/memoryTypes';
import { StorageImage } from '@/components/common/StorageImage';
import { Calendar, User } from 'lucide-react';

interface MemoryCardProps {
  memory: any;
  onClick: () => void;
}

function stripHtml(html: string | null | undefined, max = 140): string {
  if (!html) return '';
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? text.slice(0, max) + '…' : text;
}

export const MemoryCard: React.FC<MemoryCardProps> = ({ memory, onClick }) => {
  const meta = MEMORY_TYPE_BY_ID[memory.entry_type as MemoryEntryType];
  const Icon = meta?.icon;
  const title = memory.title || meta?.label || 'Memory';
  const preview = stripHtml(memory.content);

  const showImagePreview = meta?.hasMediaUpload === 'image' && memory.media_path;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-stone-100 shadow-sm hover:shadow-md transition-shadow overflow-hidden"
    >
      <div className="flex">
        {showImagePreview ? (
          <StorageImage
            path={memory.media_path}
            alt={title}
            className="w-20 h-20 object-cover shrink-0"
          />
        ) : (
          <div className="w-20 h-20 bg-amber-50 flex items-center justify-center shrink-0">
            {Icon && <Icon size={28} className="text-amber-400" />}
          </div>
        )}
        <div className="flex-1 min-w-0 p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-wide text-amber-600 font-bold mb-0.5">
                {meta?.label || 'Memory'}
              </div>
              <h3 className="font-bold text-sm text-navy-muted truncate">{title}</h3>
            </div>
          </div>
          {preview && (
            <p className="text-xs text-stone-500 line-clamp-2 mb-1">{preview}</p>
          )}
          <div className="flex items-center gap-3 text-[11px] text-stone-400">
            {memory.recipient && (
              <span className="flex items-center gap-1">
                <User size={11} />
                {memory.recipient}
              </span>
            )}
            {memory.date_written && (
              <span className="flex items-center gap-1">
                <Calendar size={11} />
                {new Date(memory.date_written).toLocaleDateString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </button>
  );
};
