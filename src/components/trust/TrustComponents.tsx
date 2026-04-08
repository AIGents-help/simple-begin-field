import React from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronRight, HelpCircle, Mail, ExternalLink } from 'lucide-react';

// TrustInfoCard
export const TrustInfoCard: React.FC<{
  title: string;
  description: string;
  icon: React.ReactNode;
  className?: string;
}> = ({ title, description, icon, className = "" }) => (
  <div className={`p-6 bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow ${className}`}>
    <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center text-indigo-600 mb-4">
      {icon}
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-2">{title}</h3>
    <p className="text-slate-600 leading-relaxed text-sm">{description}</p>
  </div>
);

// SecurityNoticeBanner
export const SecurityNoticeBanner: React.FC<{
  message: string;
  type?: 'info' | 'warning' | 'success';
}> = ({ message, type = 'info' }) => {
  const styles = {
    info: "bg-indigo-50 text-indigo-700 border-indigo-100",
    warning: "bg-amber-50 text-amber-700 border-amber-100",
    success: "bg-emerald-50 text-emerald-700 border-emerald-100",
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${styles[type]} text-sm font-medium`}>
      <Shield className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
};

// LockedStateCard
export const LockedStateCard: React.FC<{
  title: string;
  onUnlock?: () => void;
  message?: string;
}> = ({ title, onUnlock, message = "Restricted – requires verification to view" }) => (
  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-200 flex flex-col items-center text-center">
    <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center shadow-sm mb-4">
      <Lock className="w-8 h-8 text-slate-400" />
    </div>
    <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
    <p className="text-slate-500 text-sm mb-6 max-w-xs">{message}</p>
    {onUnlock && (
      <button
        onClick={onUnlock}
        className="px-6 py-2.5 bg-indigo-600 text-white rounded-full font-medium hover:bg-indigo-700 transition-colors shadow-sm"
      >
        Unlock Item
      </button>
    )}
  </div>
);

// SensitiveFieldNotice
export const SensitiveFieldNotice: React.FC = () => (
  <div className="flex items-center gap-2 text-xs text-slate-400 mt-1.5 ml-1">
    <Lock className="w-3 h-3" />
    <span>Sensitive information is hidden by default</span>
  </div>
);

// ConsentCheckbox
export const ConsentCheckbox: React.FC<{
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: React.ReactNode;
  error?: string;
}> = ({ checked, onChange, label, error }) => (
  <div className="space-y-2">
    <label className="flex items-start gap-3 cursor-pointer group">
      <div className="relative flex items-center pt-0.5">
        <input
          type="checkbox"
          className="peer sr-only"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
        />
        <div className={`w-5 h-5 rounded border transition-all flex items-center justify-center
          ${checked 
            ? 'bg-indigo-600 border-indigo-600' 
            : 'bg-white border-slate-300 group-hover:border-indigo-400'
          } ${error ? 'border-rose-300 bg-rose-50' : ''}`}
        >
          {checked && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
        </div>
      </div>
      <span className="text-sm text-slate-600 leading-tight select-none">
        {label}
      </span>
    </label>
    {error && <p className="text-xs text-rose-500 ml-8">{error}</p>}
  </div>
);

// DataUsageSummaryCard
export const DataUsageSummaryCard: React.FC = () => (
  <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100">
    <h3 className="text-lg font-semibold text-slate-900 mb-4">How Your Data Is Used</h3>
    <ul className="space-y-3">
      {[
        "We store your information to help you organize your records",
        "We do not sell your personal data",
        "Your documents are not publicly accessible",
        "You control who can access your packet"
      ].map((item, i) => (
        <li key={i} className="flex items-start gap-3 text-sm text-slate-600">
          <CheckCircle2 className="w-4 h-4 text-indigo-500 mt-0.5 flex-shrink-0" />
          <span>{item}</span>
        </li>
      ))}
    </ul>
    <p className="mt-6 text-xs text-slate-400 italic">
      Read our full Privacy Policy for more details.
    </p>
  </div>
);
