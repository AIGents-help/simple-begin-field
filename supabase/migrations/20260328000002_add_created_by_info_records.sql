-- Migration: Add created_by to info_records
ALTER TABLE public.info_records ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES auth.users(id);

-- Update RLS policies to ensure created_by is handled if needed
-- (The existing is_packet_member policies are already broad enough)
