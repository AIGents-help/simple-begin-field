-- The Survivor Packet - Initial Database Migration
-- This script sets up the core schema for a household emergency preparedness application.

-- 1. EXTENSIONS
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES

-- Profiles: Extended user data linked to Supabase Auth
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    email TEXT,
    role TEXT CHECK (role IN ('user', 'admin', 'professional')) DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Packets: The root container for all household data
CREATE TABLE IF NOT EXISTS public.packets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    household_mode TEXT CHECK (household_mode IN ('single', 'couple')) DEFAULT 'single' NOT NULL,
    title TEXT,
    person_a_name TEXT,
    person_b_name TEXT,
    affiliate_code TEXT UNIQUE,
    affiliate_referrer_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    last_opened_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Packet Members: Junction table for multi-user access (e.g., partners, executors)
CREATE TABLE IF NOT EXISTS public.packet_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT CHECK (role IN ('owner', 'partner', 'viewer', 'editor')),
    household_scope TEXT CHECK (household_scope IN ('personA', 'personB', 'shared', 'full')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(packet_id, user_id)
);

-- Packet Invites: Tracking invitations to join a packet
CREATE TABLE IF NOT EXISTS public.packet_invites (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    invited_email TEXT NOT NULL,
    invited_name TEXT,
    invited_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    role TEXT CHECK (role IN ('owner', 'partner', 'viewer', 'editor')) DEFAULT 'partner',
    household_scope TEXT CHECK (household_scope IN ('personA', 'personB', 'shared', 'full')) DEFAULT 'personB',
    token TEXT UNIQUE NOT NULL,
    status TEXT CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'revoked')) DEFAULT 'pending',
    expires_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    accepted_at TIMESTAMPTZ
);

-- Section Completion: Tracking progress for each part of the packet
CREATE TABLE IF NOT EXISTS public.section_completion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    section_key TEXT NOT NULL,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    status TEXT CHECK (status IN ('empty', 'in_progress', 'complete')) DEFAULT 'empty',
    percent_complete INTEGER DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    UNIQUE(packet_id, section_key, scope)
);

-- Family Members: Emergency contacts and dependents
CREATE TABLE IF NOT EXISTS public.family_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    name TEXT NOT NULL,
    address TEXT,
    relationship TEXT,
    phone TEXT,
    email TEXT,
    birthday DATE,
    reminder_notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Real Estate: Property details, utilities, and security
CREATE TABLE IF NOT EXISTS public.real_estate_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    property_label TEXT NOT NULL,
    address TEXT,
    utilities_account_numbers JSONB,
    insurance_details TEXT,
    security_system_details TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Banking: Bank accounts and financial institutions
CREATE TABLE IF NOT EXISTS public.banking_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    institution TEXT NOT NULL,
    account_type TEXT,
    account_number_encrypted TEXT,
    account_number_masked TEXT,
    routing_number_encrypted TEXT,
    routing_number_masked TEXT,
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Retirement: 401k, IRA, and Pension details
CREATE TABLE IF NOT EXISTS public.retirement_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    account_type TEXT,
    institution TEXT,
    account_number_encrypted TEXT,
    account_number_masked TEXT,
    beneficiary_notes TEXT,
    contact_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Vehicles: Cars, boats, etc.
CREATE TABLE IF NOT EXISTS public.vehicle_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    year TEXT,
    make TEXT,
    model TEXT,
    vin TEXT,
    license_plate TEXT,
    insurance TEXT,
    lien_info TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Advisors: Lawyers, accountants, financial planners
CREATE TABLE IF NOT EXISTS public.advisor_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    advisor_type TEXT,
    name TEXT,
    firm TEXT,
    address TEXT,
    phone TEXT,
    email TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Passwords: Access instructions for digital accounts
CREATE TABLE IF NOT EXISTS public.password_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    service_name TEXT NOT NULL,
    username TEXT,
    password_encrypted TEXT,
    password_masked TEXT,
    recovery_email TEXT,
    two_fa_notes TEXT,
    access_instructions TEXT,
    who_should_access TEXT,
    notes TEXT,
    requires_reauth BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Personal Property: High-value items and heirlooms
CREATE TABLE IF NOT EXISTS public.personal_property_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    item_name TEXT,
    description TEXT,
    estimated_value NUMERIC,
    location TEXT,
    beneficiary TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Pets: Care instructions and medical info
CREATE TABLE IF NOT EXISTS public.pet_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    pet_name TEXT,
    species_breed TEXT,
    age TEXT,
    veterinarian_contact TEXT,
    medications TEXT,
    feeding_instructions TEXT,
    care_instructions TEXT,
    emergency_notes TEXT,
    microchip_info TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Funeral: Final wishes and arrangements
CREATE TABLE IF NOT EXISTS public.funeral_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    funeral_home TEXT,
    funeral_director TEXT,
    burial_or_cremation TEXT,
    service_preferences TEXT,
    religious_cultural_preferences TEXT,
    obituary_notes TEXT,
    additional_instructions TEXT,
    cemetery_plot_details TEXT,
    prepaid_arrangements TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Private Items: Records with restricted visibility
CREATE TABLE IF NOT EXISTS public.private_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    title TEXT NOT NULL,
    description TEXT,
    visibility TEXT CHECK (visibility IN ('only_me', 'me_and_partner', 'release_later')),
    owner_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    is_locked BOOLEAN DEFAULT TRUE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Documents: Metadata for files uploaded to storage
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    packet_id UUID REFERENCES public.packets(id) ON DELETE CASCADE,
    related_table TEXT,
    related_record_id UUID,
    scope TEXT CHECK (scope IN ('personA', 'personB', 'shared')),
    section_key TEXT,
    category TEXT,
    file_name TEXT,
    file_path TEXT NOT NULL,
    mime_type TEXT,
    file_size BIGINT,
    uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    is_private BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Affiliate Referrals: Tracking affiliate codes and payouts
CREATE TABLE IF NOT EXISTS public.affiliate_referrals (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_code TEXT UNIQUE NOT NULL,
    affiliate_name TEXT,
    affiliate_email TEXT,
    affiliate_type TEXT,
    payout_type TEXT CHECK (payout_type IN ('percent', 'flat')),
    payout_value NUMERIC,
    customer_discount_type TEXT CHECK (customer_discount_type IN ('percent', 'flat')),
    customer_discount_value NUMERIC,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Pricing Plans: Definitions for billing tiers
CREATE TABLE IF NOT EXISTS public.pricing_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    plan_key TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    billing_type TEXT CHECK (billing_type IN ('one_time', 'monthly', 'annual')),
    household_mode TEXT CHECK (household_mode IN ('single', 'couple')),
    price_cents INTEGER NOT NULL,
    stripe_price_id TEXT,
    stripe_product_id TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Customer Billing Profiles: Linking users to Stripe customers
CREATE TABLE IF NOT EXISTS public.customer_billing_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    stripe_customer_id TEXT UNIQUE,
    email TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Purchases: Tracking transactions and subscriptions
CREATE TABLE IF NOT EXISTS public.purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    packet_id UUID REFERENCES public.packets(id) ON DELETE SET NULL,
    pricing_plan_id UUID REFERENCES public.pricing_plans(id),
    stripe_checkout_session_id TEXT,
    stripe_subscription_id TEXT,
    stripe_payment_intent_id TEXT,
    status TEXT CHECK (status IN ('pending', 'active', 'canceled', 'expired', 'failed', 'one_time_paid')),
    billing_type TEXT CHECK (billing_type IN ('one_time', 'monthly', 'annual')),
    current_period_end TIMESTAMPTZ,
    affiliate_referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
    affiliate_code_used TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Affiliate Conversions: Tracking signups from affiliate codes
CREATE TABLE IF NOT EXISTS public.affiliate_conversions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    affiliate_referral_id UUID REFERENCES public.affiliate_referrals(id) ON DELETE SET NULL,
    purchase_id UUID REFERENCES public.purchases(id) ON DELETE SET NULL,
    packet_id UUID REFERENCES public.packets(id) ON DELETE SET NULL,
    referred_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    code_used TEXT,
    conversion_status TEXT CHECK (conversion_status IN ('lead', 'signup', 'purchase', 'paid_out')),
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2.1 VIEWS

-- Unified Search View: Combines all records into a single searchable interface
CREATE OR REPLACE VIEW public.section_records AS
SELECT id, packet_id, 'family' as section_key, name as title, relationship as description, created_at FROM public.family_members
UNION ALL
SELECT id, packet_id, 'real-estate' as section_key, property_label as title, address as description, created_at FROM public.real_estate_records
UNION ALL
SELECT id, packet_id, 'banking' as section_key, institution as title, account_type as description, created_at FROM public.banking_records
UNION ALL
SELECT id, packet_id, 'retirement' as section_key, institution as title, account_type as description, created_at FROM public.retirement_records
UNION ALL
SELECT id, packet_id, 'vehicles' as section_key, (year || ' ' || make || ' ' || model) as title, license_plate as description, created_at FROM public.vehicle_records
UNION ALL
SELECT id, packet_id, 'advisors' as section_key, name as title, advisor_type as description, created_at FROM public.advisor_records
UNION ALL
SELECT id, packet_id, 'passwords' as section_key, service_name as title, username as description, created_at FROM public.password_records
UNION ALL
SELECT id, packet_id, 'property' as section_key, item_name as title, description as description, created_at FROM public.personal_property_records
UNION ALL
SELECT id, packet_id, 'pets' as section_key, pet_name as title, species_breed as description, created_at FROM public.pet_records
UNION ALL
SELECT id, packet_id, 'funeral' as section_key, funeral_home as title, burial_or_cremation as description, created_at FROM public.funeral_records
UNION ALL
SELECT id, packet_id, 'private' as section_key, title as title, description as description, created_at FROM public.private_items;

-- 3. INDEXES
CREATE INDEX idx_packets_owner ON public.packets(owner_user_id);
CREATE INDEX idx_packet_members_packet ON public.packet_members(packet_id);
CREATE INDEX idx_packet_members_user ON public.packet_members(user_id);
CREATE INDEX idx_documents_packet ON public.documents(packet_id);
CREATE INDEX idx_documents_record ON public.documents(related_record_id);

-- 4. FUNCTIONS

-- Helper function to check if a user has access to a packet
CREATE OR REPLACE FUNCTION public.is_packet_member(p_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.packet_members
    WHERE packet_id = p_id AND user_id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. ROW LEVEL SECURITY (RLS)

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.packet_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.section_completion ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.family_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.real_estate_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banking_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retirement_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advisor_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.password_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_property_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pet_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funeral_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.private_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_billing_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.purchases ENABLE ROW LEVEL SECURITY;

-- 6. POLICIES

-- Profiles
CREATE POLICY "Users can view their own profile" ON public.profiles
    FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update their own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Packets
CREATE POLICY "Members can view their packets" ON public.packets
    FOR SELECT USING (is_packet_member(id));
CREATE POLICY "Owners can update their packets" ON public.packets
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.packet_members
            WHERE packet_id = packets.id AND user_id = auth.uid() AND role = 'owner'
        )
    );

-- Packet Members
CREATE POLICY "Members can view other members of the same packet" ON public.packet_members
    FOR SELECT USING (is_packet_member(packet_id));

-- Generic Records Policy (applied to all record tables)
-- Note: In a real migration, you'd repeat this for each table or use a more dynamic approach.
-- For this draft, I'll show the pattern for one and assume it's replicated.

DO $$
DECLARE
    t TEXT;
    record_tables TEXT[] := ARRAY[
        'family_members', 'real_estate_records', 'banking_records', 
        'retirement_records', 'vehicle_records', 'advisor_records', 
        'password_records', 'personal_property_records', 'pet_records', 
        'funeral_records'
    ];
BEGIN
    FOREACH t IN ARRAY record_tables LOOP
        EXECUTE format('CREATE POLICY "Members can view %I" ON public.%I FOR SELECT USING (is_packet_member(packet_id))', t, t);
        EXECUTE format('CREATE POLICY "Members can insert %I" ON public.%I FOR INSERT WITH CHECK (is_packet_member(packet_id))', t, t);
        EXECUTE format('CREATE POLICY "Members can update %I" ON public.%I FOR UPDATE USING (is_packet_member(packet_id))', t, t);
        EXECUTE format('CREATE POLICY "Members can delete %I" ON public.%I FOR DELETE USING (is_packet_member(packet_id))', t, t);
    END LOOP;
END $$;

-- Private Items (Specialized Policy)
CREATE POLICY "Owners can view their own private items" ON public.private_items
    FOR SELECT USING (
        auth.uid() = owner_user_id OR 
        (visibility = 'me_and_partner' AND is_packet_member(packet_id))
    );
CREATE POLICY "Owners can manage their own private items" ON public.private_items
    FOR ALL USING (auth.uid() = owner_user_id);

-- Documents
CREATE POLICY "Members can view documents" ON public.documents
    FOR SELECT USING (
        is_packet_member(packet_id) AND 
        (NOT is_private OR uploaded_by = auth.uid())
    );
CREATE POLICY "Members can upload documents" ON public.documents
    FOR INSERT WITH CHECK (is_packet_member(packet_id));

-- Section Completion
CREATE POLICY "Members can view completion stats" ON public.section_completion
    FOR SELECT USING (is_packet_member(packet_id));
CREATE POLICY "Members can update completion stats" ON public.section_completion
    FOR ALL USING (is_packet_member(packet_id));

-- Affiliate Referrals (Publicly readable for validation, but only system/admin editable)
CREATE POLICY "Anyone can view active affiliate codes" ON public.affiliate_referrals
    FOR SELECT USING (is_active = TRUE);

-- Affiliate Conversions
CREATE POLICY "Users can view their own conversions" ON public.affiliate_conversions
    FOR SELECT USING (referred_user_id = auth.uid());
CREATE POLICY "Affiliates can view conversions for their code" ON public.affiliate_conversions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.affiliate_referrals
            WHERE id = affiliate_conversions.affiliate_referral_id
            AND affiliate_email = (SELECT email FROM auth.users WHERE id = auth.uid())
        )
    );

-- Pricing Plans
CREATE POLICY "Anyone can view active pricing plans" ON public.pricing_plans
    FOR SELECT USING (is_active = TRUE);

-- Customer Billing Profiles
CREATE POLICY "Users can view their own billing profile" ON public.customer_billing_profiles
    FOR SELECT USING (user_id = auth.uid());

-- Purchases
CREATE POLICY "Users can view their own purchases" ON public.purchases
    FOR SELECT USING (user_id = auth.uid());

-- 7. TRIGGERS FOR UPDATED_AT
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DO $$
DECLARE
    t TEXT;
    updated_at_tables TEXT[] := ARRAY[
        'profiles', 'packets', 'family_members', 'real_estate_records', 
        'banking_records', 'retirement_records', 'vehicle_records', 
        'advisor_records', 'password_records', 'personal_property_records', 
        'pet_records', 'funeral_records', 'private_items',
        'customer_billing_profiles', 'purchases'
    ];
BEGIN
    FOREACH t IN ARRAY updated_at_tables LOOP
        EXECUTE format('CREATE TRIGGER update_%I_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column()', t, t);
    END LOOP;
END $$;
