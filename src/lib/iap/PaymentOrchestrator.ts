import { Capacitor } from '@capacitor/core';
import { StoreKitService } from './StoreKitService';
import { NativeBridge } from '@/utils/nativeBridge';
import { appToast } from '@/utils/appNotification';
import { Browser } from '@capacitor/browser';
import { STORAGE } from '@/constants/app';
import { logger } from '@/utils/prodLogger';

type PurchaseOptions = {
  appleProductId: string;
  paypalUrl?: string;
  onSuccess?: () => void;
  onError?: (error: string) => void;
  returnPath?: string;
};

export const PaymentOrchestrator = {
  async init() {
    if (Capacitor.isNativePlatform()) {
      logger.info('[PaymentOrchestrator] Pre-warming StoreKitService');
      await StoreKitService.init();
    }
  },

  async purchase(options: PurchaseOptions) {
    if (NativeBridge.isNative()) {
      appToast.info('Connecting to App Store', 'Initiating secure In-App Purchase...');
      const result = await NativeBridge.purchaseProduct(options.appleProductId);
      
      if (result.success) {
        options.onSuccess?.();
        return;
      }
      
      const cancelled = (result as any).error === 'CANCELLED';
      if (cancelled) {
        options.onError?.('CANCELLED');
        return;
      }
      
      options.onError?.((result as any).error || 'Purchase failed');
      return;
    }

    // Web Fallback
    const safePaypalUrl = options.paypalUrl;
    if (!safePaypalUrl) {
      appToast.error('In-App Purchase Required', 'This plan is only available through the App Store on iOS.');
      options.onError?.('NO_WEB_FALLBACK');
      return;
    }

    // Store return path for after PayPal redirects back to the PWA
    if (options.returnPath) {
      sessionStorage.setItem(STORAGE.PAYMENT_RETURN_PATH_KEY, options.returnPath);
    }
    
    // We NO LONGER store the plan to blind-grant it on PaymentSuccess (Security Fix)
    // The backend must process the PayPal webhook independently.

    try {
      await Browser.open({ url: safePaypalUrl, presentationStyle: 'popover' });
    } catch (e) {
      // Fallback if Capacitor Browser plugin fails or is blocked on web
      window.open(safePaypalUrl, '_blank');
    }
    
    // Web flow opened, release the lock in the UI
    options.onError?.('CANCELLED');
  },

  async restore() {
    if (NativeBridge.isNative()) {
      appToast.info('Restoring Purchases', 'Verifying with App Store...');
      const result = await NativeBridge.restorePurchases();
      if (result.success) {
        appToast.success('Restore Complete', 'Your purchases have been verified.');
      } else {
        appToast.error('Restore Failed', 'No previous purchases found or an error occurred.');
      }
    } else {
      appToast.info('Restore Unavailable', 'Purchase restoration is only available in the native app.');
    }
  }
};
