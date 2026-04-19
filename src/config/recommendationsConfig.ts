import { SectionId } from './types';

export interface RecommendationItem {
  label: string;
  prefill?: any;
}

export interface SectionRecommendations {
  entries: RecommendationItem[];
  documents: RecommendationItem[];
  contacts: RecommendationItem[];
  considerations: string[];
  /** Optional about content for sections using the new "About This Section" format */
  aboutContent?: {
    paragraphs: string[];
  };
}

export const RECOMMENDATIONS_CONFIG: Partial<Record<SectionId, SectionRecommendations>> = {
  info: {
    aboutContent: {
      paragraphs: [
        "The Info section is a flexible space for general notes, instructions, and important details that don't fit neatly into another section.",
        "Use it for household instructions, subscription lists, recurring bills, digital account notes, utility providers, home systems details (alarm codes, appliance manuals, maintenance schedules), or anything else a trusted person would need to know.",
        "If something is important enough to document but doesn't belong in a specific section, it belongs here."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  family: {
    aboutContent: {
      paragraphs: [
        "The Family section is your household and relationship map. Each person gets their own entry — tap \"+ Add Family Member\" to get started.",
        "For each person, you can record their contact details, relationship to you, important dates, and any relevant notes. Documents like guardianship papers or custody agreements can be attached directly to the person they apply to.",
        "Think about everyone a trusted person would need to reach on your behalf: immediate family, extended relatives, dependents, and anyone who would need to be notified or involved if something happened to you.",
        "You can also switch to Tree View to see your family visually organized by relationship."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  medical: {
    aboutContent: {
      paragraphs: [
        "The Medical section keeps your health information accessible to those who may need it in an emergency or when managing your care.",
        "Add entries for your doctors, health insurance plans, medications, allergies, and any surgical history. For each provider, include their contact information and what they treat you for. For insurance, note the policy numbers and where to find the cards.",
        "Be specific about medications — include dosage, frequency, and prescribing doctor. For allergies, note the reaction severity. This information could be critical in an emergency.",
        "Upload relevant documents like insurance cards, advance directives, or medical power of attorney to the appropriate entries."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  'real-estate': {
    aboutContent: {
      paragraphs: [
        "The Real Estate section captures every property you own or have a financial interest in — primary residence, vacation homes, rental properties, land, or timeshares.",
        "For each property, record the address, how it's titled (sole owner, joint tenancy, trust, etc.), mortgage lender and loan details, property tax information, and where the deed is stored. Upload your deed, mortgage statement, and insurance policy directly to each entry.",
        "Think about who would need to make payments, access the property, or manage a sale if something happened to you. Note the property manager if you have one, and any tenant details for rentals.",
        "Your homeowner's or landlord's insurance agent belongs in the Advisors section — you can reference them by name here."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  banking: {
    aboutContent: {
      paragraphs: [
        "The Banking section keeps track of every account a trusted person would need to locate and access on your behalf. Accounts are grouped by institution so everything at one bank stays together.",
        "Start by adding an institution — a bank, credit union, or financial platform. Then add each account within it: checking, savings, money market, CD, or any other account type. Each account gets its own entry with account number, type, and access details.",
        "For each account, record what a trusted person needs to know: where to find statements, whether online banking is set up, and any relevant notes. Upload account documents directly to the entry they belong to.",
        "If you have joint accounts, note the other account holder by name. If you have accounts at online-only banks or fintech platforms (like Venmo, PayPal, or CashApp), add them here too."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  investments: {
    aboutContent: {
      paragraphs: [
        "The Investments section covers brokerage accounts, stocks, crypto, and any private holdings outside of your regular banking and retirement accounts.",
        "For each account or holding, record the institution or platform, account number, approximate value, and how to access it. Upload statements or account documents directly to each entry.",
        "Beneficiary designations on investment accounts often override your will — make sure they are current and reflect your actual wishes. Note who the designated beneficiaries are in each entry.",
        "Your financial advisor's contact information belongs in the Advisors section, but you can reference them by name in each investment entry."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  retirement: {
    aboutContent: {
      paragraphs: [
        "The Retirement section covers tax-advantaged accounts set aside for your future — 401(k), IRA, Roth IRA, 403(b), pension plans, and similar accounts.",
        "For each account, record the institution, account number, approximate balance, and how to access it. Note whether the account is currently active or from a previous employer.",
        "Beneficiary designations on retirement accounts are legally separate from your will and override it. Make sure each account has a current primary and contingent beneficiary on file — and note who that is in each entry here.",
        "If you have a pension with survivor benefit options, note the elected option and who the named survivor is."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  vehicles: {
    aboutContent: {
      paragraphs: [
        "The Vehicles section tracks every motorized asset you own or finance — cars, trucks, motorcycles, boats, RVs, ATVs, and trailers. Include leased vehicles as well.",
        "For each vehicle, record the year, make, model, VIN, license plate, lender and loan details if financed, and where the title is stored. Note where the vehicle is physically kept if it's not at your primary address.",
        "Upload your title, registration, and insurance card to each entry. Your insurance agent's contact details belong in the Advisors section — reference them by name here.",
        "Think about who would need to access, move, or sell each vehicle if something happened to you. Note any special instructions for care or disposition."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  advisors: {
    aboutContent: {
      paragraphs: [
        "The Advisors section is your professional contact directory — every person whose expertise you rely on and who a trusted person might need to reach on your behalf.",
        "Add an entry for each advisor: attorney, CPA or accountant, financial advisor, insurance agent, banker, real estate agent, doctor, therapist, or anyone else managing something important for you.",
        "For each entry, record their name, firm, phone, email, and what they handle for you. Note where relevant documents they've prepared are stored — for example, your attorney likely holds your original will.",
        "Keep this section current. Outdated advisor information can cause significant delays when someone needs to act on your behalf."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  passwords: {
    aboutContent: {
      paragraphs: [
        "The Passwords section stores login credentials and access instructions for accounts a trusted person would need to reach — email, financial platforms, social media, utilities, subscription services, and anything with automatic payments or important data.",
        "For each entry, record the service name, username or email, and either the password or instructions for how to access it (such as a password manager location or a safe where credentials are stored).",
        "This section is encrypted and restricted. You control exactly who can see it through your sharing settings. Only include what is genuinely necessary — think about what would cause problems if it were inaccessible, not just forgotten.",
        "Review this section periodically. Passwords change, services close, and new accounts are created. Keeping it current ensures it will actually be useful when needed."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  property: {
    aboutContent: {
      paragraphs: [
        "The Personal Property section documents high-value, sentimental, or notable items that need to be specifically accounted for — jewelry, art, antiques, collectibles, firearms, musical instruments, or anything with significant monetary or personal meaning.",
        "For each item, record a description, estimated value, where it is located, and any relevant provenance or history. Upload photos and appraisals directly to each entry.",
        "Note any items that are specifically designated to a person in your will or that you intend as a gift. If items are insured under a rider, reference the policy here.",
        "Think about what would be lost, misplaced, or disputed without clear documentation. This section ensures your most meaningful possessions are accounted for."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  // pets: intentionally omitted — Pets uses a dedicated multi-pet
  // profile UI (see src/sections/PetsSection.tsx) instead of chips.
  funeral: {
    aboutContent: {
      paragraphs: [
        "The Funeral section lets you record your wishes for end-of-life arrangements so your loved ones are not left guessing during an already difficult time.",
        "Record your preferences for burial or cremation, service type, location, music, readings, or any other specific wishes. Note whether you have a pre-paid funeral plan and where that documentation is stored.",
        "Include your wishes for obituary and who should be notified. If you have a letter of final instructions, upload it here. These are your wishes — be as specific or as open as you choose.",
        "This section is a gift to those you leave behind. Clear guidance now prevents painful uncertainty later."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
  private: {
    aboutContent: {
      paragraphs: [
        "The Private section is for sensitive information you want stored in your packet but kept completely separate from your general sharing settings.",
        "Use it for information that is private by nature — personal notes, sensitive disclosures, or anything you want accessible only to a specifically designated person, not your general trusted contacts.",
        "Access to this section is controlled separately. Only people you explicitly authorize can view its contents, regardless of your other sharing permissions.",
        "Be thoughtful about what belongs here. This section is for information that requires an extra layer of privacy and control."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  },
};