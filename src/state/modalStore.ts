import { create } from 'zustand';

/**
 * ZENITH GLOBAL MODAL STORE
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
  showAIChat: boolean;
  showVapId: boolean;
  showTokensModal: boolean;
  showMapFullscreen: boolean;

  // Actions
  setModal: (key: keyof Omit<ModalState, 'setModal' | 'selectedListingId' | 'selectedProfileId' | 'subscriptionReason'>, value: boolean) => void;
  openPropertyDetails: (id: string) => void;
  openPropertyInsights: (id: string) => void;
  openClientInsights: (id: string) => void;
  openSubscription: (reason: string) => void;
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
  showAIChat: false,
  showVapId: false,
  showTokensModal: false,
  showMapFullscreen: false,

  setModal: (key, value) => set({ [key]: value }),
  
  openPropertyDetails: (id) => set({ selectedListingId: id, showPropertyDetails: true }),
  openPropertyInsights: (id) => set({ selectedListingId: id, showPropertyInsights: true }),
  openClientInsights: (id) => set({ selectedProfileId: id, showClientInsights: true }),
  openSubscription: (reason) => set({ subscriptionReason: reason, showSubscriptionPackages: true }),
  
  closeAll: () => set({
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
    showVapId: false,
    showTokensModal: false,
    showMapFullscreen: false,
  }),
}));
