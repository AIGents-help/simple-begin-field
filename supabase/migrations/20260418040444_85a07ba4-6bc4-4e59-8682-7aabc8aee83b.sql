-- Cross-section federation columns: destinations for federated values that
-- were previously fragmented across notes/contact_info free-text fields.

ALTER TABLE public.banking_records
  ADD COLUMN IF NOT EXISTS joint_account_holder text,
  ADD COLUMN IF NOT EXISTS beneficiary_notes text;

ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS garaging_address text;

ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS referring_physician text;

ALTER TABLE public.funeral_records
  ADD COLUMN IF NOT EXISTS attorney_to_notify text;

ALTER TABLE public.real_estate_records
  ADD COLUMN IF NOT EXISTS joint_owner_name text;