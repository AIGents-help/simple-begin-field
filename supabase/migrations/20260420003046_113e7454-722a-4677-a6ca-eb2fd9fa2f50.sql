CREATE TABLE IF NOT EXISTS public.debt_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES public.packets(id) ON DELETE CASCADE,
  created_by uuid REFERENCES auth.users(id),
  creditor_name text NOT NULL,
  debt_type text NOT NULL,
  account_number text,
  current_balance numeric(14,2),
  original_balance numeric(14,2),
  interest_rate numeric(6,3),
  minimum_payment numeric(10,2),
  payment_due_day integer,
  payment_frequency text,
  maturity_date date,
  is_joint boolean DEFAULT false,
  joint_holder_name text,
  autopay_enabled boolean DEFAULT false,
  autopay_account text,
  login_url text,
  contact_phone text,
  contact_address text,
  notes text,
  is_not_applicable boolean DEFAULT false,
  scope text DEFAULT 'personA',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.debt_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner access debt_accounts"
  ON public.debt_accounts
  FOR ALL
  USING (
    packet_id IN (
      SELECT id FROM public.packets WHERE owner_user_id = auth.uid()
    )
  )
  WITH CHECK (
    packet_id IN (
      SELECT id FROM public.packets WHERE owner_user_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_debt_accounts_packet_id ON public.debt_accounts(packet_id);
CREATE INDEX IF NOT EXISTS idx_debt_accounts_creditor_name ON public.debt_accounts(creditor_name);

CREATE TRIGGER update_debt_accounts_updated_at
  BEFORE UPDATE ON public.debt_accounts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();