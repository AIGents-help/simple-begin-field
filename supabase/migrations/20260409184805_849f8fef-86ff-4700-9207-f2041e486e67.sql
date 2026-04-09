
-- =============================================
-- FIX 1: Prevent role self-escalation on profiles
-- =============================================

-- Create a helper function to get the user's current role
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS text
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$;

-- Drop the old policy and recreate with WITH CHECK that preserves the existing role for non-admins
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (
    -- Admins can change anything
    is_admin()
    OR (
      -- Non-admins can only update their own row AND cannot change their role
      auth.uid() = id
      AND role IS NOT DISTINCT FROM current_user_role()
    )
  );

-- =============================================
-- FIX 2: Fix storage policies with packet membership checks
-- =============================================

-- Helper function: check if user is member of packet based on storage path
-- Files are stored as: {packet_id}/...
CREATE OR REPLACE FUNCTION public.is_member_of_packet_in_path(file_path text)
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  path_packet_id uuid;
BEGIN
  -- Extract packet_id from the first path segment
  BEGIN
    path_packet_id := split_part(file_path, '/', 1)::uuid;
  EXCEPTION WHEN OTHERS THEN
    RETURN false;
  END;
  
  RETURN EXISTS (
    SELECT 1 FROM public.packet_members
    WHERE packet_id = path_packet_id
    AND user_id = auth.uid()
  );
END;
$$;

-- Drop all existing storage policies for packet-documents
DROP POLICY IF EXISTS "Allow authenticated uploads to packet-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from packet-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to packet-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from packet-documents" ON storage.objects;
DROP POLICY IF EXISTS "packet_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "packet_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "packet_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "packet_documents_delete" ON storage.objects;

-- Drop all existing storage policies for packet-private-documents
DROP POLICY IF EXISTS "Allow authenticated uploads to packet-private-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated reads from packet-private-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated updates to packet-private-documents" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated deletes from packet-private-documents" ON storage.objects;
DROP POLICY IF EXISTS "packet_private_documents_select" ON storage.objects;
DROP POLICY IF EXISTS "packet_private_documents_insert" ON storage.objects;
DROP POLICY IF EXISTS "packet_private_documents_update" ON storage.objects;
DROP POLICY IF EXISTS "packet_private_documents_delete" ON storage.objects;

-- New policies for packet-documents with ownership check
CREATE POLICY "packet_documents_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'packet-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_documents_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'packet-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_documents_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'packet-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_documents_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'packet-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

-- New policies for packet-private-documents with ownership check
CREATE POLICY "packet_private_documents_select" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'packet-private-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_private_documents_insert" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'packet-private-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_private_documents_update" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'packet-private-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

CREATE POLICY "packet_private_documents_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'packet-private-documents'
    AND (public.is_member_of_packet_in_path(name) OR public.is_admin())
  );

-- =============================================
-- FIX 3: Fix referral codes PII exposure
-- =============================================

-- Drop the overly permissive public policy
DROP POLICY IF EXISTS "Public can validate active codes" ON public.referral_codes;

-- Create a SECURITY DEFINER RPC that returns only safe fields
CREATE OR REPLACE FUNCTION public.validate_referral_code(code_input text)
RETURNS TABLE(is_valid boolean, brand_color text, logo_url text, professional_name text)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    true AS is_valid,
    rc.brand_color,
    rc.logo_url,
    rc.professional_name
  FROM public.referral_codes rc
  WHERE rc.code = code_input
  AND rc.is_active = true
  LIMIT 1;
  
  -- If no rows returned, return a single row with is_valid = false
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, NULL::text, NULL::text, NULL::text;
  END IF;
END;
$$;

-- Grant execute to anon and authenticated roles
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO anon;
GRANT EXECUTE ON FUNCTION public.validate_referral_code(text) TO authenticated;
