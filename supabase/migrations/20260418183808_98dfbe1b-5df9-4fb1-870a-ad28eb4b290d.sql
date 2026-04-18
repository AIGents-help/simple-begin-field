-- 0. Relax household_mode to support family + corporate
ALTER TABLE public.pricing_plans
  DROP CONSTRAINT IF EXISTS pricing_plans_household_mode_check;
ALTER TABLE public.pricing_plans
  ADD CONSTRAINT pricing_plans_household_mode_check
  CHECK (household_mode = ANY (ARRAY['single','couple','family','corporate']));

-- 1. New columns on pricing_plans
ALTER TABLE public.pricing_plans
  ADD COLUMN IF NOT EXISTS feature_tier text NOT NULL DEFAULT 'basic'
    CHECK (feature_tier IN ('basic', 'full')),
  ADD COLUMN IF NOT EXISTS plan_category text NOT NULL DEFAULT 'individual'
    CHECK (plan_category IN ('free', 'individual', 'couple', 'family', 'corporate', 'gift')),
  ADD COLUMN IF NOT EXISTS seat_limit integer NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS is_corporate_per_seat boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS upgrade_target_plan_id uuid REFERENCES public.pricing_plans(id);

-- 2. Backfill existing rows
UPDATE public.pricing_plans SET feature_tier = 'full', plan_category = 'individual', seat_limit = 1
  WHERE plan_key IN ('individual_monthly', 'individual_annual', 'lifetime');
UPDATE public.pricing_plans SET feature_tier = 'full', plan_category = 'couple', seat_limit = 2
  WHERE plan_key IN ('couple_monthly', 'couple_annual');
UPDATE public.pricing_plans SET feature_tier = 'basic', plan_category = 'free', seat_limit = 1
  WHERE plan_key = 'free';

-- 3. Insert the new lifetime plans
INSERT INTO public.pricing_plans (plan_key, name, price_cents, billing_type, household_mode, feature_tier, plan_category, seat_limit, is_active, display_order, stripe_price_id)
VALUES
  ('basic_single_lifetime',     'Basic Single Lifetime',             9700,  'one_time', 'single',    'basic', 'individual', 1, true, 10, NULL),
  ('full_single_lifetime',      'Full Feature Single Lifetime',      19700, 'one_time', 'single',    'full',  'individual', 1, true, 11, NULL),
  ('basic_couple_lifetime',     'Basic Couple Lifetime',             14700, 'one_time', 'couple',    'basic', 'couple',     2, true, 20, NULL),
  ('full_couple_lifetime',      'Full Feature Couple Lifetime',      24900, 'one_time', 'couple',    'full',  'couple',     2, true, 21, NULL),
  ('basic_family_lifetime',     'Basic Family Lifetime',             29700, 'one_time', 'family',    'basic', 'family',     6, true, 30, NULL),
  ('full_family_lifetime',      'Full Feature Family Lifetime',      49700, 'one_time', 'family',    'full',  'family',     6, true, 31, NULL),
  ('gift_basic_single',         'Gift — Basic Single',               9700,  'one_time', 'single',    'basic', 'gift',       1, true, 40, NULL),
  ('gift_full_single',          'Gift — Full Feature Single',        19700, 'one_time', 'single',    'full',  'gift',       1, true, 41, NULL),
  ('gift_basic_couple',         'Gift — Basic Couple',               14700, 'one_time', 'couple',    'basic', 'gift',       2, true, 42, NULL),
  ('gift_full_couple',          'Gift — Full Feature Couple',        24900, 'one_time', 'couple',    'full',  'gift',       2, true, 43, NULL),
  ('corporate_basic',           'Corporate Basic (per seat)',        7500,  'one_time', 'corporate', 'basic', 'corporate',  1, true, 50, NULL),
  ('corporate_full',            'Corporate Full Feature (per seat)', 15000, 'one_time', 'corporate', 'full',  'corporate',  1, true, 51, NULL)
ON CONFLICT (plan_key) DO UPDATE
SET name = EXCLUDED.name,
    price_cents = EXCLUDED.price_cents,
    billing_type = EXCLUDED.billing_type,
    household_mode = EXCLUDED.household_mode,
    feature_tier = EXCLUDED.feature_tier,
    plan_category = EXCLUDED.plan_category,
    seat_limit = EXCLUDED.seat_limit,
    display_order = EXCLUDED.display_order,
    is_active = true;

-- 4. Mark corporate plans as per-seat
UPDATE public.pricing_plans SET is_corporate_per_seat = true
  WHERE plan_key IN ('corporate_basic', 'corporate_full');

-- 5. Wire upgrade targets (Basic → Full Feature within same category)
UPDATE public.pricing_plans b
SET upgrade_target_plan_id = f.id
FROM public.pricing_plans f
WHERE b.feature_tier = 'basic'
  AND f.feature_tier = 'full'
  AND b.plan_category = f.plan_category
  AND b.seat_limit   = f.seat_limit
  AND b.plan_category IN ('individual', 'couple', 'family');

-- 6. Convenience view
CREATE OR REPLACE VIEW public.v_user_feature_tier
WITH (security_invoker = true) AS
SELECT
  p.user_id,
  COALESCE(pp.feature_tier, 'basic') AS feature_tier,
  COALESCE(pp.plan_category, 'free') AS plan_category,
  pp.plan_key,
  pp.seat_limit,
  p.status,
  p.is_comp,
  p.created_at
FROM public.purchases p
LEFT JOIN public.pricing_plans pp ON pp.id = p.pricing_plan_id
WHERE p.status IN ('active', 'one_time_paid');

COMMENT ON COLUMN public.pricing_plans.feature_tier IS 'basic | full — drives PlanGate feature unlocks';
COMMENT ON COLUMN public.pricing_plans.plan_category IS 'free | individual | couple | family | corporate | gift';
COMMENT ON COLUMN public.pricing_plans.seat_limit IS 'How many linked user accounts this plan covers';