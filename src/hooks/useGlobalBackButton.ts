import { useEffect, useRef } from 'react';

import { App as CapacitorApp } from '@capacitor/app';
import { Capacitor } from '@capacitor/core';
import { useModalStore } from '@/state/modalStore';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { getParentRoute } from '@/utils/sectionNavigation';

/**
 * ⚡ SWIPESS GLOBAL BACK BUTTON MANAGER
 *
 * Intercepts the Android hardware Back button (via Capacitor) to:
 * 1. Close any open overlays/modals BEFORE navigating.
 * 2. Walk UP the app hierarchy (sub-page → section home → dashboard) instead of
 *    replaying raw history, so the user never has to tap back several times to
 *    escape a deep flow.
 * 3. Exit the app only when pressing back on the dashboard root.
 */
export function useGlobalBackButton() {
  const { navigate } = useAppNavigate();
  // Keep the latest navigate in a ref so the (once-registered) native listener
  // never calls a stale closure.
  const navigateRef = useRef(navigate);
  navigateRef.current = navigate;

  useEffect(() => {
    // Native Android only — PWAs handle history automatically and iOS has no
    // hardware back button.
    if (!Capacitor.isNativePlatform()) return;

    let backHandler: { remove: () => void } | null = null;

    const setupListener = async () => {
      backHandler = await CapacitorApp.addListener('backButton', () => {
        // 1. Close any open modal/overlay first and consume the press.
        const state = useModalStore.getState();
        const modalKeys = [
          'showProfile', 'showPropertyDetails', 'showPropertyInsights',
          'showSavedSearches', 'showOwnerSettings', 'showOwnerProfile',
          'showOwnerSwipe', 'showLegalDocuments', 'showCategoryDialog',
          'showClientInsights', 'showSubscriptionPackages', 'showSupport',
          'showMessageActivations', 'showFilters', 'showAIChat',
          'showAIListing', 'showAIProfile', 'showVapId', 'showTokensModal',
        ];
        if (modalKeys.some((key) => (state as any)[key] === true)) {
          state.closeAll();
          return;
        }

        // 2. Walk up the hierarchy. getParentRoute returns null only on a
        //    dashboard root, where back should exit the app.
        const parent = getParentRoute(window.location.pathname);
        if (parent === null) {
          CapacitorApp.exitApp();
        } else {
          navigateRef.current(parent);
        }
      });
    };

    setupListener();

    return () => {
      if (backHandler) backHandler.remove();
    };
  }, []);
}
