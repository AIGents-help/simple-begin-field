
-- Helper: create or get a pending check-in event with a fresh token for a user
CREATE OR REPLACE FUNCTION public.issue_checkin_token(p_user_id uuid, p_grace_days integer DEFAULT 7)
RETURNS TABLE(event_id uuid, token text, expires_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_token text;
  v_expires timestamptz;
  v_id uuid;
BEGIN
  v_token := encode(gen_random_bytes(32), 'hex');
  v_expires := now() + ((p_grace_days + 1) || ' days')::interval;

  INSERT INTO public.checkin_events (user_id, scheduled_at, sent_at, status, token, token_expires_at, reminder_count)
  VALUES (p_user_id, now(), now(), 'sent', v_token, v_expires, 0)
  RETURNING id INTO v_id;

  RETURN QUERY SELECT v_id, v_token, v_expires;
END;
$$;

-- Helper: mark event as triggered (grace expired)
CREATE OR REPLACE FUNCTION public.mark_checkin_triggered(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.checkin_events
     SET status = 'triggered', triggered_at = now()
   WHERE id = p_event_id;

  UPDATE public.profiles p
     SET checkin_status = 'triggered'
    FROM public.checkin_events e
   WHERE e.id = p_event_id
     AND p.id = e.user_id;
END;
$$;

-- Helper: increment reminder count
CREATE OR REPLACE FUNCTION public.bump_checkin_reminder(p_event_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.checkin_events
     SET reminder_count = reminder_count + 1,
         status = CASE WHEN status = 'sent' THEN 'sent' ELSE status END
   WHERE id = p_event_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_checkin_token(uuid, integer) TO service_role;
GRANT EXECUTE ON FUNCTION public.mark_checkin_triggered(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.bump_checkin_reminder(uuid) TO service_role;
