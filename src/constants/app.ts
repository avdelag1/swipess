/**
 * Application-wide constants
 * Centralized configuration to avoid magic numbers throughout the codebase
 */

// Cache and stale time configurations (in milliseconds)
export const CACHE_CONFIG = {
  // Query stale times
  CONVERSATIONS_STALE_TIME: 30 * 1000, // 30 seconds
  MESSAGES_STALE_TIME: 5 * 1000, // 5 seconds
  USER_PROFILE_STALE_TIME: 5 * 60 * 1000, // 5 minutes
  LISTINGS_STALE_TIME: 10 * 60 * 1000, // 10 minutes
  MATCHES_STALE_TIME: 5 * 60 * 1000, // 5 minutes

  // Retry settings
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY_BASE: 1000, // milliseconds
  RETRY_DELAY_MAX: 3000, // milliseconds
} as const;

// Debounce and throttle timings
export const TIMING = {
  DEBOUNCE_SEARCH: 300, // milliseconds
  DEBOUNCE_REFETCH: 500, // milliseconds
  DEBOUNCE_RESIZE: 200, // milliseconds
  THROTTLE_SCROLL: 100, // milliseconds
  ANIMATION_DURATION: 300, // milliseconds
} as const;

// Haptic feedback timings (in milliseconds)
export const HAPTICS = {
  LIGHT: 10,
  MEDIUM: 20,
  HEAVY: 30,
  SUCCESS: [10, 50, 10],
  WARNING: [20, 100, 20],
  ERROR: 50,
} as const;

// Limits and constraints
export const LIMITS = {
  MAX_WEB_VITALS_STORED: 50,
  MAX_IMAGE_SIZE_MB: 10,
  MAX_FILE_SIZE_MB: 50,
  MIN_PASSWORD_LENGTH: 8,
  MAX_BIO_LENGTH: 500,
  MAX_SEARCH_RESULTS: 50,
  PAGINATION_SIZE: 20,
} as const;

// Breakpoints for responsive design
export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 1024,
  DESKTOP: 1280,
} as const;

// Feature flags
export const FEATURES = {
  OFFLINE_MODE: false,
  ADVANCED_ANALYTICS: false,
  CONTENT_MODERATION: false,
  BETA_UI: false,
} as const;

// API and Storage configuration
export const STORAGE = {
  // localStorage keys
  WEB_VITALS_KEY: 'webVitals',
  USER_PREFERENCES_KEY: 'userPreferences',
  SEARCH_HISTORY_KEY: 'searchHistory',
  SELECTED_PLAN_KEY: 'swipes_selected_plan',
  PENDING_ACTIVATION_KEY: 'pendingActivationPurchase',
  // Referral system
  REFERRAL_CODE_KEY: 'referral_code',
  // Payment return location
  PAYMENT_RETURN_PATH_KEY: 'payment_return_path',

  // localStorage limits
  MAX_HISTORY_ITEMS: 50,
} as const;

// Referral configuration
export const REFERRAL = {
  FREE_MESSAGES_PER_REFERRAL: 1,
  REFERRAL_EXPIRY_DAYS: 7, // How long referral code stays valid in localStorage
  MAX_REFERRAL_MESSAGES: 30, // Maximum free messages from referrals
} as const;

// Image placeholders
export const PLACEHOLDERS = {
  IMAGE: '/placeholder.svg',
  AVATAR: '/placeholder-avatar.svg',
} as const;

// Message configuration
export const MESSAGING = {
  MAX_MESSAGE_LENGTH: 5000,
  TYPING_INDICATOR_TIMEOUT: 3000, // milliseconds
  MESSAGE_LOAD_BATCH_SIZE: 50,
  UNREAD_BADGE_THRESHOLD: 99,
} as const;

// Color validation for CSS injection prevention
export const VALIDATION = {
  COLOR_REGEX: /^(#[0-9a-fA-F]{3,8}|rgba?\([^)]*\)|hsla?\([^)]*\)|[a-zA-Z]+)$/,
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  PHONE_REGEX: /^[\d\s\-+()]+$/,
  URL_REGEX: /^https?:\/\/.+/,
} as const;
