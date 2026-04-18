GRANT EXECUTE ON FUNCTION public.get_template_draft_by_share_token(text) TO anon, authenticated;

-- Also fetch template definition publicly so the share page can render it without auth
CREATE OR REPLACE FUNCTION public.get_template_for_share(p_template_type text, p_version text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tpl public.document_templates%ROWTYPE;
BEGIN
  SELECT * INTO v_tpl
    FROM public.document_templates
   WHERE template_type = p_template_type
     AND (version = p_version OR p_version IS NULL)
   ORDER BY version DESC
   LIMIT 1;

  IF v_tpl.id IS NULL THEN
    RETURN NULL;
  END IF;

  RETURN jsonb_build_object(
    'template_type', v_tpl.template_type,
    'version', v_tpl.version,
    'name', v_tpl.name,
    'description', v_tpl.description,
    'state_specific', v_tpl.state_specific,
    'template_content', v_tpl.template_content
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_template_for_share(text, text) TO anon, authenticated;