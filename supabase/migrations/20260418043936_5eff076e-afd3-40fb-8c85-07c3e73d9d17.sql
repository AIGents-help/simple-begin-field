-- Create investment_records table
CREATE TABLE public.investment_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES public.packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared',
  
  -- Account Info
  institution text NOT NULL,
  account_type text,
  account_nickname text,
  account_number_masked text,
  account_number_encrypted text,
  approximate_value numeric,
  last_statement_date date,
  is_joint_account boolean DEFAULT false,
  co_owner_name text,
  
  -- Access
  website_url text,
  username_masked text,
  username_encrypted text,
  password_hint text,
  account_phone text,
  branch_address text,
  
  -- Advisor
  advisor_name text,
  advisor_phone text,
  advisor_email text,
  
  -- Holdings
  primary_holdings_description text,
  allocation_stocks_pct numeric,
  allocation_bonds_pct numeric,
  allocation_cash_pct numeric,
  allocation_other_pct numeric,
  restricted_stock_notes text,
  
  -- Beneficiary
  primary_beneficiary text,
  contingent_beneficiary text,
  tod_on_file boolean DEFAULT false,
  
  -- Crypto specific
  crypto_exchange_name text,
  crypto_wallet_type text,
  crypto_hardware_wallet_location text,
  crypto_seed_phrase_location text,
  
  -- Private Investment specific
  pi_company_name text,
  pi_investment_date date,
  pi_amount_invested numeric,
  pi_current_value numeric,
  pi_investment_stage text,
  pi_company_contact text,
  pi_shareholder_agreement_notes text,
  
  -- Disposition
  disposition_action text,
  disposition_instructions text,
  
  -- Standard
  category text,
  notes text,
  status text DEFAULT 'empty',
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.investment_records ENABLE ROW LEVEL SECURITY;

-- RLS policies (mirror other section tables)
CREATE POLICY "Members can view investment_records"
  ON public.investment_records FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can insert investment_records"
  ON public.investment_records FOR INSERT
  WITH CHECK (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can update investment_records"
  ON public.investment_records FOR UPDATE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can delete investment_records"
  ON public.investment_records FOR DELETE
  USING (is_packet_member(packet_id) OR is_admin());

-- Updated_at trigger
CREATE TRIGGER update_investment_records_updated_at
  BEFORE UPDATE ON public.investment_records
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Index for packet lookups
CREATE INDEX idx_investment_records_packet_id ON public.investment_records(packet_id);