
-- 1. Profiles
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name text,
  email text,
  role text DEFAULT 'customer' CHECK (role IN ('customer', 'professional', 'admin')),
  affiliate_id uuid,
  consent_timestamp timestamp with time zone,
  legal_version_accepted text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 2. Packets
CREATE TABLE packets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  household_mode text CHECK (household_mode IN ('single','couple')),
  title text DEFAULT 'The Survivor Packet',
  person_a_name text,
  person_b_name text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  affiliate_code text,
  affiliate_referrer_id uuid,
  last_opened_at timestamp with time zone
);

-- 3. Packet Members
CREATE TABLE packet_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  role text CHECK (role IN ('owner','partner','viewer','editor')),
  household_scope text CHECK (household_scope IN ('personA','personB','shared','full')),
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(packet_id, user_id)
);

-- 4. Section Completion
CREATE TABLE section_completion (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  section_key text,
  scope text CHECK (scope IN ('personA','personB','shared')),
  status text CHECK (status IN ('empty','in_progress','complete','not_applicable')),
  percent_complete numeric DEFAULT 0,
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(packet_id, section_key, scope)
);

-- 5. Family Members
CREATE TABLE family_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared' CHECK (scope IN ('personA','personB','shared')),
  name text NOT NULL,
  address text,
  relationship text,
  phone text,
  email text,
  birthday date,
  reminder_notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 6. Real Estate Records
CREATE TABLE real_estate_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared' CHECK (scope IN ('personA','personB','shared')),
  property_label text NOT NULL,
  address text,
  utilities_account_numbers jsonb DEFAULT '[]'::jsonb,
  insurance_details text,
  security_system_details text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 7. Banking Records
CREATE TABLE banking_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  institution text NOT NULL,
  account_type text,
  account_number_encrypted text,
  account_number_masked text,
  routing_number_encrypted text,
  routing_number_masked text,
  contact_info text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 8. Retirement Records
CREATE TABLE retirement_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  account_type text,
  institution text,
  account_number_encrypted text,
  account_number_masked text,
  beneficiary_notes text,
  contact_info text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 9. Vehicle Records
CREATE TABLE vehicle_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  year text,
  make text,
  model text,
  vin text,
  license_plate text,
  insurance text,
  lien_info text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 10. Advisor Records
CREATE TABLE advisor_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  advisor_type text,
  name text,
  firm text,
  address text,
  phone text,
  email text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 11. Password Records
CREATE TABLE password_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  service_name text NOT NULL,
  username text,
  password_encrypted text,
  password_masked text,
  recovery_email text,
  two_fa_notes text,
  access_instructions text,
  who_should_access text,
  notes text,
  requires_reauth boolean DEFAULT true,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 12. Personal Property Records
CREATE TABLE personal_property_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  item_name text,
  description text,
  estimated_value numeric,
  location text,
  beneficiary text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 13. Pet Records
CREATE TABLE pet_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text DEFAULT 'shared' CHECK (scope IN ('personA','personB','shared')),
  pet_name text,
  species_breed text,
  age text,
  veterinarian_contact text,
  medications text,
  feeding_instructions text,
  care_instructions text,
  emergency_notes text,
  microchip_info text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 14. Funeral Records
CREATE TABLE funeral_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  funeral_home text,
  funeral_director text,
  burial_or_cremation text,
  service_preferences text,
  religious_cultural_preferences text,
  obituary_notes text,
  additional_instructions text,
  cemetery_plot_details text,
  prepaid_arrangements text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 15. Private Items
CREATE TABLE private_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  title text NOT NULL,
  description text,
  visibility text CHECK (visibility IN ('only_me','me_and_partner','release_later')),
  owner_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_locked boolean DEFAULT true,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 16. Info Records
CREATE TABLE info_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  category text NOT NULL,
  title text NOT NULL,
  notes text,
  created_by uuid REFERENCES auth.users(id),
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 17. Medical Records
CREATE TABLE medical_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  scope text CHECK (scope IN ('personA','personB','shared')),
  provider_name text NOT NULL,
  specialty text,
  phone text,
  notes text,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 18. Documents
CREATE TABLE documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  related_table text,
  related_record_id uuid,
  scope text CHECK (scope IN ('personA','personB','shared')),
  section_key text,
  category text,
  file_name text,
  file_path text NOT NULL,
  mime_type text,
  file_size bigint,
  uploaded_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  is_private boolean DEFAULT true,
  status text DEFAULT 'empty' CHECK (status IN ('empty','completed','not_applicable')),
  is_na boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- 19. Affiliate Referrals
CREATE TABLE affiliate_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_code text UNIQUE NOT NULL,
  affiliate_name text,
  affiliate_email text,
  affiliate_type text,
  payout_type text CHECK (payout_type IN ('percent','flat')),
  payout_value numeric,
  is_active boolean DEFAULT true,
  owner_id uuid REFERENCES profiles(id),
  created_at timestamp with time zone DEFAULT now()
);

-- Add foreign key to profiles
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_affiliate FOREIGN KEY (affiliate_id) REFERENCES affiliate_referrals(id);

-- 20. Affiliate Conversions
CREATE TABLE affiliate_conversions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_referral_id uuid REFERENCES affiliate_referrals(id) ON DELETE SET NULL,
  purchase_id uuid,
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  referred_user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  code_used text,
  conversion_status text CHECK (conversion_status IN ('lead','signup','purchase','paid_out')),
  created_at timestamp with time zone DEFAULT now()
);

-- 21. Partner Invites
CREATE TABLE partner_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  invited_by uuid REFERENCES profiles(id) ON DELETE CASCADE,
  invited_name text,
  invited_email text,
  token text UNIQUE NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired')),
  created_at timestamp with time zone DEFAULT now(),
  expires_at timestamp with time zone DEFAULT (now() + interval '7 days')
);

-- 22. Pricing Plans
CREATE TABLE pricing_plans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  plan_key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text,
  billing_type text CHECK (billing_type IN ('one_time','monthly','annual')),
  household_mode text CHECK (household_mode IN ('single','couple')),
  price_cents integer NOT NULL,
  stripe_price_id text,
  stripe_product_id text,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now()
);

-- 23. Customer Billing Profiles
CREATE TABLE customer_billing_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  stripe_customer_id text,
  email text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 24. Purchases
CREATE TABLE purchases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  packet_id uuid REFERENCES packets(id) ON DELETE CASCADE,
  pricing_plan_id uuid REFERENCES pricing_plans(id),
  stripe_checkout_session_id text,
  stripe_subscription_id text,
  stripe_payment_intent_id text,
  status text CHECK (status IN ('pending','active','canceled','expired','failed','one_time_paid')),
  billing_type text CHECK (billing_type IN ('one_time','monthly','annual')),
  current_period_end timestamp with time zone,
  affiliate_referral_id uuid REFERENCES affiliate_referrals(id),
  affiliate_code_used text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- 25. Section Records View
CREATE OR REPLACE VIEW section_records AS
SELECT id, packet_id, 'family' as section_key, name as title, relationship as description, created_at FROM family_members
UNION ALL
SELECT id, packet_id, 'real-estate' as section_key, property_label as title, address as description, created_at FROM real_estate_records
UNION ALL
SELECT id, packet_id, 'banking' as section_key, institution as title, account_type as description, created_at FROM banking_records
UNION ALL
SELECT id, packet_id, 'retirement' as section_key, institution as title, account_type as description, created_at FROM retirement_records
UNION ALL
SELECT id, packet_id, 'vehicles' as section_key, (year || ' ' || make || ' ' || model) as title, license_plate as description, created_at FROM vehicle_records
UNION ALL
SELECT id, packet_id, 'advisors' as section_key, name as title, advisor_type as description, created_at FROM advisor_records
UNION ALL
SELECT id, packet_id, 'passwords' as section_key, service_name as title, username as description, created_at FROM password_records
UNION ALL
SELECT id, packet_id, 'property' as section_key, item_name as title, description as description, created_at FROM personal_property_records
UNION ALL
SELECT id, packet_id, 'pets' as section_key, pet_name as title, species_breed as description, created_at FROM pet_records
UNION ALL
SELECT id, packet_id, 'funeral' as section_key, funeral_home as title, burial_or_cremation as description, created_at FROM funeral_records
UNION ALL
SELECT id, packet_id, 'private' as section_key, title as title, description as description, created_at FROM private_items
UNION ALL
SELECT id, packet_id, 'info' as section_key, title as title, notes as description, created_at FROM info_records
UNION ALL
SELECT id, packet_id, 'medical' as section_key, provider_name as title, specialty as description, created_at FROM medical_records;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE packet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE section_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE real_estate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE banking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE retirement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE vehicle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE advisor_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_property_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE pet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE funeral_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE private_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE info_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE medical_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE partner_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE purchases ENABLE ROW LEVEL SECURITY;

-- Helper functions (SECURITY DEFINER to avoid RLS recursion)
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_professional()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'professional'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_packet_member(p_id uuid)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM packet_members
    WHERE packet_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id OR is_admin());
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Packets policies
CREATE POLICY "Members can view packet" ON packets FOR SELECT USING (is_packet_member(id) OR is_admin());
CREATE POLICY "Users can insert packet" ON packets FOR INSERT WITH CHECK (owner_user_id = auth.uid() OR is_admin());
CREATE POLICY "Owners can update packet" ON packets FOR UPDATE USING (owner_user_id = auth.uid() OR is_admin());

-- Packet Members policies
CREATE POLICY "Members can view packet members" ON packet_members FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Owners can insert packet members" ON packet_members FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM packets WHERE id = packet_id AND owner_user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Owners can update packet members" ON packet_members FOR UPDATE USING (
  EXISTS (SELECT 1 FROM packets WHERE id = packet_id AND owner_user_id = auth.uid()) OR is_admin()
);
CREATE POLICY "Owners can delete packet members" ON packet_members FOR DELETE USING (
  EXISTS (SELECT 1 FROM packets WHERE id = packet_id AND owner_user_id = auth.uid()) OR is_admin()
);

-- Record table policies (family, real estate, banking, etc.)
CREATE POLICY "Members can view family_members" ON family_members FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert family_members" ON family_members FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update family_members" ON family_members FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete family_members" ON family_members FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view real_estate_records" ON real_estate_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert real_estate_records" ON real_estate_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update real_estate_records" ON real_estate_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete real_estate_records" ON real_estate_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view banking_records" ON banking_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert banking_records" ON banking_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update banking_records" ON banking_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete banking_records" ON banking_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view retirement_records" ON retirement_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert retirement_records" ON retirement_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update retirement_records" ON retirement_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete retirement_records" ON retirement_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view vehicle_records" ON vehicle_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert vehicle_records" ON vehicle_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update vehicle_records" ON vehicle_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete vehicle_records" ON vehicle_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view advisor_records" ON advisor_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert advisor_records" ON advisor_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update advisor_records" ON advisor_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete advisor_records" ON advisor_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view password_records" ON password_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert password_records" ON password_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update password_records" ON password_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete password_records" ON password_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view personal_property_records" ON personal_property_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert personal_property_records" ON personal_property_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update personal_property_records" ON personal_property_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete personal_property_records" ON personal_property_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view pet_records" ON pet_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert pet_records" ON pet_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update pet_records" ON pet_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete pet_records" ON pet_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view funeral_records" ON funeral_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert funeral_records" ON funeral_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update funeral_records" ON funeral_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete funeral_records" ON funeral_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view info_records" ON info_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert info_records" ON info_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update info_records" ON info_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete info_records" ON info_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can view medical_records" ON medical_records FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert medical_records" ON medical_records FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update medical_records" ON medical_records FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete medical_records" ON medical_records FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

-- Section Completion policies
CREATE POLICY "Members can view section_completion" ON section_completion FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can insert section_completion" ON section_completion FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can update section_completion" ON section_completion FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Members can delete section_completion" ON section_completion FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

-- Private Items policies
CREATE POLICY "Private items view" ON private_items FOR SELECT USING (
  (visibility = 'only_me' AND owner_user_id = auth.uid()) OR
  (visibility = 'me_and_partner' AND is_packet_member(packet_id)) OR
  (visibility = 'release_later' AND owner_user_id = auth.uid()) OR
  is_admin()
);
CREATE POLICY "Private items insert" ON private_items FOR INSERT WITH CHECK (owner_user_id = auth.uid() OR is_admin());
CREATE POLICY "Private items update" ON private_items FOR UPDATE USING (owner_user_id = auth.uid() OR is_admin());
CREATE POLICY "Private items delete" ON private_items FOR DELETE USING (owner_user_id = auth.uid() OR is_admin());

-- Documents policies
CREATE POLICY "Documents view" ON documents FOR SELECT USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Documents insert" ON documents FOR INSERT WITH CHECK (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Documents update" ON documents FOR UPDATE USING (is_packet_member(packet_id) OR is_admin());
CREATE POLICY "Documents delete" ON documents FOR DELETE USING (is_packet_member(packet_id) OR is_admin());

-- Affiliate Referrals policies
CREATE POLICY "Public can view active referrals" ON affiliate_referrals FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Professionals can view own referral data" ON affiliate_referrals FOR SELECT USING (owner_id = auth.uid());
CREATE POLICY "Admin manage referrals insert" ON affiliate_referrals FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin manage referrals update" ON affiliate_referrals FOR UPDATE USING (is_admin());
CREATE POLICY "Admin manage referrals delete" ON affiliate_referrals FOR DELETE USING (is_admin());

-- Affiliate Conversions policies
CREATE POLICY "Users can view own conversions" ON affiliate_conversions FOR SELECT USING (referred_user_id = auth.uid() OR is_admin());
CREATE POLICY "Professionals can view conversions for their code" ON affiliate_conversions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM affiliate_referrals 
    WHERE id = affiliate_referral_id AND owner_id = auth.uid()
  )
);
CREATE POLICY "Admin manage conversions insert" ON affiliate_conversions FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin manage conversions update" ON affiliate_conversions FOR UPDATE USING (is_admin());
CREATE POLICY "Admin manage conversions delete" ON affiliate_conversions FOR DELETE USING (is_admin());

-- Partner Invites policies
CREATE POLICY "Users can view own invites" ON partner_invites FOR SELECT USING (invited_by = auth.uid() OR invited_email = (SELECT email FROM profiles WHERE id = auth.uid()) OR is_admin());
CREATE POLICY "Users can insert invites" ON partner_invites FOR INSERT WITH CHECK (invited_by = auth.uid() OR is_admin());
CREATE POLICY "Admin manage invites update" ON partner_invites FOR UPDATE USING (is_admin() OR invited_by = auth.uid());
CREATE POLICY "Admin manage invites delete" ON partner_invites FOR DELETE USING (is_admin());

-- Pricing Plans policies
CREATE POLICY "Public can view active plans" ON pricing_plans FOR SELECT USING (is_active = true OR is_admin());
CREATE POLICY "Admin manage plans insert" ON pricing_plans FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin manage plans update" ON pricing_plans FOR UPDATE USING (is_admin());
CREATE POLICY "Admin manage plans delete" ON pricing_plans FOR DELETE USING (is_admin());

-- Customer Billing Profiles policies
CREATE POLICY "Users can view own billing profile" ON customer_billing_profiles FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admin manage billing profiles insert" ON customer_billing_profiles FOR INSERT WITH CHECK (is_admin() OR user_id = auth.uid());
CREATE POLICY "Admin manage billing profiles update" ON customer_billing_profiles FOR UPDATE USING (is_admin() OR user_id = auth.uid());
CREATE POLICY "Admin manage billing profiles delete" ON customer_billing_profiles FOR DELETE USING (is_admin());

-- Purchases policies
CREATE POLICY "Users can view own purchases" ON purchases FOR SELECT USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Admin manage purchases insert" ON purchases FOR INSERT WITH CHECK (is_admin());
CREATE POLICY "Admin manage purchases update" ON purchases FOR UPDATE USING (is_admin());
CREATE POLICY "Admin manage purchases delete" ON purchases FOR DELETE USING (is_admin());
