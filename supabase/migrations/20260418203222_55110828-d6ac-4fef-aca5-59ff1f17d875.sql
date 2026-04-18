
-- Extend profiles with Personal Information fields
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_name TEXT,
  ADD COLUMN IF NOT EXISTS middle_name TEXT,
  ADD COLUMN IF NOT EXISTS last_name TEXT,
  ADD COLUMN IF NOT EXISTS suffix TEXT,
  ADD COLUMN IF NOT EXISTS preferred_name TEXT,
  ADD COLUMN IF NOT EXISTS date_of_birth DATE,
  ADD COLUMN IF NOT EXISTS place_of_birth TEXT,
  ADD COLUMN IF NOT EXISTS gender TEXT,
  ADD COLUMN IF NOT EXISTS primary_phone TEXT,
  ADD COLUMN IF NOT EXISTS current_address_street TEXT,
  ADD COLUMN IF NOT EXISTS current_address_city TEXT,
  ADD COLUMN IF NOT EXISTS current_address_state TEXT,
  ADD COLUMN IF NOT EXISTS current_address_zip TEXT,
  ADD COLUMN IF NOT EXISTS mailing_same_as_current BOOLEAN DEFAULT TRUE,
  ADD COLUMN IF NOT EXISTS mailing_address_street TEXT,
  ADD COLUMN IF NOT EXISTS mailing_address_city TEXT,
  ADD COLUMN IF NOT EXISTS mailing_address_state TEXT,
  ADD COLUMN IF NOT EXISTS mailing_address_zip TEXT,
  ADD COLUMN IF NOT EXISTS nationality TEXT,
  ADD COLUMN IF NOT EXISTS marital_status TEXT;

-- Add JSONB details column on info_records to store identity card sub-fields
ALTER TABLE public.info_records
  ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE INDEX IF NOT EXISTS idx_info_records_category ON public.info_records (category);
CREATE INDEX IF NOT EXISTS idx_info_records_packet_category ON public.info_records (packet_id, category);
