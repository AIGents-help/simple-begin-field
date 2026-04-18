-- Add new structured fields to personal_property_records
ALTER TABLE public.personal_property_records
  ADD COLUMN IF NOT EXISTS title text,
  ADD COLUMN IF NOT EXISTS brand text,
  ADD COLUMN IF NOT EXISTS model_serial text,
  ADD COLUMN IF NOT EXISTS year_acquired integer,
  ADD COLUMN IF NOT EXISTS acquisition_price numeric,
  ADD COLUMN IF NOT EXISTS appraised_value numeric,
  ADD COLUMN IF NOT EXISTS last_appraisal_date date,
  ADD COLUMN IF NOT EXISTS condition text,
  ADD COLUMN IF NOT EXISTS appraiser_name text,
  ADD COLUMN IF NOT EXISTS appraiser_company text,
  ADD COLUMN IF NOT EXISTS insurance_rider boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS insurance_company text,
  ADD COLUMN IF NOT EXISTS insurance_policy_number text,
  ADD COLUMN IF NOT EXISTS insurance_coverage_amount numeric,
  ADD COLUMN IF NOT EXISTS acquisition_method text,
  ADD COLUMN IF NOT EXISTS acquired_from text,
  ADD COLUMN IF NOT EXISTS has_certificate_of_authenticity boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS chain_of_custody text,
  ADD COLUMN IF NOT EXISTS disposition_action text,
  ADD COLUMN IF NOT EXISTS specific_recipient text,
  ADD COLUMN IF NOT EXISTS estimated_sale_price numeric,
  ADD COLUMN IF NOT EXISTS preferred_selling_method text,
  ADD COLUMN IF NOT EXISTS sentimental_notes text,
  ADD COLUMN IF NOT EXISTS special_handling text;

-- Backfill title from item_name where missing
UPDATE public.personal_property_records
SET title = item_name
WHERE title IS NULL AND item_name IS NOT NULL;

-- Photo gallery table
CREATE TABLE IF NOT EXISTS public.personal_property_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  property_record_id uuid NOT NULL REFERENCES public.personal_property_records(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_hero boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.personal_property_photos ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personal_property_photos' AND policyname='Members view property photos') THEN
    CREATE POLICY "Members view property photos" ON public.personal_property_photos
      FOR SELECT USING (public.is_packet_member(packet_id) OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personal_property_photos' AND policyname='Members insert property photos') THEN
    CREATE POLICY "Members insert property photos" ON public.personal_property_photos
      FOR INSERT WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personal_property_photos' AND policyname='Members update property photos') THEN
    CREATE POLICY "Members update property photos" ON public.personal_property_photos
      FOR UPDATE USING (public.is_packet_member(packet_id) OR public.is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname='public' AND tablename='personal_property_photos' AND policyname='Members delete property photos') THEN
    CREATE POLICY "Members delete property photos" ON public.personal_property_photos
      FOR DELETE USING (public.is_packet_member(packet_id) OR public.is_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_property_photos_record ON public.personal_property_photos(property_record_id);
CREATE INDEX IF NOT EXISTS idx_property_photos_packet ON public.personal_property_photos(packet_id);