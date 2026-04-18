-- =============================================================================
-- COUPLE COLLABORATION — Phase 1
-- Tables: couple_links, couple_permissions, couple_activity
-- Helpers: get_partner_id, has_couple_access, log_couple_activity, seed_default_couple_permissions
-- RLS extensions: partner SELECT/INSERT/UPDATE/DELETE on every section table
-- =============================================================================

-- ---------- ENUMS ----------
DO $$ BEGIN
  CREATE TYPE public.couple_link_status AS ENUM ('pending', 'active', 'unlinked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.couple_permission_level AS ENUM ('hidden', 'view', 'collaborate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.couple_activity_action AS ENUM ('added', 'edited', 'deleted', 'uploaded', 'permission_changed', 'linked', 'unlinked');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ---------- TABLE: couple_links ----------
CREATE TABLE IF NOT EXISTS public.couple_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id_1       uuid NOT NULL,
  user_id_2       uuid,                          -- null until accepted (pending invite by email)
  invite_email    text,                          -- partner email at invite time
  invite_token    text UNIQUE,                   -- single-use token
  invite_expires_at timestamptz,
  initiated_by    uuid NOT NULL,
  status          public.couple_link_status NOT NULL DEFAULT 'pending',
  linked_at       timestamptz,
  unlinked_at     timestamptz,
  unlinked_by     uuid,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT couple_links_distinct_users CHECK (user_id_2 IS NULL OR user_id_1 <> user_id_2)
);

-- One active link per user pair (regardless of order)
CREATE UNIQUE INDEX IF NOT EXISTS couple_links_active_pair_idx
  ON public.couple_links (LEAST(user_id_1, user_id_2), GREATEST(user_id_1, user_id_2))
  WHERE status = 'active' AND user_id_2 IS NOT NULL;

CREATE INDEX IF NOT EXISTS couple_links_user1_idx ON public.couple_links (user_id_1) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS couple_links_user2_idx ON public.couple_links (user_id_2) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS couple_links_pending_email_idx ON public.couple_links (lower(invite_email)) WHERE status = 'pending';

-- ---------- TABLE: couple_permissions ----------
CREATE TABLE IF NOT EXISTS public.couple_permissions (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id     uuid NOT NULL REFERENCES public.couple_links(id) ON DELETE CASCADE,
  granting_user_id   uuid NOT NULL,             -- who owns the data
  receiving_user_id  uuid NOT NULL,             -- the partner being granted access
  section_key        text NOT NULL,
  permission_level   public.couple_permission_level NOT NULL DEFAULT 'view',
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now(),
  UNIQUE (couple_link_id, granting_user_id, section_key)
);

CREATE INDEX IF NOT EXISTS couple_permissions_lookup_idx
  ON public.couple_permissions (granting_user_id, receiving_user_id, section_key);

-- ---------- TABLE: couple_activity ----------
CREATE TABLE IF NOT EXISTS public.couple_activity (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id  uuid NOT NULL REFERENCES public.couple_links(id) ON DELETE CASCADE,
  user_id         uuid NOT NULL,                -- who performed the action
  action_type     public.couple_activity_action NOT NULL,
  section_key     text,
  record_id       uuid,
  record_table    text,
  description     text,
  created_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS couple_activity_link_recent_idx
  ON public.couple_activity (couple_link_id, created_at DESC);

-- ---------- updated_at triggers ----------
DROP TRIGGER IF EXISTS trg_couple_links_updated ON public.couple_links;
CREATE TRIGGER trg_couple_links_updated
  BEFORE UPDATE ON public.couple_links
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS trg_couple_permissions_updated ON public.couple_permissions;
CREATE TRIGGER trg_couple_permissions_updated
  BEFORE UPDATE ON public.couple_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================================================
-- HELPER FUNCTIONS (SECURITY DEFINER, search_path locked)
-- =============================================================================

-- Returns the partner user_id for the current authed user, or NULL
CREATE OR REPLACE FUNCTION public.get_partner_id(p_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN cl.user_id_1 = p_user_id THEN cl.user_id_2
    WHEN cl.user_id_2 = p_user_id THEN cl.user_id_1
  END
  FROM public.couple_links cl
  WHERE cl.status = 'active'
    AND (cl.user_id_1 = p_user_id OR cl.user_id_2 = p_user_id)
  LIMIT 1;
$$;

-- Returns the active couple_link_id for the current authed user, or NULL
CREATE OR REPLACE FUNCTION public.get_couple_link_id(p_user_id uuid DEFAULT auth.uid())
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.couple_links
  WHERE status = 'active'
    AND (user_id_1 = p_user_id OR user_id_2 = p_user_id)
  LIMIT 1;
$$;

-- Has the requesting user (auth.uid) been granted at least `p_min_level` access
-- to `p_section_key` belonging to `p_owner_user_id`?
-- p_min_level: 'view' or 'collaborate'
CREATE OR REPLACE FUNCTION public.has_couple_access(
  p_owner_user_id uuid,
  p_section_key   text,
  p_min_level     public.couple_permission_level DEFAULT 'view'
)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_viewer uuid := auth.uid();
  v_level  public.couple_permission_level;
BEGIN
  IF v_viewer IS NULL OR p_owner_user_id IS NULL THEN
    RETURN false;
  END IF;
  IF v_viewer = p_owner_user_id THEN
    RETURN true;
  END IF;

  -- Hard-block: passwords + private are never partner-visible
  IF p_section_key IN ('passwords', 'private') THEN
    RETURN false;
  END IF;

  SELECT cp.permission_level
  INTO v_level
  FROM public.couple_permissions cp
  JOIN public.couple_links cl ON cl.id = cp.couple_link_id
  WHERE cl.status = 'active'
    AND cp.granting_user_id = p_owner_user_id
    AND cp.receiving_user_id = v_viewer
    AND cp.section_key = p_section_key
  LIMIT 1;

  IF v_level IS NULL OR v_level = 'hidden' THEN
    RETURN false;
  END IF;

  IF p_min_level = 'collaborate' THEN
    RETURN v_level = 'collaborate';
  END IF;

  -- p_min_level = 'view'
  RETURN v_level IN ('view', 'collaborate');
END;
$$;

-- Resolve packet owner (so policies can call has_couple_access on a packet_id)
CREATE OR REPLACE FUNCTION public.packet_owner(p_packet_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT owner_user_id FROM public.packets WHERE id = p_packet_id LIMIT 1;
$$;

-- Convenience: partner has access to a section on a packet
CREATE OR REPLACE FUNCTION public.partner_can_access_packet_section(
  p_packet_id   uuid,
  p_section_key text,
  p_min_level   public.couple_permission_level DEFAULT 'view'
)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_couple_access(public.packet_owner(p_packet_id), p_section_key, p_min_level);
$$;

-- Seed default permissions when a couple link becomes active
CREATE OR REPLACE FUNCTION public.seed_default_couple_permissions(p_link_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link public.couple_links%ROWTYPE;
  v_sections text[] := ARRAY[
    'info','family','medical','real-estate','banking','investments',
    'retirement','vehicles','advisors','property','pets','funeral',
    'memories','legal'
  ];
  v_section text;
  v_default public.couple_permission_level;
BEGIN
  SELECT * INTO v_link FROM public.couple_links WHERE id = p_link_id;
  IF v_link.id IS NULL OR v_link.status <> 'active' OR v_link.user_id_2 IS NULL THEN
    RETURN;
  END IF;

  FOREACH v_section IN ARRAY v_sections LOOP
    -- Default per spec: medical = view-only, everything else = view-only.
    -- Passwords/private are hard-blocked in has_couple_access; we still
    -- skip seeding rows for them to keep the matrix clean.
    v_default := 'view';

    INSERT INTO public.couple_permissions (couple_link_id, granting_user_id, receiving_user_id, section_key, permission_level)
    VALUES (p_link_id, v_link.user_id_1, v_link.user_id_2, v_section, v_default)
    ON CONFLICT (couple_link_id, granting_user_id, section_key) DO NOTHING;

    INSERT INTO public.couple_permissions (couple_link_id, granting_user_id, receiving_user_id, section_key, permission_level)
    VALUES (p_link_id, v_link.user_id_2, v_link.user_id_1, v_section, v_default)
    ON CONFLICT (couple_link_id, granting_user_id, section_key) DO NOTHING;
  END LOOP;
END;
$$;

-- Log helper (callable from triggers and edge functions)
CREATE OR REPLACE FUNCTION public.log_couple_activity(
  p_action       public.couple_activity_action,
  p_section_key  text DEFAULT NULL,
  p_record_id    uuid DEFAULT NULL,
  p_record_table text DEFAULT NULL,
  p_description  text DEFAULT NULL,
  p_user_id      uuid DEFAULT auth.uid()
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
BEGIN
  IF p_user_id IS NULL THEN RETURN; END IF;
  v_link_id := public.get_couple_link_id(p_user_id);
  IF v_link_id IS NULL THEN RETURN; END IF;

  INSERT INTO public.couple_activity (couple_link_id, user_id, action_type, section_key, record_id, record_table, description)
  VALUES (v_link_id, p_user_id, p_action, p_section_key, p_record_id, p_record_table, p_description);
END;
$$;

-- =============================================================================
-- RLS on the new tables
-- =============================================================================
ALTER TABLE public.couple_links       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_permissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.couple_activity    ENABLE ROW LEVEL SECURITY;

-- couple_links: a user sees rows where they are user_id_1 or user_id_2,
-- or admin sees all
DROP POLICY IF EXISTS "couple_links_select_self" ON public.couple_links;
CREATE POLICY "couple_links_select_self" ON public.couple_links
  FOR SELECT TO authenticated
  USING (
    user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin()
  );

DROP POLICY IF EXISTS "couple_links_insert_self" ON public.couple_links;
CREATE POLICY "couple_links_insert_self" ON public.couple_links
  FOR INSERT TO authenticated
  WITH CHECK (initiated_by = auth.uid() AND user_id_1 = auth.uid());

DROP POLICY IF EXISTS "couple_links_update_self" ON public.couple_links;
CREATE POLICY "couple_links_update_self" ON public.couple_links
  FOR UPDATE TO authenticated
  USING (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin())
  WITH CHECK (user_id_1 = auth.uid() OR user_id_2 = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "couple_links_delete_admin" ON public.couple_links;
CREATE POLICY "couple_links_delete_admin" ON public.couple_links
  FOR DELETE TO authenticated USING (public.is_admin());

-- couple_permissions: granter and receiver can see; only granter can mutate
DROP POLICY IF EXISTS "couple_perms_select" ON public.couple_permissions;
CREATE POLICY "couple_perms_select" ON public.couple_permissions
  FOR SELECT TO authenticated
  USING (granting_user_id = auth.uid() OR receiving_user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS "couple_perms_insert" ON public.couple_permissions;
CREATE POLICY "couple_perms_insert" ON public.couple_permissions
  FOR INSERT TO authenticated
  WITH CHECK (granting_user_id = auth.uid());

DROP POLICY IF EXISTS "couple_perms_update" ON public.couple_permissions;
CREATE POLICY "couple_perms_update" ON public.couple_permissions
  FOR UPDATE TO authenticated
  USING (granting_user_id = auth.uid())
  WITH CHECK (granting_user_id = auth.uid());

DROP POLICY IF EXISTS "couple_perms_delete" ON public.couple_permissions;
CREATE POLICY "couple_perms_delete" ON public.couple_permissions
  FOR DELETE TO authenticated USING (granting_user_id = auth.uid());

-- couple_activity: both partners on the link can read; insert via SECURITY DEFINER helper only
DROP POLICY IF EXISTS "couple_activity_select" ON public.couple_activity;
CREATE POLICY "couple_activity_select" ON public.couple_activity
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.id = couple_link_id
        AND (cl.user_id_1 = auth.uid() OR cl.user_id_2 = auth.uid())
    ) OR public.is_admin()
  );

-- =============================================================================
-- Extend RLS on every section table to allow partner access via has_couple_access
-- Pattern per table:
--   partner_select  : partner_can_access_packet_section(packet_id, '<section>', 'view')
--   partner_modify  : partner_can_access_packet_section(packet_id, '<section>', 'collaborate')
-- Existing owner/member policies stay untouched.
-- =============================================================================

-- Helper to add four policies in one shot
DO $$
DECLARE
  v_tables text[] := ARRAY[
    -- table_name | section_key
    'info_records|info',
    'family_members|family',
    'medical_records|medical',
    'banking_records|banking',
    'investment_records|investments',
    'advisor_records|advisors',
    'funeral_records|funeral',
    'documents|info',                -- documents handled separately below for section_key
    'legal_documents|legal'
  ];
BEGIN
  -- Intentionally empty: we hand-write each block below for clarity and to map
  -- the right section_key (documents has its own section_key column).
  NULL;
END $$;

-- ----- info_records (section: info)
DROP POLICY IF EXISTS "partner_select_info_records" ON public.info_records;
CREATE POLICY "partner_select_info_records" ON public.info_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'info', 'view'));

DROP POLICY IF EXISTS "partner_insert_info_records" ON public.info_records;
CREATE POLICY "partner_insert_info_records" ON public.info_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'info', 'collaborate'));

DROP POLICY IF EXISTS "partner_update_info_records" ON public.info_records;
CREATE POLICY "partner_update_info_records" ON public.info_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'info', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'info', 'collaborate'));

DROP POLICY IF EXISTS "partner_delete_info_records" ON public.info_records;
CREATE POLICY "partner_delete_info_records" ON public.info_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'info', 'collaborate'));

-- ----- family_members (section: family)
DROP POLICY IF EXISTS "partner_select_family_members" ON public.family_members;
CREATE POLICY "partner_select_family_members" ON public.family_members
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'family', 'view'));
DROP POLICY IF EXISTS "partner_insert_family_members" ON public.family_members;
CREATE POLICY "partner_insert_family_members" ON public.family_members
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'family', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_family_members" ON public.family_members;
CREATE POLICY "partner_update_family_members" ON public.family_members
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'family', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'family', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_family_members" ON public.family_members;
CREATE POLICY "partner_delete_family_members" ON public.family_members
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'family', 'collaborate'));

-- ----- medical_records (section: medical)
DROP POLICY IF EXISTS "partner_select_medical_records" ON public.medical_records;
CREATE POLICY "partner_select_medical_records" ON public.medical_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'medical', 'view'));
DROP POLICY IF EXISTS "partner_insert_medical_records" ON public.medical_records;
CREATE POLICY "partner_insert_medical_records" ON public.medical_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'medical', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_medical_records" ON public.medical_records;
CREATE POLICY "partner_update_medical_records" ON public.medical_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'medical', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'medical', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_medical_records" ON public.medical_records;
CREATE POLICY "partner_delete_medical_records" ON public.medical_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'medical', 'collaborate'));

-- ----- banking_records (section: banking)
DROP POLICY IF EXISTS "partner_select_banking_records" ON public.banking_records;
CREATE POLICY "partner_select_banking_records" ON public.banking_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'banking', 'view'));
DROP POLICY IF EXISTS "partner_insert_banking_records" ON public.banking_records;
CREATE POLICY "partner_insert_banking_records" ON public.banking_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'banking', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_banking_records" ON public.banking_records;
CREATE POLICY "partner_update_banking_records" ON public.banking_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'banking', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'banking', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_banking_records" ON public.banking_records;
CREATE POLICY "partner_delete_banking_records" ON public.banking_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'banking', 'collaborate'));

-- ----- investment_records (section: investments)
DROP POLICY IF EXISTS "partner_select_investment_records" ON public.investment_records;
CREATE POLICY "partner_select_investment_records" ON public.investment_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'investments', 'view'));
DROP POLICY IF EXISTS "partner_insert_investment_records" ON public.investment_records;
CREATE POLICY "partner_insert_investment_records" ON public.investment_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'investments', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_investment_records" ON public.investment_records;
CREATE POLICY "partner_update_investment_records" ON public.investment_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'investments', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'investments', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_investment_records" ON public.investment_records;
CREATE POLICY "partner_delete_investment_records" ON public.investment_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'investments', 'collaborate'));

-- ----- advisor_records (section: advisors)
DROP POLICY IF EXISTS "partner_select_advisor_records" ON public.advisor_records;
CREATE POLICY "partner_select_advisor_records" ON public.advisor_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'advisors', 'view'));
DROP POLICY IF EXISTS "partner_insert_advisor_records" ON public.advisor_records;
CREATE POLICY "partner_insert_advisor_records" ON public.advisor_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'advisors', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_advisor_records" ON public.advisor_records;
CREATE POLICY "partner_update_advisor_records" ON public.advisor_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'advisors', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'advisors', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_advisor_records" ON public.advisor_records;
CREATE POLICY "partner_delete_advisor_records" ON public.advisor_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'advisors', 'collaborate'));

-- ----- funeral_records (section: funeral)
DROP POLICY IF EXISTS "partner_select_funeral_records" ON public.funeral_records;
CREATE POLICY "partner_select_funeral_records" ON public.funeral_records
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'funeral', 'view'));
DROP POLICY IF EXISTS "partner_insert_funeral_records" ON public.funeral_records;
CREATE POLICY "partner_insert_funeral_records" ON public.funeral_records
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'funeral', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_funeral_records" ON public.funeral_records;
CREATE POLICY "partner_update_funeral_records" ON public.funeral_records
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'funeral', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'funeral', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_funeral_records" ON public.funeral_records;
CREATE POLICY "partner_delete_funeral_records" ON public.funeral_records
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'funeral', 'collaborate'));

-- ----- legal_documents (section: legal)
DROP POLICY IF EXISTS "partner_select_legal_documents" ON public.legal_documents;
CREATE POLICY "partner_select_legal_documents" ON public.legal_documents
  FOR SELECT TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'legal', 'view'));
DROP POLICY IF EXISTS "partner_insert_legal_documents" ON public.legal_documents;
CREATE POLICY "partner_insert_legal_documents" ON public.legal_documents
  FOR INSERT TO authenticated
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'legal', 'collaborate'));
DROP POLICY IF EXISTS "partner_update_legal_documents" ON public.legal_documents;
CREATE POLICY "partner_update_legal_documents" ON public.legal_documents
  FOR UPDATE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'legal', 'collaborate'))
  WITH CHECK (public.partner_can_access_packet_section(packet_id, 'legal', 'collaborate'));
DROP POLICY IF EXISTS "partner_delete_legal_documents" ON public.legal_documents;
CREATE POLICY "partner_delete_legal_documents" ON public.legal_documents
  FOR DELETE TO authenticated
  USING (public.partner_can_access_packet_section(packet_id, 'legal', 'collaborate'));

-- ----- documents (general — uses section_key column for the gate)
DROP POLICY IF EXISTS "partner_select_documents" ON public.documents;
CREATE POLICY "partner_select_documents" ON public.documents
  FOR SELECT TO authenticated
  USING (
    is_private IS NOT TRUE
    AND section_key IS NOT NULL
    AND public.partner_can_access_packet_section(packet_id, section_key, 'view')
  );
DROP POLICY IF EXISTS "partner_insert_documents" ON public.documents;
CREATE POLICY "partner_insert_documents" ON public.documents
  FOR INSERT TO authenticated
  WITH CHECK (
    is_private IS NOT TRUE
    AND section_key IS NOT NULL
    AND public.partner_can_access_packet_section(packet_id, section_key, 'collaborate')
  );
DROP POLICY IF EXISTS "partner_update_documents" ON public.documents;
CREATE POLICY "partner_update_documents" ON public.documents
  FOR UPDATE TO authenticated
  USING (
    is_private IS NOT TRUE
    AND section_key IS NOT NULL
    AND public.partner_can_access_packet_section(packet_id, section_key, 'collaborate')
  )
  WITH CHECK (
    is_private IS NOT TRUE
    AND section_key IS NOT NULL
    AND public.partner_can_access_packet_section(packet_id, section_key, 'collaborate')
  );
DROP POLICY IF EXISTS "partner_delete_documents" ON public.documents;
CREATE POLICY "partner_delete_documents" ON public.documents
  FOR DELETE TO authenticated
  USING (
    is_private IS NOT TRUE
    AND section_key IS NOT NULL
    AND public.partner_can_access_packet_section(packet_id, section_key, 'collaborate')
  );

-- =============================================================================
-- Optional section tables (real_estate, retirement, vehicles, personal_property, pet_records, memories,
-- credit_cards, password_records). Wrap in DO blocks so the migration succeeds even if a table is absent.
-- =============================================================================
DO $$
DECLARE
  v_section_map jsonb := jsonb_build_object(
    'real_estate_records', 'real-estate',
    'retirement_records',  'retirement',
    'vehicle_records',     'vehicles',
    'personal_property_records', 'property',
    'pet_records',         'pets',
    'memories',            'memories',
    'credit_cards',        'banking'
  );
  v_table text;
  v_section text;
  v_sql text;
BEGIN
  FOR v_table, v_section IN SELECT * FROM jsonb_each_text(v_section_map) LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema='public' AND table_name=v_table) THEN
      -- SELECT
      EXECUTE format(
        'DROP POLICY IF EXISTS "partner_select_%I" ON public.%I;', v_table, v_table);
      EXECUTE format(
        'CREATE POLICY "partner_select_%I" ON public.%I FOR SELECT TO authenticated
           USING (public.partner_can_access_packet_section(packet_id, %L, ''view''));',
        v_table, v_table, v_section);
      -- INSERT
      EXECUTE format(
        'DROP POLICY IF EXISTS "partner_insert_%I" ON public.%I;', v_table, v_table);
      EXECUTE format(
        'CREATE POLICY "partner_insert_%I" ON public.%I FOR INSERT TO authenticated
           WITH CHECK (public.partner_can_access_packet_section(packet_id, %L, ''collaborate''));',
        v_table, v_table, v_section);
      -- UPDATE
      EXECUTE format(
        'DROP POLICY IF EXISTS "partner_update_%I" ON public.%I;', v_table, v_table);
      EXECUTE format(
        'CREATE POLICY "partner_update_%I" ON public.%I FOR UPDATE TO authenticated
           USING (public.partner_can_access_packet_section(packet_id, %L, ''collaborate''))
           WITH CHECK (public.partner_can_access_packet_section(packet_id, %L, ''collaborate''));',
        v_table, v_table, v_section, v_section);
      -- DELETE
      EXECUTE format(
        'DROP POLICY IF EXISTS "partner_delete_%I" ON public.%I;', v_table, v_table);
      EXECUTE format(
        'CREATE POLICY "partner_delete_%I" ON public.%I FOR DELETE TO authenticated
           USING (public.partner_can_access_packet_section(packet_id, %L, ''collaborate''));',
        v_table, v_table, v_section);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- Activity-logging trigger (fires when a partner edits/deletes a record they don't own)
-- =============================================================================
CREATE OR REPLACE FUNCTION public.trg_log_couple_activity()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_packet_id uuid;
  v_owner uuid;
  v_actor uuid := auth.uid();
  v_section text := TG_ARGV[0];
  v_action public.couple_activity_action;
  v_record_id uuid;
BEGIN
  IF v_actor IS NULL THEN RETURN COALESCE(NEW, OLD); END IF;

  v_packet_id := COALESCE(NEW.packet_id, OLD.packet_id);
  v_owner := public.packet_owner(v_packet_id);

  -- Only log when the actor is the partner (not the owner)
  IF v_owner IS NULL OR v_owner = v_actor THEN
    RETURN COALESCE(NEW, OLD);
  END IF;

  v_action := CASE TG_OP
    WHEN 'INSERT' THEN 'added'::public.couple_activity_action
    WHEN 'UPDATE' THEN 'edited'::public.couple_activity_action
    WHEN 'DELETE' THEN 'deleted'::public.couple_activity_action
  END;
  v_record_id := COALESCE(NEW.id, OLD.id);

  PERFORM public.log_couple_activity(v_action, v_section, v_record_id, TG_TABLE_NAME, NULL, v_actor);
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Attach the trigger to every section table (table | section_key)
DO $$
DECLARE
  v_pairs text[] := ARRAY[
    'info_records|info',
    'family_members|family',
    'medical_records|medical',
    'banking_records|banking',
    'investment_records|investments',
    'advisor_records|advisors',
    'funeral_records|funeral',
    'legal_documents|legal',
    'real_estate_records|real-estate',
    'retirement_records|retirement',
    'vehicle_records|vehicles',
    'personal_property_records|property',
    'pet_records|pets',
    'memories|memories',
    'credit_cards|banking',
    'documents|info'  -- documents has its own section_key column; we pass 'info' as fallback label
  ];
  v_pair text;
  v_table text;
  v_section text;
BEGIN
  FOREACH v_pair IN ARRAY v_pairs LOOP
    v_table := split_part(v_pair, '|', 1);
    v_section := split_part(v_pair, '|', 2);
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=v_table) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_couple_activity_%I ON public.%I;', v_table, v_table);
      EXECUTE format(
        'CREATE TRIGGER trg_couple_activity_%I
           AFTER INSERT OR UPDATE OR DELETE ON public.%I
           FOR EACH ROW EXECUTE FUNCTION public.trg_log_couple_activity(%L);',
        v_table, v_table, v_section);
    END IF;
  END LOOP;
END $$;

-- =============================================================================
-- Allow partner to read minimal profile/health-score info of the partner only
-- =============================================================================
DROP POLICY IF EXISTS "profiles_select_partner" ON public.profiles;
CREATE POLICY "profiles_select_partner" ON public.profiles
  FOR SELECT TO authenticated
  USING (id = public.get_partner_id(auth.uid()));

DROP POLICY IF EXISTS "health_scores_select_partner" ON public.health_scores;
CREATE POLICY "health_scores_select_partner" ON public.health_scores
  FOR SELECT TO authenticated
  USING (user_id = public.get_partner_id(auth.uid()));

DROP POLICY IF EXISTS "packets_select_partner" ON public.packets;
CREATE POLICY "packets_select_partner" ON public.packets
  FOR SELECT TO authenticated
  USING (owner_user_id = public.get_partner_id(auth.uid()));
