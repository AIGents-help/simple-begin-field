import React from 'react';
import { AlertTriangle } from 'lucide-react';

export const TemplateDisclaimerBanner: React.FC<{ variant?: 'gallery' | 'editor' }> = ({ variant = 'gallery' }) => {
  const message =
    variant === 'editor'
      ? 'This template is a starting point only. It is not a legally binding document. Have it reviewed by a licensed attorney in your state before signing or relying on it.'
      : 'These templates are for organizational purposes only. They are NOT legal documents and have NOT been reviewed by an attorney. Laws vary by state. Always have documents reviewed and executed by a licensed attorney before relying on them.';
  return (
    <div className="rounded-lg border border-amber-300 bg-amber-50 p-4 flex gap-3">
      <AlertTriangle className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
      <div className="text-sm text-amber-900 leading-relaxed">
        <span className="font-semibold">Important: </span>
        {message}
      </div>
    </div>
  );
};
