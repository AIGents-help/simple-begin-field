import React from 'react';
import { useAppContext } from '../context/AppContext';
import { SectionScreenTemplate } from '../components/sections/SectionScreenTemplate';
import { InfoSection } from '../components/info/InfoSection';
import { FamilySection } from '../sections/FamilySection';
import { RealEstateSection } from '../sections/RealEstateSection';
import { BankingSection } from '../sections/BankingSection';
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
import { PrivateLockGate } from '../components/private/PrivateLockGate';
import { PlanGate } from '../components/billing/PlanGate';

import { CategoryOption } from '../components/upload/types';

export const GenericSection = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh?: (fn: () => void) => void }) => {
  return <SectionScreenTemplate onAddClick={onAddClick} onRefresh={onRefresh} />;
};

export const SectionRenderer = ({ onAddClick, onRefresh }: { onAddClick: (file?: File, data?: any, options?: CategoryOption[]) => void, onRefresh: (fn: () => void) => void }) => {
  const { activeTab, activeScope, currentPacket } = useAppContext();

  const renderSection = () => {
    switch (activeTab) {
      case 'info':
        return currentPacket ? <InfoSection packetId={currentPacket.id} scope={activeScope} /> : null;
      case 'family':
        return <FamilySection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'real-estate':
        return <RealEstateSection onAddClick={onAddClick} onRefresh={onRefresh} />;
      case 'banking':
        return <BankingSection onAddClick={onAddClick} onRefresh={onRefresh} />;
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
      case 'medical':
        return <MedicalSection onAddClick={onAddClick} onRefresh={onRefresh} />;
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

  return (
    <PlanGate feature={activeTab}>
      <div className="p-4 sm:p-6 lg:p-8">
        {renderSection()}
      </div>
    </PlanGate>
  );
};
