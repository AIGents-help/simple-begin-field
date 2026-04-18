-- ============================================================================
-- COUPLE COLLABORATION: Phase 2 (deferred items)
-- Notifications, annual review, helper RPCs for combined views.
-- ============================================================================

-- Add columns to couple_links
ALTER TABLE public.couple_links
  ADD COLUMN IF NOT EXISTS last_review_at timestamptz,
  ADD COLUMN IF NOT EXISTS email_notifications_enabled boolean NOT NULL DEFAULT true;

-- ============================================================================
-- TABLE: couple_notifications
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.couple_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id uuid NOT NULL REFERENCES public.couple_links(id) ON DELETE CASCADE,
  recipient_user_id uuid NOT NULL,
  actor_user_id uuid NOT NULL,
  notification_type text NOT NULL CHECK (notification_type IN (
    'section_completed','document_added','permission_changed',
    'health_score_changed','inactivity_nudge','annual_review','partner_linked','partner_unlinked'
  )),
  title text NOT NULL,
  body text,
  link_to text,
  is_read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS couple_notifications_recipient_idx
  ON public.couple_notifications (recipient_user_id, is_read, created_at DESC);

ALTER TABLE public.couple_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "recipient can read own notifications" ON public.couple_notifications;
CREATE POLICY "recipient can read own notifications"
  ON public.couple_notifications FOR SELECT
  USING (auth.uid() = recipient_user_id);

DROP POLICY IF EXISTS "recipient can update own notifications" ON public.couple_notifications;
CREATE POLICY "recipient can update own notifications"
  ON public.couple_notifications FOR UPDATE
  USING (auth.uid() = recipient_user_id);

DROP POLICY IF EXISTS "actor can insert notifications for active partner" ON public.couple_notifications;
CREATE POLICY "actor can insert notifications for active partner"
  ON public.couple_notifications FOR INSERT
  WITH CHECK (
    auth.uid() = actor_user_id
    AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.id = couple_link_id
        AND cl.status = 'active'
        AND (
          (cl.user_id_1 = auth.uid() AND cl.user_id_2 = recipient_user_id) OR
          (cl.user_id_2 = auth.uid() AND cl.user_id_1 = recipient_user_id)
        )
    )
  );

DROP POLICY IF EXISTS "recipient can delete own notifications" ON public.couple_notifications;
CREATE POLICY "recipient can delete own notifications"
  ON public.couple_notifications FOR DELETE
  USING (auth.uid() = recipient_user_id);

-- ============================================================================
-- TABLE: couple_review_log
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.couple_review_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  couple_link_id uuid NOT NULL REFERENCES public.couple_links(id) ON DELETE CASCADE,
  completed_by uuid NOT NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS couple_review_log_link_idx
  ON public.couple_review_log (couple_link_id, created_at DESC);

ALTER TABLE public.couple_review_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "couple partners can read review log" ON public.couple_review_log;
CREATE POLICY "couple partners can read review log"
  ON public.couple_review_log FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.id = couple_link_id
        AND cl.status = 'active'
        AND (cl.user_id_1 = auth.uid() OR cl.user_id_2 = auth.uid())
    )
  );

DROP POLICY IF EXISTS "couple partners can insert review log" ON public.couple_review_log;
CREATE POLICY "couple partners can insert review log"
  ON public.couple_review_log FOR INSERT
  WITH CHECK (
    auth.uid() = completed_by
    AND EXISTS (
      SELECT 1 FROM public.couple_links cl
      WHERE cl.id = couple_link_id
        AND cl.status = 'active'
        AND (cl.user_id_1 = auth.uid() OR cl.user_id_2 = auth.uid())
    )
  );

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Get partner's health score (uses SECURITY DEFINER so we bypass RLS — partner's
-- score is already surfaced via the couple link, this just unifies the read).
CREATE OR REPLACE FUNCTION public.get_partner_health_score(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner uuid;
  v_score jsonb;
BEGIN
  v_partner := public.get_partner_id(p_user_id);
  IF v_partner IS NULL THEN
    RETURN NULL;
  END IF;
  SELECT to_jsonb(hs) INTO v_score
  FROM public.health_scores hs
  WHERE hs.user_id = v_partner
  LIMIT 1;
  RETURN v_score;
END;
$$;

-- Combined family tree: returns rows from both partners' packets, with an
-- "owner_side" tag ('me' or 'partner').
CREATE OR REPLACE FUNCTION public.get_combined_family_tree(p_user_id uuid DEFAULT auth.uid())
RETURNS TABLE (
  id uuid,
  packet_id uuid,
  owner_side text,
  name text,
  relationship text,
  is_deceased boolean,
  birthday date,
  email text,
  phone text,
  photo_path text,
  parent_member_id uuid
)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner uuid;
  v_my_packet uuid;
  v_partner_packet uuid;
BEGIN
  v_partner := public.get_partner_id(p_user_id);

  SELECT p.id INTO v_my_packet FROM public.packets p WHERE p.owner_user_id = p_user_id LIMIT 1;
  IF v_partner IS NOT NULL THEN
    SELECT p.id INTO v_partner_packet FROM public.packets p WHERE p.owner_user_id = v_partner LIMIT 1;
  END IF;

  RETURN QUERY
  SELECT fm.id, fm.packet_id, 'me'::text AS owner_side,
         fm.name, fm.relationship, fm.is_deceased, fm.birthday,
         fm.email, fm.phone, fm.photo_path, fm.parent_member_id
  FROM public.family_members fm
  WHERE fm.packet_id = v_my_packet
  UNION ALL
  SELECT fm.id, fm.packet_id, 'partner'::text AS owner_side,
         fm.name, fm.relationship, fm.is_deceased, fm.birthday,
         fm.email, fm.phone, fm.photo_path, fm.parent_member_id
  FROM public.family_members fm
  WHERE v_partner_packet IS NOT NULL
    AND fm.packet_id = v_partner_packet
    -- Only include records the partner has shared at view+ level for family
    AND EXISTS (
      SELECT 1 FROM public.couple_permissions cp
      JOIN public.couple_links cl ON cl.id = cp.couple_link_id
      WHERE cl.status = 'active'
        AND ((cl.user_id_1 = v_partner AND cl.user_id_2 = p_user_id)
          OR (cl.user_id_2 = v_partner AND cl.user_id_1 = p_user_id))
        AND cp.granting_user_id = v_partner
        AND cp.section_key = 'family'
        AND cp.permission_level IN ('view','collaborate')
    );
END;
$$;

-- Beneficiary alignment: compares investment + retirement primary beneficiaries
-- between the two packets. Returns mismatches as a JSON array.
CREATE OR REPLACE FUNCTION public.check_beneficiary_alignment(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner uuid;
  v_my_packet uuid;
  v_partner_packet uuid;
  v_results jsonb := '[]'::jsonb;
  v_my_inv_count int;
  v_partner_inv_count int;
  v_my_ret_count int;
  v_partner_ret_count int;
  v_my_inv_has_partner_named bool := false;
  v_partner_inv_has_me_named bool := false;
BEGIN
  v_partner := public.get_partner_id(p_user_id);
  IF v_partner IS NULL THEN
    RETURN jsonb_build_object('linked', false, 'mismatches', '[]'::jsonb);
  END IF;

  SELECT p.id INTO v_my_packet FROM public.packets p WHERE p.owner_user_id = p_user_id LIMIT 1;
  SELECT p.id INTO v_partner_packet FROM public.packets p WHERE p.owner_user_id = v_partner LIMIT 1;

  -- Investment: check for missing primary beneficiary on either side
  SELECT count(*) INTO v_my_inv_count
  FROM public.investment_records
  WHERE packet_id = v_my_packet AND (primary_beneficiary IS NULL OR primary_beneficiary = '');
  IF v_my_inv_count > 0 THEN
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'severity','warn','section','investments','side','me',
      'count', v_my_inv_count,
      'message', v_my_inv_count || ' investment account(s) have no primary beneficiary'
    ));
  END IF;

  SELECT count(*) INTO v_partner_inv_count
  FROM public.investment_records
  WHERE packet_id = v_partner_packet AND (primary_beneficiary IS NULL OR primary_beneficiary = '');
  IF v_partner_inv_count > 0 THEN
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'severity','warn','section','investments','side','partner',
      'count', v_partner_inv_count,
      'message', 'Partner has ' || v_partner_inv_count || ' investment account(s) with no primary beneficiary'
    ));
  END IF;

  -- Retirement: same check
  SELECT count(*) INTO v_my_ret_count
  FROM public.retirement_records
  WHERE packet_id = v_my_packet AND (primary_beneficiary IS NULL OR primary_beneficiary = '');
  IF v_my_ret_count > 0 THEN
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'severity','critical','section','retirement','side','me',
      'count', v_my_ret_count,
      'message', v_my_ret_count || ' retirement account(s) have no primary beneficiary'
    ));
  END IF;

  SELECT count(*) INTO v_partner_ret_count
  FROM public.retirement_records
  WHERE packet_id = v_partner_packet AND (primary_beneficiary IS NULL OR primary_beneficiary = '');
  IF v_partner_ret_count > 0 THEN
    v_results := v_results || jsonb_build_array(jsonb_build_object(
      'severity','critical','section','retirement','side','partner',
      'count', v_partner_ret_count,
      'message', 'Partner has ' || v_partner_ret_count || ' retirement account(s) with no primary beneficiary'
    ));
  END IF;

  RETURN jsonb_build_object('linked', true, 'mismatches', v_results);
END;
$$;

-- Document gap prompts: find sections where partner has records but user does not.
CREATE OR REPLACE FUNCTION public.get_partner_document_gaps(p_user_id uuid DEFAULT auth.uid())
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_partner uuid;
  v_my_packet uuid;
  v_partner_packet uuid;
  v_gaps jsonb := '[]'::jsonb;
  rec record;
BEGIN
  v_partner := public.get_partner_id(p_user_id);
  IF v_partner IS NULL THEN RETURN '[]'::jsonb; END IF;

  SELECT p.id INTO v_my_packet FROM public.packets p WHERE p.owner_user_id = p_user_id LIMIT 1;
  SELECT p.id INTO v_partner_packet FROM public.packets p WHERE p.owner_user_id = v_partner LIMIT 1;

  -- Will / legal documents
  IF EXISTS (SELECT 1 FROM public.legal_documents WHERE packet_id = v_partner_packet AND lower(document_type) LIKE '%will%')
     AND NOT EXISTS (SELECT 1 FROM public.legal_documents WHERE packet_id = v_my_packet AND lower(document_type) LIKE '%will%') THEN
    v_gaps := v_gaps || jsonb_build_array(jsonb_build_object(
      'section','legal','label','Your partner has a Will — you don''t yet','cta','Add a Will'
    ));
  END IF;

  -- POA
  IF EXISTS (SELECT 1 FROM public.legal_documents WHERE packet_id = v_partner_packet AND (lower(document_type) LIKE '%poa%' OR lower(document_type) LIKE '%power%'))
     AND NOT EXISTS (SELECT 1 FROM public.legal_documents WHERE packet_id = v_my_packet AND (lower(document_type) LIKE '%poa%' OR lower(document_type) LIKE '%power%')) THEN
    v_gaps := v_gaps || jsonb_build_array(jsonb_build_object(
      'section','legal','label','Your partner has a Power of Attorney — you don''t yet','cta','Add a POA'
    ));
  END IF;

  -- Funeral
  IF EXISTS (SELECT 1 FROM public.funeral_records WHERE packet_id = v_partner_packet)
     AND NOT EXISTS (SELECT 1 FROM public.funeral_records WHERE packet_id = v_my_packet) THEN
    v_gaps := v_gaps || jsonb_build_array(jsonb_build_object(
      'section','funeral','label','Your partner has funeral wishes documented — you don''t yet','cta','Add funeral wishes'
    ));
  END IF;

  -- Medical
  IF EXISTS (SELECT 1 FROM public.medical_records WHERE packet_id = v_partner_packet)
     AND NOT EXISTS (SELECT 1 FROM public.medical_records WHERE packet_id = v_my_packet) THEN
    v_gaps := v_gaps || jsonb_build_array(jsonb_build_object(
      'section','medical','label','Your partner has medical info — you don''t yet','cta','Add medical info'
    ));
  END IF;

  RETURN v_gaps;
END;
$$;

-- Notify partner: insert a notification row for the active partner.
CREATE OR REPLACE FUNCTION public.notify_partner(
  p_notification_type text,
  p_title text,
  p_body text DEFAULT NULL,
  p_link_to text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link record;
  v_partner uuid;
  v_id uuid;
BEGIN
  SELECT id, user_id_1, user_id_2 INTO v_link
  FROM public.couple_links
  WHERE status = 'active'
    AND (user_id_1 = auth.uid() OR user_id_2 = auth.uid())
  LIMIT 1;

  IF v_link.id IS NULL THEN RETURN NULL; END IF;
  v_partner := CASE WHEN v_link.user_id_1 = auth.uid() THEN v_link.user_id_2 ELSE v_link.user_id_1 END;
  IF v_partner IS NULL THEN RETURN NULL; END IF;

  INSERT INTO public.couple_notifications (
    couple_link_id, recipient_user_id, actor_user_id,
    notification_type, title, body, link_to
  ) VALUES (
    v_link.id, v_partner, auth.uid(),
    p_notification_type, p_title, p_body, p_link_to
  )
  RETURNING id INTO v_id;
  RETURN v_id;
END;
$$;

-- Mark annual review completed
CREATE OR REPLACE FUNCTION public.mark_couple_review_completed(p_notes text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_link_id uuid;
BEGIN
  v_link_id := public.get_couple_link_id(auth.uid());
  IF v_link_id IS NULL THEN
    RAISE EXCEPTION 'No active couple link';
  END IF;

  INSERT INTO public.couple_review_log (couple_link_id, completed_by, notes)
  VALUES (v_link_id, auth.uid(), p_notes);

  UPDATE public.couple_links SET last_review_at = now(), updated_at = now()
  WHERE id = v_link_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_partner_health_score(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_combined_family_tree(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_beneficiary_alignment(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_partner_document_gaps(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.notify_partner(text, text, text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.mark_couple_review_completed(text) TO authenticated;