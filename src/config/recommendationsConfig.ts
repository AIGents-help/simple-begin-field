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
      { label: 'Social Security Location', prefill: { title: 'Social Security Location' } },
      { label: 'Marriage Information', prefill: { title: 'Marriage Information' } },
    ],
    documents: [
      { label: 'Driver\'s License', prefill: { title: 'Driver\'s License', category: 'Identity' } },
      { label: 'Passport', prefill: { title: 'Passport', category: 'Identity' } },
      { label: 'Birth Certificate', prefill: { title: 'Birth Certificate', category: 'Identity' } },
      { label: 'Social Security Card', prefill: { title: 'Social Security Card', category: 'Identity' } },
      { label: 'Marriage Certificate', prefill: { title: 'Marriage Certificate', category: 'Legal' } },
      { label: 'Divorce Decree', prefill: { title: 'Divorce Decree', category: 'Legal' } },
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
      { label: 'Spouse / Partner', prefill: { name: 'Spouse / Partner' } },
      { label: 'Children', prefill: { name: 'Child' } },
      { label: 'Parents', prefill: { name: 'Parent' } },
      { label: 'Siblings', prefill: { name: 'Sibling' } },
      { label: 'Dependents', prefill: { name: 'Dependent' } },
      { label: 'Caregiving Relationships', prefill: { name: 'Caregiving Relationship' } },
      { label: 'Emergency Family Contacts', prefill: { name: 'Emergency Family Contact' } },
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
      { label: 'Primary Doctor', prefill: { title: 'Primary Care Physician' } },
      { label: 'Specialists', prefill: { title: 'Specialist' } },
      { label: 'Pharmacy', prefill: { title: 'Pharmacy' } },
      { label: 'Medications', prefill: { title: 'Medications' } },
      { label: 'Allergies', prefill: { title: 'Allergies' } },
      { label: 'Insurance Info', prefill: { title: 'Insurance Information' } },
      { label: 'Medical Conditions', prefill: { title: 'Medical Conditions' } },
      { label: 'Emergency Medical Contacts', prefill: { title: 'Emergency Medical Contacts' } },
      { label: 'Preferred Hospital', prefill: { title: 'Preferred Hospital' } },
      { label: 'End-of-life Treatment Wishes', prefill: { title: 'End-of-life Treatment Wishes' } },
    ],
    documents: [
      { label: 'Insurance Card', prefill: { title: 'Insurance Card' } },
      { label: 'Medication List', prefill: { title: 'Medication List' } },
      { label: 'Advance Directive', prefill: { title: 'Advance Directive' } },
      { label: 'Living Will', prefill: { title: 'Living Will' } },
      { label: 'HIPAA Authorization', prefill: { title: 'HIPAA Authorization' } },
      { label: 'Medical POA', prefill: { title: 'Medical POA' } },
      { label: 'DNR', prefill: { title: 'DNR' } },
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
      { label: 'Mortgage Information', prefill: { property_label: 'Mortgage Information' } },
      { label: 'Utilities Account Numbers', prefill: { property_label: 'Utilities Accounts' } },
      { label: 'Insurance Details', prefill: { property_label: 'Insurance Details' } },
      { label: 'Security System Info', prefill: { property_label: 'Security System' } },
    ],
    documents: [
      { label: 'Deed', prefill: { property_label: 'Property Deed' } },
      { label: 'Mortgage Statement', prefill: { property_label: 'Mortgage Statement' } },
      { label: 'Title Documents', prefill: { property_label: 'Title Documents' } },
      { label: 'Home Insurance Policy', prefill: { property_label: 'Home Insurance Policy' } },
      { label: 'Property Tax Documents', prefill: { property_label: 'Property Tax Documents' } },
      { label: 'HOA Information', prefill: { property_label: 'HOA Information' } },
      { label: 'Lease Agreements', prefill: { property_label: 'Lease Agreement' } },
    ],
    contacts: [
      { label: 'Realtor', prefill: { name: 'Realtor' } },
      { label: 'Mortgage Lender', prefill: { name: 'Mortgage Lender' } },
      { label: 'Property Manager', prefill: { name: 'Property Manager' } },
      { label: 'Home Insurer', prefill: { name: 'Home Insurer' } },
      { label: 'Utility Companies', prefill: { name: 'Utility Company' } },
    ],
    considerations: [
      'Which bills must remain paid?',
      'Alarm / access instructions',
      'Hidden maintenance issues',
      'Where keys or codes are kept?',
    ]
  },
  banking: {
    entries: [
      { label: 'Checking Account', prefill: { institution: 'Checking Account' } },
      { label: 'Savings Account', prefill: { institution: 'Savings Account' } },
      { label: 'Joint Account', prefill: { institution: 'Joint Account' } },
      { label: 'Money Market Account', prefill: { institution: 'Money Market Account' } },
      { label: 'Institution Name', prefill: { institution: 'Bank Name' } },
      { label: 'Account Type', prefill: { institution: 'Account Type' } },
      { label: 'Account Note / Masked Number', prefill: { institution: 'Account Note' } },
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
      { label: 'IRA', prefill: { institution: 'IRA' } },
      { label: 'Roth IRA', prefill: { institution: 'Roth IRA' } },
      { label: '401(k)', prefill: { institution: '401(k)' } },
      { label: '403(b)', prefill: { institution: '403(b)' } },
      { label: 'Pension', prefill: { institution: 'Pension' } },
      { label: 'Annuity', prefill: { institution: 'Annuity' } },
      { label: 'Beneficiary Notes', prefill: { institution: 'Beneficiary Notes' } },
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
    documents: [
      { label: 'Title', prefill: { model: 'Vehicle Title' } },
      { label: 'Registration', prefill: { model: 'Registration' } },
      { label: 'Insurance Card', prefill: { model: 'Insurance Card' } },
      { label: 'Loan Documents', prefill: { model: 'Loan Documents' } },
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
      { label: 'Lawyer', prefill: { name: 'Lawyer' } },
      { label: 'Accountant', prefill: { name: 'Accountant' } },
      { label: 'Financial Advisor', prefill: { name: 'Financial Advisor' } },
      { label: 'Insurance Agent', prefill: { name: 'Insurance Agent' } },
      { label: 'Funeral Planner', prefill: { name: 'Funeral Planner' } },
      { label: 'Estate Planner', prefill: { name: 'Estate Planner' } },
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
  pets: {
    entries: [
      { label: 'Pet Profile', prefill: { name: 'Pet Profile' } },
      { label: 'Species / Breed', prefill: { name: 'Species/Breed' } },
      { label: 'Age', prefill: { name: 'Age' } },
      { label: 'Medications', prefill: { name: 'Medications' } },
      { label: 'Feeding Schedule', prefill: { name: 'Feeding Schedule' } },
      { label: 'Vet Details', prefill: { name: 'Vet Details' } },
      { label: 'Grooming Instructions', prefill: { name: 'Grooming Instructions' } },
      { label: 'Boarding / Sitter Notes', prefill: { name: 'Boarding/Sitter Notes' } },
      { label: 'Microchip Details', prefill: { name: 'Microchip Details' } },
    ],
    documents: [
      { label: 'Vaccination Records', prefill: { name: 'Vaccination Records' } },
      { label: 'Vet Records', prefill: { name: 'Vet Records' } },
      { label: 'Microchip Paperwork', prefill: { name: 'Microchip Paperwork' } },
      { label: 'Pet Insurance Policy', prefill: { name: 'Pet Insurance Policy' } },
      { label: 'Medication List', prefill: { name: 'Pet Medication List' } },
    ],
    contacts: [
      { label: 'Veterinarian', prefill: { name: 'Veterinarian' } },
      { label: 'Emergency Vet', prefill: { name: 'Emergency Vet' } },
      { label: 'Pet Sitter', prefill: { name: 'Pet Sitter' } },
      { label: 'Boarding Provider', prefill: { name: 'Boarding Provider' } },
      { label: 'Backup Caretaker', prefill: { name: 'Backup Caretaker' } },
    ],
    considerations: [
      'Who should take the pet immediately?',
      'Daily care routine',
      'Medication timing',
      'Behavior issues or fears',
    ]
  },
  funeral: {
    entries: [
      { label: 'Funeral Preferences', prefill: { service_preferences: 'Funeral Preferences' } },
      { label: 'Burial or Cremation', prefill: { burial_or_cremation: 'Burial or Cremation' } },
      { label: 'Funeral Home', prefill: { funeral_home: 'Funeral Home' } },
      { label: 'Funeral Director', prefill: { funeral_director: 'Funeral Director' } },
      { label: 'Service Type', prefill: { service_preferences: 'Service Type' } },
      { label: 'Obituary Wishes', prefill: { obituary_notes: 'Obituary Wishes' } },
      { label: 'Eulogy Notes', prefill: { additional_instructions: 'Eulogy Notes' } },
      { label: 'Music / Reading Preferences', prefill: { service_preferences: 'Music/Reading Preferences' } },
      { label: 'Guest Notification Instructions', prefill: { additional_instructions: 'Guest Notifications' } },
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
