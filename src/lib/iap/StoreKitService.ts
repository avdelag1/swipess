/**
 * StoreKitService — real Apple In-App Purchase via cordova-plugin-purchase.
 *
 * Required for App Store Guideline 3.1.1. Replaces the previous mock in
 * NativeBridge.purchaseProduct. On non-iOS (web) it throws so callers can
 * fall back to web checkout (PayPal/Stripe). Server-side receipt validation
 * is performed by the `validate-apple-receipt` edge function.
 */
import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';
import { supabase } from '@/integrations/supabase/client';
import { ALL_APPLE_PRODUCTS, APPLE_SUBSCRIPTION_PRODUCTS } from '@/config/iapProducts';

type PurchaseResult = { success: boolean; transactionId?: string; error?: string };

let initState: 'uninitialized' | 'initializing' | 'ready' | 'failed' = 'uninitialized';

function getStore(): any | null {
  // cordova-plugin-purchase exposes CdvPurchase on window once the device
  // 'deviceready' event fires. Outside iOS this will be undefined.
  const cdv = (window as any).CdvPurchase;
  return cdv?.store ?? null;
}

async function ensureDeviceReady(): Promise<void> {
  if ((window as any).CdvPurchase) return;
  await new Promise<void>((resolve) => {
    const onReady = () => resolve();
    document.addEventListener('deviceready', onReady, { once: true });
    // Capacitor fires deviceready early; safety timeout in case it already happened
    setTimeout(resolve, 1500);
  });
}

export const StoreKitService = {
  isAvailable(): boolean {
    return Capacitor.isNativePlatform();
  },

  async init(): Promise<void> {
    if (initState === 'ready' || initState === 'initializing' || !this.isAvailable()) return;
    initState = 'initializing';
    try {
      await ensureDeviceReady();
      const store = getStore();
      if (!store) {
        logger.warn('[IAP] CdvPurchase.store unavailable; skipping init');
        initState = 'failed';
        return;
      }
      const cdv = (window as any).CdvPurchase;
      const ProductType = cdv.ProductType;
      const Platform = cdv.Platform;

      store.register(
        ALL_APPLE_PRODUCTS.map((id) => ({
          id,
          type: (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id)
            ? ProductType.PAID_SUBSCRIPTION
            : ProductType.CONSUMABLE,
          platform: Capacitor.getPlatform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
        }))
      );

      // Server-side receipt validation
      store.validator = async (receipt: any, callback: any) => {
        try {
          const { data, error } = await supabase.functions.invoke('validate-apple-receipt', {
            body: {
              productId: receipt.id,
              transactionId: receipt.transaction?.transactionId,
              receipt: receipt.transaction?.appStoreReceipt
                ?? receipt.transaction?.receipt
                ?? null,
            },
          });
          if (error || !data?.ok) {
            callback({ ok: false, code: 6778003, message: error?.message ?? 'Validation failed' });
            return;
          }
          callback({ ok: true, data: { transaction: receipt.transaction } });
        } catch (e: any) {
          callback({ ok: false, code: 6778003, message: e?.message ?? 'Validator error' });
        }
      };

      store
        .when()
        .approved((tx: any) => {
          tx.verify();
          // If we are in local development/simulator, the Apple Prod verification endpoint will fail.
          // We must finish the transaction after a delay to prevent the consumable from getting stuck forever.
          setTimeout(() => {
            if (tx.state !== (window as any).CdvPurchase.TransactionState.FINISHED) {
              logger.warn('[IAP] Force-finishing stuck transaction to clear queue.');
              tx.finish();
            }
          }, 3000);
        })
        .verified((tx: any) => tx.finish())
        .unverified((tx: any) => {
          logger.warn('[IAP] Transaction unverified. Finishing to unblock future purchases.');
          tx.finish();
        });

      const platformConfig = Capacitor.getPlatform() === 'ios'
        ? (window as any).CdvPurchase.Platform.APPLE_APPSTORE
        : (window as any).CdvPurchase.Platform.GOOGLE_PLAY;

      await store.initialize([platformConfig]);

      // Wait for products to finish loading from App Store Connect
      // before allowing purchases — prevents 'PRODUCT_NOT_FOUND' race
      await new Promise<void>((resolve) => {
        const timeout = setTimeout(() => {
          logger.warn('[IAP] Product loading timed out; proceeding anyway');
          resolve();
        }, 15000);
        store.when().ready(() => {
          clearTimeout(timeout);
          resolve();
        });
      });

      initState = 'ready';
    } catch (e) {
      logger.error('[IAP] init failed', e);
      initState = 'failed';
    }
  },

  async purchase(productId: string): Promise<PurchaseResult> {
    if (!this.isAvailable()) {
      return { success: false, error: 'NOT_NATIVE' };
    }
    await this.init();

    if (initState === 'failed') {
      return { success: false, error: 'App Store connection unavailable. Please try again later.' };
    }

    const store = getStore();
    if (!store) return { success: false, error: 'STORE_UNAVAILABLE' };

    // Retry product lookup with backoff — products may still be loading
    // or the .ready() callback may have fired before all products resolved
    let product = store.get(productId);
    if (!product) {
      for (let i = 0; i < 10; i++) {
        await new Promise((r) => setTimeout(r, 500));
        product = store.get(productId);
        if (product) break;
      }
    }

    if (!product) return { success: false, error: 'PRODUCT_NOT_FOUND' };
    if (!product.canPurchase) return { success: false, error: 'CANNOT_PURCHASE' };

    return new Promise<PurchaseResult>((resolve) => {
      let settled = false;
      const off: Array<() => void> = [];
      const finalize = (r: PurchaseResult) => {
        if (settled) return;
        settled = true;
        off.forEach((fn) => fn());
        resolve(r);
      };

      const verifiedHandler = (tx: any) => {
        if (tx.products?.some((p: any) => p.id === productId)) {
          finalize({ success: true, transactionId: tx.transactionId });
        }
      };
      const cancelledHandler = () => finalize({ success: false, error: 'CANCELLED' });
      const errorHandler = (err: any) =>
        finalize({ success: false, error: err?.message ?? 'UNKNOWN' });

      try {
        store.when().verified(verifiedHandler);
        store.when().cancelled(cancelledHandler);
        store.error(errorHandler);
      } catch (e: any) {
        finalize({ success: false, error: e?.message ?? 'LISTENER_ERROR' });
      }

      try {
        const offer = product.getOffer?.() ?? product.offers?.[0];
        if (!offer) {
          finalize({ success: false, error: 'NO_OFFER' });
          return;
        }
        store.order(offer).catch((e: any) =>
          finalize({ success: false, error: e?.message ?? 'ORDER_FAILED' })
        );
      } catch (e: any) {
        finalize({ success: false, error: e?.message ?? 'ORDER_THREW' });
      }

      // Safety timeout — Apple sheet usually completes within 60s
      setTimeout(() => finalize({ success: false, error: 'TIMEOUT' }), 120_000);
    });
  },

  async restore(): Promise<PurchaseResult> {
    if (!this.isAvailable()) return { success: false, error: 'NOT_NATIVE' };
    await this.init();
    if (initState === 'failed') return { success: false, error: 'STORE_UNAVAILABLE' };
    const store = getStore();
    if (!store) return { success: false, error: 'STORE_UNAVAILABLE' };
    try {
      await store.restorePurchases();
      return { success: true };
    } catch (e: any) {
      return { success: false, error: e?.message ?? 'RESTORE_FAILED' };
    }
  },
};

export default StoreKitService;
