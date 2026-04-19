ALTER TABLE public.emergency_tokens
  ADD COLUMN IF NOT EXISTS bypass_enabled boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS bypass_fields jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS bypass_consent_agreed_at timestamptz,
  ADD COLUMN IF NOT EXISTS bypass_consent_version text DEFAULT '1.0';