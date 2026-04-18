-- Extend medical_records to support multiple card types via discriminator + JSONB details
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS record_type text,
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS next_appointment_date date,
  ADD COLUMN IF NOT EXISTS expiry_date date,
  ADD COLUMN IF NOT EXISTS legacy_notes text;

-- Backfill record_type for existing rows so nothing disappears from the UI
UPDATE public.medical_records
SET record_type = CASE
  WHEN record_type IS NOT NULL THEN record_type
  WHEN insurance_provider IS NOT NULL AND (provider_name IS NULL OR provider_name = '') THEN 'insurance'
  WHEN blood_type IS NOT NULL OR organ_donor IS NOT NULL OR dnr_status IS NOT NULL THEN 'emergency'
  ELSE 'doctor'
END
WHERE record_type IS NULL;

-- Set default for new inserts
ALTER TABLE public.medical_records
  ALTER COLUMN record_type SET DEFAULT 'doctor';

CREATE INDEX IF NOT EXISTS idx_medical_records_packet_type
  ON public.medical_records (packet_id, record_type);

-- Extend medications with the new structured fields
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS is_critical boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS dose_unit text,
  ADD COLUMN IF NOT EXISTS route text,
  ADD COLUMN IF NOT EXISTS condition_treated text,
  ADD COLUMN IF NOT EXISTS prescription_number text,
  ADD COLUMN IF NOT EXISTS pharmacy_phone text,
  ADD COLUMN IF NOT EXISTS is_generic_available boolean,
  ADD COLUMN IF NOT EXISTS side_effects text,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS legacy_notes text;