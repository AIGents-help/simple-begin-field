
-- Drop and recreate the function to ensure it properly handles RLS
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
SET role = 'postgres'
AS $$
DECLARE
  new_packet_id uuid;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    'customer'
  )
  ON CONFLICT (id) DO NOTHING;

  -- Create default packet
  INSERT INTO public.packets (id, owner_user_id, title, household_mode, person_a_name)
  VALUES (
    gen_random_uuid(),
    NEW.id,
    'The Survivor Packet',
    'single',
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  )
  RETURNING id INTO new_packet_id;

  -- Add user as packet member
  INSERT INTO public.packet_members (packet_id, user_id, role, household_scope)
  VALUES (new_packet_id, NEW.id, 'owner', 'personA');

  RETURN NEW;
END;
$$;
