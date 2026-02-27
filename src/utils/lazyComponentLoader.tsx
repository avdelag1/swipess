/**
 * Lazy Component Loader Utility
 * Provides optimized lazy loading for heavy components and libraries
 * Reduces initial bundle size by deferring non-critical components
 */

import { lazy, Suspense, ReactNode, ComponentType, LazyExoticComponent } from 'react';
import { logger } from '@/utils/prodLogger';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyProps = any;

/**
 * Create a lazy-loaded component with a fallback
 * @param importFn - The dynamic import function
 * @param fallback - Optional loading fallback component
 */
export function createLazyComponent(
  importFn: () => Promise<{ default: ComponentType<AnyProps> }>,
  fallback?: ReactNode
): {
  Component: LazyExoticComponent<ComponentType<AnyProps>>;
  Wrapper: ComponentType<AnyProps>;
} {
  const Component = lazy(importFn);

  function Wrapper(props: AnyProps) {
    return (
      <Suspense fallback={fallback || null}>
        <Component {...props} />
      </Suspense>
    );
  }

  return {
    Component,
    Wrapper,
  };
}

/**
 * Preload a lazy component to avoid waterfall requests
 */
export function preloadComponent(
  importFn: () => Promise<unknown>
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFn().catch((error) => {
        logger.debug('[LazyLoader] Preload failed (non-blocking)', {
          error: error instanceof Error ? error.message : 'Unknown',
          context: 'component preload'
        });
      });
    });
  } else {
    setTimeout(() => {
      importFn().catch((error) => {
        logger.debug('[LazyLoader] Preload failed (non-blocking)', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
      });
    }, 2000);
  }
}

/**
 * Preload multiple components during idle time
 */
export function preloadComponents(
  importFns: Array<() => Promise<unknown>>
): void {
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => {
      importFns.forEach(importFn => {
        importFn().catch((error) => {
          logger.debug('[LazyLoader] Batch preload failed', {
            error: error instanceof Error ? error.message : 'Unknown'
          });
        });
      });
    });
  } else {
    setTimeout(() => {
      importFns.forEach(importFn => {
        importFn().catch((error) => {
          logger.debug('[LazyLoader] Batch preload failed', {
            error: error instanceof Error ? error.message : 'Unknown'
          });
        });
      });
    }, 2000);
  }
}

/**
 * Intersection Observer-based lazy loading for route preloading
 * Preload components when user hovers over navigation links
 */
export function createHoverPreloader(
  importFn: () => Promise<unknown>
): () => void {
  let preloaded = false;

  return () => {
    if (!preloaded) {
      preloaded = true;
      importFn().catch((error) => {
        logger.debug('[LazyLoader] Hover preload failed', {
          error: error instanceof Error ? error.message : 'Unknown'
        });
      });
    }
  };
}

/**
 * Lazy load library-heavy components only when needed
 * Reduces main bundle by deferring Recharts, Embla, date-fns, etc.
 */
export const lazyLoadedComponents = {
  // Charts - only load when Dashboard is accessed
  EnhancedOwnerDashboard: lazy(() =>
    import('../components/EnhancedOwnerDashboard')
  ),

  // Date-based components - only load when needed
  ClientSavedSearches: lazy(() =>
    import('../pages/ClientSavedSearches')
  ),

  // Carousel-heavy components
  OwnerNewListing: lazy(() =>
    import('../pages/OwnerNewListing')
  ),
};

export default {
  createLazyComponent,
  preloadComponent,
  preloadComponents,
  createHoverPreloader,
  lazyLoadedComponents,
};