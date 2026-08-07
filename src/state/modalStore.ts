import { create } from 'zustand';
import { useFilterStore } from '@/state/filterStore';
import { prefetchPassportMapImmediate } from '@/utils/prefetchMapModule';
import { prefetchCityPhotosImmediate } from '@/utils/prefetchCityPhotos';
import { prefetchConciergeChatModule } from '@/utils/prefetchConciergeChat';
import { prefetchListingFlowModule } from '@/utils/prefetchListingFlow';
import { prefetchAIWizardsModule } from '@/utils/prefetchAIWizards';
import { prefetchCommonModalsModule } from '@/utils/prefetchCommonModals';
import { resolveMapboxAccessToken } from '@/utils/mapboxConfig';
import { useGuidedTourActive } from '@/state/guidedTourStore';

/**
 * SWIPESS GLOBAL MODAL STORE
 * 
 * Centralizes all modal visibility states to prevent the DashboardLayout
 * from re-rendering its shell (TopBar/BottomNav) when a modal opens.
 * 
 * This is the secret to "Native" feel: the shell stays 100% stable 
 * while content overlays animate on top via Portals.
 */

interface ModalState {
  // Client Modals
  showProfile: boolean;
  showPropertyDetails: boolean;
  selectedListingId: string | null;
  showPropertyInsights: boolean;
  showSavedSearches: boolean;
  
  // Owner Modals
  showOwnerSettings: boolean;
  showOwnerProfile: boolean;
  showOwnerSwipe: boolean;
  showLegalDocuments: boolean;
  showCategoryDialog: boolean;
  selectedProfileId: string | null;
  showClientInsights: boolean;
  
  // Generic/Shared
  showSubscriptionPackages: boolean;
  subscriptionReason: string;
  showSupport: boolean;
  showMessageActivations: boolean;
  showFilters: boolean;
  showDatesModal: boolean;
  showGuestsModal: boolean;
  showAIChat: boolean;
  /** Pending search query to auto-send when ConciergeChat opens. */
  pendingAIQuery: string | null;
  showAIListing: boolean;
  aiListingCategory: 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker' | null;
  aiListingDraft: any | null;
  showAIProfile: boolean;
  aiProfileMode: 'client' | 'owner' | null;
  aiProfileDraft: any | null;
  showVapId: boolean;
  showTokensModal: boolean;
  showPassportMapModal: boolean;
  /** Open map with city quick-filter drawer expanded. */
  passportMapShowCities: boolean;
  showInviteFriends: boolean;

  // Actions
  setModal: (key: keyof Omit<ModalState, 'setModal' | 'selectedListingId' | 'selectedProfileId' | 'subscriptionReason' | 'aiListingCategory' | 'aiListingDraft' | 'aiProfileMode' | 'aiProfileDraft' | 'pendingAIQuery' | 'openAIListing' | 'openAddListing' | 'openAIProfile' | 'openPropertyDetails' | 'openPropertyInsights' | 'openClientInsights' | 'openSubscription' | 'openPassportMap' | 'openAIChat' | 'consumePendingAIQuery' | 'openInviteFriends' | 'clearPassportMapFlags' | 'closeAll' | 'showSeekerRequestDialog'>, value: boolean) => void;
  openAIListing: (category?: 'property' | 'motorcycle' | 'bicycle' | 'yacht' | 'worker', draft?: any) => void;
  openAddListing: () => void;
  openAIProfile: (mode: 'client' | 'owner', draft?: any) => void;
  openPropertyDetails: (id: string) => void;
  openPropertyInsights: (id: string) => void;
  openClientInsights: (id: string) => void;
  openSubscription: (reason: string) => void;
  openPassportMap: (opts?: { showCities?: boolean }) => void;
  openAIChat: (initialQuery?: string) => void;
  consumePendingAIQuery: () => string | null;
  openInviteFriends: () => void;
  clearPassportMapFlags: () => void;
  closeAll: () => void;
}

export const useModalStore = create<ModalState>((set) => ({
  showProfile: false,
  showPropertyDetails: false,
  selectedListingId: null,
  showPropertyInsights: false,
  showSavedSearches: false,
  
  showOwnerSettings: false,
  showOwnerProfile: false,
  showOwnerSwipe: false,
  showLegalDocuments: false,
  showCategoryDialog: false,
  selectedProfileId: null,
  showClientInsights: false,
  
  showSubscriptionPackages: false,
  subscriptionReason: '',
  showSupport: false,
  showMessageActivations: false,
  showFilters: false,
  showDatesModal: false,
  showGuestsModal: false,
  showAIChat: false,
  pendingAIQuery: null,
  showAIListing: false,
  aiListingCategory: null,
  aiListingDraft: null,
  showAIProfile: false,
  aiProfileMode: null,
  aiProfileDraft: null,
  showVapId: false,
  showTokensModal: false,
  showPassportMapModal: false,
  passportMapShowCities: false,
  showSeekerRequestDialog: false,
  showInviteFriends: false,

  setModal: (key, value) => set({ [key]: value }),
  
  openAIListing: (category, draft) => {
    prefetchListingFlowModule();
    prefetchAIWizardsModule();
    set({
      aiListingCategory: category || null,
      aiListingDraft: draft || null,
      showAIListing: true,
    });
  },
  openAddListing: () => {
    prefetchListingFlowModule();
    prefetchCommonModalsModule();
    set({ showCategoryDialog: true });
  },
  openAIProfile: (mode, draft) => set({ aiProfileMode: mode, aiProfileDraft: draft || null, showAIProfile: true }),
  openPropertyDetails: (id) => set({ selectedListingId: id, showPropertyDetails: true }),
  openPropertyInsights: (id) => set({ selectedListingId: id, showPropertyInsights: true }),
  openClientInsights: (id) => set({ selectedProfileId: id, showClientInsights: true }),
  openSubscription: (reason) => set({ subscriptionReason: reason, showSubscriptionPackages: true }),

  openPassportMap: (opts) => {
    useFilterStore.getState().clearPassportLocation();
    prefetchPassportMapImmediate();
    prefetchCityPhotosImmediate();
    void resolveMapboxAccessToken();
    set({
      showPassportMapModal: true,
      passportMapShowCities: opts?.showCities ?? false,
    });
  },

  openAIChat: (initialQuery) => {
    if (useGuidedTourActive.getState().isActive) return;
    prefetchConciergeChatModule();
    const q = typeof initialQuery === 'string' ? initialQuery.trim() : '';
    set({
      showAIChat: true,
      pendingAIQuery: q || null,
    });
    // Back-compat for any remaining localStorage readers
    if (q) {
      try { localStorage.setItem('swipess_ai_initial_query', q); } catch { /* private mode */ }
    }
  },

  consumePendingAIQuery: () => {
    const q = useModalStore.getState().pendingAIQuery;
    if (q) set({ pendingAIQuery: null });
    try { localStorage.removeItem('swipess_ai_initial_query'); } catch { /* empty */ }
    return q;
  },

  openInviteFriends: () => set({ showInviteFriends: true }),

  clearPassportMapFlags: () => set({
    passportMapShowCities: false,
  }),

  closeAll: () => set({
    pendingAIQuery: null,
    showProfile: false,
    showPropertyDetails: false,
    showPropertyInsights: false,
    showSavedSearches: false,
    showOwnerSettings: false,
    showOwnerProfile: false,
    showOwnerSwipe: false,
    showLegalDocuments: false,
    showCategoryDialog: false,
    showClientInsights: false,
    showSubscriptionPackages: false,
    showSupport: false,
    showMessageActivations: false,
    showFilters: false,
    showAIChat: false,
    showAIListing: false,
    aiListingCategory: null,
    aiListingDraft: null,
    showAIProfile: false,
    aiProfileMode: null,
    aiProfileDraft: null,
    showVapId: false,
    showTokensModal: false,
  showInviteFriends: false,
    showPassportMapModal: false,
    passportMapShowCities: false,
    showSeekerRequestDialog: false,
  }),
}));


