/**
 * Lazy Import Configuration
 * Optimizes which libraries are loaded immediately vs. deferred
 *
 * STRATEGY:
 * - Load only essential libraries on page load
 * - Defer heavy libraries (charts, dates, animations) until needed
 * - Use dynamic imports to prevent bundling of unused code
 */

/**
 * Heavy libraries that should be lazy loaded:
 * - recharts (Charts library) ~100KB
 * - date-fns (Date utilities) ~50KB
 * - embla-carousel (Carousel) ~20KB
 * - framer-motion (Advanced animations) ~40KB
 *
 * These are currently imported eagerly and should be deferred
 * to reduce initial bundle size.
 */

// Critical imports that load immediately (already optimized in Vite config)
export const CRITICAL_IMPORTS = [
  'react',
  'react-dom',
  'react-router-dom',
  '@tanstack/react-query',
  '@supabase/supabase-js',
] as const;

// Heavy imports to defer until needed
export const DEFERRED_IMPORTS = {
  'recharts': async () => import('recharts'),
  'date-fns': async () => import('date-fns'),
  'embla-carousel-react': async () => import('embla-carousel-react'),
  'framer-motion': async () => import('framer-motion'),
} as const;

/**
 * Component-specific lazy imports to reduce code splitting overhead
 */
export const COMPONENT_IMPORTS = {
  // Dashboard components that use recharts
  dashboard: async () => import('../components/EnhancedOwnerDashboard'),

  // Date picker related
  datePicker: async () => import('../components/ui/calendar'),
} as const;

/**
 * Preload strategy for commonly accessed routes
 * These should be preloaded during browser idle time
 */
export const ROUTE_PRELOADS = [
  // High priority - preload immediately after main app loads
  () => import('../pages/ClientDashboard'),
  () => import('../pages/OwnerProfileNew'),

  // Medium priority - preload during idle
  () => import('../pages/ClientProfileNew'),
  () => import('../components/EnhancedOwnerDashboard'),
  () => import('../pages/MessagingDashboard'),
] as const;

/**
 * Hover-based preloads for navigation links
 * Preload when user hovers over a navigation link
 */
export const HOVER_PRELOADS = {
  '/client/dashboard': () => import('../pages/ClientDashboard'),
  '/owner/dashboard': () => import('../components/EnhancedOwnerDashboard'),
  '/client/profile': () => import('../pages/ClientProfileNew'),
  '/messages': () => import('../pages/MessagingDashboard'),
} as const;

export default {
  CRITICAL_IMPORTS,
  DEFERRED_IMPORTS,
  COMPONENT_IMPORTS,
  ROUTE_PRELOADS,
  HOVER_PRELOADS,
};