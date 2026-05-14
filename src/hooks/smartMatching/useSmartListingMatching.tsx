import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import type { ListingFilters } from './types';
import { calculateListingMatch } from './matchCalculators';
import { pwaImagePreloader, getCardImageUrl } from '@/utils/imageOptimization';
import { runIdleTask } from '@/lib/utils';
import { useAdminUserIds } from '../useAdminUserIds';
import { SWIPE_CARD_FIELDS } from './swipeCardFields';

import { SWIPE_CARD_FIELDS } from './swipeCardFields';

// Demos disabled — show real user listings only.
const DEMO_LISTINGS: any[] = [];
const _DEPRECATED_DEMO_LISTINGS: any[] = [
  {
    id: 'demo-property-1-disabled',
    title: 'Ultra-Modern Tulum Penthouse',
    description: 'Breathtaking jungle-and-sea energy with private rooftop water, soft stone interiors, and a cinematic indoor-outdoor layout.',
    price: 4500, currency: 'USD',
    images: [
      '/images/filters/property_jungle_villa.jpg',
      '/images/filters/property_bamboo_dome.jpg',
      '/images/filters/property_loft_interior.jpg'
    ],
    city: 'Tulum', neighborhood: 'Aldea Zamá',
    category: 'property', listing_type: 'rent', property_type: 'penthouse',
    beds: 3, baths: 4, square_footage: 2800,
    latitude: 20.2384, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-property-2',
    title: 'Canggu Surf Loft',
    description: 'Warm concrete loft minutes from the beach, with quiet work corners, filtered light, and a social rooftop for sunset dinners.',
    price: 2800, currency: 'USD',
    images: [
      '/images/filters/property_loft_interior.jpg',
      '/images/filters/property_jungle_villa.jpg',
      '/images/filters/property_bamboo_dome.jpg'
    ],
    city: 'Canggu', neighborhood: 'Batu Bolong',
    category: 'property', listing_type: 'rent', property_type: 'loft',
    beds: 2, baths: 2, square_footage: 1450,
    latitude: 20.2114, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-property-3',
    title: 'Brickell Sky Condo Miami',
    description: 'Glassline high-rise condo with bay views, concierge service, gym, pool deck, and polished city luxury.',
    price: 5200, currency: 'USD',
    images: [
      '/images/filters/property_bamboo_dome.jpg',
      '/images/filters/property_loft_interior.jpg',
      '/images/filters/property_jungle_villa.jpg'
    ],
    city: 'Miami', neighborhood: 'Brickell',
    category: 'property', listing_type: 'rent', property_type: 'condo',
    beds: 2, baths: 2, square_footage: 1700,
    latitude: 20.2454, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── MOTORCYCLE (3 cards, 3 photos each) ────────────────────────────────
  {
    id: 'demo-motorcycle-1',
    title: 'Ducati Panigale V4',
    description: 'Pristine Italian superbike with carbon details, low mileage, and a clean service history.',
    price: 24000, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Miami', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Ducati', vehicle_model: 'Panigale V4', year: 2023, mileage: 1200,
    latitude: 20.2834, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-motorcycle-2',
    title: 'Royal Enfield Himalayan',
    description: 'Adventure-ready, luggage fitted, and built for coastal roads, jungle turns, and long weekend escapes.',
    price: 6800, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1517846693594-1567da72af75?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1524591652733-73fa1ae7b5ee?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Tulum', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Royal Enfield', vehicle_model: 'Himalayan', year: 2022, mileage: 4100,
    latitude: 20.2114, longitude: -87.3764,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-motorcycle-3',
    title: 'Vespa GTS 300 Roma',
    description: 'Elegant city scooter with polished chrome, leather seat, and effortless parking for beach-town living.',
    price: 7900, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1591637333184-19aa84b3e01f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1508357941501-0924cf312bbd?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558980664-10e7170b5df9?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Rome', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Vespa', vehicle_model: 'GTS 300', year: 2021, mileage: 2600,
    latitude: 20.1474, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── BICYCLE (3 cards, 3 photos each) ──────────────────────────────────
  {
    id: 'demo-bicycle-1',
    title: 'VanMoof S5 Electric',
    description: 'Integrated lights, anti-theft tech, silent power assist, and a clean city profile.',
    price: 3500, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1494976388531-d1058494cdd8?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Amsterdam', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'electric', electric_assist: true, battery_range: 80,
    latitude: 20.2114, longitude: -87.3764,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-bicycle-2',
    title: 'Specialized S-Works Tarmac',
    description: 'Featherlight carbon frame, race geometry, and crisp electronic shifting for fast coastal rides.',
    price: 12000, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1511994298241-608e28f14fde?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1502744688674-c619d1586c9e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1507035895480-2b3156c31fc8?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Barcelona', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'road', frame_material: 'carbon', number_of_gears: 22,
    latitude: 19.8114, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-bicycle-3',
    title: 'Cannondale Topstone Gravel',
    description: 'Comfortable gravel frame with wide tires, bikepacking mounts, and a smooth all-road feel.',
    price: 2800, currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1525109620301-7a4c0f6055d2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1532298229144-0ec0c57515c7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1575585269294-7d28dd912db8?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Milan', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'gravel', frame_material: 'aluminum', number_of_gears: 20,
    latitude: 20.2454, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── WORKERS / SERVICES ───────────────────────
  {
    id: 'demo-worker-2',
    title: 'Matias — Argentine Private Chef',
    description: 'Villa dinners, fire-grill menus, clean sourcing, and elegant service for private events.',
    price: 95, pricing_unit: 'hour', currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1577219491135-ce391730fb2c?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1556910103-1c02745aae4d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1551218808-94e220e084d2?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Miami', category: 'worker',
    service_category: 'Private Chef', experience_years: 9, experience_level: 'expert',
    latitude: 20.2454, longitude: -87.4654,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-worker-3',
    title: 'Lucia — Brazilian Fitness Coach',
    description: 'Beach strength sessions, mobility work, nutrition planning, and high-energy wellness coaching.',
    price: 70, pricing_unit: 'hour', currency: 'USD',
    images: [
      'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1518611012118-696072aa579a?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1518310383802-640c2de311b2?auto=format&fit=crop&q=80&w=1200'
    ],
    city: 'Canggu', category: 'worker',
    service_category: 'Personal Training', experience_years: 6, experience_level: 'intermediate',
    latitude: 20.2214, longitude: -87.4754,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-worker-4',
    title: 'Camila — Jungle Massage Therapist',
    description: 'Deep-tissue and lomi-lomi sessions in the Tulum jungle, oils sourced locally, table set among the palms for full sensory immersion.',
    price: 120, pricing_unit: 'hour', currency: 'USD',
    images: [
      '/images/listings/massage_jungle_wide.jpg',
      '/images/listings/massage_jungle_close.jpg'
    ],
    city: 'Tulum', category: 'worker',
    service_category: 'Massage Therapy', experience_years: 8, experience_level: 'expert',
    latitude: 20.2154, longitude: -87.4694,
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
];

export function useSmartListingMatching(
    userId: string | undefined,
    _excludeSwipedIds: string[] = [],
    filters?: ListingFilters,
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false
) {
    const queryClient = useQueryClient();
    const { data: adminIds } = useAdminUserIds();

    const isSeedListing = useMemo(() => (listing: any) => {
        const owner = listing?.owner_id || listing?.user_id;
        return owner === '00000000-0000-0000-0000-000000000000'
            || owner === '00000000-0000-0000-0000-000000000001'
            || owner === '7c51f110-6261-44d8-b9d0-d4ccd2d901b6'
            || listing?.isDemo === true;
    }, []);

    // 🚀 SPEED OF LIGHT: Cache user swipes globally to avoid repeated fetching
    const { data: userSwipes } = useQuery({
        queryKey: ['user-swipes', userId],
        queryFn: async () => {
            if (!userId) return { liked: new Set<string>(), left: new Map<string, string>(), strikes: new Map<string, { count: number, lastAt: string }>() };
            
            // Fetch likes
            const { data: likes, error: likesError } = await supabase
                .from('likes')
                .select('target_id, direction, created_at')
                .eq('user_id', userId)
                .eq('target_type', 'listing');
            
            if (likesError) throw likesError;

            // Fetch strikes (profile_views)
            const { data: views, error: viewsError } = await supabase
                .from('profile_views')
                .select('viewed_profile_id, action, created_at')
                .eq('user_id', userId)
                .eq('view_type', 'listing');
            
            if (viewsError && viewsError.code !== '42P01') throw viewsError;
            
            const liked = new Set<string>();
            const left = new Map<string, string>();
            const strikes = new Map<string, { count: number, lastAt: string }>();

            likes?.forEach(s => {
                if (s.direction === 'right') liked.add(s.target_id);
                else left.set(s.target_id, s.created_at);
            });

            views?.forEach(v => {
                if (v.action.startsWith('pass:')) {
                    const count = parseInt(v.action.split(':')[1]) || 1;
                    strikes.set(v.viewed_profile_id, { count, lastAt: v.created_at });
                }
            });

            return { liked, left, strikes };
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000, // 5 minutes cache
    });

    // 📡 REAL-TIME SYNC: Invalidate listing cache when new items are added
    // Throttle to prevent hammer-looping if multiple listings are added quickly
    const lastInvalidateRef = useRef<number>(0);
    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel(`smart-listings-sync-${userId}`)
            .on('postgres_changes', { 
                event: 'INSERT', 
                schema: 'public', 
                table: 'listings' 
            }, (payload) => {
                const now = Date.now();
                if (now - lastInvalidateRef.current < 10000) return; // 10s cooldown
                lastInvalidateRef.current = now;
                
                logger.info('[SmartMatching] New listing detected, refreshing cache...');
                queryClient.invalidateQueries({ queryKey: ['smart-listings'] });
            })
            .subscribe();
        return () => { channel.unsubscribe(); };
    }, [userId, queryClient]);

    const filtersKey = useMemo(() => {
        try {
            return JSON.stringify(filters || {});
        } catch {
            return 'invalid-filters';
        }
    }, [filters]);

    // STABILITY FIX: Detect if filters changed but the reference stayed the same (or vice versa)
    const prevFiltersKeyRef = useRef(filtersKey);
    const prevUserIdRef = useRef(userId);
    const prevIsRefreshModeRef = useRef(isRefreshMode);

    if (filtersKey !== prevFiltersKeyRef.current || userId !== prevUserIdRef.current || isRefreshMode !== prevIsRefreshModeRef.current) {
        logger.info('[useSmartListingMatching] Refetch Trigger Detected:', {
            filtersChanged: filtersKey !== prevFiltersKeyRef.current,
            userChanged: userId !== prevUserIdRef.current,
            refreshModeChanged: isRefreshMode !== prevIsRefreshModeRef.current,
            page
        });
        prevFiltersKeyRef.current = filtersKey;
        prevUserIdRef.current = userId;
        prevIsRefreshModeRef.current = isRefreshMode;
    }

    const queryKey = useMemo(() => [
        'smart-listings', 
        userId, 
        filtersKey, 
        page, 
        pageSize,
        isRefreshMode
    ], [userId, filtersKey, page, pageSize, isRefreshMode]);

    return useQuery({
        queryKey: queryKey,
        staleTime: 2 * 60 * 1000, // 2 minutes
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [];

            try {
                // 1. Prepare exclusion list from cache (if available)
                const swipedListingIds = new Set<string>();
                if (userSwipes) {
                  // 1. Always exclude liked items
                  userSwipes.liked.forEach(id => swipedListingIds.add(id));
                  
                  // 2. Apply 3-strike progressive exclusion for dislikes
                  userSwipes.left.forEach((createdAt, id) => {
                    const strike = userSwipes.strikes.get(id);
                    const strikeCount = strike?.count || 1;
                    
                    let timeoutDays = 3;
                    if (strikeCount === 2) timeoutDays = 7;
                    if (strikeCount >= 3) timeoutDays = 36500; // 100 years = forever

                    const timeoutMs = timeoutDays * 24 * 60 * 60 * 1000;
                    const isTimedOut = new Date(createdAt).getTime() + timeoutMs > Date.now();
                    
                    // If refresh mode is ON, we only exclude "forever" items (strike 3)
                    // If refresh mode is OFF, we exclude any active timeout
                    if (strikeCount >= 3) {
                      swipedListingIds.add(id);
                    } else if (!isRefreshMode && isTimedOut) {
                      swipedListingIds.add(id);
                    }
                  });
                }

                // Helper: append demo listings AFTER real ones so testing data is never lost.
                // Demos bypass swipe exclusion — they always reappear so user can practice repeatedly.
                const appendDemos = (real: any[]): any[] => {
                    if (page !== 0) return real;
                    const existingIds = new Set(real.map(r => r.id));
                    const filteredDemos = DEMO_LISTINGS.filter(l => {
                        if (existingIds.has(l.id)) return false;
                        if (filters?.category && filters.category !== 'all') {
                            const normalized = normalizeCategoryName(filters.category);
                            return l.category === normalized;
                        }
                        return true;
                    });
                    const demosWithMeta = filteredDemos.map(l => ({
                        ...l,
                        matchPercentage: 92 + Math.floor(Math.random() * 7),
                        matchReasons: ['Highly Recommended', 'Global Signal Detected'],
                        incompatibleReasons: [],
                        isDemo: true
                    }));
                    return [...real, ...demosWithMeta];
                };

                // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
                try {
                    const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
                        p_user_id: userId,
                        p_category: (filtersKey.includes('"category":"all"') || !filters?.category) ? null : normalizeCategoryName(filters.category),
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
                        // Keep the deterministic order returned by the backend RPC so
                        // every account sees the same listings in the same sequence.
                        const results = (rpcListings as any[])
                            .filter(l => !adminIds?.has(l.owner_id || l.user_id) && ['property', 'motorcycle', 'bicycle', 'worker', 'services'].includes(l.category))
                            .map(l => ({
                                ...l,
                                owner_id: l.owner_id || l.user_id,
                                images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : [])
                            }));
                        const withDemos = appendDemos(results);

                        // 🔥 SPEED OF LIGHT: PRE-WARM IMAGES IMMEDIATELY (Hardware-Aware)
                        runIdleTask(() => {
                          const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                          const imagesToPrewarm = withDemos.flatMap(l => l.images || []).slice(0, isHighPerformance ? 25 : 10);
                          pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                        });

                        return withDemos;
                    }
                } catch (_e) {
                    logger.warn('[SmartMatching] RPC Fallback to PostgREST');
                }

                // 2. BUILD SECURE POSTGREST QUERY (Fallback)
                // We deliberately do NOT add status='active' so older listings without
                // an explicit status still surface, then we filter active client-side.
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS);
                if (userId) {
                    query = query.neq('user_id', userId);
                }

                // 3. Apply excluded IDs (Fallback path) — only valid uuids
                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => typeof id === 'string' && /^[0-9a-fA-F-]{30,}$/.test(id))
                        .slice(0, 150);
                    if (idList.length > 0) {
                        try {
                            query = query.not('id', 'in', `(${idList.join(',')})`);
                        } catch { /* ignore */ }
                    }
                }

                // 4. Apply Filters
                if (filters?.category && filters.category !== 'all') {
                    const normalized = normalizeCategoryName(filters.category);
                    if (normalized) query = query.eq('category', normalized);
                } else {
                    // CRITICAL: Restrict to only the 4 allowed categories on client side
                    // This prevents "places" or "businesses" from leaking into the feed
                    query = query.in('category', ['property', 'motorcycle', 'bicycle', 'worker', 'services']);
                }

                if (filters?.serviceCategory && filters.serviceCategory.length > 0) {
                    query = query.in('service_category', filters.serviceCategory);
                }

                let { data: listings, error } = await query
                    .order('created_at', { ascending: false })
                    .limit(Math.max(pageSize * (page + 1), 120));
                if (error) {
                    logger.warn('[SmartMatching] listings query error, retrying without exclusion', error);
                    const retry = await supabase.from('listings')
                        .select(SWIPE_CARD_FIELDS)
                        .order('created_at', { ascending: false })
                        .limit(pageSize * (page + 1));
                    if (retry.error) throw retry.error;
                    listings = retry.data as any;
                }
                const liveListings = (listings || []).filter((l: any) =>
                    (l.is_active === undefined || l.is_active === true) &&
                    (l.status === undefined || l.status === null || l.status === 'active')
                );

                // 4.5 Filter out Admins (Hardware-Accelerated Client-Side Filter)
                const adminFiltered = liveListings
                    .filter(listing => !adminIds?.has((listing as any).owner_id || (listing as any).user_id))
                    .map(listing => ({
                        ...listing,
                        owner_id: (listing as any).owner_id || (listing as any).user_id,
                    }));

                // 4.6 Distance filter — only applied when user has a GPS fix
                const userLat = filters?.userLatitude;
                const userLon = filters?.userLongitude;
                const radiusKm = filters?.radiusKm ?? 50;
                const filteredListings = (userLat != null && userLon != null)
                    ? adminFiltered.filter(listing => {
                        if (listing.latitude == null || listing.longitude == null) return true; // no coords = include
                        const dLat = (listing.latitude - userLat) * Math.PI / 180;
                        const dLon = (listing.longitude - userLon) * Math.PI / 180;
                        const a = Math.sin(dLat/2)**2 + Math.cos(userLat * Math.PI/180) * Math.cos(listing.latitude * Math.PI/180) * Math.sin(dLon/2)**2;
                        const km = 6371 * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
                        return km <= radiusKm;
                    })
                    : adminFiltered;

                // 5. Scoring, Sorting, and Update Recovery
                const matchedResults = filteredListings.map(listing => {
                    const match = calculateListingMatch((filters || {}) as any, listing as Listing);
                    
                    // CHECK FOR RECOVERY: If this listing was swiped but updated since, it should bypass exclusion
                    const swipe = userSwipes?.left.get(listing.id);
                    const isUpdated = swipe && new Date(listing.created_at) > new Date(swipe);
                    
                    return {
                        ...listing as Listing,
                        matchPercentage: isUpdated ? Math.min(match.percentage + 10, 100) : match.percentage,
                        matchReasons: isUpdated ? ['Recently Updated', ...match.reasons] : match.reasons,
                        incompatibleReasons: match.incompatible,
                        isUpdatedRecovery: !!isUpdated
                    };
                });

                // Real listings first, ordered by recency (most recently created/edited
                // surfaces first so users see their own latest uploads immediately).
                const realResults = matchedResults.sort((a, b) => {
                  const seedDelta = Number(isSeedListing(a)) - Number(isSeedListing(b));
                  if (seedDelta !== 0) return seedDelta;
                  const ta = new Date((a as any).updated_at || a.created_at || 0).getTime();
                  const tb = new Date((b as any).updated_at || b.created_at || 0).getTime();
                  return tb - ta;
                });

                const pagedRealResults = realResults.slice(page * pageSize, (page + 1) * pageSize);

                // Always append demos AFTER real listings (never obscure real data, never disappear after swipe)
                const finalResults = appendDemos(pagedRealResults);

                // 🔥 SPEED OF LIGHT: PRE-WARM IMAGES IMMEDIATELY (Hardware-Aware)
                runIdleTask(() => {
                  const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                  const imagesToPrewarm = finalResults.flatMap(l => l.images || []).slice(0, isHighPerformance ? 25 : 10);
                  pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                });

                return finalResults;

            } catch (err) {
                logger.error('[SmartMatching] Fatal Exception:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}


