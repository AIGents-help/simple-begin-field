import { 
  User, 
  Users, 
  Home as HomeIcon, 
  CreditCard, 
  Briefcase, 
  Car, 
  ShieldCheck, 
  Key, 
  Package, 
  Heart, 
  Flower2, 
  Lock,
  Activity,
  Share2,
  Sparkles,
  TrendingUp
} from 'lucide-react';
import { Section, SectionId } from './types';

export const SECTIONS_CONFIG: Section[] = [
  {
    id: 'info',
    label: 'Info',
    icon: User,
    description: 'General notes, instructions & important details',
    emptyStateText: 'No personal documents added yet.',
    addButtonLabel: 'Add Document'
  },
  {
    id: 'family',
    label: 'Family',
    icon: Users,
    description: 'Spouse, children, parents & family contacts',
    emptyStateText: 'No family members listed yet.',
    addButtonLabel: 'Add Family Member'
  },
  {
    id: 'medical',
    label: 'Medical',
    icon: Activity,
    description: 'Doctors, medications, insurance & health directives',
    emptyStateText: 'No medical information added yet.',
    addButtonLabel: 'Add Medical Info'
  },
  {
    id: 'real-estate',
    label: 'Real Estate',
    icon: HomeIcon,
    description: 'Properties, mortgages, utilities & home details',
    emptyStateText: 'No properties listed yet.',
    addButtonLabel: 'Add Property'
  },
  {
    id: 'banking',
    label: 'Banking',
    icon: CreditCard,
    description: 'Checking, savings & everyday accounts',
    emptyStateText: 'No bank accounts added yet.',
    addButtonLabel: 'Add Account'
  },
  {
    id: 'investments',
    label: 'Investments',
    icon: TrendingUp,
    description: 'Brokerage, crypto, stocks & private holdings',
    emptyStateText: 'No investment accounts added yet.',
    addButtonLabel: 'Add Account'
  },
  {
    id: 'retirement',
    label: 'Retirement',
    icon: Briefcase,
    description: '401k, IRA, pension & tax-advantaged accounts',
    emptyStateText: 'No retirement accounts listed yet.',
    addButtonLabel: 'Add Account'
  },
  {
    id: 'vehicles',
    label: 'Vehicles',
    icon: Car,
    description: 'Cars, boats, titles, insurance & loans',
    emptyStateText: 'No vehicles added yet.',
    addButtonLabel: 'Add Vehicle'
  },
  {
    id: 'advisors',
    label: 'Advisors',
    icon: ShieldCheck,
    description: 'Attorney, CPA, financial advisor & key contacts',
    emptyStateText: 'No advisors listed yet.',
    addButtonLabel: 'Add Advisor'
  },
  {
    id: 'passwords',
    label: 'Passwords',
    icon: Key,
    description: 'Login credentials & digital account access',
    emptyStateText: 'No passwords saved yet.',
    addButtonLabel: 'Add Password'
  },
  {
    id: 'property',
    label: 'Personal Property & Collectibles',
    icon: Package,
    description: 'Jewelry, art, collections & valued possessions',
    emptyStateText: 'No personal property or collectibles listed yet.',
    addButtonLabel: 'Add Item'
  },
  {
    id: 'pets',
    label: 'Pets',
    icon: Heart,
    description: 'Pet profiles, vet info & care instructions',
    emptyStateText: 'No pets added yet.',
    addButtonLabel: 'Add Pet'
  },
  {
    id: 'funeral',
    label: 'Funeral',
    icon: Flower2,
    description: 'Final wishes, arrangements & service instructions',
    emptyStateText: 'No funeral preferences saved yet.',
    addButtonLabel: 'Add Preference'
  },
  {
    id: 'memories',
    label: 'Memories',
    icon: Sparkles,
    description: 'Letters, photos, videos & messages for loved ones',
    emptyStateText: 'No memories added yet.',
    addButtonLabel: 'Add Memory'
  },
  {
    id: 'private',
    label: 'Private',
    icon: Lock,
    description: 'Sensitive or hidden items for trusted eyes only',
    emptyStateText: 'No private items added yet.',
    addButtonLabel: 'Add Private Item'
  },
  {
    id: 'affiliate',
    label: 'Affiliate',
    icon: Share2,
    description: 'Referral tracking and attribution.',
    emptyStateText: 'No affiliate records yet.',
    addButtonLabel: 'Add Affiliate'
  },
];
