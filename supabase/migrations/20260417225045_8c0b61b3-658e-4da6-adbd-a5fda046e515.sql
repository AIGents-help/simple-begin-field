
-- ============================================================
-- PHASE 1: Schema additions for product improvement pass
-- ============================================================

-- ---------- 1. FAMILY MEMBERS: alive/deceased ----------
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS is_deceased boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS date_of_death date;

-- ---------- 2. PROPERTY UTILITIES (child of real_estate_records) ----------
CREATE TABLE IF NOT EXISTS public.property_utilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  property_record_id uuid NOT NULL REFERENCES public.real_estate_records(id) ON DELETE CASCADE,
  utility_type text NOT NULL,            -- electric|gas|water|internet|hoa|trash|alarm|mortgage|property_tax|property_insurance|other
  provider_name text,
  account_number text,
  monthly_amount numeric,
  contact_phone text,
  policy_number text,
  agent_contact text,
  pin text,
  due_date text,                          -- free-form (e.g. "April 1" or actual date string)
  annual_amount numeric,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS property_utilities_property_idx ON public.property_utilities(property_record_id);
CREATE INDEX IF NOT EXISTS property_utilities_packet_idx ON public.property_utilities(packet_id);

ALTER TABLE public.property_utilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view property_utilities"
  ON public.property_utilities FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can insert property_utilities"
  ON public.property_utilities FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can update property_utilities"
  ON public.property_utilities FOR UPDATE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can delete property_utilities"
  ON public.property_utilities FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

-- ---------- 3. VEHICLES: insurance/loan fields ----------
ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS state text,
  ADD COLUMN IF NOT EXISTS policy_number text,
  ADD COLUMN IF NOT EXISTS agent_contact text,
  ADD COLUMN IF NOT EXISTS lender_name text,
  ADD COLUMN IF NOT EXISTS monthly_payment numeric,
  ADD COLUMN IF NOT EXISTS payoff_amount numeric;

-- ---------- 4. MEDICAL: extra fields + Medications table ----------
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS address text,
  ADD COLUMN IF NOT EXISTS member_id text,
  ADD COLUMN IF NOT EXISTS group_number text,
  ADD COLUMN IF NOT EXISTS insurance_provider text;

CREATE TABLE IF NOT EXISTS public.medications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared',
  name text NOT NULL,
  dose text,
  frequency text,
  prescribing_doctor text,
  pharmacy text,
  notes text,
  status text DEFAULT 'empty',
  is_na boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS medications_packet_idx ON public.medications(packet_id);

ALTER TABLE public.medications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view medications"
  ON public.medications FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can insert medications"
  ON public.medications FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can update medications"
  ON public.medications FOR UPDATE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can delete medications"
  ON public.medications FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

-- ---------- 5. BANKING: online login + Credit Cards table ----------
ALTER TABLE public.banking_records
  ADD COLUMN IF NOT EXISTS online_login_instructions text;

CREATE TABLE IF NOT EXISTS public.credit_cards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared',
  issuer text NOT NULL,
  card_type text,                  -- visa|mastercard|amex|discover|other
  last_four text,
  credit_limit numeric,
  online_login_instructions text,
  notes text,
  category text,
  status text DEFAULT 'empty',
  is_na boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS credit_cards_packet_idx ON public.credit_cards(packet_id);

ALTER TABLE public.credit_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view credit_cards"
  ON public.credit_cards FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can insert credit_cards"
  ON public.credit_cards FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can update credit_cards"
  ON public.credit_cards FOR UPDATE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can delete credit_cards"
  ON public.credit_cards FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

-- ---------- 6. PETS: vet + insurance ----------
ALTER TABLE public.pet_records
  ADD COLUMN IF NOT EXISTS vet_name text,
  ADD COLUMN IF NOT EXISTS vet_phone text,
  ADD COLUMN IF NOT EXISTS microchip_number text,
  ADD COLUMN IF NOT EXISTS insurance_provider text;

-- ---------- 7. LEGAL DOCUMENTS table ----------
CREATE TABLE IF NOT EXISTS public.legal_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared',
  document_type text NOT NULL,     -- will|power_of_attorney|trust|advance_directive|other
  attorney_name text,
  attorney_firm text,
  attorney_phone text,
  document_date date,
  original_location text,
  notes text,
  category text,
  status text DEFAULT 'empty',
  is_na boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS legal_documents_packet_idx ON public.legal_documents(packet_id);

ALTER TABLE public.legal_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view legal_documents"
  ON public.legal_documents FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can insert legal_documents"
  ON public.legal_documents FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can update legal_documents"
  ON public.legal_documents FOR UPDATE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can delete legal_documents"
  ON public.legal_documents FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());
