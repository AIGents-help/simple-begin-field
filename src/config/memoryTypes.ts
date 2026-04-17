// Memory entry-type metadata, shared by section + sheet.
import {
  Mail,
  Lightbulb,
  Image as ImageIcon,
  Images,
  Video,
  Mic,
  ListChecks,
  Heart,
  Clock,
  type LucideIcon,
} from 'lucide-react';

export type MemoryEntryType =
  | 'letter'
  | 'advice'
  | 'memory'
  | 'photo_album'
  | 'video_message'
  | 'voice_note'
  | 'bucket_list'
  | 'values'
  | 'future_message';

export interface MemoryTypeMeta {
  id: MemoryEntryType;
  label: string;
  description: string;
  icon: LucideIcon;
  // Which fields the form should show
  hasRecipient: boolean;
  hasDate: boolean;
  hasRichText: boolean;       // body content uses rich text editor
  hasMediaUpload: 'image' | 'video' | 'audio' | 'images' | 'none';
  hasBucketList?: boolean;
  hasDeliveryNote?: boolean;
}

export const MEMORY_TYPES: MemoryTypeMeta[] = [
  {
    id: 'letter',
    label: 'Personal Letter',
    description: 'A heartfelt letter for someone you love.',
    icon: Mail,
    hasRecipient: true,
    hasDate: true,
    hasRichText: true,
    hasMediaUpload: 'none',
  },
  {
    id: 'advice',
    label: 'Life Advice',
    description: 'Wisdom and lessons to pass on.',
    icon: Lightbulb,
    hasRecipient: false,
    hasDate: false,
    hasRichText: true,
    hasMediaUpload: 'none',
  },
  {
    id: 'memory',
    label: 'Favorite Memory',
    description: 'A moment worth remembering, with an optional photo.',
    icon: ImageIcon,
    hasRecipient: false,
    hasDate: false,
    hasRichText: true,
    hasMediaUpload: 'image',
  },
  {
    id: 'photo_album',
    label: 'Photo Album',
    description: 'A collection of photos with captions.',
    icon: Images,
    hasRecipient: false,
    hasDate: false,
    hasRichText: false,
    hasMediaUpload: 'images',
  },
  {
    id: 'video_message',
    label: 'Video Message',
    description: 'A personal video message (up to 500 MB).',
    icon: Video,
    hasRecipient: true,
    hasDate: false,
    hasRichText: false,
    hasMediaUpload: 'video',
  },
  {
    id: 'voice_note',
    label: 'Voice Note',
    description: 'A recorded message you want them to hear.',
    icon: Mic,
    hasRecipient: true,
    hasDate: false,
    hasRichText: false,
    hasMediaUpload: 'audio',
  },
  {
    id: 'bucket_list',
    label: 'Bucket List',
    description: 'Things you hope to do, or wish for them to do.',
    icon: ListChecks,
    hasRecipient: false,
    hasDate: false,
    hasRichText: false,
    hasMediaUpload: 'none',
    hasBucketList: true,
  },
  {
    id: 'values',
    label: 'Personal Values',
    description: 'What matters most to you.',
    icon: Heart,
    hasRecipient: false,
    hasDate: false,
    hasRichText: true,
    hasMediaUpload: 'none',
  },
  {
    id: 'future_message',
    label: 'Message for Later',
    description: 'A message to be delivered at a future moment.',
    icon: Clock,
    hasRecipient: true,
    hasDate: false,
    hasRichText: true,
    hasMediaUpload: 'none',
    hasDeliveryNote: true,
  },
];

export const MEMORY_TYPE_BY_ID: Record<MemoryEntryType, MemoryTypeMeta> = MEMORY_TYPES.reduce(
  (acc, t) => {
    acc[t.id] = t;
    return acc;
  },
  {} as Record<MemoryEntryType, MemoryTypeMeta>,
);
