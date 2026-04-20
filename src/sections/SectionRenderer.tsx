import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate } from '../components/sections/SectionScreenTemplate';
import { InfoSection } from '../sections/InfoSection';
import { FamilySection } from '../sections/FamilySection';
import { RealEstateSection } from '../sections/RealEstateSection';
import { BankingSection } from '../sections/BankingSection';
import { DebtsSection } from '../sections/DebtsSection';
import { InvestmentsSection } from '../sections/InvestmentsSection';
import { RetirementSection } from '../sections/RetirementSection';
import { VehiclesSection } from '../sections/VehiclesSection';
import { AdvisorsSection } from '../sections/AdvisorsSection';
import { PasswordsSection } from '../sections/PasswordsSection';
import { PropertySection } from '../sections/PropertySection';
import { PetsSection } from '../sections/PetsSection';
import { FuneralSection } from '../sections/FuneralSection';
import { MedicalSection } from '../sections/MedicalSection';
import { PrivateSection } from '../sections/PrivateSection';
import { AffiliateSection } from '../sections/AffiliateSection';
import { MemoriesSection } from '../sections/MemoriesSection';
import { LegalSection } from '../sections/LegalSection';
import { CustomSection } from '../sections/CustomSection';
import { PrivateLockGate } from '../components/private/PrivateLockGate';
import { PlanGate } from '../components/billing/PlanGate';
import { DemoSectionInfoButton } from '../components/demo/DemoSectionInfoButton';
import { DemoCTAFooter } from '../components/demo/DemoCTAFooter';
import { isDemoMode } from '../demo/demoMode';

import { CategoryOption } from '../components/upload/types';

export const GenericSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh} />;
};

export const SectionRenderer = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh: (fn: (newRecord?: any) => void) => void }) => {
  const { activeTab, activeScope, currentPacket, activeCustomSectionId, customSections, refreshCustomSections, setActiveCustomSection } = useAppContext();

  const renderSection = () => {
    // Render a custom section if one is active
    if (activeTab === 'custom' && activeCustomSectionId) {
      const section = customSections.find((s) => s.id === activeCustomSectionId);
      if (!section) {
        return (
          <div className="text-center py-12 text-stone-500">
            This custom section no longer exists.
          </div>
        );
      }
      return (
        <CustomSection
          section={section}
          onSectionUpdated={() => { void refreshCustomSections(); }}
          onSectionDeleted={() => { setActiveCustomSection(null); void refreshCustomSections(); }}
        />
      );
    }

    switch (activeTab) {
      case 'info':
        return <InfoSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'family':
        return <FamilySection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'real-estate':
        return <RealEstateSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'banking':
        return <BankingSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'debts':
        return <DebtsSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'investments':
        return <InvestmentsSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'retirement':
        return <RetirementSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'vehicles':
        return <VehiclesSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'advisors':
        return <AdvisorsSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'passwords':
        return <PasswordsSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'property':
        return <PropertySection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'pets':
        return <PetsSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'funeral':
        return <FuneralSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'memories':
        return <MemoriesSection />;
      case 'medical':
        return <MedicalSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'legal':
        return <LegalSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'private':
        return (
          <PrivateLockGate>
            <PrivateSection onAddClick={onAddClick} onRefresh={onRefresh} />
          </PrivateLockGate>
        );
      case 'affiliate':
        return <AffiliateSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      default:
        return <GenericSection onAddClick={onAddClick} onRefresh={onRefresh} />;
    }
  };

  // Mobile: MobileTopBar is the only sticky element (69px) handled by parent.
  // pb-28 on mobile to clear the BottomNav (~88px incl. safe area).
  const containerClass = "p-4 sm:p-6 pb-28 lg:p-8 lg:pb-8";

  const demoMode = isDemoMode();

  // Affiliate section and Custom sections are accessible to all logged-in users regardless of plan
  if (activeTab === 'affiliate' || activeTab === 'custom') {
    return (
      <div className={containerClass}>
        {renderSection()}
        {demoMode && <DemoCTAFooter />}
        {demoMode && <DemoSectionInfoButton />}
      </div>
    );
  }

  // Demo mode bypasses plan gating since the demo is meant to showcase everything.
  if (demoMode) {
    return (
      <div className={containerClass}>
        {renderSection()}
        <DemoCTAFooter />
        <DemoSectionInfoButton />
      </div>
    );
  }

  return (
    <PlanGate feature={activeTab}>
      <div className={containerClass}>
        {renderSection()}
      </div>
    </PlanGate>
  );
};
