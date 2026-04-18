-- Additive columns for the Family section revamp.
-- All nullable, no defaults that would rewrite existing rows.

ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS is_dependent boolean,
  ADD COLUMN IF NOT EXISTS is_beneficiary boolean,
  ADD COLUMN IF NOT EXISTS has_special_needs boolean,
  ADD COLUMN IF NOT EXISTS special_needs_notes text,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_relationship text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS school_name text,
  ADD COLUMN IF NOT EXISTS lives_with_user boolean,
  ADD COLUMN IF NOT EXISTS relationship_subtype text,
  ADD COLUMN IF NOT EXISTS which_parent text,
  ADD COLUMN IF NOT EXISTS parent_side text,
  ADD COLUMN IF NOT EXISTS inlaw_subtype text,
  ADD COLUMN IF NOT EXISTS related_to_spouse_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS divorce_finalized boolean,
  ADD COLUMN IF NOT EXISTS legacy_notes text;

-- Helpful index for in-law → spouse lookups
CREATE INDEX IF NOT EXISTS idx_family_members_related_to_spouse
  ON public.family_members(related_to_spouse_id)
  WHERE related_to_spouse_id IS NOT NULL;