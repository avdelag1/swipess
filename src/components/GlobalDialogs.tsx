import { lazyWithRetry } from '@/utils/lazyRetry';
import { memo, useState, useEffect } from 'react';
import { TokensModal } from './TokensModal';
import { useModalStore } from '@/state/modalStore';
import { SmartSuspense } from './SmartSuspense';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useListings } from '@/hooks/useListings';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useWelcomeState } from '@/hooks/useWelcomeState';
import { DeferredDialog } from './DeferredDialog';

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
const AIListingWizard = lazyWithRetry(() => import('@/components/AIListingWizard').then(m => ({ default: m.AIListingWizard })));
const ConciergeChat = lazyWithRetry(() => import('@/components/ConciergeChat').then(m => ({ default: m.ConciergeChat })));

const ConciergeChatFallback = memo(() => (
  <div className="fixed inset-0 z-[10000] flex flex-col bg-background">
    {/* Header Skeleton */}
    <div className="h-16 flex items-center justify-between px-5 border-b border-border/10 bg-background/50 backdrop-blur-xl">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-muted/20 animate-pulse" />
        <div className="space-y-2">
          <div className="h-2.5 w-24 rounded-full bg-foreground/10 animate-pulse" />
          <div className="h-2 w-16 rounded-full bg-muted/10 animate-pulse" />
        </div>
      </div>
      <div className="flex gap-2">
        <div className="h-10 w-10 rounded-xl bg-muted/10 animate-pulse" />
        <div className="h-10 w-10 rounded-xl bg-muted/10 animate-pulse" />
      </div>
    </div>
    
    {/* Content Skeleton */}
    <div className="flex-1 p-6 space-y-8 overflow-hidden">
      <div className="flex flex-col items-end space-y-2">
        <div className="h-14 w-[70%] rounded-2xl rounded-br-md bg-primary/5 animate-pulse" />
        <div className="h-3 w-20 rounded-full bg-primary/10 animate-pulse" />
      </div>
      <div className="flex flex-col items-start space-y-2">
        <div className="h-24 w-[85%] rounded-2xl rounded-bl-md bg-muted/10 animate-pulse" />
        <div className="h-3 w-28 rounded-full bg-muted/20 animate-pulse" />
      </div>
      <div className="flex flex-col items-end space-y-2">
        <div className="h-16 w-[60%] rounded-2xl rounded-br-md bg-primary/5 animate-pulse" />
      </div>
    </div>
    
    {/* Input Skeleton */}
    <div className="p-4 border-t border-border/10 pb-[calc(env(safe-area-inset-bottom,0px)+16px)] bg-background">
      <div className="h-16 w-full rounded-2xl bg-muted/10 border border-border/5 animate-pulse" />
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
  const [isWarmedUp, setIsWarmedUp] = useState(false);
  useEffect(() => { const t = setTimeout(() => setIsWarmedUp(true), 2000); return () => clearTimeout(t); }, []);

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
      <DeferredDialog when={store.showFilters}>
        <AdvancedFiltersDialog
          isOpen={store.showFilters}
          onClose={() => store.setModal('showFilters', false)}
          onApplyFilters={(filters) => {
            const { setFilters } = useFilterStore.getState();
            setFilters(filters);
          }}
          userRole={userRole}
          currentFilters={{}}
        />
      </DeferredDialog>

      <DeferredDialog when={store.showSubscriptionPackages}>
        <SubscriptionPackages
          isOpen={store.showSubscriptionPackages}
          onClose={() => store.setModal('showSubscriptionPackages', false)}
          reason={store.subscriptionReason}
          userRole={userRole}
        />
      </DeferredDialog>

      <DeferredDialog when={store.showMessageActivations}>
        <MessageActivationPackages
          isOpen={store.showMessageActivations}
          onClose={() => store.setModal('showMessageActivations', false)}
          userRole={userRole}
        />
      </DeferredDialog>

      {userRole === 'client' && (
        <>
          <DeferredDialog when={store.showProfile}>
            <ClientProfileDialog
              open={store.showProfile}
              onOpenChange={(val: boolean) => store.setModal('showProfile', val)}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showPropertyDetails}>
            <PropertyDetails
              listingId={store.selectedListingId}
              isOpen={store.showPropertyDetails}
              onClose={() => {
                store.setModal('showPropertyDetails', false);
              }}
              onMessageClick={() => store.openSubscription('Unlock Messaging!')}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showPropertyInsights}>
            <PropertyInsightsDialog
              open={store.showPropertyInsights}
              onOpenChange={(val: boolean) => store.setModal('showPropertyInsights', val)}
              listing={selectedListing || null}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showSavedSearches}>
            <SavedSearchesDialog
              open={store.showSavedSearches}
              onOpenChange={(val: boolean) => store.setModal('showSavedSearches', val)}
            />
          </DeferredDialog>
        </>
      )}

      {userRole === 'owner' && (
        <>
          <DeferredDialog when={store.showClientInsights}>
            <ClientInsightsDialog
              open={store.showClientInsights}
              onOpenChange={(val: boolean) => store.setModal('showClientInsights', val)}
              profile={selectedProfile || null}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showOwnerSettings}>
            <OwnerSettingsDialog
              open={store.showOwnerSettings}
              onOpenChange={(val: boolean) => store.setModal('showOwnerSettings', val)}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showOwnerProfile}>
            <OwnerProfileDialog
              open={store.showOwnerProfile}
              onOpenChange={(val: boolean) => store.setModal('showOwnerProfile', val)}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showOwnerSwipe}>
            <OwnerClientSwipeDialog
              open={store.showOwnerSwipe}
              onOpenChange={(val: boolean) => store.setModal('showOwnerSwipe', val)}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showLegalDocuments}>
            <LegalDocumentsDialog
              open={store.showLegalDocuments}
              onOpenChange={(val: boolean) => store.setModal('showLegalDocuments', val)}
            />
          </DeferredDialog>

          <DeferredDialog when={store.showCategoryDialog}>
            <CategorySelectionDialog
              open={store.showCategoryDialog}
              onOpenChange={(val: boolean) => store.setModal('showCategoryDialog', val)}
              onCategorySelect={(category: string, mode: string) => {
                store.setModal('showCategoryDialog', false);
                navigate(`/owner/listings/new?category=${category}&mode=${mode}`);
              }}
              onAIOpen={() => store.openAIListing()}
            />
          </DeferredDialog>
        </>
      )}

      <DeferredDialog when={store.showSupport}>
        <SupportDialog
          isOpen={store.showSupport}
          onClose={() => store.setModal('showSupport', false)}
          userRole={userRole}
        />
      </DeferredDialog>

      <DeferredDialog when={isWarmedUp}>
        <PushNotificationPrompt />
      </DeferredDialog>

      <DeferredDialog when={shouldShowWelcome}>
        <WelcomeNotification
          isOpen={shouldShowWelcome}
          onClose={dismissWelcome}
        />
      </DeferredDialog>

      <DeferredDialog when={store.showAIChat} fallback={<ConciergeChatFallback />} threshold={0}>
        <ConciergeChat
          isOpen={store.showAIChat}
          onClose={() => store.setModal('showAIChat', false)}
        />
      </DeferredDialog>

      <DeferredDialog when={store.showAIListing} threshold={0}>
        <AIListingWizard />
      </DeferredDialog>

      <TokensModal userRole={userRole === 'admin' ? 'client' : userRole} />
    </>
  );
});

GlobalDialogs.displayName = 'GlobalDialogs';


