import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * SPEED OF LIGHT Performance Utility
 * Handles aggressive prefetching and resource warming to ensure the app
 * feels like all data is "already there".
 */

export function logBundleSize() {
  if (import.meta.env.DEV) {
    console.log('[Performance] Bundle loaded');
    if (typeof window !== 'undefined' && window.performance) {
      const timing = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      if (timing) {
        console.log('[Performance] DOM Content Loaded:', timing.domContentLoadedEventEnd - timing.startTime, 'ms');
      }
    }
  }
}

/**
 * WARM DISCOVERY CACHE
 * Aggressively prefetches the core discovery feeds for the current user role.
 * Targeted at making the main swipe-up experience instant.
 */
export async function warmDiscoveryCache(queryClient: QueryClient, userId: string | undefined, userRole: 'client' | 'owner') {
  if (!userId) return;

  // 1. Prefetch Main Listing Categories (Client) or Discovery Targets (Owner)
  if (userRole === 'client') {
    // Prefetch properties, vehicles, etc.
    const categories = ['property', 'moto', 'bicycle', 'worker'];
    
    categories.forEach(category => {
      queryClient.prefetchQuery({
        queryKey: ['listings', category],
        queryFn: async () => {
          const { data } = await supabase
            .from('listings')
            .select('*')
            .eq('category', category)
            .eq('status', 'active')
            .limit(20);
          
          if (data && data.length > 0) {
            // MAGIC: Prefetch the first few images to browser cache immediately
            data.slice(0, 5).forEach((item: any) => {
              if (item.image_url) prefetchImage(item.image_url);
              if (Array.isArray(item.image_urls)) {
                item.image_urls.slice(0, 2).forEach((url: any) => prefetchImage(typeof url === 'string' ? url : url.url));
              }
            });
          }
          return data || [];
        },
        staleTime: 1000 * 60 * 60, // 1 hour
      });

      // Also prefetch the first few images of each category to prime the browser cache
      // This is the "magic" step for "instant" images
    });
  }

  // 2. Prefetch Events (Universal)
  queryClient.prefetchQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .order('event_date', { ascending: true })
        .limit(30);
      
      if (data && data.length > 0) {
        // MAGIC: Prefetch the first few event images
        data.slice(0, 5).forEach((item: any) => {
          if (item.image_url) prefetchImage(item.image_url);
        });
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 60,
  });

  // 3. Prefetch User Profile
  queryClient.prefetchQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24, // 1 Day
  });
}

/**
 * PREDICTIVE PREFETCH: Intent-Based Warming
 * Called when a user hovers or starts a touch on a button/link.
 * Gives us a 100-300ms head start to fetch data before the actual click.
 */
export async function predictivePrefetchCategory(queryClient: QueryClient, category: string) {
  if (!category) return;
  
  queryClient.prefetchQuery({
    queryKey: ['listings', category],
    queryFn: async () => {
      const { data } = await supabase
        .from('listings')
        .select('*')
        .eq('category', category)
        .eq('status', 'active')
        .limit(20);
      
      if (data && data.length > 0) {
        data.slice(0, 3).forEach((item: any) => {
          if (item.image_url) prefetchImage(item.image_url, true);
        });
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

export async function predictivePrefetchEvent(queryClient: QueryClient, eventId: string) {
  if (!eventId) return;
  
  queryClient.prefetchQuery({
    queryKey: ['evento', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();
      
      if (data?.image_url) prefetchImage(data.image_url, true);
      return data;
    },
    staleTime: 1000 * 60 * 60,
  });
}

/**
 * UTILITY: Prefetch image into browser memory
 * Upgraded with high priority and decoding for "instant" appearance
 */
export function prefetchImage(url: string, highPriority: boolean = false) {
  if (!url || typeof window === 'undefined') return;
  
  const img = new Image();
  if (highPriority) {
    (img as any).fetchPriority = 'high';
  }
  img.decoding = 'async';
  
  // Also try to pre-decode it to avoid first-frame flash
  img.onload = () => {
    if ('decode' in img) {
      img.decode().catch(() => {});
    }
  };
  
  img.src = url;
}
