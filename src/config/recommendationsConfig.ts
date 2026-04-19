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
    entries: [
      { label: "Driver's License", prefill: { category: 'drivers_license' } },
      { label: 'Passport', prefill: { category: 'passport' } },
      { label: 'Social Security Card', prefill: { category: 'social_security' } },
      { label: 'Birth Certificate', prefill: { category: 'birth_certificate' } },
      { label: 'Citizenship Papers', prefill: { category: 'citizenship' } },
      { label: 'Global Entry / TSA Precheck', prefill: { category: 'other_government_id', details: { id_type: 'Global Entry' } } },
      { label: 'State ID', prefill: { category: 'other_government_id', details: { id_type: 'State ID' } } },
      { label: 'Military ID', prefill: { category: 'other_government_id', details: { id_type: 'Military ID' } } },
    ],
    documents: [
      { label: "Driver's License", prefill: { title: "Driver's License", category: 'Identity' } },
      { label: 'Passport', prefill: { title: 'Passport', category: 'Identity' } },
      { label: 'Birth Certificate', prefill: { title: 'Birth Certificate', category: 'Identity' } },
      { label: 'Social Security Card', prefill: { title: 'Social Security Card', category: 'Identity' } },
      { label: 'Citizenship Papers', prefill: { title: 'Citizenship Papers', category: 'Identity' } },
    ],
    contacts: [
      { label: 'Primary Emergency Contact', prefill: { name: 'Primary Emergency Contact' } },
      { label: 'Secondary Emergency Contact', prefill: { name: 'Secondary Emergency Contact' } },
    ],
    considerations: [
      'Where are the physical originals stored?',
      'What identity documents are expired or expiring?',
      'Who should access these first?',
      'Is your organ donor status documented?',
    ]
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
    entries: [
      { label: 'Primary Care Doctor', prefill: { record_type: 'doctor', details: { provider_type: 'Primary Care' } } },
      { label: 'Specialist', prefill: { record_type: 'doctor', details: { provider_type: 'Other specialist' } } },
      { label: 'Health Insurance', prefill: { record_type: 'insurance', details: { insurance_type: 'Health' } } },
      { label: 'Medication', prefill: { record_type: 'medication' } },
      { label: 'Allergy', prefill: { record_type: 'allergy' } },
      { label: 'Dental Insurance', prefill: { record_type: 'insurance', details: { insurance_type: 'Dental' } } },
      { label: 'Vision Insurance', prefill: { record_type: 'insurance', details: { insurance_type: 'Vision' } } },
      { label: 'Surgical History', prefill: { record_type: 'surgery' } },
    ],
    // Per-card document uploads attach directly to each card; no standalone document chips.
    documents: [],
    contacts: [
      { label: 'Primary Doctor', prefill: { name: 'Primary Doctor' } },
      { label: 'Specialists', prefill: { name: 'Specialist' } },
      { label: 'Pharmacy', prefill: { name: 'Pharmacy' } },
      { label: 'Insurance Provider', prefill: { name: 'Insurance Provider' } },
      { label: 'Emergency Medical Contact', prefill: { name: 'Emergency Medical Contact' } },
    ],
    considerations: [
      'Treatment preferences',
      'Who may speak to doctors',
      'Preferred hospital system',
      'Organ donation wishes',
      'Life support / DNR preferences if applicable',
    ]
  },
  'real-estate': {
    entries: [
      { label: 'Primary Residence', prefill: { property_label: 'Primary Residence' } },
      { label: 'Vacation Property', prefill: { property_label: 'Vacation Property' } },
      { label: 'Rental Property', prefill: { property_label: 'Rental Property' } },
      { label: 'Commercial Property', prefill: { property_label: 'Commercial Property' } },
      { label: 'Land Parcel', prefill: { property_label: 'Land Parcel' } },
    ],
    // Deed, Mortgage, Title, Insurance, Tax, HOA, and Lease docs are attached
    // directly to each property record (see RECORD_DOC_SLOTS in AddEditSheet).
    documents: [],
    contacts: [],
    considerations: [
      'Which bills must remain paid?',
      'Alarm / access instructions',
      'Hidden maintenance issues',
      'Where keys or codes are kept?',
    ]
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
    entries: [
      { label: 'IRA', prefill: { account_type: 'IRA' } },
      { label: 'Roth IRA', prefill: { account_type: 'Roth IRA' } },
      { label: '401(k)', prefill: { account_type: '401(k)' } },
      { label: '403(b)', prefill: { account_type: '403(b)' } },
      { label: 'Pension', prefill: { account_type: 'Pension' } },
      { label: 'Annuity', prefill: { account_type: 'Annuity' } },
      { label: 'SEP IRA', prefill: { account_type: 'SEP IRA' } },
    ],
    documents: [
      { label: 'Recent Account Statements', prefill: { institution: 'Retirement Statement' } },
      { label: 'Beneficiary Forms', prefill: { institution: 'Beneficiary Form' } },
      { label: 'Pension Documents', prefill: { institution: 'Pension Documents' } },
      { label: 'Plan Summary Documents', prefill: { institution: 'Plan Summary' } },
    ],
    contacts: [
      { label: 'Plan Administrator', prefill: { name: 'Plan Administrator' } },
      { label: 'Retirement Advisor', prefill: { name: 'Retirement Advisor' } },
      { label: 'Employer Benefits Contact', prefill: { name: 'Employer Benefits' } },
    ],
    considerations: [
      'Whether beneficiaries are current',
      'Which plans are old / forgotten?',
      'Rollover notes',
      'Required contact order for survivors',
    ]
  },
  vehicles: {
    entries: [
      { label: 'Car', prefill: { model: 'Car' } },
      { label: 'Truck', prefill: { model: 'Truck' } },
      { label: 'Motorcycle', prefill: { model: 'Motorcycle' } },
      { label: 'RV', prefill: { model: 'RV' } },
      { label: 'Boat', prefill: { model: 'Boat' } },
      { label: 'VIN', prefill: { vin: 'VIN' } },
      { label: 'Plate Number', prefill: { license_plate: 'Plate Number' } },
      { label: 'Insurance', prefill: { insurance: 'Insurance' } },
      { label: 'Loan / Lien Details', prefill: { lien_info: 'Loan Details' } },
    ],
    // Title, Registration, Insurance Card, and Loan Documents are attached
    // directly to each vehicle record (see RECORD_DOC_SLOTS in AddEditSheet).
    documents: [
      { label: 'Service Records', prefill: { model: 'Service Records' } },
    ],
    contacts: [
      { label: 'Insurance Provider', prefill: { name: 'Insurance Provider' } },
      { label: 'Lender', prefill: { name: 'Lender' } },
      { label: 'Mechanic', prefill: { name: 'Mechanic' } },
      { label: 'Roadside Assistance', prefill: { name: 'Roadside Assistance' } },
    ],
    considerations: [
      'Where spare keys are kept?',
      'Which vehicles are paid off?',
      'Which vehicle someone else should keep or sell?',
      'Maintenance issues',
    ]
  },
  advisors: {
    entries: [
      { label: 'Attorney', prefill: { advisor_type: 'Attorney' } },
      { label: 'Financial Advisor', prefill: { advisor_type: 'Financial Advisor' } },
      { label: 'CPA / Accountant', prefill: { advisor_type: 'CPA/Accountant' } },
      { label: 'Insurance Agent', prefill: { advisor_type: 'Insurance Agent' } },
      { label: 'Doctor', prefill: { advisor_type: 'Doctor' } },
    ],
    documents: [
      { label: 'Engagement Letters', prefill: { title: 'Engagement Letter' } },
      { label: 'Planning Summaries', prefill: { title: 'Planning Summary' } },
      { label: 'Important Correspondence', prefill: { title: 'Correspondence' } },
      { label: 'Advisor Account Summaries', prefill: { title: 'Account Summary' } },
    ],
    contacts: [
      { label: 'Attorney', prefill: { name: 'Attorney' } },
      { label: 'CPA', prefill: { name: 'CPA' } },
      { label: 'Financial Planner', prefill: { name: 'Financial Planner' } },
      { label: 'Insurance Contact', prefill: { name: 'Insurance Contact' } },
      { label: 'Other Trusted Professional', prefill: { name: 'Trusted Professional' } },
    ],
    considerations: [
      'Who should be contacted first?',
      'Which advisor handles what?',
      'Which relationships are current vs outdated?',
    ]
  },
  passwords: {
    entries: [
      { label: 'Bank Access Instructions', prefill: { service_name: 'Bank Access' } },
      { label: 'Email Access Instructions', prefill: { service_name: 'Email Access' } },
      { label: 'Phone Access Instructions', prefill: { service_name: 'Phone Access' } },
      { label: 'Cloud Storage Access', prefill: { service_name: 'Cloud Storage Access' } },
      { label: 'Social Media Access', prefill: { service_name: 'Social Media Access' } },
      { label: 'Device Passcode Location', prefill: { service_name: 'Device Passcode Location' } },
      { label: '2FA Guidance', prefill: { service_name: '2FA Guidance' } },
      { label: 'Recovery Email Info', prefill: { service_name: 'Recovery Email Info' } },
    ],
    documents: [
      { label: 'Master Password Location Note', prefill: { title: 'Master Password Note' } },
      { label: 'Recovery Code Storage Note', prefill: { title: 'Recovery Code Note' } },
      { label: 'Device Inventory', prefill: { title: 'Device Inventory' } },
      { label: 'Access Instruction Sheet', prefill: { title: 'Access Instruction Sheet' } },
    ],
    contacts: [
      { label: 'Trusted Tech Helper', prefill: { name: 'Tech Helper' } },
      { label: 'Executor / Spouse', prefill: { name: 'Executor' } },
      { label: 'Account Recovery Contacts', prefill: { name: 'Recovery Contact' } },
    ],
    considerations: [
      'Where the real password record lives',
      'What should be accessed first?',
      'What should be shut down or memorialized?',
      'Which items should never be stored in plaintext?',
    ]
  },
  property: {
    entries: [
      { label: 'Jewelry & Watches', prefill: { title: 'Jewelry & Watches', category: 'Jewelry & Watches' } },
      { label: 'Art & Collectibles', prefill: { title: 'Art Piece', category: 'Art & Paintings' } },
      { label: 'Firearms', prefill: { title: 'Firearm', category: 'Firearms & Weapons' } },
      { label: 'Musical Instruments', prefill: { title: 'Musical Instrument', category: 'Musical Instruments' } },
      { label: 'Antiques', prefill: { title: 'Antique Item', category: 'Antiques & Furniture' } },
      { label: 'Sports & Hobby Equipment', prefill: { title: 'Sports / Hobby Equipment', category: 'Sports Equipment' } },
      { label: 'Family Heirlooms', prefill: { title: 'Family Heirloom', category: 'Collectibles & Memorabilia' } },
    ],
    // Per-item documents (Appraisal, Receipt, Certificate of Authenticity,
    // Insurance Rider) are attached directly to each property record via
    // RECORD_DOC_SLOTS in AddEditSheet. No standalone document chips here.
    documents: [],
    contacts: [
      { label: 'Appraiser', prefill: { name: 'Appraiser' } },
      { label: 'Insurance Agent', prefill: { name: 'Insurance Agent' } },
      { label: 'Auction House', prefill: { name: 'Auction House' } },
    ],
    considerations: [
      'Which items have sentimental value beyond price?',
      'Which items are promised to someone specific?',
      'Where each item is physically stored?',
      'Which items need climate control or special handling?',
      'Which items are separately insured with a rider?',
    ]
  },
  // pets: intentionally omitted — Pets uses a dedicated multi-pet
  // profile UI (see src/sections/PetsSection.tsx) instead of chips.
  funeral: {
    entries: [
      { label: 'Burial', prefill: { burial_or_cremation: 'Burial' } },
      { label: 'Cremation', prefill: { burial_or_cremation: 'Cremation' } },
      { label: 'No Preference', prefill: { burial_or_cremation: 'No Preference' } },
      { label: 'Pre-arranged', prefill: { burial_or_cremation: 'Pre-arranged' } },
      { label: 'Funeral Home', prefill: { funeral_home: 'Funeral Home' } },
      { label: 'Obituary Wishes', prefill: { obituary_notes: 'Obituary Wishes' } },
    ],
    documents: [
      { label: 'Prepaid Funeral Agreement', prefill: { prepaid_arrangements: 'Prepaid Agreement' } },
      { label: 'Cemetery Plot Info', prefill: { cemetery_plot_details: 'Cemetery Plot Info' } },
      { label: 'Religious Service Instructions', prefill: { religious_cultural_preferences: 'Religious Instructions' } },
      { label: 'Draft Obituary', prefill: { obituary_notes: 'Draft Obituary' } },
      { label: 'Cremation / Burial Paperwork', prefill: { burial_or_cremation: 'Cremation/Burial Paperwork' } },
    ],
    contacts: [
      { label: 'Funeral Home', prefill: { name: 'Funeral Home' } },
      { label: 'Funeral Director', prefill: { name: 'Funeral Director' } },
      { label: 'Clergy / Officiant', prefill: { name: 'Clergy/Officiant' } },
      { label: 'Family Speaker', prefill: { name: 'Family Speaker' } },
      { label: 'Cemetery Contact', prefill: { name: 'Cemetery Contact' } },
    ],
    considerations: [
      'Tone of service',
      'Who should speak?',
      'What should be included in obituary?',
      'Who should be notified first?',
      'Preferred memorial style',
    ]
  },
  private: {
    entries: [
      { label: 'Restricted Note', prefill: { title: 'Restricted Note' } },
      { label: 'Sensitive Instruction', prefill: { title: 'Sensitive Instruction' } },
      { label: 'Hidden Asset Note', prefill: { title: 'Hidden Asset Note' } },
      { label: 'Personal Message', prefill: { title: 'Personal Message' } },
      { label: 'Release-later Item', prefill: { title: 'Release-later Item' } },
      { label: 'Protected Family Instruction', prefill: { title: 'Protected Family Instruction' } },
    ],
    documents: [
      { label: 'Restricted Attachment', prefill: { title: 'Restricted Attachment' } },
      { label: 'Sensitive Letter', prefill: { title: 'Sensitive Letter' } },
      { label: 'Private Legal Note', prefill: { title: 'Private Legal Note' } },
      { label: 'Confidential Instruction File', prefill: { title: 'Confidential Instruction' } },
    ],
    contacts: [],
    considerations: [
      'Who can see this?',
      'When it should be revealed?',
      'Whether it is "Only Me" or "Me + Partner"',
      'Whether it belongs in Private at all',
    ]
  },
  legal: {
    aboutContent: {
      paragraphs: [
        "The Legal section stores your most important protective documents — the ones that give others the authority to act on your behalf, carry out your wishes, or care for your dependents.",
        "Use the add buttons below to log each document type. For each entry you can record the document name, the attorney or notary involved, the date executed, where the original is stored, and upload a copy.",
        "Powers of attorney and guardianship nominations often apply to a specific person. Consider also attaching those documents to the relevant person's entry in the Family section so they appear in both places.",
        "If you haven't completed these documents yet, the \"Find a Professional\" link below can help you locate an estate planning attorney."
      ]
    },
    entries: [],
    documents: [],
    contacts: [],
    considerations: []
  }
};
