-- Add structured spouse-card fields to family_members.
-- Existing fields used: name, phone, email, address, birthday, is_deceased, date_of_death, cause_of_death, relationship, scope, packet_id.

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS photo_path text,
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS middle_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS suffix text,
  ADD COLUMN IF NOT EXISTS preferred_name text,
  ADD COLUMN IF NOT EXISTS place_of_birth text,
  ADD COLUMN IF NOT EXISTS marriage_date date,
  ADD COLUMN IF NOT EXISTS marriage_place text,
  ADD COLUMN IF NOT EXISTS marriage_certificate_on_file boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS occupation text,
  ADD COLUMN IF NOT EXISTS employer text,
  ADD COLUMN IF NOT EXISTS ssn_encrypted text,
  ADD COLUMN IF NOT EXISTS ssn_masked text,
  ADD COLUMN IF NOT EXISTS place_of_death text,
  ADD COLUMN IF NOT EXISTS marital_status text DEFAULT 'married';

-- Validate marital_status values via trigger (avoids brittle CHECK constraints).
CREATE OR REPLACE FUNCTION public.validate_marital_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.marital_status IS NOT NULL AND NEW.marital_status NOT IN ('married','separated','divorced','widowed') THEN
    RAISE EXCEPTION 'Invalid marital_status: %', NEW.marital_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS family_members_validate_marital_status ON public.family_members;
CREATE TRIGGER family_members_validate_marital_status
BEFORE INSERT OR UPDATE ON public.family_members
FOR EACH ROW EXECUTE FUNCTION public.validate_marital_status();