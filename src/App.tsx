import { lazy, Suspense, useState } from "react"; // cache-bust-v3
import { lazyWithRetry } from "@/utils/lazyRetry";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootProviders } from "./providers/RootProviders";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { useActiveMode } from "@/hooks/useActiveMode";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import { AppOutagePage } from "@/components/AppOutagePage";
import { APP_STATUS, hasOutageBypass } from "@/config/outage";
import { AnimatedPage } from "@/components/AnimatedPage";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";


import { SpeedOfLightPreloader } from "@/components/SpeedOfLightPreloader";
import Index from "./pages/Index";

// Defer i18n init — loaded after first render to reduce critical JS
const i18nReady = import('@/i18n'); // hmr-refresh

// 🚀 SPEED OF LIGHT: LAZY PAGES
const NotFound = lazy(() => import("./pages/NotFound"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const TermsOfService = lazy(() => import("./pages/TermsOfService"));
const LegalPage = lazy(() => import("./pages/LegalPage"));
const AGLPage = lazy(() => import("./pages/AGLPage"));
const AboutPage = lazy(() => import("./pages/AboutPage"));
const FAQClientPage = lazy(() => import("./pages/FAQClientPage"));
const FAQOwnerPage = lazy(() => import("./pages/FAQOwnerPage"));

// CLIENT PAGES
const ClientDashboard = lazy(() => import("./pages/ClientDashboard"));
const ClientProfile = lazy(() => import("./pages/ClientProfile"));
const ClientSettings = lazy(() => import("./pages/ClientSettings"));
const ClientLikedProperties = lazy(() => import("./pages/ClientLikedProperties"));
const ClientWhoLikedYou = lazy(() => import("./pages/ClientWhoLikedYou"));
const ClientSavedSearches = lazy(() => import("./pages/ClientSavedSearches"));
const ClientSecurity = lazy(() => import("./pages/ClientSecurity"));
const ClientWorkerDiscovery = lazy(() => import("./pages/ClientWorkerDiscovery"));
const ClientContracts = lazy(() => import("./pages/ClientContracts"));
const ClientLawyerServices = lazy(() => import("./pages/ClientLawyerServices"));
const ClientSelfieCamera = lazy(() => import("./pages/ClientSelfieCamera"));
const ClientFilters = lazy(() => import("./pages/ClientFilters"));
const MaintenanceRequests = lazy(() => import("./pages/MaintenanceRequests"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));

// OWNER PAGES
const EnhancedOwnerDashboard = lazy(() => import("./components/EnhancedOwnerDashboard"));
const OwnerProfile = lazy(() => import("./pages/OwnerProfile"));
const OwnerSettings = lazy(() => import("./pages/OwnerSettings"));
const OwnerProperties = lazy(() => import("./pages/OwnerProperties"));
const OwnerNewListing = lazy(() => import("./pages/OwnerNewListing"));

const OwnerLikedClients = lazy(() => import("./pages/OwnerLikedClients"));
const OwnerInterestedClients = lazy(() => import("./pages/OwnerInterestedClients"));
const OwnerDiscovery = lazy(() => import("./pages/OwnerDiscovery"));
const OwnerViewClientProfile = lazy(() => import("./pages/OwnerViewClientProfile"));
const OwnerLawyerServices = lazy(() => import("./pages/OwnerLawyerServices"));
const OwnerSecurity = lazy(() => import("./pages/OwnerSecurity"));
const OwnerSavedSearches = lazy(() => import("./pages/OwnerSavedSearches"));
const OwnerContracts = lazy(() => import("./pages/OwnerContracts"));
const OwnerProfileCamera = lazy(() => import("./pages/OwnerProfileCamera"));
const OwnerListingCamera = lazy(() => import("./pages/OwnerListingCamera"));

// SHARED PAGES
const MessagingDashboard = lazy(() => import("./pages/MessagingDashboard").then(m => ({ default: m.MessagingDashboard })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SubscriptionPackagesPage = lazy(() => import("./pages/SubscriptionPackagesPage"));
const DJTurntableRadio = lazyWithRetry(() => import("./pages/DJTurntableRadio"));
const EventosFeed = lazy(() => import("./pages/EventosFeed"));
const EventoDetail = lazy(() => import("./pages/EventoDetail"));
const EventosLikes = lazy(() => import("./pages/EventosLikes"));
const AdminEventos = lazy(() => import("./pages/AdminEventos"));
const AdminPhotos = lazy(() => import("./pages/AdminPhotos"));
const AdminPerformanceDashboard = lazy(() => import("./pages/AdminPerformanceDashboard"));
const PriceTracker = lazy(() => import("./pages/PriceTracker"));
const VideoTours = lazy(() => import("./pages/VideoTours"));
const LocalIntel = lazy(() => import("./pages/LocalIntel"));
const RoommateMatching = lazy(() => import("./pages/RoommateMatching"));
const DocumentVault = lazy(() => import("./pages/DocumentVault"));
const EscrowDashboard = lazy(() => import("./pages/EscrowDashboard"));
const ClientPerks = lazy(() => import("./pages/ClientPerks"));
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));

// PUBLIC PREVIEWS
const PublicProfilePreview = lazy(() => import("./pages/PublicProfilePreview"));
const PublicListingPreview = lazy(() => import("./pages/PublicListingPreview"));
const VapValidate = lazy(() => import("./pages/VapValidate"));

// UI HELPERS
const PersistentDashboardLayout = lazy(() => import("@/components/PersistentDashboardLayout").then(m => ({ default: m.PersistentDashboardLayout })));
// Sonner toasts removed — all notifications now use premium NotificationBar
const GuidedTourLazy = lazy(() => import("./components/GuidedTour").then(m => ({ default: m.GuidedTour })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const WelcomeBonusModal = lazy(() => import("@/components/WelcomeBonusModal").then(m => ({ default: m.WelcomeBonusModal })));

const DashboardRedirect = () => {
  const { activeMode } = useActiveMode();
  return <Navigate to={activeMode === 'owner' ? "/owner/dashboard" : "/client/dashboard"} replace />;
};

const App = ({ authPromise }: { authPromise?: Promise<any> }) => {
  const [outageBypassed, setOutageBypassed] = useState(() => hasOutageBypass());

  if (APP_STATUS === 'MAINTENANCE' && !outageBypassed) {
    return <AppOutagePage onBypass={() => setOutageBypassed(true)} />;
  }

  return (
    <GlobalErrorBoundary>
      <RootProviders authPromise={authPromise}>
        <SpeedOfLightPreloader />
        <AppLayout>
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
              <Route path="/owner/discovery" element={<OwnerDiscovery />} />
              <Route path="/owner/filters" element={<OwnerDiscovery />} />
              <Route path="/owner/clients/property" element={<OwnerDiscovery />} />
              <Route path="/owner/clients/moto" element={<OwnerDiscovery />} />
              <Route path="/owner/clients/bicycle" element={<OwnerDiscovery />} />
              <Route path="/owner/view-client/:clientId" element={<OwnerViewClientProfile />} />
              <Route path="/owner/saved-searches" element={<OwnerSavedSearches />} />
              <Route path="/owner/security" element={<OwnerSecurity />} />
              <Route path="/owner/contracts" element={<OwnerContracts />} />
              <Route path="/owner/legal-services" element={<OwnerLawyerServices />} />
              <Route path="/owner/camera" element={<OwnerProfileCamera />} />
              <Route path="/owner/camera/listing" element={<OwnerListingCamera />} />

              {/* Shared routes */}
              <Route path="/messages" element={<MessagingDashboard />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/subscription/packages" element={<SubscriptionPackagesPage />} />
              <Route path="/radio" element={<DJTurntableRadio />} />

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
            <Route path="/payment/success" element={<Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentSuccess /></AnimatedPage></Suspense>} />
            <Route path="/payment/cancel" element={<Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentCancel /></AnimatedPage></Suspense>} />
            <Route path="/privacy-policy" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PrivacyPolicy /></AnimatedPage></Suspense>} />
            <Route path="/terms-of-service" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><TermsOfService /></AnimatedPage></Suspense>} />
            <Route path="/agl" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><AGLPage /></AnimatedPage></Suspense>} />
            <Route path="/legal" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><LegalPage /></AnimatedPage></Suspense>} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/about" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><AboutPage /></AnimatedPage></Suspense>} />
            <Route path="/faq/client" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQClientPage /></AnimatedPage></Suspense>} />
            <Route path="/faq/owner" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQOwnerPage /></AnimatedPage></Suspense>} />
            <Route path="/profile/:id" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicProfilePreview /></AnimatedPage></Suspense>} />
            <Route path="/listing/:id" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicListingPreview /></AnimatedPage></Suspense>} />
            <Route path="/vap-validate/:id" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><VapValidate /></AnimatedPage></Suspense>} />
            <Route path="/share-target" element={<Navigate to="/dashboard" replace />} />
            <Route path="*" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><NotFound /></AnimatedPage></Suspense>} />
          </Routes>
        </AppLayout>
      </RootProviders>
    </GlobalErrorBoundary>
  );
};

export default App;
