ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checkin_frequency TEXT DEFAULT 'quarterly';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_sent_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_checkin_acknowledged_at TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS checkin_opted_out BOOLEAN DEFAULT false;

-- Add validation trigger instead of CHECK constraint
CREATE OR REPLACE FUNCTION public.validate_checkin_frequency()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.checkin_frequency IS NOT NULL AND NEW.checkin_frequency NOT IN ('monthly', 'quarterly', 'biannual', 'annual') THEN
    RAISE EXCEPTION 'Invalid checkin_frequency value: %', NEW.checkin_frequency;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER validate_checkin_frequency_trigger
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.validate_checkin_frequency();