// Generates a DOCX file for a Legal Document Template draft.
// Adds a disclaimer header on every page and a "DRAFT" watermark in the body.
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.45.0';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  Header,
  Footer,
  PageNumber,
  BorderStyle,
} from 'https://esm.sh/docx@8.5.0';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface TemplateSection { id: string; title: string; body: string; }

function renderBody(body: string, values: Record<string, string>): string {
  return body.replace(/\[([A-Z0-9_]+)\]/g, (_m, key) => {
    const v = values?.[key];
    return v && String(v).trim() ? String(v) : `[${key}]`;
  });
}

const DISCLAIMER =
  'DRAFT — NOT A LEGAL DOCUMENT. Have this reviewed by a licensed attorney in your state before signing or relying on it.';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claims, error: authErr } = await supabase.auth.getClaims(token);
    if (authErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    const userId = claims.claims.sub as string;

    const { draftId } = await req.json();
    if (!draftId || typeof draftId !== 'string') {
      return new Response(JSON.stringify({ error: 'draftId required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load draft (RLS enforces ownership via authHeader-bound client)
    const { data: draft, error: draftErr } = await supabase
      .from('user_template_drafts')
      .select('*')
      .eq('id', draftId)
      .eq('user_id', userId)
      .maybeSingle();

    if (draftErr || !draft) {
      return new Response(JSON.stringify({ error: 'Draft not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Load matching template definition
    const { data: tpl, error: tplErr } = await supabase
      .from('document_templates')
      .select('*')
      .eq('template_type', draft.template_type)
      .eq('version', draft.template_version)
      .maybeSingle();

    if (tplErr || !tpl) {
      return new Response(JSON.stringify({ error: 'Template not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const sections: TemplateSection[] = (tpl.template_content?.sections || []) as TemplateSection[];
    const values = (draft.placeholder_values || {}) as Record<string, string>;
    const title = draft.title || tpl.name;

    const children: Paragraph[] = [];

    // Title
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 120 },
        children: [new TextRun({ text: title, bold: true, size: 36 })],
      }),
    );
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { after: 240 },
        children: [
          new TextRun({
            text: `Generated ${new Date().toLocaleDateString()} · ${tpl.name} (v${tpl.version})`,
            italics: true,
            size: 18,
            color: '666666',
          }),
        ],
      }),
    );

    // Watermark-style notice in body
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 60, after: 240 },
        border: {
          top: { style: BorderStyle.SINGLE, size: 6, color: 'D97706' },
          bottom: { style: BorderStyle.SINGLE, size: 6, color: 'D97706' },
          left: { style: BorderStyle.SINGLE, size: 6, color: 'D97706' },
          right: { style: BorderStyle.SINGLE, size: 6, color: 'D97706' },
        },
        children: [
          new TextRun({ text: '⚠ ', bold: true, color: '92400E' }),
          new TextRun({
            text: DISCLAIMER,
            bold: true,
            size: 20,
            color: '92400E',
          }),
        ],
      }),
    );

    if (tpl.template_content?.intro) {
      children.push(
        new Paragraph({
          spacing: { after: 200 },
          children: [
            new TextRun({ text: String(tpl.template_content.intro), italics: true, size: 20, color: '666666' }),
          ],
        }),
      );
    }

    sections.forEach((s) => {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_2,
          spacing: { before: 240, after: 120 },
          children: [new TextRun({ text: s.title, bold: true, size: 26, color: '14213D' })],
        }),
      );
      const rendered = renderBody(s.body, values);
      // Split by line breaks to preserve paragraphs
      rendered.split(/\n+/).forEach((para) => {
        if (!para.trim()) return;
        children.push(
          new Paragraph({
            spacing: { after: 120, line: 320 },
            children: [new TextRun({ text: para, size: 22 })],
          }),
        );
      });
    });

    const doc = new Document({
      styles: {
        default: { document: { run: { font: 'Calibri', size: 22 } } },
      },
      sections: [
        {
          properties: {
            page: {
              size: { width: 12240, height: 15840 },
              margin: { top: 1440, right: 1440, bottom: 1440, left: 1440 },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({
                      text: 'DRAFT — NOT A LEGAL DOCUMENT · Attorney review required',
                      bold: true,
                      size: 16,
                      color: '92400E',
                    }),
                  ],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.CENTER,
                  children: [
                    new TextRun({ text: 'Page ', size: 16, color: '888888' }),
                    new TextRun({ children: [PageNumber.CURRENT], size: 16, color: '888888' }),
                    new TextRun({ text: ' · Generated by The Survivor Packet', size: 16, color: '888888' }),
                  ],
                }),
              ],
            }),
          },
          children,
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const safeName = (title || 'template').replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '');

    return new Response(buffer, {
      status: 200,
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${safeName}-DRAFT.docx"`,
      },
    });
  } catch (err: any) {
    console.error('generate-template-docx error', err);
    return new Response(JSON.stringify({ error: err?.message || 'Server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
