CREATE TABLE IF NOT EXISTS public.featured_professionals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  firm TEXT,
  profession_type TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  description TEXT,
  is_verified BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT true,
  display_order INT DEFAULT 0,
  service_area_zips TEXT[],
  service_area_states TEXT[],
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_featured_professionals_profession ON public.featured_professionals(profession_type);
CREATE INDEX IF NOT EXISTS idx_featured_professionals_state ON public.featured_professionals(state);
CREATE INDEX IF NOT EXISTS idx_featured_professionals_active ON public.featured_professionals(is_active);

ALTER TABLE public.featured_professionals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active featured professionals"
ON public.featured_professionals FOR SELECT
USING (is_active = true);

CREATE POLICY "Admins can insert featured professionals"
ON public.featured_professionals FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update featured professionals"
ON public.featured_professionals FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete featured professionals"
ON public.featured_professionals FOR DELETE
USING (is_admin());