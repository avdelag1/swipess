import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useModalStore } from '@/state/modalStore';

/**
 * ⚡ SWIPESS GLOBAL BACK BUTTON MANAGER
 * 
 * Intercepts the Android Hardware Back Button (via Capacitor) to:
 * 1. Close any open overlays/modals BEFORE navigating back.
 * 2. Exit the app ONLY when pressing back on the Dashboard root.
 * 3. Navigate back through history natively otherwise.
 */
export function useGlobalBackButton() {
  const _location = useLocation();

  useEffect(() => {
    // We only attach this listener on Native Mobile builds (Android APK).
    // Standard PWAs handle history automatically, and iOS doesn't have a hardware back button.
    if (!Capacitor.isNativePlatform()) return;

    let backHandler: any = null;

    const setupListener = async () => {
      backHandler = await CapacitorApp.addListener('backButton', () => {
        // 1. Check for open modals
        const state = useModalStore.getState();
        const modalKeys = [
          'showProfile', 'showPropertyDetails', 'showPropertyInsights',
          'showSavedSearches', 'showOwnerSettings', 'showOwnerProfile',
          'showOwnerSwipe', 'showLegalDocuments', 'showCategoryDialog',
          'showClientInsights', 'showSubscriptionPackages', 'showSupport',
          'showMessageActivations', 'showFilters', 'showAIChat',
          'showAIListing', 'showAIProfile', 'showVapId', 'showTokensModal'
        ];
        
        const hasOpenModal = modalKeys.some(key => (state as any)[key] === true);
        
        if (hasOpenModal) {
          // Consume the back button press to close modals
          state.closeAll();
          return;
        }

        // 2. Navigation routing logic
        const path = window.location.pathname;
        const isDashboardRoot = 
          path === '/client/dashboard' || 
          path === '/owner/dashboard' || 
          path === '/admin/dashboard' || 
          path === '/';

        if (isDashboardRoot) {
          // We are on the root. Exit the app.
          CapacitorApp.exitApp();
        } else {
          // Go back up the hierarchy. 
          // Native history.back() triggers react-router-dom's popstate handler.
          window.history.back();
        }
      });
    };

    setupListener();

    return () => {
      if (backHandler) {
        backHandler.remove();
      }
    };
  }, []);
}
