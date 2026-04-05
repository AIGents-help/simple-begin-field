
-- Fix search_path on security definer functions
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_professional()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'professional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

CREATE OR REPLACE FUNCTION is_packet_member(p_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.packet_members
    WHERE packet_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Fix security definer view by recreating with security_invoker
DROP VIEW IF EXISTS section_records;
CREATE VIEW section_records WITH (security_invoker = true) AS
SELECT id, packet_id, 'family' as section_key, name as title, relationship as description, created_at FROM family_members
UNION ALL
SELECT id, packet_id, 'real-estate' as section_key, property_label as title, address as description, created_at FROM real_estate_records
UNION ALL
SELECT id, packet_id, 'banking' as section_key, institution as title, account_type as description, created_at FROM banking_records
UNION ALL
SELECT id, packet_id, 'retirement' as section_key, institution as title, account_type as description, created_at FROM retirement_records
UNION ALL
SELECT id, packet_id, 'vehicles' as section_key, (year || ' ' || make || ' ' || model) as title, license_plate as description, created_at FROM vehicle_records
UNION ALL
SELECT id, packet_id, 'advisors' as section_key, name as title, advisor_type as description, created_at FROM advisor_records
UNION ALL
SELECT id, packet_id, 'passwords' as section_key, service_name as title, username as description, created_at FROM password_records
UNION ALL
SELECT id, packet_id, 'property' as section_key, item_name as title, description as description, created_at FROM personal_property_records
UNION ALL
SELECT id, packet_id, 'pets' as section_key, pet_name as title, species_breed as description, created_at FROM pet_records
UNION ALL
SELECT id, packet_id, 'funeral' as section_key, funeral_home as title, burial_or_cremation as description, created_at FROM funeral_records
UNION ALL
SELECT id, packet_id, 'private' as section_key, title as title, description as description, created_at FROM private_items
UNION ALL
SELECT id, packet_id, 'info' as section_key, title as title, notes as description, created_at FROM info_records
UNION ALL
SELECT id, packet_id, 'medical' as section_key, provider_name as title, specialty as description, created_at FROM medical_records;
