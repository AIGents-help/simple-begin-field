import React, { useState, useEffect } from 'react';
import { X, Save, Loader2, CheckCircle, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'motion/react';
import { supabase } from '@/lib/supabase';
import { useAppContext } from '../../context/AppContext';
import { SECTIONS_CONFIG } from '../../config/sectionsConfig';
import { sectionService } from '../../services/sectionService';
import { useConfirm } from '../../context/ConfirmDialogContext';
import { documentService } from '../../services/documentService';
import { FileAttachmentField } from '../upload/FileAttachmentField';
import { CategorySelector } from '../upload/CategorySelector';
import { CategoryOption, FileMetadata } from '../upload/types';
import { INFO_CATEGORY_OPTIONS } from '../../config/categories';
import { LifeStatusToggle, AdvisorStatusToggle } from '../common/LifeStatusToggle';
import { DeathCertificateUpload } from '../common/DeathCertificateUpload';
import { RecordDocumentUpload } from '../common/RecordDocumentUpload';
import { AutoFilledIndicator } from '../common/AutoFilledIndicator';
import { useFederatedDefaults } from '../../hooks/useFederatedDefaults';
import { PropertyPhotoGallery } from '../property/PropertyPhotoGallery';
import { PropertyFamilyDatalist } from '../property/PropertyFamilyDatalist';
import { MaskedInput } from '../common/MaskedInput';
import { ProfilePhotoUploader } from '../common/ProfilePhotoUploader';
import { uploadService } from '../../services/uploadService';
import { AIValuationPanel } from '../common/AIValuationPanel';

// ---------------------------------------------------------------------------
// Cross-section federation: snapshot which fields on a source record drive
// downstream auto-fill. After save, we compare the new value to this snapshot
// and prompt the user to update dependents.
// ---------------------------------------------------------------------------
type SourceKey = 'address' | 'spouseName' | 'attorney' | 'financialAdvisor' | 'primaryDoctor' | 'funeralHome';

const buildSourceSnapshot = (section: string | null | undefined, data: any): Record<SourceKey, any> => {
  const snap: any = {};
  if (!section || !data) return snap;
  if (section === 'real-estate' && (data.property_type === 'Primary Residence' || !data.property_type)) {
    snap.address = (data.address || '').trim();
  }
  if (section === 'family' && String(data.relationship || '').toLowerCase() === 'spouse' && !data.is_deceased) {
    snap.spouseName = `${data.first_name || ''} ${data.last_name || ''}`.trim() || data.name || '';
  }
  if (section === 'advisors') {
    const t = String(data.advisor_type || '').toLowerCase();
    if (t === 'attorney') snap.attorney = data.name || '';
    if (t === 'financial advisor') snap.financialAdvisor = data.name || '';
  }
  if (section === 'medical') {
    snap.primaryDoctor = data.provider_name || '';
  }
  if (section === 'funeral') {
    snap.funeralHome = (data.funeral_home || '').trim();
  }
  return snap;
};

const sourceChangePromptCopy: Record<SourceKey, { title: string; description: (oldV: any, newV: any) => string }> = {
  address: {
    title: 'Update home address everywhere?',
    description: (_o, n) => `Your home address changed to "${n}". Some family member records and vehicle garaging fields may still show the old address. Would you like to review them?`,
  },
  spouseName: {
    title: 'Update spouse name everywhere?',
    description: (_o, n) => `Your spouse name changed to "${n}". Joint owner, joint account holder and beneficiary fields elsewhere may still show the old name. Review them now?`,
  },
  attorney: {
    title: 'Update attorney everywhere?',
    description: (_o, n) => `Your attorney is now "${n}". The "attorney to notify" field on Funeral and other legal records may still show the old name. Review them now?`,
  },
  financialAdvisor: {
    title: 'Update financial advisor everywhere?',
    description: (_o, n) => `Your financial advisor is now "${n}". Banking and Retirement contact fields may still show the old name. Review them now?`,
  },
  primaryDoctor: {
    title: 'Update primary doctor everywhere?',
    description: (_o, n) => `Your primary doctor is now "${n}". Other medical records that reference your referring physician may still show the old name. Review them now?`,
  },
  funeralHome: {
    title: 'Update funeral home everywhere?',
    description: (_o, n) => `Your funeral home is now "${n}". Advisor-style references and executor contacts may still show the old name. Review them now?`,
  },
};

// instead of existing as standalone entries. Each entry maps to a category
// stored on the documents row (related_table + related_record_id + category).
const RECORD_DOC_SLOTS: Record<string, { table: string; slots: { category: string; label: string; description?: string }[] }> = {
  vehicles: {
    table: 'vehicle_records',
    slots: [
      { category: 'title', label: 'Vehicle Title', description: 'Proof of ownership' },
      { category: 'registration', label: 'Registration', description: 'Current state registration' },
      { category: 'insurance', label: 'Insurance Card', description: 'Active policy card' },
      { category: 'loan_documents', label: 'Loan Documents', description: 'Lien or financing paperwork' },
    ],
  },
  'real-estate': {
    table: 'real_estate_records',
    slots: [
      { category: 'deed', label: 'Property Deed', description: 'Recorded deed' },
      { category: 'mortgage', label: 'Mortgage Statement', description: 'Most recent statement' },
      { category: 'title', label: 'Title Documents', description: 'Title insurance / report' },
      { category: 'insurance', label: 'Home Insurance Policy', description: 'Active homeowners policy' },
      { category: 'tax_bill', label: 'Property Tax Bill', description: 'Most recent tax statement' },
      { category: 'hoa', label: 'HOA Information', description: 'HOA documents and dues' },
      { category: 'lease', label: 'Lease Agreement', description: 'For rental properties' },
    ],
  },
  medical: {
    table: 'medical_records',
    slots: [
      { category: 'insurance_card', label: 'Insurance Card', description: 'Front and back of card' },
    ],
  },
  property: {
    table: 'personal_property_records',
    slots: [
      { category: 'appraisal', label: 'Appraisal Certificate', description: 'Most recent professional appraisal (PDF)' },
      { category: 'receipt', label: 'Receipt / Proof of Purchase', description: 'Original purchase receipt' },
      { category: 'authenticity', label: 'Certificate of Authenticity', description: 'COA or provenance documentation' },
      { category: 'insurance_rider', label: 'Insurance Rider / Policy', description: 'Coverage document for this item' },
      { category: 'other', label: 'Other Document', description: 'Any other relevant document' },
    ],
  },
};

// Extra document slots shown only when category = "Firearms & Weapons"
const FIREARM_DOC_SLOTS: { category: string; label: string; description?: string }[] = [
  { category: 'firearm_bill_of_sale', label: 'Bill of Sale / Receipt', description: 'Proof of purchase or transfer' },
  { category: 'firearm_registration', label: 'Registration Certificate', description: 'State or federal registration' },
  { category: 'firearm_ccw_permit', label: 'Concealed Carry Permit', description: 'CCW or carry license' },
];

export const AddEditSheet = ({ 
  isOpen, 
  onClose, 
  children,
  title,
  onSuccess,
  initialFile,
  initialData,
  categoryOptions = []
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  children?: React.ReactNode;
  title?: string;
  onSuccess?: (newRecord?: any) => void;
  initialFile?: File | null;
  initialData?: any;
  categoryOptions?: CategoryOption[];
}) => {
  const { activeTab, activeScope, currentPacket, profile, bumpCompletion } = useAppContext();
  const { applyDefaults, sources } = useFederatedDefaults();
  const confirm = useConfirm();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<any>({});
  const [autoFilledOrigins, setAutoFilledOrigins] = useState<Record<string, string>>({});
  const [originalSourceSnapshot, setOriginalSourceSnapshot] = useState<Record<string, any>>({});
  const [isNA, setIsNA] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [initialAttachment, setInitialAttachment] = useState<FileMetadata | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  // Profile photo (used for person records: family non-spouse, advisors)
  const [profilePhotoFile, setProfilePhotoFile] = useState<File | null>(null);
  const [profilePhotoCleared, setProfilePhotoCleared] = useState(false);

  // Determine if this is an entry-only form (no file upload)
  const isEntryOnly = initialData?.entryOnly === true || formData?.entryOnly === true;

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  useEffect(() => {
    if (initialFile) {
      setSelectedFile(initialFile);
    }
  }, [initialFile]);

  useEffect(() => {
    const loadData = async () => {
      if (isOpen) {
        setErrors({});
        setAutoFilledOrigins({});
        setProfilePhotoFile(null);
        setProfilePhotoCleared(false);
        if (initialData) {
          let data = { ...initialData };
          if (data.entryOnly && !data.category) {
            data.category = 'Other';
          }

          // If editing an existing record, hydrate with the FULL row from the
          // database so every field pre-populates — callers (like the family
          // tree) sometimes pass only a lite projection (id, name, relationship…),
          // which would otherwise leave most form fields visually blank.
          if (currentPacket && activeTab && initialData.id && !initialData.entryOnly) {
            const tableName = sectionService.tableMap[activeTab];
            if (tableName) {
              const { data: fullRow, error: fullErr } = await supabase
                .from(tableName)
                .select('*')
                .eq('id', initialData.id)
                .maybeSingle();
              if (fullErr) {
                console.error(`Failed to hydrate ${activeTab} record ${initialData.id}:`, fullErr);
              } else if (fullRow) {
                data = { ...(fullRow as any), ...data };
              }
            }
          }

          // Apply cross-section federation defaults (silent pre-fill + chip).
          // Only fills empty fields; never overwrites existing data.
          if (activeTab) {
            const isExisting = !!initialData.id && !initialData.entryOnly;
            const { data: filled, origins } = applyDefaults(activeTab, data, isExisting);
            data = filled;
            setAutoFilledOrigins(origins);
          }

          setFormData(data);
          setIsNA(data.is_na || data.status === 'not_applicable');
          // Snapshot federated source values so we can detect changes after save
          setOriginalSourceSnapshot(buildSourceSnapshot(activeTab, data));
          // Fetch existing document if editing
          if (currentPacket && activeTab && initialData.id) {
            const { data: docs } = await documentService.getDocuments(currentPacket.id, activeTab, initialData.id);
            if (docs && docs.length > 0) {
              setInitialAttachment(docs[0] as FileMetadata);
            } else {
              setInitialAttachment(null);
            }
          }
        } else {
          setFormData({});
          setIsNA(false);
          setSelectedFile(null);
          setInitialAttachment(null);
          setOriginalSourceSnapshot({});
        }
      }
    };
    loadData();
  }, [initialData, isOpen, currentPacket, activeTab, applyDefaults]);

  const config = SECTIONS_CONFIG.find(s => s.id === activeTab);

  // Section-specific field definitions
  const getSectionFields = (): { name: string; label: string; required?: boolean; type?: string; placeholder?: string; options?: string[]; rows?: number; list?: string }[] | null => {
    switch (activeTab) {
      case 'family': {
        const rel = (formData.relationship || initialData?.relationship || '').toLowerCase();

        // Base fields shared by ALL family member types
        const baseFields: any[] = [
          { name: 'relationship', label: 'Relationship', required: true, type: 'select', options: ['Spouse', 'Partner', 'Child', 'Parent', 'Sibling', 'Grandparent', 'Grandchild', 'In-Law', 'Friend', 'Other'] },
          { name: 'first_name', label: 'First Name', required: true, placeholder: 'e.g. Jane' },
          { name: 'middle_name', label: 'Middle Name', placeholder: 'Optional' },
          { name: 'last_name', label: 'Last Name', required: true, placeholder: 'e.g. Doe' },
          { name: 'suffix', label: 'Suffix', placeholder: 'Jr., Sr., III, etc.' },
          { name: 'preferred_name', label: 'Preferred Name / Nickname', placeholder: 'What they go by' },
          { name: 'birthday', label: 'Date of Birth', type: 'date' },
          { name: 'place_of_birth', label: 'Place of Birth', placeholder: 'City, State' },
          { name: 'gender', label: 'Gender', type: 'select', options: ['Female', 'Male', 'Non-binary', 'Prefer not to say', 'Other'] },
          { name: 'phone', label: 'Primary Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'email', label: 'Primary Email', type: 'email', placeholder: 'jane@example.com' },
          { name: 'address', label: 'Current Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
        ];

        // Relationship-specific fields, inserted before Notes
        const extras: any[] = [];

        if (rel === 'spouse' || rel === 'partner') {
          extras.push(
            { name: 'marital_status', label: 'Marital Status', type: 'select', options: ['married', 'separated', 'divorced', 'widowed'] },
            { name: 'marriage_date', label: 'Date of Marriage', type: 'date' },
            { name: 'marriage_place', label: 'Place of Marriage', placeholder: 'City, State' },
            { name: 'occupation', label: 'Occupation', placeholder: 'e.g. Teacher, Retired' },
            { name: 'employer', label: 'Employer', placeholder: 'Company name (optional)' },
            { name: 'ssn_masked', label: 'SSN (last 4 digits)', placeholder: 'XXX-XX-1234' },
          );
        } else if (rel === 'parent') {
          extras.push(
            { name: 'category', label: 'Parent Type', type: 'select', options: ['Biological', 'Adoptive', 'Step-parent', 'Guardian'] },
            { name: 'parent_role', label: 'Which Parent', type: 'select', options: ['Mother', 'Father', 'Other'] },
            { name: 'occupation', label: 'Occupation (or Retired)', placeholder: 'e.g. Teacher, Retired' },
            { name: 'employer', label: 'Employer', placeholder: 'Company name (optional)' },
            { name: 'ssn_masked', label: 'SSN (last 4 digits)', placeholder: 'XXX-XX-1234' },
          );
        } else if (rel === 'child' || rel === 'grandchild') {
          extras.push(
            { name: 'category', label: 'Relationship Type', type: 'select', options: ['Biological', 'Adopted', 'Step-child', 'Foster'] },
            { name: 'is_dependent', label: 'Is a Dependent', type: 'select', options: ['Yes', 'No'] },
            { name: 'is_beneficiary', label: 'Is a Beneficiary', type: 'select', options: ['Yes', 'No'] },
            { name: 'has_special_needs', label: 'Has Special Needs', type: 'select', options: ['No', 'Yes'] },
            { name: 'special_needs_notes', label: 'Special Needs / Care Instructions', type: 'textarea', placeholder: 'Description and care instructions', rows: 2 },
            { name: 'lives_with_me', label: 'Lives With Me', type: 'select', options: ['Yes', 'No'] },
            { name: 'school_name', label: 'School Name (if minor)', placeholder: 'School name' },
            { name: 'guardian_name', label: 'Guardian Name (if minor)', placeholder: 'Designated guardian' },
            { name: 'guardian_relationship', label: 'Guardian Relationship', placeholder: 'e.g. Aunt, Family friend' },
            { name: 'guardian_phone', label: 'Guardian Phone', type: 'tel', placeholder: '(555) 123-4567' },
            { name: 'ssn_masked', label: 'SSN (last 4 digits)', placeholder: 'XXX-XX-1234' },
          );
        } else if (rel === 'sibling') {
          extras.push(
            { name: 'category', label: 'Relationship Type', type: 'select', options: ['Biological', 'Half', 'Step', 'Adopted'] },
            { name: 'spouse_name', label: 'Spouse Name (if married)', placeholder: 'Optional' },
            { name: 'has_children', label: 'Has Children', type: 'select', options: ['No', 'Yes'] },
            { name: 'occupation', label: 'Occupation', placeholder: 'e.g. Teacher, Retired' },
            { name: 'ssn_masked', label: 'SSN (last 4 digits)', placeholder: 'XXX-XX-1234' },
          );
        } else if (rel === 'grandparent') {
          extras.push(
            { name: 'category', label: 'Which Side', type: 'select', options: ['Maternal', 'Paternal'] },
            { name: 'grandparent_type', label: 'Relationship Type', type: 'select', options: ['Biological', 'Step', 'Adoptive'] },
            { name: 'occupation', label: 'Occupation (or Retired)', placeholder: 'e.g. Retired' },
            { name: 'ssn_masked', label: 'SSN (last 4 digits)', placeholder: 'XXX-XX-1234' },
          );
        } else if (rel === 'in-law') {
          extras.push(
            { name: 'category', label: 'In-Law Type', type: 'select', options: ['Mother-in-law', 'Father-in-law', 'Sister-in-law', 'Brother-in-law', 'Daughter-in-law', 'Son-in-law', 'Other'] },
          );
        } else if (rel === 'other') {
          extras.push(
            { name: 'category', label: 'Relationship Description', placeholder: 'e.g. Aunt, Cousin, Godparent' },
          );
        }

        const tail: any[] = [
          { name: 'reminder_notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];

        return [...baseFields, ...extras, ...tail];
      }
      case 'medical':
        return [
          { name: 'provider_name', label: 'Provider Name', required: true, placeholder: 'e.g. Dr. Smith' },
          { name: 'specialty', label: 'Specialty', placeholder: 'e.g. Cardiologist' },
          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'referring_physician', label: 'Referring Physician', placeholder: 'Dr. who referred you' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'advisors':
        return [
          { name: 'advisor_type', label: 'Advisor Type', required: true, type: 'select', options: ['Attorney', 'Financial Advisor', 'CPA/Accountant', 'Insurance Agent', 'Doctor', 'Other'] },
          { name: 'name', label: 'Name', required: true, placeholder: 'e.g. John Smith' },
          { name: 'firm', label: 'Firm / Company', placeholder: 'e.g. Smith & Associates' },
          { name: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
          { name: 'phone', label: 'Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'email', label: 'Email', type: 'email', placeholder: 'advisor@firm.com' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'banking':
        return [
          { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g. Chase, Wells Fargo' },
          { name: 'account_type', label: 'Account Type', type: 'select', options: ['Checking', 'Savings', 'Money Market', 'CD', 'Other'] },
          { name: 'account_number_masked', label: 'Account Number', placeholder: 'Last 4 digits only for security' },
          { name: 'routing_number_masked', label: 'Routing Number', placeholder: 'Last 4 digits only' },
          { name: 'joint_account_holder', label: 'Joint Account Holder', placeholder: 'Spouse or co-owner name' },
          { name: 'beneficiary_notes', label: 'Beneficiary Notes', type: 'textarea', placeholder: 'Who is the beneficiary?' },
          { name: 'contact_info', label: 'Contact / Branch Info', placeholder: 'Branch address, phone or advisor' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'investments': {
        const accountType = String(formData.account_type || '').toLowerCase();
        const isCrypto = accountType === 'crypto exchange';
        const isPrivate = accountType === 'private equity' || accountType === 'angel / startup investment';

        const baseFields: any[] = [
          { name: 'institution', label: 'Institution / Brokerage', required: true, placeholder: 'e.g. Fidelity, Coinbase, Schwab' },
          { name: 'account_type', label: 'Account Type', type: 'select', options: [
            'Individual Brokerage', 'Joint Brokerage', 'Trust Account', 'Custodial / UTMA',
            'Crypto Exchange', 'Self-Directed', 'Private Equity', 'Angel / Startup Investment',
            'Hedge Fund', 'Managed Portfolio', 'Other'
          ]},
          { name: 'account_nickname', label: 'Account Nickname', placeholder: 'e.g. "Fidelity Brokerage"' },
          { name: 'account_number_masked', label: 'Account Number', placeholder: 'Last 4 digits only for security' },
          { name: 'approximate_value', label: 'Approximate Current Value ($)', type: 'number', placeholder: '0.00' },
          { name: 'last_statement_date', label: 'Date of Last Statement', type: 'date' },
          { name: 'is_joint_account', label: 'Joint Account', type: 'select', options: ['No', 'Yes'] },
          ...(String(formData.is_joint_account) === 'Yes' || formData.is_joint_account === true
            ? [{ name: 'co_owner_name', label: 'Co-Owner Name', placeholder: 'Joint owner full name' }]
            : []),
          // Access
          { name: 'website_url', label: 'Website / Login URL', placeholder: 'https://...' },
          { name: 'username_masked', label: 'Username', placeholder: 'Masked username or hint' },
          { name: 'password_hint', label: 'Password Hint', placeholder: 'See Passwords section — do NOT enter actual password' },
          { name: 'account_phone', label: 'Account Services Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'branch_address', label: 'Branch Address (if applicable)', type: 'textarea', placeholder: 'Branch address', rows: 2 },
          // Advisor
          { name: 'advisor_name', label: 'Financial Advisor Name', placeholder: 'Auto-fills from Advisors if available', list: 'family-recipients' },
          { name: 'advisor_phone', label: 'Advisor Phone', type: 'tel', placeholder: '(555) 123-4567' },
          { name: 'advisor_email', label: 'Advisor Email', type: 'email', placeholder: 'advisor@firm.com' },
          // Holdings
          { name: 'primary_holdings_description', label: 'Primary Holdings Description', type: 'textarea', placeholder: 'e.g. Mix of index funds and tech stocks', rows: 2 },
          { name: 'allocation_stocks_pct', label: 'Stocks %', type: 'number', placeholder: '0' },
          { name: 'allocation_bonds_pct', label: 'Bonds %', type: 'number', placeholder: '0' },
          { name: 'allocation_cash_pct', label: 'Cash %', type: 'number', placeholder: '0' },
          { name: 'allocation_other_pct', label: 'Other %', type: 'number', placeholder: '0' },
          { name: 'restricted_stock_notes', label: 'Restricted Stock / Vesting Notes', type: 'textarea', placeholder: 'RSU vesting schedule, lockup periods, etc.', rows: 2 },
          // Beneficiary
          { name: 'primary_beneficiary', label: 'Primary Beneficiary', placeholder: 'Pulls from family members', list: 'family-recipients' },
          { name: 'contingent_beneficiary', label: 'Contingent Beneficiary', placeholder: 'Backup beneficiary', list: 'family-recipients' },
          { name: 'tod_on_file', label: 'TOD (Transfer on Death) On File', type: 'select', options: ['No', 'Yes'] },
        ];

        const cryptoFields: any[] = isCrypto
          ? [
              { name: 'crypto_exchange_name', label: 'Exchange Name', placeholder: 'e.g. Coinbase, Kraken' },
              { name: 'crypto_wallet_type', label: 'Wallet Type', type: 'select', options: ['Exchange', 'Hardware wallet', 'Software wallet'] },
              { name: 'crypto_hardware_wallet_location', label: 'Hardware Wallet Location', placeholder: 'Physical location of device' },
              { name: 'crypto_seed_phrase_location', label: 'Seed Phrase Location (LOCATION ONLY)', type: 'textarea', placeholder: '⚠ Never enter the actual seed phrase. Describe where it is physically stored.', rows: 2 },
            ]
          : [];

        const piFields: any[] = isPrivate
          ? [
              { name: 'pi_company_name', label: 'Company Name', placeholder: 'Portfolio company' },
              { name: 'pi_investment_date', label: 'Investment Date', type: 'date' },
              { name: 'pi_amount_invested', label: 'Amount Invested ($)', type: 'number', placeholder: '0.00' },
              { name: 'pi_current_value', label: 'Current Estimated Value ($)', type: 'number', placeholder: '0.00' },
              { name: 'pi_investment_stage', label: 'Investment Stage', type: 'select', options: ['Pre-seed', 'Seed', 'Series A', 'Series B', 'Series C', 'Series D+', 'Growth', 'Pre-IPO', 'Other'] },
              { name: 'pi_company_contact', label: 'Contact at Company', placeholder: 'Founder, CFO, etc.' },
              { name: 'pi_shareholder_agreement_notes', label: 'Shareholder Agreement Notes', type: 'textarea', placeholder: 'Key terms, transfer restrictions, etc.', rows: 3 },
            ]
          : [];

        const dispositionFields: any[] = [
          { name: 'disposition_action', label: 'Disposition Action', type: 'select', options: ['Liquidate', 'Transfer', 'Hold'] },
          { name: 'disposition_instructions', label: 'Specific Instructions for Executor', type: 'textarea', placeholder: 'How should the executor handle this account?', rows: 3 },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];

        return [...baseFields, ...cryptoFields, ...piFields, ...dispositionFields];
      }
      case 'retirement':
        return [
          { name: 'account_type', label: 'Account Type', type: 'select', options: ['401(k)', 'IRA', 'Roth IRA', 'Pension', '403(b)', 'Other'] },
          { name: 'institution', label: 'Institution', required: true, placeholder: 'e.g. Fidelity, Vanguard' },
          { name: 'account_number_masked', label: 'Account Number', placeholder: 'Last 4 digits only' },
          { name: 'beneficiary_notes', label: 'Beneficiary Notes', type: 'textarea', placeholder: 'Who is the beneficiary?' },
          { name: 'contact_info', label: 'Contact Info', placeholder: 'Advisor or institution contact' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'vehicles':
        return [
          { name: 'year', label: 'Year', placeholder: '4-digit year, e.g. 2022' },
          { name: 'make', label: 'Make', placeholder: 'e.g. Toyota' },
          { name: 'model', label: 'Model', placeholder: 'e.g. Camry' },
          { name: 'vin', label: 'VIN', placeholder: '17-character VIN' },
          { name: 'license_plate', label: 'License Plate', placeholder: 'ABC-1234' },
          { name: 'insurance', label: 'Insurance', placeholder: 'Carrier and policy number' },
          { name: 'garaging_address', label: 'Garaging Address (for insurance)', type: 'textarea', placeholder: 'Where the vehicle is normally parked', rows: 2 },
          { name: 'lien_info', label: 'Lien Info', placeholder: 'Lien holder if any' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'real-estate':
        return [
          { name: 'property_label', label: 'Property Label', required: true, placeholder: 'e.g. Primary Home' },
          { name: 'address', label: 'Address', type: 'textarea', placeholder: '123 Main St, City, State', rows: 2 },
          { name: 'insurance_details', label: 'Insurance Details', type: 'textarea', placeholder: 'Carrier and policy number', rows: 2 },
          { name: 'security_system_details', label: 'Security System Details', placeholder: 'Alarm code, provider, etc.' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'passwords':
        return [
          { name: 'service_name', label: 'Service Name', required: true, placeholder: 'e.g. Gmail, Netflix' },
          { name: 'username', label: 'Username', placeholder: 'Login username or email' },
          { name: 'access_instructions', label: 'Access Instructions', type: 'textarea', placeholder: 'How to access this account — write for a survivor to read' },
          { name: 'recovery_email', label: 'Recovery Email', type: 'email', placeholder: 'Recovery email address' },
          { name: 'two_fa_notes', label: 'Two-Factor Auth Notes', placeholder: 'How to access 2FA codes' },
          { name: 'who_should_access', label: 'Who Should Access', placeholder: 'Who needs this after you?' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional details...' },
        ];
      case 'property': {
        const baseFields: any[] = [
          { name: 'title', label: 'Item Name / Title', required: true, placeholder: "e.g. Grandmother's diamond ring" },
          { name: 'category', label: 'Category', type: 'select', options: [
            'Jewelry & Watches', 'Art & Paintings', 'Collectibles & Memorabilia',
            'Firearms & Weapons', 'Musical Instruments', 'Sports Equipment',
            'Hobby Equipment', 'Antiques & Furniture', 'Electronics & Technology',
            'Vehicles (non-titled)', 'Coins & Currency', 'Wine & Spirits',
            'Books & Manuscripts', 'Other'
          ]},
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Make, model, year, condition, provenance, history...', rows: 3 },
          { name: 'brand', label: 'Brand / Manufacturer', placeholder: 'e.g. Rolex, Steinway' },
          { name: 'model_serial', label: 'Model / Serial Number', placeholder: 'Model or serial #' },
          { name: 'year_acquired', label: 'Year Acquired', type: 'number', placeholder: 'e.g. 2015' },
          { name: 'acquisition_price', label: 'Acquisition Price ($)', type: 'number', placeholder: '0.00' },
          { name: 'estimated_value', label: 'Current Estimated Value ($)', type: 'number', placeholder: '0.00' },
          { name: 'appraised_value', label: 'Appraised Value ($)', type: 'number', placeholder: '0.00' },
          { name: 'last_appraisal_date', label: 'Date of Last Appraisal', type: 'date' },
          { name: 'condition', label: 'Condition', type: 'select', options: ['Mint', 'Excellent', 'Good', 'Fair', 'Poor'] },
          { name: 'location', label: 'Location', placeholder: 'e.g. Master bedroom safe, Storage unit B12' },
          // Appraisal
          { name: 'appraiser_name', label: 'Appraiser Name', placeholder: 'Person who appraised this item' },
          { name: 'appraiser_company', label: 'Appraisal Company', placeholder: 'Firm or auction house' },
          // Insurance
          { name: 'insurance_rider', label: 'Separately Insured (Rider)', type: 'select', options: ['No', 'Yes'] },
          { name: 'insurance_company', label: 'Insurance Company', placeholder: 'If item has its own rider' },
          { name: 'insurance_policy_number', label: 'Insurance Policy Number', placeholder: 'Policy #' },
          { name: 'insurance_coverage_amount', label: 'Coverage Amount ($)', type: 'number', placeholder: '0.00' },
          // Ownership & Provenance
          { name: 'acquisition_method', label: 'How Acquired', type: 'select', options: ['Purchased', 'Inherited', 'Gifted', 'Found', 'Other'] },
          { name: 'acquired_from', label: 'Acquired From', placeholder: 'Dealer, auction house, person' },
          { name: 'has_certificate_of_authenticity', label: 'Has Certificate of Authenticity', type: 'select', options: ['No', 'Yes'] },
          { name: 'chain_of_custody', label: 'Chain of Custody / History', type: 'textarea', placeholder: 'Ownership history and provenance notes...', rows: 3 },
          // Disposition
          { name: 'disposition_action', label: 'What Should Happen To This Item', type: 'select', options: ['Sell', 'Keep in family', 'Donate', 'Auction', 'Destroy / discard', 'Per my Will'] },
          { name: 'specific_recipient', label: 'Specific Recipient', placeholder: 'Name (family or other)', list: 'family-recipients' },
          { name: 'estimated_sale_price', label: 'Estimated Sale Price ($)', type: 'number', placeholder: '0.00' },
          { name: 'preferred_selling_method', label: 'Preferred Selling Method', type: 'select', options: ['Private sale', 'Auction', 'Estate sale', 'Online marketplace'] },
          { name: 'sentimental_notes', label: 'Sentimental Notes (visible to trusted person)', type: 'textarea', placeholder: 'Why this item matters...', rows: 3 },
          { name: 'special_handling', label: 'Special Handling Instructions', type: 'textarea', placeholder: 'Fragile, climate-sensitive, etc.', rows: 2 },
          { name: 'notes', label: 'Additional Notes', type: 'textarea', placeholder: 'Anything else...', rows: 2 },
        ];

        if (formData.category === 'Firearms & Weapons') {
          const firearmFields: any[] = [
            { name: '__firearm_id_header', type: 'header', label: 'Firearm Identification' },
            { name: 'firearm_type', label: 'Firearm Type', type: 'select', options: ['Handgun', 'Rifle', 'Shotgun', 'Antique', 'Other'] },
            { name: 'firearm_make', label: 'Make / Manufacturer', required: true, placeholder: 'e.g. Smith & Wesson' },
            { name: 'firearm_model', label: 'Model', required: true, placeholder: 'e.g. M&P Shield 9mm' },
            { name: 'firearm_caliber', label: 'Caliber / Gauge', placeholder: 'e.g. 9mm, .45 ACP, 12 gauge' },
            { name: 'firearm_serial_masked', label: 'Serial Number', required: true, type: 'masked', placeholder: 'Serial number — stored securely' },
            { name: 'firearm_finish', label: 'Finish / Color', placeholder: 'e.g. Blued, Stainless, Matte black' },
            { name: 'firearm_barrel_length', label: 'Barrel Length', placeholder: 'e.g. 4 inches' },
            { name: 'firearm_action_type', label: 'Action Type', type: 'select', options: ['Semi-auto', 'Bolt', 'Lever', 'Pump', 'Revolver', 'Single shot'] },
            { name: 'firearm_year_manufactured', label: 'Year Manufactured', type: 'number', placeholder: 'e.g. 1998' },
            { name: 'firearm_country_origin', label: 'Country of Origin', placeholder: 'e.g. USA, Germany, Italy' },
            { name: '__firearm_photo_note', type: 'note', label: 'Photograph both sides, the serial number, and any unique markings.' },
            { name: '__firearm_storage_header', type: 'header', label: 'Storage & Access' },
            { name: 'firearm_storage_location', label: 'Storage Location', placeholder: 'e.g. Gun safe in master closet' },
            { name: 'firearm_safe_code_masked', label: 'Safe Combination / Access Code', type: 'masked', placeholder: 'Combination — stored securely' },
            { name: 'firearm_who_has_access', label: 'Who Has Access', type: 'textarea', placeholder: 'Names of people who know how to access', rows: 2 },
            { name: 'firearm_is_loaded', label: 'Is It Loaded?', type: 'select', options: ['No', 'Yes'] },
            { name: 'firearm_ammunition_location', label: 'Ammunition Storage Location', placeholder: 'Where ammo is kept' },
            { name: '__firearm_legal_header', type: 'header', label: 'Legal & Ownership' },
            { name: 'firearm_purchased_from_type', label: 'Purchased From', type: 'select', options: ['Dealer', 'Private sale', 'Auction', 'Inherited', 'Gifted'] },
            { name: 'firearm_ffl_dealer', label: 'FFL Dealer Name', placeholder: 'If purchased through licensed dealer' },
            { name: 'firearm_purchase_date', label: 'Date of Purchase', type: 'date' },
            { name: 'firearm_is_registered', label: 'Is It Registered?', type: 'select', options: ['No', 'Yes'] },
            { name: 'firearm_registration_state', label: 'Registration State', placeholder: 'State where registered' },
            { name: 'firearm_transfer_restrictions', label: 'Transfer Restrictions', type: 'textarea', placeholder: 'Any noted transfer restrictions...', rows: 2 },
            { name: '__firearm_permit_header', type: 'header', label: 'License & Permits' },
            { name: 'firearm_ccw_permit', label: 'Concealed Carry Permit', type: 'select', options: ['No', 'Yes'] },
            { name: 'firearm_ccw_state', label: 'Permit State', placeholder: 'State that issued the permit' },
            { name: 'firearm_ccw_expiration', label: 'Permit Expiration Date', type: 'date' },
            { name: '__firearm_disposition_header', type: 'header', label: 'Firearm Disposition Instructions' },
            { name: '__firearm_legal_warning', type: 'warning', label: 'Firearm transfers must comply with federal and state law — consult an attorney before transferring.' },
            { name: 'firearm_disposition_action', label: 'What Should Happen To This Firearm', type: 'select', options: ['Transfer to family member', 'Sell through licensed dealer', 'Surrender to law enforcement', 'Per my Will'] },
            { name: 'firearm_disposition_recipient', label: 'Recipient (if transferring)', placeholder: 'Family member name', list: 'family-recipients' },
            { name: 'firearm_attorney_to_contact', label: 'Attorney to Contact', placeholder: 'Attorney name & phone' },
            { name: 'firearm_special_instructions', label: 'Special Instructions', type: 'textarea', placeholder: 'Any additional instructions for disposition...', rows: 3 },
          ];
          return [...baseFields, ...firearmFields];
        }
        return baseFields;
      }
      case 'pets':
        return [
          { name: 'pet_name', label: 'Pet Name', required: true, placeholder: 'e.g. Buddy' },
          { name: 'species_breed', label: 'Species & Breed', placeholder: 'e.g. Golden Retriever' },
          { name: 'age', label: 'Age', placeholder: 'e.g. 5 years' },
          { name: 'veterinarian_contact', label: 'Veterinarian Contact', placeholder: 'Vet name and phone' },
          { name: 'medications', label: 'Medications', type: 'textarea', placeholder: 'Current medications' },
          { name: 'feeding_instructions', label: 'Feeding Instructions', type: 'textarea', placeholder: 'Diet and feeding schedule' },
          { name: 'care_instructions', label: 'Care Instructions', type: 'textarea', placeholder: 'Daily care routine' },
          { name: 'emergency_notes', label: 'Emergency Notes', type: 'textarea', placeholder: 'Emergency care info' },
        ];
      case 'funeral':
        return [
          { name: 'funeral_home', label: 'Funeral Home', placeholder: 'Name of funeral home' },
          { name: 'funeral_director', label: 'Funeral Director', placeholder: 'Contact person' },
          { name: 'burial_or_cremation', label: 'Burial or Cremation', type: 'select', options: ['Burial', 'Cremation', 'No Preference', 'Pre-arranged'] },
          { name: 'service_preferences', label: 'Service Preferences', type: 'textarea', placeholder: 'Type of service desired' },
          { name: 'religious_cultural_preferences', label: 'Religious / Cultural Preferences', placeholder: 'Any traditions or customs' },
          { name: 'cemetery_plot_details', label: 'Cemetery / Plot Details', placeholder: 'Location and plot info' },
          { name: 'prepaid_arrangements', label: 'Prepaid Arrangements', placeholder: 'Details of prepaid plans' },
          { name: 'attorney_to_notify', label: 'Attorney to Notify', type: 'textarea', placeholder: 'Attorney name, firm and phone', rows: 2 },
          { name: 'obituary_notes', label: 'Obituary Notes', type: 'textarea', placeholder: 'Key points for obituary' },
          { name: 'additional_instructions', label: 'Additional Instructions', type: 'textarea', placeholder: 'Anything else...' },
        ];
      case 'private':
        return [
          { name: 'title', label: 'Title', required: true, placeholder: 'e.g. Safe combination' },
          { name: 'description', label: 'Description', type: 'textarea', placeholder: 'Details about this private item' },
          { name: 'notes', label: 'Notes', type: 'textarea', placeholder: 'Any additional notes...' },
        ];
      default:
        return null; // Use generic form
    }
  };

  const sectionFields = getSectionFields();
  const hasSectionFields = sectionFields !== null && !isEntryOnly;

  const getDisplayTitle = (data: any) => {
    if (sectionFields) {
      const primaryField = sectionFields[0];
      return data[primaryField.name] || '';
    }
    return data.title || data.name || data.item_name || data.institution || 
           data.service_name || data.property_label || data.model || 
           data.service_preferences || data.burial_or_cremation || 
           data.funeral_home || data.prepaid_arrangements || '';
  };

  const setDisplayTitle = (val: string) => {
    if (sectionFields) {
      const primaryField = sectionFields[0];
      setFormData({ ...formData, [primaryField.name]: val });
      return;
    }
    const field = activeTab === 'family' || activeTab === 'advisors' || activeTab === 'pets' ? 'name' : 
                 activeTab === 'real-estate' ? 'property_label' :
                 activeTab === 'banking' || activeTab === 'retirement' ? 'institution' :
                 activeTab === 'passwords' ? 'service_name' :
                 activeTab === 'property' ? 'item_name' :
                 activeTab === 'vehicles' ? 'model' :
                 activeTab === 'funeral' ? 'service_preferences' : 'title';
    setFormData({ 
      ...formData, 
      [field]: val
    });
  };

  const handleSave = async () => {
    if (!currentPacket || !activeTab) {
      toast.error("Unable to save: missing packet or section context.", { duration: 5000, position: "bottom-center" });
      return;
    }
    
    // Validation for section-specific fields
    if (!isNA && hasSectionFields && sectionFields) {
      const newErrors: Record<string, string> = {};
      sectionFields.forEach(field => {
        if (field.required && !formData[field.name]) {
          newErrors[field.name] = `${field.label} is required`;
        }
      });
      if (Object.keys(newErrors).length > 0) {
        setErrors(newErrors);
        return;
      }
    }

    // Validation for Info section
    if (activeTab === 'info' && !formData.category && !isNA && !isEntryOnly) {
      setErrors({ category: "Please select a category." });
      return;
    }

    setLoading(true);
    try {
      // 0. Get current user for created_by/uploaded_by
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Authentication required");

      // 0a. Upload profile photo if a new one was selected (family/advisors)
      let profilePhotoPath: string | null | undefined = undefined;
      if (activeTab === 'family' || activeTab === 'advisors') {
        if (profilePhotoFile && currentPacket) {
          const safe = profilePhotoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
          const ts = Date.now();
          const recIdHint = initialData?.id || 'new';
          const path = `${currentPacket.id}/${activeTab}/${recIdHint}/profile_${ts}_${safe}`;
          const { error: photoErr } = await uploadService.uploadFile('packet-documents', path, profilePhotoFile);
          if (photoErr) throw new Error(photoErr.message || 'Profile photo upload failed');
          profilePhotoPath = path;
        } else if (profilePhotoCleared) {
          profilePhotoPath = null;
        }
      }

      // 1. Create or Update the record metadata
      let recordToSave: any;
      
      if (activeTab === 'info') {
        recordToSave = {
          packet_id: currentPacket.id,
          scope: activeScope || 'personA',
          category: formData.category || 'Other',
          title: formData.name || formData.title || '',
          notes: formData.notes || '',
          status: isNA ? 'not_applicable' : 'completed',
          is_na: isNA,
          created_by: user.id
        };
      } else {
        const record: any = {
          packet_id: currentPacket.id,
          scope: activeScope || 'personA',
          ...formData,
          category: formData.category || 'Other',
          status: isNA ? 'not_applicable' : 'completed',
          is_na: isNA
        };
        // Strip UI-only meta fields (headers, notes, warnings) that begin with "__"
        Object.keys(record).forEach((k) => {
          if (k.startsWith('__')) delete record[k];
        });
        // Apply newly uploaded / cleared profile photo for person records
        if (activeTab === 'family' || activeTab === 'advisors') {
          if (profilePhotoPath !== undefined) {
            record.photo_path = profilePhotoPath;
          }
        }
        // Property: coerce Yes/No strings to booleans for boolean columns and empty dates to null
        if (activeTab === 'property') {
          const boolKeys = [
            'insurance_rider', 'has_certificate_of_authenticity',
            'firearm_is_loaded', 'firearm_is_registered', 'firearm_ccw_permit',
          ];
          boolKeys.forEach((k) => {
            if (record[k] === 'Yes') record[k] = true;
            else if (record[k] === 'No') record[k] = false;
            else if (record[k] === '') record[k] = null;
          });
          const dateKeys = ['last_appraisal_date', 'firearm_purchase_date', 'firearm_ccw_expiration'];
          dateKeys.forEach((k) => { if (record[k] === '') record[k] = null; });
        }
        // Family: route through the dedicated family service so all the new
        // structured columns (is_dependent, is_beneficiary, guardian_*, etc.)
        // persist correctly. Any unknown UI-only fields are folded into
        // legacy_notes so data is never silently dropped.
        if (activeTab === 'family') {
          // Lazy import to avoid circular deps at module load time
          const { sanitizeFamilyPayload } = await import('@/services/familyService');
          const sanitized = sanitizeFamilyPayload(record);
          // Merge sanitized result back into `record` (rest of the save pipeline expects `record`)
          Object.keys(record).forEach((k) => { if (!(k in sanitized)) delete record[k]; });
          Object.assign(record, sanitized);
        }
        const { id, created_at, updated_at, entryOnly, ...rest } = record;
        recordToSave = rest;
      }

      console.log(`${activeTab} insert payload:`, JSON.stringify(recordToSave, null, 2));

      let recordId = initialData?.id;
      let savedRecord: any = null;
      if (recordId) {
        const { data: updatedRecord, error: recordError } = await sectionService.updateRecord(activeTab, recordId, recordToSave);
        if (recordError) {
          console.error(`${activeTab} update error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        savedRecord = updatedRecord;
        console.log(`${activeTab} update result: Success`, updatedRecord);
      } else {
        const { data: newRecord, error: recordError } = await sectionService.createRecord(activeTab, recordToSave);
        if (recordError) {
          console.error(`${activeTab} insert error response:`, JSON.stringify(recordError, null, 2));
          throw recordError;
        }
        recordId = newRecord?.id;
        savedRecord = newRecord;
        console.log(`${activeTab} insert result:`, newRecord);
      }

      // 2. Upload file if selected (ONLY after record creation succeeds)
      if (selectedFile && recordId && !isNA && !isEntryOnly) {
        console.log("Starting file upload sequence for record:", recordId);
        const recordTitle = formData.name || formData.property_label || formData.institution || formData.service_name || formData.item_name || formData.title;
        
        const { data: docData, error: uploadError } = await documentService.uploadAndCreate(selectedFile, {
          packetId: currentPacket.id,
          sectionKey: activeTab,
          recordId: recordId,
          category: formData.category,
          fileName: selectedFile.name,
          scope: activeScope || 'personA',
          isPrivate: activeTab === 'private'
        });
        
        if (uploadError) {
          console.error("Upload sequence failed:", JSON.stringify(uploadError, null, 2));
          throw uploadError;
        }
        console.log("File upload and metadata storage successful:", docData);
      }
      
      console.log("Final save success");

      // Notify trusted contacts about the section update (fire-and-forget)
      const SECTION_DISPLAY_NAMES: Record<string, string> = {
        info: 'Info & Identity', family: 'Family & Contacts', medical: 'Medical Information',
        banking: 'Banking & Financial', 'real-estate': 'Real Estate', retirement: 'Retirement Accounts',
        vehicles: 'Vehicles', advisors: 'Advisors', passwords: 'Passwords & Access',
        property: 'Personal Property', pets: 'Pets', funeral: 'Funeral Wishes', private: 'Private Items',
      };
      const sectionKey = (activeTab || '').replace('-', '_'); // normalize real-estate → real_estate
      supabase.functions.invoke('notify-contact-update', {
        body: {
          user_id: user.id,
          section_name: sectionKey,
          section_display_name: SECTION_DISPLAY_NAMES[activeTab || ''] || activeTab,
          packet_owner_name: profile?.full_name || '',
        },
      }).catch(err => console.error('Contact notification failed (non-blocking):', err));

      toast.success("Information saved successfully!", { icon: <CheckCircle size={18} className="text-emerald-500" />, duration: 3000, position: "bottom-center" });
      bumpCompletion(); // refresh all completion displays (header badge, ring, folder cards)

      // Cross-section sync prompt: if a federated source value changed,
      // ask the user whether to review the downstream destinations.
      const newSnap = buildSourceSnapshot(activeTab, savedRecord || recordToSave);
      const changedKeys = (Object.keys(newSnap) as SourceKey[]).filter((k) => {
        const newV = String(newSnap[k] ?? '').trim();
        const oldV = String(originalSourceSnapshot[k] ?? '').trim();
        return newV && newV !== oldV;
      });
      for (const key of changedKeys) {
        const copy = sourceChangePromptCopy[key];
        // Fire-and-forget — non-blocking confirm
        confirm({
          title: copy.title,
          description: copy.description(originalSourceSnapshot[key], newSnap[key]),
          confirmLabel: 'Review now',
          cancelLabel: 'Not now',
        }).then((ok) => {
          if (ok) {
            toast.info('Open the related sections to review auto-fill suggestions.', { duration: 4000, position: 'bottom-center' });
          }
        });
        break; // one prompt per save to avoid stacking dialogs
      }

      if (onSuccess) onSuccess(savedRecord);
      handleClose();
    } catch (err: any) {
      console.error("Error saving record:", err);
      const errorMessage = err?.message || (typeof err === 'object' ? JSON.stringify(err) : String(err));
      toast.error(`Failed to save record: ${errorMessage}`, { duration: 5000, position: "bottom-center" });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setFormData({});
    setIsNA(false);
    setSelectedFile(null);
    setInitialAttachment(null);
    setErrors({});
  };

  const effectiveCategoryOptions = categoryOptions.length > 0 ? categoryOptions : (activeTab === 'info' ? INFO_CATEGORY_OPTIONS : []);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay for desktop/tablet */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 hidden md:block"
          />
          <motion.div 
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-0 md:inset-auto md:top-10 md:bottom-10 md:left-1/2 md:-translate-x-1/2 z-50 bg-white flex flex-col w-full md:max-w-[640px] md:rounded-3xl md:shadow-2xl overflow-hidden"
          >
            <div className="p-6 border-b border-stone-100 flex justify-between items-center bg-[#fdfaf3]/80 backdrop-blur-md sticky top-0 z-10">
            <h2 className="text-xl font-serif font-bold text-navy-muted">
              {title || (() => {
                // Section-specific default modal titles
                const sectionTitles: Record<string, string> = {
                  'medical': 'Add Medical Provider',
                  'banking': 'Add Bank Account',
                  'investments': 'Add Investment Account',
                  'real-estate': 'Add Property',
                  'retirement': 'Add Retirement Account',
                  'vehicles': 'Add Vehicle',
                  'advisors': 'Add Advisor',
                  'passwords': 'Add Password / Access',
                  'property': 'Add Personal Property',
                  'pets': 'Add Pet',
                  'funeral': 'Add Funeral Wishes',
                  'private': 'Add Private Item',
                  'family': 'Add Family Member',
                };
                // Dynamic title based on prefilled select field
                if (sectionFields && initialData) {
                  const prefilledSelect = sectionFields.find(f => f.type === 'select' && initialData[f.name]);
                  if (prefilledSelect) return `Add ${initialData[prefilledSelect.name]}`;
                }
                return (activeTab && sectionTitles[activeTab]) || `Add ${config?.label}`;
              })()}
            </h2>
            <button 
              onClick={handleClose}
              disabled={loading}
              className="p-2 hover:bg-stone-100 rounded-full transition-colors"
            >
              <X size={24} className="text-stone-400" />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-[#fdfaf3]">
            {children || (
              <div className="space-y-6">
                <div className="flex items-center justify-between p-4 bg-stone-50 border border-stone-200 rounded-2xl">
                  <div>
                    <h4 className="text-sm font-bold text-navy-muted">Not Applicable</h4>
                    <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider">Mark this item as N/A</p>
                  </div>
                  <button
                    onClick={() => setIsNA(!isNA)}
                    className={`w-12 h-6 rounded-full transition-all relative ${isNA ? 'bg-navy-muted' : 'bg-stone-200'}`}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${isNA ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>

                {/* Family: Living / Deceased toggle */}
                {!isNA && activeTab === 'family' && (
                  <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-navy-muted">Life Status</h4>
                      <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                        Affects estate distribution and family tree display
                      </p>
                    </div>
                    <LifeStatusToggle
                      value={!!formData.is_deceased}
                      onChange={(deceased) => setFormData({ ...formData, is_deceased: deceased })}
                      disabled={loading}
                    />
                    {formData.is_deceased && (
                      <div className="space-y-3 pt-2 border-t border-stone-100">
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                            Date of Death (optional)
                          </label>
                          <input
                            type="date"
                            className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-navy-muted outline-none text-sm"
                            value={formData.date_of_death || ''}
                            onChange={(e) => setFormData({ ...formData, date_of_death: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        <div className="space-y-2">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                            Cause of Death (optional, private)
                          </label>
                          <textarea
                            rows={2}
                            placeholder="Kept private — visible only to you and trusted contacts"
                            className="w-full p-3 bg-white rounded-xl border border-stone-200 focus:border-navy-muted outline-none text-sm resize-none"
                            value={formData.cause_of_death || ''}
                            onChange={(e) => setFormData({ ...formData, cause_of_death: e.target.value })}
                            disabled={loading}
                          />
                        </div>
                        {currentPacket && (
                          <DeathCertificateUpload
                            packetId={currentPacket.id}
                            relatedTable="family_members"
                            relatedRecordId={initialData?.id ?? null}
                          />
                        )}
                      </div>
                    )}
                  </div>
                )}

                {/* Advisors: Active / Retired / Former / Deceased */}
                {!isNA && activeTab === 'advisors' && (
                  <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                    <div>
                      <h4 className="text-sm font-bold text-navy-muted">Advisor Status</h4>
                      <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                        Controls whether their contact info should be acted upon
                      </p>
                    </div>
                    <AdvisorStatusToggle
                      value={formData.advisor_status || 'active'}
                      onChange={(s) => setFormData({ ...formData, advisor_status: s })}
                      disabled={loading}
                    />
                    {formData.advisor_status === 'deceased' && currentPacket && (
                      <DeathCertificateUpload
                        packetId={currentPacket.id}
                        relatedTable="advisor_records"
                        relatedRecordId={initialData?.id ?? null}
                      />
                    )}
                  </div>
                )}

                {/* Profile photo for person records (non-spouse family + advisors) */}
                {!isNA && (activeTab === 'family' || activeTab === 'advisors') && (
                  <div className="flex justify-center -mb-2">
                    <ProfilePhotoUploader
                      photoPath={profilePhotoCleared ? null : (formData.photo_path || null)}
                      pendingFile={profilePhotoFile}
                      name={
                        activeTab === 'advisors'
                          ? formData.name
                          : [formData.first_name, formData.last_name].filter(Boolean).join(' ') || formData.name
                      }
                      isDeceased={
                        activeTab === 'family'
                          ? !!formData.is_deceased
                          : formData.advisor_status === 'deceased'
                      }
                      onFileSelected={(file) => {
                        setProfilePhotoFile(file);
                        setProfilePhotoCleared(false);
                      }}
                      onRemove={() => {
                        setProfilePhotoFile(null);
                        setProfilePhotoCleared(true);
                      }}
                      disabled={loading}
                      size={96}
                    />
                  </div>
                )}

                {!isNA && hasSectionFields && sectionFields && (
                  <>
                    {/* Show read-only label for pre-filled select fields */}
                    {sectionFields && initialData && (() => {
                      const prefilledSelect = sectionFields.find(f => f.type === 'select' && initialData[f.name] && formData[f.name]);
                      if (!prefilledSelect) return null;
                      return (
                        <div className="p-4 bg-manila/30 border border-manila rounded-2xl flex items-center gap-3">
                          <span className="text-[10px] font-bold uppercase tracking-widest text-stone-400">Adding:</span>
                          <span className="text-sm font-bold text-navy-muted">{formData[prefilledSelect.name]}</span>
                        </div>
                      );
                    })()}

                    {sectionFields
                      .filter((field) => {
                        if (field.type === 'select' && initialData?.[field.name] && formData[field.name]) return false;
                        return true;
                      })
                      .map((field) => {
                        // Render section header within the field stream
                        if (field.type === 'header') {
                          return (
                            <div key={field.name} className="pt-4 pb-1 border-t border-stone-200 first:border-t-0 first:pt-2">
                              <h3 className="text-xs font-bold uppercase tracking-widest text-navy-muted">{field.label}</h3>
                            </div>
                          );
                        }
                        // Render an inline informational note (e.g. photo prompt)
                        if (field.type === 'note') {
                          return (
                            <div key={field.name} className="text-[11px] text-stone-500 italic px-1 -mt-1">
                              {field.label}
                            </div>
                          );
                        }
                        // Render a legal/safety warning callout
                        if (field.type === 'warning') {
                          return (
                            <div key={field.name} className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] font-semibold text-amber-800 leading-snug">
                              ⚠️ {field.label}
                            </div>
                          );
                        }

                        const origin = autoFilledOrigins[field.name];
                        const clearOrigin = () => {
                          if (!origin) return;
                          setAutoFilledOrigins((prev) => {
                            const next = { ...prev };
                            delete next[field.name];
                            return next;
                          });
                        };
                        const handleChange = (val: any) => {
                          setFormData({ ...formData, [field.name]: val });
                          if (origin) clearOrigin();
                        };
                        return (
                      <div key={field.name} className="space-y-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                            {field.label} {field.required && <span className="text-red-500">*</span>}
                          </label>
                          {origin ? <AutoFilledIndicator sourceLabel={origin} onClear={() => { clearOrigin(); setFormData({ ...formData, [field.name]: '' }); }} /> : null}
                        </div>
                        {field.type === 'textarea' ? (
                          <textarea
                            rows={field.rows || 3}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm resize-none font-medium"
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            disabled={loading}
                          />
                        ) : field.type === 'select' && field.options ? (
                          <select
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium appearance-none"
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            disabled={loading}
                          >
                            <option value="">Select {field.label.toLowerCase()}...</option>
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>{opt}</option>
                            ))}
                          </select>
                        ) : field.type === 'masked' ? (
                          <MaskedInput
                            value={formData[field.name] || ''}
                            onChange={handleChange}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                            disabled={loading}
                          />
                        ) : (
                          <input
                            type={field.type || 'text'}
                            list={field.list}
                            placeholder={field.placeholder || `Enter ${field.label.toLowerCase()}...`}
                            className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                            value={formData[field.name] || ''}
                            onChange={(e) => handleChange(e.target.value)}
                            disabled={loading}
                          />
                        )}
                        {errors[field.name] && (
                          <p className="text-xs font-bold text-red-500 mt-1">{errors[field.name]}</p>
                        )}
                        {activeTab === 'property' && field.name === 'estimated_value' && (
                          <AIValuationPanel
                            variant="personal_property"
                            enabled={Boolean(
                              String(formData.title || formData.item_name || '').trim() &&
                              String(formData.category || '').trim()
                            )}
                            disabledHint="Enter Item Name and Category to use AI estimation."
                            input={() => ({
                              item_name: formData.title || formData.item_name || '',
                              category: formData.category || undefined,
                              brand: formData.brand || undefined,
                              model: formData.model_serial || undefined,
                              condition: formData.condition || undefined,
                            })}
                            onAccept={(v) => setFormData({ ...formData, estimated_value: v })}
                          />
                        )}
                      </div>
                        );
                      })}

                    <FileAttachmentField
                      sectionKey={activeTab || ''}
                      packetId={currentPacket?.id || ''}
                      recordId={initialData?.id}
                      scope={activeScope}
                      initialAttachment={initialAttachment}
                      onFileSelected={setSelectedFile}
                      onFileRemoved={() => setSelectedFile(null)}
                      disabled={loading}
                      isPrivate={activeTab === 'private'}
                    />

                    {/* Property: photo gallery + family datalist for recipient */}
                    {activeTab === 'property' && currentPacket && (
                      <>
                        <PropertyFamilyDatalist packetId={currentPacket.id} />
                        <PropertyPhotoGallery packetId={currentPacket.id} recordId={initialData?.id ?? null} />
                      </>
                    )}

                    {/* Investments: family datalist for beneficiary/advisor autocomplete */}
                    {activeTab === 'investments' && currentPacket && (
                      <PropertyFamilyDatalist packetId={currentPacket.id} />
                    )}

                    {/* Per-record document slots (Vehicles, Real Estate, Medical, Property, etc.) */}
                    {activeTab && currentPacket && RECORD_DOC_SLOTS[activeTab] && (
                      <div className="space-y-3 pt-2">
                        <div>
                          <h3 className="text-xs font-bold uppercase tracking-widest text-stone-500">Documents</h3>
                          <p className="text-[10px] text-stone-400 mt-0.5">
                            {initialData?.id
                              ? 'Attach documents for this specific record'
                              : 'Save this record first, then upload its documents'}
                          </p>
                        </div>
                        {RECORD_DOC_SLOTS[activeTab].slots.map((slot) => (
                          <RecordDocumentUpload
                            key={slot.category}
                            packetId={currentPacket.id}
                            relatedTable={RECORD_DOC_SLOTS[activeTab].table}
                            relatedRecordId={initialData?.id ?? null}
                            category={slot.category}
                            label={slot.label}
                            description={slot.description}
                            isPrivate={activeTab === 'medical'}
                          />
                        ))}
                        {/* Firearm-specific document slots */}
                        {activeTab === 'property' && formData.category === 'Firearms & Weapons' && FIREARM_DOC_SLOTS.map((slot) => (
                          <RecordDocumentUpload
                            key={slot.category}
                            packetId={currentPacket.id}
                            relatedTable={RECORD_DOC_SLOTS.property.table}
                            relatedRecordId={initialData?.id ?? null}
                            category={slot.category}
                            label={slot.label}
                            description={slot.description}
                            isPrivate={true}
                          />
                        ))}
                      </div>
                    )}
                  </>
                )}

                {!isNA && !hasSectionFields && (
                  <>
                    {activeTab === 'info' && !isEntryOnly && effectiveCategoryOptions.length > 0 && (
                      <div className="space-y-1">
                        <CategorySelector
                          options={effectiveCategoryOptions}
                          value={formData.category || ''}
                          onChange={(val) => {
                            setFormData({ ...formData, category: val });
                            if (errors.category) {
                              const newErrors = { ...errors };
                              delete newErrors.category;
                              setErrors(newErrors);
                            }
                          }}
                          required
                          disabled={loading}
                        />
                        {errors.category && (
                          <p className="text-xs font-bold text-red-500 mt-1">{errors.category}</p>
                        )}
                      </div>
                    )}

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                        {activeTab === 'info' && formData.category === 'Other' ? 'Custom Label / Title' : 'Title / Name'}
                      </label>
                      <input 
                        type="text" 
                        placeholder={isEntryOnly ? `Enter ${formData.label || 'details'}...` : "Enter a descriptive title..."}
                        className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                        value={getDisplayTitle(formData)}
                        onChange={(e) => setDisplayTitle(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">Description / Notes</label>
                      <textarea 
                        rows={4}
                        placeholder="Add any additional details..."
                        className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm resize-none font-medium"
                        value={formData.notes || ''}
                        onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      />
                    </div>

                    {!isEntryOnly && (
                      <FileAttachmentField
                        sectionKey={activeTab || ''}
                        packetId={currentPacket?.id || ''}
                        recordId={initialData?.id}
                        scope={activeScope}
                        initialAttachment={initialAttachment}
                        onFileSelected={setSelectedFile}
                        onFileRemoved={() => setSelectedFile(null)}
                        disabled={loading}
                        isPrivate={activeTab === 'private'}
                      />
                    )}
                  </>
                )}

                {isNA && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-stone-400 block">
                      Item Title (Optional)
                    </label>
                    <input 
                      type="text" 
                      placeholder="What is not applicable?"
                      className="w-full p-4 bg-white rounded-2xl border border-stone-200 focus:border-navy-muted outline-none shadow-sm font-medium"
                      value={getDisplayTitle(formData)}
                      onChange={(e) => setDisplayTitle(e.target.value)}
                    />
                    <p className="text-[10px] text-stone-400 italic">
                      Marking this as N/A will clear any existing data for this record upon saving.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="p-6 border-t border-stone-100 bg-white space-y-3">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full py-4 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <Save size={20} />
              )}
              {isNA ? 'Confirm N/A Status' : 'Save Information'}
            </button>
            {initialData?.id && activeTab && (
              <button
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Delete this record?',
                    description: 'This action cannot be undone.',
                  });
                  if (!ok) return;
                  setLoading(true);
                  const { error } = await sectionService.deleteRecord(activeTab, initialData.id);
                  setLoading(false);
                  if (error) {
                    toast.error(`Failed to delete: ${error.message}`, { duration: 4000, position: 'bottom-center' });
                    return;
                  }
                  toast.success('Record deleted.', { duration: 3000, position: 'bottom-center' });
                  bumpCompletion();
                  if (onSuccess) onSuccess(undefined);
                  handleClose();
                }}
                disabled={loading}
                className="w-full py-3 bg-white border border-red-200 text-red-600 rounded-2xl font-bold flex items-center justify-center gap-2 active:scale-95 transition-all disabled:opacity-50 hover:bg-red-50"
              >
                <Trash2 size={16} />
                Delete Record
              </button>
            )}
          </div>
        </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
