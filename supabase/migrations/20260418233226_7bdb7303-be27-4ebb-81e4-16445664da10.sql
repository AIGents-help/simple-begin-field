-- Custom sections (folders) table
CREATE TABLE public.custom_sections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  packet_id UUID NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  name TEXT NOT NULL CHECK (char_length(name) > 0 AND char_length(name) <= 30),
  icon TEXT NOT NULL DEFAULT 'Folder',
  description TEXT CHECK (description IS NULL OR char_length(description) <= 100),
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_sections_packet ON public.custom_sections(packet_id);

ALTER TABLE public.custom_sections ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view custom sections"
  ON public.custom_sections FOR SELECT
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can create custom sections"
  ON public.custom_sections FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) AND auth.uid() = user_id);

CREATE POLICY "Members can update custom sections"
  ON public.custom_sections FOR UPDATE
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can delete custom sections"
  ON public.custom_sections FOR DELETE
  USING (public.is_packet_member(packet_id));

-- Trigger to enforce a maximum of 3 custom sections per packet
CREATE OR REPLACE FUNCTION public.enforce_custom_section_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT COUNT(*) FROM public.custom_sections WHERE packet_id = NEW.packet_id) >= 3 THEN
    RAISE EXCEPTION 'A packet can have at most 3 custom sections';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_custom_section_limit
  BEFORE INSERT ON public.custom_sections
  FOR EACH ROW EXECUTE FUNCTION public.enforce_custom_section_limit();

CREATE TRIGGER trg_custom_sections_updated_at
  BEFORE UPDATE ON public.custom_sections
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Records inside a custom section
CREATE TABLE public.custom_section_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  custom_section_id UUID NOT NULL REFERENCES public.custom_sections(id) ON DELETE CASCADE,
  packet_id UUID NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  notes TEXT,
  entry_date DATE,
  scope TEXT DEFAULT 'shared',
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_custom_section_records_section ON public.custom_section_records(custom_section_id);
CREATE INDEX idx_custom_section_records_packet ON public.custom_section_records(packet_id);

ALTER TABLE public.custom_section_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view custom section records"
  ON public.custom_section_records FOR SELECT
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can create custom section records"
  ON public.custom_section_records FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id));

CREATE POLICY "Members can update custom section records"
  ON public.custom_section_records FOR UPDATE
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can delete custom section records"
  ON public.custom_section_records FOR DELETE
  USING (public.is_packet_member(packet_id));

CREATE TRIGGER trg_custom_section_records_updated_at
  BEFORE UPDATE ON public.custom_section_records
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();