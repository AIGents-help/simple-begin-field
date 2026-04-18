import React, { useMemo, useState } from 'react';
import { X, Download, Loader2, ShieldCheck, ShieldAlert, FileText, Layers, AlertTriangle, Check } from 'lucide-react';
import { toast } from 'sonner';
import { SECTIONS_CONFIG } from '@/config/sectionsConfig';
import { packetPdfService } from '@/services/packetPdfService';

interface DownloadConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  packetId?: string;
  defaultSection?: string;       // open with one section preselected
  initialIncludeSensitive?: boolean;
  onComplete?: () => void;
}

const NON_DOWNLOADABLE = new Set(['affiliate']); // not part of packet PDF
const DEFAULT_SECTIONS = SECTIONS_CONFIG
  .filter((s) => !NON_DOWNLOADABLE.has(s.id))
  .map((s) => s.id);

export const DownloadConfigModal: React.FC<DownloadConfigModalProps> = ({
  isOpen,
  onClose,
  packetId,
  defaultSection,
  initialIncludeSensitive = false,
  onComplete,
}) => {
  const [scope, setScope] = useState<'all' | 'selected'>(defaultSection ? 'selected' : 'all');
  const [selected, setSelected] = useState<Set<string>>(
    new Set(defaultSection ? [defaultSection] : DEFAULT_SECTIONS),
  );
  const [redact, setRedact] = useState<boolean>(!initialIncludeSensitive);
  const [format, setFormat] = useState<'full' | 'summary'>('full');
  const [includeCover, setIncludeCover] = useState(true);
  const [includeWatermark, setIncludeWatermark] = useState(true);
  const [confirmingSensitive, setConfirmingSensitive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(0);

  const sections = useMemo(
    () => SECTIONS_CONFIG.filter((s) => !NON_DOWNLOADABLE.has(s.id)),
    [],
  );

  if (!isOpen) return null;

  const toggleSection = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
    if (scope !== 'selected') setScope('selected');
  };

  const handleSelectAll = () => {
    setSelected(new Set(DEFAULT_SECTIONS));
    setScope('all');
  };

  const handleClearAll = () => {
    setSelected(new Set());
    setScope('selected');
  };

  const requestGenerate = () => {
    if (!redact && !confirmingSensitive) {
      setConfirmingSensitive(true);
      return;
    }
    void doGenerate();
  };

  const doGenerate = async () => {
    setConfirmingSensitive(false);
    setGenerating(true);
    setProgress(8);

    // Soft progress simulation while the edge function runs
    const tick = setInterval(() => {
      setProgress((p) => (p < 88 ? p + Math.random() * 8 : p));
    }, 350);

    try {
      const finalSections = scope === 'all'
        ? DEFAULT_SECTIONS
        : Array.from(selected);
      if (finalSections.length === 0) {
        throw new Error('Pick at least one section to include.');
      }

      const result = await packetPdfService.generate({
        packetId,
        sections: finalSections,
        redactSensitive: redact,
        format,
        includeCover,
        includeWatermark,
        downloadType: finalSections.length === 1 ? 'section' : 'full_packet',
      });

      setProgress(100);
      toast.success(`Downloaded ${result.filename}`);
      onComplete?.();
      setTimeout(() => {
        onClose();
        setProgress(0);
      }, 600);
    } catch (err: any) {
      console.error('[DownloadConfigModal] generation failed', err);
      toast.error(err.message || 'PDF generation failed', {
        action: { label: 'Retry', onClick: () => void doGenerate() },
        duration: 8000,
      });
      setProgress(0);
    } finally {
      clearInterval(tick);
      setGenerating(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/50 p-0 md:p-4"
      onClick={onClose}
    >
      <div
        className="bg-white w-full md:max-w-2xl rounded-t-3xl md:rounded-3xl shadow-2xl max-h-[92vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-stone-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 flex items-center justify-center">
              <Download size={18} className="text-teal-600" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-navy-muted">Download Your Packet</h3>
              <p className="text-xs text-stone-500">Configure what to include in your PDF</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200"
            aria-label="Close"
          >
            <X size={16} className="text-stone-600" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
          {/* Sections */}
          <section>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Layers size={14} className="text-stone-400" />
                <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">What to include</h4>
              </div>
              <div className="flex gap-2 text-[11px] font-bold">
                <button onClick={handleSelectAll} className="text-teal-700 hover:underline">All</button>
                <span className="text-stone-300">·</span>
                <button onClick={handleClearAll} className="text-stone-500 hover:underline">None</button>
              </div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {sections.map((s) => {
                const checked = scope === 'all' || selected.has(s.id);
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => toggleSection(s.id)}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-all ${
                      checked
                        ? 'border-teal-500 bg-teal-50/60 text-navy-muted'
                        : 'border-stone-200 bg-white text-stone-500 hover:border-stone-300'
                    }`}
                  >
                    <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 ${
                      checked ? 'bg-teal-100 text-teal-700' : 'bg-stone-100 text-stone-400'
                    }`}>
                      {checked ? <Check size={14} /> : <Icon size={14} />}
                    </div>
                    <span className="text-xs font-bold leading-tight truncate">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Sensitive */}
          <section>
            <div className="flex items-center gap-2 mb-3">
              {redact ? <ShieldCheck size={14} className="text-emerald-600" /> : <ShieldAlert size={14} className="text-amber-600" />}
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500">Sensitive fields</h4>
            </div>
            <div className="space-y-2">
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                redact ? 'border-emerald-300 bg-emerald-50/40' : 'border-stone-200 hover:border-stone-300'
              }`}>
                <input
                  type="radio"
                  className="mt-1 accent-emerald-600"
                  checked={redact}
                  onChange={() => setRedact(true)}
                />
                <div>
                  <p className="text-sm font-bold text-navy-muted">Redact sensitive fields</p>
                  <p className="text-xs text-stone-500 leading-relaxed">SSNs, account numbers, and passwords show as ••••••••. Safe to share with attorneys.</p>
                </div>
              </label>
              <label className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition ${
                !redact ? 'border-amber-400 bg-amber-50/60' : 'border-stone-200 hover:border-stone-300'
              }`}>
                <input
                  type="radio"
                  className="mt-1 accent-amber-600"
                  checked={!redact}
                  onChange={() => setRedact(false)}
                />
                <div>
                  <p className="text-sm font-bold text-navy-muted">Include sensitive fields</p>
                  <p className="text-xs text-stone-500 leading-relaxed">Full account numbers and credentials. Store the file securely.</p>
                </div>
              </label>
            </div>
          </section>

          {/* Format & extras */}
          <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Detail</h4>
              <div className="flex gap-2">
                <button
                  onClick={() => setFormat('full')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border ${
                    format === 'full'
                      ? 'bg-navy-muted text-white border-navy-muted'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  Full detail
                </button>
                <button
                  onClick={() => setFormat('summary')}
                  className={`flex-1 px-3 py-2 rounded-xl text-xs font-bold border ${
                    format === 'summary'
                      ? 'bg-navy-muted text-white border-navy-muted'
                      : 'bg-white text-stone-600 border-stone-200'
                  }`}
                >
                  Summary
                </button>
              </div>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-2">Extras</h4>
              <div className="space-y-2 text-xs">
                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-stone-200">
                  <span className="font-bold text-navy-muted">Cover page</span>
                  <input type="checkbox" className="accent-teal-600" checked={includeCover} onChange={(e) => setIncludeCover(e.target.checked)} />
                </label>
                <label className="flex items-center justify-between gap-2 px-3 py-2 rounded-xl border border-stone-200">
                  <span className="font-bold text-navy-muted">CONFIDENTIAL watermark</span>
                  <input type="checkbox" className="accent-teal-600" checked={includeWatermark} onChange={(e) => setIncludeWatermark(e.target.checked)} />
                </label>
              </div>
            </div>
          </section>

          {confirmingSensitive && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 flex gap-3">
              <AlertTriangle className="text-amber-600 flex-shrink-0 mt-0.5" size={18} />
              <div className="flex-1 text-sm">
                <p className="font-bold text-amber-900">This PDF will contain your sensitive information.</p>
                <p className="text-amber-800 mt-1">Account numbers, SSNs, and passwords will appear unredacted. Store the file in a safe place.</p>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => setConfirmingSensitive(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white border border-amber-300 text-amber-900"
                  >
                    Go back
                  </button>
                  <button
                    onClick={() => void doGenerate()}
                    className="px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-600 text-white"
                  >
                    Yes, include sensitive
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-stone-100 p-4 space-y-3 bg-stone-50/40">
          {generating && (
            <div>
              <div className="flex items-center justify-between text-[11px] font-bold text-stone-500 mb-1.5">
                <span className="uppercase tracking-widest">Generating PDF</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="h-1.5 bg-stone-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          )}
          <div className="flex items-center justify-between gap-3">
            <p className="text-[11px] text-stone-500 flex items-center gap-1.5">
              <FileText size={12} className="text-stone-400" />
              {scope === 'all' ? `All ${DEFAULT_SECTIONS.length} sections` : `${selected.size} section${selected.size === 1 ? '' : 's'}`} · {redact ? 'redacted' : 'unredacted'}
            </p>
            <button
              onClick={requestGenerate}
              disabled={generating}
              className="px-5 py-2.5 rounded-xl bg-teal-600 text-white text-sm font-bold flex items-center gap-2 hover:bg-teal-700 disabled:opacity-60 transition-colors"
            >
              {generating ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />}
              {generating ? 'Generating…' : 'Generate PDF'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
