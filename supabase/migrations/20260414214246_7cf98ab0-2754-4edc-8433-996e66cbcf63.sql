ALTER TABLE public.family_members
ADD COLUMN parent_member_id uuid REFERENCES public.family_members(id) ON DELETE SET NULL DEFAULT NULL;