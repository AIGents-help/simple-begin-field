import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { AdminOverview, ProfessionalOverview } from './components/dashboard/Overview';
import { AdminCustomers, AdminPackets, AdminBilling } from './components/dashboard/AdminScreens';
import { AdminAffiliates, AdminInvites } from './components/dashboard/AdminAffiliates';
import { MyReferrals, MyLinks, MyPayouts } from './components/dashboard/ProfessionalScreens';
import { useAppContext } from './context/AppContext';

const DashboardRoutes = () => {
  const { profile } = useAppContext();
  const isAdmin = profile?.role === 'admin';
  const isProfessional = profile?.role === 'professional';

  return (
    <DashboardShell>
      <Routes>
        <Route index element={isAdmin ? <AdminOverview /> : <ProfessionalOverview />} />
        
        {/* Admin Only */}
        {isAdmin && (
          <>
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="packets" element={<AdminPackets />} />
            <Route path="billing" element={<AdminBilling />} />
            <Route path="invites" element={<AdminInvites />} />
            <Route path="affiliates" element={<AdminAffiliates />} />
            <Route path="plans" element={<div className="p-8 text-stone-400 italic">Plans Management Coming Soon</div>} />
            <Route path="activity" element={<div className="p-8 text-stone-400 italic">Activity Feed Coming Soon</div>} />
            <Route path="settings" element={<div className="p-8 text-stone-400 italic">Admin Settings Coming Soon</div>} />
          </>
        )}

        {/* Professional Only */}
        {isProfessional && (
          <>
            <Route path="referrals" element={<MyReferrals />} />
            <Route path="links" element={<MyLinks />} />
            <Route path="conversions" element={<MyReferrals />} />
            <Route path="payouts" element={<MyPayouts />} />
            <Route path="profile" element={<div className="p-8 text-stone-400 italic">Profile Settings Coming Soon</div>} />
          </>
        )}
      </Routes>
    </DashboardShell>
  );
};

import { TermsOfService } from './pages/legal/TermsOfService';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { DataUsageSummary } from './pages/legal/DataUsageSummary';
import { PricingPage } from './components/billing/PricingPage';
import { CheckoutSuccess } from './components/billing/CheckoutSuccess';
import { Navigate } from 'react-router-dom';

export default function App() {
  return (
    <AppProvider>
      <Router>
        <Routes>
          {/* Main App Routes */}
          <Route path="/" element={<AppShell />}>
            <Route index element={<Outlet />} />
            <Route path="invite/:inviteId" element={<Outlet />} />
          </Route>

          {/* Legal Routes */}
          <Route path="/legal/terms" element={<TermsOfService />} />
          <Route path="/legal/privacy" element={<PrivacyPolicy />} />
          <Route path="/legal/usage" element={<DataUsageSummary />} />

          {/* Dashboard Routes */}
          <Route path="/dashboard/*" element={<DashboardRoutes />} />

          {/* Billing Routes */}
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/checkout/success" element={<CheckoutSuccess />} />
          <Route path="/checkout/cancel" element={<Navigate to="/pricing" replace />} />
        </Routes>
      </Router>
    </AppProvider>
  );
}
