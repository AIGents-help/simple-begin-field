import React from 'react';
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { AdminOverview, ProfessionalOverview } from './components/dashboard/Overview';
import { AdminCustomers, AdminPackets, AdminBilling } from './components/dashboard/AdminScreens';
import { AdminAffiliates, AdminInvites } from './components/dashboard/AdminAffiliates';
import { MyReferrals, MyLinks, MyPayouts } from './components/dashboard/ProfessionalScreens';
import { TermsOfService } from './pages/legal/TermsOfService';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { DataUsageSummary } from './pages/legal/DataUsageSummary';
import { CheckoutSuccess } from './components/billing/CheckoutSuccess';
import { useAppContext } from './context/AppContext';

const DashboardRoutes = () => {
  const { user, profile, loading, authReady, profileLoading } = useAppContext();

  if (!authReady || loading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-6">
        <div className="w-10 h-10 border-4 border-stone-300 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace />;
  }

  const isAdmin = profile?.role === 'admin';
  const isProfessional = profile?.role === 'professional';

  return (
    <DashboardShell>
      <Routes>
        <Route index element={isAdmin ? <AdminOverview /> : <ProfessionalOverview />} />
        
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


export default function App() {
  return (
    <AppProvider>
      <Toaster />
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
