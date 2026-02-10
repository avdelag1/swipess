/**
 * Speed of Light Route Prefetcher
 * Optimized for instant navigation WITHOUT blocking first render
 *
 * Key optimizations:
 * - Only preload 1-2 most likely routes initially  
 * - Use requestIdleCallback to never compete with first paint
 * - Batch prefetches one at a time to avoid main thread blocking
 * - NO automatic "prefetch all" on mobile
 */

type RouteImport = () => Promise<{ default: React.ComponentType }>;

// Route mapping for prefetching - ALL app routes
const routeImports: Record<string, RouteImport> = {
  // Client routes
  '/client/dashboard': () => import('@/pages/ClientDashboard'),
  '/client/profile': () => import('@/pages/ClientProfileNew'),
  '/client/settings': () => import('@/pages/ClientSettingsNew'),
  '/client/liked-properties': () => import('@/pages/ClientLikedProperties'),
  '/client/contracts': () => import('@/pages/ClientContracts'),
  '/client/services': () => import('@/pages/ClientWorkerDiscovery'),
  '/client/saved-searches': () => import('@/pages/ClientSavedSearches'),
  '/client/security': () => import('@/pages/ClientSecurity'),
  // Owner routes
  '/owner/dashboard': () => import('@/components/EnhancedOwnerDashboard'),
  '/owner/profile': () => import('@/pages/OwnerProfileNew'),
  '/owner/settings': () => import('@/pages/OwnerSettingsNew'),
  '/owner/properties': () => import('@/pages/OwnerProperties'),
  '/owner/listings/new': () => import('@/pages/OwnerNewListing'),
  '/owner/liked-clients': () => import('@/pages/OwnerLikedClients'),
  '/owner/contracts': () => import('@/pages/OwnerContracts'),
  '/owner/saved-searches': () => import('@/pages/OwnerSavedSearches'),
  '/owner/security': () => import('@/pages/OwnerSecurity'),
  '/owner/clients/property': () => import('@/pages/OwnerPropertyClientDiscovery'),
  '/owner/clients/moto': () => import('@/pages/OwnerMotoClientDiscovery'),
  '/owner/clients/bicycle': () => import('@/pages/OwnerBicycleClientDiscovery'),
  // Shared routes
  '/messages': () => import('@/pages/MessagingDashboard').then(m => ({ default: m.MessagingDashboard })),
  '/notifications': () => import('@/pages/NotificationsPage'),
  '/subscription-packages': () => import('@/pages/SubscriptionPackagesPage'),
};

// Cache for prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Safe requestIdleCallback with fallback - LONG delay to avoid blocking
 */
const scheduleIdle = (callback: () => void, timeout = 5000): void => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout });
  } else {
    // Fallback for Safari - use longer delay to not block main thread
    setTimeout(callback, 300);
  }
};

/**
 * Prefetch a single route - always non-blocking
 */
export function prefetchRoute(path: string): Promise<void> {
  if (prefetchedRoutes.has(path)) return Promise.resolve();

  const routeImport = routeImports[path];
  if (!routeImport) return Promise.resolve();

  prefetchedRoutes.add(path);

  return routeImport()
    .then(() => {})
    .catch(() => {
      prefetchedRoutes.delete(path);
    });
}

/**
 * Prefetch routes ONE AT A TIME with idle scheduling between each
 * This prevents main thread blocking on mobile
 */
function prefetchRoutesSequentially(routes: string[]): void {
  let index = 0;
  
  const prefetchNext = () => {
    if (index >= routes.length) return;
    
    const route = routes[index];
    index++;
    
    prefetchRoute(route).finally(() => {
      // Schedule next prefetch only after current one completes
      if (index < routes.length) {
        scheduleIdle(prefetchNext, 3000);
      }
    });
  };
  
  // Start the first one
  if (routes.length > 0) {
    prefetchNext();
  }
}

/**
 * SPEED OF LIGHT: Prefetch routes based on user role
 * Only prefetch 1-2 critical routes, use long idle delays
 */
export function prefetchRoleRoutes(role: 'client' | 'owner'): void {
  // Wait for complete idle before even starting - never compete with first paint
  scheduleIdle(() => {
    if (role === 'client') {
      // Only the single most likely next route first
      prefetchRoute('/messages');
      
      // Secondary routes - much later, one at a time
      scheduleIdle(() => {
        prefetchRoutesSequentially([
          '/client/liked-properties',
          '/notifications',
        ]);
      }, 5000);
    } else {
      // Only the single most likely next route first
      prefetchRoute('/messages');
      
      // Secondary routes - much later, one at a time
      scheduleIdle(() => {
        prefetchRoutesSequentially([
          '/owner/properties',
          '/notifications',
        ]);
      }, 5000);
    }
  }, 2000); // 2 second delay to ensure first paint is complete
}

/**
 * Create hover prefetch handler - DESKTOP ONLY
 * onTouchStart is REMOVED - mobile taps must be pure navigation
 * Prefetching on tap causes delay and blocks the main thread
 */
export function createHoverPrefetch(path: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
    // NO onTouchStart - mobile navigation must be instant
  };
}

/**
 * Prefetch critical routes - DISABLED by default
 * Only call this explicitly when needed, not on app load
 */
export function prefetchCriticalRoutes(): void {
  // Do nothing on app load - let role-based prefetching handle it
  // This prevents blocking the main thread during initial render
}

/**
 * Link prefetch observer - prefetches routes when links enter viewport
 */
export function createLinkObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined') return null;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.getAttribute('href');
          if (href && href.startsWith('/')) {
            // Use idle callback for viewport prefetching too
            scheduleIdle(() => prefetchRoute(href), 1000);
          }
        }
      });
    },
    {
      rootMargin: '100px', // Reduced from 200px
      threshold: 0,
    }
  );
}

/**
 * Prefetch next likely route based on current location
 * Uses requestIdleCallback to never block
 */
export function prefetchNextLikelyRoute(currentPath: string): void {
  scheduleIdle(() => {
    const nextRouteMap: Record<string, string[]> = {
      '/client/dashboard': ['/messages'],
      '/owner/dashboard': ['/messages'],
      '/owner/properties': ['/owner/listings/new'],
    };

    const nextRoutes = nextRouteMap[currentPath];
    if (nextRoutes && nextRoutes.length > 0) {
      // Only prefetch one route at a time
      prefetchRoute(nextRoutes[0]);
    }
  }, 1000);
}

/**
 * Check if a route is already prefetched
 */
export function isRoutePrefetched(path: string): boolean {
  return prefetchedRoutes.has(path);
}
