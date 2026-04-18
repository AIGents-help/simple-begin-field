import { SectionId } from './types';

export type FeatureTier = 'basic' | 'full';
export type PlanCategory = 'free' | 'individual' | 'couple' | 'family' | 'corporate' | 'gift';

// Legacy union — kept so existing code that imports PlanId still compiles.
// New keys are added; old keys remain for grandfathered subscribers.
export type PlanId =
  | 'free'
  | 'individual_monthly'
  | 'individual_annual'
  | 'couple_monthly'
  | 'couple_annual'
  | 'lifetime'
  | 'basic_single_lifetime'
  | 'full_single_lifetime'
  | 'basic_couple_lifetime'
  | 'full_couple_lifetime'
  | 'basic_family_lifetime'
  | 'full_family_lifetime'
  | 'gift_basic_single'
  | 'gift_full_single'
  | 'gift_basic_couple'
  | 'gift_full_couple'
  | 'corporate_basic'
  | 'corporate_full';

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
  // New tier model
  featureTier: FeatureTier;
  planCategory: PlanCategory;
  seatLimit: number;
  isPopular?: boolean;
  isBestValue?: boolean;
  // Basic → Full upgrade target plan id (for the upgrade-difference flow)
  upgradeTargetId?: PlanId;
  upgradeDifference?: number; // dollars
}

const BASIC_FEATURES = [
  'All 17 sections with structured entry',
  '2GB document storage',
  'Family tree',
  'Professional directory access',
  'Emergency QR card (basic)',
  'Standard PDF download',
  'Trusted contacts (view only)',
  'Document expiration alerts',
  'Haven AI (10 queries/month)',
  '3 custom sections',
];

const FULL_FEATURES = [
  'Everything in Basic',
  'Trusted Contact release portal',
  'Inactivity check-in system',
  'Packet health score',
  'Attorney-ready PDF export',
  'All 10 legal templates',
  'Estate value summary',
  'Unlimited Haven AI',
  'Full Emergency Card + access logging',
  'Memories: video, voice, letters',
  'Couple collaboration tools',
  '10GB storage + priority support',
];

export const PRICING_PLANS: PricingPlan[] = [
  // ── FREE ──────────────────────────────────────────────────────────
  {
    id: 'free',
    name: 'Free',
    description: 'Get started — try the basics.',
    price: 0,
    interval: 'one-time',
    stripePriceId: '',
    features: ['Basic Info, Family & Medical sections', 'No file uploads', 'No PDF export'],
    allowedSections: ['info', 'family', 'medical'],
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: false,
    featureTier: 'basic',
    planCategory: 'free',
    seatLimit: 1,
  },
  // ── INDIVIDUAL ────────────────────────────────────────────────────
  {
    id: 'basic_single_lifetime',
    name: 'Basic Single',
    description: 'One payment. Yours forever.',
    price: 97,
    interval: 'one-time',
    stripePriceId: '',
    features: BASIC_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'basic',
    planCategory: 'individual',
    seatLimit: 1,
    upgradeTargetId: 'full_single_lifetime',
    upgradeDifference: 100,
  },
  {
    id: 'full_single_lifetime',
    name: 'Full Feature Single',
    description: 'Everything you need, forever.',
    price: 197,
    interval: 'one-time',
    stripePriceId: '',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'individual',
    seatLimit: 1,
    isPopular: true,
  },
  // ── COUPLE ────────────────────────────────────────────────────────
  {
    id: 'basic_couple_lifetime',
    name: 'Basic Couple',
    description: 'Two linked accounts.',
    price: 147,
    interval: 'one-time',
    stripePriceId: '',
    features: BASIC_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'basic',
    planCategory: 'couple',
    seatLimit: 2,
    upgradeTargetId: 'full_couple_lifetime',
    upgradeDifference: 102,
  },
  {
    id: 'full_couple_lifetime',
    name: 'Full Feature Couple',
    description: 'Two accounts + collaboration.',
    price: 249,
    interval: 'one-time',
    stripePriceId: '',
    features: [...FULL_FEATURES, 'Combined family tree', 'Beneficiary alignment'],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'full',
    planCategory: 'couple',
    seatLimit: 2,
    isPopular: true,
  },
  // ── FAMILY ────────────────────────────────────────────────────────
  {
    id: 'basic_family_lifetime',
    name: 'Basic Family',
    description: 'Up to 6 members.',
    price: 297,
    interval: 'one-time',
    stripePriceId: '',
    features: [...BASIC_FEATURES, 'Up to 6 independent packets', 'Family plan management'],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'basic',
    planCategory: 'family',
    seatLimit: 6,
    upgradeTargetId: 'full_family_lifetime',
    upgradeDifference: 200,
  },
  {
    id: 'full_family_lifetime',
    name: 'Full Feature Family',
    description: 'Up to 6 members + full features.',
    price: 497,
    interval: 'one-time',
    stripePriceId: '',
    features: [...FULL_FEATURES, 'Up to 6 independent packets', 'Family plan management'],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'full',
    planCategory: 'family',
    seatLimit: 6,
    isBestValue: true,
  },
  // ── GIFT ──────────────────────────────────────────────────────────
  {
    id: 'gift_basic_single',
    name: 'Gift — Basic Single',
    description: 'A lifetime gift.',
    price: 97,
    interval: 'one-time',
    stripePriceId: '',
    features: ['Basic Single Lifetime', 'Personal message', 'Schedule delivery'],
    allowedSections: 'all',
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: false,
    featureTier: 'basic',
    planCategory: 'gift',
    seatLimit: 1,
  },
  {
    id: 'gift_full_single',
    name: 'Gift — Full Feature Single',
    description: 'The complete gift.',
    price: 197,
    interval: 'one-time',
    stripePriceId: '',
    features: ['Full Feature Single Lifetime', 'Personal message', 'Schedule delivery'],
    allowedSections: 'all',
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'gift',
    seatLimit: 1,
  },
  {
    id: 'gift_basic_couple',
    name: 'Gift — Basic Couple',
    description: 'For two people you love.',
    price: 147,
    interval: 'one-time',
    stripePriceId: '',
    features: ['Basic Couple Lifetime', 'Personal message', 'Schedule delivery'],
    allowedSections: 'all',
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: true,
    featureTier: 'basic',
    planCategory: 'gift',
    seatLimit: 2,
  },
  {
    id: 'gift_full_couple',
    name: 'Gift — Full Feature Couple',
    description: 'The ultimate gift for two.',
    price: 249,
    interval: 'one-time',
    stripePriceId: '',
    features: ['Full Feature Couple Lifetime', 'Personal message', 'Schedule delivery'],
    allowedSections: 'all',
    canUploadFiles: false,
    canExportPDF: false,
    canInvitePartner: true,
    featureTier: 'full',
    planCategory: 'gift',
    seatLimit: 2,
  },
  // ── CORPORATE (per-seat) ──────────────────────────────────────────
  {
    id: 'corporate_basic',
    name: 'Corporate Basic',
    description: 'Basic tier, billed per seat.',
    price: 75,
    interval: 'one-time',
    stripePriceId: '',
    features: [...BASIC_FEATURES, 'Min 10 seats', '20% off at 50+ seats'],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'basic',
    planCategory: 'corporate',
    seatLimit: 1,
  },
  {
    id: 'corporate_full',
    name: 'Corporate Full Feature',
    description: 'Full features, billed per seat.',
    price: 150,
    interval: 'one-time',
    stripePriceId: '',
    features: [...FULL_FEATURES, 'Min 10 seats', '20% off at 50+ seats'],
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'corporate',
    seatLimit: 1,
  },
  // ── LEGACY (grandfathered subscribers) ────────────────────────────
  {
    id: 'individual_monthly',
    name: 'Individual Monthly (legacy)',
    description: 'Existing subscribers only.',
    price: 4.99,
    interval: 'month',
    stripePriceId: 'price_1TIptdA0jdkSunBshrZtu3iG',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'individual',
    seatLimit: 1,
  },
  {
    id: 'individual_annual',
    name: 'Individual Annual (legacy)',
    description: 'Existing subscribers only.',
    price: 39,
    interval: 'year',
    stripePriceId: 'price_1TIpteA0jdkSunBsmHnberoh',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'individual',
    seatLimit: 1,
  },
  {
    id: 'couple_monthly',
    name: 'Couple Monthly (legacy)',
    description: 'Existing subscribers only.',
    price: 7.99,
    interval: 'month',
    stripePriceId: 'price_1TIptdA0jdkSunBsPjIHJxEV',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'full',
    planCategory: 'couple',
    seatLimit: 2,
  },
  {
    id: 'couple_annual',
    name: 'Couple Annual (legacy)',
    description: 'Existing subscribers only.',
    price: 59,
    interval: 'year',
    stripePriceId: 'price_1TIptdA0jdkSunBsgyBKhEv7',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: true,
    featureTier: 'full',
    planCategory: 'couple',
    seatLimit: 2,
  },
  {
    id: 'lifetime',
    name: 'Lifetime (legacy)',
    description: 'Existing customers only.',
    price: 97,
    interval: 'one-time',
    stripePriceId: 'price_1TIptfA0jdkSunBsZb8P9155',
    features: FULL_FEATURES,
    allowedSections: 'all',
    canUploadFiles: true,
    canExportPDF: true,
    canInvitePartner: false,
    featureTier: 'full',
    planCategory: 'individual',
    seatLimit: 1,
  },
];

// Plans visible on the public pricing page (legacy plans hidden)
export const PUBLIC_PLANS = PRICING_PLANS.filter(
  (p) => !p.name.includes('legacy'),
);

export const getPlansByCategory = (cat: PlanCategory) =>
  PUBLIC_PLANS.filter((p) => p.planCategory === cat);

// FULL_FEATURE feature keys gated by feature_tier === 'full'
export type FullFeatureKey =
  | 'trusted_release'
  | 'inactivity_checkin'
  | 'health_score'
  | 'attorney_pdf'
  | 'legal_templates'
  | 'estate_summary'
  | 'haven_unlimited'
  | 'emergency_full'
  | 'memories_media'
  | 'couple_collab';
