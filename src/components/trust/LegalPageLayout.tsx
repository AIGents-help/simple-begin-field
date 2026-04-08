import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface LegalPageLayoutProps {
  title: string;
  lastUpdated?: string;
  children: React.ReactNode;
}

export const LegalPageLayout: React.FC<LegalPageLayoutProps> = ({ title, lastUpdated, children }) => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-8 group"
        >
          <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          <span className="text-sm font-medium">Back</span>
        </button>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden">
          <div className="px-8 py-10 border-b border-slate-50 bg-slate-50/50">
            <h1 className="text-3xl font-bold text-slate-900 mb-2">{title}</h1>
            {lastUpdated && (
              <p className="text-sm text-slate-500 font-medium">
                Last Updated: {lastUpdated}
              </p>
            )}
          </div>

          <div className="px-8 py-12 prose prose-slate prose-indigo max-w-none">
            {children}
          </div>
        </div>

        <div className="mt-12 text-center">
          <p className="text-sm text-slate-400">
            &copy; {new Date().getFullYear()} The Survivor Packet. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
};
