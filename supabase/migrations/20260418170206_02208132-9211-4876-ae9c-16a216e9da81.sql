CREATE TABLE public.packet_download_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  packet_id UUID NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  downloaded_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  downloader_email TEXT,
  downloader_role TEXT NOT NULL DEFAULT 'owner',
  sections_included TEXT[] NOT NULL DEFAULT '{}',
  include_sensitive BOOLEAN NOT NULL DEFAULT false,
  format_option TEXT NOT NULL DEFAULT 'full',
  download_type TEXT NOT NULL DEFAULT 'full_packet',
  file_name TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_packet_download_history_packet ON public.packet_download_history(packet_id, created_at DESC);
CREATE INDEX idx_packet_download_history_user ON public.packet_download_history(downloaded_by, created_at DESC);

ALTER TABLE public.packet_download_history ENABLE ROW LEVEL SECURITY;

-- Packet members (owner + couple partners) can view history for their packet
CREATE POLICY "Packet members view download history"
ON public.packet_download_history
FOR SELECT
USING (public.is_packet_member(packet_id));

-- Admins view everything
CREATE POLICY "Admins view all download history"
ON public.packet_download_history
FOR SELECT
USING (public.is_admin());

-- Authenticated users can insert their own download attribution
CREATE POLICY "Authenticated users can insert own download record"
ON public.packet_download_history
FOR INSERT
WITH CHECK (auth.uid() = downloaded_by OR public.is_admin());