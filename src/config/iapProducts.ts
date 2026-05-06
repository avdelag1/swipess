/**
 * Canonical Apple In-App Purchase product IDs.
 * These MUST match the products created in App Store Connect.
 * Required to comply with Apple Guideline 3.1.1.
 */

export const APPLE_SUBSCRIPTION_PRODUCTS = [
  'Swipess.premium.monthly',
  'Swipess.premium.semi_annual',
  'Swipess.premium.yearly',
] as const;

/** Token (consumable) packs. The number suffix is the token amount. */
export const APPLE_TOKEN_PRODUCTS = [
  'Swipess.tokens.50',
  'Swipess.tokens.150',
  'Swipess.tokens.500',
  'Swipess.tokens.1500',
] as const;

export type AppleProductId =
  | (typeof APPLE_SUBSCRIPTION_PRODUCTS)[number]
  | (typeof APPLE_TOKEN_PRODUCTS)[number];

export const ALL_APPLE_PRODUCTS: AppleProductId[] = [
  ...APPLE_SUBSCRIPTION_PRODUCTS,
  ...APPLE_TOKEN_PRODUCTS,
];

export const isSubscriptionProduct = (id: string) =>
  (APPLE_SUBSCRIPTION_PRODUCTS as readonly string[]).includes(id);

export const isTokenProduct = (id: string) =>
  (APPLE_TOKEN_PRODUCTS as readonly string[]).includes(id);