import { lazy, memo } from 'react';
import { useModalStore } from '@/state/modalStore';
import { SmartSuspense } from './SmartSuspense';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useListings } from '@/hooks/useListings';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useWelcomeState } from '@/hooks/useWelcomeState';
import { toast } from '@/components/ui/sonner';

// Lazy-loaded Dialogs
const AdvancedFilters = lazy(() => import('@/components/AdvancedFilters').then(m => ({ default: m.AdvancedFilters })));
const SubscriptionPackages = lazy(() => import("@/components/SubscriptionPackages").then(m => ({ default: m.SubscriptionPackages })));
const LegalDocumentsDialog = lazy(() => import("@/components/LegalDocumentsDialog").then(m => ({ default: m.LegalDocumentsDialog })));
const ClientProfileDialog = lazy(() => import("@/components/ClientProfileDialog").then(m => ({ default: m.ClientProfileDialog })));
const PropertyDetails = lazy(() => import("@/components/PropertyDetails").then(m => ({ default: m.PropertyDetails })));
const PropertyInsightsDialog = lazy(() => import("@/components/PropertyInsightsDialog").then(m => ({ default: m.PropertyInsightsDialog })));
const ClientInsightsDialog = lazy(() => import("@/components/ClientInsightsDialog").then(m => ({ default: m.ClientInsightsDialog })));
const OwnerSettingsDialog = lazy(() => import('@/components/OwnerSettingsDialog').then(m => ({ default: m.OwnerSettingsDialog })));
const OwnerProfileDialog = lazy(() => import('@/components/OwnerProfileDialog').then(m => ({ default: m.OwnerProfileDialog })));
const OwnerClientSwipeDialog = lazy(() => import('@/components/OwnerClientSwipeDialog'));
const SupportDialog = lazy(() => import('@/components/SupportDialog').then(m => ({ default: m.SupportDialog })));
const OnboardingFlow = lazy(() => import('@/components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const CategorySelectionDialog = lazy(() => import('@/components/CategorySelectionDialog').then(m => ({ default: m.CategorySelectionDialog })));
const SavedSearchesDialog = lazy(() => import('@/components/SavedSearchesDialog').then(m => ({ default: m.SavedSearchesDialog })));
const MessageActivationPackages = lazy(() => import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages })));
const PushNotificationPrompt = lazy(() => import('@/components/PushNotificationPrompt').then(m => ({ default: m.PushNotificationPrompt })));
const WelcomeNotification = lazy(() => import('@/components/WelcomeNotification').then(m => ({ default: m.WelcomeNotification })));
const ConciergeChat = lazy(() => import('@/components/ConciergeChat').then(m => ({ default: m.ConciergeChat })));
const LikedListingInsightsModal = lazy(() => import('@/components/LikedListingInsightsModal').then(m => ({ default: m.LikedListingInsightsModal })));
const LikedClientInsightsModal = lazy(() => import('@/components/LikedClientInsightsModal').then(m => ({ default: m.LikedClientInsightsModal })));

interface GlobalDialogsProps {
  userRole: 'client' | 'owner' | 'admin';
}

export const GlobalDialogs = memo(({ userRole }: GlobalDialogsProps) => {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const store = useModalStore();
  const { shouldShowWelcome, dismissWelcome } = useWelcomeState(user?.id);

  // DATA FETCHING (Lazy-enabled)
  const { data: listings = [] } = useListings([], {
    enabled: store.showPropertyInsights || store.showClientInsights
  });
  const { data: profiles = [] } = useClientProfiles([], {
    enabled: store.showClientInsights
  });

  const selectedListing = store.selectedListingId ? listings.find(l => l.id === store.selectedListingId) : null;
  const selectedProfile = store.selectedProfileId ? profiles.find(p => p.user_id === store.selectedProfileId) : null;

  return (
    <>
      <SmartSuspense fallback={null}>
        <AdvancedFilters
          isOpen={store.showFilters}
          onClose={() => store.setModal('showFilters', false)}
          onApplyFilters={() => {}} // Store handles filters internally via filterStore
          userRole={userRole}
          currentFilters={{}}
        />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <SubscriptionPackages
          isOpen={store.showSubscriptionPackages}
          onClose={() => store.setModal('showSubscriptionPackages', false)}
          reason={store.subscriptionReason}
          userRole={userRole}
        />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <MessageActivationPackages
          isOpen={store.showMessageActivations}
          onClose={() => store.setModal('showMessageActivations', false)}
          userRole={userRole}
        />
      </SmartSuspense>

      {userRole === 'client' && (
        <SmartSuspense fallback={null}>
          <>
            <ClientProfileDialog
              open={store.showProfile}
              onOpenChange={(val) => store.setModal('showProfile', val)}
            />
            <PropertyDetails
              listingId={store.selectedListingId}
              isOpen={store.showPropertyDetails}
              onClose={() => {
                store.setModal('showPropertyDetails', false);
              }}
              onMessageClick={() => store.openSubscription('Unlock Messaging!')}
            />
            <PropertyInsightsDialog
              open={store.showPropertyInsights}
              onOpenChange={(val) => store.setModal('showPropertyInsights', val)}
              listing={selectedListing || null}
            />
            <SavedSearchesDialog
              open={store.showSavedSearches}
              onOpenChange={(val) => store.setModal('showSavedSearches', val)}
            />
          </>
        </SmartSuspense>
      )}

      {userRole === 'owner' && (
        <SmartSuspense fallback={null}>
          <>
            <ClientInsightsDialog
              open={store.showClientInsights}
              onOpenChange={(val) => store.setModal('showClientInsights', val)}
              profile={selectedProfile || null}
            />
            <OwnerSettingsDialog
              open={store.showOwnerSettings}
              onOpenChange={(val) => store.setModal('showOwnerSettings', val)}
            />
            <OwnerProfileDialog
              open={store.showOwnerProfile}
              onOpenChange={(val) => store.setModal('showOwnerProfile', val)}
            />
            <OwnerClientSwipeDialog
              open={store.showOwnerSwipe}
              onOpenChange={(val) => store.setModal('showOwnerSwipe', val)}
            />
            <LegalDocumentsDialog
              open={store.showLegalDocuments}
              onOpenChange={(val) => store.setModal('showLegalDocuments', val)}
            />
            <CategorySelectionDialog
              open={store.showCategoryDialog}
              onOpenChange={(val) => store.setModal('showCategoryDialog', val)}
              onCategorySelect={(category, mode) => {
                store.setModal('showCategoryDialog', false);
                navigate(`/owner/properties?category=${category}&mode=${mode}`);
              }}
            />
          </>
        </SmartSuspense>
      )}

      <SmartSuspense fallback={null}>
        <SupportDialog
          isOpen={store.showSupport}
          onClose={() => store.setModal('showSupport', false)}
          userRole={userRole}
        />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <OnboardingFlow
          open={false} // Managed by logic in DashboardLayout
          onComplete={() => {}} 
        />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <ConciergeChat
          open={store.isAISearchOpen}
          onOpenChange={(val: boolean) => store.setModal('isAISearchOpen', val)}
          userRole={userRole === 'admin' ? 'client' : userRole}
        />

        {/* LIKED ITEM MODALS */}
        <LikedListingInsightsModal
          open={store.showPropertyInsights}
          onOpenChange={(open) => store.setModal('showPropertyInsights', open)}
          listing={selectedListing}
        />

        <LikedClientInsightsModal
          open={store.showClientInsights}
          onOpenChange={(open) => store.setModal('showClientInsights', open)}
          client={selectedProfile as any}
        />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <PushNotificationPrompt />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <WelcomeNotification
          isOpen={shouldShowWelcome}
          onClose={dismissWelcome}
        />
      </SmartSuspense>
    </>
  );
});

GlobalDialogs.displayName = 'GlobalDialogs';
