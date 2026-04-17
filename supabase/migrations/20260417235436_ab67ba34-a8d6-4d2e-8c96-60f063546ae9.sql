-- Add deceased status fields across people/animal sections

-- Family: cause of death (already has is_deceased + date_of_death)
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS cause_of_death text;

-- Pets: living/deceased
ALTER TABLE public.pet_records
  ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_death date,
  ADD COLUMN IF NOT EXISTS deceased_notes text;

-- Advisors: separate lifecycle status (active/deceased/retired/former)
-- Note: existing 'status' column is used for record completion (empty/completed/not_applicable),
-- so add a dedicated 'advisor_status' column.
ALTER TABLE public.advisor_records
  ADD COLUMN IF NOT EXISTS advisor_status text NOT NULL DEFAULT 'active';

-- Trusted contacts: living/deceased
ALTER TABLE public.trusted_contacts
  ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_death date;

-- Validate advisor_status values via trigger (CHECK constraints with future-proof values)
CREATE OR REPLACE FUNCTION public.validate_advisor_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.advisor_status IS NOT NULL AND NEW.advisor_status NOT IN ('active','deceased','retired','former') THEN
    RAISE EXCEPTION 'Invalid advisor_status: %', NEW.advisor_status;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS validate_advisor_status_trg ON public.advisor_records;
CREATE TRIGGER validate_advisor_status_trg
BEFORE INSERT OR UPDATE ON public.advisor_records
FOR EACH ROW EXECUTE FUNCTION public.validate_advisor_status();