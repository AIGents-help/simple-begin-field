
-- Create public bucket for general packet documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('packet-documents', 'packet-documents', false);

-- Create private bucket for sensitive documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('packet-private-documents', 'packet-private-documents', false);

-- RLS policies for packet-documents bucket
-- Allow authenticated users to upload files to their packet's folder
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'packet-documents');

CREATE POLICY "Users can view their packet documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'packet-documents');

CREATE POLICY "Users can update their packet documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'packet-documents');

CREATE POLICY "Users can delete their packet documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'packet-documents');

-- RLS policies for packet-private-documents bucket
CREATE POLICY "Authenticated users can upload private documents"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'packet-private-documents');

CREATE POLICY "Users can view their private documents"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'packet-private-documents');

CREATE POLICY "Users can update their private documents"
ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id = 'packet-private-documents');

CREATE POLICY "Users can delete their private documents"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'packet-private-documents');
