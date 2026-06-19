import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';
/**
 * 🚀 SWIPESS NATIVE STORE SERVICE
 * App Store review prompts only.
 *
 * NOTE: In-app purchases do NOT go through this module. The real IAP flow is
 * StoreKitService -> PaymentOrchestrator (cordova-plugin-purchase / StoreKit).
 * A previous `purchase()` helper here routed through a `window.WebToNative`
 * bridge that does not exist and always failed; it was removed so no buy button
 * can accidentally be wired to a dead path.
 */
export const NativeStore = {
  /**
   * Request an App Store review prompt.
   * Trigger this after "Success Moments" (e.g., successful match, ID card edit).
   */
  requestReview: async () => {
    if (!Capacitor.isNativePlatform()) return;

    try {
      // Using the WebToNative bridge if available, or fallback to standard Capacitor logic
      if ((window as any).WebToNative?.requestReview) {
        await (window as any).WebToNative.requestReview();
      } else {
        logger.warn('[NativeStore] Review requested (stub)');
      }
    } catch (err) {
      logger.error('[NativeStore] Review request failed:', err);
    }
  },
};
