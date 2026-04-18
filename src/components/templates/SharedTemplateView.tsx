import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { TemplateDisclaimerBanner } from './TemplateDisclaimerBanner';
import { renderSectionBody } from '../../services/legalTemplatesService';
import { Printer, FileText, AlertTriangle } from 'lucide-react';

interface SharedDraft {
  id: string;
  template_type: string;
  template_version: string;
  title: string | null;
  placeholder_values: Record<string, string>;
  last_saved_at: string;
  expires_at: string | null;
}

interface SharedTemplate {
  template_type: string;
  version: string;
  name: string;
  description: string | null;
  state_specific: boolean;
  template_content: { intro?: string; sections: { id: string; title: string; body: string }[] };
}

export const SharedTemplateView: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState<SharedDraft | null>(null);
  const [tpl, setTpl] = useState<SharedTemplate | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!token) {
        setError('Missing share link');
        setLoading(false);
        return;
      }
      try {
        const { data, error: rpcErr } = await supabase.rpc(
          'get_template_draft_by_share_token' as any,
          { p_token: token } as any,
        );
        if (!alive) return;
        if (rpcErr) throw rpcErr;
        if (!data) {
          setError('This share link is invalid or has been revoked.');
          setLoading(false);
          return;
        }
        const obj = data as any;
        if (obj.error === 'expired') {
          setError('This share link has expired. Ask the owner for a fresh link.');
          setLoading(false);
          return;
        }
        setDraft(obj as SharedDraft);

        const { data: tplData, error: tplErr } = await supabase.rpc(
          'get_template_for_share' as any,
          { p_template_type: obj.template_type, p_version: obj.template_version } as any,
        );
        if (!alive) return;
        if (tplErr) throw tplErr;
        if (!tplData) {
          setError('Template definition could not be loaded.');
          setLoading(false);
          return;
        }
        setTpl(tplData as SharedTemplate);
      } catch (e: any) {
        if (alive) setError(e?.message || 'Could not load shared template.');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [token]);

  const expiresLabel = useMemo(() => {
    if (!draft?.expires_at) return null;
    return new Date(draft.expires_at).toLocaleDateString();
  }, [draft?.expires_at]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center">
        <div className="text-stone-500 text-sm">Loading shared template…</div>
      </div>
    );
  }

  if (error || !draft || !tpl) {
    return (
      <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-stone-200 rounded-2xl p-8 text-center">
          <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto mb-3" />
          <h1 className="text-xl font-bold text-navy-deep mb-2">Link Unavailable</h1>
          <p className="text-stone-600 text-sm mb-4">{error || 'This shared draft could not be loaded.'}</p>
          <Link to="/" className="text-navy-muted text-sm font-semibold underline">Return to The Survivor Packet</Link>
        </div>
      </div>
    );
  }

  const sections = tpl.template_content?.sections || [];

  return (
    <div className="min-h-screen bg-[#fdfaf3]">
      {/* Persistent disclaimer */}
      <div className="sticky top-0 z-20 bg-amber-100 border-b-2 border-amber-300 px-4 py-2.5 print:static">
        <div className="max-w-4xl mx-auto flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <p className="text-xs sm:text-sm text-amber-900 font-medium leading-snug">
            <strong>DRAFT — NOT A LEGAL DOCUMENT.</strong> This template is a starting point shared by its author for your review.
            It has not been reviewed or executed by an attorney and is not legally binding.
          </p>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between gap-3 mb-6 flex-wrap print:hidden">
          <div className="flex items-center gap-2 text-stone-500 text-xs">
            <FileText className="w-4 h-4" />
            <span>Shared from The Survivor Packet</span>
            {expiresLabel && <span>· Link expires {expiresLabel}</span>}
          </div>
          <button
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-navy-muted text-white text-sm font-semibold hover:bg-navy-muted/90"
          >
            <Printer className="w-4 h-4" /> Print / Save as PDF
          </button>
        </div>

        <div className="bg-white border border-stone-200 rounded-2xl p-6 sm:p-10 print:border-0 print:rounded-none print:p-0">
          <h1 className="text-3xl font-bold text-navy-deep">{draft.title || tpl.name}</h1>
          <p className="text-stone-500 text-sm mt-1">
            {tpl.name} · Version {tpl.version} · Last edited {new Date(draft.last_saved_at).toLocaleDateString()}
          </p>

          <div className="mt-6">
            <TemplateDisclaimerBanner variant="editor" />
          </div>

          {tpl.state_specific && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-900">
              <strong>State-specific:</strong> Requirements vary significantly by state. An attorney can ensure this meets the signer's state requirements.
            </div>
          )}

          {tpl.template_content?.intro && (
            <p className="mt-6 text-sm italic text-stone-600">{tpl.template_content.intro}</p>
          )}

          <div className="mt-8 space-y-8">
            {sections.map((s) => (
              <section key={s.id}>
                <h2 className="text-lg font-bold text-navy-deep mb-2">{s.title}</h2>
                <div className="text-sm text-stone-800 whitespace-pre-wrap leading-relaxed">
                  {renderSectionBody(s.body, draft.placeholder_values || {})}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 pt-6 border-t border-stone-200 text-[11px] text-stone-500 italic">
            DRAFT — Not a legal document. Reviewing attorney: please advise the author on state-specific requirements,
            execution formalities (witnesses, notary), and any provisions to add or remove before signing.
          </div>
        </div>
      </div>
    </div>
  );
};
