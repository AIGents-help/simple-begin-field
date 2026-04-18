-- Add value/balance columns to enable Estate Value Summary aggregation
ALTER TABLE public.banking_records
  ADD COLUMN IF NOT EXISTS approximate_balance numeric;

ALTER TABLE public.retirement_records
  ADD COLUMN IF NOT EXISTS approximate_value numeric;

ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS estimated_value numeric;

-- Estate liabilities table (manually entered debts)
CREATE TABLE IF NOT EXISTS public.estate_liabilities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid NOT NULL REFERENCES public.packets(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  liability_type text NOT NULL,
  lender_name text,
  balance numeric NOT NULL DEFAULT 0,
  monthly_payment numeric,
  interest_rate numeric,
  payoff_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_estate_liabilities_packet ON public.estate_liabilities(packet_id);

ALTER TABLE public.estate_liabilities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view estate liabilities"
  ON public.estate_liabilities FOR SELECT
  USING (public.is_packet_member(packet_id) OR public.has_trusted_access(packet_id, 'banking'));

CREATE POLICY "Members can insert estate liabilities"
  ON public.estate_liabilities FOR INSERT
  WITH CHECK (public.is_packet_member(packet_id) AND user_id = auth.uid());

CREATE POLICY "Members can update estate liabilities"
  ON public.estate_liabilities FOR UPDATE
  USING (public.is_packet_member(packet_id));

CREATE POLICY "Members can delete estate liabilities"
  ON public.estate_liabilities FOR DELETE
  USING (public.is_packet_member(packet_id));

CREATE TRIGGER update_estate_liabilities_updated_at
  BEFORE UPDATE ON public.estate_liabilities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Aggregation function
CREATE OR REPLACE FUNCTION public.calculate_estate_summary(p_packet_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_real_estate_assets numeric := 0;
  v_real_estate_records jsonb := '[]'::jsonb;
  v_vehicle_assets numeric := 0;
  v_vehicle_records jsonb := '[]'::jsonb;
  v_banking_assets numeric := 0;
  v_banking_records jsonb := '[]'::jsonb;
  v_investment_assets numeric := 0;
  v_investment_records jsonb := '[]'::jsonb;
  v_retirement_assets numeric := 0;
  v_retirement_records jsonb := '[]'::jsonb;
  v_property_assets numeric := 0;
  v_property_records jsonb := '[]'::jsonb;
  v_life_insurance_records jsonb := '[]'::jsonb;
  v_liabilities_total numeric := 0;
  v_liabilities_records jsonb := '[]'::jsonb;
  v_missing jsonb := '[]'::jsonb;
  v_gross_assets numeric := 0;
  v_net_estate numeric := 0;
  v_liquid numeric := 0;
  v_illiquid numeric := 0;
BEGIN
  -- REAL ESTATE
  SELECT COALESCE(SUM(estimated_value), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', property_label,
           'value', COALESCE(estimated_value, 0)
         ) ORDER BY estimated_value DESC NULLS LAST) FILTER (WHERE estimated_value IS NOT NULL AND estimated_value > 0), '[]'::jsonb)
    INTO v_real_estate_assets, v_real_estate_records
    FROM real_estate_records WHERE packet_id = p_packet_id;

  -- Missing real estate values
  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','real-estate','id',id,'label', COALESCE(property_label,'Property')))
    FROM real_estate_records
    WHERE packet_id = p_packet_id AND (estimated_value IS NULL OR estimated_value = 0)
  ), '[]'::jsonb);

  -- VEHICLES
  SELECT COALESCE(SUM(estimated_value), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', NULLIF(trim(coalesce(year::text,'')||' '||coalesce(make,'')||' '||coalesce(model,'')), ''),
           'value', COALESCE(estimated_value, 0)
         ) ORDER BY estimated_value DESC NULLS LAST) FILTER (WHERE estimated_value IS NOT NULL AND estimated_value > 0), '[]'::jsonb)
    INTO v_vehicle_assets, v_vehicle_records
    FROM vehicle_records WHERE packet_id = p_packet_id;

  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','vehicles','id',id,'label', NULLIF(trim(coalesce(year::text,'')||' '||coalesce(make,'')||' '||coalesce(model,'')), '')))
    FROM vehicle_records
    WHERE packet_id = p_packet_id AND (estimated_value IS NULL OR estimated_value = 0)
  ), '[]'::jsonb);

  -- Vehicle loans -> liabilities
  v_liabilities_total := v_liabilities_total + COALESCE((SELECT SUM(payoff_amount) FROM vehicle_records WHERE packet_id = p_packet_id AND payoff_amount > 0), 0);

  -- BANKING
  SELECT COALESCE(SUM(approximate_balance), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', institution,
           'subtype', account_type,
           'value', COALESCE(approximate_balance, 0)
         ) ORDER BY approximate_balance DESC NULLS LAST) FILTER (WHERE approximate_balance IS NOT NULL AND approximate_balance > 0), '[]'::jsonb)
    INTO v_banking_assets, v_banking_records
    FROM banking_records WHERE packet_id = p_packet_id;

  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','banking','id',id,'label', institution))
    FROM banking_records
    WHERE packet_id = p_packet_id AND (approximate_balance IS NULL OR approximate_balance = 0)
  ), '[]'::jsonb);

  -- INVESTMENTS
  SELECT COALESCE(SUM(approximate_value), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', COALESCE(account_nickname, institution),
           'subtype', account_type,
           'value', COALESCE(approximate_value, 0)
         ) ORDER BY approximate_value DESC NULLS LAST) FILTER (WHERE approximate_value IS NOT NULL AND approximate_value > 0), '[]'::jsonb)
    INTO v_investment_assets, v_investment_records
    FROM investment_records WHERE packet_id = p_packet_id;

  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','investments','id',id,'label', COALESCE(account_nickname, institution)))
    FROM investment_records
    WHERE packet_id = p_packet_id AND (approximate_value IS NULL OR approximate_value = 0)
  ), '[]'::jsonb);

  -- RETIREMENT
  SELECT COALESCE(SUM(approximate_value), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', COALESCE(institution, account_type),
           'subtype', account_type,
           'value', COALESCE(approximate_value, 0)
         ) ORDER BY approximate_value DESC NULLS LAST) FILTER (WHERE approximate_value IS NOT NULL AND approximate_value > 0), '[]'::jsonb)
    INTO v_retirement_assets, v_retirement_records
    FROM retirement_records WHERE packet_id = p_packet_id;

  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','retirement','id',id,'label', COALESCE(institution, account_type)))
    FROM retirement_records
    WHERE packet_id = p_packet_id AND (approximate_value IS NULL OR approximate_value = 0)
  ), '[]'::jsonb);

  -- PERSONAL PROPERTY
  SELECT COALESCE(SUM(COALESCE(appraised_value, estimated_value, 0)), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', COALESCE(item_name, title),
           'subtype', category,
           'value', COALESCE(appraised_value, estimated_value, 0)
         ) ORDER BY COALESCE(appraised_value, estimated_value, 0) DESC) FILTER (WHERE COALESCE(appraised_value, estimated_value, 0) > 0), '[]'::jsonb)
    INTO v_property_assets, v_property_records
    FROM personal_property_records WHERE packet_id = p_packet_id;

  v_missing := v_missing || COALESCE((
    SELECT jsonb_agg(jsonb_build_object('section','property','id',id,'label', COALESCE(item_name, title, 'Item')))
    FROM personal_property_records
    WHERE packet_id = p_packet_id AND COALESCE(appraised_value, estimated_value, 0) = 0
  ), '[]'::jsonb);

  -- LIFE INSURANCE (informational only — from info_records)
  SELECT COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'label', title,
           'notes', notes
         )), '[]'::jsonb)
    INTO v_life_insurance_records
    FROM info_records
    WHERE packet_id = p_packet_id
      AND lower(coalesce(category,'')) IN ('life_insurance','life insurance');

  -- LIABILITIES
  SELECT v_liabilities_total + COALESCE(SUM(balance), 0),
         COALESCE(jsonb_agg(jsonb_build_object(
           'id', id,
           'liability_type', liability_type,
           'label', COALESCE(lender_name, liability_type),
           'value', COALESCE(balance, 0),
           'payoff_date', payoff_date
         ) ORDER BY balance DESC NULLS LAST) FILTER (WHERE balance > 0), '[]'::jsonb)
    INTO v_liabilities_total, v_liabilities_records
    FROM estate_liabilities WHERE packet_id = p_packet_id;

  v_gross_assets := v_real_estate_assets + v_vehicle_assets + v_banking_assets + v_investment_assets + v_retirement_assets + v_property_assets;
  v_net_estate := v_gross_assets - v_liabilities_total;
  v_liquid := v_banking_assets + v_investment_assets;
  v_illiquid := v_real_estate_assets + v_vehicle_assets + v_property_assets;

  RETURN jsonb_build_object(
    'packet_id', p_packet_id,
    'gross_assets', v_gross_assets,
    'total_liabilities', v_liabilities_total,
    'net_estate', v_net_estate,
    'liquid_assets', v_liquid,
    'illiquid_assets', v_illiquid,
    'death_benefits', 0,
    'categories', jsonb_build_object(
      'real_estate', jsonb_build_object('total', v_real_estate_assets, 'records', v_real_estate_records),
      'vehicles', jsonb_build_object('total', v_vehicle_assets, 'records', v_vehicle_records),
      'banking', jsonb_build_object('total', v_banking_assets, 'records', v_banking_records),
      'investments', jsonb_build_object('total', v_investment_assets, 'records', v_investment_records),
      'retirement', jsonb_build_object('total', v_retirement_assets, 'records', v_retirement_records),
      'property', jsonb_build_object('total', v_property_assets, 'records', v_property_records),
      'life_insurance', jsonb_build_object('records', v_life_insurance_records)
    ),
    'liabilities', v_liabilities_records,
    'missing_values', v_missing,
    'calculated_at', now()
  );
END;
$$;