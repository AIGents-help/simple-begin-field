DROP POLICY IF EXISTS "Service role can insert access log" ON public.emergency_access_log;

CREATE POLICY "No direct client inserts to access log"
  ON public.emergency_access_log FOR INSERT
  WITH CHECK (false);