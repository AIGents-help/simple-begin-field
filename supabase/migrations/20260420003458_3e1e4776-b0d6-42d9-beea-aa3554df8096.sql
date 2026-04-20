-- Drop the duplicate table created in the previous migration
DROP TABLE IF EXISTS public.debt_accounts;

-- Extend estate_liabilities with the rich fields needed for the new Debts & Obligations section
ALTER TABLE public.estate_liabilities
  ADD COLUMN IF NOT EXISTS account_number_masked text,
  ADD COLUMN IF NOT EXISTS original_balance numeric(14,2),
  ADD COLUMN IF NOT EXISTS payment_due_day integer,
  ADD COLUMN IF NOT EXISTS payment_frequency text,
  ADD COLUMN IF NOT EXISTS is_joint boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS joint_holder_name text,
  ADD COLUMN IF NOT EXISTS autopay_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS autopay_account text,
  ADD COLUMN IF NOT EXISTS login_url text,
  ADD COLUMN IF NOT EXISTS contact_phone text,
  ADD COLUMN IF NOT EXISTS contact_address text,
  ADD COLUMN IF NOT EXISTS is_na boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS scope text DEFAULT 'personA',
  ADD COLUMN IF NOT EXISTS status text;

-- Add an index on lender_name (used as creditor grouping key)
CREATE INDEX IF NOT EXISTS idx_estate_liabilities_lender ON public.estate_liabilities(lender_name);
CREATE INDEX IF NOT EXISTS idx_estate_liabilities_packet ON public.estate_liabilities(packet_id);