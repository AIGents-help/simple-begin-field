-- Add comp access and admin note columns to purchases
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS is_comp boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS comp_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS comp_granted_by uuid,
  ADD COLUMN IF NOT EXISTS admin_note text;

-- Allow admins to manage all purchases
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchases' AND policyname = 'Admins can insert purchases'
  ) THEN
    CREATE POLICY "Admins can insert purchases" ON public.purchases FOR INSERT WITH CHECK (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchases' AND policyname = 'Admins can update purchases'
  ) THEN
    CREATE POLICY "Admins can update purchases" ON public.purchases FOR UPDATE USING (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchases' AND policyname = 'Admins can delete purchases'
  ) THEN
    CREATE POLICY "Admins can delete purchases" ON public.purchases FOR DELETE USING (public.is_admin());
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'purchases' AND policyname = 'Admins can view all purchases'
  ) THEN
    CREATE POLICY "Admins can view all purchases" ON public.purchases FOR SELECT USING (public.is_admin());
  END IF;
END $$;