-- 1. Extend trusted_contacts table
ALTER TABLE public.trusted_contacts
  ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS invite_token text UNIQUE,
  ADD COLUMN IF NOT EXISTS invite_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS invite_accepted_at timestamptz,
  ADD COLUMN IF NOT EXISTS access_released boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS access_released_at timestamptz,
  ADD COLUMN IF NOT EXISTS release_method text NOT NULL DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS inactivity_days integer;

-- Validate release_method values
CREATE OR REPLACE FUNCTION public.validate_trusted_contact_release_method()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.release_method IS NOT NULL AND NEW.release_method NOT IN ('manual','inactivity','immediate') THEN
    RAISE EXCEPTION 'Invalid release_method: %', NEW.release_method;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_trusted_contact_release_method ON public.trusted_contacts;
CREATE TRIGGER trg_validate_trusted_contact_release_method
  BEFORE INSERT OR UPDATE ON public.trusted_contacts
  FOR EACH ROW EXECUTE FUNCTION public.validate_trusted_contact_release_method();

CREATE INDEX IF NOT EXISTS idx_trusted_contacts_user_id ON public.trusted_contacts(user_id);
CREATE INDEX IF NOT EXISTS idx_trusted_contacts_invite_token ON public.trusted_contacts(invite_token);

-- 2. trusted_contact_permissions table
CREATE TABLE IF NOT EXISTS public.trusted_contact_permissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trusted_contact_id uuid NOT NULL REFERENCES public.trusted_contacts(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  is_permitted boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (trusted_contact_id, section_key)
);

CREATE INDEX IF NOT EXISTS idx_tcp_packet_id ON public.trusted_contact_permissions(packet_id);
CREATE INDEX IF NOT EXISTS idx_tcp_trusted_contact_id ON public.trusted_contact_permissions(trusted_contact_id);

ALTER TABLE public.trusted_contact_permissions ENABLE ROW LEVEL SECURITY;

DROP TRIGGER IF EXISTS trg_tcp_updated_at ON public.trusted_contact_permissions;
CREATE TRIGGER trg_tcp_updated_at
  BEFORE UPDATE ON public.trusted_contact_permissions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Owners/admins can manage permissions for their packet
CREATE POLICY "Packet members can view permissions"
  ON public.trusted_contact_permissions FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Packet members can insert permissions"
  ON public.trusted_contact_permissions FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Packet members can update permissions"
  ON public.trusted_contact_permissions FOR UPDATE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Packet members can delete permissions"
  ON public.trusted_contact_permissions FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

-- Trusted contacts can view their own permissions
CREATE POLICY "Trusted contacts view own permissions"
  ON public.trusted_contact_permissions FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.id = trusted_contact_permissions.trusted_contact_id
        AND tc.user_id = auth.uid()
    )
  );

-- 3. trusted_contact_access_log table
CREATE TABLE IF NOT EXISTS public.trusted_contact_access_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  trusted_contact_id uuid REFERENCES public.trusted_contacts(id) ON DELETE SET NULL,
  trusted_contact_user_id uuid,
  section_key text,
  action text NOT NULL DEFAULT 'view',
  metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tcal_packet_id ON public.trusted_contact_access_log(packet_id);
CREATE INDEX IF NOT EXISTS idx_tcal_trusted_contact_id ON public.trusted_contact_access_log(trusted_contact_id);
CREATE INDEX IF NOT EXISTS idx_tcal_created_at ON public.trusted_contact_access_log(created_at DESC);

ALTER TABLE public.trusted_contact_access_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Packet members and admins can view access log"
  ON public.trusted_contact_access_log FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Trusted contacts can insert own access log"
  ON public.trusted_contact_access_log FOR INSERT
  WITH CHECK (
    trusted_contact_user_id = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.trusted_contacts tc
      WHERE tc.id = trusted_contact_access_log.trusted_contact_id
        AND tc.user_id = auth.uid()
        AND tc.packet_id = trusted_contact_access_log.packet_id
        AND tc.access_released = true
    )
  );

-- 4. Helper function for Phase 2 RLS
CREATE OR REPLACE FUNCTION public.has_trusted_access(p_packet_id uuid, p_section_key text)
RETURNS boolean
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1
    FROM public.trusted_contacts tc
    JOIN public.trusted_contact_permissions tcp
      ON tcp.trusted_contact_id = tc.id
    WHERE tc.user_id = auth.uid()
      AND tc.packet_id = p_packet_id
      AND tc.access_released = true
      AND tcp.section_key = p_section_key
      AND tcp.is_permitted = true
  );
END;
$$;