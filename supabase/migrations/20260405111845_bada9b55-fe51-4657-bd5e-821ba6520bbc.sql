
ALTER TABLE public.family_members ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.banking_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.retirement_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.vehicle_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.advisor_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.password_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.personal_property_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.pet_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.funeral_records ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.private_items ADD COLUMN IF NOT EXISTS category TEXT;
ALTER TABLE public.real_estate_records ADD COLUMN IF NOT EXISTS category TEXT;
