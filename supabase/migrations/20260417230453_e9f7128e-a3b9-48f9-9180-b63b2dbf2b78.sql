
-- Extend pet_records with additional profile fields
ALTER TABLE public.pet_records
  ADD COLUMN IF NOT EXISTS species text,
  ADD COLUMN IF NOT EXISTS breed text,
  ADD COLUMN IF NOT EXISTS date_of_birth date,
  ADD COLUMN IF NOT EXISTS color_markings text,
  ADD COLUMN IF NOT EXISTS gender text,
  ADD COLUMN IF NOT EXISTS spayed_neutered boolean,
  ADD COLUMN IF NOT EXISTS microchip_registry text,
  ADD COLUMN IF NOT EXISTS vet_clinic text,
  ADD COLUMN IF NOT EXISTS vet_address text,
  ADD COLUMN IF NOT EXISTS emergency_vet_name text,
  ADD COLUMN IF NOT EXISTS emergency_vet_clinic text,
  ADD COLUMN IF NOT EXISTS emergency_vet_phone text,
  ADD COLUMN IF NOT EXISTS allergies_dietary text,
  ADD COLUMN IF NOT EXISTS food_brand text,
  ADD COLUMN IF NOT EXISTS food_amount text,
  ADD COLUMN IF NOT EXISTS feeding_frequency text,
  ADD COLUMN IF NOT EXISTS grooming_notes text,
  ADD COLUMN IF NOT EXISTS behavioral_notes text,
  ADD COLUMN IF NOT EXISTS boarding_instructions text,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS tag_license_number text,
  ADD COLUMN IF NOT EXISTS special_needs text,
  ADD COLUMN IF NOT EXISTS photo_path text;

-- Child table for repeatable medications per pet
CREATE TABLE IF NOT EXISTS public.pet_medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  pet_record_id uuid NOT NULL REFERENCES public.pet_records(id) ON DELETE CASCADE,
  name text NOT NULL,
  dose text,
  frequency text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pet_medications_pet_record_id ON public.pet_medications(pet_record_id);
CREATE INDEX IF NOT EXISTS idx_pet_medications_packet_id ON public.pet_medications(packet_id);

ALTER TABLE public.pet_medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view pet_medications"
  ON public.pet_medications FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can insert pet_medications"
  ON public.pet_medications FOR INSERT
  WITH CHECK (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can update pet_medications"
  ON public.pet_medications FOR UPDATE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can delete pet_medications"
  ON public.pet_medications FOR DELETE
  USING (is_packet_member(packet_id) OR is_admin());
