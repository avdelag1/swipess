import { Capacitor } from '@capacitor/core';
import { StoreKitService } from '@/lib/iap/StoreKitService';

/**
 *  StoreKit 2 & Native Platform Bridge
 * Ensures compliance with Guideline 3.1.1 (IAP) and 4.0 (Design)
 */
export const NativeBridge = {
  isIOS: () => Capacitor.getPlatform() === 'ios',
  isAndroid: () => Capacitor.getPlatform() === 'android',
  isNative: () => Capacitor.isNativePlatform(),

  /**
   * Triggers native In-App Purchase flow
   * @param productId The App Store / Play Store product ID
   */
  purchaseProduct: async (productId: string) => {
    if (!Capacitor.isNativePlatform()) {
      console.warn('Native IAP called on web. Fallback to web checkout required.');
      return { success: false, error: 'NOT_NATIVE' };
    }
    return StoreKitService.purchase(productId);
  },

  /**
   * Restores existing App Store / Play Store subscriptions
   */
  restorePurchases: async () => {
    if (!Capacitor.isNativePlatform()) {
      return { success: false, error: 'NOT_NATIVE' };
    }
    return StoreKitService.restore();
  }
};


