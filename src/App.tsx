import { Suspense, useEffect } from "react"; // cache-bust-v3
import { lazyWithRetry } from "@/utils/lazyRetry";
import { ChunkErrorBoundary } from "@/components/ChunkErrorBoundary";
import { Navigate, Route, Routes, useLocation, useParams } from "react-router-dom";
import { RootProviders } from "./providers/RootProviders";

import { ProtectedRoute } from "@/components/ProtectedRoute";
// import { useActiveMode } from "@/hooks/useActiveMode";
import { AdminProtectedRoute } from "@/components/AdminProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import GlobalErrorBoundary from "@/components/GlobalErrorBoundary";
import SignupErrorBoundary from "@/components/SignupErrorBoundary";
import { AnimatedPage } from "@/components/AnimatedPage";
import { SuspenseFallback } from "@/components/ui/suspense-fallback";
import { TooltipProvider } from "@/components/ui/tooltip";

const Index = lazyWithRetry(() => import("./pages/Index"));

// Redirect /messages/:conversationId → /messages?conversationId=:id
// (Push notifications link to the path form; the dashboard reads query params)
function MessagesRedirect() {
  const { conversationId } = useParams<{ conversationId: string }>();
  return <Navigate to={`/messages?conversationId=${conversationId}`} replace />;
}

// i18n must be initialized eagerly so any component calling useTranslation()
// during first render finds a registered i18next instance. Deferring caused
// the "You will need to pass in an i18next instance" warning + missing
// translations on first paint.
import "@/i18n";

// 🚀 SPEED OF LIGHT: LAZY PAGES — all via lazyWithRetry so stale CDN chunks
// after a redeploy get one automatic retry before surfacing to ChunkErrorBoundary.
const NotFound = lazyWithRetry(() => import("./pages/NotFound"));
const ResetPassword = lazyWithRetry(() => import("./pages/ResetPassword"));
const LegalHub = lazyWithRetry(() => import("./pages/LegalHub"));
const LawyerServicesPage = lazyWithRetry(() => import("./pages/LawyerServicesPage"));
const AboutPage = lazyWithRetry(() => import("./pages/AboutPage"));
const FAQClientPage = lazyWithRetry(() => import("./pages/FAQClientPage"));
const FAQOwnerPage = lazyWithRetry(() => import("./pages/FAQOwnerPage"));

// CLIENT PAGES
// ClientDashboard and EnhancedOwnerDashboard are now mounted persistently
// inside PersistentDashboardLayout (see PersistentDashboardScene). The
// route entries render an empty placeholder so the outlet stays clear
// and the persistent layer is what users see — this means navigating
// away and back to the dashboard is a CSS toggle, not a remount.
const ClientProfile = lazyWithRetry(() => import("./pages/ClientProfile"));
const ClientSettings = lazyWithRetry(() => import("./pages/ClientSettings"));
const UnifiedLikes = lazyWithRetry(() => import("./pages/UnifiedLikes"));
const ClientWhoLikedYou = lazyWithRetry(() => import("./pages/ClientWhoLikedYou"));
const ClientSavedSearches = lazyWithRetry(() => import("./pages/ClientSavedSearches"));
const ClientSecurity = lazyWithRetry(() => import("./pages/ClientSecurity"));
const ClientWorkerDiscovery = lazyWithRetry(() => import("./pages/ClientWorkerDiscovery"));
const ClientContracts = lazyWithRetry(() => import("./pages/ClientContracts"));
const ClientSelfieCamera = lazyWithRetry(() => import("./pages/ClientSelfieCamera"));
const ClientFilters = lazyWithRetry(() => import("./pages/ClientFilters"));
const MaintenanceRequests = lazyWithRetry(() => import("./pages/MaintenanceRequests"));
const AdvertisePage = lazyWithRetry(() => import("./pages/AdvertisePage"));

// OWNER PAGES
const OwnerSettings = lazyWithRetry(() => import("./pages/OwnerSettings"));
const OwnerProperties = lazyWithRetry(() => import("./pages/OwnerProperties"));
const OwnerNewListing = lazyWithRetry(() => import("./pages/OwnerNewListing"));
const OwnerLikedClients = lazyWithRetry(() => import("./pages/OwnerLikedClients"));
const OwnerInterestedClients = lazyWithRetry(() => import("./pages/OwnerInterestedClients"));
const OwnerViewClientProfile = lazyWithRetry(() => import("./pages/OwnerViewClientProfile"));
const OwnerSecurity = lazyWithRetry(() => import("./pages/OwnerSecurity"));
const OwnerSavedSearches = lazyWithRetry(() => import("./pages/OwnerSavedSearches"));
const OwnerContracts = lazyWithRetry(() => import("./pages/OwnerContracts"));
const OwnerProfileCamera = lazyWithRetry(() => import("./pages/OwnerProfileCamera"));
const OwnerListingCamera = lazyWithRetry(() => import("./pages/OwnerListingCamera"));
const OwnerFilters = lazyWithRetry(() => import("./pages/OwnerFilters"));

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
const AdminCategoryPhotos = lazyWithRetry(() => import("./pages/AdminCategoryPhotos"));
const AdminPerformanceDashboard = lazyWithRetry(() => import("./pages/AdminPerformanceDashboard"));
const PriceTracker = lazyWithRetry(() => import("./pages/PriceTracker"));
const VideoTours = lazyWithRetry(() => import("./pages/VideoTours"));
const LocalIntel = lazyWithRetry(() => import("./pages/LocalIntel"));
const RoommateMatching = lazyWithRetry(() => import("./pages/RoommateMatching"));
const SeekersPage = lazyWithRetry(() => import("./pages/SeekersPage"));
const DocumentVault = lazyWithRetry(() => import("./pages/DocumentVault"));
const EscrowDashboard = lazyWithRetry(() => import("./pages/EscrowDashboard"));
const ClientPerks = lazyWithRetry(() => import("./pages/ClientPerks"));
const PaymentSuccess = lazyWithRetry(() => import("./pages/PaymentSuccess"));
const PaymentCancel = lazyWithRetry(() => import("./pages/PaymentCancel"));

// PUBLIC PREVIEWS
const PublicProfilePreview = lazyWithRetry(() => import("./pages/PublicProfilePreview"));
const PublicListingPreview = lazyWithRetry(() => import("./pages/PublicListingPreview"));
const ListingDetailPage = lazyWithRetry(() => import("./pages/ListingDetailPage"));
const ProfileDetailPage = lazyWithRetry(() => import("./pages/ProfileDetailPage"));
const VapValidate = lazyWithRetry(() => import("./pages/VapValidate"));

// UI HELPERS
const PersistentDashboardLayout = lazyWithRetry(() => import("@/components/PersistentDashboardLayout").then(m => ({ default: m.PersistentDashboardLayout })));
// Sonner toasts removed — all notifications now use premium NotificationBar
const GuidedTourLazy = lazyWithRetry(() => import("./components/GuidedTour").then(m => ({ default: m.GuidedTour })));
const PWAInstallPrompt = lazyWithRetry(() => import("@/components/PWAInstallPrompt").then(m => ({ default: m.PWAInstallPrompt })));


// Empty placeholder for /client/dashboard and /owner/dashboard. The real
// dashboard renders inside PersistentDashboardScene, persistently.
const DashboardOutletPlaceholder = () => null;

const DashboardRedirect = () => {
  return <Navigate to="/client/dashboard" replace />;
};

const ShareRedirect = ({ kind }: { kind: 'listing' | 'profile' | 'event' }) => {
  const { id } = useParams<{ id: string }>();
  const { search } = useLocation();
  const target = kind === 'event' ? `/explore/events/${id || ''}` : kind === 'listing' ? `/preview/listing/${id || ''}` : `/preview/profile/${id || ''}`;
  return <Navigate to={`${target}${search}`} replace />;
};

import { NativeProvider } from "./components/native/NativeProvider";
import { ScrollToTop } from "./components/ScrollToTop";

const App = ({ authPromise }: { authPromise?: Promise<any> }) => {
  // CMS LIVE PREVIEW is handled entirely by CMSPreviewListener (mounted in RootProviders)

  return (
    <GlobalErrorBoundary>
      <RootProviders authPromise={authPromise}>
        <NativeProvider>
          <AppLayout>
            <ScrollToTop />
            <TooltipProvider>
          <Suspense fallback={null}>

            <GuidedTourLazy />
            <PWAInstallPrompt />
          </Suspense>

          <Routes>
            <Route path="/" element={<SignupErrorBoundary><Index /></SignupErrorBoundary>} />
            <Route path="/index" element={<Navigate to="/" replace />} />
            <Route path="/reset-password" element={<Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><ResetPassword /></AnimatedPage></Suspense>} />

            <Route element={
              <ProtectedRoute>
                <Suspense fallback={<SuspenseFallback minimal />}>
                  <PersistentDashboardLayout />
                </Suspense>
              </ProtectedRoute>
            }>
              {/* Individual routes are suspended by the Suspense in PersistentDashboardLayout/AnimatedOutlet */}
              <Route path="/client/dashboard" element={<DashboardOutletPlaceholder />} />
              <Route path="/client/profile" element={<ClientProfile />} />
              <Route path="/client/settings" element={<ClientSettings />} />
              <Route path="/client/liked-properties" element={<UnifiedLikes />} />
              <Route path="/client/who-liked-you" element={<ClientWhoLikedYou />} />
              <Route path="/client/saved-searches" element={<ClientSavedSearches />} />
              <Route path="/client/security" element={<ClientSecurity />} />
              <Route path="/client/services" element={<ClientWorkerDiscovery />} />
              <Route path="/client/contracts" element={<ClientContracts />} />
              <Route path="/client/legal" element={<LegalHub />} />
              <Route path="/client/legal-services" element={<LawyerServicesPage />} />
              <Route path="/legal-services" element={<LawyerServicesPage />} />
              <Route path="/client/camera" element={<ClientSelfieCamera />} />
              <Route path="/client/filters" element={<ClientFilters />} />

              <Route path="/client/maintenance" element={<MaintenanceRequests />} />
              <Route path="/client/advertise" element={<AdvertisePage />} />
              {/* Legacy promo flow — superseded by /client/advertise, which feeds the admin review queue */}
              <Route path="/promote-event/request" element={<Navigate to="/client/advertise" replace />} />
              <Route path="/promote-event/packages" element={<Navigate to="/client/advertise" replace />} />

              {/* Owner routes */}
              <Route path="/owner/dashboard" element={<Navigate to="/client/dashboard" replace />} />
              <Route path="/owner/profile" element={<Navigate to="/client/profile" replace />} />
              <Route path="/owner/settings" element={<OwnerSettings />} />
              <Route path="/owner/properties" element={<OwnerProperties />} />
              <Route path="/owner/listings" element={<OwnerProperties />} />
              <Route path="/owner/listings/new" element={<OwnerNewListing />} />

              <Route path="/owner/liked-clients" element={<OwnerLikedClients />} />
              <Route path="/owner/interested-clients" element={<OwnerInterestedClients />} />
              <Route path="/owner/view-client/:clientId" element={<OwnerViewClientProfile />} />
              <Route path="/owner/saved-searches" element={<OwnerSavedSearches />} />
              <Route path="/owner/security" element={<OwnerSecurity />} />
              <Route path="/owner/contracts" element={<OwnerContracts />} />
              <Route path="/owner/legal-services" element={<LawyerServicesPage />} />
              <Route path="/owner/camera" element={<OwnerProfileCamera />} />
              <Route path="/owner/camera/listing" element={<OwnerListingCamera />} />
              <Route path="/owner/filters" element={<OwnerFilters />} />

              {/* Shared routes */}
              <Route path="/messages" element={<MessagingDashboard />} />
              <Route path="/messages/:conversationId" element={<MessagesRedirect />} />
              <Route path="/notifications" element={<NotificationsPage />} />
              <Route path="/subscription/packages" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><SubscriptionPackagesPage /></Suspense></ChunkErrorBoundary>} />
              <Route path="/radio" element={<DJTurntableRadio />} />
              <Route path="/radio/directory" element={<WorldRadioDirectory />} />

              {/* Explore/Events */}
              <Route path="/explore/events" element={<EventosFeed />} />
              <Route path="/explore/events/likes" element={<EventosLikes />} />
              <Route path="/explore/events/:id" element={<EventoDetail />} />
              <Route path="/admin/eventos" element={<AdminProtectedRoute><AdminEventos /></AdminProtectedRoute>} />

              <Route path="/admin/photos" element={<AdminProtectedRoute><AdminPhotos /></AdminProtectedRoute>} />
              <Route path="/admin/category-photos" element={<AdminProtectedRoute><AdminCategoryPhotos /></AdminProtectedRoute>} />
              <Route path="/admin/performance" element={<AdminProtectedRoute><AdminPerformanceDashboard /></AdminProtectedRoute>} />
              <Route path="/explore/prices" element={<PriceTracker />} />
              <Route path="/explore/tours" element={<VideoTours />} />
              <Route path="/explore/intel" element={<LocalIntel />} />
              <Route path="/explore/roommates" element={<RoommateMatching />} />
              <Route path="/explore/services" element={<Navigate to="/client/services" replace />} />
              <Route path="/explore/seekers" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><SeekersPage /></Suspense></ChunkErrorBoundary>} />

              <Route path="/documents" element={<DocumentVault />} />
              <Route path="/escrow" element={<EscrowDashboard />} />
              <Route path="/client/perks" element={<ClientPerks />} />
            </Route>

            {/* Outside Layout */}
            <Route path="/payment/success" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentSuccess /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/payment/cancel" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback />}><AnimatedPage><PaymentCancel /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/privacy-policy" element={<Navigate to="/legal?doc=privacy" replace />} />
            <Route path="/terms-of-service" element={<Navigate to="/legal?doc=terms" replace />} />
            <Route path="/agl" element={<Navigate to="/legal?doc=agl" replace />} />
            <Route path="/legal" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><LegalHub /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/dashboard" element={<DashboardRedirect />} />
            <Route path="/about" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><AboutPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/faq/client" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQClientPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/faq/owner" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><FAQOwnerPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/profile/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><ProfileDetailPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/preview/profile/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicProfilePreview /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/listing/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><ListingDetailPage /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/preview/listing/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><PublicListingPreview /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/s/listing/:id" element={<ShareRedirect kind="listing" />} />
            <Route path="/s/profile/:id" element={<ShareRedirect kind="profile" />} />
            <Route path="/s/event/:id" element={<ShareRedirect kind="event" />} />
            <Route path="/vap-validate/:id" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><VapValidate /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
            <Route path="/share-target" element={<Navigate to="/dashboard" replace />} />
            <Route path="/promote" element={<Navigate to="/client/advertise" replace />} />
            <Route path="*" element={<ChunkErrorBoundary><Suspense fallback={<SuspenseFallback minimal />}><AnimatedPage><NotFound /></AnimatedPage></Suspense></ChunkErrorBoundary>} />
          </Routes>
          </TooltipProvider>
        </AppLayout>
        </NativeProvider>
      </RootProviders>
    </GlobalErrorBoundary>
  );
};

export default App;


