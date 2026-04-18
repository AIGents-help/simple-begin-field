-- =========================================================================
-- DOCUMENT TEMPLATES (master library, admin-managed)
-- =========================================================================
CREATE TABLE public.document_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_type text NOT NULL,
  version text NOT NULL DEFAULT '1.0',
  name text NOT NULL,
  description text,
  complexity text NOT NULL DEFAULT 'Simple', -- Simple | Moderate | Complex
  icon text,
  state_specific boolean NOT NULL DEFAULT false,
  template_content jsonb NOT NULL DEFAULT '{}'::jsonb,
  guidance_notes jsonb NOT NULL DEFAULT '[]'::jsonb,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(template_type, version)
);

ALTER TABLE public.document_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone signed in can view active templates"
  ON public.document_templates FOR SELECT
  TO authenticated
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins manage templates insert"
  ON public.document_templates FOR INSERT
  WITH CHECK (is_admin());

CREATE POLICY "Admins manage templates update"
  ON public.document_templates FOR UPDATE
  USING (is_admin());

CREATE POLICY "Admins manage templates delete"
  ON public.document_templates FOR DELETE
  USING (is_admin());

CREATE TRIGGER trg_document_templates_updated
  BEFORE UPDATE ON public.document_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_document_templates_type_active ON public.document_templates(template_type, is_active);

-- =========================================================================
-- USER TEMPLATE DRAFTS
-- =========================================================================
CREATE TABLE public.user_template_drafts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  packet_id uuid NOT NULL,
  template_type text NOT NULL,
  template_version text NOT NULL,
  title text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  placeholder_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  last_saved_at timestamptz NOT NULL DEFAULT now(),
  is_complete boolean NOT NULL DEFAULT false,
  share_token text UNIQUE,
  share_token_expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_template_drafts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view own drafts"
  ON public.user_template_drafts FOR SELECT
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can insert own drafts"
  ON public.user_template_drafts FOR INSERT
  WITH CHECK (is_packet_member(packet_id) AND user_id = auth.uid());

CREATE POLICY "Members can update own drafts"
  ON public.user_template_drafts FOR UPDATE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE POLICY "Members can delete own drafts"
  ON public.user_template_drafts FOR DELETE
  USING (is_packet_member(packet_id) OR is_admin());

CREATE TRIGGER trg_user_template_drafts_updated
  BEFORE UPDATE ON public.user_template_drafts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE INDEX idx_user_template_drafts_packet ON public.user_template_drafts(packet_id, template_type);
CREATE INDEX idx_user_template_drafts_share_token ON public.user_template_drafts(share_token) WHERE share_token IS NOT NULL;

-- RPC for share-token read access (anonymous via edge function or signed-in attorney)
CREATE OR REPLACE FUNCTION public.get_template_draft_by_share_token(p_token text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_draft public.user_template_drafts%ROWTYPE;
BEGIN
  SELECT * INTO v_draft
    FROM public.user_template_drafts
   WHERE share_token = p_token
   LIMIT 1;

  IF v_draft.id IS NULL THEN
    RETURN NULL;
  END IF;

  IF v_draft.share_token_expires_at IS NOT NULL AND v_draft.share_token_expires_at < now() THEN
    RETURN jsonb_build_object('error', 'expired');
  END IF;

  RETURN jsonb_build_object(
    'id', v_draft.id,
    'template_type', v_draft.template_type,
    'template_version', v_draft.template_version,
    'title', v_draft.title,
    'content', v_draft.content,
    'placeholder_values', v_draft.placeholder_values,
    'last_saved_at', v_draft.last_saved_at,
    'expires_at', v_draft.share_token_expires_at
  );
END;
$$;

-- =========================================================================
-- SEED THE 10 STARTER TEMPLATES
-- =========================================================================
INSERT INTO public.document_templates (template_type, version, name, description, complexity, icon, state_specific, template_content, guidance_notes) VALUES

('simple_will', '1.0', 'Simple Will', 'A starter Will covering executor, guardian, and basic bequests.', 'Moderate', 'scroll', true,
 '{"intro":"This template helps you organize your wishes for an attorney to formalize.","sections":[
   {"id":"declaration","title":"Declaration","body":"I, [FULL_LEGAL_NAME], residing at [ADDRESS], being of sound mind, declare this to be my Last Will and Testament, and revoke all prior wills and codicils. Date of birth: [DATE_OF_BIRTH]."},
   {"id":"executor","title":"Executor Designation","body":"I appoint [EXECUTOR_NAME] as the Executor of my estate. If they are unable or unwilling to serve, I appoint [ALTERNATE_EXECUTOR] as alternate."},
   {"id":"guardian","title":"Guardian Designation (if minor children)","body":"If I die leaving minor children, I appoint [GUARDIAN_NAME] as their guardian. Alternate: [ALTERNATE_GUARDIAN]."},
   {"id":"bequests","title":"Specific Bequests","body":"[SPECIFIC_BEQUESTS]"},
   {"id":"residuary","title":"Residuary Estate","body":"I give the remainder of my estate to [RESIDUARY_BENEFICIARY]."},
   {"id":"digital","title":"Digital Assets","body":"My Executor shall have full authority over my digital accounts and assets, consistent with applicable law."},
   {"id":"signature","title":"Signature & Witnesses","body":"Signed: __________________   Date: [SIGNING_DATE]\\nWitness 1: __________________\\nWitness 2: __________________\\nNotary (if required): __________________"}
 ]}'::jsonb,
 '[
   {"section":"executor","tip":"Choose someone organized, trustworthy, and willing — talk to them first."},
   {"section":"guardian","tip":"Always name an alternate guardian in case your first choice cannot serve."},
   {"section":"signature","tip":"Most states require 2 witnesses who are not beneficiaries. Some require notarization."}
 ]'::jsonb),

('letter_of_instruction', '1.0', 'Letter of Instruction', 'A practical companion to your Will explaining where things are and what to do.', 'Simple', 'mail', false,
 '{"intro":"Not a legal document — a roadmap for your loved ones.","sections":[
   {"id":"personal","title":"Personal Information","body":"Name: [FULL_LEGAL_NAME]\\nDOB: [DATE_OF_BIRTH]\\nSSN location: [SSN_LOCATION]"},
   {"id":"documents","title":"Location of Important Documents","body":"[DOCUMENT_LOCATIONS]"},
   {"id":"digital","title":"Digital Accounts","body":"See the Digital Asset Instruction Letter and the Passwords section of the packet."},
   {"id":"funeral","title":"Funeral Wishes Summary","body":"[FUNERAL_SUMMARY]"},
   {"id":"checklist","title":"Immediate Action Checklist","body":"1. Contact [PRIMARY_CONTACT]\\n2. Notify employer at [EMPLOYER]\\n3. Locate Will at [WILL_LOCATION]\\n4. Contact attorney [ATTORNEY_NAME]"},
   {"id":"contacts","title":"Key Contacts","body":"Attorney: [ATTORNEY_NAME] [ATTORNEY_PHONE]\\nAccountant: [ACCOUNTANT_NAME]\\nFinancial Advisor: [ADVISOR_NAME]"},
   {"id":"messages","title":"Personal Messages","body":"[PERSONAL_MESSAGES]"}
 ]}'::jsonb,
 '[{"section":"checklist","tip":"Order matters — the first 72 hours are the most important."}]'::jsonb),

('healthcare_directive', '1.0', 'Healthcare Directive / Living Will', 'Your wishes for end-of-life medical care.', 'Moderate', 'heart-pulse', true,
 '{"intro":"Document your wishes for medical decisions if you cannot speak for yourself.","sections":[
   {"id":"declaration","title":"Declaration","body":"I, [FULL_LEGAL_NAME], being of sound mind, declare these to be my wishes regarding medical care."},
   {"id":"life_sustaining","title":"Life-Sustaining Treatment","body":"[LIFE_SUSTAINING_PREFERENCES]"},
   {"id":"nutrition","title":"Artificial Nutrition & Hydration","body":"[NUTRITION_PREFERENCES]"},
   {"id":"pain","title":"Pain Management","body":"I request that pain medication be administered to keep me comfortable, even if it may shorten life."},
   {"id":"organ","title":"Organ Donation","body":"[ORGAN_DONATION_WISHES]"},
   {"id":"pregnancy","title":"Pregnancy Clause (if applicable)","body":"[PREGNANCY_CLAUSE]"},
   {"id":"signature","title":"Signature & Witnesses","body":"Signed: __________________ Date: [SIGNING_DATE]\\nWitness 1: __________________\\nWitness 2: __________________"}
 ]}'::jsonb,
 '[
   {"section":"declaration","tip":"This document only takes effect if you cannot communicate your own wishes."},
   {"section":"signature","tip":"Keep copies with your doctor, hospital, and healthcare agent."}
 ]'::jsonb),

('healthcare_poa', '1.0', 'Healthcare Power of Attorney', 'Names someone to make medical decisions when you cannot.', 'Moderate', 'stethoscope', true,
 '{"sections":[
   {"id":"agent","title":"Agent Designation","body":"I, [FULL_LEGAL_NAME], appoint [AGENT_NAME] as my healthcare agent. If unable to serve, I appoint [ALTERNATE_AGENT]."},
   {"id":"powers","title":"Agent''s Powers","body":"My agent may consent to or refuse medical treatment, access medical records, and make end-of-life decisions consistent with my Healthcare Directive."},
   {"id":"limits","title":"Limitations","body":"[LIMITATIONS]"},
   {"id":"effective","title":"Effective Date","body":"This authority becomes effective [EFFECTIVE_TRIGGER]."},
   {"id":"guardian","title":"Nomination of Guardian","body":"If a guardian is needed, I nominate [GUARDIAN_NAME]."},
   {"id":"signature","title":"Signature & Notary","body":"Signed: __________________ Date: [SIGNING_DATE]\\nNotary: __________________"}
 ]}'::jsonb,
 '[{"section":"agent","tip":"Choose someone who can stay calm under pressure and will honor your wishes."}]'::jsonb),

('financial_poa', '1.0', 'Financial Power of Attorney', 'Names someone to manage your finances if you cannot.', 'Complex', 'landmark', true,
 '{"sections":[
   {"id":"agent","title":"Agent Designation","body":"I, [FULL_LEGAL_NAME], appoint [AGENT_NAME] as my Financial Agent. Alternate: [ALTERNATE_AGENT]."},
   {"id":"powers","title":"Powers Granted","body":"[POWERS_GRANTED]"},
   {"id":"timing","title":"Springing vs Immediate","body":"[EFFECTIVE_TIMING]"},
   {"id":"durability","title":"Durability","body":"This power of attorney is durable and survives my incapacity."},
   {"id":"limits","title":"Limitations","body":"[LIMITATIONS]"},
   {"id":"signature","title":"Signature & Notary","body":"Signed: __________________ Date: [SIGNING_DATE]\\nNotary: __________________"}
 ]}'::jsonb,
 '[{"section":"powers","tip":"Be specific. A general grant gives broad control — narrow it if you only want certain powers granted."}]'::jsonb),

('personal_property_memorandum', '1.0', 'Personal Property Memorandum', 'A list of specific items and who should receive them.', 'Simple', 'package', false,
 '{"intro":"Referenced by your Will. Many states allow this list to be updated without re-executing the Will.","sections":[
   {"id":"declaration","title":"Declaration","body":"I, [FULL_LEGAL_NAME], make this Personal Property Memorandum referenced in my Will."},
   {"id":"items","title":"Items & Recipients","body":"[ITEMS_LIST]"},
   {"id":"signature","title":"Signature","body":"Signed: __________________ Date: [SIGNING_DATE]"}
 ]}'::jsonb,
 '[{"section":"items","tip":"Be specific — “my grandfather''s gold watch” beats “a watch.”"}]'::jsonb),

('letter_to_loved_ones', '1.0', 'Letter to Loved Ones', 'A personal letter sharing reflections, values, and messages.', 'Simple', 'heart', false,
 '{"sections":[
   {"id":"opening","title":"Opening","body":"To my dearest [RECIPIENTS],"},
   {"id":"reflections","title":"Life Reflections","body":"[LIFE_REFLECTIONS]"},
   {"id":"values","title":"Values & Lessons","body":"[VALUES_LESSONS]"},
   {"id":"messages","title":"Specific Messages","body":"[INDIVIDUAL_MESSAGES]"},
   {"id":"gratitude","title":"Forgiveness & Gratitude","body":"[GRATITUDE]"},
   {"id":"wishes","title":"Final Wishes","body":"[FINAL_WISHES]"},
   {"id":"signoff","title":"Sign-off","body":"With all my love,\\n[FULL_LEGAL_NAME]"}
 ]}'::jsonb,
 '[{"section":"messages","tip":"Specific memories carry more weight than abstract sentiments."}]'::jsonb),

('digital_asset_letter', '1.0', 'Digital Asset Instruction Letter', 'Guidance for handling your digital accounts and assets.', 'Moderate', 'laptop', false,
 '{"sections":[
   {"id":"overview","title":"Overview","body":"This letter helps my Executor handle my digital life. Passwords are stored separately in the Survivor Packet."},
   {"id":"social","title":"Social Media","body":"[SOCIAL_MEDIA_INSTRUCTIONS]"},
   {"id":"email","title":"Email Accounts","body":"[EMAIL_INSTRUCTIONS]"},
   {"id":"crypto","title":"Cryptocurrency & Digital Assets","body":"[CRYPTO_LOCATION]"},
   {"id":"subscriptions","title":"Subscriptions to Cancel","body":"[SUBSCRIPTIONS]"},
   {"id":"photos","title":"Digital Photos & Files","body":"[PHOTOS_LOCATION]"},
   {"id":"businesses","title":"Domains & Online Businesses","body":"[DOMAINS_BUSINESSES]"}
 ]}'::jsonb,
 '[{"section":"crypto","tip":"Never write seed phrases in this letter — describe where they are stored, not what they are."}]'::jsonb),

('funeral_instruction_letter', '1.0', 'Funeral Instruction Letter', 'Formatted instructions for your funeral home.', 'Simple', 'flower', false,
 '{"sections":[
   {"id":"personal","title":"Personal Information","body":"Name: [FULL_LEGAL_NAME]\\nDOB: [DATE_OF_BIRTH]"},
   {"id":"disposition","title":"Disposition Preferences","body":"[BURIAL_OR_CREMATION]"},
   {"id":"service","title":"Service Preferences","body":"[SERVICE_PREFERENCES]"},
   {"id":"obituary","title":"Obituary","body":"[OBITUARY_TEXT]"},
   {"id":"music","title":"Music","body":"[MUSIC_LIST]"},
   {"id":"flowers","title":"Flowers","body":"[FLOWERS_PREFERENCES]"},
   {"id":"reception","title":"Reception","body":"[RECEPTION_WISHES]"},
   {"id":"prepaid","title":"Pre-paid Arrangements","body":"[PREPAID_ARRANGEMENTS]"},
   {"id":"funeral_home","title":"Funeral Home","body":"[FUNERAL_HOME]"}
 ]}'::jsonb,
 '[{"section":"funeral_home","tip":"Pre-paid plans should be confirmed in writing — include the contract number if possible."}]'::jsonb),

('guardianship_nomination', '1.0', 'Guardianship Nomination Letter', 'A letter nominating a guardian for your minor children.', 'Moderate', 'baby', true,
 '{"sections":[
   {"id":"nomination","title":"Nomination","body":"I, [FULL_LEGAL_NAME], nominate [GUARDIAN_NAME] as guardian of my minor children: [CHILDREN_NAMES]. Alternate: [ALTERNATE_GUARDIAN]."},
   {"id":"reasons","title":"Reasons for Nomination","body":"[REASONS]"},
   {"id":"responsibilities","title":"Guardian''s Responsibilities","body":"[RESPONSIBILITIES]"},
   {"id":"care","title":"Special Care Instructions","body":"[CARE_INSTRUCTIONS]"},
   {"id":"financial","title":"Financial Provisions","body":"[FINANCIAL_PROVISIONS]"},
   {"id":"education","title":"Educational Preferences","body":"[EDUCATION_PREFERENCES]"},
   {"id":"religious","title":"Religious / Cultural","body":"[RELIGIOUS_CULTURAL]"},
   {"id":"signature","title":"Signature","body":"Signed: __________________ Date: [SIGNING_DATE]"}
 ]}'::jsonb,
 '[{"section":"nomination","tip":"Talk to the person before naming them — guardianship is a profound commitment."}]'::jsonb);
