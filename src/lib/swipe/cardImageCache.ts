/**
 * Shared image cache for CardImage components
 *
 * This cache is used across all card images to:
 * - Prevent re-loading images that have already been loaded
 * - Enable instant display of cached images (no fade transition)
 * - Support aggressive preloading of card images
 */
export const imageCache = new Map<string, boolean>();
