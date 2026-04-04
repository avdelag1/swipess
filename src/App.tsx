import { lazy, Suspense, useState } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { RootProviders } from "./providers/RootProviders";
import { useAuth } from "@/hooks/useAuth";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import { AppOutagePage } from "@/components/AppOutagePage";
import { IS_OUTAGE_ACTIVE, hasOutageBypass } from "@/config/outage";
import { AnimatedPage } from "@/components/AnimatedPage";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { TooltipProvider } from "@/components/ui/tooltip";
import '@/i18n';

// 🚀 SPEED OF LIGHT: LAZY PAGES
const Index = lazy(() => import("./pages/Index"));
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
const ClientProfile = lazy(() => import("./pages/ClientProfileNew"));
const ClientSettings = lazy(() => import("./pages/ClientSettingsNew"));
const ClientLikedProperties = lazy(() => import("./pages/ClientLikedProperties"));
const ClientWhoLikedYou = lazy(() => import("./pages/ClientWhoLikedYou"));
const ClientSavedSearches = lazy(() => import("./pages/ClientSavedSearches"));
const ClientSecurity = lazy(() => import("./pages/ClientSecurity"));
const ClientWorkerDiscovery = lazy(() => import("./pages/ClientWorkerDiscovery"));
const ClientContracts = lazy(() => import("./pages/ClientContracts"));
const ClientLawyerServices = lazy(() => import("./pages/ClientLawyerServices"));
const ClientSelfieCamera = lazy(() => import("./pages/ClientSelfieCamera"));
const ClientFilters = lazy(() => import("./pages/ClientFilters"));
const AdvertisePage = lazy(() => import("./pages/AdvertisePage"));
const MaintenanceRequests = lazy(() => import("./pages/MaintenanceRequests"));

// OWNER PAGES
const EnhancedOwnerDashboard = lazy(() => import("./components/EnhancedOwnerDashboard"));
const OwnerProfile = lazy(() => import("./pages/OwnerProfileNew"));
const OwnerSettings = lazy(() => import("./pages/OwnerSettingsNew"));
const OwnerProperties = lazy(() => import("./pages/OwnerProperties"));
const OwnerNewListing = lazy(() => import("./pages/OwnerNewListing"));
const ConversationalListingCreator = lazy(() => import("./components/ConversationalListingCreator").then(m => ({ default: m.ConversationalListingCreator })));
const OwnerLikedClients = lazy(() => import("./pages/OwnerLikedClients"));
const OwnerInterestedClients = lazy(() => import("./pages/OwnerInterestedClients"));
const OwnerPropertyClientDiscovery = lazy(() => import("./pages/OwnerPropertyClientDiscovery"));
const OwnerMotoClientDiscovery = lazy(() => import("./pages/OwnerMotoClientDiscovery"));
const OwnerBicycleClientDiscovery = lazy(() => import("./pages/OwnerBicycleClientDiscovery"));
const OwnerViewClientProfile = lazy(() => import("./pages/OwnerViewClientProfile"));
const OwnerFiltersExplore = lazy(() => import("./pages/OwnerFiltersExplore"));
const OwnerLawyerServices = lazy(() => import("./pages/OwnerLawyerServices"));
const OwnerSecurity = lazy(() => import("./pages/OwnerSecurity"));
const OwnerSavedSearches = lazy(() => import("./pages/OwnerSavedSearches"));
const OwnerContracts = lazy(() => import("./pages/OwnerContracts"));
const OwnerProfileCamera = lazy(() => import("./pages/OwnerProfileCamera"));
const OwnerListingCamera = lazy(() => import("./pages/OwnerListingCamera"));
const OwnerFilters = lazy(() => import("./pages/OwnerFilters"));

// SHARED PAGES
const MessagingDashboard = lazy(() => import("./pages/MessagingDashboard").then(m => ({ default: m.MessagingDashboard })));
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"));
const SubscriptionPackagesPage = lazy(() => import("./pages/SubscriptionPackagesPage"));
const DJTurntableRadio = lazy(() => import("./pages/DJTurntableRadio"));
const RadioPlaylists = lazy(() => import("./pages/RadioPlaylists"));
const RadioFavorites = lazy(() => import("./pages/RadioFavorites"));
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
const PaymentSuccess = lazy(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazy(() => import("./pages/PaymentCancel"));

// PUBLIC PREVIEWS
const PublicProfilePreview = lazy(() => import("./pages/PublicProfilePreview"));
const PublicListingPreview = lazy(() => import("./pages/PublicListingPreview"));

// UI HELPERS
import { PersistentDashboardLayout } from '@/components/PersistentDashboardLayout';
const Toaster = lazy(() => import("@/components/ui/toaster").then(m => ({ default: m.Toaster })));
const Sonner = lazy(() => import("@/components/ui/sonner").then(m => ({ default: m.Toaster })));
const GuidedTourLazy = lazy(() => import("./components/GuidedTour").then(m => ({ default: m.GuidedTour })));
const PWAInstallPrompt = lazy(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));
const WelcomeBonusModal = lazy(() => import("@/components/WelcomeBonusModal").then(m => ({ default: m.WelcomeBonusModal })));

const DashboardRedirect = () => {
  const { user } = useAuth();
  const metadataRole = user?.user_metadata?.role;
  return <Navigate to={metadataRole === 'owner' ? "/owner/dashboard" : "/client/dashboard"} replace />;
};

const App = ({ authPromise }: { authPromise?: Promise<any> }) => {
  const [outageBypassed, setOutageBypassed] = useState(() => hasOutageBypass());

  if (IS_OUTAGE_ACTIVE && !outageBypassed) {
    return <AppOutagePage onBypass={() => setOutageBypassed(true)} />;
  }

  return (
    <GlobalErrorBoundary>
      <RootProviders authPromise={authPromise}>
        <AppLayout>
          <WelcomeBonusModal />
          <TooltipProvider>
            <Suspense fallback={null}>
              <Toaster />
              <Sonner />
            </Suspense>
          </TooltipProvider>

          <Suspense fallback={null}>
            <GuidedTourLazy />
            <PWAInstallPrompt />
          </Suspense>

          <Routes>
            <Route path="/" element={<SignupErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><Index /></Suspense></SignupErrorBoundary>} />
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

              {/* Shared routes */}
              <Route path="/messages" element={<MessagingDashboard />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/subscription-packages" element={<SubscriptionPackagesPage />} />
              <Route path="/radio" element={<DJTurntableRadio />} />
              <Route path="/radio/playlists" element={<RadioPlaylists />} />
              <Route path="/radio/favorites" element={<RadioFavorites />} />

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
            <Route path="*" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><NotFound /></AnimatedPage></Suspense>} />
          </Routes>
        </AppLayout>
      </RootProviders>
    </GlobalErrorBoundary>
  );
};

export default App;
