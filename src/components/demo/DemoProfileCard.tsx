import React from 'react';
import { Calendar, MapPin, Briefcase, Heart } from 'lucide-react';
import { DEMO_PROFILE } from '@/demo/morganFamilyData';

/**
 * James Morgan profile card — shown only on the dashboard when isDemoMode().
 * Mirrors how a real user's profile would appear once we add a profile card
 * to the dashboard. Display-only.
 */
export const DemoProfileCard: React.FC = () => {
  return (
    <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-sm flex flex-col sm:flex-row gap-5">
      <img
        src={DEMO_PROFILE.avatar_url}
        alt={DEMO_PROFILE.full_name}
        className="w-20 h-20 rounded-full bg-stone-100 border border-stone-200 flex-shrink-0 self-center sm:self-start"
      />
      <div className="flex-1 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h2 className="text-xl font-serif font-bold text-navy-muted">{DEMO_PROFILE.full_name}</h2>
          <span className="text-[10px] font-bold uppercase tracking-widest text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
            Demo
          </span>
        </div>
        <p className="text-sm text-stone-600 mt-1 leading-relaxed">{DEMO_PROFILE.bio}</p>
        <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 text-[12px] text-stone-500">
          <div className="flex items-center gap-1.5 min-w-0">
            <Calendar size={12} className="shrink-0" />
            <span className="truncate">Age {DEMO_PROFILE.age}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <MapPin size={12} className="shrink-0" />
            <span className="truncate">
              {DEMO_PROFILE.city}, {DEMO_PROFILE.state}
            </span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Briefcase size={12} className="shrink-0" />
            <span className="truncate">{DEMO_PROFILE.occupation}</span>
          </div>
          <div className="flex items-center gap-1.5 min-w-0">
            <Heart size={12} className="shrink-0" />
            <span className="truncate">{DEMO_PROFILE.marital_status}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
