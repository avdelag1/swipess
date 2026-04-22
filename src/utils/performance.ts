import { QueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { getNetworkProfile } from "@/utils/networkAware";

/**
 * SPEED OF LIGHT Performance Utility
 * Network-aware prefetching and resource warming.
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
 * WARM DISCOVERY CACHE — network-aware
 * Scales image prefetch count based on connection quality.
 */
export async function warmDiscoveryCache(queryClient: QueryClient, userId: string | undefined, _userRole: 'client' | 'owner') {
  if (!userId) return;

  const netProfile = getNetworkProfile();
  const imagePrefetchCount = Math.min(5, netProfile.prefetchDepth);

  // 1. Prefetch Smart Listings
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
        listings.slice(0, imagePrefetchCount).forEach((item: any) => {
          const imgUrl = item.images?.[0] || item.image_url;
          if (imgUrl) prefetchImage(imgUrl, true);
        });
      }
      return data || [];
    },
    staleTime: 1000 * 60 * 30,
  });

  // 2. Prefetch Events — skip on slow connections
  if (netProfile.prefetchDepth >= 2) {
    queryClient.prefetchQuery({
      queryKey: ['eventos', 'v4'],
      queryFn: async () => {
        const { data } = await supabase
          .from('events')
          .select('id, title, description, category, image_url, event_date, location, location_detail, organizer_name, organizer_whatsapp, promo_text, discount_tag, is_free, price_text')
          .order('event_date', { ascending: true })
          .limit(30);
        
        if (data && data.length > 0) {
          const eventImgCount = Math.min(imagePrefetchCount, 3);
          data.slice(0, eventImgCount).forEach((item: any) => {
            if (item.image_url) prefetchImage(item.image_url);
          });
        }
        return data || [];
      },
      staleTime: 1000 * 60 * 60,
    });
  }

  // 3. Prefetch User Profile (always — tiny payload)
  queryClient.prefetchQuery({
    queryKey: ['profile', userId],
    queryFn: async () => {
      const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
      return data;
    },
    staleTime: 1000 * 60 * 60 * 24,
  });
}

/**
 * PREDICTIVE PREFETCH: Intent-Based Warming
 */
export async function predictivePrefetchCategory(queryClient: QueryClient, userId: string | undefined, category: string) {
  if (!category || !userId) return;
  
  const netProfile = getNetworkProfile();
  // Skip predictive prefetch on very slow connections
  if (netProfile.prefetchDepth < 2) return;

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
    staleTime: 1000 * 60 * 15,
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
 * Network-aware: skips pre-decode on slow connections.
 */
export function prefetchImage(url: string, highPriority: boolean = false) {
  if (!url || typeof window === 'undefined') return;
  
  if (!(window as any).__PREFETCHED_IMAGES__) (window as any).__PREFETCHED_IMAGES__ = new Set();
  if ((window as any).__PREFETCHED_IMAGES__.has(url)) return;
  (window as any).__PREFETCHED_IMAGES__.add(url);

  const netProfile = getNetworkProfile();
  const img = new Image();
  
  if (highPriority) {
    (img as any).fetchPriority = 'high';
  }
  
  // ⚡ SPEED OF LIGHT: Start decoding IMMEDIATELY if the connection is strong
  img.decoding = 'async';
  
  img.onload = () => {
    // Only pre-decode on good connections to save CPU/battery
    if (netProfile.enablePreDecode && 'decode' in img) {
      img.decode().catch(() => {});
    }
  };
  
  img.src = url;
}

/**
 * ⚡ INSTANT FEED: Pre-warms the next items in a list
 * Uses IntersectionObserver to predict scrolling intent.
 */
export function prefetchNextBatch(queryClient: QueryClient, items: any[], currentIndex: number) {
  const nextItems = items.slice(currentIndex + 1, currentIndex + 4);
  nextItems.forEach(item => {
    const url = item.image_url || item.images?.[0];
    if (url) prefetchImage(url, false);
  });
}


