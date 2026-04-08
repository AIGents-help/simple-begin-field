import { SectionId } from './types';

export type PlanId = 'free' | 'individual_monthly' | 'individual_annual' | 'couple_monthly' | 'couple_annual' | 'lifetime';

export interface PricingPlan {
  id: PlanId;
  name: string;
  description: string;
  price: number;
  interval: 'month' | 'year' | 'one-time';
  stripePriceId: string;
  features: string[];
  allowedSections: SectionId[] | 'all';
  canUploadFiles: boolean;
  canExportPDF: boolean;
  canInvitePartner: boolean;
  isPopular?: boolean;
  isBestValue?: boolean;
}

export const PRICING_PLANS: PricingPlan[] = [
  {
    id: 'free',
    name: 'Free',
    description: 'Essential features for individuals.',
    price: 0,
    interval: 'month',
    stripePriceId: '',
    features: [
      'Basic Info Section',
      'Family Section',
      'Medical Section',
      'No File Uploads',
      'No PDF Export'
    ],
    allowedSections: ['info', 'family', 'medical'],
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: false
  },
  {
    id: 'individual_monthly',
    name: 'Individual Monthly',
    description: 'Full access for a single user, billed monthly.',
    price: 4.99,
    interval: 'month',
    stripePriceId: 'price_1TIptdA0jdkSunBshrZtu3iG',
    features: [
      'All 14 Sections',
      'Secure File Uploads',
      'PDF Export',
      'Single User'
    ],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false
  },
  {
    id: 'individual_annual',
    name: 'Individual Annual',
    description: 'Full access for a single user, billed annually.',
    price: 39,
    interval: 'year',
    stripePriceId: 'price_1TIpteA0jdkSunBsmHnberoh',
    features: [
      'All 14 Sections',
      'Secure File Uploads',
      'PDF Export',
      'Single User',
      'Save 35% vs Monthly'
    ],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false
  },
  {
    id: 'couple_monthly',
    name: 'Couple Monthly',
    description: 'Full access for two users, billed monthly.',
    price: 7.99,
    interval: 'month',
    stripePriceId: 'price_1TIptdA0jdkSunBsPjIHJxEV',
    features: [
      'Everything in Individual',
      'Invite Partner',
      'Shared Household View'
    ],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    isPopular: true
  },
  {
    id: 'couple_annual',
    name: 'Couple Annual',
    description: 'Full access for two users, billed annually.',
    price: 59,
    interval: 'year',
    stripePriceId: 'price_1TGdsAAkHewDWqI2Q82EVBBn',
    features: [
      'Everything in Individual',
      'Invite Partner',
      'Shared Household View',
      'Save 38% vs Monthly'
    ],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    isPopular: true
  },
  {
    id: 'lifetime',
    name: 'Lifetime',
    description: 'One-time payment for permanent access.',
    price: 97,
    interval: 'one-time',
    stripePriceId: 'price_1TIptfA0jdkSunBsZb8P9155',
    features: [
      'All 14 Sections',
      'Secure File Uploads',
      'PDF Export',
      'One-time Payment',
      'Unlocked Forever'
    ],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    isBestValue: true
  }
];
