/**
 * Morgan Family — fictional sample packet for Demo Mode.
 *
 * All data here is static and read-only. Nothing is ever written to the database
 * when isDemoMode is true. Records are shaped to match the real Supabase tables
 * so existing card components render them with zero conditional logic.
 *
 * Profile photos use DiceBear (https://dicebear.com) — free deterministic SVG avatars.
 */

const dicebear = (seed: string) =>
  `https://api.dicebear.com/7.x/personas/svg?seed=${encodeURIComponent(seed)}`;

export const DEMO_PACKET_ID = '11111111-1111-1111-1111-111111111111';
export const DEMO_USER_ID = '22222222-2222-2222-2222-222222222222';

export const DEMO_PROFILE = {
  id: DEMO_USER_ID,
  full_name: 'James Morgan',
  email: 'demo@survivorpacket.com',
  role: 'user',
  avatar_url: dicebear('JamesMorgan'),
  // Extended profile data for the dashboard profile card
  date_of_birth: '1966-03-14',
  age: 58,
  city: 'Media',
  state: 'PA',
  occupation: 'Retired civil engineer',
  marital_status: 'Widower',
  bio: 'Father of three. Grandfather of two. Lives in Media, PA. Husband to the late Catherine Morgan (1992–2021).',
  joined_at: '2024-01-15',
};

export const DEMO_PACKET = {
  id: DEMO_PACKET_ID,
  user_id: DEMO_USER_ID,
  household_mode: 'single',
  person_a_name: 'James Morgan',
  person_b_name: null,
  userRole: 'owner',
  userScope: 'personA',
  created_at: '2024-01-15T00:00:00Z',
};

const today = new Date().toISOString();

// ---------------------------------------------------------------------------
// IDENTITY (info_records)
// ---------------------------------------------------------------------------
export const DEMO_INFO_RECORDS = [
  {
    id: 'demo-info-dl',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'Driver\'s License',
    title: 'Pennsylvania Driver\'s License',
    notes: 'Organ donor. Stored in wallet. Expires 03/2027. Number ending 4471.',
    created_at: today,
  },
  {
    id: 'demo-info-passport',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'Passport',
    title: 'US Passport',
    notes: 'Primary travel document. Expires 08/2029. Stored in fireproof safe, master bedroom.',
    created_at: today,
  },
  {
    id: 'demo-info-ssn',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'Social Security',
    title: 'Social Security Card',
    notes: 'SSN ending 7823. Stored in fireproof safe, master bedroom.',
    created_at: today,
  },
  {
    id: 'demo-info-birth',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'Birth Certificate',
    title: 'Birth Certificate',
    notes: 'Original. Chester County, PA. Stored in fireproof safe.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// FAMILY (family_members)
// ---------------------------------------------------------------------------
export const DEMO_FAMILY_MEMBERS = [
  {
    id: 'demo-fam-catherine',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Catherine Morgan',
    first_name: 'Catherine',
    last_name: 'Morgan',
    relationship: 'spouse',
    is_deceased: true,
    date_of_death: '2021-06-12',
    cause_of_death: 'Cancer',
    marriage_date: '1992-09-19',
    photo_path: dicebear('CatherineMorgan'),
    legacy_notes: 'Married 1992. Loving wife and mother.',
    created_at: today,
  },
  {
    id: 'demo-fam-sandra',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Sandra Morgan',
    first_name: 'Sandra',
    last_name: 'Morgan',
    relationship: 'ex-spouse',
    is_deceased: false,
    divorce_finalized: true,
    divorce_finalized_date: '2008-03-15',
    photo_path: dicebear('SandraMorgan'),
    notes: 'Divorced amicably 2008.',
    created_at: today,
  },
  {
    id: 'demo-fam-michael',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Michael Morgan',
    first_name: 'Michael',
    last_name: 'Morgan',
    relationship: 'child',
    birthday: '1992-04-22',
    phone: '(215) 555-0183',
    address: 'Philadelphia, PA',
    is_beneficiary: true,
    photo_path: dicebear('MichaelMorgan'),
    notes: 'Eldest son. Beneficiary. Designated guardian for Lily.',
    created_at: today,
  },
  {
    id: 'demo-fam-emily',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Emily Morgan',
    first_name: 'Emily',
    last_name: 'Morgan',
    relationship: 'child',
    birthday: '1996-11-08',
    phone: '(212) 555-0247',
    address: 'New York, NY',
    photo_path: dicebear('EmilyMorgan'),
    notes: 'Healthcare POA agent.',
    created_at: today,
  },
  {
    id: 'demo-fam-lily',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Lily Morgan',
    first_name: 'Lily',
    last_name: 'Morgan',
    relationship: 'child',
    birthday: '2010-08-30',
    is_dependent: true,
    lives_with_user: true,
    guardian_name: 'Michael Morgan',
    guardian_phone: '(215) 555-0183',
    guardian_relationship: 'Brother',
    photo_path: dicebear('LilyMorgan'),
    notes: 'Minor. Lives at home. Guardian: Michael Morgan.',
    created_at: today,
  },
  {
    id: 'demo-fam-margaret',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Margaret Morgan',
    first_name: 'Margaret',
    last_name: 'Morgan',
    relationship: 'parent',
    which_parent: 'mother',
    birthday: '1942-05-10',
    phone: '(610) 555-0219',
    address: 'Chester, PA',
    photo_path: dicebear('MargaretMorgan'),
    notes: 'Living. Independent.',
    created_at: today,
  },
  {
    id: 'demo-fam-robert',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Robert Morgan',
    first_name: 'Robert',
    last_name: 'Morgan',
    relationship: 'parent',
    which_parent: 'father',
    is_deceased: true,
    date_of_death: '1998-11-03',
    cause_of_death: 'Heart attack',
    photo_path: dicebear('RobertMorgan'),
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// MEDICAL (medical_records)
// ---------------------------------------------------------------------------
export const DEMO_MEDICAL_RECORDS = [
  {
    id: 'demo-med-emergency',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'emergency_info',
    title: 'Emergency Medical Info',
    blood_type: 'O+',
    organ_donor: true,
    dnr_status: false,
    notes: 'Allergic to Penicillin (severe — anaphylactic). No DNR.',
    created_at: today,
  },
  {
    id: 'demo-med-doc-chen',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'doctor',
    title: 'Dr. Sarah Chen — Primary Care',
    name: 'Dr. Sarah Chen',
    specialty: 'Primary Care',
    practice: 'Main Line Health',
    phone: '(610) 555-0198',
    created_at: today,
  },
  {
    id: 'demo-med-doc-hayes',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'doctor',
    title: 'Dr. Robert Hayes — Cardiologist',
    name: 'Dr. Robert Hayes',
    specialty: 'Cardiology',
    practice: 'Penn Medicine',
    phone: '(215) 555-0156',
    created_at: today,
  },
  {
    id: 'demo-med-aetna',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'health_insurance',
    title: 'Aetna PPO',
    insurer: 'Aetna',
    policy_number: 'Member ending 9341',
    group_number: '44821',
    notes: 'Renews January 1.',
    created_at: today,
  },
  {
    id: 'demo-med-lisinopril',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'medication',
    title: 'Lisinopril 10mg',
    medication_name: 'Lisinopril',
    dosage: '10mg daily',
    purpose: 'Blood pressure',
    prescribing_doctor: 'Dr. Chen',
    created_at: today,
  },
  {
    id: 'demo-med-atorva',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'medication',
    title: 'Atorvastatin 20mg',
    medication_name: 'Atorvastatin',
    dosage: '20mg daily',
    purpose: 'Cholesterol',
    prescribing_doctor: 'Dr. Chen',
    created_at: today,
  },
  {
    id: 'demo-med-allergy-pen',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'allergy',
    title: 'Penicillin — Severe',
    allergen: 'Penicillin',
    severity: 'severe',
    reaction: 'Anaphylactic',
    created_at: today,
  },
  {
    id: 'demo-med-allergy-shell',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'allergy',
    title: 'Shellfish — Moderate',
    allergen: 'Shellfish',
    severity: 'moderate',
    created_at: today,
  },
  {
    id: 'demo-med-surgery',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    record_type: 'surgical_history',
    title: 'Right Knee Replacement',
    procedure: 'Right knee replacement',
    surgery_date: '2019-05-14',
    facility: 'Jefferson Hospital',
    surgeon: 'Dr. Williams',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// LEGAL (legal_documents)
// ---------------------------------------------------------------------------
export const DEMO_LEGAL_DOCUMENTS = [
  {
    id: 'demo-legal-will',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'will',
    title: 'Last Will and Testament',
    attorney_name: 'David Bartholf',
    law_firm: 'Bartholf Law Offices',
    executor_name: 'Michael Morgan',
    date_signed: '2022-04-10',
    created_at: today,
  },
  {
    id: 'demo-legal-trust',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'trust',
    title: 'Morgan Family Revocable Trust',
    trustee_name: 'James Morgan',
    successor_trustee: 'Michael Morgan',
    date_signed: '2022-04-10',
    created_at: today,
  },
  {
    id: 'demo-legal-poa',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'financial_poa',
    title: 'Durable Financial Power of Attorney',
    agent_name: 'Michael Morgan',
    is_durable: true,
    date_signed: '2022-04-10',
    created_at: today,
  },
  {
    id: 'demo-legal-hcpoa',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'healthcare_poa',
    title: 'Healthcare Power of Attorney',
    agent_name: 'Emily Morgan',
    date_signed: '2022-04-10',
    created_at: today,
  },
  {
    id: 'demo-legal-living-will',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'living_will',
    title: 'Living Will / Advance Directive',
    notes: 'On file at Main Line Health. Comfort care preferred.',
    date_signed: '2022-04-10',
    created_at: today,
  },
  {
    id: 'demo-legal-guardian',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    document_kind: 'guardianship',
    title: 'Guardianship Designation for Lily',
    guardian_name: 'Michael Morgan',
    notes: 'Designated guardian for minor daughter Lily Morgan.',
    date_signed: '2022-04-10',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// REAL ESTATE
// ---------------------------------------------------------------------------
export const DEMO_REAL_ESTATE = [
  {
    id: 'demo-re-primary',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    address: '847 Willow Creek Drive, Media, PA 19063',
    property_type: 'primary_residence',
    estimated_value: 485000,
    mortgage_balance: 187000,
    mortgage_lender: 'Chase',
    notes: 'Primary residence.',
    created_at: today,
  },
  {
    id: 'demo-re-vacation',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    address: '22 Beach Haven Court, Stone Harbor, NJ',
    property_type: 'vacation_home',
    estimated_value: 320000,
    mortgage_balance: 0,
    notes: 'Free and clear.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// BANKING
// ---------------------------------------------------------------------------
export const DEMO_BANKING = [
  {
    id: 'demo-bank-chase',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Chase',
    account_type: 'Checking',
    account_number_masked: '****4892',
    approximate_balance: 12400,
    joint_account_holder: 'Michael Morgan',
    created_at: today,
  },
  {
    id: 'demo-bank-fidelity',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Fidelity',
    account_type: 'Savings',
    account_number_masked: '****7731',
    approximate_balance: 48200,
    created_at: today,
  },
  {
    id: 'demo-bank-cc',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Chase Sapphire',
    account_type: 'Credit Card',
    account_number_masked: '****5521',
    approximate_balance: 3200,
    notes: 'Credit limit $15,000.',
    created_at: today,
  },
  {
    id: 'demo-bank-safe',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Chase Media Branch',
    account_type: 'Safe Deposit Box',
    account_number_masked: 'Box #447',
    notes: 'Key in desk drawer, home office.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// INVESTMENTS
// ---------------------------------------------------------------------------
export const DEMO_INVESTMENTS = [
  {
    id: 'demo-inv-fidelity',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Fidelity',
    account_type: 'Brokerage',
    account_number_masked: '****2291',
    approximate_value: 287000,
    notes: 'Index funds. Advisor: Robert Kim.',
    created_at: today,
  },
  {
    id: 'demo-inv-coinbase',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Coinbase',
    account_type: 'Cryptocurrency',
    notes: 'Hardware wallet in home safe. Seed phrase location noted in Private section.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// RETIREMENT
// ---------------------------------------------------------------------------
export const DEMO_RETIREMENT = [
  {
    id: 'demo-ret-401k',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Vanguard',
    account_type: '401k',
    account_number_masked: '****8821',
    approximate_value: 485000,
    primary_beneficiary: 'Michael Morgan (50%) / Emily Morgan (50%)',
    created_at: today,
  },
  {
    id: 'demo-ret-ira',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'Vanguard',
    account_type: 'Traditional IRA',
    account_number_masked: '****4421',
    approximate_value: 127000,
    primary_beneficiary: 'Lily Morgan (minor trust)',
    created_at: today,
  },
  {
    id: 'demo-ret-pension',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    institution: 'PA State Employees',
    account_type: 'Pension',
    notes: '$2,400/month at age 65.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// ADVISORS (matches new advisor_records schema)
// ---------------------------------------------------------------------------
export const DEMO_ADVISORS = [
  {
    id: 'demo-adv-bartholf',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    advisor_type: 'attorney',
    advisor_status: 'active',
    first_name: 'David',
    last_name: 'Bartholf',
    name: 'David Bartholf',
    firm: 'Bartholf Law Offices',
    phone: '(610) 555-0140',
    specialty: 'Estate Planning',
    is_deceased: false,
    photo_path: dicebear('DavidBartholf'),
    created_at: today,
  },
  {
    id: 'demo-adv-kim',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    advisor_type: 'financial',
    advisor_status: 'active',
    first_name: 'Robert',
    last_name: 'Kim',
    name: 'Robert Kim',
    firm: 'Vanguard Personal Advisors',
    license_type: 'CFP',
    is_deceased: false,
    photo_path: dicebear('RobertKim'),
    created_at: today,
  },
  {
    id: 'demo-adv-wells',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    advisor_type: 'cpa',
    advisor_status: 'active',
    first_name: 'Patricia',
    last_name: 'Wells',
    name: 'Patricia Wells',
    firm: 'Wells Tax Associates',
    phone: '(610) 555-0177',
    license_type: 'CPA',
    is_deceased: false,
    photo_path: dicebear('PatriciaWells'),
    created_at: today,
  },
  {
    id: 'demo-adv-thompson',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    advisor_type: 'insurance',
    advisor_status: 'active',
    first_name: 'Mark',
    last_name: 'Thompson',
    name: 'Mark Thompson',
    firm: 'State Farm',
    phone: '(610) 555-0155',
    is_deceased: false,
    photo_path: dicebear('MarkThompson'),
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// VEHICLES
// ---------------------------------------------------------------------------
export const DEMO_VEHICLES = [
  {
    id: 'demo-veh-camry',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    year: 2021,
    make: 'Toyota',
    model: 'Camry XSE',
    vin_masked: '****4421',
    license_plate: 'PA KBH-7743',
    insurance_company: 'State Farm',
    notes: 'Owned free and clear.',
    created_at: today,
  },
  {
    id: 'demo-veh-f150',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    year: 2018,
    make: 'Ford',
    model: 'F-150 XLT',
    vin_masked: '****8832',
    license_plate: 'PA MNK-2291',
    loan_balance: 8400,
    notes: 'Loan payoff December 2025.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// PASSWORDS
// ---------------------------------------------------------------------------
export const DEMO_PASSWORDS = [
  {
    id: 'demo-pw-gmail',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    service_name: 'Gmail',
    username: 'james.morgan.1966@gmail.com',
    notes: 'Reference: password manager.',
    created_at: today,
  },
  {
    id: 'demo-pw-chase',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    service_name: 'Chase Online',
    username: 'jmorgan1966',
    notes: 'Reference: password manager.',
    created_at: today,
  },
  {
    id: 'demo-pw-1password',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    service_name: '1Password (master)',
    notes: 'Master password in fireproof safe — envelope marked "Digital".',
    requires_reauth: true,
    created_at: today,
  },
  {
    id: 'demo-pw-fb',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    service_name: 'Facebook',
    username: 'james.morgan.1966',
    created_at: today,
  },
  {
    id: 'demo-pw-li',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    service_name: 'LinkedIn',
    username: 'james-morgan-1966',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// PERSONAL PROPERTY
// ---------------------------------------------------------------------------
export const DEMO_PROPERTY = [
  {
    id: 'demo-prop-ring',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    item_name: "Catherine's Engagement Ring",
    category: 'Jewelry',
    appraised_value: 18500,
    notes: '2.1ct diamond solitaire. Insurance rider on file. Bequest to Emily.',
    created_at: today,
  },
  {
    id: 'demo-prop-painting',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    item_name: 'Oil Painting "Autumn Valley"',
    category: 'Art',
    appraised_value: 8200,
    notes: 'Provenance documented.',
    created_at: today,
  },
  {
    id: 'demo-prop-shotgun',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    item_name: 'Remington 870 Shotgun',
    category: 'Firearm',
    notes: 'Serial ending 4421. Locked gun safe, basement.',
    created_at: today,
  },
  {
    id: 'demo-prop-coins',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    item_name: 'Coin Collection',
    category: 'Collectible',
    appraised_value: 6300,
    notes: 'Storage unit A-12.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// PETS
// ---------------------------------------------------------------------------
export const DEMO_PETS = [
  {
    id: 'demo-pet-max',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    name: 'Max',
    species: 'Dog',
    breed: 'Golden Retriever',
    color: 'Golden / cream',
    age: 6,
    microchip: '****7721',
    vet_name: 'Dr. Jennifer Park',
    vet_clinic: 'Main Line Veterinary',
    vet_phone: '(610) 555-0144',
    medications: 'Apoquel 16mg daily, heartworm prevention monthly',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// FUNERAL
// ---------------------------------------------------------------------------
export const DEMO_FUNERAL = [
  {
    id: 'demo-fun-disposition',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'Burial Preferences',
    category: 'disposition',
    notes: 'Burial at St. Mary\'s Cemetery, Media PA. Plot pre-purchased: Section 4B.',
    created_at: today,
  },
  {
    id: 'demo-fun-home',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'Murphy Funeral Home',
    category: 'funeral_home',
    notes: 'Murphy Funeral Home, Media PA. (610) 555-0130. No viewing — private family service only.',
    created_at: today,
  },
  {
    id: 'demo-fun-music',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'Music Selections',
    category: 'service',
    notes: 'Amazing Grace, Danny Boy, Ave Maria.',
    created_at: today,
  },
  {
    id: 'demo-fun-obit',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'Pre-Written Obituary',
    category: 'obituary',
    notes: '3 paragraphs. "Keep it simple. No fuss. Celebrate at the shore house."',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// MEMORIES
// ---------------------------------------------------------------------------
export const DEMO_MEMORIES = [
  {
    id: 'demo-mem-letter',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'Letter to My Children',
    memory_type: 'letter',
    content: 'My dearest Michael, Emily, and Lily — being your father has been the greatest privilege of my life. Whatever happens, know that I loved you completely, exactly as you are.\n\nLive boldly. Love generously. And take care of each other.',
    created_at: today,
  },
  {
    id: 'demo-mem-advice',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: '10 Things I Want My Children to Know',
    memory_type: 'advice',
    content: '1. Family is everything. 2. Save more than you spend. 3. Show up for people. 4. Apologize quickly. 5. Travel while you can. 6. Read every day. 7. Move your body. 8. Pick kind partners. 9. Forgive your mother and me for everything. 10. Be the person Lily remembers.',
    created_at: today,
  },
  {
    id: 'demo-mem-lily',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    title: 'For Lily — Open on Your 18th Birthday',
    memory_type: 'time_capsule',
    content: 'A sealed message from your father.',
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// LOOKUP MAP — sectionService.getRecords reads from here in demo mode
// ---------------------------------------------------------------------------
export const DEMO_RECORDS_BY_SECTION: Record<string, any[]> = {
  info: DEMO_INFO_RECORDS,
  family: DEMO_FAMILY_MEMBERS,
  medical: DEMO_MEDICAL_RECORDS,
  legal: DEMO_LEGAL_DOCUMENTS,
  'real-estate': DEMO_REAL_ESTATE,
  banking: DEMO_BANKING,
  investments: DEMO_INVESTMENTS,
  retirement: DEMO_RETIREMENT,
  advisors: DEMO_ADVISORS,
  vehicles: DEMO_VEHICLES,
  passwords: DEMO_PASSWORDS,
  property: DEMO_PROPERTY,
  pets: DEMO_PETS,
  funeral: DEMO_FUNERAL,
  memories: DEMO_MEMORIES,
  private: [],
};

// ---------------------------------------------------------------------------
// ESTATE SUMMARY
// ---------------------------------------------------------------------------
export const DEMO_ESTATE_SUMMARY = {
  realEstateEquity: 618000,
  investments: 287000,
  retirement: 612000,
  personalProperty: 42500,
  totalLiabilities: 195400,
  netEstimatedEstate: 1364100,
};

export const DEMO_HEALTH_SCORE = 87;

// ---------------------------------------------------------------------------
// IDENTITY RECORDS (shape matches identityService — info_records with
// category + details + expiry_date). Drives the Info/Identity section cards.
// ---------------------------------------------------------------------------
export const DEMO_IDENTITY_RECORDS = [
  {
    id: 'demo-id-dl',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'drivers_license',
    title: "Pennsylvania Driver's License",
    notes: 'Organ donor. Stored in wallet.',
    expiry_date: '2027-03-14',
    status: 'completed',
    details: {
      number_masked: '****4471',
      state: 'PA',
      issued_date: '2023-03-14',
      class: 'C',
      organ_donor: true,
      restrictions: 'Corrective lenses',
    },
    created_at: today,
  },
  {
    id: 'demo-id-passport',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'passport',
    title: 'US Passport',
    notes: 'Primary travel document. Stored in fireproof safe, master bedroom.',
    expiry_date: '2029-08-22',
    status: 'completed',
    details: {
      number_masked: '****8821',
      country: 'United States',
      issued_date: '2019-08-22',
      issuing_authority: 'US Department of State',
    },
    created_at: today,
  },
  {
    id: 'demo-id-ssn',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'social_security',
    title: 'Social Security Card',
    notes: 'Original card stored in fireproof safe, master bedroom.',
    expiry_date: null,
    status: 'completed',
    details: { number_masked: '***-**-7823' },
    created_at: today,
  },
  {
    id: 'demo-id-birth',
    packet_id: DEMO_PACKET_ID,
    scope: 'personA',
    category: 'birth_certificate',
    title: 'Birth Certificate',
    notes: 'Certified original. Chester County, PA.',
    expiry_date: null,
    status: 'completed',
    details: {
      birth_date: '1966-03-14',
      place_of_birth: 'Chester County, PA',
      certificate_number: '****0314',
    },
    created_at: today,
  },
];

// ---------------------------------------------------------------------------
// CUSTOM SECTIONS — Travel Documents demo example
// ---------------------------------------------------------------------------
export const DEMO_CUSTOM_SECTIONS = [
  {
    id: 'demo-cs-travel',
    user_id: DEMO_USER_ID,
    packet_id: DEMO_PACKET_ID,
    name: 'Travel Documents',
    icon: 'plane',
    description: 'Frequent traveler programs, lounge access, and trusted-traveler IDs.',
    sort_order: 0,
    created_at: today,
    updated_at: today,
  },
];

export const DEMO_CUSTOM_SECTION_RECORDS: Record<string, any[]> = {
  'demo-cs-travel': [
    {
      id: 'demo-csr-globalentry',
      custom_section_id: 'demo-cs-travel',
      packet_id: DEMO_PACKET_ID,
      scope: 'personA',
      title: 'Global Entry / TSA PreCheck',
      entry_date: '2024-02-10',
      notes: 'Member ID ending 2284. Renewed 02/2024. Expires 02/2029. PASS ID linked to passport.',
      status: 'completed',
      created_at: today,
      updated_at: today,
    },
    {
      id: 'demo-csr-united',
      custom_section_id: 'demo-cs-travel',
      packet_id: DEMO_PACKET_ID,
      scope: 'personA',
      title: 'United Airlines MileagePlus',
      entry_date: '2009-06-01',
      notes: 'Premier Gold. Account ending 7741. ~287,000 miles available.',
      status: 'completed',
      created_at: today,
      updated_at: today,
    },
  ],
};

// ---------------------------------------------------------------------------
// HEALTH SCORE — full shape matching healthScoreService.HealthScore
// ---------------------------------------------------------------------------
export const DEMO_HEALTH_SCORE_FULL = {
  packet_id: DEMO_PACKET_ID,
  total_score: 87,
  previous_score: 84,
  score_change: 3,
  section_scores: {
    info: { score: 9, max: 10 },
    family: { score: 10, max: 10 },
    legal: { score: 10, max: 10 },
    medical: { score: 9, max: 10 },
    'real-estate': { score: 8, max: 10 },
    banking: { score: 8, max: 10 },
    investments: { score: 7, max: 10 },
    retirement: { score: 9, max: 10 },
    advisors: { score: 8, max: 10 },
    vehicles: { score: 7, max: 10 },
    passwords: { score: 6, max: 10 },
    property: { score: 7, max: 10 },
    pets: { score: 6, max: 10 },
    funeral: { score: 9, max: 10 },
    memories: { score: 8, max: 10 },
  },
  critical_gaps: [
    {
      section: 'passwords',
      label: 'Password manager master password not stored offline',
      impact: 4,
      cta: 'Add backup location',
    },
  ],
  calculated_at: today,
};

// ---------------------------------------------------------------------------
// SCORE HISTORY — 6-month journey from 23 → 87
// ---------------------------------------------------------------------------
export const DEMO_SCORE_HISTORY = (() => {
  const trajectory = [23, 31, 38, 47, 54, 61, 67, 72, 76, 80, 84, 87];
  const now = Date.now();
  return trajectory.map((score, i) => ({
    total_score: score,
    recorded_at: new Date(now - (trajectory.length - 1 - i) * 15 * 24 * 60 * 60 * 1000).toISOString(),
  }));
})();

// ---------------------------------------------------------------------------
// FULL ESTATE SUMMARY — shape matches estateSummaryService.EstateSummary
// ---------------------------------------------------------------------------
export const DEMO_ESTATE_SUMMARY_FULL = {
  packet_id: DEMO_PACKET_ID,
  gross_assets: 1559500,
  total_liabilities: 195400,
  net_estate: 1364100,
  liquid_assets: 350800,
  illiquid_assets: 1208700,
  death_benefits: 0,
  categories: {
    real_estate: {
      total: 805000,
      records: [
        { id: 'demo-re-primary', label: '847 Willow Creek Drive, Media, PA', value: 485000 },
        { id: 'demo-re-vacation', label: '22 Beach Haven Court, Stone Harbor, NJ', value: 320000 },
      ],
    },
    vehicles: {
      total: 47000,
      records: [
        { id: 'demo-veh-camry', label: '2021 Toyota Camry XSE', value: 28000 },
        { id: 'demo-veh-f150', label: '2018 Ford F-150 XLT', value: 19000 },
      ],
    },
    banking: {
      total: 60600,
      records: [
        { id: 'demo-bank-chase', label: 'Chase Checking ****4892', value: 12400 },
        { id: 'demo-bank-fidelity', label: 'Fidelity Savings ****7731', value: 48200 },
      ],
    },
    investments: {
      total: 287000,
      records: [
        { id: 'demo-inv-fidelity', label: 'Fidelity Brokerage ****2291', value: 287000 },
      ],
    },
    retirement: {
      total: 612000,
      records: [
        { id: 'demo-ret-401k', label: 'Vanguard 401k ****8821', value: 485000 },
        { id: 'demo-ret-ira', label: 'Vanguard Traditional IRA ****4421', value: 127000 },
      ],
    },
    property: {
      total: 33000,
      records: [
        { id: 'demo-prop-ring', label: "Catherine's Engagement Ring", value: 18500 },
        { id: 'demo-prop-painting', label: 'Oil Painting "Autumn Valley"', value: 8200 },
        { id: 'demo-prop-coins', label: 'Coin Collection', value: 6300 },
      ],
    },
    life_insurance: { records: [] },
  },
  liabilities: [
    {
      id: 'demo-liab-mortgage',
      liability_type: 'Mortgage',
      label: 'Chase mortgage — 847 Willow Creek Drive',
      value: 187000,
      payoff_date: '2032-06-01',
    },
    {
      id: 'demo-liab-truck',
      liability_type: 'Vehicle Loan',
      label: 'Ford F-150 loan',
      value: 8400,
      payoff_date: '2025-12-01',
    },
  ],
  missing_values: [
    { section: 'investments', id: 'demo-inv-coinbase', label: 'Coinbase cryptocurrency wallet' },
  ],
  calculated_at: today,
};

// ---------------------------------------------------------------------------
// SECTION COMPLETION — per-section count + percent for the dashboard grid
// ---------------------------------------------------------------------------
export const DEMO_SECTION_COMPLETION: Record<
  string,
  { count: number; hasContent: boolean; percent: number }
> = (() => {
  const out: Record<string, { count: number; hasContent: boolean; percent: number }> = {};
  for (const [key, records] of Object.entries(DEMO_RECORDS_BY_SECTION)) {
    out[key] = { count: records.length, hasContent: records.length > 0, percent: records.length > 0 ? 100 : 0 };
  }
  out['private'] = { count: 0, hasContent: false, percent: 0 };
  return out;
})();

// ---------------------------------------------------------------------------
// HAVEN GREETING — used by HavenAssistant when isDemoMode()
// ---------------------------------------------------------------------------
export const DEMO_HAVEN_GREETING =
  "Welcome! You're exploring James Morgan's Survivor Packet. I'm Haven, your guide. Ask me anything about what you see here or how The Survivor Packet can help your family.";

