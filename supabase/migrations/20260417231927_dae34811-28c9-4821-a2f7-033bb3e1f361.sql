-- Ensure shared updated_at function exists FIRST
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- =========================================================
-- MEMORIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.memories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared',
  entry_type text NOT NULL,
  title text,
  recipient text,
  content text,
  date_written date,
  delivery_instructions text,
  media_path text,
  media_mime text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view memories" ON public.memories
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert memories" ON public.memories
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update memories" ON public.memories
  FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete memories" ON public.memories
  FOR DELETE USING (is_packet_member(packet_id) OR is_admin());
CREATE TRIGGER memories_set_updated_at BEFORE UPDATE ON public.memories
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE INDEX IF NOT EXISTS idx_memories_packet ON public.memories(packet_id);

CREATE TABLE IF NOT EXISTS public.memory_album_photos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  file_path text NOT NULL,
  caption text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_album_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view album photos" ON public.memory_album_photos
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members insert album photos" ON public.memory_album_photos
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members update album photos" ON public.memory_album_photos
  FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members delete album photos" ON public.memory_album_photos
  FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE TABLE IF NOT EXISTS public.memory_bucket_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  memory_id uuid NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  item_text text NOT NULL,
  completed boolean DEFAULT false,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.memory_bucket_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view bucket items" ON public.memory_bucket_items
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members insert bucket items" ON public.memory_bucket_items
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members update bucket items" ON public.memory_bucket_items
  FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members delete bucket items" ON public.memory_bucket_items
  FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

-- =========================================================
-- FUNERAL ENHANCEMENTS
-- =========================================================
ALTER TABLE public.funeral_records
  ADD COLUMN IF NOT EXISTS obituary_text text,
  ADD COLUMN IF NOT EXISTS eulogy_text text,
  ADD COLUMN IF NOT EXISTS eulogy_author text,
  ADD COLUMN IF NOT EXISTS flowers_preferences text,
  ADD COLUMN IF NOT EXISTS reception_wishes text,
  ADD COLUMN IF NOT EXISTS personal_messages text,
  ADD COLUMN IF NOT EXISTS funeral_home_email text,
  ADD COLUMN IF NOT EXISTS funeral_home_phone text,
  ADD COLUMN IF NOT EXISTS last_sent_to_funeral_home_at timestamptz,
  ADD COLUMN IF NOT EXISTS last_sent_to_email text;

CREATE TABLE IF NOT EXISTS public.funeral_music (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_record_id uuid NOT NULL REFERENCES public.funeral_records(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  song_title text NOT NULL,
  artist text,
  when_to_play text,
  notes text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funeral_music ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view funeral_music" ON public.funeral_music
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members insert funeral_music" ON public.funeral_music
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members update funeral_music" ON public.funeral_music
  FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members delete funeral_music" ON public.funeral_music
  FOR DELETE USING (is_packet_member(packet_id) OR is_admin());
CREATE TRIGGER funeral_music_set_updated_at BEFORE UPDATE ON public.funeral_music
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.funeral_readings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_record_id uuid NOT NULL REFERENCES public.funeral_records(id) ON DELETE CASCADE,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  title text NOT NULL,
  author text,
  full_text text,
  reader_name text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funeral_readings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view funeral_readings" ON public.funeral_readings
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members insert funeral_readings" ON public.funeral_readings
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members update funeral_readings" ON public.funeral_readings
  FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members delete funeral_readings" ON public.funeral_readings
  FOR DELETE USING (is_packet_member(packet_id) OR is_admin());
CREATE TRIGGER funeral_readings_set_updated_at BEFORE UPDATE ON public.funeral_readings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE IF NOT EXISTS public.funeral_send_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  funeral_record_id uuid REFERENCES public.funeral_records(id) ON DELETE SET NULL,
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  sent_to_email text NOT NULL,
  sent_by uuid,
  payload_summary jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.funeral_send_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members view funeral_send_log" ON public.funeral_send_log
  FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members insert funeral_send_log" ON public.funeral_send_log
  FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());