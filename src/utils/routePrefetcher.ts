/**
 * Speed of Light Route Prefetcher - v2 "Network Aware"
 * Optimized for instant navigation WITHOUT blocking first render
 * 
 * Key optimizations:
 * - Detects connection speed (4G vs 3G vs Data Saver)
 * - Becomes 3x MORE aggressive on high-speed networks
 * - Uses requestIdleCallback for background loading
 * - Pre-loads common paths for both modes once the app settles
 */
import React from 'react';

type RouteImport = () => Promise<{ default: React.ComponentType<any> }>;

/**
 * SPEED: Aggressive network-aware prefetching
 * Skips prefetching on slow connections or data saver mode
 */
function shouldSkipPrefetch(): boolean {
  if (typeof navigator === 'undefined') return true;
  
  // Skip if data saver is on
  if ((navigator as any).connection?.saveData) return true;
  
  // Skip if on 2G or slow 3G
  const connection = (navigator as any).connection;
  if (connection && (connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g')) {
    return true;
  }
  
  return false;
}

/**
 * Calculate optimized timeout based on network
 */
const optimizedTimeout = (function() {
  if (typeof navigator === 'undefined') return 1000;
  const connection = (navigator as any).connection;
  if (connection?.effectiveType === '4g') return 200; // Super aggressive on 4G
  return 1000;
})();

// Route mapping for prefetching - ALL app routes
const routeImports: Record<string, RouteImport> = {
  // Client routes
  '/client/dashboard': () => import('@/pages/ClientDashboard'),
  '/client/profile': () => import('@/pages/ClientProfile'),
  '/client/settings': () => import('@/pages/ClientSettings'),
  '/client/contracts': () => import('@/pages/ClientContracts'),
  '/client/services': () => import('@/pages/ClientWorkerDiscovery'),
  '/client/saved-searches': () => import('@/pages/ClientSavedSearches'),
  '/client/security': () => import('@/pages/ClientSecurity'),
  // Owner routes
  '/owner/dashboard': () => import('@/components/EnhancedOwnerDashboard'),
  '/owner/profile': () => import('@/pages/OwnerProfile'),
  '/owner/settings': () => import('@/pages/OwnerSettings'),
  '/owner/properties': () => import('@/pages/OwnerProperties'),
  '/owner/listings/new': () => import('@/pages/OwnerNewListing'),
  '/owner/liked-clients': () => import('@/pages/OwnerLikedClients'),
  '/owner/contracts': () => import('@/pages/OwnerContracts'),
  '/owner/saved-searches': () => import('@/pages/OwnerSavedSearches'),
  '/owner/security': () => import('@/pages/OwnerSecurity'),
  // Shared routes
  '/messages': () => import('@/pages/MessagingDashboard').then(m => ({ default: m.MessagingDashboard })),
  '/notifications': () => import('@/pages/NotificationsPage'),
  '/subscription-packages': () => import('@/pages/SubscriptionPackagesPage'),
  '/explore/eventos': () => import('@/pages/EventosFeed'),
  '/explore/roommates': () => import('@/pages/RoommateMatching'),
  '/client/advertise': () => import('@/pages/AdvertisePage'),
  '/explore/prices': () => import('@/pages/PriceTracker'),
  '/explore/intel': () => import('@/pages/LocalIntel'),
  '/explore/tours': () => import('@/pages/VideoTours'),
  // Filter routes
  '/client/filters': () => import('@/pages/ClientFilters'),
};

// Cache for prefetched routes
const prefetchedRoutes = new Set<string>();

/**
 * Safe requestIdleCallback with fallback — shorter timeout for speed
 */
const scheduleIdle = (callback: () => void): void => {
  if (typeof requestIdleCallback !== 'undefined') {
    requestIdleCallback(callback, { timeout: optimizedTimeout });
  } else {
    // Fallback for Safari - use shorter delay for snappier navigation
    setTimeout(callback, 50);
  }
};

/**
 * Prefetch a single route - always non-blocking
 */
export function prefetchRoute(path: string): Promise<void> {
  if (shouldSkipPrefetch()) return Promise.resolve();
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
  if (shouldSkipPrefetch()) return;
  
  let index = 0;
  const prefetchNext = () => {
    if (index >= routes.length) return;
    
    const route = routes[index];
    index++;
    
    prefetchRoute(route).finally(() => {
      // Schedule next prefetch only after current one completes
      if (index < routes.length) {
        scheduleIdle(prefetchNext);
      }
    });
  };
  
  if (routes.length > 0) {
    prefetchNext();
  }
}

/**
 * SPEED OF LIGHT: Prefetch routes based on user role
 * Accelerates to nearly instant prefetching on 4G/WiFi
 */
export function prefetchRoleRoutes(role: 'client' | 'owner'): void {
  if (shouldSkipPrefetch()) return;

  // SPEED: Prefetch nav-bar routes immediately — these are the most tapped
  const sharedRoutes = ['/messages', '/notifications', '/explore/eventos'];
  
  if (role === 'client') {
    const critical = ['/client/profile', ...sharedRoutes];
    critical.forEach(p => prefetchRoute(p).catch(() => {}));
    
    // Everything else — sequential background prefetch (start fast)
    scheduleIdle(() => {
      const remaining = [
        '/client/filters',
        '/client/advertise',
        '/explore/roommates',
        '/client/settings',
        '/client/services',
        '/client/contracts',
        '/client/saved-searches',
        '/client/security',
        '/explore/prices',
        '/explore/intel',
        '/explore/tours'
      ];
      prefetchRoutesSequentially(remaining);
    });
  } else {
    const critical = ['/owner/profile', '/owner/properties', ...sharedRoutes];
    critical.forEach(p => prefetchRoute(p).catch(() => {}));

    // Everything else — sequential background prefetch (start fast)
    scheduleIdle(() => {
      const remaining = [
        '/owner/liked-clients',
        '/owner/settings',
        '/owner/listings/new',
        '/owner/contracts',
        '/owner/saved-searches',
        '/owner/security',
      ];
      prefetchRoutesSequentially(remaining);
    });
  }
}

/**
 * Create hover prefetch handler - DESKTOP ONLY
 */
export function createHoverPrefetch(path: string): {
  onMouseEnter: () => void;
  onFocus: () => void;
} {
  return {
    onMouseEnter: () => prefetchRoute(path),
    onFocus: () => prefetchRoute(path),
  };
}

/**
 * Prefetch critical routes manually
 */
export function prefetchCriticalRoutes(): void {
  // Only prefetch the absolute essentials if called explicitly
  ['/messages', '/notifications'].forEach(p => prefetchRoute(p));
}

/**
 * Link prefetch observer - prefetches routes when links enter viewport
 */
export function createLinkObserver(): IntersectionObserver | null {
  if (typeof IntersectionObserver === 'undefined' || shouldSkipPrefetch()) return null;

  return new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const link = entry.target as HTMLAnchorElement;
          const href = link.getAttribute('href');
          if (href && href.startsWith('/') && !prefetchedRoutes.has(href)) {
            scheduleIdle(() => prefetchRoute(href));
          }
        }
      });
    },
    {
      rootMargin: '150px', // Range increased for faster scrolling
      threshold: 0,
    }
  );
}

/**
 * Prefetch next likely route based on current location
 */
export function prefetchNextLikelyRoute(currentPath: string): void {
  const nextRouteMap: Record<string, string[]> = {
    '/client/dashboard': ['/messages', '/explore/eventos'],
    '/owner/dashboard': ['/messages', '/owner/properties'],
    '/owner/properties': ['/owner/listings/new'],
  };

  const nextRoutes = nextRouteMap[currentPath];
  if (nextRoutes) {
    scheduleIdle(() => {
      nextRoutes.forEach(p => prefetchRoute(p));
    });
  }
}

export function isRoutePrefetched(path: string): boolean {
  return prefetchedRoutes.has(path);
}
