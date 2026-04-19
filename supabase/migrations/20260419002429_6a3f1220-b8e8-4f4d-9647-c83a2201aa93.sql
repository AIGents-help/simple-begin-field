-- Add structured columns for the Legal section card system.
-- All additive — no existing columns are removed or altered.

ALTER TABLE public.legal_documents
  ADD COLUMN IF NOT EXISTS document_name text,
  ADD COLUMN IF NOT EXISTS attorney_email text,
  ADD COLUMN IF NOT EXISTS executor_name text,
  ADD COLUMN IF NOT EXISTS alternate_executor_name text,
  ADD COLUMN IF NOT EXISTS trust_type text,
  ADD COLUMN IF NOT EXISTS trustee_name text,
  ADD COLUMN IF NOT EXISTS successor_trustee_name text,
  ADD COLUMN IF NOT EXISTS assets_in_trust text,
  ADD COLUMN IF NOT EXISTS agent_name text,
  ADD COLUMN IF NOT EXISTS agent_phone text,
  ADD COLUMN IF NOT EXISTS agent_email text,
  ADD COLUMN IF NOT EXISTS alternate_agent_name text,
  ADD COLUMN IF NOT EXISTS effective_when text,
  ADD COLUMN IF NOT EXISTS is_durable boolean,
  ADD COLUMN IF NOT EXISTS life_sustaining_preference text,
  ADD COLUMN IF NOT EXISTS artificial_nutrition_preference text,
  ADD COLUMN IF NOT EXISTS pain_management_preference text,
  ADD COLUMN IF NOT EXISTS organ_donation_preference text,
  ADD COLUMN IF NOT EXISTS guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_phone text,
  ADD COLUMN IF NOT EXISTS guardian_email text,
  ADD COLUMN IF NOT EXISTS alternate_guardian_name text,
  ADD COLUMN IF NOT EXISTS guardian_reasoning text,
  ADD COLUMN IF NOT EXISTS parties_involved text,
  ADD COLUMN IF NOT EXISTS other_subtype text,
  ADD COLUMN IF NOT EXISTS details jsonb DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS legacy_notes text;

CREATE INDEX IF NOT EXISTS legal_documents_type_idx
  ON public.legal_documents (packet_id, document_type);
