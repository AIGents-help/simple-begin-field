
DO $$
DECLARE
  new_packet_id uuid := gen_random_uuid();
BEGIN
  -- Only create if user doesn't already have a packet
  IF NOT EXISTS (SELECT 1 FROM public.packet_members WHERE user_id = '3315efcd-aea4-4d03-840e-95f3acfcccdc') THEN
    INSERT INTO public.packets (id, owner_user_id, title, household_mode, person_a_name)
    VALUES (new_packet_id, '3315efcd-aea4-4d03-840e-95f3acfcccdc', 'The Survivor Packet', 'single', 'TestUser');

    INSERT INTO public.packet_members (packet_id, user_id, role, household_scope)
    VALUES (new_packet_id, '3315efcd-aea4-4d03-840e-95f3acfcccdc', 'owner', 'personA');
  END IF;
END;
$$;
