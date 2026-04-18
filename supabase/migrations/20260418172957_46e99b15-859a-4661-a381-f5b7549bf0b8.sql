-- Section-aware estate summary for trusted contacts.
-- Returns the same shape as calculate_estate_summary, but zeroes out
-- categories the caller does not have explicit access to.
-- Permission rules:
--   * Packet members (owners/partners): full summary
--   * Trusted contacts: only categories matching sections they have access to:
--       - real_estate  -> 'real-estate'
--       - vehicles     -> 'vehicles'
--       - banking      -> 'banking'  (also gates liabilities)
--       - investments  -> 'investments'
--       - retirement   -> 'retirement'
--       - property     -> 'property'
--       - life_insurance -> 'info' or 'legal'
CREATE OR REPLACE FUNCTION public.calculate_estate_summary_for_viewer(p_packet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_full jsonb;
  v_is_member boolean;
  v_perms text[];
  v_categories jsonb;
  v_gross numeric := 0;
  v_liab numeric := 0;
  v_liquid numeric := 0;
  v_illiquid numeric := 0;
  v_can_banking boolean;
  v_can_real_estate boolean;
  v_can_vehicles boolean;
  v_can_investments boolean;
  v_can_retirement boolean;
  v_can_property boolean;
  v_can_life boolean;
BEGIN
  v_is_member := public.is_packet_member(p_packet_id);
  v_full := public.calculate_estate_summary(p_packet_id);

  IF v_is_member THEN
    RETURN v_full || jsonb_build_object('partial', false);
  END IF;

  -- Trusted contact: gather permitted sections
  SELECT COALESCE(array_agg(section_key), ARRAY[]::text[])
    INTO v_perms
    FROM public.viewer_permitted_sections(p_packet_id);

  IF v_perms = ARRAY[]::text[] THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  v_can_real_estate := 'real-estate' = ANY(v_perms);
  v_can_vehicles    := 'vehicles' = ANY(v_perms);
  v_can_banking     := 'banking' = ANY(v_perms);
  v_can_investments := 'investments' = ANY(v_perms);
  v_can_retirement  := 'retirement' = ANY(v_perms);
  v_can_property    := 'property' = ANY(v_perms);
  v_can_life        := ('info' = ANY(v_perms)) OR ('legal' = ANY(v_perms));

  v_categories := v_full->'categories';

  IF NOT v_can_real_estate THEN
    v_categories := jsonb_set(v_categories, '{real_estate}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_vehicles THEN
    v_categories := jsonb_set(v_categories, '{vehicles}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_banking THEN
    v_categories := jsonb_set(v_categories, '{banking}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_investments THEN
    v_categories := jsonb_set(v_categories, '{investments}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_retirement THEN
    v_categories := jsonb_set(v_categories, '{retirement}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_property THEN
    v_categories := jsonb_set(v_categories, '{property}', jsonb_build_object('total', 0, 'records', '[]'::jsonb));
  END IF;
  IF NOT v_can_life THEN
    v_categories := jsonb_set(v_categories, '{life_insurance}', jsonb_build_object('records', '[]'::jsonb));
  END IF;

  v_gross := COALESCE((v_categories->'real_estate'->>'total')::numeric, 0)
           + COALESCE((v_categories->'vehicles'->>'total')::numeric, 0)
           + COALESCE((v_categories->'banking'->>'total')::numeric, 0)
           + COALESCE((v_categories->'investments'->>'total')::numeric, 0)
           + COALESCE((v_categories->'retirement'->>'total')::numeric, 0)
           + COALESCE((v_categories->'property'->>'total')::numeric, 0);

  v_liquid := COALESCE((v_categories->'banking'->>'total')::numeric, 0)
            + COALESCE((v_categories->'investments'->>'total')::numeric, 0);

  v_illiquid := COALESCE((v_categories->'real_estate'->>'total')::numeric, 0)
              + COALESCE((v_categories->'vehicles'->>'total')::numeric, 0)
              + COALESCE((v_categories->'property'->>'total')::numeric, 0);

  -- Liabilities only included if banking is permitted
  IF v_can_banking THEN
    v_liab := COALESCE((v_full->>'total_liabilities')::numeric, 0);
  ELSE
    v_liab := 0;
  END IF;

  RETURN jsonb_build_object(
    'packet_id', p_packet_id,
    'gross_assets', v_gross,
    'total_liabilities', v_liab,
    'net_estate', v_gross - v_liab,
    'liquid_assets', v_liquid,
    'illiquid_assets', v_illiquid,
    'death_benefits', 0,
    'categories', v_categories,
    'liabilities', CASE WHEN v_can_banking THEN v_full->'liabilities' ELSE '[]'::jsonb END,
    'missing_values', '[]'::jsonb,
    'partial', true,
    'permitted_sections', to_jsonb(v_perms),
    'calculated_at', now()
  );
END;
$$;

-- Lock down direct call of full function so trusted contacts must use the viewer variant.
-- Members still pass through via calculate_estate_summary_for_viewer.
REVOKE EXECUTE ON FUNCTION public.calculate_estate_summary(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_estate_summary(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.calculate_estate_summary_for_viewer(uuid) TO authenticated;