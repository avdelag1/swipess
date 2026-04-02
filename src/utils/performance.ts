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

  // 1. Prefetch Smart Listings (The actual discovery engine)
  // We prefetch for the 'all' category first as it's the default landing
  const defaultFilters = JSON.stringify({ category: 'all' });
  
  queryClient.prefetchQuery({
    queryKey: ['smart-listings', userId, defaultFilters, 0, false],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('get_smart_listings', {
        p_user_id: userId,
        p_category: null,
        p_limit: 10,
        p_offset: 0
      });
      
      const listings = data as any[];
      if (listings && listings.length > 0) {
        // MAGIC: Prefetch the first 5 images to browser cache immediately
        listings.slice(0, 5).forEach((item: any) => {
          const imgUrl = item.images?.[0] || item.image_url;
          if (imgUrl) prefetchImage(imgUrl, true);
        });
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // 2. Prefetch Events (Universal)
  queryClient.prefetchQuery({
    queryKey: ['eventos', 'v4'],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, description, category, image_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text')
        .order('event_date', { ascending: true })
        .limit(30);
      
      if (data && data.length > 0) {
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
 */
export async function predictivePrefetchCategory(queryClient: QueryClient, userId: string | undefined, category: string) {
  if (!category || !userId) return;
  
  const filters = JSON.stringify({ category });
  
  queryClient.prefetchQuery({
    queryKey: ['smart-listings', userId, filters, 0, false],
    queryFn: async () => {
      const { data } = await (supabase as any).rpc('get_smart_listings', {
        p_user_id: userId,
        p_category: category === 'all' ? null : category,
        p_limit: 10,
        p_offset: 0
      });
      
      const listings = data as any[];
      if (listings && listings.length > 0) {
        listings.slice(0, 2).forEach((item: any) => {
          const imgUrl = item.images?.[0] || item.image_url;
          if (imgUrl) prefetchImage(imgUrl, true);
        });
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 15, // 15 minutes
  });
}

export async function predictivePrefetchEvent(queryClient: QueryClient, eventId: string) {
  if (!eventId) return;
  
  queryClient.prefetchQuery({
    queryKey: ['evento', eventId],
    queryFn: async () => {
      const { data } = await supabase
        .from('events')
        .select('id, title, description, category, image_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text')
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
  
  // Skip if already prefetched in this session
  if (!(window as any).__PREFETCHED_IMAGES__) (window as any).__PREFETCHED_IMAGES__ = new Set();
  if ((window as any).__PREFETCHED_IMAGES__.has(url)) return;
  (window as any).__PREFETCHED_IMAGES__.add(url);

  const img = new Image();
  if (highPriority) {
    (img as any).fetchPriority = 'high';
  }
  img.decoding = 'async';
  
  // Pre-decode to avoid frame-drop when it finally mounts
  img.onload = () => {
    if ('decode' in img) {
      img.decode().catch(() => {});
    }
  };
  
  img.src = url;
}

