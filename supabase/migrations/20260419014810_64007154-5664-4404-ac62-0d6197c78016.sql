-- Additive migration for Passwords section revamp
-- Zero data loss: all new columns nullable, existing data preserved

ALTER TABLE public.password_records
  -- Account info
  ADD COLUMN IF NOT EXISTS website_url text,
  -- Access details
  ADD COLUMN IF NOT EXISTS two_fa_enabled boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS two_fa_method text,
  ADD COLUMN IF NOT EXISTS authenticator_app text,
  ADD COLUMN IF NOT EXISTS backup_codes_location text,
  -- Account details
  ADD COLUMN IF NOT EXISTS account_phone text,
  ADD COLUMN IF NOT EXISTS security_question_hint text,
  ADD COLUMN IF NOT EXISTS account_created_date date,
  ADD COLUMN IF NOT EXISTS subscription_cost numeric(10,2),
  ADD COLUMN IF NOT EXISTS renewal_date date,
  -- Trusted contact instructions
  ADD COLUMN IF NOT EXISTS after_death_action text,
  ADD COLUMN IF NOT EXISTS special_instructions text,
  ADD COLUMN IF NOT EXISTS handler_contact_id uuid,
  -- Crypto-specific
  ADD COLUMN IF NOT EXISTS crypto_exchange text,
  ADD COLUMN IF NOT EXISTS wallet_type text,
  ADD COLUMN IF NOT EXISTS hardware_wallet_location text,
  ADD COLUMN IF NOT EXISTS seed_phrase_location text,
  -- Social media-specific
  ADD COLUMN IF NOT EXISTS memorial_contact_name text,
  ADD COLUMN IF NOT EXISTS download_archive_instructions text,
  -- Work-specific
  ADD COLUMN IF NOT EXISTS work_company_name text,
  ADD COLUMN IF NOT EXISTS hr_contact_name text,
  ADD COLUMN IF NOT EXISTS hr_contact_phone text,
  -- Password manager (sentinel row fields)
  ADD COLUMN IF NOT EXISTS manager_name text,
  ADD COLUMN IF NOT EXISTS master_password_location text,
  ADD COLUMN IF NOT EXISTS recovery_key_location text,
  ADD COLUMN IF NOT EXISTS emergency_instructions text,
  ADD COLUMN IF NOT EXISTS trusted_person_name text,
  -- Catch-all for unmapped legacy data + extensible details
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_notes jsonb DEFAULT '{}'::jsonb;

-- Trigger function: feed paid subscriptions into document_alerts via renewal_date
CREATE OR REPLACE FUNCTION public.scan_password_renewals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_label text;
BEGIN
  IF NEW.packet_id IS NULL THEN RETURN NEW; END IF;

  -- Skip the password manager sentinel row
  IF NEW.category = '__password_manager__' THEN
    DELETE FROM public.document_alerts
    WHERE related_table = 'password_records' AND record_id = NEW.id;
    RETURN NEW;
  END IF;

  v_label := coalesce(NEW.service_name, 'Subscription');

  -- Only track renewal if it's a paid subscription with a renewal date
  IF NEW.renewal_date IS NOT NULL AND NEW.subscription_cost IS NOT NULL AND NEW.subscription_cost > 0 THEN
    PERFORM public.upsert_document_alert(
      NEW.packet_id, 'passwords', 'password_records', NEW.id,
      'subscription_renewal', v_label || ' — subscription renewal', NEW.renewal_date
    );
  ELSE
    -- Remove any stale alert if subscription is no longer paid or date cleared
    DELETE FROM public.document_alerts
    WHERE related_table = 'password_records'
      AND record_id = NEW.id
      AND document_type = 'subscription_renewal';
  END IF;

  RETURN NEW;
END $function$;

DROP TRIGGER IF EXISTS password_records_scan_renewals ON public.password_records;
CREATE TRIGGER password_records_scan_renewals
  AFTER INSERT OR UPDATE ON public.password_records
  FOR EACH ROW EXECUTE FUNCTION public.scan_password_renewals();

-- Cleanup alerts when a password record is deleted
DROP TRIGGER IF EXISTS password_records_cleanup_alerts ON public.password_records;
CREATE TRIGGER password_records_cleanup_alerts
  AFTER DELETE ON public.password_records
  FOR EACH ROW EXECUTE FUNCTION public.cleanup_document_alerts_on_delete();