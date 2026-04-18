ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS separation_date date,
  ADD COLUMN IF NOT EXISTS divorce_finalized_date date,
  ADD COLUMN IF NOT EXISTS divorce_attorney text,
  ADD COLUMN IF NOT EXISTS divorce_jurisdiction text,
  ADD COLUMN IF NOT EXISTS divorce_settlement_notes text;