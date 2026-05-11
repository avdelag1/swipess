import { Capacitor } from '@capacitor/core';
import { haptics } from './microPolish';
import { toast } from '@/components/ui/sonner';

/**
 * 🚀 SWIPESS NATIVE STORE SERVICE
 * Handles Apple/Google In-App Purchases and App Store Ratings.
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
        console.log('[NativeStore] Review requested (stub)');
      }
    } catch (err) {
      console.error('[NativeStore] Review request failed:', err);
    }
  },

  /**
   * Handle Native Purchase Bridge
   * Fixes App Store rejection by routing through Native IAP instead of Stripe/PayPal.
   */
  purchase: async (productId: string) => {
    if (!Capacitor.isNativePlatform()) {
      toast.error('Native billing is only available on iOS/Android.');
      return { success: false, error: 'NOT_NATIVE' };
    }

    haptics.impact('medium');
    
    try {
      // 1. Trigger the native sheet
      const result = (window as any).WebToNative?.purchase 
        ? await (window as any).WebToNative.purchase(productId)
        : { success: false, error: 'BRIDGE_MISSING' };

      if (result.success) {
        haptics.notification('success');
        return { success: true };
      }
      
      return { success: false, error: result.error || 'UNKNOWN' };
    } catch (err) {
      console.error('[NativeStore] Purchase failed:', err);
      return { success: false, error: 'CRASHED' };
    }
  }
};
