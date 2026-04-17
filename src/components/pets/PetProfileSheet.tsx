import React, { useEffect, useRef, useState } from 'react';
import { X, Save, Loader2, Camera, Trash2, ChevronDown, ChevronUp } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { useAppContext } from '@/context/AppContext';
import { uploadService } from '@/services/uploadService';
import { PetMedicationsEditor, PetMedicationDraft } from './PetMedicationsEditor';
import { PetDocuments } from './PetDocuments';
import { LifeStatusToggle } from '../common/LifeStatusToggle';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  pet: any | null; // existing pet record or null for new
  onSaved: () => void;
}

const SPECIES_OPTIONS = ['Dog', 'Cat', 'Bird', 'Rabbit', 'Reptile', 'Other'];
const GENDER_OPTIONS = ['Male', 'Female', 'Unknown'];

type SectionKey = 'basics' | 'identity' | 'vet' | 'medications' | 'care' | 'insurance' | 'documents';

const SECTION_LABELS: Record<SectionKey, string> = {
  basics: 'Basics',
  identity: 'Identity & Microchip',
  vet: 'Veterinary care',
  medications: 'Medications',
  care: 'Care & behavior',
  insurance: 'Insurance & licensing',
  documents: 'Documents',
};

export const PetProfileSheet: React.FC<Props> = ({ isOpen, onClose, pet, onSaved }) => {
  const { currentPacket, bumpCompletion } = useAppContext();
  const [form, setForm] = useState<any>({});
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoSignedUrl, setPhotoSignedUrl] = useState<string | null>(null);
  const [meds, setMeds] = useState<PetMedicationDraft[]>([]);
  const [openSection, setOpenSection] = useState<SectionKey>('basics');
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (!isOpen) return;
    setErrors({});
    setOpenSection('basics');
    setPhotoFile(null);
    setPhotoPreview(null);

    if (pet) {
      setForm({ ...pet });
      // Load existing meds
      supabase
        .from('pet_medications')
        .select('*')
        .eq('pet_record_id', pet.id)
        .then(({ data }) => setMeds((data as any) || []));
      // Load photo signed URL
      if (pet.photo_path) {
        uploadService.getSignedUrl('packet-documents', pet.photo_path, 3600).then((res) => {
          setPhotoSignedUrl(res?.url || null);
        });
      } else {
        setPhotoSignedUrl(null);
      }
    } else {
      setForm({
        scope: 'shared',
        pet_name: '',
        species: '',
        breed: '',
      });
      setMeds([]);
      setPhotoSignedUrl(null);
    }
  }, [isOpen, pet]);

  const handleField = (field: string, value: any) => {
    setForm((prev: any) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors(prev => ({ ...prev, [field]: '' }));
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

  const validate = (): boolean => {
    const next: Record<string, string> = {};
    if (!form.pet_name?.trim()) next.pet_name = 'Pet name is required';
    if (!form.species?.trim()) next.species = 'Species is required';
    setErrors(next);
    if (Object.keys(next).length > 0) {
      setOpenSection('basics');
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!currentPacket) return;
    if (!validate()) return;
    setSaving(true);
    try {
      // 1. Upload photo if selected
      let photo_path = form.photo_path || null;
      if (photoFile) {
        const safeName = photoFile.name.replace(/[^a-zA-Z0-9._-]/g, '_');
        const path = `${currentPacket.id}/pets/photos/${Date.now()}_${safeName}`;
        const { error: upErr } = await uploadService.uploadFile('packet-documents', path, photoFile);
        if (upErr) throw new Error(upErr.message || 'Photo upload failed');
        photo_path = path;
      }

      // 2. Build payload (only known DB columns)
      const payload: any = {
        packet_id: currentPacket.id,
        scope: form.scope || 'shared',
        pet_name: form.pet_name?.trim(),
        species: form.species || null,
        species_breed: form.species_breed || null,
        breed: form.breed || null,
        age: form.age || null,
        date_of_birth: form.date_of_birth || null,
        color_markings: form.color_markings || null,
        gender: form.gender || null,
        spayed_neutered: typeof form.spayed_neutered === 'boolean' ? form.spayed_neutered : null,
        microchip_number: form.microchip_number || null,
        microchip_registry: form.microchip_registry || null,
        microchip_info: form.microchip_info || null,
        vet_name: form.vet_name || null,
        vet_clinic: form.vet_clinic || null,
        vet_phone: form.vet_phone || null,
        vet_address: form.vet_address || null,
        veterinarian_contact: form.veterinarian_contact || null,
        emergency_vet_name: form.emergency_vet_name || null,
        emergency_vet_clinic: form.emergency_vet_clinic || null,
        emergency_vet_phone: form.emergency_vet_phone || null,
        allergies_dietary: form.allergies_dietary || null,
        food_brand: form.food_brand || null,
        food_amount: form.food_amount || null,
        feeding_frequency: form.feeding_frequency || null,
        feeding_instructions: form.feeding_instructions || null,
        grooming_notes: form.grooming_notes || null,
        behavioral_notes: form.behavioral_notes || null,
        boarding_instructions: form.boarding_instructions || null,
        care_instructions: form.care_instructions || null,
        emergency_notes: form.emergency_notes || null,
        insurance_provider: form.insurance_provider || null,
        insurance_policy_number: form.insurance_policy_number || null,
        tag_license_number: form.tag_license_number || null,
        special_needs: form.special_needs || null,
        photo_path,
        is_deceased: !!form.is_deceased,
        date_of_death: form.is_deceased ? (form.date_of_death || null) : null,
        deceased_notes: form.is_deceased ? (form.deceased_notes || null) : null,
      };

      // 3. Upsert pet record
      let petId = pet?.id;
      if (petId) {
        const { error } = await supabase
          .from('pet_records')
          .update(payload)
          .eq('id', petId);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from('pet_records')
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        petId = data.id;
      }

      // 4. Sync medications
      if (petId) {
        const toDelete = meds.filter(m => m.id && m._deleted);
        const toInsert = meds.filter(m => !m.id && !m._deleted && m.name?.trim());
        const toUpdate = meds.filter(m => m.id && !m._deleted && m.name?.trim());

        for (const m of toDelete) {
          await supabase.from('pet_medications').delete().eq('id', m.id!);
        }
        if (toInsert.length > 0) {
          await supabase.from('pet_medications').insert(
            toInsert.map(m => ({
              packet_id: currentPacket.id,
              pet_record_id: petId,
              name: m.name.trim(),
              dose: m.dose || null,
              frequency: m.frequency || null,
              notes: m.notes || null,
            }))
          );
        }
        for (const m of toUpdate) {
          await supabase
            .from('pet_medications')
            .update({
              name: m.name.trim(),
              dose: m.dose || null,
              frequency: m.frequency || null,
              notes: m.notes || null,
            })
            .eq('id', m.id!);
        }
      }

      toast.success(pet ? 'Pet updated' : 'Pet added', {
        duration: 3000,
        position: 'bottom-center',
      });
      bumpCompletion();
      onSaved();
      onClose();
    } catch (err: any) {
      console.error('Pet save failed', err);
      toast.error(`Save failed: ${err?.message || 'Unknown error'}`, {
        duration: 5000,
        position: 'bottom-center',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!pet?.id) return;
    if (!window.confirm(`Delete ${pet.pet_name || 'this pet'}? This cannot be undone.`)) return;
    setSaving(true);
    try {
      const { error } = await supabase.from('pet_records').delete().eq('id', pet.id);
      if (error) throw error;
      toast.success('Pet deleted', { duration: 3000, position: 'bottom-center' });
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

  const Section: React.FC<{ id: SectionKey; children: React.ReactNode }> = ({ id, children }) => {
    const isOpen = openSection === id;
    return (
      <div className="border border-stone-200 rounded-2xl bg-white overflow-hidden">
        <button
          type="button"
          onClick={() => setOpenSection(isOpen ? ('' as any) : id)}
          className="w-full px-4 py-3 flex items-center justify-between text-left hover:bg-stone-50 transition-colors"
        >
          <span className="font-bold text-navy-muted text-sm">{SECTION_LABELS[id]}</span>
          {isOpen ? (
            <ChevronUp size={18} className="text-stone-400" />
          ) : (
            <ChevronDown size={18} className="text-stone-400" />
          )}
        </button>
        {isOpen && <div className="px-4 pb-4 pt-1 space-y-3">{children}</div>}
      </div>
    );
  };

  const Field: React.FC<{
    label: string;
    field: string;
    type?: string;
    placeholder?: string;
  }> = ({ label, field, type = 'text', placeholder }) => (
    <div>
      <label className="block text-xs font-bold text-stone-600 mb-1">{label}</label>
      <input
        type={type}
        value={form[field] ?? ''}
        onChange={(e) => handleField(field, e.target.value)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 rounded-lg border ${
          errors[field] ? 'border-rose-400' : 'border-stone-200'
        } bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20`}
      />
      {errors[field] && <p className="text-xs text-rose-600 mt-1">{errors[field]}</p>}
    </div>
  );

  const TextArea: React.FC<{ label: string; field: string; placeholder?: string }> = ({
    label,
    field,
    placeholder,
  }) => (
    <div>
      <label className="block text-xs font-bold text-stone-600 mb-1">{label}</label>
      <textarea
        value={form[field] ?? ''}
        onChange={(e) => handleField(field, e.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 resize-none"
      />
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
                {pet ? 'Edit Pet' : 'Add Pet'}
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
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {/* Photo */}
              <div className="flex flex-col items-center gap-3 py-2">
                <div className="relative">
                  <div className="w-24 h-24 rounded-full bg-stone-200 overflow-hidden flex items-center justify-center border-2 border-stone-300">
                    {photoPreview || photoSignedUrl ? (
                      <img
                        src={photoPreview || photoSignedUrl!}
                        alt="Pet"
                        className="w-full h-full object-cover"
                      />
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
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoSelect}
                  />
                </div>
                <p className="text-xs text-stone-500">Tap camera to add a photo</p>
              </div>

              {/* Living / Deceased toggle */}
              <div className="p-4 bg-white border border-stone-200 rounded-2xl space-y-3">
                <div>
                  <h4 className="text-sm font-bold text-navy-muted">Life Status</h4>
                  <p className="text-[10px] text-stone-500 font-medium uppercase tracking-wider mt-0.5">
                    Deceased pets stay in your records under "Past Pets"
                  </p>
                </div>
                <LifeStatusToggle
                  value={!!form.is_deceased}
                  onChange={(d) => handleField('is_deceased', d)}
                  disabled={saving}
                />
                {form.is_deceased && (
                  <div className="space-y-3 pt-2 border-t border-stone-100">
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">Date of Death (optional)</label>
                      <input
                        type="date"
                        value={form.date_of_death ?? ''}
                        onChange={(e) => handleField('date_of_death', e.target.value)}
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-stone-600 mb-1">Notes (optional)</label>
                      <textarea
                        rows={2}
                        value={form.deceased_notes ?? ''}
                        onChange={(e) => handleField('deceased_notes', e.target.value)}
                        placeholder="Any notes you'd like to keep…"
                        className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20 resize-none"
                      />
                    </div>
                  </div>
                )}
              </div>

              <Section id="basics">
                <Field label="Name *" field="pet_name" placeholder="e.g. Max" />
                <div>
                  <label className="block text-xs font-bold text-stone-600 mb-1">Species *</label>
                  <select
                    value={form.species ?? ''}
                    onChange={(e) => handleField('species', e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      errors.species ? 'border-rose-400' : 'border-stone-200'
                    } bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20`}
                  >
                    <option value="">Select species</option>
                    {SPECIES_OPTIONS.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  {errors.species && (
                    <p className="text-xs text-rose-600 mt-1">{errors.species}</p>
                  )}
                </div>
                <Field label="Breed" field="breed" placeholder="e.g. Labrador" />
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Age" field="age" placeholder="e.g. 4 years" />
                  <Field label="Date of birth" field="date_of_birth" type="date" />
                </div>
                <Field label="Color / markings" field="color_markings" placeholder="e.g. Black with white chest" />
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">Gender</label>
                    <select
                      value={form.gender ?? ''}
                      onChange={(e) => handleField('gender', e.target.value)}
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
                    >
                      <option value="">Select</option>
                      {GENDER_OPTIONS.map((g) => (
                        <option key={g} value={g}>
                          {g}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-stone-600 mb-1">
                      Spayed / Neutered
                    </label>
                    <select
                      value={
                        form.spayed_neutered === true
                          ? 'yes'
                          : form.spayed_neutered === false
                          ? 'no'
                          : ''
                      }
                      onChange={(e) =>
                        handleField(
                          'spayed_neutered',
                          e.target.value === 'yes' ? true : e.target.value === 'no' ? false : null
                        )
                      }
                      className="w-full px-3 py-2 rounded-lg border border-stone-200 bg-white text-sm text-navy-muted focus:outline-none focus:ring-2 focus:ring-navy-muted/20"
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </Section>

              <Section id="identity">
                <Field
                  label="Microchip number"
                  field="microchip_number"
                  placeholder="e.g. 985112004001234"
                />
                <Field
                  label="Microchip registry"
                  field="microchip_registry"
                  placeholder="e.g. AKC Reunite, HomeAgain"
                />
                <Field label="Tag / license number" field="tag_license_number" />
              </Section>

              <Section id="vet">
                <Field label="Primary vet name" field="vet_name" />
                <Field label="Clinic" field="vet_clinic" />
                <Field label="Phone" field="vet_phone" type="tel" />
                <Field label="Address" field="vet_address" />
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                    Emergency vet
                  </p>
                  <div className="space-y-3">
                    <Field label="Name" field="emergency_vet_name" />
                    <Field label="Clinic" field="emergency_vet_clinic" />
                    <Field label="Phone" field="emergency_vet_phone" type="tel" />
                  </div>
                </div>
              </Section>

              <Section id="medications">
                <PetMedicationsEditor medications={meds} onChange={setMeds} />
              </Section>

              <Section id="care">
                <TextArea
                  label="Allergies / dietary restrictions"
                  field="allergies_dietary"
                  placeholder="e.g. Chicken allergy, no grains"
                />
                <div className="pt-2 border-t border-stone-100">
                  <p className="text-xs font-bold text-stone-500 uppercase tracking-wide mb-2">
                    Feeding
                  </p>
                  <div className="space-y-3">
                    <Field label="Food brand" field="food_brand" />
                    <div className="grid grid-cols-2 gap-3">
                      <Field label="Amount" field="food_amount" placeholder="e.g. 1 cup" />
                      <Field
                        label="Frequency"
                        field="feeding_frequency"
                        placeholder="e.g. 2x daily"
                      />
                    </div>
                  </div>
                </div>
                <TextArea label="Grooming needs / schedule" field="grooming_notes" />
                <TextArea
                  label="Behavioral notes"
                  field="behavioral_notes"
                  placeholder="Anxiety triggers, fear of strangers, etc."
                />
                <TextArea label="Boarding / sitter instructions" field="boarding_instructions" />
                <TextArea label="Special needs / medical conditions" field="special_needs" />
              </Section>

              <Section id="insurance">
                <Field label="Insurance provider" field="insurance_provider" />
                <Field label="Policy number" field="insurance_policy_number" />
              </Section>

              <Section id="documents">
                {pet?.id ? (
                  <PetDocuments packetId={currentPacket?.id} petRecordId={pet.id} />
                ) : (
                  <p className="text-xs text-stone-500 italic">
                    Save the pet first, then you can attach vaccination records, vet records, and
                    more.
                  </p>
                )}
              </Section>

              {pet?.id && (
                <button
                  type="button"
                  onClick={handleDelete}
                  disabled={saving}
                  className="w-full mt-4 py-3 rounded-xl border border-rose-200 text-rose-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-rose-50 transition-colors disabled:opacity-50"
                >
                  <Trash2 size={16} />
                  Delete pet
                </button>
              )}
            </div>

            {/* Footer */}
            <div className="px-4 py-3 border-t border-stone-200 bg-white flex gap-2">
              <button
                type="button"
                onClick={onClose}
                disabled={saving}
                className="flex-1 py-3 rounded-xl border border-stone-200 text-navy-muted text-sm font-bold disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-3 rounded-xl bg-navy-muted text-white text-sm font-bold flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {saving ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Save size={16} />
                )}
                {pet ? 'Save changes' : 'Add pet'}
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
