
CREATE TABLE public.referral_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  professional_name text,
  email text,
  logo_url text,
  brand_color text,
  stripe_account_id text,
  owner_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.referral_codes ENABLE ROW LEVEL SECURITY;

-- Professionals can view their own codes
CREATE POLICY "Professionals can view own codes"
  ON public.referral_codes FOR SELECT
  USING (owner_id = auth.uid() OR is_admin());

-- Professionals can create codes
CREATE POLICY "Professionals can insert codes"
  ON public.referral_codes FOR INSERT
  WITH CHECK (owner_id = auth.uid() OR is_admin());

-- Professionals can update own codes
CREATE POLICY "Professionals can update own codes"
  ON public.referral_codes FOR UPDATE
  USING (owner_id = auth.uid() OR is_admin());

-- Admins can delete codes
CREATE POLICY "Admins can delete codes"
  ON public.referral_codes FOR DELETE
  USING (is_admin());

-- Public can look up active codes (for validation when customers enter a code)
CREATE POLICY "Public can validate active codes"
  ON public.referral_codes FOR SELECT
  USING (is_active = true);
