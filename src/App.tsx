import { lazy, Suspense, useState, useEffect } from "react";
import { QueryClient, QueryCache, useQueryClient } from "@tanstack/react-query";
import { PersistQueryClientProvider } from "@tanstack/react-query-persist-client";
import { createIDBPersister } from "@/lib/persister";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { LazyMotion, domMax } from "framer-motion";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ThemeProvider } from "@/hooks/useTheme";
import { ResponsiveProvider } from "@/contexts/ResponsiveContext";
import { ActiveModeProvider } from "@/hooks/useActiveMode";
import { PWAProvider } from "@/hooks/usePWAMode";
import { RadioProvider } from "@/contexts/RadioContext";
import { useNotifications } from "@/hooks/useNotifications";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import ErrorBoundary from "@/components/ErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import { AppOutagePage } from "@/components/AppOutagePage";
import { IS_OUTAGE_ACTIVE, hasOutageBypass } from "@/config/outage";
import { useConnectionHealth } from "@/hooks/useConnectionHealth";
import { ConnectionErrorScreen } from "@/components/ConnectionErrorScreen";
import { AnimatedPage } from "@/components/AnimatedPage";
const Index = lazy(() => import("./pages/Index"));
import '@/i18n';
const NotFound = lazy(() => import("./pages/NotFound"));

// Automatic update system
import { useForceUpdateOnVersionChange, UpdateNotification } from "@/hooks/useAutomaticUpdates";

// PWA install prompt (shown after 45s for eligible users/devices)
import { PWAInstallPrompt } from "@/components/PWAInstallPrompt";
import { WelcomeBonusModal } from "@/components/WelcomeBonusModal";

// Profile auto-sync system - keeps profile data fresh for all users
import { useProfileAutoSync, useEnsureSpecializedProfile } from "@/hooks/useProfileAutoSync";

// SPEED OF LIGHT: Persistent layout wrapper - mounted ONCE, never remounts
const PersistentDashboardLayout = lazy(() => import("@/components/PersistentDashboardLayout").then(m => ({ default: m.PersistentDashboardLayout })));
import { ZenithPrewarmer } from "@/components/ZenithPrewarmer";
import type { QuickFilterCategory } from "@/types/filters";


// Non-critical UI elements moved to lazy load for 100/100 performance
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
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
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const OwnerFilters = lazy(() => import("./pages/OwnerFilters"));

// Shared routes - lazy loaded
const MessagingDashboard = lazy(() => import("./pages/MessagingDashboard").then(m => ({ default: m.MessagingDashboard })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SubscriptionPackagesPage = lazy(() => import("./pages/SubscriptionPackagesPage"));

const DJTurntableRadio = lazy(() => import("./pages/DJTurntableRadio"));
const RadioPlaylists = lazy(() => import("./pages/RadioPlaylists"));
const RadioFavorites = lazy(() => import("./pages/RadioFavorites"));

// New feature pages - lazy loaded
const EventosFeed = lazy(() => import("./pages/EventosFeed"));
const EventoDetail = lazy(() => import("./pages/EventoDetail"));
const AdminEventos = lazy(() => import("./pages/AdminEventos"));
const AdminPhotos = lazy(() => import("./pages/AdminPhotos"));
const AdminPerformanceDashboard = lazy(() => import("./pages/AdminPerformanceDashboard"));
const PriceTracker = lazy(() => import("./pages/PriceTracker"));
const VideoTours = lazy(() => import("./pages/VideoTours"));
const LocalIntel = lazy(() => import("./pages/LocalIntel"));
const RoommateMatching = lazy(() => import("./pages/RoommateMatching"));
const DocumentVault = lazy(() => import("./pages/DocumentVault"));
const EscrowDashboard = lazy(() => import("./pages/EscrowDashboard"));
const MaintenanceRequests = lazy(() => import("./pages/MaintenanceRequests"));

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

const GuidedTourLazy = lazy(() => import("./components/GuidedTour").then(m => ({ default: m.GuidedTour })));
const EventosLikes = lazy(() => import("./pages/EventosLikes"));


// Route-deciding redirect for /dashboard
const DashboardRedirect = () => {
  const { user } = useAuth();
  const metadataRole = user?.user_metadata?.role;
  return <Navigate to={metadataRole === 'owner' ? "/owner/dashboard" : "/client/dashboard"} replace />;
};

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
      refetchOnMount: false,        // NATIVE FEEL: Don't refetch on navigation if data is in cache
      refetchOnReconnect: true,
      staleTime: 5 * 60 * 1000, // 5 minutes - reduce unnecessary refetches
      gcTime: 1000 * 60 * 60 * 24, // 24 hours - keep data in cache for a long time
      networkMode: 'offlineFirst', // Better offline support
    },
    mutations: {
      retry: 1,
      networkMode: 'offlineFirst',
    },
  },
});

const persister = createIDBPersister();

function NotificationWrapper({ children }: { children: React.ReactNode }) {
  useNotifications();
  return <>{children}</>;
}

// Silently re-registers push subscription for users who already granted permission
function PushNotificationWrapper({ children }: { children: React.ReactNode }) {
  usePushNotifications(); // hooks into service worker & re-syncs subscription if needed
  return <>{children}</>;
}

// Wrapper for automatic update system: Ensures build versions match
function UpdateWrapper({ children }: { children: React.ReactNode }) {
  useForceUpdateOnVersionChange();
  return <>{children}</>;
}

// Wrapper for profile auto-sync (real-time, visibility, periodic)
function ProfileSyncWrapper({ children }: { children: React.ReactNode }) {
  useProfileAutoSync();
  useEnsureSpecializedProfile();
  return <>{children}</>;
}

// Guards app access: shows ConnectionErrorScreen when Supabase is unreachable
// instead of leaving the user with a blank/frozen screen
function ConnectionGuard({ children }: { children: React.ReactNode }) {
  const { status, retryCount, retry } = useConnectionHealth();

  if (status === 'disconnected' || status === 'checking' || status === 'degraded') {
    // Show error screen only when fully disconnected — still render app while checking/degraded
    // to avoid false positives on slow connections
    if (status === 'disconnected') {
      return <ConnectionErrorScreen status={status} retryCount={retryCount} onRetry={retry} />;
    }
  }

  return <>{children}</>;
}

// 🚀 SPEED OF LIGHT: Predictive Chunk Preloading
// Once we know the user's role, we can pre-import their dashboard system in the background.
// This ensures that clicking "Dashboard" is completely instant (no "Loading..." state).
function PredictiveBundleLoader() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  useEffect(() => {
    if (!user) return;
    
    const role = user.user_metadata?.role;
    
    const prefetchData = () => {
      // Role-agnostic essentials
      queryClient.prefetchQuery({
        queryKey: ['client-profile', user.id],
        staleTime: Infinity,
      });
      
      // Role-specific massive prefetch
      if (role === 'owner') {
        queryClient.prefetchQuery({
          queryKey: ['owner-stats', user.id],
          staleTime: 1000 * 60
        });
      } else {
        // CLIENT: Extreme hydration for all discovery paths
        const categories: QuickFilterCategory[] = ['property', 'motorcycle', 'bicycle', 'services'];
        categories.forEach(cat => {
          queryClient.prefetchQuery({
            queryKey: ['listings', cat],
            staleTime: Infinity,
          });
        });
        
        // Also prefetch 'all' and 'smart' listings
        queryClient.prefetchQuery({
          queryKey: ['listings', null],
          staleTime: Infinity
        });
        
        queryClient.prefetchQuery({
          queryKey: ['smart-listings', user.id, [], { categories: [] }, 0],
          staleTime: 5 * 60 * 1000
        });
      }
    };

    // 2. BUNDLE PREFETCHING: Load the JS chunks
    const prefetchDashboard = () => {
      // Logic for pre-fetching dashboard chunks
      if (role === 'owner') {
        import("./components/EnhancedOwnerDashboard");
        import("./pages/OwnerProfileNew");
        import("./pages/OwnerProperties");
      } else {
        import("./pages/ClientDashboard");
        import("./pages/ClientProfileNew");
        import("./pages/ClientLikedProperties");
      }
      
      // Secondary prefetch: Shared high-traffic routes
      setTimeout(() => {
        import("./pages/MessagingDashboard");
        import("./pages/NotificationsPage");
        import("./pages/EventosFeed");
        import("./pages/SubscriptionPackagesPage"); // PREFETCH PRICING
        import("./pages/AboutPage"); // PREFETCH INFO
      }, 2000); // Reduced delay from 3000 to 2000
    };

    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => {
        prefetchData();
        prefetchDashboard();
      });
    } else {
      setTimeout(() => {
        prefetchData();
        prefetchDashboard();
      }, 1500);
    }
  }, [user, queryClient]);

  return null;
}

const App = ({ authPromise }: { authPromise?: Promise<any> }) => {
  // Outage gate: bypassed via ?preview=swipess URL param or 7× logo tap
  const [outageBypassed, setOutageBypassed] = useState(() => hasOutageBypass());

  // SpeedInsights mounted dynamically to not block initial paint
  // IMPORTANT: hooks must be declared before any conditional returns (Rules of Hooks)
  const [SpeedInsightsComponent, setSpeedInsightsComponent] = useState<any>(null);
  useEffect(() => {
    // Non-critical: load performance monitoring ONLY once app is fully idle
    const delaySpeedInsights = () => {
      import("@vercel/speed-insights/react").then(mod => {
        setSpeedInsightsComponent(() => mod.SpeedInsights);
      });
    };
    if ('requestIdleCallback' in window) {
      (window as any).requestIdleCallback(() => setTimeout(delaySpeedInsights, 3000));
    } else {
      setTimeout(delaySpeedInsights, 5000);
    }

    // SPEED OF LIGHT: Signal to main.tsx and index.html that React has finished initial paint
    requestAnimationFrame(() => {
      (window as any).__APP_MOUNTED__ = true;
      window.dispatchEvent(new CustomEvent('app-rendered'));
    });
  }, []);

  if (IS_OUTAGE_ACTIVE && !outageBypassed) {
    return <AppOutagePage onBypass={() => setOutageBypassed(true)} />;
  }

  return (
    <GlobalErrorBoundary>
      <ConnectionGuard>
        <PersistQueryClientProvider 
         client={queryClient} 
         persistOptions={{ 
           persister, 
           maxAge: 1000 * 60 * 60 * 24, // 24H data retention
           buster: 'v1.4', // Force refresh on significant asset change
         }} 
        >
        <LazyMotion features={domMax}>
          {SpeedInsightsComponent && <SpeedInsightsComponent />}
        
        <BrowserRouter
          future={{
            v7_startTransition: true,
            v7_relativeSplatPath: true
          }}
        >
          <AuthProvider authPromise={authPromise}>
            <ZenithPrewarmer />
            <PredictiveBundleLoader />
            
            <ActiveModeProvider>
            <ThemeProvider>
            <PWAProvider>
            <RadioProvider>
            <ResponsiveProvider>
            <UpdateWrapper>
            <ProfileSyncWrapper>
            <NotificationWrapper>
            <PushNotificationWrapper>

                                {/* Guided tour for first-time users */}
                                <Suspense fallback={null}>
                                  <GuidedTourLazy />
                                </Suspense>

                                {/* Update notification banner */}
                                <UpdateNotification />

                                {/* PWA install prompt — shown after 45s, respects dismissal */}
                                <PWAInstallPrompt />

                                  <AppLayout>
                                    <WelcomeBonusModal />
                                    <TooltipProvider>
                                      <Suspense fallback={null}>
                                        <Toaster />
                                        <Sonner />
                                      </Suspense>
                                    </TooltipProvider>

                                  <Suspense fallback={<SuspenseFallback />}>
                                    <Routes>
                                      <Route path="/" element={
                                        <SignupErrorBoundary>
                                          <Index />
                                        </SignupErrorBoundary>
                                      } />
                                      <Route path="/reset-password" element={<AnimatedPage><ResetPassword /></AnimatedPage>} />

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
                                        <Route path="/client/advertise" element={<AdvertisePage />} />
                                        <Route path="/client/maintenance" element={<MaintenanceRequests />} />

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
                                        {/* /dashboard removed — redirect handled below */}
                                        <Route path="/messages" element={<MessagingDashboard />} />
                                        <Route path="/notifications" element={<NotificationsPage />} />
                                        <Route path="/subscription-packages" element={<SubscriptionPackagesPage />} />
                                        <Route path="/radio" element={<DJTurntableRadio />} />
                                        <Route path="/radio/playlists" element={<RadioPlaylists />} />
                                        <Route path="/radio/favorites" element={<RadioFavorites />} />

                                        {/* New feature routes */}
                                        <Route path="/explore/eventos" element={<EventosFeed />} />
                                        <Route path="/explore/eventos/likes" element={<EventosLikes />} />
                                        <Route path="/explore/eventos/:id" element={<EventoDetail />} />
                                        <Route path="/admin/eventos" element={<AdminProtectedRoute><AdminEventos /></AdminProtectedRoute>} />
                                        <Route path="/admin/photos" element={<AdminProtectedRoute><AdminPhotos /></AdminProtectedRoute>} />
                                        <Route path="/admin/performance" element={<AdminProtectedRoute><AdminPerformanceDashboard /></AdminProtectedRoute>} />
                                        <Route path="/explore/prices" element={<PriceTracker />} />
                                        <Route path="/explore/tours" element={<VideoTours />} />
                                        <Route path="/explore/intel" element={<LocalIntel />} />
                                        <Route path="/explore/roommates" element={<RoommateMatching />} />

                                        <Route path="/documents" element={<DocumentVault />} />
                                        <Route path="/escrow" element={<EscrowDashboard />} />
                                      </Route>
 

                                      {/* Payment routes - outside layout */}
                                      <Route path="/payment/success" element={<Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentSuccess /></AnimatedPage></Suspense>} />
                                      <Route path="/payment/cancel" element={<Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentCancel /></AnimatedPage></Suspense>} />

                                      {/* Legal Pages - Public Access */}
                                      <Route path="/privacy-policy" element={<AnimatedPage><PrivacyPolicy /></AnimatedPage>} />
                                      <Route path="/terms-of-service" element={<AnimatedPage><TermsOfService /></AnimatedPage>} />
                                      <Route path="/agl" element={<AnimatedPage><AGLPage /></AnimatedPage>} />
                                      <Route path="/legal" element={<AnimatedPage><LegalPage /></AnimatedPage>} />



                                      {/* Legacy /dashboard redirect — smartly role-aware */}
                                      <Route path="/dashboard" element={<DashboardRedirect />} />

                                      {/* Info Pages - Public Access */}
                                      <Route path="/about" element={<AnimatedPage><AboutPage /></AnimatedPage>} />
                                      <Route path="/faq/client" element={<AnimatedPage><FAQClientPage /></AnimatedPage>} />
                                      <Route path="/faq/owner" element={<AnimatedPage><FAQOwnerPage /></AnimatedPage>} />

                                      {/* Public Preview Pages - Shareable Links */}
                                      <Route path="/profile/:id" element={<AnimatedPage><PublicProfilePreview /></AnimatedPage>} />
                                      <Route path="/listing/:id" element={<AnimatedPage><PublicListingPreview /></AnimatedPage>} />



                                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                                      <Route path="*" element={<AnimatedPage><NotFound /></AnimatedPage>} />
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
          </BrowserRouter>
        </LazyMotion>
      </PersistQueryClientProvider>
      </ConnectionGuard>
    </GlobalErrorBoundary>
  );
};

export default App;
