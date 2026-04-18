ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS blood_type text,
  ADD COLUMN IF NOT EXISTS allergies text,
  ADD COLUMN IF NOT EXISTS conditions text,
  ADD COLUMN IF NOT EXISTS dnr_status text,
  ADD COLUMN IF NOT EXISTS organ_donor boolean,
  ADD COLUMN IF NOT EXISTS insurance_phone text;

-- Rename for consistency with verify_emergency_pin() which expects insurance_member_id / insurance_group_number
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS insurance_member_id text,
  ADD COLUMN IF NOT EXISTS insurance_group_number text;

-- Backfill from legacy columns
UPDATE public.medical_records SET insurance_member_id = member_id WHERE insurance_member_id IS NULL AND member_id IS NOT NULL;
UPDATE public.medical_records SET insurance_group_number = group_number WHERE insurance_group_number IS NULL AND group_number IS NOT NULL;