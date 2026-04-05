-- Migration: Add info_records table and update section_records view
-- This table stores metadata for general information records (e.g., Wills, Passports)

-- 1. Create info_records table
CREATE TABLE IF NOT EXISTS public.info_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    category TEXT NOT NULL,
    title TEXT NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Update section_records view to include info_records
CREATE OR REPLACE VIEW public.section_records AS
SELECT id, packet_id, 'family' as section_key, name as title, relationship as description, created_at FROM public.family_members
UNION ALL
SELECT id, packet_id, 'real-estate' as section_key, property_label as title, address as description, created_at FROM public.real_estate_records
UNION ALL
SELECT id, packet_id, 'banking' as section_key, institution as title, account_type as description, created_at FROM public.banking_records
UNION ALL
SELECT id, packet_id, 'retirement' as section_key, institution as title, account_type as description, created_at FROM public.retirement_records
UNION ALL
SELECT id, packet_id, 'vehicles' as section_key, (year || ' ' || make || ' ' || model) as title, license_plate as description, created_at FROM public.vehicle_records
UNION ALL
SELECT id, packet_id, 'advisors' as section_key, name as title, advisor_type as description, created_at FROM public.advisor_records
UNION ALL
SELECT id, packet_id, 'passwords' as section_key, service_name as title, username as description, created_at FROM public.password_records
UNION ALL
SELECT id, packet_id, 'property' as section_key, item_name as title, description as description, created_at FROM public.personal_property_records
UNION ALL
SELECT id, packet_id, 'pets' as section_key, pet_name as title, species_breed as description, created_at FROM public.pet_records
UNION ALL
SELECT id, packet_id, 'funeral' as section_key, funeral_home as title, burial_or_cremation as description, created_at FROM public.funeral_records
UNION ALL
SELECT id, packet_id, 'private' as section_key, title as title, description as description, created_at FROM public.private_items
UNION ALL
SELECT id, packet_id, 'info' as section_key, title as title, notes as description, created_at FROM public.info_records;

-- 3. Enable RLS and add policies
ALTER TABLE public.info_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view info_records" ON public.info_records
    FOR SELECT USING (is_packet_member(packet_id));

CREATE POLICY "Members can insert info_records" ON public.info_records
    FOR INSERT WITH CHECK (is_packet_member(packet_id));

CREATE POLICY "Members can update info_records" ON public.info_records
    FOR UPDATE USING (is_packet_member(packet_id));

CREATE POLICY "Members can delete info_records" ON public.info_records
    FOR DELETE USING (is_packet_member(packet_id));

-- 4. Add updated_at trigger
CREATE TRIGGER update_info_records_updated_at 
    BEFORE UPDATE ON public.info_records 
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
