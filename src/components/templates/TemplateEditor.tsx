import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import {
  legalTemplatesService,
  DocumentTemplate,
  TemplateDraft,
  extractPlaceholders,
  renderSectionBody,
  humanizePlaceholder,
} from '../../services/legalTemplatesService';
import { TemplateDisclaimerBanner } from './TemplateDisclaimerBanner';
import { FindAttorneyButton } from './FindAttorneyButton';
import { ArrowLeft, Save, Download, Printer, Link2, CheckCircle2, Lightbulb, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import jsPDF from 'jspdf';

interface Props {
  templateType: string;
  draftId?: string;
  onBack: () => void;
}

export const TemplateEditor: React.FC<Props> = ({ templateType, draftId, onBack }) => {
  const { user, currentPacket } = useAppContext();
  const [template, setTemplate] = useState<DocumentTemplate | null>(null);
  const [draft, setDraft] = useState<TemplateDraft | null>(null);
  const [values, setValues] = useState<Record<string, string>>({});
  const [title, setTitle] = useState('');
  const [saving, setSaving] = useState(false);
  const [lastSavedLabel, setLastSavedLabel] = useState<string>('');
  const [shareLink, setShareLink] = useState<string | null>(null);
  const dirtyRef = useRef(false);

  // Load template + draft
  useEffect(() => {
    let alive = true;
    const load = async () => {
      try {
        const tpl = await legalTemplatesService.getTemplate(templateType);
        if (!alive) return;
        setTemplate(tpl);
        if (!tpl) return;

        let d: TemplateDraft | null = null;
        if (draftId) {
          d = await legalTemplatesService.getDraft(draftId);
        }
        if (!d && user && currentPacket?.id) {
          const autofill = await legalTemplatesService.fetchAutofillValues(currentPacket.id);
          d = await legalTemplatesService.createDraft({
            user_id: user.id,
            packet_id: currentPacket.id,
            template_type: tpl.template_type,
            template_version: tpl.version,
            title: tpl.name,
            placeholder_values: autofill,
          });
        }
        if (!alive) return;
        if (d) {
          setDraft(d);
          setValues(d.placeholder_values || {});
          setTitle(d.title || tpl.name);
          if (d.share_token && d.share_token_expires_at && new Date(d.share_token_expires_at) > new Date()) {
            setShareLink(buildShareUrl(d.share_token));
          }
        }
      } catch (e: any) {
        toast.error(e?.message || 'Could not open template');
      }
    };
    load();
    return () => { alive = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateType, draftId]);

  const placeholders = useMemo(() => (template ? extractPlaceholders(template) : []), [template]);

  // Auto-save every 30s if dirty
  useEffect(() => {
    if (!draft) return;
    const id = setInterval(() => {
      if (dirtyRef.current) {
        save(false);
      }
    }, 30000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [draft?.id]);

  // Save on unmount if dirty
  useEffect(() => {
    return () => {
      if (dirtyRef.current && draft) {
        legalTemplatesService.updateDraft(draft.id, { placeholder_values: values, title }).catch(() => {});
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const save = async (showToast = true) => {
    if (!draft) return;
    try {
      setSaving(true);
      const updated = await legalTemplatesService.updateDraft(draft.id, {
        placeholder_values: values,
        title,
      });
      setDraft(updated);
      dirtyRef.current = false;
      setLastSavedLabel(`Saved ${new Date().toLocaleTimeString()}`);
      if (showToast) toast.success('Draft saved');
    } catch (e: any) {
      toast.error(e?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const setValue = (key: string, val: string) => {
    setValues((v) => ({ ...v, [key]: val }));
    dirtyRef.current = true;
  };

  const wordCount = useMemo(() => {
    if (!template) return 0;
    const all = template.template_content.sections
      .map((s) => renderSectionBody(s.body, values))
      .join(' ');
    return all.split(/\s+/).filter(Boolean).length;
  }, [template, values]);

  const handleDownloadPdf = async () => {
    if (!template) return;
    const doc = new jsPDF({ orientation: 'portrait', unit: 'pt', format: 'letter' });
    const w = doc.internal.pageSize.getWidth();
    const h = doc.internal.pageSize.getHeight();
    const drawDisclaimerHeader = () => {
      doc.setFillColor(254, 243, 199); // amber-100
      doc.rect(0, 0, w, 36, 'F');
      doc.setTextColor(120, 53, 15);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.text('DRAFT — NOT A LEGAL DOCUMENT  ·  Have this reviewed by a licensed attorney before relying on it.', w / 2, 22, { align: 'center' });
      // Watermark
      doc.setTextColor(230, 230, 230);
      doc.setFontSize(60);
      doc.text('DRAFT', w / 2, h / 2, { align: 'center', angle: 30 });
    };

    drawDisclaimerHeader();
    let y = 70;
    doc.setTextColor(20, 30, 60);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text(title || template.name, 48, y);
    y += 26;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text(`Generated ${new Date().toLocaleDateString()}`, 48, y);
    y += 24;

    template.template_content.sections.forEach((s) => {
      const rendered = renderSectionBody(s.body, values);
      if (y > h - 80) {
        doc.addPage();
        drawDisclaimerHeader();
        y = 70;
      }
      doc.setTextColor(20, 30, 60);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(13);
      doc.text(s.title, 48, y);
      y += 18;

      doc.setTextColor(40, 40, 40);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      const lines = doc.splitTextToSize(rendered, w - 96);
      lines.forEach((ln: string) => {
        if (y > h - 60) {
          doc.addPage();
          drawDisclaimerHeader();
          y = 70;
        }
        doc.text(ln, 48, y);
        y += 15;
      });
      y += 10;
    });

    const safe = (title || template.name).replace(/[^a-z0-9]+/gi, '-');
    doc.save(`${safe}-DRAFT.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleShare = async () => {
    if (!draft) return;
    try {
      const { token, expiresAt } = await legalTemplatesService.generateShareLink(draft.id, 7);
      const url = buildShareUrl(token);
      setShareLink(url);
      await navigator.clipboard.writeText(url).catch(() => {});
      toast.success(`Share link copied. Expires ${new Date(expiresAt).toLocaleDateString()}.`);
    } catch (e: any) {
      toast.error(e?.message || 'Could not generate link');
    }
  };

  if (!template) {
    return <div className="p-6 text-stone-500">Loading template…</div>;
  }

  const guidanceForSection = (sid: string) =>
    (template.guidance_notes || []).filter((g) => g.section === sid);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button onClick={onBack} className="inline-flex items-center gap-1 text-stone-600 text-sm hover:text-navy-deep">
          <ArrowLeft className="w-4 h-4" /> Back to Templates
        </button>
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">{lastSavedLabel}</span>
          <button onClick={() => save()} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-sm font-medium">
            <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save Draft'}
          </button>
          <button onClick={handleDownloadPdf} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-sm font-medium">
            <Download className="w-4 h-4" /> PDF
          </button>
          <button onClick={handlePrint} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-sm font-medium">
            <Printer className="w-4 h-4" /> Print
          </button>
          <button onClick={handleShare} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-stone-100 hover:bg-stone-200 text-sm font-medium">
            <Link2 className="w-4 h-4" /> Share
          </button>
        </div>
      </div>

      {/* Sticky disclaimer */}
      <div className="sticky top-0 z-10 -mx-4 sm:-mx-6 lg:-mx-8 px-4 sm:px-6 lg:px-8 py-2 bg-[#fdfaf3]">
        <TemplateDisclaimerBanner variant="editor" />
      </div>

      {/* Title input */}
      <div className="space-y-1">
        <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Document Title</label>
        <input
          value={title}
          onChange={(e) => { setTitle(e.target.value); dirtyRef.current = true; }}
          className="w-full text-2xl font-bold text-navy-deep bg-transparent border-b border-stone-200 focus:border-navy-muted focus:outline-none py-1"
        />
      </div>

      {/* Template info */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 text-sm">
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="font-semibold text-navy-deep mb-1">What this is</div>
          <p className="text-stone-600 text-xs leading-relaxed">{template.description}</p>
        </div>
        <div className="bg-white border border-stone-200 rounded-lg p-4">
          <div className="font-semibold text-navy-deep mb-1">When you need an attorney</div>
          <p className="text-stone-600 text-xs leading-relaxed">
            For final execution, witnessing, and notarization — and any time your situation is complex (blended family, business interests, special needs, multi-state assets).
          </p>
        </div>
        {template.state_specific && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="font-semibold text-blue-900 mb-1">State-specific</div>
            <p className="text-blue-900/80 text-xs leading-relaxed">
              Requirements vary significantly by state. An attorney can ensure this meets your state's requirements.
            </p>
          </div>
        )}
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Editor */}
        <div className="lg:col-span-2 space-y-5">
          {/* Placeholders panel */}
          {placeholders.length > 0 && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-navy-muted" />
                <h3 className="font-semibold text-navy-deep">Fill in your details</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {placeholders.map((ph) => {
                  const filled = !!values[ph]?.trim();
                  return (
                    <div key={ph}>
                      <label className="text-[10px] font-semibold uppercase tracking-wider text-stone-500 flex items-center gap-1">
                        {humanizePlaceholder(ph)}
                        {filled && <CheckCircle2 className="w-3 h-3 text-emerald-600" />}
                      </label>
                      <textarea
                        rows={ph.includes('LIST') || ph.includes('INSTRUCTIONS') || ph.includes('MESSAGES') || ph.includes('REFLECTIONS') ? 3 : 1}
                        value={values[ph] || ''}
                        onChange={(e) => setValue(ph, e.target.value)}
                        className="mt-1 w-full text-sm border border-stone-200 rounded-md px-3 py-2 focus:border-navy-muted focus:outline-none resize-none"
                        placeholder={`[${ph}]`}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Rendered preview */}
          <div className="bg-white border border-stone-200 rounded-xl p-6 print:border-0">
            {template.template_content.intro && (
              <p className="text-xs italic text-stone-500 mb-4">{template.template_content.intro}</p>
            )}
            {template.template_content.sections.map((s) => (
              <section key={s.id} className="mb-6">
                <h3 className="font-bold text-navy-deep mb-2">{s.title}</h3>
                <div className="text-sm text-stone-700 whitespace-pre-wrap leading-relaxed">
                  {renderWithHighlights(renderSectionBody(s.body, values))}
                </div>
                {guidanceForSection(s.id).map((g, i) => (
                  <div key={i} className="mt-2 text-xs text-amber-800 bg-amber-50 border border-amber-200 rounded-md p-2 flex gap-2">
                    <Lightbulb className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    <span>{g.tip}</span>
                  </div>
                ))}
              </section>
            ))}
            <div className="text-[10px] uppercase tracking-wider text-stone-400 mt-6 pt-4 border-t border-stone-100">
              Word count: {wordCount}
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <aside className="space-y-4">
          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <h3 className="font-semibold text-navy-deep mb-2 text-sm">Have this reviewed</h3>
            <p className="text-xs text-stone-600 mb-3">
              These templates are a starting point. A licensed attorney can finalize the document for your state.
            </p>
            <FindAttorneyButton className="w-full justify-center" label="Have This Reviewed by an Attorney" />
          </div>

          {shareLink && (
            <div className="bg-white border border-stone-200 rounded-xl p-4">
              <h3 className="font-semibold text-navy-deep mb-2 text-sm">Read-only share link</h3>
              <p className="text-xs text-stone-600 mb-2">Valid for 7 days.</p>
              <div className="text-xs bg-stone-50 border border-stone-200 rounded p-2 break-all">{shareLink}</div>
            </div>
          )}

          <div className="bg-white border border-stone-200 rounded-xl p-4">
            <h3 className="font-semibold text-navy-deep mb-2 text-sm">Tips while editing</h3>
            <ul className="text-xs text-stone-600 space-y-1.5 list-disc pl-4">
              <li>Be specific — vague language causes disputes.</li>
              <li>Talk to anyone you name (executor, guardian, agent) before listing them.</li>
              <li>Keep originals in a known, secure location.</li>
              <li>Auto-save runs every 30 seconds.</li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
};

function buildShareUrl(token: string) {
  return `${window.location.origin}/template/share/${token}`;
}

/** Highlights remaining [PLACEHOLDER] tokens in the rendered body. */
function renderWithHighlights(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  const regex = /\[([A-Z0-9_]+)\]/g;
  let lastIndex = 0;
  let m: RegExpExecArray | null;
  let i = 0;
  while ((m = regex.exec(text)) !== null) {
    if (m.index > lastIndex) parts.push(text.slice(lastIndex, m.index));
    parts.push(
      <span key={`ph-${i++}`} className="bg-amber-100 text-amber-900 px-1 rounded text-xs font-mono">
        [{m[1]}]
      </span>,
    );
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < text.length) parts.push(text.slice(lastIndex));
  return parts;
}
