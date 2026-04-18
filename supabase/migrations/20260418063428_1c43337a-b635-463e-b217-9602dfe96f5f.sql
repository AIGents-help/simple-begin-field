-- App settings key/value store
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_by UUID,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view app_settings"
  ON public.app_settings FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can insert app_settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can update app_settings"
  ON public.app_settings FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "Admins can delete app_settings"
  ON public.app_settings FOR DELETE
  USING (public.is_admin());

CREATE TRIGGER update_app_settings_updated_at
  BEFORE UPDATE ON public.app_settings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('general', '{"app_name":"The Survivor Packet","support_email":"support@survivorpacket.com","default_timezone":"America/Los_Angeles","maintenance_mode":false,"maintenance_message":"We are performing scheduled maintenance. Please check back shortly."}'::jsonb),
  ('user_defaults', '{"default_plan":"free","trial_days":0,"auto_send_welcome":true,"require_email_verification":true,"allow_self_delete":true,"max_upload_mb":50,"max_storage_gb":5}'::jsonb),
  ('billing', '{"allow_lifetime":true,"allow_manual_assignment":true,"pause_max_months":"3","stripe_dashboard_url":"https://dashboard.stripe.com"}'::jsonb),
  ('email', '{"from_name":"The Survivor Packet","from_email":"hello@survivorpacket.com","reply_to":"support@survivorpacket.com","welcome_enabled":true,"payment_failed_enabled":true,"subscription_canceled_enabled":true,"password_reset_enabled":true,"trusted_contact_enabled":true,"affiliate_approved_enabled":true}'::jsonb),
  ('affiliate', '{"commission_rate":20,"discount_rate":10,"approval_mode":"manual","min_payout":50,"payout_schedule":"monthly"}'::jsonb),
  ('security', '{"session_timeout_minutes":120,"require_2fa_admin":false,"ip_allowlist":"","failed_login_limit":5,"lockout_minutes":15}'::jsonb),
  ('storage', '{"allow_video_uploads":true,"max_video_mb":200,"allowed_file_types":"pdf,jpg,jpeg,png,heic,doc,docx,xls,xlsx,mp4,mov,txt"}'::jsonb)
ON CONFLICT (key) DO NOTHING;