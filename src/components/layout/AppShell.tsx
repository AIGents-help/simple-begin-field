import React, { useState, useEffect, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { MobileTopBar } from './MobileTopBar';
import { BottomNav } from './BottomNav';
import { Sidebar } from './Sidebar';
import { DashboardScreen } from '../dashboard/DashboardScreen';
import { SectionRenderer } from '../../sections/SectionRenderer';
import { ProfileScreen } from '../profile/ProfileScreen';
import { SearchScreen } from '../search/SearchScreen';
import { AddEditSheet } from '../sections/AddEditSheet';
import { QuickAddSheet } from '../sections/QuickAddSheet';
import { OnboardingFlow } from '../onboarding/OnboardingFlow';
import { HouseholdSettings } from '../settings/HouseholdSettings';
import { SecuritySettings } from '../settings/SecuritySettings';
import { TrustScreen } from '../trust/TrustScreen';
import { InviteAcceptanceScreen } from '../auth/InviteAcceptanceScreen';
import { AffiliatePage } from '../../pages/AffiliatePage';
import { PricingPage } from '../billing/PricingPage';
import { FindProfessionalScreen } from '../directory/FindProfessionalScreen';
import { AdminFeaturedProfessionals } from '../admin/AdminFeaturedProfessionals';
import { useLocation, useNavigate } from 'react-router-dom';
import { Shield } from 'lucide-react';
import { CategoryOption } from '../upload/types';
import { SectionId } from '../../config/types';
import { HavenAssistant } from '../haven/HavenAssistant';
import { EstateSummaryPage } from '../estate/EstateSummaryPage';
import { TemplatesScreen } from '../templates/TemplatesScreen';
import { PartnerSettings } from '../couple/PartnerSettings';
import { DemoBanner } from '../demo/DemoBanner';
import { isDemoMode } from '../../demo/demoMode';

export const AppShell = () => {
  const { onboarded, view, setView, loading, user, profile, setTab } = useAppContext();
  const mainRef = useRef<HTMLElement>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isQuickAdding, setIsQuickAdding] = useState(false);
  const [initialFile, setInitialFile] = useState<File | null>(null);
  const [initialData, setInitialData] = useState<any>(null);
  const [categoryOptions, setCategoryOptions] = useState<CategoryOption[]>([]);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [refreshFn, setRefreshFn] = useState<((newRecord?: any) => void) | null>(null);

  const handleAddClick = (file?: File, data?: any, options?: CategoryOption[], isEntryOnly?: boolean) => {
    if (file) setInitialFile(file);
    const finalData = isEntryOnly ? { ...(data || {}), entryOnly: true } : data;
    if (finalData) setInitialData(finalData);
    if (options) setCategoryOptions(options);
    setIsAdding(true);
  };

  const handleQuickAddSelect = (sectionId: SectionId, prefill?: any) => {
    setTab(sectionId);
    setView('sections');
    // We pass the prefill data to the AddEditSheet
    handleAddClick(undefined, prefill);
  };

  const handleCloseAdd = () => {
    setIsAdding(false);
    setInitialFile(null);
    setInitialData(null);
    setCategoryOptions([]);
  };
  const [inviteToken, setInviteToken] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    // Basic routing for invite links
    const path = location.pathname;
    if (path.startsWith('/invite/')) {
      const token = path.split('/invite/')[1];
      setInviteToken(token);
      setView('invite');
    }
  }, [location.pathname]);

  const handleRefreshRegister = React.useCallback((fn: (newRecord?: any) => void) => {
    setRefreshFn(() => fn);
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#fdfaf3] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-navy-muted border-t-transparent rounded-full animate-spin"></div>
          <p className="text-stone-500 font-medium">Opening your packet...</p>
        </div>
      </div>
    );
  }

  if (view === 'invite' && inviteToken) {
    return (
      <InviteAcceptanceScreen 
        token={inviteToken} 
        onSuccess={(packetId) => {
          setInviteToken(null);
          setView('dashboard');
          window.history.pushState({}, '', '/');
        }} 
      />
    );
  }

  if (!onboarded || !user) {
    return <OnboardingFlow />;
  }

  const renderContent = () => {
    switch (view) {
      case 'dashboard':
        return <DashboardScreen />;
      case 'sections':
        return (
          <SectionRenderer 
            onAddClick={handleAddClick} 
            onRefresh={handleRefreshRegister}
          />
        );
      case 'profile':
        return <ProfileScreen />;
      case 'security':
        return (
          <div className="p-6 max-w-[1280px] mx-auto">
            <button onClick={() => setView('profile')} className="mb-4 flex items-center gap-2 text-stone-500 font-bold text-xs uppercase tracking-widest">
              Back to Profile
            </button>
            <SecuritySettings />
          </div>
        );
      case 'trust':
        return <TrustScreen onBack={() => setView('profile')} />;
      case 'search':
        return <SearchScreen />;
      case 'household':
        return <HouseholdSettings onBack={() => setView('profile')} />;
      case 'affiliate':
        return <AffiliatePage />;
      case 'pricing':
        return <PricingPage />;
      case 'directory':
        return <FindProfessionalScreen />;
      case 'admin':
        return <AdminFeaturedProfessionals />;
      case 'estate':
        return <EstateSummaryPage />;
      case 'templates':
        return <TemplatesScreen />;
      case 'partner':
        return <PartnerSettings />;
      default:
        return <DashboardScreen />;
    }
  };

  const demoMode = isDemoMode();

  return (
    <div className="min-h-screen bg-[#fdfaf3] flex font-sans relative overflow-hidden">
      {/* Sidebar for Desktop/Tablet */}
      <Sidebar isOpen={isMenuOpen} onClose={() => setIsMenuOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden relative">
        {demoMode && <DemoBanner />}
        {view !== 'household' && <MobileTopBar onMenuClick={() => setIsMenuOpen(true)} />}
        
        <main ref={mainRef} className="flex-1 overflow-y-auto no-scrollbar pb-24 md:pb-0">
          <div className="max-w-[1280px] mx-auto w-full">
            {profile?.role && profile.role !== 'user' && (
              <div className="px-4 py-2 bg-stone-900 text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Shield className="w-3 h-3" />
                  <span className="text-[10px] font-semibold uppercase tracking-wider">
                    {profile.role} Mode
                  </span>
                </div>
                <button 
                  onClick={() => navigate('/dashboard')}
                  className="text-[10px] font-bold underline uppercase tracking-wider"
                >
                  Open Dashboard
                </button>
              </div>
            )}
            {renderContent()}
          </div>
        </main>

        {view !== 'household' && <BottomNav onAddClick={() => setIsQuickAdding(true)} />}
      </div>

      {!demoMode && (
        <QuickAddSheet 
          isOpen={isQuickAdding} 
          onClose={() => setIsQuickAdding(false)} 
          onSelect={handleQuickAddSelect}
        />
      )}

      {!demoMode && (
        <AddEditSheet 
          isOpen={isAdding} 
          onClose={handleCloseAdd} 
          initialFile={initialFile}
          initialData={initialData}
          categoryOptions={categoryOptions}
          onSuccess={(newRecord) => {
            if (refreshFn) refreshFn(newRecord);
          }}
        />
      )}
      <HavenAssistant />
    </div>
  );
};
