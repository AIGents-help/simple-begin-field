-- ============================================================
-- Inactivity Check-in System — Phase 1
-- ============================================================

-- 1. checkin_settings table -----------------------------------
CREATE TABLE public.checkin_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  is_enabled boolean NOT NULL DEFAULT false,
  frequency_days integer NOT NULL DEFAULT 30,
  grace_period_days integer NOT NULL DEFAULT 7,
  checkin_method text NOT NULL DEFAULT 'email', -- email | email_sms
  release_behavior text NOT NULL DEFAULT 'notify_only', -- notify_only | release_access | release_and_pdf
  is_paused boolean NOT NULL DEFAULT false,
  pause_until timestamptz,
  selected_contact_ids uuid[] DEFAULT ARRAY[]::uuid[], -- subset of trusted_contacts.id to notify
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_settings_user ON public.checkin_settings(user_id);

ALTER TABLE public.checkin_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkin_settings"
  ON public.checkin_settings FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users insert own checkin_settings"
  ON public.checkin_settings FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users update own checkin_settings"
  ON public.checkin_settings FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users delete own checkin_settings"
  ON public.checkin_settings FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE TRIGGER update_checkin_settings_updated_at
  BEFORE UPDATE ON public.checkin_settings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Validation trigger for enums
CREATE OR REPLACE FUNCTION public.validate_checkin_settings()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.checkin_method NOT IN ('email','email_sms') THEN
    RAISE EXCEPTION 'Invalid checkin_method: %', NEW.checkin_method;
  END IF;
  IF NEW.release_behavior NOT IN ('notify_only','release_access','release_and_pdf') THEN
    RAISE EXCEPTION 'Invalid release_behavior: %', NEW.release_behavior;
  END IF;
  IF NEW.frequency_days < 1 OR NEW.frequency_days > 730 THEN
    RAISE EXCEPTION 'frequency_days must be between 1 and 730';
  END IF;
  IF NEW.grace_period_days < 1 OR NEW.grace_period_days > 90 THEN
    RAISE EXCEPTION 'grace_period_days must be between 1 and 90';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_checkin_settings_trg
  BEFORE INSERT OR UPDATE ON public.checkin_settings
  FOR EACH ROW EXECUTE FUNCTION public.validate_checkin_settings();

-- 2. checkin_events table -------------------------------------
CREATE TABLE public.checkin_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  scheduled_at timestamptz NOT NULL DEFAULT now(),
  sent_at timestamptz,
  checked_in_at timestamptz,
  token text UNIQUE,
  token_expires_at timestamptz,
  status text NOT NULL DEFAULT 'scheduled', -- scheduled | sent | completed | missed | grace | triggered
  reminder_count integer NOT NULL DEFAULT 0,
  triggered_at timestamptz,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_checkin_events_user ON public.checkin_events(user_id, created_at DESC);
CREATE INDEX idx_checkin_events_status ON public.checkin_events(status);
CREATE INDEX idx_checkin_events_token ON public.checkin_events(token) WHERE token IS NOT NULL;

ALTER TABLE public.checkin_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own checkin_events"
  ON public.checkin_events FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

-- Only admins can manually insert/update/delete via API.
-- The system (service role) bypasses RLS, edge functions handle writes.
CREATE POLICY "Admins manage checkin_events insert"
  ON public.checkin_events FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins manage checkin_events update"
  ON public.checkin_events FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins manage checkin_events delete"
  ON public.checkin_events FOR DELETE
  USING (is_admin());

-- Validation trigger for status enum
CREATE OR REPLACE FUNCTION public.validate_checkin_event_status()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.status NOT IN ('scheduled','sent','completed','missed','grace','triggered') THEN
    RAISE EXCEPTION 'Invalid checkin_event status: %', NEW.status;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_checkin_event_status_trg
  BEFORE INSERT OR UPDATE ON public.checkin_events
  FOR EACH ROW EXECUTE FUNCTION public.validate_checkin_event_status();

-- 3. profiles columns -----------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_checkin_at timestamptz,
  ADD COLUMN IF NOT EXISTS checkin_status text DEFAULT 'inactive'; -- inactive | active | overdue | grace | paused | triggered

-- 4. RPCs for owner-side actions ------------------------------

-- Manual "Check In Now" — owner clicks button while logged in
CREATE OR REPLACE FUNCTION public.manual_check_in()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid := auth.uid();
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Insert a completed event
  INSERT INTO public.checkin_events (user_id, status, sent_at, checked_in_at)
  VALUES (v_user_id, 'completed', now(), now());

  -- Update profile
  UPDATE public.profiles
  SET last_checkin_at = now(),
      checkin_status = 'active'
  WHERE id = v_user_id;
END;
$$;

-- Token-based check-in (called from edge function, no auth required)
CREATE OR REPLACE FUNCTION public.complete_checkin_by_token(p_token text)
RETURNS TABLE(success boolean, user_id uuid, next_due timestamptz, message text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_event public.checkin_events%ROWTYPE;
  v_settings public.checkin_settings%ROWTYPE;
  v_next timestamptz;
BEGIN
  SELECT * INTO v_event FROM public.checkin_events WHERE token = p_token;

  IF v_event.id IS NULL THEN
    RETURN QUERY SELECT false, NULL::uuid, NULL::timestamptz, 'Invalid token'::text;
    RETURN;
  END IF;

  IF v_event.token_expires_at IS NOT NULL AND v_event.token_expires_at < now() THEN
    RETURN QUERY SELECT false, v_event.user_id, NULL::timestamptz, 'Token expired'::text;
    RETURN;
  END IF;

  IF v_event.checked_in_at IS NOT NULL THEN
    RETURN QUERY SELECT true, v_event.user_id, NULL::timestamptz, 'Already checked in'::text;
    RETURN;
  END IF;

  -- Mark event as completed and invalidate token
  UPDATE public.checkin_events
  SET checked_in_at = now(),
      status = 'completed',
      token = NULL
  WHERE id = v_event.id;

  -- Update profile
  UPDATE public.profiles
  SET last_checkin_at = now(),
      checkin_status = 'active'
  WHERE id = v_event.user_id;

  -- Compute next due date
  SELECT * INTO v_settings FROM public.checkin_settings WHERE user_id = v_event.user_id;
  IF v_settings.id IS NOT NULL THEN
    v_next := now() + (v_settings.frequency_days || ' days')::interval;
  END IF;

  RETURN QUERY SELECT true, v_event.user_id, v_next, 'Checked in successfully'::text;
END;
$$;

-- Helper to compute next due date for the UI
CREATE OR REPLACE FUNCTION public.get_checkin_status(p_user_id uuid)
RETURNS TABLE(last_checkin_at timestamptz, next_due_at timestamptz, status text)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_settings public.checkin_settings%ROWTYPE;
  v_profile public.profiles%ROWTYPE;
  v_next timestamptz;
  v_status text;
BEGIN
  SELECT * INTO v_settings FROM public.checkin_settings WHERE user_id = p_user_id;
  SELECT * INTO v_profile FROM public.profiles WHERE id = p_user_id;

  IF v_settings.id IS NULL OR v_settings.is_enabled = false THEN
    RETURN QUERY SELECT v_profile.last_checkin_at, NULL::timestamptz, 'inactive'::text;
    RETURN;
  END IF;

  IF v_settings.is_paused
     AND (v_settings.pause_until IS NULL OR v_settings.pause_until > now()) THEN
    RETURN QUERY SELECT v_profile.last_checkin_at, v_settings.pause_until, 'paused'::text;
    RETURN;
  END IF;

  IF v_profile.last_checkin_at IS NULL THEN
    v_next := now();
  ELSE
    v_next := v_profile.last_checkin_at + (v_settings.frequency_days || ' days')::interval;
  END IF;

  IF v_next > now() THEN
    v_status := 'active';
  ELSIF v_next + (v_settings.grace_period_days || ' days')::interval > now() THEN
    v_status := 'grace';
  ELSE
    v_status := 'triggered';
  END IF;

  RETURN QUERY SELECT v_profile.last_checkin_at, v_next, v_status;
END;
$$;