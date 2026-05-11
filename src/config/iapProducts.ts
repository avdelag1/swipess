<<<<<<< HEAD
import { Capacitor } from '@capacitor/core';

/**
 * Canonical In-App Purchase product IDs.
 * These MUST match the products created in App Store Connect / Google Play Console.
 * Required to comply with Apple Guideline 3.1.1 and Google Play Billing Policy.
 */

export const APPLE_SUBSCRIPTION_PRODUCTS = [
  'Swipess.plus.monthly.v2',
  'Swipess.plus.semestral.v2',
  'Swipess.plus.annual.v2',
] as const;

/** Token (consumable) packs. The number suffix is the token amount. */
export const APPLE_TOKEN_PRODUCTS = [
  'Swipess.tokens.20.v1',
  'Swipess.tokens.50.v1',
  'Swipess.tokens.100.v1',
  'Swipess.tokens.150.v1',
] as const;

/**
 * PayPal URLs are ONLY available on web and Android.
 * On iOS, Apple Guideline 3.1.1 prohibits external payment for digital goods.
 * The paypalUrl field is conditionally set to undefined on iOS at runtime.
 */
const isIOS = Capacitor.getPlatform() === 'ios';

export const APPLE_TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    productId: 'Swipess.tokens.20.v1',
    tokens: 20,
    priceUsd: 9.99,
    description: '20 new conversations',
    badge: undefined as string | undefined,
    paypalUrl: isIOS ? undefined : 'https://www.paypal.com/ncp/payment/VNM2QVBFG6TA4',
  },
  {
    id: 'plus',
    name: 'Plus',
    productId: 'Swipess.tokens.50.v1',
    tokens: 50,
    priceUsd: 19.99,
    description: '50 new conversations',
    badge: 'Popular' as string | undefined,
    paypalUrl: isIOS ? undefined : 'https://www.paypal.com/ncp/payment/VG2C7QMAC8N6A',
  },
  {
    id: 'power',
    name: 'Power',
    productId: 'Swipess.tokens.100.v1',
    tokens: 100,
    priceUsd: 39.99,
    description: '100 new conversations',
    badge: undefined as string | undefined,
    paypalUrl: isIOS ? undefined : 'https://www.paypal.com/ncp/payment/9NBGA9X3BJ5UA',
  },
  {
    id: 'mega',
    name: 'Mega',
    productId: 'Swipess.tokens.150.v1',
    tokens: 150,
    priceUsd: 49.99,
    description: '150 new conversations',
    badge: 'Best Value' as string | undefined,
    paypalUrl: isIOS ? undefined : 'https://www.paypal.com/ncp/payment/KP9WHGEN23MYA',
  },
] as const;

export type AppleTokenPackage = (typeof APPLE_TOKEN_PACKAGES)[number];

/** Event promotion (consumable, non-renewing) packs. */
export const APPLE_EVENT_PROMO_PRODUCTS = [
  'Swipess.promo.event.week.v2',
  'Swipess.promo.event.month.v2',
  'Swipess.promo.event.quarter.v2',
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

export const isSubscriptionProduct = (id: string) =>
  (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id);

export const isTokenProduct = (id: string) =>
  (APPLE_TOKEN_PRODUCTS as readonly string[]).includes(id);

export const isEventPromoProduct = (id: string) =>
  (APPLE_EVENT_PROMO_PRODUCTS as readonly string[]).includes(id);
=======
import { NativeBridge } from '@/utils/nativeBridge';

/**
 * Canonical Apple In-App Purchase product IDs.
 * These MUST match the products created in App Store Connect.
 */

export const APPLE_SUBSCRIPTION_PRODUCTS = [
  'swipess_1month_v2',
  'swipess_6months_v2',
  'swipess_1year_v2',
] as const;

/** Token (consumable) packs. */
export const APPLE_TOKEN_PRODUCTS = [
  'swipess_explorer_starter_v1',
  'swipess_explorer_standard_v1',
  'swipess_explorer_premium_v1',
  'swipess_provider_starter_v1',
  'swipess_provider_standard_v1',
  'swipess_provider_premium_v1',
] as const;

export const APPLE_EVENT_PROMO_PRODUCTS = [
  'swipess_promo_event_week_v2',
  'swipess_promo_event_month_v2',
  'swipess_promo_event_quarter_v2',
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
  if (NativeBridge.isIOS()) return undefined;
  return url;
};

export const APPLE_TOKEN_PACKAGES = [
  {
    id: 'explorer_starter',
    name: 'Explorer Starter',
    productId: 'swipess_explorer_starter_v1',
    tokens: 5,
    priceMxn: 69.99,
    description: 'Perfect for trying out connections',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/your-custom-link'),
  },
  {
    id: 'explorer_standard',
    name: 'Explorer Standard',
    productId: 'swipess_explorer_standard_v1',
    tokens: 10,
    priceMxn: 129.99,
    description: 'Most popular choice for active explorers',
    badge: 'Popular',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/your-custom-link'),
  },
  {
    id: 'explorer_premium',
    name: 'Explorer Premium',
    productId: 'swipess_explorer_premium_v1',
    tokens: 15,
    priceMxn: 179.99,
    description: 'Maximum connections for serious explorers',
    badge: 'Best Value',
    paypalUrl: getSafePaymentUrl('https://www.paypal.com/your-custom-link'),
  },
] as const;

export type AppleTokenPackage = (typeof APPLE_TOKEN_PACKAGES)[number];

export const isSubscriptionProduct = (id: string) =>
  (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id);

export const isTokenProduct = (id: string) =>
  (APPLE_TOKEN_PRODUCTS as readonly string[]).includes(id);

export const isEventPromoProduct = (id: string) =>
  (APPLE_EVENT_PROMO_PRODUCTS as readonly string[]).includes(id);
>>>>>>> 717f66fc (feat: stabilize messaging UX with premium connection animations and holographic identity hardening)
