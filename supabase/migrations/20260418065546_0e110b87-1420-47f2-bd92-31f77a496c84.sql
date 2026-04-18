
-- Phase 3: Inactivity tracking + access log enrichment

-- Add last_login_at column to profiles (if missing) for inactivity tracking
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone DEFAULT now();

-- Index to make the inactivity sweep fast
CREATE INDEX IF NOT EXISTS idx_profiles_last_login_at ON public.profiles(last_login_at);

-- Helper: SECURITY DEFINER RPC the client can call on each app load to bump last_login_at
CREATE OR REPLACE FUNCTION public.touch_last_login()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET last_login_at = now()
  WHERE id = auth.uid();
END;
$$;

GRANT EXECUTE ON FUNCTION public.touch_last_login() TO authenticated;

-- Inactivity auto-release function: releases packets where the owner has been inactive
-- past their configured threshold for any given trusted contact set to 'inactivity' method.
CREATE OR REPLACE FUNCTION public.run_inactivity_release_sweep()
RETURNS TABLE(released_contact_id uuid, owner_id uuid, packet_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  WITH eligible AS (
    SELECT tc.id AS contact_id, tc.user_id AS owner_id, tc.packet_id
    FROM public.trusted_contacts tc
    JOIN public.profiles p ON p.id = tc.user_id
    WHERE tc.release_method = 'inactivity'
      AND tc.access_released = false
      AND tc.inactivity_days IS NOT NULL
      AND p.last_login_at IS NOT NULL
      AND p.last_login_at < (now() - (tc.inactivity_days || ' days')::interval)
  ),
  upd AS (
    UPDATE public.trusted_contacts t
    SET access_released = true,
        access_released_at = now(),
        updated_at = now()
    FROM eligible e
    WHERE t.id = e.contact_id
    RETURNING t.id, e.owner_id, t.packet_id
  )
  SELECT id, owner_id, packet_id FROM upd;
END;
$$;

-- Only admins / service role should run the sweep manually
REVOKE ALL ON FUNCTION public.run_inactivity_release_sweep() FROM public;
GRANT EXECUTE ON FUNCTION public.run_inactivity_release_sweep() TO service_role;

-- Owner-side access log read policy already exists via has_trusted_access function family;
-- ensure owners can read their own packet's access log:
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'trusted_contact_access_log'
      AND policyname = 'Owners can view their access log'
  ) THEN
    CREATE POLICY "Owners can view their access log"
      ON public.trusted_contact_access_log
      FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.packets
          WHERE packets.id = trusted_contact_access_log.packet_id
            AND packets.owner_user_id = auth.uid()
        ) OR is_admin()
      );
  END IF;
END$$;
