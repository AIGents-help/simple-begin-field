
-- =========================================================================
-- VEHICLES — extend vehicle_records with full attribute set + add photos table
-- =========================================================================

-- 1) Extend vehicle_records with all the new columns the redesigned card needs
ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS trim_package text,
  ADD COLUMN IF NOT EXISTS exterior_color text,
  ADD COLUMN IF NOT EXISTS interior_color text,
  ADD COLUMN IF NOT EXISTS body_style text,
  ADD COLUMN IF NOT EXISTS odometer_reading numeric,
  ADD COLUMN IF NOT EXISTS odometer_recorded_date date,
  ADD COLUMN IF NOT EXISTS ownership_type text,
  ADD COLUMN IF NOT EXISTS primary_driver text,
  ADD COLUMN IF NOT EXISTS owner_is_deceased boolean DEFAULT false,
  -- Registration & Title
  ADD COLUMN IF NOT EXISTS registration_state text,
  ADD COLUMN IF NOT EXISTS title_status text,
  ADD COLUMN IF NOT EXISTS title_holder_name text,
  -- Insurance
  ADD COLUMN IF NOT EXISTS insurance_provider text,
  ADD COLUMN IF NOT EXISTS insurance_agent_name text,
  ADD COLUMN IF NOT EXISTS insurance_agent_phone text,
  ADD COLUMN IF NOT EXISTS coverage_type text,
  ADD COLUMN IF NOT EXISTS premium_amount numeric,
  ADD COLUMN IF NOT EXISTS premium_frequency text,
  ADD COLUMN IF NOT EXISTS roadside_assistance boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS roadside_phone text,
  -- Loan / Lease
  ADD COLUMN IF NOT EXISTS finance_status text,
  ADD COLUMN IF NOT EXISTS lender_account_number text,
  ADD COLUMN IF NOT EXISTS interest_rate numeric,
  ADD COLUMN IF NOT EXISTS loan_start_date date,
  ADD COLUMN IF NOT EXISTS remaining_balance numeric,
  ADD COLUMN IF NOT EXISTS lender_phone text,
  ADD COLUMN IF NOT EXISTS leasing_company text,
  ADD COLUMN IF NOT EXISTS lease_start_date date,
  ADD COLUMN IF NOT EXISTS lease_end_date date,
  ADD COLUMN IF NOT EXISTS lease_mileage_allowance numeric,
  ADD COLUMN IF NOT EXISTS lease_mileage_overage numeric,
  ADD COLUMN IF NOT EXISTS lease_turnin_notes text,
  -- Valuation
  ADD COLUMN IF NOT EXISTS purchase_price numeric,
  ADD COLUMN IF NOT EXISTS purchase_date date,
  ADD COLUMN IF NOT EXISTS purchased_from text,
  ADD COLUMN IF NOT EXISTS valuation_reference_date date,
  ADD COLUMN IF NOT EXISTS appraised_value numeric,
  ADD COLUMN IF NOT EXISTS condition_notes text,
  -- Maintenance
  ADD COLUMN IF NOT EXISTS last_oil_change_date date,
  ADD COLUMN IF NOT EXISTS last_oil_change_mileage numeric,
  ADD COLUMN IF NOT EXISTS next_service_due_date date,
  ADD COLUMN IF NOT EXISTS next_service_due_mileage numeric,
  ADD COLUMN IF NOT EXISTS tire_brand text,
  ADD COLUMN IF NOT EXISTS tire_size text,
  ADD COLUMN IF NOT EXISTS last_tire_rotation_date date,
  ADD COLUMN IF NOT EXISTS known_issues text,
  ADD COLUMN IF NOT EXISTS service_history_notes text,
  ADD COLUMN IF NOT EXISTS mechanic_name text,
  ADD COLUMN IF NOT EXISTS mechanic_phone text,
  -- Key & Access
  ADD COLUMN IF NOT EXISTS number_of_keys integer,
  ADD COLUMN IF NOT EXISTS key_location text,
  ADD COLUMN IF NOT EXISTS key_fob_notes text,
  ADD COLUMN IF NOT EXISTS has_garage_opener boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS garage_opener_code text,
  ADD COLUMN IF NOT EXISTS parking_location text,
  -- Disposition
  ADD COLUMN IF NOT EXISTS disposition_action text,
  ADD COLUMN IF NOT EXISTS disposition_recipient text,
  ADD COLUMN IF NOT EXISTS asking_price numeric,
  ADD COLUMN IF NOT EXISTS donation_organization text,
  ADD COLUMN IF NOT EXISTS disposition_instructions text,
  ADD COLUMN IF NOT EXISTS sentimental_notes text;

-- 2) Create vehicle_photos table (mirrors personal_property_photos)
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_record_id uuid NOT NULL REFERENCES public.vehicle_records(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_hero boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_vehicle_photos_packet ON public.vehicle_photos(packet_id);
CREATE INDEX IF NOT EXISTS idx_vehicle_photos_record ON public.vehicle_photos(vehicle_record_id);

ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members view vehicle photos"
  ON public.vehicle_photos FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members insert vehicle photos"
  ON public.vehicle_photos FOR INSERT
  WITH CHECK (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members update vehicle photos"
  ON public.vehicle_photos FOR UPDATE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members delete vehicle photos"
  ON public.vehicle_photos FOR DELETE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Trusted contacts can view vehicle_photos"
  ON public.vehicle_photos FOR SELECT
  USING (has_trusted_access(packet_id, 'vehicles'::text));

CREATE TRIGGER update_vehicle_photos_updated_at
  BEFORE UPDATE ON public.vehicle_photos
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 3) Update scan_vehicle_expiries to also read the new policy_expiration_date alias
-- (We keep insurance_renewal_date as the canonical column — no trigger change needed.)
