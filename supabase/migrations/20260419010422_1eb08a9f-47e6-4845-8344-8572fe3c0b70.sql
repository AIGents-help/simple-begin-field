
ALTER TABLE public.advisor_records
  ADD COLUMN IF NOT EXISTS first_name text,
  ADD COLUMN IF NOT EXISTS last_name text,
  ADD COLUMN IF NOT EXISTS website text,
  ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_death date,
  ADD COLUMN IF NOT EXISTS death_certificate_path text,
  ADD COLUMN IF NOT EXISTS specialty text,
  ADD COLUMN IF NOT EXISTS license_type text,
  ADD COLUMN IF NOT EXISTS license_number text,
  ADD COLUMN IF NOT EXISTS license_states text[],
  ADD COLUMN IF NOT EXISTS client_reference text,
  ADD COLUMN IF NOT EXISTS software_used text[],
  ADD COLUMN IF NOT EXISTS tax_reminders boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS firm_regulatory_status text,
  ADD COLUMN IF NOT EXISTS aum_estimate numeric,
  ADD COLUMN IF NOT EXISTS fee_structure text,
  ADD COLUMN IF NOT EXISTS insurance_lines text[],
  ADD COLUMN IF NOT EXISTS agency_name text,
  ADD COLUMN IF NOT EXISTS realtor_specialties text[],
  ADD COLUMN IF NOT EXISTS areas_handled text[],
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_notes text;

-- Trigger: keep `name` in sync with first_name + last_name when either changes
CREATE OR REPLACE FUNCTION public.advisor_records_sync_name()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  combined text;
BEGIN
  combined := trim(coalesce(NEW.first_name, '') || ' ' || coalesce(NEW.last_name, ''));
  IF combined <> '' THEN
    NEW.name := combined;
  ELSIF NEW.name IS NULL OR NEW.name = '' THEN
    -- Preserve any existing legacy name; only set placeholder if completely empty
    NEW.name := coalesce(NEW.name, '');
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_advisor_records_sync_name ON public.advisor_records;
CREATE TRIGGER trg_advisor_records_sync_name
BEFORE INSERT OR UPDATE OF first_name, last_name ON public.advisor_records
FOR EACH ROW
EXECUTE FUNCTION public.advisor_records_sync_name();
