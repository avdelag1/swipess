import { useEffect, memo } from 'react';
import { POKER_CARD_PHOTOS } from '@/components/swipe/SwipeConstants';
import { prefetchRoute } from '@/utils/routePrefetcher';

/**
 * ⚡ SPEED OF LIGHT PRELOADER
 * 
 * This component runs in the background at the top level of the app.
 * It pre-decodes critical images and pre-warms routes to ensure 
 * zero-latency interactions.
 */
export const SpeedOfLightPreloader = memo(() => {
  useEffect(() => {
    // 1. Initialize Global Cache Map
    (window as any).__swipess_cache = (window as any).__swipess_cache || {};

    // 2. Pre-decode Filter Photos (Main Performance Culprit)
    const criticalPhotos = Object.values(POKER_CARD_PHOTOS);
    
    // Process in small batches to not block the main thread initially
    const prewarmPhotos = async () => {
      for (const src of criticalPhotos) {
        if (!src || (window as any).__swipess_cache[src]) continue;
        
        try {
          const img = new Image();
          img.src = src;
          // GPU Decode: This happens off-thread
          await img.decode();
          (window as any).__swipess_cache[src] = true;
          console.log(`[SpeedOfLight] Pre-warmed: ${src}`);
        } catch (e) {
          // Fallback or ignore
        }
      }
    };

    // 3. Pre-warm Critical Routes
    const warmRoutes = () => {
      const routes = [
        '/client/dashboard',
        '/owner/dashboard',
        '/messages',
        '/explore/eventos'
      ];
      routes.forEach(route => prefetchRoute(route));
    };

    // Execute after initial paint
    const timer = setTimeout(() => {
      prewarmPhotos();
      warmRoutes();
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  return null;
});

SpeedOfLightPreloader.displayName = 'SpeedOfLightPreloader';
