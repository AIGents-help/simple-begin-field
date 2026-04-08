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
  Share2
} from 'lucide-react';
import { Section, SectionId } from './types';

export const SECTIONS_CONFIG: Section[] = [
  { 
    id: 'info', 
    label: 'Info', 
    icon: User, 
    description: 'Critical personal legal and identity documents.',
    emptyStateText: 'No personal documents added yet.',
    addButtonLabel: 'Add Document'
  },
  { 
    id: 'family', 
    label: 'Family', 
    icon: Users, 
    description: 'Important family contacts and relationship details.',
    emptyStateText: 'No family members listed yet.',
    addButtonLabel: 'Add Family Member'
  },
  { 
    id: 'medical', 
    label: 'Medical', 
    icon: Activity, 
    description: 'Health history, medications, and insurance.',
    emptyStateText: 'No medical information added yet.',
    addButtonLabel: 'Add Medical Info'
  },
  { 
    id: 'real-estate', 
    label: 'Real Estate', 
    icon: HomeIcon, 
    description: 'Properties and related documents/accounts.',
    emptyStateText: 'No properties listed yet.',
    addButtonLabel: 'Add Property'
  },
  { 
    id: 'banking', 
    label: 'Banking', 
    icon: CreditCard, 
    description: 'Bank account records and related notes.',
    emptyStateText: 'No bank accounts added yet.',
    addButtonLabel: 'Add Account'
  },
  { 
    id: 'retirement', 
    label: 'Retirement', 
    icon: Briefcase, 
    description: 'IRA, 401(k), and other retirement accounts.',
    emptyStateText: 'No retirement accounts listed yet.',
    addButtonLabel: 'Add Account'
  },
  { 
    id: 'vehicles', 
    label: 'Vehicles', 
    icon: Car, 
    description: 'Vehicle records, VINs, and insurance.',
    emptyStateText: 'No vehicles added yet.',
    addButtonLabel: 'Add Vehicle'
  },
  { 
    id: 'advisors', 
    label: 'Advisors', 
    icon: ShieldCheck, 
    description: 'Professional contacts like lawyers and accountants.',
    emptyStateText: 'No advisors listed yet.',
    addButtonLabel: 'Add Advisor'
  },
  { 
    id: 'passwords', 
    label: 'Passwords', 
    icon: Key, 
    description: 'Critical access information and instructions.',
    emptyStateText: 'No passwords saved yet.',
    addButtonLabel: 'Add Password'
  },
  { 
    id: 'property', 
    label: 'Property', 
    icon: Package, 
    description: 'Meaningful assets and intended recipients.',
    emptyStateText: 'No personal property listed yet.',
    addButtonLabel: 'Add Item'
  },
  { 
    id: 'pets', 
    label: 'Pets', 
    icon: Heart, 
    description: 'Care instructions and emergency info for pets.',
    emptyStateText: 'No pets added yet.',
    addButtonLabel: 'Add Pet'
  },
  { 
    id: 'funeral', 
    label: 'Funeral', 
    icon: Flower2, 
    description: 'Individual and shared funeral preferences.',
    emptyStateText: 'No funeral preferences saved yet.',
    addButtonLabel: 'Add Preference'
  },
  { 
    id: 'private', 
    label: 'Private', 
    icon: Lock, 
    description: 'Restricted visibility items with access control.',
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
