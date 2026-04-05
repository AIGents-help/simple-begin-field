-- Migration: Create storage buckets for documents
-- This script ensures the required buckets exist in Supabase Storage

INSERT INTO storage.buckets (id, name, public)
VALUES ('packet-documents', 'packet-documents', false)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public)
VALUES ('packet-private-documents', 'packet-private-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Add RLS policies for buckets (simplified for this environment)
-- In a production environment, you would restrict these further based on packet membership
CREATE POLICY "Authenticated users can upload to packet-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'packet-documents');

CREATE POLICY "Authenticated users can view their own packet-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'packet-documents');

CREATE POLICY "Authenticated users can upload to packet-private-documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'packet-private-documents');

CREATE POLICY "Authenticated users can view their own packet-private-documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'packet-private-documents');
