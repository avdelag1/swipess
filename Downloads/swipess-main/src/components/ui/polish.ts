/**
 * Professional App Polish - Barrel Export
 * 
 * All polish components and utilities in one import:
 * import { VerifiedBadge, UserFriendlyError, haptics } from '@/components/ui/polish';
 */

// Trust Signals
export {
  VerifiedBadge,
  ActivityIndicator,
  RatingDisplay,
  ProfileStrength,
  ResponseTimeBadge,
} from './TrustSignals';

// Card Information Hierarchy
export {
  PropertyCardInfo,
  VehicleCardInfo,
  ServiceCardInfo,
  ClientCardInfo,
} from './CardInfoHierarchy';

// User-Friendly Errors
export {
  UserFriendlyError,
  getErrorMessage,
} from './UserFriendlyError';

// Soft Paywalls
export {
  FeaturePreview,
  LockedFeatureTooltip,
  TrialLimitBanner,
} from './SoftPaywall';
