
-- Admin activity log
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id UUID,
  admin_email TEXT,
  target_user_id UUID,
  target_user_email TEXT,
  action TEXT NOT NULL,
  old_value JSONB,
  new_value JSONB,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity log"
ON public.admin_activity_log FOR SELECT
USING (public.is_admin());

CREATE POLICY "Admins can insert activity log"
ON public.admin_activity_log FOR INSERT
WITH CHECK (public.is_admin());

CREATE INDEX idx_admin_activity_log_created_at ON public.admin_activity_log(created_at DESC);
CREATE INDEX idx_admin_activity_log_target_user ON public.admin_activity_log(target_user_id);

-- Add pause-related fields to purchases
ALTER TABLE public.purchases
  ADD COLUMN IF NOT EXISTS paused_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_resumes_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS pause_note TEXT,
  ADD COLUMN IF NOT EXISTS paused_by UUID;
