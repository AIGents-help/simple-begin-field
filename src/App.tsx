import React from 'react';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AppProvider } from './context/AppContext';
import { AppShell } from './components/layout/AppShell';
import { DashboardShell } from './components/dashboard/DashboardShell';
import { AdminOverview, ProfessionalOverview } from './components/dashboard/Overview';
import { AdminCustomers, AdminPackets, AdminBilling } from './components/dashboard/AdminScreens';
import { AdminAffiliates, AdminInvites } from './components/dashboard/AdminAffiliates';
import { MyReferrals, MyLinks, MyPayouts } from './components/dashboard/ProfessionalScreens';
import { useAppContext } from './context/AppContext';
import { TermsOfService } from './pages/legal/TermsOfService';
import { PrivacyPolicy } from './pages/legal/PrivacyPolicy';
import { DataUsageSummary } from './pages/legal/DataUsageSummary';
import { PricingPage } from './components/billing/PricingPage';
import { CheckoutSuccess } from './components/billing/CheckoutSuccess';
import NotFound from "./pages/NotFound.tsx";
import { InstallPromptBanner } from './components/pwa/InstallPromptBanner';

const queryClient = new QueryClient();

const DashboardRoutes = () => {
  const { profile } = useAppContext();
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
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <InstallPromptBanner />
        <AppProvider>
          <Router>
            <Routes>
              <Route path="/" element={<AppShell />}>
                <Route index element={<Outlet />} />
                <Route path="invite/:inviteId" element={<Outlet />} />
              </Route>
              <Route path="/legal/terms" element={<TermsOfService />} />
              <Route path="/legal/privacy" element={<PrivacyPolicy />} />
              <Route path="/legal/usage" element={<DataUsageSummary />} />
              <Route path="/dashboard/*" element={<DashboardRoutes />} />
              <Route path="/pricing" element={<PricingPage />} />
              <Route path="/checkout/success" element={<CheckoutSuccess />} />
              <Route path="/checkout/cancel" element={<Navigate to="/pricing" replace />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Router>
        </AppProvider>
      </TooltipProvider>
    </QueryClientProvider>
  );
}
