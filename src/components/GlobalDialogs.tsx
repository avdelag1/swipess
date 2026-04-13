import { lazyWithRetry } from '@/utils/lazyRetry';
import { memo } from 'react';
import { TokensModal } from './TokensModal';
import { useModalStore } from '@/state/modalStore';
import { SmartSuspense } from './SmartSuspense';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useListings } from '@/hooks/useListings';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useWelcomeState } from '@/hooks/useWelcomeState';

// 🚀 SPEED OF LIGHT: LAZY WITH RETRY HARDENING
const AdvancedFiltersDialog = lazyWithRetry(() => import('@/components/AdvancedFiltersDialog'));
const SubscriptionPackages = lazyWithRetry(() => import("@/components/SubscriptionPackages").then(m => ({ default: m.SubscriptionPackages })));
const LegalDocumentsDialog = lazyWithRetry(() => import("@/components/LegalDocumentsDialog").then(m => ({ default: m.LegalDocumentsDialog })));
const ClientProfileDialog = lazyWithRetry(() => import("@/components/ClientProfileDialog").then(m => ({ default: m.ClientProfileDialog })));
const PropertyDetails = lazyWithRetry(() => import("@/components/PropertyDetails").then(m => ({ default: m.PropertyDetails })));
const PropertyInsightsDialog = lazyWithRetry(() => import("@/components/PropertyInsightsDialog").then(m => ({ default: m.PropertyInsightsDialog })));
const ClientInsightsDialog = lazyWithRetry(() => import("@/components/ClientInsightsDialog").then(m => ({ default: m.ClientInsightsDialog })));
const OwnerSettingsDialog = lazyWithRetry(() => import('@/components/OwnerSettingsDialog').then(m => ({ default: m.OwnerSettingsDialog })));
const OwnerProfileDialog = lazyWithRetry(() => import('@/components/OwnerProfileDialog').then(m => ({ default: m.OwnerProfileDialog })));
const OwnerClientSwipeDialog = lazyWithRetry(() => import('@/components/OwnerClientSwipeDialog'));
const SupportDialog = lazyWithRetry(() => import('@/components/SupportDialog').then(m => ({ default: m.SupportDialog })));
const OnboardingFlow = lazyWithRetry(() => import('@/components/OnboardingFlow').then(m => ({ default: m.OnboardingFlow })));
const CategorySelectionDialog = lazyWithRetry(() => import('@/components/CategorySelectionDialog').then(m => ({ default: m.CategorySelectionDialog })));
const SavedSearchesDialog = lazyWithRetry(() => import('@/components/SavedSearchesDialog').then(m => ({ default: m.SavedSearchesDialog })));
const MessageActivationPackages = lazyWithRetry(() => import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages })));
const PushNotificationPrompt = lazyWithRetry(() => import('@/components/PushNotificationPrompt').then(m => ({ default: m.PushNotificationPrompt })));
const WelcomeNotification = lazyWithRetry(() => import('@/components/WelcomeNotification').then(m => ({ default: m.WelcomeNotification })));
const LikedListingInsightsModal = lazyWithRetry(() => import('@/components/LikedListingInsightsModal').then(m => ({ default: m.LikedListingInsightsModal })));
const LikedClientInsightsModal = lazyWithRetry(() => import('@/components/LikedClientInsightsModal').then(m => ({ default: m.LikedClientInsightsModal })));
const ConciergeChat = lazyWithRetry(() => import('@/components/ConciergeChat').then(m => ({ default: m.ConciergeChat })));

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
        <AdvancedFiltersDialog
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
              onOpenChange={(val: boolean) => store.setModal('showProfile', val)}
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
              onOpenChange={(val: boolean) => store.setModal('showPropertyInsights', val)}
              listing={selectedListing || null}
            />
            <SavedSearchesDialog
              open={store.showSavedSearches}
              onOpenChange={(val: boolean) => store.setModal('showSavedSearches', val)}
            />
          </>
        </SmartSuspense>
      )}

      {userRole === 'owner' && (
        <SmartSuspense fallback={null}>
          <>
            <ClientInsightsDialog
              open={store.showClientInsights}
              onOpenChange={(val: boolean) => store.setModal('showClientInsights', val)}
              profile={selectedProfile || null}
            />
            <OwnerSettingsDialog
              open={store.showOwnerSettings}
              onOpenChange={(val: boolean) => store.setModal('showOwnerSettings', val)}
            />
            <OwnerProfileDialog
              open={store.showOwnerProfile}
              onOpenChange={(val: boolean) => store.setModal('showOwnerProfile', val)}
            />
            <OwnerClientSwipeDialog
              open={store.showOwnerSwipe}
              onOpenChange={(val: boolean) => store.setModal('showOwnerSwipe', val)}
            />
            <LegalDocumentsDialog
              open={store.showLegalDocuments}
              onOpenChange={(val: boolean) => store.setModal('showLegalDocuments', val)}
            />
            <CategorySelectionDialog
              open={store.showCategoryDialog}
              onOpenChange={(val: boolean) => store.setModal('showCategoryDialog', val)}
              onCategorySelect={(category: string, mode: 'buy' | 'rent') => {
                store.setModal('showCategoryDialog', false);
                // ZENITH FIX: Navigate to the specialized creation form, not the list
                navigate(`/owner/listings/new?category=${category}&mode=${mode}`);
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


        {/* LIKED ITEM MODALS */}
        <LikedListingInsightsModal
          open={store.showPropertyInsights}
          onOpenChange={(open: boolean) => store.setModal('showPropertyInsights', open)}
          listing={selectedListing}
        />

        <LikedClientInsightsModal
          open={store.showClientInsights}
          onOpenChange={(open: boolean) => store.setModal('showClientInsights', open)}
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

      <SmartSuspense fallback={null}>
        <ConciergeChat
          isOpen={store.showAIChat}
          onClose={() => store.setModal('showAIChat', false)}
        />
      </SmartSuspense>

      <TokensModal userRole={userRole === 'admin' ? 'client' : userRole} />
    </>
  );
});

GlobalDialogs.displayName = 'GlobalDialogs';
