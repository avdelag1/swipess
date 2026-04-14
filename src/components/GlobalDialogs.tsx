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
const CategorySelectionDialog = lazyWithRetry(() => import('@/components/CategorySelectionDialog').then(m => ({ default: m.CategorySelectionDialog })));
const SavedSearchesDialog = lazyWithRetry(() => import('@/components/SavedSearchesDialog').then(m => ({ default: m.SavedSearchesDialog })));
const MessageActivationPackages = lazyWithRetry(() => import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages })));
const PushNotificationPrompt = lazyWithRetry(() => import('@/components/PushNotificationPrompt').then(m => ({ default: m.PushNotificationPrompt })));
const WelcomeNotification = lazyWithRetry(() => import('@/components/WelcomeNotification').then(m => ({ default: m.WelcomeNotification })));
const ConciergeChat = lazyWithRetry(() => import('@/components/ConciergeChat').then(m => ({ default: m.ConciergeChat })));

const ConciergeChatFallback = memo(() => (
  <div className="fixed inset-0 z-[9999] flex flex-col bg-background/95 backdrop-blur-xl">
    <div className="border-b border-border/50 bg-background/90 px-4 py-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="h-8 w-8 rounded-full bg-primary/15 animate-pulse" />
          <div className="space-y-1.5">
            <div className="h-3 w-24 rounded-full bg-foreground/10 animate-pulse" />
            <div className="h-2.5 w-20 rounded-full bg-muted animate-pulse" />
          </div>
        </div>
        <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
      </div>
    </div>
    <div className="flex-1 space-y-4 px-4 py-5">
      <div className="ml-auto h-16 w-[72%] rounded-3xl rounded-br-md bg-primary/12 animate-pulse" />
      <div className="h-20 w-[80%] rounded-3xl rounded-bl-md bg-muted animate-pulse" />
      <div className="ml-auto h-12 w-[55%] rounded-3xl rounded-br-md bg-primary/10 animate-pulse" />
    </div>
    <div className="border-t border-border/50 bg-background/90 px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
      <div className="flex items-end gap-2">
        <div className="h-11 flex-1 rounded-2xl bg-muted animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-primary/15 animate-pulse" />
      </div>
    </div>
  </div>
));
ConciergeChatFallback.displayName = 'ConciergeChatFallback';

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
          onApplyFilters={() => {}}
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
        <PushNotificationPrompt />
      </SmartSuspense>

      <SmartSuspense fallback={null}>
        <WelcomeNotification
          isOpen={shouldShowWelcome}
          onClose={dismissWelcome}
        />
      </SmartSuspense>

      <SmartSuspense fallback={store.showAIChat ? <ConciergeChatFallback /> : null} threshold={0}>
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
