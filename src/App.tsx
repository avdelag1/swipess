import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider, QueryCache } from "@tanstack/react-query";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import Index from "./pages/Index";
const NotFound = lazy(() => import("./pages/NotFound"));

// Automatic update system
import { useForceUpdateOnVersionChange, UpdateNotification } from "@/hooks/useAutomaticUpdates";

// Profile auto-sync system - keeps profile data fresh for all users
import { useProfileAutoSync, useEnsureSpecializedProfile } from "@/hooks/useProfileAutoSync";

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
// LAZY LOADED ROUTES: Only load the code for the page the user visits
// This dramatically reduces initial bundle size and page load time.
// Each page loads on-demand when navigated to (~50-200ms on first visit).
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

// Client routes - lazy loaded
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientProfile = lazy(() => import("./pages/ClientProfileNew"));
const ClientSettings = lazy(() => import("./pages/ClientSettingsNew"));
const ClientLikedProperties = lazy(() => import("./pages/ClientLikedProperties"));
const ClientWhoLikedYou = lazy(() => import("./pages/ClientWhoLikedYou"));
const ClientSavedSearches = lazy(() => import("./pages/ClientSavedSearches"));
const ClientSecurity = lazy(() => import("./pages/ClientSecurity"));
const ClientWorkerDiscovery = lazy(() => import("./pages/ClientWorkerDiscovery"));
const ClientContracts = lazy(() => import("./pages/ClientContracts"));
const ClientLawyerServices = lazy(() => import("./pages/ClientLawyerServices"));

// Owner routes - lazy loaded
const EnhancedOwnerDashboard = lazy(() => import("./components/EnhancedOwnerDashboard"));
const OwnerProfile = lazy(() => import("./pages/OwnerProfileNew"));
const OwnerSettings = lazy(() => import("./pages/OwnerSettingsNew"));
const OwnerProperties = lazy(() => import("./pages/OwnerProperties"));
const OwnerNewListing = lazy(() => import("./pages/OwnerNewListing"));
const ConversationalListingCreator = lazy(() => import("./components/ConversationalListingCreator").then(m => ({ default: m.ConversationalListingCreator })));
const OwnerLikedClients = lazy(() => import("./pages/OwnerLikedClients"));
const OwnerInterestedClients = lazy(() => import("./pages/OwnerInterestedClients"));
const OwnerContracts = lazy(() => import("./pages/OwnerContracts"));
const OwnerSavedSearches = lazy(() => import("./pages/OwnerSavedSearches"));
const OwnerSecurity = lazy(() => import("./pages/OwnerSecurity"));
const OwnerPropertyClientDiscovery = lazy(() => import("./pages/OwnerPropertyClientDiscovery"));
const OwnerMotoClientDiscovery = lazy(() => import("./pages/OwnerMotoClientDiscovery"));
const OwnerBicycleClientDiscovery = lazy(() => import("./pages/OwnerBicycleClientDiscovery"));
const OwnerViewClientProfile = lazy(() => import("./pages/OwnerViewClientProfile"));
const OwnerFiltersExplore = lazy(() => import("./pages/OwnerFiltersExplore"));
const OwnerLawyerServices = lazy(() => import("./pages/OwnerLawyerServices"));
// REMOVED: OwnerDashboardNew was imported but never routed - dead code causing bundle bloat

// Filter pages - lazy loaded
const ClientFilters = lazy(() => import("./pages/ClientFilters"));
const OwnerFilters = lazy(() => import("./pages/OwnerFilters"));

// Shared routes - lazy loaded
const MessagingDashboard = lazy(() => import("./pages/MessagingDashboard").then(m => ({ default: m.MessagingDashboard })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SubscriptionPackagesPage = lazy(() => import("./pages/SubscriptionPackagesPage"));
const RetroRadioStation = lazy(() => import("./pages/RetroRadioStation"));
const RadioPlaylists = lazy(() => import("./pages/RadioPlaylists"));
const RadioFavorites = lazy(() => import("./pages/RadioFavorites"));

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
const MockOwnersTestPage = lazy(() => import("./pages/MockOwnersTestPage"));

// Tutorial page - public onboarding experience
const TutorialSwipePage = lazy(() => import("./pages/TutorialSwipePage"));

const queryClient = new QueryClient({
  queryCache: new QueryCache({
    onError: (error) => {
      // Global error logger for uncaught query errors (non-disruptive, dev-visible)
      if (import.meta.env.DEV) {
        console.warn('[QueryCache] Uncaught query error:', error);
      }
    }
  }),
  defaultOptions: {
    queries: {
      retry: 1,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
      refetchOnWindowFocus: false, // Prevents flash/reloads when switching apps (critical for iOS)
      refetchOnMount: true,        // Only refetch if data is stale (respects staleTime)
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
      gcTime: 15 * 60 * 1000, // 15 minutes
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

// Silently re-registers push subscription for users who already granted permission
function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  usePushNotifications(); // hooks into service worker & re-syncs subscription if needed
  return <>{children}</>;
}

// Wrapper for automatic update system
function UpdateWrapper({ children }: { children: React.ReactNode }) {
  // Check for version changes and force update if needed
  useForceUpdateOnVersionChange();
  return <>{children}</>;
}

// Wrapper for profile auto-sync (real-time, visibility, periodic)
function ProfileSyncWrapper({ children }: { children: React.ReactNode }) {
  useProfileAutoSync();
  useEnsureSpecializedProfile();
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
            <ProfileSyncWrapper>
              <NotificationWrapper>
              <PushNotificationWrapper>
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
                      <Route path="/owner/listings/new-ai" element={<ConversationalListingCreator />} />
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
                      <Route path="/radio" element={<RetroRadioStation />} />
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

                    {/* Tutorial / Onboarding - Public Access */}
                    <Route path="/tutorial" element={<TutorialSwipePage />} />

                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </Suspense>
              </AppLayout>
              </PushNotificationWrapper>
              </NotificationWrapper>
            </ProfileSyncWrapper>
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
