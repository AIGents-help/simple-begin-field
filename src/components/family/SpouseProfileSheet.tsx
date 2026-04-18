import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Loader2, Camera, Trash2, ChevronDown, ChevronUp, Eye, EyeOff } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { uploadService } from '@/services/uploadService';
import { LifeStatusToggle } from '../common/LifeStatusToggle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  spouse: any | null; // existing family_members row with relationship='Spouse', or null for new
  onSaved: () => void;
}

type SectionKey = 'identity' | 'marriage' | 'contact' | 'work' | 'sensitive' | 'lifecycle';

const SECTION_LABELS: Record<SectionKey, string> = {
  identity: 'Identity',
  marriage: 'Marriage',
  contact: 'Contact & Address',
  work: 'Occupation',
  sensitive: 'Sensitive Info',
  lifecycle: 'Life Status',
};

const MARITAL_OPTIONS = [
  { value: 'married', label: 'Married' },
  { value: 'separated', label: 'Separated' },
  { value: 'divorced', label: 'Divorced' },
  { value: 'widowed', label: 'Widowed' },
];

/** Mask all but the last 4 digits of an SSN-like string. */
const maskSsn = (raw: string): string => {
  const digits = (raw || '').replace(/\D/g, '');
  if (!digits) return '';
  const last4 = digits.slice(-4);
  return `•••-••-${last4}`;
};

// ---- Module-scope subcomponents (must NOT be redefined per render, or inputs lose focus) ----
interface SectionProps {
  id: SectionKey;
  openSection: SectionKey | '';
  setOpenSection: (s: SectionKey | '') => void;
  children: React.ReactNode;
}
const Section: React.FC<SectionProps> = ({ id, openSection, setOpenSection, children }) => {
  const open = openSection === id;
  return (
    <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden">
      <button
        type="button"
        onClick={() => setOpenSection(open ? '' : id)}
        className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
      >
        <span className="font-bold text-navy-muted text-sm">{SECTION_LABELS[id]}</span>
        {open ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
      </button>
      {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
    </div>
  );
};

interface FieldProps {
  label: string;
  field: string;
  type?: string;
  placeholder?: string;
  form: any;
  errors: Record<string, string>;
  onChange: (field: string, value: any) => void;
}
const Field: React.FC<FieldProps> = ({ label, field, type = 'text', placeholder, form, errors, onChange }) => (
  <div>
    <label className="block text-xs font-bold text-stone-600 mb-1">{label}</label>
    <input
      type={type}
      value={form[field] ?? ''}
      onChange={(e) => onChange(field, e.target.value)}
      placeholder={placeholder}
      className={`w-full px-3 py-2 rounded-lg border ${errors[field] ? 'border-rose-400' : 'border-stone-200'} bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20`}
    />
    {errors[field] && <p className="text-xs text-rose-600 mt-1">{errors[field]}</p>}
  </div>
);

export const SpouseProfileSheet: React.FC<Props> = ({ isOpen, onClose, spouse, onSaved }) => {
  const { currentPacket, profile, bumpCompletion } = useAppContext();
  const [form, setForm] = useState<any>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  const [openSection, setOpenSection] = useState<SectionKey>('identity');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [sameAddress, setSameAddress] = useState(false);
  const [revealSsn, setRevealSsn] = useState(false);
  const [ssnInput, setSsnInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    setErrors({});
    setOpenSection('identity');
    setPhotoFile(null);
    setPhotoPreview(null);
    setRevealSsn(false);

    if (spouse) {
      setForm({ ...spouse });
      setSsnInput(spouse.ssn_encrypted || '');
      if (spouse.photo_path) {
        uploadService.getSignedUrl('packet-documents', spouse.photo_path, 3600).then((res) => {
          setPhotoSignedUrl(res?.url || null);
        });
      } else {
        setPhotoSignedUrl(null);
      }
    } else {
      setForm({
        scope: 'shared',
        relationship: 'Spouse',
        marital_status: 'married',
        marriage_certificate_on_file: false,
      });
      setSsnInput('');
      setPhotoSignedUrl(null);
    }
  }, [isOpen, spouse]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  // Toggle "Same as my address" — pre-fills from the user's profile address if available
  const onToggleSameAddress = (checked: boolean) => {
    setSameAddress(checked);
    if (checked) {
      const ownerAddress = (profile as any)?.address || '';
      if (ownerAddress) handleField('address', ownerAddress);
    }
  };

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file', { duration: 4000, position: 'bottom-center' });
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image must be under 10MB', { duration: 4000, position: 'bottom-center' });
      return;
    }
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
  };

  const buildFullName = (): string => {
    const parts = [form.first_name, form.middle_name, form.last_name].map((s: any) => (s || '').trim()).filter(Boolean);
    let n = parts.join(' ');
    if (form.suffix?.trim()) n += `, ${form.suffix.trim()}`;
    return n;
  };

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.first_name?.trim() && !form.last_name?.trim() && !form.name?.trim()) {
      next.first_name = 'First or last name required';
    }
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setOpenSection('identity');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!currentPacket) return;
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Upload photo if newly selected
      let photo_path = form.photo_path || null;
      if (photoFile) {
        const safe = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${currentPacket.id}/family/spouse/${Date.now()}_${safe}`;
        const { error: upErr } = await uploadService.uploadFile('packet-documents', path, photoFile);
        if (upErr) throw new Error(upErr.message || 'Photo upload failed');
        photo_path = path;
      }

      const composedName = buildFullName() || form.name || 'Spouse';
      const ssnDigits = (ssnInput || '').replace(/\D/g, '');

      // 2. Build payload — only known DB columns
      const payload: any = {
        packet_id: currentPacket.id,
        scope: form.scope || 'shared',
        relationship: 'Spouse',
        name: composedName,
        first_name: form.first_name || null,
        middle_name: form.middle_name || null,
        last_name: form.last_name || null,
        suffix: form.suffix || null,
        preferred_name: form.preferred_name || null,
        birthday: form.birthday || null,
        place_of_birth: form.place_of_birth || null,
        marriage_date: form.marriage_date || null,
        marriage_place: form.marriage_place || null,
        marriage_certificate_on_file: !!form.marriage_certificate_on_file,
        phone: form.phone || null,
        email: form.email || null,
        address: form.address || null,
        occupation: form.occupation || null,
        employer: form.employer || null,
        ssn_encrypted: ssnDigits ? ssnDigits : null,
        ssn_masked: ssnDigits ? maskSsn(ssnDigits) : null,
        marital_status: form.marital_status || 'married',
        photo_path,
        is_deceased: !!form.is_deceased,
        date_of_death: form.is_deceased ? (form.date_of_death || null) : null,
        place_of_death: form.is_deceased ? (form.place_of_death || null) : null,
        cause_of_death: form.is_deceased ? (form.cause_of_death || null) : null,
        status: 'completed',
      };

      let recordId = spouse?.id;
      if (recordId) {
        const { error } = await supabase.from('family_members').update(payload).eq('id', recordId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('family_members')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        recordId = data.id;
      }

      toast.success(spouse ? 'Spouse updated' : 'Spouse added', {
        duration: 3000,
        position: 'bottom-center',
      });
      bumpCompletion();
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Spouse save failed', err);
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!spouse?.id) return;
    if (!window.confirm(`Delete ${spouse.name || 'this spouse'}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('family_members').delete().eq('id', spouse.id);
      if (error) throw error;
      toast.success('Spouse deleted', { duration: 3000, position: 'bottom-center' });
      bumpCompletion();
      onSaved();
      onClose();
    } catch (err: any) {
      toast.error(`Delete failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  // Bind shared props for module-scope subcomponents
  const sectionProps = { openSection, setOpenSection: (s: SectionKey | '') => setOpenSection(s as SectionKey) };
  const fieldProps = { form, errors, onChange: handleField };


    const open = openSection === id;
    return (
      <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenSection(open ? ('' as any) : id)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
        >
          <span className="font-bold text-navy-muted text-sm">{SECTION_LABELS[id]}</span>
          {open ? <ChevronUp size={18} className="text-stone-400" /> : <ChevronDown size={18} className="text-stone-400" />}
        </button>
        {open && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
      </div>
    );
  };

  const Field: React.FC<{ label: string; field: string; type?: string; placeholder?: string }> = ({ label, field, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-bold text-stone-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={(e) => handleField(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border ${errors[field] ? 'border-rose-400' : 'border-stone-200'} bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20`}
      />
      {errors[field] && <p className="text-xs text-rose-600 mt-1">{errors[field]}</p>}
    </div>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed inset-x-0 bottom-0 top-12 z-50 bg-stone-50 rounded-t-3xl flex flex-col shadow-2xl"
          >
            {/* Header */}
            <div className="px-5 py-4 border-b border-stone-200 flex items-center justify-between bg-white rounded-t-3xl">
              <h2 className="text-lg font-serif font-bold text-navy-muted">
                {spouse ? 'Edit Spouse' : 'Add Spouse'}
              </h2>
              <button
                type="button"
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-stone-100 text-stone-500"
                aria-label="Close"
              >
                <X size={20} />
              </button>
            </div>

            {/* Body */}
            <div className={`flex-1 overflow-y-auto px-4 py-4 space-y-3 ${form.is_deceased ? 'opacity-90' : ''}`}>
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <div className={`w-24 h-24 rounded-full bg-stone-200 overflow-hidden flex items-center justify-center border-2 border-stone-300 ${form.is_deceased ? 'grayscale' : ''}`}>
                    {photoPreview || photoSignedUrl ? (
                      <img src={photoPreview || photoSignedUrl!} alt="Spouse" className="w-full h-full object-cover" />
                    ) : (
                      <Camera size={32} className="text-stone-400" />
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="absolute -bottom-1 -right-1 w-9 h-9 rounded-full bg-navy-muted text-white flex items-center justify-center shadow-md active:scale-95"
                    aria-label="Upload photo"
                  >
                    <Camera size={16} />
                  </button>
                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoSelect} />
                </div>
                <p className="text-xs text-stone-500">Tap camera to add a photo</p>
              </div>

              {/* Marital status */}
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-navy-muted">Marital Status</h4>
                  <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Affects how this record appears in your family tree
                  </p>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  {MARITAL_OPTIONS.map((opt) => {
                    const selected = (form.marital_status || 'married') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleField('marital_status', opt.value)}
                        className={`px-3 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-colors ${
                          selected ? 'bg-navy-muted text-white shadow-sm' : 'bg-stone-100 text-stone-500 hover:text-stone-700'
                        }`}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <Section id="identity">
                <Field label="First name *" field="first_name" placeholder="e.g. Jane" />
                <Field label="Middle name" field="middle_name" />
                <Field label="Last name" field="last_name" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Suffix" field="suffix" placeholder="Jr., Sr., III" />
                  <Field label="Preferred name / nickname" field="preferred_name" />
                </div>
                <Field label="Date of birth" field="birthday" type="date" />
                <Field label="Place of birth" field="place_of_birth" placeholder="City, State" />
              </Section>

              <Section id="marriage">
                <Field label="Date of marriage" field="marriage_date" type="date" />
                <Field label="Place of marriage" field="marriage_place" placeholder="City, State" />
                <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-navy-muted">Marriage certificate on file</p>
                    <p className="text-[10px] text-stone-500">Toggle if you have a copy stored</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleField('marriage_certificate_on_file', !form.marriage_certificate_on_file)}
                    className={`w-12 h-6 rounded-full transition-all relative ${form.marriage_certificate_on_file ? 'bg-navy-muted' : 'bg-stone-300'}`}
                    aria-pressed={!!form.marriage_certificate_on_file}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${form.marriage_certificate_on_file ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <p className="text-[10px] text-stone-400 italic">
                  Tip: Use the Info section to upload the certificate file itself, or the document attachment on this record after saving.
                </p>
              </Section>

              <Section id="contact">
                <Field label="Primary phone" field="phone" type="tel" placeholder="(555) 123-4567" />
                <Field label="Primary email" field="email" type="email" placeholder="jane@example.com" />
                <div className="flex items-center justify-between p-3 bg-stone-50 border border-stone-200 rounded-xl">
                  <div>
                    <p className="text-xs font-bold text-navy-muted">Same as my address</p>
                    <p className="text-[10px] text-stone-500">Pre-fill from your profile</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onToggleSameAddress(!sameAddress)}
                    className={`w-12 h-6 rounded-full transition-all relative ${sameAddress ? 'bg-navy-muted' : 'bg-stone-300'}`}
                    aria-pressed={sameAddress}
                  >
                    <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${sameAddress ? 'left-7' : 'left-1'}`} />
                  </button>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Current address</label>
                  <textarea
                    rows={2}
                    value={form.address ?? ''}
                    onChange={(e) => handleField('address', e.target.value)}
                    placeholder="123 Main St, City, State"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 resize-none"
                  />
                </div>
              </Section>

              <Section id="work">
                <Field label="Occupation" field="occupation" placeholder="e.g. Teacher" />
                <Field label="Employer" field="employer" placeholder="Company / Organization" />
              </Section>

              <Section id="sensitive">
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Social Security Number</label>
                  <div className="relative">
                    <input
                      type={revealSsn ? 'text' : 'password'}
                      value={revealSsn ? ssnInput : (ssnInput ? maskSsn(ssnInput) : '')}
                      onChange={(e) => setSsnInput(e.target.value)}
                      onFocus={() => setRevealSsn(true)}
                      placeholder="123-45-6789"
                      className="w-full pl-3 pr-10 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 font-mono"
                    />
                    <button
                      type="button"
                      onClick={() => setRevealSsn((v) => !v)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 text-stone-400 hover:text-navy-muted"
                      aria-label={revealSsn ? 'Hide SSN' : 'Reveal SSN'}
                    >
                      {revealSsn ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-stone-400 mt-1 italic">Stored masked by default. Tap the eye to reveal while editing.</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Notes</label>
                  <textarea
                    rows={3}
                    value={form.reminder_notes ?? ''}
                    onChange={(e) => handleField('reminder_notes', e.target.value)}
                    placeholder="Anything else worth recording…"
                    className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 resize-none"
                  />
                </div>
              </Section>

              <Section id="lifecycle">
                <LifeStatusToggle
                  value={!!form.is_deceased}
                  onChange={(d) => handleField('is_deceased', d)}
                  disabled={saving}
                />
                {form.is_deceased && (
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <Field label="Date of death" field="date_of_death" type="date" />
                    <Field label="Place of death" field="place_of_death" placeholder="City, State" />
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">Cause of death (private)</label>
                      <textarea
                        rows={2}
                        value={form.cause_of_death ?? ''}
                        onChange={(e) => handleField('cause_of_death', e.target.value)}
                        placeholder="Kept private — visible only to you and trusted contacts"
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 resize-none"
                      />
                    </div>
                  </div>
                )}
              </Section>
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-stone-200 bg-white space-y-2">
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-3 bg-navy-muted text-white rounded-2xl font-bold flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all disabled:opacity-50"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {spouse ? 'Save Changes' : 'Add Spouse'}
              </button>
              {spouse?.id && (
                <button
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full py-2.5 text-rose-600 hover:bg-rose-50 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete Spouse Record
                </button>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
