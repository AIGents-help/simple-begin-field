-- Funeral photos table
CREATE TABLE IF NOT EXISTS public.funeral_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_record_id uuid NOT NULL REFERENCES public.funeral_records(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  is_hero boolean DEFAULT false,
  uploaded_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_funeral_photos_record ON public.funeral_photos(funeral_record_id);
CREATE INDEX IF NOT EXISTS idx_funeral_photos_packet ON public.funeral_photos(packet_id);

ALTER TABLE public.funeral_photos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view funeral photos"
  ON public.funeral_photos FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE POLICY "Members can insert funeral photos"
  ON public.funeral_photos FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id));

CREATE POLICY "Members can update funeral photos"
  ON public.funeral_photos FOR UPDATE
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can delete funeral photos"
  ON public.funeral_photos FOR DELETE
  USING (public.is_packet_member(packet_id) OR public.is_admin());

CREATE TRIGGER funeral_photos_updated_at
  BEFORE UPDATE ON public.funeral_photos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();