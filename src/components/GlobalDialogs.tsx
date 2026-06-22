import { lazyWithRetry } from '@/utils/lazyRetry';
import { memo, Suspense, useEffect, useState } from 'react';
import { prefetchConciergeChatModule } from '@/utils/prefetchConciergeChat';
import { prefetchAIWizardsModule } from '@/utils/prefetchAIWizards';
import { prefetchListingFlowModule } from '@/utils/prefetchListingFlow';
import { prefetchCommonModalsModule } from '@/utils/prefetchCommonModals';
import { CategorySelectionDialog } from '@/components/CategorySelectionDialog';
import { AIListingWizard } from '@/components/AIListingWizard';
import { useModalStore } from '@/state/modalStore';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { type Listing, useListings } from '@/hooks/useListings';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { supabase } from '@/integrations/supabase/client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { applyAdvancedFiltersToStore } from '@/utils/applyAdvancedFilters';
import { DeferredDialog } from './DeferredDialog';

const TokensModal = lazyWithRetry(() => import('./TokensModal').then(m => ({ default: m.TokensModal })));

// 🚀 SPEED OF LIGHT: LAZY WITH RETRY HARDENING
const AdvancedFiltersDialog = lazyWithRetry(() => import('@/components/AdvancedFiltersDialog'));
const SubscriptionPackages = lazyWithRetry(() => import("@/components/SubscriptionPackages").then(m => ({ default: m.SubscriptionPackages })));
const LegalDocumentsDialog = lazyWithRetry(() => import("@/components/LegalDocumentsDialog").then(m => ({ default: m.LegalDocumentsDialog })));
const ClientProfileDialog = lazyWithRetry(() => import("@/components/ClientProfileDialog").then(m => ({ default: m.ClientProfileDialog })));
const PropertyDetails = lazyWithRetry(() => import("@/components/PropertyDetails").then(m => ({ default: m.PropertyDetails })));
const SwipeInsightsModal = lazyWithRetry(() => import("@/components/SwipeInsightsModal").then(m => ({ default: m.SwipeInsightsModal })));
const OwnerSettingsDialog = lazyWithRetry(() => import('@/components/OwnerSettingsDialog').then(m => ({ default: m.OwnerSettingsDialog })));
const OwnerProfileDialog = lazyWithRetry(() => import('@/components/OwnerProfileDialog').then(m => ({ default: m.OwnerProfileDialog })));
const OwnerClientSwipeDialog = lazyWithRetry(() => import('@/components/OwnerClientSwipeDialog'));
const SupportDialog = lazyWithRetry(() => import('@/components/SupportDialog').then(m => ({ default: m.SupportDialog })));
const SavedSearchesDialog = lazyWithRetry(() => import('@/components/SavedSearchesDialog').then(m => ({ default: m.SavedSearchesDialog })));
const MessageActivationPackages = lazyWithRetry(() => import('@/components/MessageActivationPackages').then(m => ({ default: m.MessageActivationPackages })));
const PushNotificationPrompt = lazyWithRetry(() => import('@/components/PushNotificationPrompt').then(m => ({ default: m.PushNotificationPrompt })));

const AIProfileWizard = lazyWithRetry(() => import('@/components/AIProfileWizard').then(m => ({ default: m.AIProfileWizard })));
const ConciergeChat = lazyWithRetry(() => import('@/components/ConciergeChat').then(m => ({ default: m.ConciergeChat })));
const ReportDialog = lazyWithRetry(() => import('@/components/ReportDialog').then(m => ({ default: m.ReportDialog })));
const InviteFriendsDialog = lazyWithRetry(() => import('@/components/InviteFriendsDialog').then(m => ({ default: m.InviteFriendsDialog })));
const NotificationDetailsDialog = lazyWithRetry(() => import('@/components/NotificationDetailsDialog').then(m => ({ default: m.NotificationDetailsDialog })));

interface GlobalDialogsProps {
  userRole: 'client' | 'owner' | 'admin';
}

export const GlobalDialogs = memo(({ userRole }: GlobalDialogsProps) => {
  const { user: _user } = useAuth();
  const { navigate } = useAppNavigate();
  const store = useModalStore();
  const queryClient = useQueryClient();

  const [isWarmedUp, setIsWarmedUp] = useState(false);
  const [conciergeChunkReady, setConciergeChunkReady] = useState(false);
  const [aiWizardsReady, setAiWizardsReady] = useState(false);
  const [reportState, setReportState] = useState<{
    open: boolean;
    reportedUserId?: string;
    reportedListingId?: string;
    reportedUserName?: string;
    reportedListingTitle?: string;
    reportedUserAge?: number | string;
    category: 'user_profile' | 'listing' | 'message' | 'review' | 'any';
  }>({ open: false, category: 'user_profile' });

  useEffect(() => {
    const handleOpenReport = (e: any) => {
      setReportState({
        open: true,
        ...e.detail
      });
    };
    window.addEventListener('open-report', handleOpenReport);
    return () => window.removeEventListener('open-report', handleOpenReport);
  }, []);

  useEffect(() => { 
    const t = setTimeout(() => setIsWarmedUp(true), 2000); 
    return () => clearTimeout(t); 
  }, []);

  useEffect(() => {
    let cancelled = false;
    prefetchListingFlowModule();
    prefetchCommonModalsModule();
    prefetchConciergeChatModule().then(() => {
      if (!cancelled) setConciergeChunkReady(true);
    });
    prefetchAIWizardsModule().then(() => {
      if (!cancelled) setAiWizardsReady(true);
    });
    return () => { cancelled = true; };
  }, []);

  // DATA FETCHING (Lazy-enabled)
  const { data: listings = [] } = useListings([], {
    enabled: store.showPropertyInsights || store.showClientInsights
  });
  const { data: profiles = [] } = useClientProfiles([], {
    enabled: store.showClientInsights
  });

  // Map pins come from a different RPC than the swipe deck, so the tapped
  // listing usually isn't in `listings`. Fetch it by id directly so Insights
  // (and Details) always have data — otherwise the modal opened blank/no-op.
  const deckListing = store.selectedListingId
    ? listings.find(l => l.id === store.selectedListingId)
    : null;
  const { data: listingById } = useQuery({
    queryKey: ['listing-by-id', store.selectedListingId],
    enabled: store.showPropertyInsights && !!store.selectedListingId && !deckListing,
    staleTime: 60_000,
    queryFn: async () => {
      if (!store.selectedListingId) return null;
      const { data, error } = await supabase
        .from('listings')
        .select('*')
        .eq('id', store.selectedListingId)
        .single();
      if (error) throw error;
      return (data ?? null) as Listing | null;
    },
  });

  const selectedListing = deckListing ?? listingById ?? null;
  const selectedProfile = store.selectedProfileId ? profiles.find(p => p.user_id === store.selectedProfileId) : null;

  return (
    <>
      <DeferredDialog when={store.showFilters} keepMounted threshold={0}>
        <AdvancedFiltersDialog
          isOpen={store.showFilters}
          onClose={() => store.setModal('showFilters', false)}
          onApplyFilters={(filters) => {
            applyAdvancedFiltersToStore(filters, userRole);
            queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
            queryClient.invalidateQueries({ queryKey: ['smart-clients'] });
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
            <SwipeInsightsModal
              open={store.showClientInsights}
              onOpenChange={(val: boolean) => store.setModal('showClientInsights', val)}
              profile={selectedProfile ? {
                id: String(selectedProfile.id ?? selectedProfile.user_id),
                user_id: selectedProfile.user_id,
                full_name: selectedProfile.name || '',
                name: selectedProfile.name || '',
                age: selectedProfile.age || 0,
                bio: '',
                profile_images: selectedProfile.profile_images || [],
                images: selectedProfile.profile_images || [],
                location: selectedProfile.location,
                liked_at: new Date().toISOString(),
                gender: selectedProfile.gender,
                city: selectedProfile.city,
                interests: selectedProfile.interests,
                verified: selectedProfile.verified,
              } : null}
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
        </>
      )}

      {/* Add-listing category picker — shared across roles: the TopBar and
          BottomNavigation "add / AI listing" buttons are shown to clients and
          owners alike, so this must render regardless of role (it was previously
          gated to owners, which made the AI button do nothing for clients). */}
      <DeferredDialog when={store.showCategoryDialog} keepMounted threshold={0}>
        <CategorySelectionDialog
          open={store.showCategoryDialog}
          onOpenChange={(val: boolean) => store.setModal('showCategoryDialog', val)}
          onCategorySelect={(category: string, mode: string) => {
            prefetchListingFlowModule();
            navigate(`/owner/listings/new?category=${category}&mode=${mode}`);
            requestAnimationFrame(() => store.setModal('showCategoryDialog', false));
          }}
          onAIOpen={() => {
            requestAnimationFrame(() => store.openAIListing());
          }}
        />
      </DeferredDialog>

      {/* Property insights — shared across roles so map listing taps always open
          (the map's pins exist for clients and owners alike). */}
      <DeferredDialog when={store.showPropertyInsights} keepMounted threshold={0}>
        <SwipeInsightsModal
          open={store.showPropertyInsights}
          onOpenChange={(val: boolean) => store.setModal('showPropertyInsights', val)}
          listing={selectedListing || null}
        />
      </DeferredDialog>

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

      {/* Top-left WelcomeNotification removed: the centered WelcomeBonusModal
          is now the single source of welcome greeting. */}

      <DeferredDialog when={conciergeChunkReady || store.showAIChat} fallback={null} threshold={300} keepMounted>
        <ConciergeChat
          isOpen={store.showAIChat}
          onClose={() => store.setModal('showAIChat', false)}
        />
      </DeferredDialog>

      <DeferredDialog when={store.showAIListing} threshold={0} keepMounted>
        <AIListingWizard />
      </DeferredDialog>

      <DeferredDialog when={aiWizardsReady || store.showAIProfile} threshold={0} keepMounted>
        <AIProfileWizard />
      </DeferredDialog>

      <Suspense fallback={null}><TokensModal userRole={userRole === 'admin' ? 'client' : userRole} /></Suspense>
      <Suspense fallback={null}>
        <InviteFriendsDialog
          isOpen={store.showInviteFriends}
          onClose={() => store.setModal('showInviteFriends', false)}
        />
      </Suspense>

      <DeferredDialog when={reportState.open}>
        <ReportDialog
          open={reportState.open}
          onOpenChange={(open) => setReportState(prev => ({ ...prev, open }))}
          reportedUserId={reportState.reportedUserId}
          reportedListingId={reportState.reportedListingId}
          reportedUserName={reportState.reportedUserName}
          reportedListingTitle={reportState.reportedListingTitle}
          reportedUserAge={reportState.reportedUserAge}
          category={reportState.category as any}
        />
      </DeferredDialog>

      <Suspense fallback={null}>
        <NotificationDetailsDialog />
      </Suspense>
    </>
  );
});

GlobalDialogs.displayName = 'GlobalDialogs';
