/**
 * Smart Matching — Barrel re-export
 *
 * This file re-exports everything from the smartMatching/ sub-modules
 * so existing imports like `from '@/hooks/useSmartMatching'` keep working.
 *
 * The original 1428-line monolith has been split into:
 *   - smartMatching/types.ts           — Types, interfaces & helper utilities
 *   - smartMatching/matchCalculators.ts — Pure match-scoring functions
 *   - smartMatching/useSmartListingMatching.tsx — Listing matching hook
 *   - smartMatching/useSmartClientMatching.tsx  — Client matching hook
 */

// Types & helpers
export type {
  MatchedListing,
  MatchedClientProfile,
  ClientFilters,
  ListingFilters,
} from './smartMatching/types';

export { shuffleArray, hasMockImages } from './smartMatching/types';

// Match calculators
export { calculateListingMatch, calculateClientMatch } from './smartMatching/matchCalculators';

// React Query hooks
export { useSmartListingMatching } from './smartMatching/useSmartListingMatching';
export { useSmartClientMatching } from './smartMatching/useSmartClientMatching';