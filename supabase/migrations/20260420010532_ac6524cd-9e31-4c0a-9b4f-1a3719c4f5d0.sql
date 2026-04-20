-- Add self-referencing foreign key for "Related to" linkage on family_members
ALTER TABLE public.family_members
  ADD COLUMN IF NOT EXISTS related_to_member_id uuid
  REFERENCES public.family_members(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_family_members_related_to_member_id
  ON public.family_members(related_to_member_id);