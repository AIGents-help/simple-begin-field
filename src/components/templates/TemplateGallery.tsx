import React, { useEffect, useMemo, useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { legalTemplatesService, DocumentTemplate, TemplateDraft } from '../../services/legalTemplatesService';
import { TemplateDisclaimerBanner } from './TemplateDisclaimerBanner';
import { FindAttorneyButton } from './FindAttorneyButton';
import { ScrollText, Mail, HeartPulse, Stethoscope, Landmark, Package, Heart, Laptop, Flower, Baby, FileText, ArrowRight } from 'lucide-react';
import { toast } from 'sonner';

const ICONS: Record<string, React.ElementType> = {
  scroll: ScrollText,
  mail: Mail,
  'heart-pulse': HeartPulse,
  stethoscope: Stethoscope,
  landmark: Landmark,
  package: Package,
  heart: Heart,
  laptop: Laptop,
  flower: Flower,
  baby: Baby,
};

interface Props {
  onOpenTemplate: (templateType: string, draftId?: string) => void;
}

export const TemplateGallery: React.FC<Props> = ({ onOpenTemplate }) => {
  const { user, currentPacket } = useAppContext();
  const [templates, setTemplates] = useState<DocumentTemplate[]>([]);
  const [drafts, setDrafts] = useState<TemplateDraft[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!currentPacket?.id) return;
      try {
        const [t, d] = await Promise.all([
          legalTemplatesService.listTemplates(),
          legalTemplatesService.listDrafts(currentPacket.id),
        ]);
        if (!alive) return;
        setTemplates(t);
        setDrafts(d);
      } catch (e: any) {
        toast.error(e?.message || 'Could not load templates');
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [currentPacket?.id]);

  const draftsByType = useMemo(() => {
    const m = new Map<string, TemplateDraft[]>();
    drafts.forEach((d) => {
      const arr = m.get(d.template_type) || [];
      arr.push(d);
      m.set(d.template_type, arr);
    });
    return m;
  }, [drafts]);

  const handleUseTemplate = async (tpl: DocumentTemplate) => {
    if (!user || !currentPacket?.id) {
      toast.error('You need to be signed in.');
      return;
    }
    try {
      const autofill = await legalTemplatesService.fetchAutofillValues(currentPacket.id);
      const draft = await legalTemplatesService.createDraft({
        user_id: user.id,
        packet_id: currentPacket.id,
        template_type: tpl.template_type,
        template_version: tpl.version,
        title: tpl.name,
        placeholder_values: autofill,
      });
      onOpenTemplate(tpl.template_type, draft.id);
    } catch (e: any) {
      toast.error(e?.message || 'Could not start template');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-navy-deep">Legal Document Templates</h1>
        <p className="text-stone-600 mt-1 text-sm">
          Starting points to help you organize your wishes and prepare for a conversation with an attorney.
        </p>
      </div>

      <TemplateDisclaimerBanner variant="gallery" />

      <div className="flex flex-wrap gap-3">
        <FindAttorneyButton />
      </div>

      {loading ? (
        <div className="text-stone-500 text-sm">Loading templates…</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((tpl) => {
            const Icon = ICONS[tpl.icon || ''] || FileText;
            const existingDrafts = draftsByType.get(tpl.template_type) || [];
            return (
              <div key={tpl.id} className="bg-white border border-stone-200 rounded-xl p-5 flex flex-col">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-navy-muted/10 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-navy-muted" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-navy-deep leading-tight">{tpl.name}</h3>
                    <p className="text-xs text-stone-500 mt-1">{tpl.description}</p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-1.5">
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600">
                    {tpl.complexity}
                  </span>
                  <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">
                    Attorney Review Recommended
                  </span>
                  {tpl.state_specific && (
                    <span className="text-[10px] uppercase font-semibold tracking-wider px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">
                      State-Specific
                    </span>
                  )}
                </div>

                {existingDrafts.length > 0 && (
                  <div className="mt-3 space-y-1">
                    <div className="text-[10px] font-semibold uppercase tracking-wider text-stone-500">Your drafts</div>
                    {existingDrafts.map((d) => (
                      <button
                        key={d.id}
                        onClick={() => onOpenTemplate(tpl.template_type, d.id)}
                        className="w-full text-left text-xs text-navy-muted hover:underline truncate"
                      >
                        {d.title || 'Untitled'} · {new Date(d.last_saved_at).toLocaleDateString()}
                      </button>
                    ))}
                  </div>
                )}

                <button
                  onClick={() => handleUseTemplate(tpl)}
                  className="mt-4 w-full inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-navy-muted text-white text-sm font-semibold hover:bg-navy-muted/90 transition"
                >
                  Use Template <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
