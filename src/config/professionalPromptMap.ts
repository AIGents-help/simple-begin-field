import type { SectionId } from './types';

/**
 * Maps each section (and optionally a record-specific matcher) to a search
 * term used to pre-populate the Find a Professional directory.
 *
 * Two layers:
 *  - `defaultQuery`: used when the section is empty as a whole (no records)
 *  - `recordMatchers`: matched against a single record (by category, title,
 *    advisor_type, account_type, etc.) when that record is N/A or empty
 */

export interface SectionPromptConfig {
  /** Search term for an empty section card (no records added yet) */
  defaultQuery?: string;
  /** Per-record matchers for N/A records or category-specific empty slots */
  recordMatchers?: RecordMatcher[];
}

export interface RecordMatcher {
  /** Lowercase substrings tested against the record's category / title / type fields */
  match: string[];
  query: string;
}

export const PROFESSIONAL_PROMPT_MAP: Partial<Record<SectionId, SectionPromptConfig>> = {
  info: {
    recordMatchers: [
      { match: ['will'], query: 'Estate Planning Attorney' },
      { match: ['trust'], query: 'Trust Attorney' },
      { match: ['financial poa', 'financial power of attorney'], query: 'Estate Planning Attorney' },
      { match: ['healthcare poa', 'medical poa', 'hcpoa'], query: 'Elder Law Attorney' },
      { match: ['living will', 'advance directive'], query: 'Elder Law Attorney' },
      { match: ['passport'], query: 'Passport Services' },
      { match: ['notary'], query: 'Notary Public' },
    ],
  },
  banking: {
    defaultQuery: 'Financial Advisor',
    recordMatchers: [
      { match: ['safe deposit'], query: 'Banking Services' },
    ],
  },
  investments: {
    defaultQuery: 'Financial Advisor',
    recordMatchers: [
      { match: ['brokerage'], query: 'Financial Advisor' },
      { match: ['crypto'], query: 'Crypto Financial Advisor' },
      { match: ['private equity', 'angel'], query: 'Investment Advisor' },
    ],
  },
  retirement: {
    defaultQuery: 'Financial Advisor',
    recordMatchers: [
      { match: ['401', 'ira', 'roth'], query: 'Financial Advisor' },
      { match: ['pension'], query: 'Benefits Advisor' },
    ],
  },
  medical: {
    defaultQuery: 'Primary Care Physician',
    recordMatchers: [
      { match: ['primary'], query: 'Primary Care Physician' },
      { match: ['specialist'], query: 'Medical Specialist' },
      { match: ['mental', 'therapist', 'psych'], query: 'Therapist' },
      { match: ['insurance'], query: 'Health Insurance Broker' },
    ],
  },
  'real-estate': {
    defaultQuery: 'Realtor',
    recordMatchers: [
      { match: ['mortgage'], query: 'Mortgage Broker' },
      { match: ['property management', 'rental'], query: 'Property Manager' },
    ],
  },
  advisors: {
    defaultQuery: 'Attorney',
    recordMatchers: [
      { match: ['attorney', 'lawyer'], query: 'Attorney' },
      { match: ['cpa', 'accountant', 'tax'], query: 'Certified Public Accountant' },
      { match: ['financial advisor'], query: 'Financial Advisor' },
      { match: ['insurance'], query: 'Insurance Agent' },
    ],
  },
  funeral: {
    defaultQuery: 'Funeral Home',
    recordMatchers: [
      { match: ['grief', 'counsel'], query: 'Grief Counselor' },
    ],
  },
  pets: {
    defaultQuery: 'Veterinarian',
    recordMatchers: [
      { match: ['boarding'], query: 'Pet Boarding' },
    ],
  },
  property: {
    defaultQuery: 'Personal Property Appraiser',
    recordMatchers: [
      { match: ['firearm', 'gun', 'weapon'], query: 'Licensed Firearms Dealer' },
      { match: ['art', 'painting'], query: 'Art Appraiser' },
      { match: ['jewelry', 'watch'], query: 'Jewelry Appraiser' },
    ],
  },
  vehicles: {
    recordMatchers: [
      { match: ['insurance'], query: 'Auto Insurance Agent' },
    ],
  },
};

/**
 * Resolve the best query for a record by checking record fields against the
 * section's matchers. Falls back to defaultQuery if nothing specific matches.
 */
export function resolveRecordQuery(sectionId: SectionId, record: any): string | null {
  const config = PROFESSIONAL_PROMPT_MAP[sectionId];
  if (!config) return null;

  // Build a haystack from common identifying fields
  const haystack = [
    record?.category,
    record?.title,
    record?.name,
    record?.item_name,
    record?.institution,
    record?.service_name,
    record?.advisor_type,
    record?.account_type,
    record?.provider_name,
    record?.specialty,
    record?.property_label,
    record?.firm,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (config.recordMatchers && haystack) {
    for (const matcher of config.recordMatchers) {
      if (matcher.match.some(m => haystack.includes(m))) {
        return matcher.query;
      }
    }
  }

  return config.defaultQuery ?? null;
}

/** Resolve query for a section as a whole (empty state). */
export function resolveSectionQuery(sectionId: SectionId): string | null {
  return PROFESSIONAL_PROMPT_MAP[sectionId]?.defaultQuery ?? null;
}
