ALTER TABLE public.advisor_records ADD COLUMN IF NOT EXISTS photo_path text;
ALTER TABLE public.trusted_contacts ADD COLUMN IF NOT EXISTS photo_path text;