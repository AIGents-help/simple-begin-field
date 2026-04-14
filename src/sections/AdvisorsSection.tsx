import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate, RecordCard } from '../components/sections/SectionScreenTemplate';
import { ShieldCheck, User, Phone, Mail, Search } from 'lucide-react';
import { CategoryOption } from '../components/upload/types';
import { ProfessionalFinder } from '../components/directory/ProfessionalFinder';

export const AdvisorsSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  const [activeView, setActiveView] = useState<'list' | 'find'>('list');

  return (
    <div>
      {/* Tab Toggle */}
      <div className="px-6 pt-2 pb-0">
        <div className="flex bg-stone-100 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveView('list')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors ${
              activeView === 'list'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            My Advisors
          </button>
          <button
            onClick={() => setActiveView('find')}
            className={`flex-1 py-2 px-3 rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5 ${
              activeView === 'find'
                ? 'bg-white text-stone-900 shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            <Search className="w-3 h-3" />
            Find a Professional
          </button>
        </div>
      </div>

      {activeView === 'list' ? (
        <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh}>
          {(records) => (
            <div className="space-y-4">
              {records.map(record => (
                <RecordCard 
                  key={record.id}
                  title={record.name}
                  subtitle={`${record.advisor_type} • ${record.firm || ''}`}
                  icon={ShieldCheck}
                  badge={record.advisor_type}
                />
              ))}
            </div>
          )}
        </SectionScreenTemplate>
      ) : (
        <div className="p-6 pb-32">
          <div className="mb-4">
            <h2 className="text-2xl font-serif font-bold text-stone-900 mb-1">Find a Professional</h2>
            <p className="text-xs text-stone-500">Search for estate planning professionals near you and save them directly to your advisors list.</p>
          </div>
          <ProfessionalFinder />
        </div>
      )}
    </div>
  );
};
