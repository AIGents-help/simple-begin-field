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
}

export const RECOMMENDATIONS_CONFIG: Partial<Record<SectionId, SectionRecommendations>> = {
  info: {
    entries: [
      { label: 'Full Legal Name', prefill: { title: 'Full Legal Name' } },
      { label: 'Date of Birth', prefill: { title: 'Date of Birth' } },
      { label: 'Home Address', prefill: { title: 'Home Address' } },
      { label: 'Phone Number', prefill: { title: 'Phone Number' } },
      { label: 'Email Address', prefill: { title: 'Email Address' } },
      { label: 'Emergency Contact', prefill: { title: 'Emergency Contact' } },
      { label: 'Driver\'s License Details', prefill: { title: 'Driver\'s License Details' } },
      { label: 'Passport Details', prefill: { title: 'Passport Details' } },
      { label: 'Marriage Information', prefill: { title: 'Marriage Information' } },
    ],
    documents: [
      { label: 'Driver\'s License', prefill: { title: 'Driver\'s License', category: 'Identity' } },
      { label: 'Passport', prefill: { title: 'Passport', category: 'Identity' } },
      { label: 'Birth Certificate', prefill: { title: 'Birth Certificate', category: 'Identity' } },
      { label: 'Social Security Card', prefill: { title: 'Social Security Card', category: 'Identity' } },
      { label: 'Citizenship Papers', prefill: { title: 'Citizenship Papers', category: 'Legal' } },
      { label: 'Will', prefill: { title: 'Will', category: 'Legal' } },
      { label: 'Living Will', prefill: { title: 'Living Will', category: 'Legal' } },
      { label: 'HCPOA', prefill: { title: 'HCPOA', category: 'Legal' } },
      { label: 'Financial POA', prefill: { title: 'Financial POA', category: 'Legal' } },
      { label: 'Trust Documents', prefill: { title: 'Trust Documents', category: 'Legal' } },
    ],
    contacts: [
      { label: 'Primary Emergency Contact', prefill: { name: 'Primary Emergency Contact' } },
      { label: 'Secondary Emergency Contact', prefill: { name: 'Secondary Emergency Contact' } },
      { label: 'Attorney', prefill: { name: 'Attorney' } },
    ],
    considerations: [
      'Where are the physical originals stored?',
      'What identity documents are expired or expiring?',
      'Who should access these first?',
      'Which legal documents are still missing?',
    ]
  },
  family: {
    entries: [
      { label: 'Spouse / Partner', prefill: { relationship: 'Spouse' } },
      { label: 'Child', prefill: { relationship: 'Child' } },
      { label: 'Parent', prefill: { relationship: 'Parent' } },
      { label: 'Sibling', prefill: { relationship: 'Sibling' } },
      { label: 'Grandparent', prefill: { relationship: 'Grandparent' } },
      { label: 'Grandchild', prefill: { relationship: 'Grandchild' } },
      { label: 'Friend', prefill: { relationship: 'Friend' } },
    ],
    documents: [
      { label: 'Guardianship Papers', prefill: { name: 'Guardianship Papers' } },
      { label: 'Adoption Records', prefill: { name: 'Adoption Records' } },
      { label: 'Custody Records', prefill: { name: 'Custody Records' } },
      { label: 'Family Contact List', prefill: { name: 'Family Contact List' } },
      { label: 'Family Legal Notes', prefill: { name: 'Family Legal Notes' } },
    ],
    contacts: [
      { label: 'Immediate Family Contacts', prefill: { name: 'Immediate Family Contact' } },
      { label: 'Guardian / Backup Guardian', prefill: { name: 'Guardian' } },
      { label: 'Schools / Care Providers', prefill: { name: 'School/Care Provider' } },
    ],
    considerations: [
      'Who should be contacted first?',
      'Who depends on you financially?',
      'Birthday reminders',
      'Children or dependents with special needs',
      'Family communication instructions',
    ]
  },
  medical: {
    entries: [
      { label: 'Primary Doctor', prefill: { provider_name: 'Primary Care Physician' } },
      { label: 'Specialists', prefill: { provider_name: 'Specialist' } },
      { label: 'Pharmacy', prefill: { provider_name: 'Pharmacy' } },
      { label: 'Medications', prefill: { provider_name: 'Medications' } },
      { label: 'Allergies', prefill: { provider_name: 'Allergies' } },
      { label: 'Insurance Info', prefill: { provider_name: 'Insurance Information' } },
      { label: 'Medical Conditions', prefill: { provider_name: 'Medical Conditions' } },
      { label: 'Emergency Medical Contacts', prefill: { provider_name: 'Emergency Medical Contacts' } },
      { label: 'Preferred Hospital', prefill: { provider_name: 'Preferred Hospital' } },
      { label: 'End-of-life Treatment Wishes', prefill: { provider_name: 'End-of-life Treatment Wishes' } },
    ],
    // Insurance Card is attached to each medical provider record.
    // Other clinical documents (Advance Directive, Living Will, HIPAA, Medical POA, DNR)
    // belong in the Legal section attached to the relevant attorney/agent.
    documents: [
      { label: 'Medication List', prefill: { title: 'Medication List' } },
      { label: 'Recent Care Plan Summary', prefill: { title: 'Care Plan Summary' } },
    ],
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
    entries: [
      { label: 'Checking Account', prefill: { account_type: 'Checking' } },
      { label: 'Savings Account', prefill: { account_type: 'Savings' } },
      { label: 'Joint Account', prefill: { account_type: 'Joint' } },
      { label: 'Money Market Account', prefill: { account_type: 'Money Market' } },
      { label: 'CD Account', prefill: { account_type: 'CD' } },
      { label: 'Business Account', prefill: { account_type: 'Business' } },
    ],
    documents: [
      { label: 'Bank Statements', prefill: { institution: 'Bank Statement' } },
      { label: 'Check Image / Voided Check', prefill: { institution: 'Voided Check' } },
      { label: 'Account Summary Printout', prefill: { institution: 'Account Summary' } },
      { label: 'Safe Deposit Box Info', prefill: { institution: 'Safe Deposit Box Info' } },
      { label: 'Beneficiary Paperwork', prefill: { institution: 'Beneficiary Paperwork' } },
    ],
    contacts: [
      { label: 'Bank Branch Contact', prefill: { name: 'Bank Branch' } },
      { label: 'Relationship Banker', prefill: { name: 'Relationship Banker' } },
      { label: 'Fraud Department', prefill: { name: 'Fraud Department' } },
    ],
    considerations: [
      'Which accounts are individual vs shared?',
      'Which bills auto-draft from which account?',
      'Where online banking recovery info is stored?',
      'Who should handle accounts first?',
    ]
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
      { label: 'Jewelry', prefill: { item_name: 'Jewelry' } },
      { label: 'Heirlooms', prefill: { item_name: 'Heirloom' } },
      { label: 'Firearms', prefill: { item_name: 'Firearms' } },
      { label: 'Art', prefill: { item_name: 'Art' } },
      { label: 'Collectibles', prefill: { item_name: 'Collectibles' } },
      { label: 'Storage Unit Contents', prefill: { item_name: 'Storage Unit' } },
      { label: 'Sentimental Items', prefill: { item_name: 'Sentimental Item' } },
      { label: 'Intended Recipient', prefill: { item_name: 'Intended Recipient' } },
    ],
    documents: [
      { label: 'Appraisals', prefill: { item_name: 'Appraisal' } },
      { label: 'Receipts', prefill: { item_name: 'Receipt' } },
      { label: 'Insurance Riders', prefill: { item_name: 'Insurance Rider' } },
      { label: 'Photo Inventory', prefill: { item_name: 'Photo Inventory' } },
      { label: 'Ownership Documentation', prefill: { item_name: 'Ownership Doc' } },
    ],
    contacts: [
      { label: 'Appraiser', prefill: { name: 'Appraiser' } },
      { label: 'Insurance Agent', prefill: { name: 'Insurance Agent' } },
      { label: 'Intended Recipient', prefill: { name: 'Recipient' } },
    ],
    considerations: [
      'Which items have sentimental value beyond price?',
      'Which items are promised to someone?',
      'Where items are physically stored?',
      'Which items need extra protection?',
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
  }
};
