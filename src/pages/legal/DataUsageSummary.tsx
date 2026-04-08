import React from 'react';
import { LegalPageLayout } from '../../components/trust/LegalPageLayout';
import { DataUsageSummaryCard } from '../../components/trust/TrustComponents';

export const DataUsageSummary: React.FC = () => {
  return (
    <LegalPageLayout title="How Your Data Is Used" lastUpdated="March 26, 2026">
      <div className="mb-10">
        <DataUsageSummaryCard />
      </div>

      <section>
        <h2>Simplified Privacy Overview</h2>
        <p>
          We know privacy policies can be long and complex. This page provides 
           a simplified summary of how we handle your most sensitive information.
        </p>
      </section>

      <section>
        <h2>1. We Store Your Information to Help You Organize</h2>
        <p>
          The primary purpose of our service is to provide a secure place for 
          you to store and organize your records. We only collect the data 
          necessary to provide this service.
        </p>
      </section>

      <section>
        <h2>2. We Do Not Sell Your Personal Data</h2>
        <p>
          Your personal information is not for sale. We do not share your 
          data with third parties for marketing or advertising purposes.
        </p>
      </section>

      <section>
        <h2>3. Your Documents are Not Publicly Accessible</h2>
        <p>
          We use strict access controls to ensure that your files are only 
          available to you and any partners you explicitly invite. Your 
          documents are never made public.
        </p>
      </section>

      <section>
        <h2>4. You Control Who Can Access Your Packet</h2>
        <p>
          You are the owner of your data. You decide who can see your 
          information and you can revoke access at any time.
        </p>
      </section>

      <section>
        <h2>5. Your Right to Delete</h2>
        <p>
          You can delete your data or your entire account at any time. 
          We provide simple tools in your settings to manage your data 
          retention.
        </p>
      </section>

      <div className="mt-12 p-6 bg-indigo-50 rounded-2xl border border-indigo-100">
        <p className="text-sm text-indigo-700 font-medium mb-0">
          For more detailed information, please read our full 
          <a href="/legal/privacy" className="ml-1 underline">Privacy Policy</a>.
        </p>
      </div>
    </LegalPageLayout>
  );
};
