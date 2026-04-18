-- ============================================================
-- Phase 2: Trusted Contact Portal — RLS enforcement & access log
-- ============================================================

-- 1. Access log table (idempotent)
CREATE TABLE IF NOT EXISTS public.trusted_contact_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trusted_contact_user_id uuid NOT NULL,
  packet_id uuid NOT NULL,
  section_key text NOT NULL,
  action text NOT NULL DEFAULT 'view',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.trusted_contact_access_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Owners view access log" ON public.trusted_contact_access_log;
CREATE POLICY "Owners view access log"
  ON public.trusted_contact_access_log
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.packets p
      WHERE p.id = trusted_contact_access_log.packet_id
        AND p.owner_user_id = auth.uid()
    )
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Trusted contact insert access log" ON public.trusted_contact_access_log;
CREATE POLICY "Trusted contact insert access log"
  ON public.trusted_contact_access_log
  FOR INSERT
  WITH CHECK (
    trusted_contact_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.user_id = auth.uid()
        AND tc.packet_id = trusted_contact_access_log.packet_id
        AND tc.access_released = true
    )
  );

CREATE INDEX IF NOT EXISTS idx_tcal_packet ON public.trusted_contact_access_log(packet_id, created_at DESC);

-- 2. Allow trusted contacts to read the packet shell (so they can render the header)
DROP POLICY IF EXISTS "Trusted contacts can view released packet" ON public.packets;
CREATE POLICY "Trusted contacts can view released packet"
  ON public.packets
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.user_id = auth.uid()
        AND tc.packet_id = packets.id
    )
  );

-- 3. Allow trusted contact to see their own row (so the UI knows release status / permissions)
DROP POLICY IF EXISTS "Trusted contact reads own row" ON public.trusted_contacts;
CREATE POLICY "Trusted contact reads own row"
  ON public.trusted_contacts
  FOR SELECT
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Trusted contact reads own permissions" ON public.trusted_contact_permissions;
CREATE POLICY "Trusted contact reads own permissions"
  ON public.trusted_contact_permissions
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.id = trusted_contact_permissions.trusted_contact_id
        AND tc.user_id = auth.uid()
    )
  );

-- 4. Add SELECT policies for trusted contacts on every section table.
--    Mapping section_key -> table:
--      info             -> info_records
--      family           -> family_members
--      medical          -> medical_records, medications
--      real-estate      -> real_estate_records (if exists)
--      banking          -> banking_records, credit_cards
--      investments      -> investment_records
--      retirement       -> investment_records (covered)
--      legal            -> legal_documents
--      vehicles         -> vehicle_records (if exists)
--      advisors         -> advisor_records
--      passwords        -> password_records
--      property         -> personal_property_records (if exists)
--      pets             -> pet_records (if exists)
--      funeral          -> funeral_records, funeral_music, funeral_readings, funeral_photos
--      memories         -> memories, memory_album_photos, memory_bucket_items
--      private          -> uses is_private flag on documents

DO $$
DECLARE
  rec record;
  pol_name text;
  section_key text;
  tables_map text[][] := ARRAY[
    ['info_records',                'info'],
    ['family_members',              'family'],
    ['medical_records',             'medical'],
    ['medications',                 'medical'],
    ['banking_records',             'banking'],
    ['credit_cards',                'banking'],
    ['investment_records',          'investments'],
    ['legal_documents',             'legal'],
    ['advisor_records',             'advisors'],
    ['password_records',            'passwords'],
    ['funeral_records',             'funeral'],
    ['funeral_music',               'funeral'],
    ['funeral_readings',            'funeral'],
    ['funeral_photos',              'funeral'],
    ['memories',                    'memories'],
    ['memory_album_photos',         'memories'],
    ['memory_bucket_items',         'memories']
  ];
BEGIN
  FOR i IN 1..array_length(tables_map, 1) LOOP
    pol_name := 'Trusted contacts can view ' || tables_map[i][1];
    section_key := tables_map[i][2];

    -- only create if table exists
    IF EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = tables_map[i][1]
    ) THEN
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol_name, tables_map[i][1]);
      EXECUTE format(
        'CREATE POLICY %I ON public.%I FOR SELECT USING (public.has_trusted_access(packet_id, %L))',
        pol_name, tables_map[i][1], section_key
      );
    END IF;
  END LOOP;
END $$;

-- 5. Optional tables that may exist with different names — guarded individually.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='real_estate_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view real_estate_records" ON public.real_estate_records';
    EXECUTE 'CREATE POLICY "Trusted contacts can view real_estate_records" ON public.real_estate_records FOR SELECT USING (public.has_trusted_access(packet_id, ''real-estate''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicle_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view vehicle_records" ON public.vehicle_records';
    EXECUTE 'CREATE POLICY "Trusted contacts can view vehicle_records" ON public.vehicle_records FOR SELECT USING (public.has_trusted_access(packet_id, ''vehicles''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_property_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view personal_property_records" ON public.personal_property_records';
    EXECUTE 'CREATE POLICY "Trusted contacts can view personal_property_records" ON public.personal_property_records FOR SELECT USING (public.has_trusted_access(packet_id, ''property''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='personal_property_photos') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view personal_property_photos" ON public.personal_property_photos';
    EXECUTE 'CREATE POLICY "Trusted contacts can view personal_property_photos" ON public.personal_property_photos FOR SELECT USING (public.has_trusted_access(packet_id, ''property''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pet_records') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view pet_records" ON public.pet_records';
    EXECUTE 'CREATE POLICY "Trusted contacts can view pet_records" ON public.pet_records FOR SELECT USING (public.has_trusted_access(packet_id, ''pets''))';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pets') THEN
    EXECUTE 'DROP POLICY IF EXISTS "Trusted contacts can view pets" ON public.pets';
    EXECUTE 'CREATE POLICY "Trusted contacts can view pets" ON public.pets FOR SELECT USING (public.has_trusted_access(packet_id, ''pets''))';
  END IF;
END $$;

-- 6. Documents table — trusted contacts can see documents tied to a section they have access to,
--    EXCEPT private documents (those require explicit "private" permission).
DROP POLICY IF EXISTS "Trusted contacts can view permitted documents" ON public.documents;
CREATE POLICY "Trusted contacts can view permitted documents"
  ON public.documents
  FOR SELECT
  USING (
    section_key IS NOT NULL
    AND public.has_trusted_access(packet_id, section_key)
    AND (
      is_private IS NOT TRUE
      OR public.has_trusted_access(packet_id, 'private')
    )
  );

-- 7. Helper function: does the current user have any released packets to view?
CREATE OR REPLACE FUNCTION public.viewer_released_packet_ids()
RETURNS SETOF uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT packet_id
  FROM public.trusted_contacts
  WHERE user_id = auth.uid()
    AND access_released = true;
$$;

-- 8. Helper: list permitted section keys for a viewer on a given packet
CREATE OR REPLACE FUNCTION public.viewer_permitted_sections(p_packet_id uuid)
RETURNS SETOF text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tcp.section_key
  FROM public.trusted_contacts tc
  JOIN public.trusted_contact_permissions tcp ON tcp.trusted_contact_id = tc.id
  WHERE tc.user_id = auth.uid()
    AND tc.packet_id = p_packet_id
    AND tc.access_released = true
    AND tcp.is_permitted = true;
$$;