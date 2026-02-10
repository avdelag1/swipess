/**
 * Direct Messaging Utilities
 *
 * Categories eligible for direct messaging (no activation/quota requirements):
 * - motorcycle: Motos and motorcycles
 * - bicycle: Bicycles and e-bikes
 *
 * These categories allow users to message listings directly without
 * going through the standard message confirmation/quota flow.
 */

/**
 * Categories that are eligible for direct messaging without activation
 */
export const DIRECT_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle', 'moto'] as const;

export type DirectMessagingCategory = typeof DIRECT_MESSAGING_CATEGORIES[number];

/**
 * Checks if a listing category is eligible for direct messaging
 * @param category - The listing category to check
 * @returns true if the category allows direct messaging
 */
export function isDirectMessagingCategory(category: string | undefined | null): boolean {
  if (!category) return false;
  const normalizedCategory = category.toLowerCase().trim();
  return DIRECT_MESSAGING_CATEGORIES.includes(normalizedCategory as DirectMessagingCategory);
}

/**
 * Checks if a listing object is eligible for direct messaging based on its category
 * @param listing - The listing object (must have a category field)
 * @returns true if the listing allows direct messaging
 */
export function isDirectMessagingListing(listing: { category?: string } | null | undefined): boolean {
  if (!listing) return false;
  return isDirectMessagingCategory(listing.category);
}

/**
 * Default message for direct messaging flow
 */
export const DEFAULT_DIRECT_MESSAGE = "Hi! I'm interested in this listing and would like to know more.";
