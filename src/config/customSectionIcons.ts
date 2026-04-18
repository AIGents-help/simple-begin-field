import {
  Folder,
  Star,
  BookOpen,
  Briefcase,
  Camera,
  Compass,
  Gift,
  Globe,
  Headphones,
  Leaf,
  MapPin,
  Music,
  Palette,
  Plane,
  Trophy,
} from 'lucide-react';

export const CUSTOM_SECTION_ICONS = {
  Folder,
  Star,
  BookOpen,
  Briefcase,
  Camera,
  Compass,
  Gift,
  Globe,
  Headphones,
  Leaf,
  MapPin,
  Music,
  Palette,
  Plane,
  Trophy,
} as const;

export type CustomSectionIconName = keyof typeof CUSTOM_SECTION_ICONS;

export const CUSTOM_SECTION_ICON_NAMES = Object.keys(CUSTOM_SECTION_ICONS) as CustomSectionIconName[];

export const getCustomSectionIcon = (name: string) => {
  return (CUSTOM_SECTION_ICONS as Record<string, any>)[name] ?? Folder;
};
