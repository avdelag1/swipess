import { Capacitor } from '@capacitor/core';
import { logger } from '@/utils/prodLogger';
import { supabase } from '@/integrations/supabase/client';
import { ALL_APPLE_PRODUCTS, APPLE_SUBSCRIPTION_PRODUCTS } from '@/config/iapProducts';

type PurchaseResult = { success: boolean; transactionId?: string; error?: string };

let initState: 'uninitialized' | 'initializing' | 'ready' | 'failed' = 'uninitialized';

const pendingPurchases = new Map<string, {
  resolve: (result: PurchaseResult) => void;
}>();

let globalHandlersRegistered = false;

function getStore(): any | null {
  const cdv = (window as any).CdvPurchase;
  return cdv?.store ?? null;
}

async function ensureDeviceReady(): Promise<void> {
  if ((window as any).CdvPurchase) return;
  await new Promise<void>((resolve) => {
    const onReady = () => resolve();
    document.addEventListener('deviceready', onReady, { once: true });
    setTimeout(resolve, 1500);
  });
}

function isSubscriptionProductId(id: string): boolean {
  return (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id);
}

function productIdsFromTransaction(tx: any): string[] {
  const ids: string[] = [];
  if (tx?.products) {
    for (const p of tx.products) {
      ids.push(typeof p === 'string' ? p : p.id ?? p.productId ?? '');
    }
  }
  return ids.filter(Boolean);
}

function resolvePendingForTransaction(tx: any, result: PurchaseResult): void {
  for (const pid of productIdsFromTransaction(tx)) {
    const pending = pendingPurchases.get(pid);
    if (pending) {
      pendingPurchases.delete(pid);
      pending.resolve(result);
    }
  }
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
          type: isSubscriptionProductId(id)
            ? ProductType.PAID_SUBSCRIPTION
            : ProductType.CONSUMABLE,
          platform: Capacitor.getPlatform() === 'ios' ? Platform.APPLE_APPSTORE : Platform.GOOGLE_PLAY,
        }))
      );

      store.validator = async (receipt: any, callback: any) => {
        try {
          const tx = receipt.transactions?.[0];
          const productId = tx?.products?.[0]?.id ?? tx?.products?.[0] ?? null;
          const appStoreReceipt = tx?.appStoreReceipt ?? null;

          if (!productId || !appStoreReceipt) {
            callback({ ok: false, code: 6778001, message: 'Missing receipt data or product ID' });
            return;
          }

          const { data, error } = await supabase.functions.invoke('validate-apple-receipt', {
            body: {
              productId,
              transactionId: tx.transactionId,
              receipt: appStoreReceipt,
            },
          });
          if (error || !data?.ok) {
            callback({ ok: false, code: 6778003, message: error?.message ?? data?.error ?? 'Validation failed' });
            return;
          }
          callback({ ok: true, data: { transaction: tx } });
        } catch (e: any) {
          callback({ ok: false, code: 6778003, message: e?.message ?? 'Validator error' });
        }
      };

      if (!globalHandlersRegistered) {
        globalHandlersRegistered = true;

        store
          .when()
          .approved((tx: any) => {
            tx.verify();
            setTimeout(() => {
              if (tx.state !== cdv.TransactionState.FINISHED) {
                logger.warn('[IAP] Force-finishing stuck transaction.');
                tx.finish();
              }
            }, 3000);
          })
          .verified((verifiedReceipt: any) => {
            verifiedReceipt.finish?.();
            // CdvPurchase v13: a VerifiedReceipt exposes its transactions via
            // `sourceReceipt.transactions`, NOT a top-level `transactions` field.
            // (The `.unverified` handler below correctly reads `receipt.transactions`.)
            // Reading the wrong path here meant the success branch never resolved
            // the pending purchase, so a completed buy hung until the 120s timeout
            // and surfaced as "Purchase Failed" even though tokens were granted.
            const verifiedTxs =
              verifiedReceipt?.sourceReceipt?.transactions ??
              verifiedReceipt?.transactions ??
              [];
            for (const tx of verifiedTxs) {
              resolvePendingForTransaction(tx, { success: true, transactionId: tx.transactionId });
            }
          })
          .unverified((unverifiedReceipt: any) => {
            logger.warn('[IAP] Receipt validation failed:', unverifiedReceipt?.payload?.message ?? 'Unknown error');
            for (const tx of unverifiedReceipt?.receipt?.transactions ?? []) {
              tx.finish();
              resolvePendingForTransaction(tx, {
                success: false,
                error: 'Purchase verification failed. Please contact support.',
              });
            }
          });
      }

      const platformConfig = Capacitor.getPlatform() === 'ios'
        ? Platform.APPLE_APPSTORE
        : Platform.GOOGLE_PLAY;

      await store.initialize([platformConfig]);

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
      const timer = setTimeout(() => {
        pendingPurchases.delete(productId);
        resolve({ success: false, error: 'TIMEOUT' });
      }, 120_000);

      pendingPurchases.set(productId, {
        resolve: (result) => {
          clearTimeout(timer);
          resolve(result);
        },
      });

      try {
        const offer = product.getOffer?.() ?? product.offers?.[0];
        if (!offer) {
          pendingPurchases.delete(productId);
          clearTimeout(timer);
          resolve({ success: false, error: 'NO_OFFER' });
          return;
        }
        store.order(offer).catch((err: any) => {
          const errMsg = err?.message ?? '';
          if (errMsg === 'CANCELLED' || errMsg.includes('cancelled') || errMsg.includes('CANCELLED')) {
            const pending = pendingPurchases.get(productId);
            if (pending) {
              pendingPurchases.delete(productId);
              clearTimeout(timer);
              resolve({ success: false, error: 'CANCELLED' });
            }
          }
        });
      } catch (e: any) {
        pendingPurchases.delete(productId);
        clearTimeout(timer);
        resolve({ success: false, error: e?.message ?? 'ORDER_THREW' });
      }
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
