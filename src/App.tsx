import { lazy, Suspense, useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { useNotifications } from "@/hooks/useNotifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

// Automatic update system
import { useForceUpdateOnVersionChange, UpdateNotification } from "@/hooks/useAutomaticUpdates";

// SPEED OF LIGHT: Persistent layout wrapper - mounted ONCE, never remounts
import { PersistentDashboardLayout } from "@/components/PersistentDashboardLayout";

// DISABLED: DepthParallaxBackground was causing performance issues
// import { DepthParallaxBackground } from "@/components/DepthParallaxBackground";

// Import UI components directly (not lazy) to avoid useContext issues with ThemeProvider
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

// Lazy load pages that are not immediately needed
const ResetPassword = lazy(() => import("./pages/ResetPassword"));

// Legal pages
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AGLPage = lazy(() => import("./pages/AGLPage"));

// Info pages
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQClientPage = lazy(() => import("./pages/FAQClientPage"));
const FAQOwnerPage = lazy(() => import("./pages/FAQOwnerPage"));

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// INSTANT NAVIGATION: ALL core routes are DIRECT IMPORTS
// Lazy loading causes delay on first tap - we want INSTANT navigation
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Client routes - ALL direct imports for instant navigation
import ClientDashboard from "./pages/ClientDashboard";
import ClientProfile from "./pages/ClientProfileNew";
import ClientSettings from "./pages/ClientSettingsNew";
import ClientLikedProperties from "./pages/ClientLikedProperties";
import ClientWhoLikedYou from "./pages/ClientWhoLikedYou";
import ClientSavedSearches from "./pages/ClientSavedSearches";
import ClientSecurity from "./pages/ClientSecurity";
import ClientWorkerDiscovery from "./pages/ClientWorkerDiscovery";
import ClientContracts from "./pages/ClientContracts";
import ClientLawyerServices from "./pages/ClientLawyerServices";

// Owner routes - ALL direct imports for instant navigation
import EnhancedOwnerDashboard from "./components/EnhancedOwnerDashboard";
import OwnerProfile from "./pages/OwnerProfileNew";
import OwnerSettings from "./pages/OwnerSettingsNew";
import OwnerProperties from "./pages/OwnerProperties";
import OwnerNewListing from "./pages/OwnerNewListing";
import OwnerLikedClients from "./pages/OwnerLikedClients";
import OwnerInterestedClients from "./pages/OwnerInterestedClients";
import OwnerContracts from "./pages/OwnerContracts";
import OwnerSavedSearches from "./pages/OwnerSavedSearches";
import OwnerSecurity from "./pages/OwnerSecurity";
import OwnerPropertyClientDiscovery from "./pages/OwnerPropertyClientDiscovery";
import OwnerMotoClientDiscovery from "./pages/OwnerMotoClientDiscovery";
import OwnerBicycleClientDiscovery from "./pages/OwnerBicycleClientDiscovery";
import OwnerViewClientProfile from "./pages/OwnerViewClientProfile";
import OwnerFiltersExplore from "./pages/OwnerFiltersExplore";
import OwnerLawyerServices from "./pages/OwnerLawyerServices";
import OwnerDashboardNew from "./pages/OwnerDashboardNew";

// Filter pages - direct imports for instant navigation
import ClientFilters from "./pages/ClientFilters";
import OwnerFilters from "./pages/OwnerFilters";

// Shared routes - direct imports for instant navigation
import { MessagingDashboard } from "./pages/MessagingDashboard";
import NotificationsPage from "./pages/NotificationsPage";
import SubscriptionPackagesPage from "./pages/SubscriptionPackagesPage";
import RadioPlayer from "./pages/RadioPlayer";
import RadioPlaylists from "./pages/RadioPlaylists";
import RadioFavorites from "./pages/RadioFavorites";

// Rare pages - lazy loaded (payment, camera, legal, public previews)
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));

// Camera pages
const ClientSelfieCamera = lazy(() => import("./pages/ClientSelfieCamera"));
const OwnerListingCamera = lazy(() => import("./pages/OwnerListingCamera"));
const OwnerProfileCamera = lazy(() => import("./pages/OwnerProfileCamera"));

// Public preview pages (shareable links)
const PublicProfilePreview = lazy(() => import("./pages/PublicProfilePreview"));
const PublicListingPreview = lazy(() => import("./pages/PublicListingPreview"));

// Test pages
import MockOwnersTestPage from "./pages/MockOwnersTestPage";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 2,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: false,
      refetchOnReconnect: 'always',
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}

// Wrapper for automatic update system
function UpdateWrapper({ children }: { children: React.ReactNode }) {
  // Check for version changes and force update if needed
  useForceUpdateOnVersionChange();
  return <>{children}</>;
}

const App = () => (
  <GlobalErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter
        future={{
          v7_startTransition: true,
          v7_relativeSplatPath: true
        }}
      >
        <ErrorBoundary>
          <AuthProvider>
          <ActiveModeProvider>
          <ThemeProvider>
            <PWAProvider>
            <RadioProvider>
            <ResponsiveProvider>
            <UpdateWrapper>
              <NotificationWrapper>
                {/* DISABLED: DepthParallaxBackground was causing performance issues */}
                {/* <DepthParallaxBackground /> */}
                
                {/* Update notification banner */}
                <UpdateNotification />
                
                <AppLayout>
                  <TooltipProvider>
                    <Sonner />
                    <Toaster />
                  </TooltipProvider>
                  <Suspense fallback={<SuspenseFallback />}>
                    <Routes>
                    <Route path="/" element={
                      <SignupErrorBoundary>
                        <Index />
                      </SignupErrorBoundary>
                    } />
                    <Route path="/reset-password" element={<ResetPassword />} />

                    {/* ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
                        SPEED OF LIGHT: UNIFIED layout for ALL protected routes
                        Single PersistentDashboardLayout instance shared between modes
                        Prevents remount when switching between client/owner modes
                        Camera routes are INSIDE layout to prevent remount on navigation back
                        ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ */}
                    <Route element={
                      <ProtectedRoute>
                        <PersistentDashboardLayout />
                      </ProtectedRoute>
                    }>
                      {/* Client routes */}
                      <Route path="/client/dashboard" element={<ClientDashboard />} />
                      <Route path="/client/profile" element={<ClientProfile />} />
                      <Route path="/client/settings" element={<ClientSettings />} />
                      <Route path="/client/liked-properties" element={<ClientLikedProperties />} />
                      <Route path="/client/who-liked-you" element={<ClientWhoLikedYou />} />
                      <Route path="/client/saved-searches" element={<ClientSavedSearches />} />
                      <Route path="/client/security" element={<ClientSecurity />} />
                      <Route path="/client/services" element={<ClientWorkerDiscovery />} />
                      <Route path="/client/contracts" element={<ClientContracts />} />
                      <Route path="/client/legal-services" element={<ClientLawyerServices />} />
                      <Route path="/client/camera" element={<ClientSelfieCamera />} />
                      <Route path="/client/filters" element={<ClientFilters />} />

                      {/* Owner routes */}
                      <Route path="/owner/dashboard" element={<EnhancedOwnerDashboard />} />
                      <Route path="/owner/profile" element={<OwnerProfile />} />
                      <Route path="/owner/settings" element={<OwnerSettings />} />
                      <Route path="/owner/properties" element={<OwnerProperties />} />
                      <Route path="/owner/listings/new" element={<OwnerNewListing />} />
                      <Route path="/owner/liked-clients" element={<OwnerLikedClients />} />
                      <Route path="/owner/interested-clients" element={<OwnerInterestedClients />} />
                      <Route path="/owner/clients/property" element={<OwnerPropertyClientDiscovery />} />
                      <Route path="/owner/clients/moto" element={<OwnerMotoClientDiscovery />} />
                      <Route path="/owner/clients/bicycle" element={<OwnerBicycleClientDiscovery />} />
                      <Route path="/owner/view-client/:clientId" element={<OwnerViewClientProfile />} />
                      <Route path="/owner/filters-explore" element={<OwnerFiltersExplore />} />
                      <Route path="/owner/saved-searches" element={<OwnerSavedSearches />} />
                      <Route path="/owner/security" element={<OwnerSecurity />} />
                      <Route path="/owner/contracts" element={<OwnerContracts />} />
                      <Route path="/owner/legal-services" element={<OwnerLawyerServices />} />
                      <Route path="/owner/camera" element={<OwnerProfileCamera />} />
                      <Route path="/owner/camera/listing" element={<OwnerListingCamera />} />
                      <Route path="/owner/filters" element={<OwnerFilters />} />

                      {/* Shared routes (both roles) */}
                      <Route path="/messages" element={<MessagingDashboard />} />
                      <Route path="/notifications" element={<NotificationsPage />} />
                      <Route path="/subscription-packages" element={<SubscriptionPackagesPage />} />
                      <Route path="/radio" element={<RadioPlayer />} />
                      <Route path="/radio/playlists" element={<RadioPlaylists />} />
                      <Route path="/radio/favorites" element={<RadioFavorites />} />
                    </Route>

                    {/* Payment routes - outside layout */}
                    <Route path="/payment/success" element={<PaymentSuccess />} />
                    <Route path="/payment/cancel" element={<PaymentCancel />} />

                    {/* Legal Pages - Public Access */}
                    <Route path="/privacy-policy" element={<PrivacyPolicy />} />
                    <Route path="/terms-of-service" element={<TermsOfService />} />
                    <Route path="/agl" element={<AGLPage />} />
                    <Route path="/legal" element={<LegalPage />} />

                    {/* Info Pages - Public Access */}
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="/faq/client" element={<FAQClientPage />} />
                    <Route path="/faq/owner" element={<FAQOwnerPage />} />

                    {/* Public Preview Pages - Shareable Links */}
                    <Route path="/profile/:id" element={<PublicProfilePreview />} />
                    <Route path="/listing/:id" element={<PublicListingPreview />} />

                    {/* Test Pages */}
                    <Route path="/test/mock-owners" element={<MockOwnersTestPage />} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
            </NotificationWrapper>
            </UpdateWrapper>
            </ResponsiveProvider>
            </RadioProvider>
            </PWAProvider>
          </ThemeProvider>
          </ActiveModeProvider>
          </AuthProvider>
        </ErrorBoundary>
      </BrowserRouter>
    </QueryClientProvider>
  </GlobalErrorBoundary>
);

export default App;
