-- Retirement section revamp: additive-only schema changes.
-- All existing columns preserved. No rows modified. No drops.

ALTER TABLE public.retirement_records
  ADD COLUMN IF NOT EXISTS details jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS nickname text,
  ADD COLUMN IF NOT EXISTS employer_name text,
  ADD COLUMN IF NOT EXISTS legacy_notes text,
  ADD COLUMN IF NOT EXISTS loan_balance numeric;

CREATE INDEX IF NOT EXISTS idx_retirement_records_packet
  ON public.retirement_records (packet_id);

CREATE INDEX IF NOT EXISTS idx_retirement_records_packet_type
  ON public.retirement_records (packet_id, account_type);
