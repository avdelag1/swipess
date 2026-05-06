/**
 * Canonical Apple In-App Purchase product IDs.
 * These MUST match the products created in App Store Connect.
 * Required to comply with Apple Guideline 3.1.1.
 */

export const APPLE_SUBSCRIPTION_PRODUCTS = [
  'Swipess.plus.monthly.v1',
  'Swipess.plus.semestral.v1',
  'Swipess.plus.annual.v1',
] as const;

/** Token (consumable) packs. The number suffix is the token amount. */
export const APPLE_TOKEN_PRODUCTS = [
  'Swipess.tokens.20',
  'Swipess.tokens.50',
  'Swipess.tokens.100',
  'Swipess.tokens.150',
] as const;

export const APPLE_TOKEN_PACKAGES = [
  {
    id: 'starter',
    name: 'Starter',
    productId: 'Swipess.tokens.20',
    tokens: 20,
    priceUsd: 9.99,
    description: '20 new conversations',
    badge: undefined,
    paypalUrl: 'https://www.paypal.com/ncp/payment/VNM2QVBFG6TA4',
  },
  {
    id: 'plus',
    name: 'Plus',
    productId: 'Swipess.tokens.50',
    tokens: 50,
    priceUsd: 19.99,
    description: '50 new conversations',
    badge: 'Popular',
    paypalUrl: 'https://www.paypal.com/ncp/payment/VG2C7QMAC8N6A',
  },
  {
    id: 'power',
    name: 'Power',
    productId: 'Swipess.tokens.100',
    tokens: 100,
    priceUsd: 39.99,
    description: '100 new conversations',
    badge: undefined,
    paypalUrl: 'https://www.paypal.com/ncp/payment/9NBGA9X3BJ5UA',
  },
  {
    id: 'mega',
    name: 'Mega',
    productId: 'Swipess.tokens.150',
    tokens: 150,
    priceUsd: 49.99,
    description: '150 new conversations',
    badge: 'Best Value',
    paypalUrl: 'https://www.paypal.com/ncp/payment/KP9WHGEN23MYA',
  },
] as const;

export type AppleTokenPackage = (typeof APPLE_TOKEN_PACKAGES)[number];

/** Event promotion (consumable, non-renewing) packs. */
export const APPLE_EVENT_PROMO_PRODUCTS = [
  'Swipess.promo.event.week.v1',
  'Swipess.promo.event.month.v1',
  'Swipess.promo.event.quarter.v1',
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