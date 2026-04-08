import React from 'react';
import { Shield, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ChevronRight, HelpCircle, Mail, ExternalLink, Info, UserCheck, FileText, ArrowLeft } from 'lucide-react';
import { TrustInfoCard, DataUsageSummaryCard, SecurityNoticeBanner } from './TrustComponents';
import { useNavigate } from 'react-router-dom';

interface TrustScreenProps {
  onBack?: () => void;
}

export const TrustScreen: React.FC<TrustScreenProps> = ({ onBack }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8 relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-6 left-6 p-2 bg-white rounded-full shadow-sm border border-slate-100 text-slate-500 hover:text-indigo-600 transition-colors z-10"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
      )}
      <div className="max-w-[1280px] mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">Your Information, Protected and Organized</h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            We understand the sensitivity of the information you store with us. 
            Here is how we protect your data and ensure your privacy.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          <TrustInfoCard
            title="How Your Data Is Stored"
            description="Your information is stored securely in the cloud. Access is tied to your account, and files are not public."
            icon={<Shield className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="How Access Works"
            description="Only you (and your partner if invited) can access your packet. Private items have additional restrictions."
            icon={<Lock className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="Private Items Explained"
            description="'Only Me' items are visible only to you. 'Me + Partner' items are shared. Some items can be restricted and require unlocking."
            icon={<EyeOff className="w-6 h-6" />}
          />
          <TrustInfoCard
            title="User Responsibility"
            description="Keep login credentials secure, verify information accuracy, and keep documents up to date."
            icon={<UserCheck className="w-6 h-6" />}
          />
        </div>

        <div className="bg-white rounded-3xl p-8 shadow-sm border border-slate-100 mb-12">
          <h2 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-3">
            <Info className="w-6 h-6 text-indigo-600" />
            What This App Is (And Is Not)
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">What We Are</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>An organization tool for important records</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>A secure platform for document storage</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  <span>A way to share final instructions with family</span>
                </li>
              </ul>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold text-slate-900">What We Are Not</h3>
              <ul className="space-y-2">
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Not a legal service or law firm</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Not a financial advisor or bank</span>
                </li>
                <li className="flex items-center gap-2 text-sm text-slate-600">
                  <AlertCircle className="w-4 h-4 text-amber-500" />
                  <span>Not a replacement for professional advice</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        <div className="mb-12">
          <DataUsageSummaryCard />
        </div>

        <div className="bg-indigo-600 rounded-3xl p-8 text-white text-center shadow-lg shadow-indigo-200">
          <h2 className="text-2xl font-bold mb-4">Need Help or Have Questions?</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto">
            Our support team is here to help you with any security or privacy concerns.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a
              href="mailto:support@survivorpacket.com"
              className="flex items-center gap-2 px-6 py-3 bg-white text-indigo-600 rounded-full font-semibold hover:bg-indigo-50 transition-colors"
            >
              <Mail className="w-5 h-5" />
              Contact Support
            </a>
            <button
              onClick={() => navigate('/help')}
              className="flex items-center gap-2 px-6 py-3 bg-indigo-500 text-white rounded-full font-semibold hover:bg-indigo-400 transition-colors"
            >
              <HelpCircle className="w-5 h-5" />
              Visit Help Center
            </button>
          </div>
        </div>

        <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-4 text-sm text-slate-400 font-medium">
          <button onClick={() => navigate('/legal/terms')} className="hover:text-indigo-600 transition-colors">Terms of Service</button>
          <button onClick={() => navigate('/legal/privacy')} className="hover:text-indigo-600 transition-colors">Privacy Policy</button>
          <button onClick={() => navigate('/legal/usage')} className="hover:text-indigo-600 transition-colors">Data Usage Summary</button>
        </div>
      </div>
    </div>
  );
};
