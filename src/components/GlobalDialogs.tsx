import { lazyWithRetry } from '@/utils/lazyRetry';
import { memo, useState, useEffect, useMemo } from 'react';
import { useAppTheme } from '@/hooks/useAppTheme';
import { TokensModal } from './TokensModal';
import { useModalStore } from '@/state/modalStore';
import { SmartSuspense } from './SmartSuspense';
import { useAuth } from '@/hooks/useAuth';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useListings } from '@/hooks/useListings';
import { useClientProfiles } from '@/hooks/useClientProfiles';
import { useWelcomeState } from '@/hooks/useWelcomeState';
import { useFilterStore } from '@/state/filterStore';
import { DeferredDialog } from './DeferredDialog';
import { cn } from '@/lib/utils';

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
const ReportDialog = lazyWithRetry(() => import('@/components/ReportDialog').then(m => ({ default: m.ReportDialog })));

const ConciergeChatFallback = memo(() => {
  const { isLight, theme } = useAppTheme();
  const isSwipess = theme === 'dark' || !isLight;

  return (
    <div className="fixed inset-0 z-[10000] bg-black/60 backdrop-blur-xl flex items-end md:items-center justify-center">
      <div className={cn(
        "relative w-full h-full md:max-w-3xl md:h-[90vh] md:rounded-[3rem] border flex flex-col overflow-hidden transition-all duration-700",
        isSwipess ? "bg-[#050505] border-[#FF3D00]/20 shadow-[0_0_50px_rgba(255,61,0,0.1)]" : "bg-white border-slate-200 shadow-[0_40px_100px_rgba(0,0,0,0.2)]"
      )}>
        {/* 🛸 Ambient Background */}
        {isSwipess && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF3D00]/10 blur-[120px] rounded-full" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
          </div>
        )}

        {/* Header Skeleton */}
        <div className={cn(
          "h-20 flex items-center justify-between px-6 border-b backdrop-blur-3xl relative z-10",
          isSwipess ? "border-white/5 bg-black/40" : "border-slate-200 bg-white/80"
        )}>
          <div className="flex items-center gap-4">
            <div className={cn("w-12 h-12 rounded-2xl animate-pulse border", isSwipess ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200")} />
            <div className="space-y-2">
              <div className={cn("h-3 w-32 rounded-full animate-pulse", isSwipess ? "bg-white/10" : "bg-slate-200")} />
              <div className={cn("h-2 w-20 rounded-full animate-pulse", isSwipess ? "bg-white/5" : "bg-slate-100")} />
            </div>
          </div>
          <div className="flex gap-3">
            <div className={cn("h-12 w-32 rounded-2xl animate-pulse border", isSwipess ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200")} />
            <div className={cn("h-12 w-12 rounded-2xl animate-pulse border", isSwipess ? "bg-white/5 border-white/5" : "bg-slate-100 border-slate-200")} />
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="flex-1 p-8 space-y-10 overflow-hidden relative z-10 flex flex-col items-center justify-center">
          <div className={cn(
            "w-24 h-24 rounded-[3rem] border flex items-center justify-center animate-pulse",
            isSwipess ? "border-primary/10 bg-primary/5" : "border-slate-200 bg-slate-50"
          )} />
          <div className="space-y-3 text-center">
             <div className={cn("h-4 w-48 rounded-full animate-pulse", isSwipess ? "bg-white/10" : "bg-slate-200")} />
             <div className={cn("h-2 w-32 rounded-full animate-pulse", isSwipess ? "bg-white/5" : "bg-slate-100")} />
          </div>
        </div>
        
        {/* Input Skeleton */}
        <div className={cn(
          "p-8 border-t pb-[calc(env(safe-area-inset-bottom,0px)+32px)] backdrop-blur-xl relative z-10",
          isSwipess ? "border-white/5 bg-black/40" : "border-slate-100 bg-slate-50/50"
        )}>
          <div className={cn("h-16 w-full rounded-[2.2rem] animate-pulse border", isSwipess ? "bg-white/5 border-white/5" : "bg-white border-slate-200")} />
        </div>
      </div>
    </div>
  );
});

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
  const [reportState, setReportState] = useState<{
    open: boolean;
    reportedUserId?: string;
    reportedListingId?: string;
    reportedUserName?: string;
    reportedListingTitle?: string;
    category: 'user_profile' | 'listing' | 'message' | 'review';
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

      <DeferredDialog when={reportState.open}>
        <ReportDialog
          open={reportState.open}
          onOpenChange={(open) => setReportState(prev => ({ ...prev, open }))}
          reportedUserId={reportState.reportedUserId}
          reportedListingId={reportState.reportedListingId}
          reportedUserName={reportState.reportedUserName}
          reportedListingTitle={reportState.reportedListingTitle}
          category={reportState.category}
        />
      </DeferredDialog>
    </>
  );
});

GlobalDialogs.displayName = 'GlobalDialogs';


