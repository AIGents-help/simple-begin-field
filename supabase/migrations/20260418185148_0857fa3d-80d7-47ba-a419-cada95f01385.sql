
-- ─── GIFT CODES ─────────────────────────────────────────────
CREATE TABLE public.gift_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  plan_key text NOT NULL,
  purchased_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  recipient_email text,
  recipient_name text,
  personal_message text,
  delivery_date timestamptz,
  delivered_at timestamptz,
  redeemed_by_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  redeemed_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '1 year'),
  stripe_payment_intent_id text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_gift_codes_code ON public.gift_codes(code);
CREATE INDEX idx_gift_codes_purchaser ON public.gift_codes(purchased_by_user_id);
CREATE INDEX idx_gift_codes_recipient_email ON public.gift_codes(lower(recipient_email));

ALTER TABLE public.gift_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Purchasers see their own gifts"
  ON public.gift_codes FOR SELECT TO authenticated
  USING (purchased_by_user_id = auth.uid() OR redeemed_by_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage gift codes"
  ON public.gift_codes FOR ALL TO authenticated
  USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE TRIGGER update_gift_codes_updated_at
BEFORE UPDATE ON public.gift_codes
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Generator: 12-char alphanumeric, uppercase, unambiguous (no 0/O/1/I)
CREATE OR REPLACE FUNCTION public.generate_gift_code()
RETURNS text LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  chars text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  result text := '';
  i int;
BEGIN
  FOR i IN 1..12 LOOP
    result := result || substr(chars, 1 + floor(random() * length(chars))::int, 1);
  END LOOP;
  RETURN result;
END;
$$;

-- Redemption RPC (callable by authenticated users)
CREATE OR REPLACE FUNCTION public.redeem_gift_code(p_code text)
RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_user uuid := auth.uid();
  v_row public.gift_codes%ROWTYPE;
BEGIN
  IF v_user IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'not_authenticated');
  END IF;

  SELECT * INTO v_row FROM public.gift_codes WHERE upper(code) = upper(p_code) FOR UPDATE;
  IF NOT FOUND THEN RETURN jsonb_build_object('success', false, 'error', 'code_not_found'); END IF;
  IF v_row.redeemed_at IS NOT NULL THEN RETURN jsonb_build_object('success', false, 'error', 'already_redeemed'); END IF;
  IF v_row.expires_at < now() THEN RETURN jsonb_build_object('success', false, 'error', 'expired'); END IF;

  UPDATE public.gift_codes
     SET redeemed_by_user_id = v_user, redeemed_at = now(), status = 'redeemed', updated_at = now()
   WHERE id = v_row.id;

  -- Insert a purchase record so the user gets the plan
  INSERT INTO public.purchases (user_id, status, billing_type, pricing_plan_id)
  SELECT v_user, 'one_time_paid', 'one_time', pp.id
  FROM public.pricing_plans pp WHERE pp.plan_key = v_row.plan_key
  LIMIT 1;

  RETURN jsonb_build_object('success', true, 'plan_key', v_row.plan_key);
END;
$$;

-- ─── FAMILY PLANS ───────────────────────────────────────────
CREATE TABLE public.family_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_key text NOT NULL,
  feature_tier text NOT NULL DEFAULT 'basic',
  seat_limit int NOT NULL DEFAULT 6,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_family_plans_owner ON public.family_plans(owner_user_id);

CREATE TABLE public.family_plan_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  family_plan_id uuid NOT NULL REFERENCES public.family_plans(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_name text,
  invite_token text UNIQUE,
  invite_expires_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'invited', -- invited|active|removed
  share_completion_pct boolean DEFAULT false,
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  removed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_family_plan_members_plan ON public.family_plan_members(family_plan_id);
CREATE INDEX idx_family_plan_members_email ON public.family_plan_members(lower(invited_email));
CREATE INDEX idx_family_plan_members_token ON public.family_plan_members(invite_token);

ALTER TABLE public.family_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_plan_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner sees own family plan" ON public.family_plans FOR SELECT TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Owner manages own family plan" ON public.family_plans FOR ALL TO authenticated
  USING (owner_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (owner_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Plan owner + member sees rows" ON public.family_plan_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.family_plans fp WHERE fp.id = family_plan_id AND fp.owner_user_id = auth.uid())
  );
CREATE POLICY "Plan owner manages members" ON public.family_plan_members FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.family_plans fp WHERE fp.id = family_plan_id AND fp.owner_user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.family_plans fp WHERE fp.id = family_plan_id AND fp.owner_user_id = auth.uid())
  );

CREATE TRIGGER update_family_plans_updated_at BEFORE UPDATE ON public.family_plans FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_family_plan_members_updated_at BEFORE UPDATE ON public.family_plan_members FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── CORPORATE ACCOUNTS ────────────────────────────────────
CREATE TABLE public.corporate_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL,
  company_logo_url text,
  billing_email text,
  plan_key text NOT NULL,
  feature_tier text NOT NULL DEFAULT 'basic',
  seat_limit int NOT NULL DEFAULT 10,
  total_paid numeric DEFAULT 0,
  stripe_payment_intent_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_corporate_accounts_admin ON public.corporate_accounts(admin_user_id);

CREATE TABLE public.corporate_seats (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  corporate_account_id uuid NOT NULL REFERENCES public.corporate_accounts(id) ON DELETE CASCADE,
  invited_email text NOT NULL,
  invited_name text,
  invite_token text UNIQUE,
  invite_expires_at timestamptz,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'invited', -- invited|active|revoked
  invited_at timestamptz NOT NULL DEFAULT now(),
  activated_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_corporate_seats_account ON public.corporate_seats(corporate_account_id);
CREATE INDEX idx_corporate_seats_email ON public.corporate_seats(lower(invited_email));
CREATE INDEX idx_corporate_seats_token ON public.corporate_seats(invite_token);

ALTER TABLE public.corporate_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.corporate_seats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin sees own corp" ON public.corporate_accounts FOR SELECT TO authenticated
  USING (admin_user_id = auth.uid() OR public.is_admin());
CREATE POLICY "Admin manages own corp" ON public.corporate_accounts FOR ALL TO authenticated
  USING (admin_user_id = auth.uid() OR public.is_admin())
  WITH CHECK (admin_user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Corp admin + seat sees rows" ON public.corporate_seats FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR public.is_admin()
    OR EXISTS (SELECT 1 FROM public.corporate_accounts ca WHERE ca.id = corporate_account_id AND ca.admin_user_id = auth.uid())
  );
CREATE POLICY "Corp admin manages seats" ON public.corporate_seats FOR ALL TO authenticated
  USING (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.corporate_accounts ca WHERE ca.id = corporate_account_id AND ca.admin_user_id = auth.uid())
  ) WITH CHECK (
    public.is_admin()
    OR EXISTS (SELECT 1 FROM public.corporate_accounts ca WHERE ca.id = corporate_account_id AND ca.admin_user_id = auth.uid())
  );

CREATE TRIGGER update_corporate_accounts_updated_at BEFORE UPDATE ON public.corporate_accounts FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_corporate_seats_updated_at BEFORE UPDATE ON public.corporate_seats FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ─── ENTERPRISE LEADS ──────────────────────────────────────
CREATE TABLE public.enterprise_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_name text NOT NULL,
  contact_name text NOT NULL,
  contact_email text NOT NULL,
  contact_phone text,
  estimated_seats int,
  message text,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.enterprise_leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can submit a lead" ON public.enterprise_leads FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins read leads" ON public.enterprise_leads FOR SELECT TO authenticated USING (public.is_admin());
