import { lazy, Suspense } from "react"; // cache-bust-v3
import { lazyWithRetry } from "@/utils/lazyRetry";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootProviders } from "./providers/RootProviders";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useActiveMode } from "@/hooks/useActiveMode";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import { AnimatedPage } from "@/components/AnimatedPage";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { TooltipProvider } from "@/components/ui/tooltip";

// SpeedOfLightPreloader removed — redundant with WarpPrefetcher in RootProviders
import Index from "./pages/Index";

// PERF: Defer i18n init behind idle callback — loaded after first render to reduce critical JS
if (typeof window !== 'undefined') {
  const loadI18n = () => import('@/i18n');
  if ('requestIdleCallback' in window) {
    (window as any).requestIdleCallback(loadI18n, { timeout: 3000 });
  } else {
    setTimeout(loadI18n, 2000);
  }
}

// 🚀 SPEED OF LIGHT: LAZY PAGES — all via lazyWithRetry so stale CDN chunks
// after a redeploy get one automatic retry before surfacing to ChunkErrorBoundary.
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazyWithRetry(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazyWithRetry(() => import("./pages/TermsOfService"));
const LegalPage = lazyWithRetry(() => import("./pages/LegalPage"));
const AGLPage = lazyWithRetry(() => import("./pages/AGLPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const FAQClientPage = lazyWithRetry(() => import("./pages/FAQClientPage"));
const FAQOwnerPage = lazyWithRetry(() => import("./pages/FAQOwnerPage"));

// CLIENT PAGES
const ClientDashboard = lazyWithRetry(() => import("./pages/ClientDashboard"));
const ClientProfile = lazyWithRetry(() => import("./pages/ClientProfile"));
const ClientSettings = lazyWithRetry(() => import("./pages/ClientSettings"));
const ClientLikedProperties = lazyWithRetry(() => import("./pages/ClientLikedProperties"));
const ClientWhoLikedYou = lazyWithRetry(() => import("./pages/ClientWhoLikedYou"));
const ClientSavedSearches = lazyWithRetry(() => import("./pages/ClientSavedSearches"));
const ClientSecurity = lazyWithRetry(() => import("./pages/ClientSecurity"));
const ClientWorkerDiscovery = lazyWithRetry(() => import("./pages/ClientWorkerDiscovery"));
const ClientContracts = lazyWithRetry(() => import("./pages/ClientContracts"));
const ClientLawyerServices = lazyWithRetry(() => import("./pages/ClientLawyerServices"));
const ClientSelfieCamera = lazyWithRetry(() => import("./pages/ClientSelfieCamera"));
const ClientFilters = lazyWithRetry(() => import("./pages/ClientFilters"));
const MaintenanceRequests = lazyWithRetry(() => import("./pages/MaintenanceRequests"));
const AdvertisePage = lazyWithRetry(() => import("./pages/AdvertisePage"));

// OWNER PAGES
const EnhancedOwnerDashboard = lazyWithRetry(() => import("./pages/EnhancedOwnerDashboard"));
const OwnerProfile = lazyWithRetry(() => import("./pages/OwnerProfile"));
const OwnerSettings = lazyWithRetry(() => import("./pages/OwnerSettings"));
const OwnerProperties = lazyWithRetry(() => import("./pages/OwnerProperties"));
const OwnerNewListing = lazyWithRetry(() => import("./pages/OwnerNewListing"));
const OwnerLikedClients = lazyWithRetry(() => import("./pages/OwnerLikedClients"));
const OwnerInterestedClients = lazyWithRetry(() => import("./pages/OwnerInterestedClients"));
const OwnerViewClientProfile = lazyWithRetry(() => import("./pages/OwnerViewClientProfile"));
const OwnerLawyerServices = lazyWithRetry(() => import("./pages/OwnerLawyerServices"));
const OwnerSecurity = lazyWithRetry(() => import("./pages/OwnerSecurity"));
const OwnerSavedSearches = lazyWithRetry(() => import("./pages/OwnerSavedSearches"));
const OwnerContracts = lazyWithRetry(() => import("./pages/OwnerContracts"));
const OwnerProfileCamera = lazyWithRetry(() => import("./pages/OwnerProfileCamera"));
const OwnerListingCamera = lazyWithRetry(() => import("./pages/OwnerListingCamera"));
const OwnerFilters = lazyWithRetry(() => import("./pages/OwnerFilters"));
const OwnerDiscovery = lazyWithRetry(() => import("./pages/OwnerDiscovery"));

// SHARED PAGES
const MessagingDashboard = lazyWithRetry(() => import("./pages/MessagingDashboard").then(m => ({ default: m.MessagingDashboard })));
const NotificationsPage = lazyWithRetry(() => import("./pages/NotificationsPage"));
const SubscriptionPackagesPage = lazyWithRetry(() => import("./pages/SubscriptionPackagesPage"));
const WorldRadioDirectory = lazyWithRetry(() => import("./pages/WorldRadioDirectory"));
const DJTurntableRadio = lazyWithRetry(() => import("./pages/DJTurntableRadio"));
const EventosFeed = lazyWithRetry(() => import("./pages/EventosFeed"));
const EventoDetail = lazyWithRetry(() => import("./pages/EventoDetail"));
const EventosLikes = lazyWithRetry(() => import("./pages/EventosLikes"));
const AdminEventos = lazyWithRetry(() => import("./pages/AdminEventos"));
const AdminPhotos = lazyWithRetry(() => import("./pages/AdminPhotos"));
const AdminPerformanceDashboard = lazyWithRetry(() => import("./pages/AdminPerformanceDashboard"));
const PriceTracker = lazyWithRetry(() => import("./pages/PriceTracker"));
const VideoTours = lazyWithRetry(() => import("./pages/VideoTours"));
const LocalIntel = lazyWithRetry(() => import("./pages/LocalIntel"));
const RoommateMatching = lazyWithRetry(() => import("./pages/RoommateMatching"));
const DocumentVault = lazyWithRetry(() => import("./pages/DocumentVault"));
const EscrowDashboard = lazyWithRetry(() => import("./pages/EscrowDashboard"));
const ClientPerks = lazyWithRetry(() => import("./pages/ClientPerks"));
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazyWithRetry(() => import("./pages/PaymentCancel"));

// PUBLIC PREVIEWS
const PublicProfilePreview = lazyWithRetry(() => import("./pages/PublicProfilePreview"));
const PublicListingPreview = lazyWithRetry(() => import("./pages/PublicListingPreview"));
const VapValidate = lazyWithRetry(() => import("./pages/VapValidate"));

// UI HELPERS
const PersistentDashboardLayout = lazyWithRetry(() => import("@/components/PersistentDashboardLayout").then(m => ({ default: m.PersistentDashboardLayout })));
// Sonner toasts removed — all notifications now use premium NotificationBar
const GuidedTourLazy = lazyWithRetry(() => import("./components/GuidedTour").then(m => ({ default: m.GuidedTour })));
const PWAInstallPrompt = lazyWithRetry(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const WelcomeBonusModal = lazyWithRetry(() => import("@/components/WelcomeBonusModal").then(m => ({ default: m.WelcomeBonusModal })));

const DashboardRedirect = () => {
  const { activeMode } = useActiveMode();
  return <Navigate to={activeMode === 'owner' ? "/owner/dashboard" : "/client/dashboard"} replace />;
};

const App = ({ authPromise }: { authPromise?: Promise<any> }) => {
  return (
    <GlobalErrorBoundary>
      <RootProviders authPromise={authPromise}>
        
        <AppLayout>
          <TooltipProvider>
          <WelcomeBonusModal />

          <Suspense fallback={null}>
            <GuidedTourLazy />
            <PWAInstallPrompt />
          </Suspense>

          <Routes>
            <Route path="/" element={<SignupErrorBoundary><Index /></SignupErrorBoundary>} />
            <Route path="/reset-password" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><ResetPassword /></AnimatedPage></Suspense>} />

            <Route element={<ProtectedRoute><PersistentDashboardLayout /></ProtectedRoute>}>
              {/* Individual routes are suspended by the Suspense in PersistentDashboardLayout/AnimatedOutlet */}
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

              <Route path="/client/maintenance" element={<MaintenanceRequests />} />
              <Route path="/client/advertise" element={<AdvertisePage />} />

              {/* Owner routes */}
              <Route path="/owner/dashboard" element={<EnhancedOwnerDashboard />} />
              <Route path="/owner/profile" element={<OwnerProfile />} />
              <Route path="/owner/settings" element={<OwnerSettings />} />
              <Route path="/owner/properties" element={<OwnerProperties />} />
              <Route path="/owner/listings/new" element={<OwnerNewListing />} />

              <Route path="/owner/liked-clients" element={<OwnerLikedClients />} />
              <Route path="/owner/interested-clients" element={<OwnerInterestedClients />} />
              <Route path="/owner/view-client/:clientId" element={<OwnerViewClientProfile />} />
              <Route path="/owner/saved-searches" element={<OwnerSavedSearches />} />
              <Route path="/owner/security" element={<OwnerSecurity />} />
              <Route path="/owner/contracts" element={<OwnerContracts />} />
              <Route path="/owner/legal-services" element={<OwnerLawyerServices />} />
              <Route path="/owner/camera" element={<OwnerProfileCamera />} />
              <Route path="/owner/camera/listing" element={<OwnerListingCamera />} />
              <Route path="/owner/filters" element={<OwnerFilters />} />
              <Route path="/owner/discovery" element={<OwnerDiscovery />} />

              {/* Shared routes */}
              <Route path="/messages" element={<MessagingDashboard />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/subscription/packages" element={<SubscriptionPackagesPage />} />
              <Route path="/radio" element={<DJTurntableRadio />} />
              <Route path="/radio/directory" element={<WorldRadioDirectory />} />

              {/* Explore/Events */}
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
              <Route path="/client/perks" element={<ClientPerks />} />
            </Route>

            {/* Outside Layout */}
            <Route path="/payment/success" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentSuccess /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/payment/cancel" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentCancel /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/privacy-policy" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PrivacyPolicy /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/terms-of-service" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><TermsOfService /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/agl" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><AGLPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/legal" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><LegalPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/about" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><AboutPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/faq/client" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQClientPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/faq/owner" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQOwnerPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/profile/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicProfilePreview /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/listing/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicListingPreview /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/vap-validate/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><VapValidate /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/share-target" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><NotFound /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
          </Routes>
          </TooltipProvider>
        </AppLayout>
      </RootProviders>
    </GlobalErrorBoundary>
  );
};

export default App;


