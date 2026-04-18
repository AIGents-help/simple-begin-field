-- ============================================================
-- DOCUMENT EXPIRATION ALERT SYSTEM — PHASE 1
-- Schema, monitored-field columns, scan triggers, RLS
-- ============================================================

-- ── 1. Add missing expiry / renewal / review date columns ──────────────

-- Identity / Info section: passport, license, ID, visa, global entry
ALTER TABLE public.info_records
  ADD COLUMN IF NOT EXISTS expiry_date date;

-- Medical: insurance renewals (one date column reused per record)
ALTER TABLE public.medical_records
  ADD COLUMN IF NOT EXISTS insurance_renewal_date date;

-- Medications: optional refill due date
ALTER TABLE public.medications
  ADD COLUMN IF NOT EXISTS refill_due_date date;

-- Real Estate: flood, umbrella, home warranty, ARM adjust
ALTER TABLE public.real_estate_records
  ADD COLUMN IF NOT EXISTS flood_insurance_renewal_date date,
  ADD COLUMN IF NOT EXISTS umbrella_policy_renewal_date date,
  ADD COLUMN IF NOT EXISTS home_warranty_expiry_date date,
  ADD COLUMN IF NOT EXISTS mortgage_arm_adjustment_date date;

-- Vehicles: registration, insurance, inspection, loan payoff
ALTER TABLE public.vehicle_records
  ADD COLUMN IF NOT EXISTS registration_expiry_date date,
  ADD COLUMN IF NOT EXISTS insurance_renewal_date date,
  ADD COLUMN IF NOT EXISTS inspection_due_date date,
  ADD COLUMN IF NOT EXISTS loan_payoff_date date;

-- Legal: review dates for will / POA / trust
ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS last_reviewed_date date;

-- Personal property: insurance rider renewal
ALTER TABLE public.personal_property_records
  ADD COLUMN IF NOT EXISTS insurance_rider_renewal_date date;

-- Advisors: professional license expiry
ALTER TABLE public.advisor_records
  ADD COLUMN IF NOT EXISTS license_expiry_date date;

-- Retirement: beneficiary last reviewed
ALTER TABLE public.retirement_records
  ADD COLUMN IF NOT EXISTS beneficiary_last_reviewed_date date;

-- ── 2. notification_preferences table ──────────────────────────────────
CREATE TABLE IF NOT EXISTS public.notification_preferences (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  expiration_alerts_enabled boolean NOT NULL DEFAULT true,
  alert_90_days boolean NOT NULL DEFAULT true,
  alert_60_days boolean NOT NULL DEFAULT true,
  alert_30_days boolean NOT NULL DEFAULT true,
  alert_14_days boolean NOT NULL DEFAULT true,
  alert_7_days boolean NOT NULL DEFAULT true,
  alert_on_day boolean NOT NULL DEFAULT true,
  alert_overdue boolean NOT NULL DEFAULT true,
  delivery_method text NOT NULL DEFAULT 'email',
  monitored_sections jsonb NOT NULL DEFAULT '["info","medical","real-estate","vehicles","legal","property","advisors","retirement","investments"]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own notification_preferences"
  ON public.notification_preferences FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users insert own notification_preferences"
  ON public.notification_preferences FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users update own notification_preferences"
  ON public.notification_preferences FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users delete own notification_preferences"
  ON public.notification_preferences FOR DELETE
  USING (user_id = auth.uid() OR is_admin());

CREATE TRIGGER trg_notification_preferences_updated_at
  BEFORE UPDATE ON public.notification_preferences
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 3. document_alerts table (one row per monitored field per record) ──
CREATE TABLE IF NOT EXISTS public.document_alerts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  packet_id uuid NOT NULL,
  section_key text NOT NULL,
  related_table text NOT NULL,
  record_id uuid NOT NULL,
  document_type text NOT NULL,
  document_name text,
  expiry_date date NOT NULL,
  alert_sent_90 boolean NOT NULL DEFAULT false,
  alert_sent_60 boolean NOT NULL DEFAULT false,
  alert_sent_30 boolean NOT NULL DEFAULT false,
  alert_sent_14 boolean NOT NULL DEFAULT false,
  alert_sent_7 boolean NOT NULL DEFAULT false,
  alert_sent_0 boolean NOT NULL DEFAULT false,
  alert_sent_overdue boolean NOT NULL DEFAULT false,
  is_dismissed boolean NOT NULL DEFAULT false,
  last_alert_sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (related_table, record_id, document_type)
);

CREATE INDEX IF NOT EXISTS idx_document_alerts_user ON public.document_alerts(user_id);
CREATE INDEX IF NOT EXISTS idx_document_alerts_expiry ON public.document_alerts(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_alerts_packet ON public.document_alerts(packet_id);

ALTER TABLE public.document_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own document_alerts"
  ON public.document_alerts FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users update own document_alerts"
  ON public.document_alerts FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

-- INSERT/DELETE only via SECURITY DEFINER scan function (no client policy needed)
CREATE POLICY "Admins manage document_alerts insert"
  ON public.document_alerts FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins manage document_alerts delete"
  ON public.document_alerts FOR DELETE
  USING (is_admin());

CREATE TRIGGER trg_document_alerts_updated_at
  BEFORE UPDATE ON public.document_alerts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ── 4. Helper: upsert one document alert row ───────────────────────────
CREATE OR REPLACE FUNCTION public.upsert_document_alert(
  p_packet_id uuid,
  p_section_key text,
  p_related_table text,
  p_record_id uuid,
  p_document_type text,
  p_document_name text,
  p_expiry_date date
) RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_owner_id uuid;
  v_existing public.document_alerts%ROWTYPE;
BEGIN
  -- Resolve packet owner (the user who receives the alerts)
  SELECT owner_user_id INTO v_owner_id
  FROM public.packets WHERE id = p_packet_id;

  IF v_owner_id IS NULL THEN
    RETURN;
  END IF;

  -- If no expiry date, remove any existing alert row
  IF p_expiry_date IS NULL THEN
    DELETE FROM public.document_alerts
    WHERE related_table = p_related_table
      AND record_id = p_record_id
      AND document_type = p_document_type;
    RETURN;
  END IF;

  -- Look up any existing row for this field
  SELECT * INTO v_existing
  FROM public.document_alerts
  WHERE related_table = p_related_table
    AND record_id = p_record_id
    AND document_type = p_document_type;

  IF v_existing.id IS NULL THEN
    INSERT INTO public.document_alerts (
      user_id, packet_id, section_key, related_table, record_id,
      document_type, document_name, expiry_date
    ) VALUES (
      v_owner_id, p_packet_id, p_section_key, p_related_table, p_record_id,
      p_document_type, p_document_name, p_expiry_date
    );
  ELSE
    -- If date moved to a later future, reset alert flags
    UPDATE public.document_alerts
    SET document_name = p_document_name,
        expiry_date = p_expiry_date,
        section_key = p_section_key,
        alert_sent_90 = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_90 END,
        alert_sent_60 = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_60 END,
        alert_sent_30 = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_30 END,
        alert_sent_14 = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_14 END,
        alert_sent_7  = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_7  END,
        alert_sent_0  = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_0  END,
        alert_sent_overdue = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE alert_sent_overdue END,
        is_dismissed = CASE WHEN p_expiry_date > v_existing.expiry_date THEN false ELSE is_dismissed END,
        updated_at = now()
    WHERE id = v_existing.id;
  END IF;
END;
$$;

-- ── 5. Trigger functions per table (each scans known fields) ───────────

-- Info: passport / driver license / state ID / visa / global entry
CREATE OR REPLACE FUNCTION public.scan_info_record_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_doc_type text;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;

  -- Map category to document type
  v_doc_type := lower(coalesce(NEW.category, ''));
  IF v_doc_type NOT IN ('passport','driver_license','drivers_license','state_id','visa','global_entry','tsa_precheck') THEN
    -- Not a tracked identity doc; remove any old alert row
    DELETE FROM public.document_alerts
    WHERE related_table = 'info_records' AND record_id = NEW.id;
    RETURN NEW;
  END IF;

  PERFORM public.upsert_document_alert(
    NEW.packet_id, 'info', 'info_records', NEW.id,
    v_doc_type, NEW.title, NEW.expiry_date
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_info_records ON public.info_records;
CREATE TRIGGER trg_scan_info_records
  AFTER INSERT OR UPDATE ON public.info_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_info_record_expiries();

-- Medical: insurance renewal date
CREATE OR REPLACE FUNCTION public.scan_medical_record_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  PERFORM public.upsert_document_alert(
    NEW.packet_id, 'medical', 'medical_records', NEW.id,
    'insurance_renewal',
    coalesce(NEW.insurance_provider, NEW.provider_name) || ' insurance',
    NEW.insurance_renewal_date
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_medical_records ON public.medical_records;
CREATE TRIGGER trg_scan_medical_records
  AFTER INSERT OR UPDATE ON public.medical_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_medical_record_expiries();

-- Medications: refill due
CREATE OR REPLACE FUNCTION public.scan_medication_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  PERFORM public.upsert_document_alert(
    NEW.packet_id, 'medical', 'medications', NEW.id,
    'medication_refill', NEW.name || ' refill', NEW.refill_due_date
  );
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_medications ON public.medications;
CREATE TRIGGER trg_scan_medications
  AFTER INSERT OR UPDATE ON public.medications
  FOR EACH ROW EXECUTE FUNCTION public.scan_medication_expiries();

-- Real Estate: multiple date fields per record → multiple alert rows
CREATE OR REPLACE FUNCTION public.scan_real_estate_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;

  PERFORM public.upsert_document_alert(NEW.packet_id, 'real-estate', 'real_estate_records', NEW.id,
    'homeowner_insurance', NEW.property_label || ' — homeowner insurance', NEW.insurance_policy_renewal_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'real-estate', 'real_estate_records', NEW.id,
    'flood_insurance', NEW.property_label || ' — flood insurance', NEW.flood_insurance_renewal_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'real-estate', 'real_estate_records', NEW.id,
    'umbrella_policy', NEW.property_label || ' — umbrella policy', NEW.umbrella_policy_renewal_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'real-estate', 'real_estate_records', NEW.id,
    'home_warranty', NEW.property_label || ' — home warranty', NEW.home_warranty_expiry_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'real-estate', 'real_estate_records', NEW.id,
    'mortgage_arm_adjust', NEW.property_label || ' — ARM adjustment', NEW.mortgage_arm_adjustment_date);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_real_estate ON public.real_estate_records;
CREATE TRIGGER trg_scan_real_estate
  AFTER INSERT OR UPDATE ON public.real_estate_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_real_estate_expiries();

-- Vehicles
CREATE OR REPLACE FUNCTION public.scan_vehicle_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_label text;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  v_label := coalesce(
    NULLIF(trim(coalesce(NEW.year::text,'') || ' ' || coalesce(NEW.make,'') || ' ' || coalesce(NEW.model,'')), ''),
    'Vehicle'
  );

  PERFORM public.upsert_document_alert(NEW.packet_id, 'vehicles', 'vehicle_records', NEW.id,
    'vehicle_registration', v_label || ' — registration', NEW.registration_expiry_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'vehicles', 'vehicle_records', NEW.id,
    'auto_insurance', v_label || ' — auto insurance', NEW.insurance_renewal_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'vehicles', 'vehicle_records', NEW.id,
    'vehicle_inspection', v_label || ' — inspection', NEW.inspection_due_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'vehicles', 'vehicle_records', NEW.id,
    'auto_loan_payoff', v_label || ' — loan payoff', NEW.loan_payoff_date);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_vehicles ON public.vehicle_records;
CREATE TRIGGER trg_scan_vehicles
  AFTER INSERT OR UPDATE ON public.vehicle_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_vehicle_expiries();

-- Legal: review-by date for will/poa/trust = last_reviewed_date + 3 years
CREATE OR REPLACE FUNCTION public.scan_legal_document_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_review_due date;
  v_doc_type text;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  v_doc_type := lower(coalesce(NEW.document_type, ''));
  IF v_doc_type NOT IN ('will','poa','power_of_attorney','trust','living_will','healthcare_directive') THEN
    DELETE FROM public.document_alerts WHERE related_table = 'legal_documents' AND record_id = NEW.id;
    RETURN NEW;
  END IF;
  IF NEW.last_reviewed_date IS NOT NULL THEN
    v_review_due := NEW.last_reviewed_date + INTERVAL '3 years';
  END IF;
  PERFORM public.upsert_document_alert(NEW.packet_id, 'legal', 'legal_documents', NEW.id,
    v_doc_type || '_review', NEW.document_type || ' review', v_review_due);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_legal_documents ON public.legal_documents;
CREATE TRIGGER trg_scan_legal_documents
  AFTER INSERT OR UPDATE ON public.legal_documents
  FOR EACH ROW EXECUTE FUNCTION public.scan_legal_document_expiries();

-- Personal property: insurance rider + appraisal (3 yr)
CREATE OR REPLACE FUNCTION public.scan_personal_property_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_appraisal_due date;
  v_label text;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  v_label := coalesce(NEW.item_name, NEW.title, 'Item');
  IF NEW.last_appraisal_date IS NOT NULL THEN
    v_appraisal_due := NEW.last_appraisal_date + INTERVAL '3 years';
  END IF;
  PERFORM public.upsert_document_alert(NEW.packet_id, 'property', 'personal_property_records', NEW.id,
    'insurance_rider', v_label || ' — insurance rider', NEW.insurance_rider_renewal_date);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'property', 'personal_property_records', NEW.id,
    'appraisal_review', v_label || ' — appraisal review', v_appraisal_due);
  PERFORM public.upsert_document_alert(NEW.packet_id, 'property', 'personal_property_records', NEW.id,
    'firearm_ccw', v_label || ' — concealed carry permit', NEW.firearm_ccw_expiration);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_personal_property ON public.personal_property_records;
CREATE TRIGGER trg_scan_personal_property
  AFTER INSERT OR UPDATE ON public.personal_property_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_personal_property_expiries();

-- Advisors: professional license expiry
CREATE OR REPLACE FUNCTION public.scan_advisor_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  PERFORM public.upsert_document_alert(NEW.packet_id, 'advisors', 'advisor_records', NEW.id,
    'professional_license', coalesce(NEW.name, 'Advisor') || ' — professional license', NEW.license_expiry_date);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_advisors ON public.advisor_records;
CREATE TRIGGER trg_scan_advisors
  AFTER INSERT OR UPDATE ON public.advisor_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_advisor_expiries();

-- Retirement: beneficiary review (3 yr)
CREATE OR REPLACE FUNCTION public.scan_retirement_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_due date;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.beneficiary_last_reviewed_date IS NOT NULL THEN
    v_due := NEW.beneficiary_last_reviewed_date + INTERVAL '3 years';
  END IF;
  PERFORM public.upsert_document_alert(NEW.packet_id, 'retirement', 'retirement_records', NEW.id,
    'beneficiary_review', coalesce(NEW.institution, 'Retirement') || ' — beneficiary review', v_due);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_retirement ON public.retirement_records;
CREATE TRIGGER trg_scan_retirement
  AFTER INSERT OR UPDATE ON public.retirement_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_retirement_expiries();

-- Investments: alert if last_statement_date older than 1 year (use +1y as expiry)
CREATE OR REPLACE FUNCTION public.scan_investment_expiries()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_due date;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;
  IF NEW.last_statement_date IS NOT NULL THEN
    v_due := NEW.last_statement_date + INTERVAL '1 year';
  END IF;
  PERFORM public.upsert_document_alert(NEW.packet_id, 'investments', 'investment_records', NEW.id,
    'statement_freshness', coalesce(NEW.institution, 'Investment') || ' — statement update', v_due);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_scan_investments ON public.investment_records;
CREATE TRIGGER trg_scan_investments
  AFTER INSERT OR UPDATE ON public.investment_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_investment_expiries();

-- Cleanup on DELETE: shared trigger function
CREATE OR REPLACE FUNCTION public.cleanup_document_alerts_on_delete()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  DELETE FROM public.document_alerts
  WHERE related_table = TG_TABLE_NAME AND record_id = OLD.id;
  RETURN OLD;
END $$;

DROP TRIGGER IF EXISTS trg_cleanup_alerts_info ON public.info_records;
CREATE TRIGGER trg_cleanup_alerts_info AFTER DELETE ON public.info_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_medical ON public.medical_records;
CREATE TRIGGER trg_cleanup_alerts_medical AFTER DELETE ON public.medical_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_meds ON public.medications;
CREATE TRIGGER trg_cleanup_alerts_meds AFTER DELETE ON public.medications FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_realestate ON public.real_estate_records;
CREATE TRIGGER trg_cleanup_alerts_realestate AFTER DELETE ON public.real_estate_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_vehicles ON public.vehicle_records;
CREATE TRIGGER trg_cleanup_alerts_vehicles AFTER DELETE ON public.vehicle_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_legal ON public.legal_documents;
CREATE TRIGGER trg_cleanup_alerts_legal AFTER DELETE ON public.legal_documents FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_property ON public.personal_property_records;
CREATE TRIGGER trg_cleanup_alerts_property AFTER DELETE ON public.personal_property_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_advisors ON public.advisor_records;
CREATE TRIGGER trg_cleanup_alerts_advisors AFTER DELETE ON public.advisor_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_retirement ON public.retirement_records;
CREATE TRIGGER trg_cleanup_alerts_retirement AFTER DELETE ON public.retirement_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
DROP TRIGGER IF EXISTS trg_cleanup_alerts_investments ON public.investment_records;
CREATE TRIGGER trg_cleanup_alerts_investments AFTER DELETE ON public.investment_records FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();
