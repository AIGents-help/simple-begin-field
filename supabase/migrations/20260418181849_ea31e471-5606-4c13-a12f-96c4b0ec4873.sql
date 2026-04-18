-- Enable pgcrypto for hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- emergency_tokens
-- ============================================================
CREATE TABLE public.emergency_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  token uuid NOT NULL UNIQUE DEFAULT gen_random_uuid(),
  pin_hash text NOT NULL,
  pin_hint text,
  is_active boolean NOT NULL DEFAULT true,
  visible_sections jsonb NOT NULL DEFAULT '{
    "blood_type": true,
    "allergies": true,
    "medications": true,
    "medical_conditions": true,
    "dnr_status": true,
    "organ_donor": true,
    "emergency_contacts": true,
    "doctor": true,
    "insurance": true,
    "custom_field": true
  }'::jsonb,
  custom_field_text text,
  failed_attempts int NOT NULL DEFAULT 0,
  locked_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  regenerated_at timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

CREATE INDEX idx_emergency_tokens_token ON public.emergency_tokens(token);
CREATE INDEX idx_emergency_tokens_user ON public.emergency_tokens(user_id);

ALTER TABLE public.emergency_tokens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their emergency token"
  ON public.emergency_tokens FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Owners can insert their emergency token"
  ON public.emergency_tokens FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can update their emergency token"
  ON public.emergency_tokens FOR UPDATE
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owners can delete their emergency token"
  ON public.emergency_tokens FOR DELETE
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all emergency tokens"
  ON public.emergency_tokens FOR SELECT
  USING (public.is_admin());

CREATE TRIGGER update_emergency_tokens_updated_at
BEFORE UPDATE ON public.emergency_tokens
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================================
-- emergency_access_log
-- ============================================================
CREATE TABLE public.emergency_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  token_id uuid NOT NULL REFERENCES public.emergency_tokens(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  accessed_at timestamptz NOT NULL DEFAULT now(),
  device_type text,
  browser text,
  ip_address text,
  city text,
  region text,
  country text,
  pin_correct boolean NOT NULL DEFAULT false,
  sections_viewed jsonb,
  user_agent text
);

CREATE INDEX idx_emergency_access_log_token ON public.emergency_access_log(token_id);
CREATE INDEX idx_emergency_access_log_user ON public.emergency_access_log(user_id);
CREATE INDEX idx_emergency_access_log_accessed_at ON public.emergency_access_log(accessed_at DESC);

ALTER TABLE public.emergency_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view their access log"
  ON public.emergency_access_log FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Admins can view all access logs"
  ON public.emergency_access_log FOR SELECT
  USING (public.is_admin());

-- Service role / edge function inserts only (no anon insert policy)
CREATE POLICY "Service role can insert access log"
  ON public.emergency_access_log FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- Helper: hash a PIN (uses bcrypt via pgcrypto)
-- ============================================================
CREATE OR REPLACE FUNCTION public.hash_emergency_pin(p_pin text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
BEGIN
  RETURN crypt(p_pin, gen_salt('bf', 8));
END;
$$;

-- ============================================================
-- Set/update PIN (called by owner)
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_emergency_pin(p_pin text, p_hint text DEFAULT NULL)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_packet_id uuid;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;
  IF p_pin IS NULL OR length(p_pin) < 4 OR length(p_pin) > 6 OR p_pin !~ '^[0-9]+$' THEN
    RAISE EXCEPTION 'PIN must be 4-6 digits';
  END IF;

  SELECT id INTO v_packet_id FROM public.packets
  WHERE owner_user_id = v_user_id LIMIT 1;
  IF v_packet_id IS NULL THEN
    RAISE EXCEPTION 'No packet found for user';
  END IF;

  INSERT INTO public.emergency_tokens (user_id, packet_id, pin_hash, pin_hint)
  VALUES (v_user_id, v_packet_id, crypt(p_pin, gen_salt('bf', 8)), p_hint)
  ON CONFLICT (user_id) DO UPDATE
    SET pin_hash = crypt(p_pin, gen_salt('bf', 8)),
        pin_hint = p_hint,
        failed_attempts = 0,
        locked_until = NULL,
        updated_at = now();
END;
$$;

-- ============================================================
-- Regenerate token (invalidates printed cards)
-- ============================================================
CREATE OR REPLACE FUNCTION public.regenerate_emergency_token()
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid := auth.uid();
  v_new_token uuid := gen_random_uuid();
BEGIN
  IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  UPDATE public.emergency_tokens
  SET token = v_new_token,
      regenerated_at = now(),
      updated_at = now()
  WHERE user_id = v_user_id;
  RETURN v_new_token;
END;
$$;

-- ============================================================
-- Public: get the PIN hint for a token (no PIN, no data)
-- ============================================================
CREATE OR REPLACE FUNCTION public.get_emergency_pin_hint(p_token uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row record;
  v_first_name text;
BEGIN
  SELECT et.pin_hint, et.is_active, et.locked_until, p.full_name
  INTO v_row
  FROM public.emergency_tokens et
  JOIN public.profiles p ON p.id = et.user_id
  WHERE et.token = p_token;

  IF NOT FOUND OR NOT v_row.is_active THEN
    RETURN jsonb_build_object('valid', false);
  END IF;

  v_first_name := split_part(coalesce(v_row.full_name, ''), ' ', 1);
  RETURN jsonb_build_object(
    'valid', true,
    'first_name', v_first_name,
    'hint', v_row.pin_hint,
    'locked', (v_row.locked_until IS NOT NULL AND v_row.locked_until > now()),
    'locked_until', v_row.locked_until
  );
END;
$$;

-- ============================================================
-- Verify PIN and return emergency info
-- ============================================================
CREATE OR REPLACE FUNCTION public.verify_emergency_pin(
  p_token uuid,
  p_pin text,
  p_device_type text DEFAULT NULL,
  p_browser text DEFAULT NULL,
  p_ip text DEFAULT NULL,
  p_city text DEFAULT NULL,
  p_region text DEFAULT NULL,
  p_country text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  v_token_row public.emergency_tokens%ROWTYPE;
  v_match boolean;
  v_packet record;
  v_first_name text;
  v_full_name text;
  v_visible jsonb;
  v_data jsonb := '{}'::jsonb;
  v_meds jsonb;
  v_med_records jsonb;
  v_emergency_contacts jsonb;
  v_doctor jsonb;
  v_insurance jsonb;
BEGIN
  SELECT * INTO v_token_row FROM public.emergency_tokens WHERE token = p_token;
  IF NOT FOUND OR NOT v_token_row.is_active THEN
    RETURN jsonb_build_object('success', false, 'error', 'invalid_token');
  END IF;

  -- Lockout check
  IF v_token_row.locked_until IS NOT NULL AND v_token_row.locked_until > now() THEN
    INSERT INTO public.emergency_access_log (token_id, user_id, pin_correct, device_type, browser, ip_address, city, region, country, user_agent)
    VALUES (v_token_row.id, v_token_row.user_id, false, p_device_type, p_browser, p_ip, p_city, p_region, p_country, p_user_agent);
    RETURN jsonb_build_object('success', false, 'error', 'locked', 'locked_until', v_token_row.locked_until);
  END IF;

  v_match := (v_token_row.pin_hash = crypt(p_pin, v_token_row.pin_hash));

  IF NOT v_match THEN
    UPDATE public.emergency_tokens
    SET failed_attempts = failed_attempts + 1,
        locked_until = CASE WHEN failed_attempts + 1 >= 5 THEN now() + interval '15 minutes' ELSE locked_until END,
        updated_at = now()
    WHERE id = v_token_row.id;
    INSERT INTO public.emergency_access_log (token_id, user_id, pin_correct, device_type, browser, ip_address, city, region, country, user_agent)
    VALUES (v_token_row.id, v_token_row.user_id, false, p_device_type, p_browser, p_ip, p_city, p_region, p_country, p_user_agent);
    RETURN jsonb_build_object('success', false, 'error', 'wrong_pin', 'attempts_remaining', greatest(0, 5 - (v_token_row.failed_attempts + 1)));
  END IF;

  -- Reset attempts
  UPDATE public.emergency_tokens
  SET failed_attempts = 0, locked_until = NULL, updated_at = now()
  WHERE id = v_token_row.id;

  -- Look up profile + packet
  SELECT p.full_name INTO v_full_name FROM public.profiles p WHERE p.id = v_token_row.user_id;
  v_first_name := split_part(coalesce(v_full_name, ''), ' ', 1);

  v_visible := v_token_row.visible_sections;

  -- Medical info aggregated from medical_records
  IF coalesce((v_visible->>'medications')::boolean, true) THEN
    SELECT jsonb_agg(jsonb_build_object(
      'name', m.name,
      'dose', m.dose,
      'frequency', m.frequency
    )) INTO v_meds
    FROM public.medications m
    WHERE m.packet_id = v_token_row.packet_id;
  END IF;

  SELECT jsonb_agg(jsonb_build_object(
    'blood_type', mr.blood_type,
    'allergies', mr.allergies,
    'conditions', mr.conditions,
    'dnr_status', mr.dnr_status,
    'organ_donor', mr.organ_donor,
    'insurance_provider', mr.insurance_provider,
    'insurance_member_id', mr.insurance_member_id,
    'insurance_group_number', mr.insurance_group_number,
    'insurance_phone', mr.insurance_phone,
    'provider_name', mr.provider_name,
    'phone', mr.phone
  )) INTO v_med_records
  FROM public.medical_records mr
  WHERE mr.packet_id = v_token_row.packet_id;

  -- Emergency contacts: family members marked as emergency
  IF coalesce((v_visible->>'emergency_contacts')::boolean, true) THEN
    SELECT jsonb_agg(jsonb_build_object(
      'name', f.name,
      'relationship', f.relationship,
      'phone', f.phone
    ) ORDER BY f.created_at) INTO v_emergency_contacts
    FROM public.family_members f
    WHERE f.packet_id = v_token_row.packet_id
      AND f.phone IS NOT NULL
    LIMIT 4;
  END IF;

  v_data := jsonb_build_object(
    'first_name', v_first_name,
    'visible_sections', v_visible,
    'medical_records', coalesce(v_med_records, '[]'::jsonb),
    'medications', coalesce(v_meds, '[]'::jsonb),
    'emergency_contacts', coalesce(v_emergency_contacts, '[]'::jsonb),
    'custom_field', CASE WHEN coalesce((v_visible->>'custom_field')::boolean, true) THEN v_token_row.custom_field_text ELSE NULL END
  );

  -- Log success
  INSERT INTO public.emergency_access_log (token_id, user_id, pin_correct, device_type, browser, ip_address, city, region, country, user_agent, sections_viewed)
  VALUES (v_token_row.id, v_token_row.user_id, true, p_device_type, p_browser, p_ip, p_city, p_region, p_country, p_user_agent, v_visible);

  RETURN jsonb_build_object('success', true, 'data', v_data);
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_emergency_pin_hint(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.verify_emergency_pin(uuid, text, text, text, text, text, text, text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_emergency_pin(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.regenerate_emergency_token() TO authenticated;