import { Capacitor } from '@capacitor/core';

/**
 *  StoreKit 2 & Native Platform Bridge
 * Ensures compliance with Guideline 3.1.1 (IAP) and 4.0 (Design)
 */

/**
 * Canonical In-App Purchase product IDs.
 * These MUST match the products created in App Store Connect / Google Play Console.
 * Required to comply with Apple Guideline 3.1.1 and Google Play Billing Policy.
 */

export const APPLE_SUBSCRIPTION_PRODUCTS = [
  'Swipess.plus.monthly.v3',
  'Swipess.plus.semestral.v3',
  'Swipess.plus.annual.v3',
] as const;

/** Token (consumable) packs. The number suffix is the token amount. */
export const APPLE_TOKEN_PRODUCTS = [
  'Swipess.tokens.20.v2',
  'Swipess.tokens.50.v2',
  'Swipess.tokens.100.v2',
  'Swipess.tokens.150.v2',
] as const;

/** Event promotion (consumable, non-renewing) packs. */
export const APPLE_EVENT_PROMO_PRODUCTS = [
  'Swipess.promo.event.week.v3',
  'Swipess.promo.event.month.v3',
  'Swipess.promo.event.quarter.v3',
] as const;

export type AppleProductId =
  | (typeof APPLE_SUBSCRIPTION_PRODUCTS)[number]
  | (typeof APPLE_TOKEN_PRODUCTS)[number]
  | (typeof APPLE_EVENT_PROMO_PRODUCTS)[number];

export const ALL_APPLE_PRODUCTS: AppleProductId[] = [
  ...APPLE_SUBSCRIPTION_PRODUCTS,
  ...APPLE_TOKEN_PRODUCTS,
  ...APPLE_EVENT_PROMO_PRODUCTS,
];

/**
 * Compliance Helper: Strips web payment links on iOS to satisfy Guideline 3.1.1.
 * @param url The PayPal/Web checkout URL
 */
export const getSafePaymentUrl = (url?: string): string | undefined => {
  // IMPORTANT: We must block alternative payment URLs in production iOS to comply 
  // with Apple App Store Guideline 3.1.1. If Apple sees PayPal, they ban the app.
  // However, during local development, we allow it so you can test the fallback!
  if (Capacitor.getPlatform() === 'ios' && !import.meta.env.DEV) return undefined;
  return url;
};

export const APPLE_TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    productId: 'Swipess.tokens.20.v2',
    tokens: 20,
    priceUsd: 9.99,
    priceMxn: 199,
    description: '20 new conversations',
    badge: undefined as string | undefined,
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/VNM2QVBFG6TA4'),
  },
  {
    id: 'plus',
    name: 'Plus',
    productId: 'Swipess.tokens.50.v2',
    tokens: 50,
    priceUsd: 19.99,
    priceMxn: 399,
    description: '50 new conversations',
    badge: 'Popular',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/VG2C7QMAC8N6A'),
  },
  {
    id: 'power',
    name: 'Power',
    productId: 'Swipess.tokens.100.v2',
    tokens: 100,
    priceUsd: 39.99,
    priceMxn: 799,
    description: '100 new conversations',
    badge: undefined,
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/9NBGA9X3BJ5UA'),
  },
  {
    id: 'mega',
    name: 'Mega',
    productId: 'Swipess.tokens.150.v2',
    tokens: 150,
    priceUsd: 49.99,
    priceMxn: 999,
    description: '150 new conversations',
    badge: 'Best Value',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/ncp/payment/KP9WHGEN23MYA'),
  },
] as const;

export type AppleTokenPackage = (typeof APPLE_TOKEN_PACKAGES)[number];

export const isSubscriptionProduct = (id: string) =>
  (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id);

export const isTokenProduct = (id: string) =>
  (APPLE_TOKEN_PRODUCTS as readonly string[]).includes(id);

export const isEventPromoProduct = (id: string) =>
  (APPLE_EVENT_PROMO_PRODUCTS as readonly string[]).includes(id);
