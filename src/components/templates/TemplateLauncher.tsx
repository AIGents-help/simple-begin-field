import React from 'react';
import { FileText, ArrowRight } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';

interface Props {
  /** Template type to highlight when the gallery opens. Currently informational. */
  templateType?: string;
  /** Headline shown on the card. */
  title: string;
  /** Description of why this template helps in this section. */
  description: string;
  /** Optional override label for the action button. */
  buttonLabel?: string;
  className?: string;
}

/**
 * Cross-section entry point that nudges users to start the right template
 * from inside Funeral, Memories, Identity (Info), or Family.
 */
export const TemplateLauncher: React.FC<Props> = ({
  title,
  description,
  buttonLabel = 'Browse Templates',
  className = '',
}) => {
  const { setView } = useAppContext();
  return (
    <div className={`bg-gradient-to-br from-navy-muted/5 to-amber-50 border border-navy-muted/20 rounded-2xl p-5 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-lg bg-white border border-navy-muted/20 flex items-center justify-center shrink-0">
          <FileText className="w-5 h-5 text-navy-muted" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-navy-deep text-sm">{title}</h3>
          <p className="text-stone-600 text-xs mt-1 leading-relaxed">{description}</p>
          <button
            onClick={() => setView('templates')}
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-navy-muted text-white text-xs font-semibold hover:bg-navy-muted/90"
          >
            {buttonLabel} <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
