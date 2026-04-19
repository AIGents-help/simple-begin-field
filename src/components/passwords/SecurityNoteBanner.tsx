import React from 'react';
import { Lock } from 'lucide-react';

export const SecurityNoteBanner: React.FC = () => (
  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex gap-3">
    <Lock size={18} className="text-amber-600 shrink-0 mt-0.5" />
    <p className="text-xs text-amber-900 leading-relaxed">
      <strong>Security Note:</strong> Only store password <em>hints</em> and <em>locations</em> here —
      never actual passwords. Your password manager holds the real credentials.
    </p>
  </div>
);
