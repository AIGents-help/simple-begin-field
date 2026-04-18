-- =====================================================================
-- Packet Health Score System — Phase 1 schema
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.health_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL UNIQUE,
  user_id uuid NOT NULL,
  total_score integer NOT NULL DEFAULT 0,
  section_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  critical_gaps jsonb NOT NULL DEFAULT '[]'::jsonb,
  previous_score integer NOT NULL DEFAULT 0,
  score_change integer NOT NULL DEFAULT 0,
  calculated_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_scores_user_id_idx ON public.health_scores(user_id);
CREATE INDEX IF NOT EXISTS health_scores_total_score_idx ON public.health_scores(total_score);

ALTER TABLE public.health_scores ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view health_scores" ON public.health_scores;
CREATE POLICY "Members view health_scores"
  ON public.health_scores FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

DROP POLICY IF EXISTS "Admins manage health_scores insert" ON public.health_scores;
CREATE POLICY "Admins manage health_scores insert"
  ON public.health_scores FOR INSERT
  WITH CHECK (is_admin());

DROP POLICY IF EXISTS "Admins manage health_scores update" ON public.health_scores;
CREATE POLICY "Admins manage health_scores update"
  ON public.health_scores FOR UPDATE
  USING (is_admin());

DROP POLICY IF EXISTS "Admins manage health_scores delete" ON public.health_scores;
CREATE POLICY "Admins manage health_scores delete"
  ON public.health_scores FOR DELETE
  USING (is_admin());

CREATE TABLE IF NOT EXISTS public.health_score_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL,
  user_id uuid NOT NULL,
  total_score integer NOT NULL,
  section_scores jsonb NOT NULL DEFAULT '{}'::jsonb,
  recorded_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS health_score_history_packet_idx
  ON public.health_score_history(packet_id, recorded_at DESC);

ALTER TABLE public.health_score_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members view health_score_history" ON public.health_score_history;
CREATE POLICY "Members view health_score_history"
  ON public.health_score_history FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

CREATE OR REPLACE FUNCTION public.calculate_health_score(p_packet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_section_scores jsonb := '{}'::jsonb;
  v_total numeric := 0;
  v_bonus numeric := 0;
  v_critical_gaps jsonb := '[]'::jsonb;
  v_doc_section_count integer := 0;
  v_previous integer := 0;

  v_count integer;
  v_doc_count integer;
  v_expiry_count integer;
  v_recommended_pct numeric;
  v_section_pts numeric;
  v_section_max numeric;

  v_has_will boolean;
  v_has_poa boolean;
  v_has_directive boolean;

  v_checkin_on boolean;
  v_trusted_count integer;
  v_funeral_filled integer;
BEGIN
  SELECT owner_user_id INTO v_user_id FROM packets WHERE id = p_packet_id;
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('error', 'packet_not_found');
  END IF;

  -- LEGAL — 15 pts
  v_section_max := 15;
  SELECT COUNT(*) INTO v_count FROM legal_documents WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'legal';
  SELECT COUNT(*) INTO v_expiry_count FROM legal_documents
    WHERE packet_id = p_packet_id AND (document_date IS NOT NULL OR last_reviewed_date IS NOT NULL);
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN attorney_name IS NOT NULL AND original_location IS NOT NULL THEN 1.0
                     WHEN attorney_name IS NOT NULL OR original_location IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM legal_documents WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END)
                 + (CASE WHEN v_expiry_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('legal', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  SELECT EXISTS(SELECT 1 FROM legal_documents WHERE packet_id = p_packet_id AND lower(document_type) LIKE '%will%') INTO v_has_will;
  SELECT EXISTS(SELECT 1 FROM legal_documents WHERE packet_id = p_packet_id AND (lower(document_type) LIKE '%poa%' OR lower(document_type) LIKE '%power%')) INTO v_has_poa;
  SELECT EXISTS(SELECT 1 FROM legal_documents WHERE packet_id = p_packet_id AND (lower(document_type) LIKE '%directive%' OR lower(document_type) LIKE '%living will%' OR lower(document_type) LIKE '%healthcare%')) INTO v_has_directive;
  IF NOT v_has_will THEN
    v_critical_gaps := v_critical_gaps || jsonb_build_array(
      jsonb_build_object('section','legal','label','No Will on file','impact',6,'cta','Add a Will in Legal'));
  END IF;
  IF NOT v_has_poa THEN
    v_critical_gaps := v_critical_gaps || jsonb_build_array(
      jsonb_build_object('section','legal','label','No Power of Attorney on file','impact',5,'cta','Add a POA in Legal'));
  END IF;

  -- MEDICAL — 12 pts
  v_section_max := 12;
  SELECT COUNT(*) INTO v_count FROM medical_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'medical';
  SELECT COUNT(*) INTO v_expiry_count FROM medical_records
    WHERE packet_id = p_packet_id AND insurance_renewal_date IS NOT NULL;
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN insurance_provider IS NOT NULL AND phone IS NOT NULL THEN 1.0
                     WHEN insurance_provider IS NOT NULL OR phone IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM medical_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END)
                 + (CASE WHEN v_expiry_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('medical', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;
  IF v_count = 0 THEN
    v_critical_gaps := v_critical_gaps || jsonb_build_array(
      jsonb_build_object('section','medical','label','No medical providers listed','impact',5,'cta','Add doctors & insurance in Medical'));
  END IF;

  -- INFO — 10 pts
  v_section_max := 10;
  SELECT COUNT(*) INTO v_count FROM info_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'info';
  SELECT COUNT(*) INTO v_expiry_count FROM info_records WHERE packet_id = p_packet_id AND expiry_date IS NOT NULL;
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN notes IS NOT NULL AND length(notes) > 10 THEN 1.0 ELSE 0.3 END)
     FROM info_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END)
                 + (CASE WHEN v_expiry_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('info', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- BANKING — 10 pts
  v_section_max := 10;
  SELECT COUNT(*) INTO v_count FROM banking_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'banking';
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN account_number_masked IS NOT NULL AND contact_info IS NOT NULL THEN 1.0
                     WHEN account_number_masked IS NOT NULL OR contact_info IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM banking_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('banking', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;
  IF v_count = 0 THEN
    v_critical_gaps := v_critical_gaps || jsonb_build_array(
      jsonb_build_object('section','banking','label','No bank accounts on file','impact',4,'cta','Add a bank account in Banking'));
  END IF;

  -- FAMILY — 8 pts
  v_section_max := 8;
  SELECT COUNT(*) INTO v_count FROM family_members WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'family';
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN phone IS NOT NULL AND email IS NOT NULL THEN 1.0
                     WHEN phone IS NOT NULL OR email IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM family_members WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('family', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- REAL ESTATE — 8 pts (optional table)
  v_section_max := 8; v_count := 0; v_doc_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='real_estate_records') THEN
    EXECUTE 'SELECT COUNT(*) FROM real_estate_records WHERE packet_id = $1' INTO v_count USING p_packet_id;
  END IF;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'real-estate';
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('real-estate', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- RETIREMENT — 8 pts (optional table)
  v_section_max := 8; v_count := 0; v_doc_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='retirement_records') THEN
    EXECUTE 'SELECT COUNT(*) FROM retirement_records WHERE packet_id = $1' INTO v_count USING p_packet_id;
  END IF;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'retirement';
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('retirement', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- INVESTMENTS — 7 pts
  v_section_max := 7;
  SELECT COUNT(*) INTO v_count FROM investment_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'investments';
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN account_number_masked IS NOT NULL AND primary_beneficiary IS NOT NULL THEN 1.0
                     WHEN account_number_masked IS NOT NULL OR primary_beneficiary IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM investment_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('investments', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- ADVISORS — 6 pts
  v_section_max := 6;
  SELECT COUNT(*) INTO v_count FROM advisor_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'advisors';
  SELECT COUNT(*) INTO v_expiry_count FROM advisor_records WHERE packet_id = p_packet_id AND license_expiry_date IS NOT NULL;
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN phone IS NOT NULL AND email IS NOT NULL THEN 1.0
                     WHEN phone IS NOT NULL OR email IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM advisor_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END)
                 + (CASE WHEN v_expiry_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('advisors', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- PASSWORDS — 5 pts
  v_section_max := 5;
  SELECT COUNT(*) INTO v_count FROM password_records WHERE packet_id = p_packet_id;
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN username IS NOT NULL AND password_masked IS NOT NULL THEN 1.0
                     WHEN username IS NOT NULL OR password_masked IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM password_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END) + (v_recommended_pct * 0.4);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('passwords', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;

  -- FUNERAL — 5 pts
  v_section_max := 5;
  SELECT COUNT(*) INTO v_count FROM funeral_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'funeral';
  v_recommended_pct := COALESCE(
    (SELECT AVG(CASE WHEN burial_or_cremation IS NOT NULL AND service_preferences IS NOT NULL AND funeral_home IS NOT NULL THEN 1.0
                     WHEN burial_or_cremation IS NOT NULL OR service_preferences IS NOT NULL THEN 0.5
                     ELSE 0 END)
     FROM funeral_records WHERE packet_id = p_packet_id), 0);
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.4 ELSE 0 END)
                 + (v_recommended_pct * 0.4)
                 + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('funeral', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;
  v_funeral_filled := v_count;

  -- VEHICLES — 3 pts (optional)
  v_section_max := 3; v_count := 0; v_doc_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='vehicle_records') THEN
    EXECUTE 'SELECT COUNT(*) FROM vehicle_records WHERE packet_id = $1' INTO v_count USING p_packet_id;
  END IF;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'vehicles';
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('vehicles', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- PERSONAL PROPERTY — 3 pts
  v_section_max := 3;
  SELECT COUNT(*) INTO v_count FROM personal_property_records WHERE packet_id = p_packet_id;
  SELECT COUNT(*) INTO v_doc_count FROM documents WHERE packet_id = p_packet_id AND section_key = 'property';
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) + (CASE WHEN v_doc_count > 0 THEN 0.1 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('property', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;
  IF v_doc_count > 0 THEN v_doc_section_count := v_doc_section_count + 1; END IF;

  -- PETS — 2 pts (optional)
  v_section_max := 2; v_count := 0; v_doc_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='pet_records') THEN
    EXECUTE 'SELECT COUNT(*) FROM pet_records WHERE packet_id = $1' INTO v_count USING p_packet_id;
  END IF;
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END);
  v_section_pts := v_section_pts * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('pets', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;

  -- MEMORIES — 2 pts
  v_section_max := 2;
  SELECT COUNT(*) INTO v_count FROM memories WHERE packet_id = p_packet_id;
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('memories', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;

  -- PRIVATE — 2 pts (optional)
  v_section_max := 2; v_count := 0;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='private_items') THEN
    EXECUTE 'SELECT COUNT(*) FROM private_items WHERE packet_id = $1' INTO v_count USING p_packet_id;
  END IF;
  v_section_pts := (CASE WHEN v_count > 0 THEN 0.8 ELSE 0 END) * v_section_max;
  v_section_scores := v_section_scores || jsonb_build_object('private', jsonb_build_object('score', round(v_section_pts), 'max', v_section_max));
  v_total := v_total + v_section_pts;

  -- BONUS POINTS (max +5)
  SELECT COUNT(*) INTO v_trusted_count FROM trusted_contacts
    WHERE packet_id = p_packet_id AND status = 'active';
  IF v_trusted_count > 0 THEN v_bonus := v_bonus + 1; END IF;

  SELECT COALESCE(bool_or(is_enabled), false) INTO v_checkin_on
    FROM checkin_settings WHERE user_id = v_user_id;
  IF v_checkin_on THEN v_bonus := v_bonus + 1; END IF;

  IF v_doc_section_count >= 5 THEN v_bonus := v_bonus + 1; END IF;
  IF v_funeral_filled > 0 THEN v_bonus := v_bonus + 1; END IF;
  IF v_has_will AND v_has_poa AND v_has_directive THEN v_bonus := v_bonus + 1; END IF;

  -- Normalize: section max sum = 108 → /100, plus bonus, capped at 100
  v_total := round((v_total / 108.0) * 100.0) + v_bonus;
  IF v_total > 100 THEN v_total := 100; END IF;
  IF v_total < 0 THEN v_total := 0; END IF;

  SELECT total_score INTO v_previous FROM health_scores WHERE packet_id = p_packet_id;
  v_previous := COALESCE(v_previous, 0);

  INSERT INTO health_scores (
    packet_id, user_id, total_score, section_scores, critical_gaps,
    previous_score, score_change, calculated_at, updated_at
  ) VALUES (
    p_packet_id, v_user_id, v_total::int, v_section_scores, v_critical_gaps,
    v_previous, (v_total::int - v_previous), now(), now()
  )
  ON CONFLICT (packet_id) DO UPDATE SET
    total_score = EXCLUDED.total_score,
    section_scores = EXCLUDED.section_scores,
    critical_gaps = EXCLUDED.critical_gaps,
    previous_score = health_scores.total_score,
    score_change = EXCLUDED.total_score - health_scores.total_score,
    calculated_at = now(),
    updated_at = now();

  INSERT INTO health_score_history (packet_id, user_id, total_score, section_scores)
  VALUES (p_packet_id, v_user_id, v_total::int, v_section_scores);

  RETURN jsonb_build_object(
    'packet_id', p_packet_id,
    'total_score', v_total::int,
    'section_scores', v_section_scores,
    'bonus', v_bonus,
    'critical_gaps', v_critical_gaps
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.trigger_recalculate_health_score()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_packet_id uuid;
BEGIN
  v_packet_id := COALESCE(NEW.packet_id, OLD.packet_id);
  IF v_packet_id IS NOT NULL THEN
    PERFORM public.calculate_health_score(v_packet_id);
  END IF;
  RETURN NEW;
END;
$$;

DO $$
DECLARE
  tbl text;
  monitored text[] := ARRAY[
    'info_records','family_members','medical_records','medications',
    'banking_records','credit_cards','investment_records','advisor_records',
    'password_records','personal_property_records','funeral_records',
    'memories','legal_documents','documents'
  ];
  optional text[] := ARRAY['real_estate_records','retirement_records','vehicle_records','pet_records','private_items'];
BEGIN
  FOREACH tbl IN ARRAY monitored LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_health_score_%s ON public.%I', tbl, tbl);
    EXECUTE format(
      'CREATE TRIGGER trg_health_score_%s
        AFTER INSERT OR UPDATE OR DELETE ON public.%I
        FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_health_score()',
      tbl, tbl
    );
  END LOOP;

  FOREACH tbl IN ARRAY optional LOOP
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name=tbl) THEN
      EXECUTE format('DROP TRIGGER IF EXISTS trg_health_score_%s ON public.%I', tbl, tbl);
      EXECUTE format(
        'CREATE TRIGGER trg_health_score_%s
          AFTER INSERT OR UPDATE OR DELETE ON public.%I
          FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_health_score()',
        tbl, tbl
      );
    END IF;
  END LOOP;
END $$;

-- Backfill existing packets
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT id FROM packets LOOP
    PERFORM public.calculate_health_score(r.id);
  END LOOP;
END $$;