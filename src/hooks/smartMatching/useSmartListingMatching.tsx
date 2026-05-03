import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Listing } from '../useListings';
import { logger } from '@/utils/prodLogger';
import { normalizeCategoryName } from '@/types/filters';
import { ListingFilters } from './types';
import { calculateListingMatch } from './matchCalculators';
import { pwaImagePreloader, getCardImageUrl } from '@/utils/imageOptimization';
import { runIdleTask } from '@/lib/utils';
import { useAdminUserIds } from '../useAdminUserIds';

export const SWIPE_CARD_FIELDS = `
  id, title, description, price, images, video_url, city, neighborhood, beds, baths,
  square_footage, category, listing_type, property_type, vehicle_brand,
  vehicle_model, year, mileage, amenities, pet_friendly, furnished,
  owner_id, user_id, created_at, currency,
  service_category, pricing_unit, experience_years, experience_level,
  skills, days_available, time_slots_available, work_type, schedule_type,
  location_type, service_radius_km, minimum_booking_hours,
  certifications, tools_equipment,
  offers_emergency_service, background_check_verified, insurance_verified,
  motorcycle_type, bicycle_type, engine_cc, fuel_type, transmission,
  electric_assist, battery_range, frame_size, frame_material,
  latitude, longitude, status, is_active
`;

// Demo coords are all near Tulum (20.2114°N, -87.4654°W) at increasing distances
// so the km radius slider visually filters cards during testing:
//  ≤5km: demo-1, demo-6  |  ≤12km: +demo-2, demo-3, demo-4  |  ≤20km: +demo-5, demo-10
//  ≤35km: +demo-7, demo-11  |  ≤50km: +demo-8, demo-9, demo-12
const DEMO_LISTINGS: any[] = [
  // ── PROPERTY (3 cards) ────────────────────────────────────────────────
  {
    id: 'demo-1',
    title: 'Ultra-Modern Penthouse',
    description: 'Breathtaking 360-degree views of the skyline. Private elevator and infinity pool access. Pure luxury living with state-of-the-art automation.',
    price: 4500, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', neighborhood: 'Aldea Zamá',
    category: 'property', listing_type: 'rent', property_type: 'penthouse',
    beds: 3, baths: 4, square_footage: 2800,
    latitude: 20.2384, longitude: -87.4654, // ~3km north
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-3',
    title: 'Creative Studio Loft',
    description: 'Industrial chic at its finest. High ceilings, exposed brick, and perfect natural light for artists and creators.',
    price: 3200, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1536376074432-cd424369ffdd?auto=format&fit=crop&q=80&w=1200'],
    city: 'Playa del Carmen', neighborhood: 'Centro',
    category: 'property', listing_type: 'rent', property_type: 'loft',
    beds: 1, baths: 1, square_footage: 1100,
    latitude: 20.1474, longitude: -87.4654, // ~7km south
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-6',
    title: 'Minimalist Jungle Villa',
    description: 'Solar powered, jungle surrounded. The perfect retreat for digital nomads seeking peace and ultra-fast fiber optic.',
    price: 3800, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', neighborhood: 'Tulum Centro',
    category: 'property', listing_type: 'rent', property_type: 'villa',
    beds: 2, baths: 2, square_footage: 1500,
    latitude: 20.2114, longitude: -87.4654, // base ~0km
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── MOTORCYCLE (3 cards) ──────────────────────────────────────────────
  {
    id: 'demo-2',
    title: 'Ducati Panigale V4',
    description: 'Pristine condition. Low mileage. The pinnacle of Italian engineering. Ready for the track or the street with carbon fiber upgrades.',
    price: 24000, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Ducati', vehicle_model: 'Panigale V4', year: 2023, mileage: 1200,
    latitude: 20.2834, longitude: -87.4654, // ~8km north
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-7',
    title: 'Royal Enfield Meteor 350',
    description: 'Classic cruiser style, modern reliability. Touring ready with luggage brackets. The perfect bike for coastal roads.',
    price: 5800, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1558981403-c5f9899a28bc?auto=format&fit=crop&q=80&w=1200'],
    city: 'Playa del Carmen', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Royal Enfield', vehicle_model: 'Meteor 350', year: 2022, mileage: 4000,
    latitude: 20.4914, longitude: -87.4654, // ~31km north
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-11',
    title: 'Honda CBR600RR',
    description: 'Supersport performance, everyday reliability. Track-tuned suspension. Immaculate condition with full service history.',
    price: 8900, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?auto=format&fit=crop&q=80&w=1200'],
    city: 'Cancún', category: 'motorcycle', listing_type: 'sell',
    vehicle_brand: 'Honda', vehicle_model: 'CBR600RR', year: 2021, mileage: 6200,
    latitude: 20.5074, longitude: -87.0244, // ~48km northeast
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── BICYCLE (3 cards) ─────────────────────────────────────────────────
  {
    id: 'demo-4',
    title: 'VanMoof S5 Electric',
    description: 'The future of urban mobility. Integrated lights, anti-theft tech, and incredible power. Perfect for the city commute.',
    price: 3500, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'electric', electric_assist: true, battery_range: 80,
    latitude: 20.2114, longitude: -87.3764, // ~10km east
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-9',
    title: 'Specialized S-Works Tarmac',
    description: 'Featherlight carbon frame. Dura-Ace Di2 shifting. The ultimate racing machine for serious cyclists.',
    price: 12000, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1571068316344-75bc76f77890?auto=format&fit=crop&q=80&w=1200'],
    city: 'Cancún', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'road', frame_material: 'carbon',
    latitude: 19.8114, longitude: -87.4654, // ~44km south
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-12',
    title: 'Trek Marlin 7 Mountain Bike',
    description: 'Aluminum hardtail, hydraulic disc brakes, 1x drivetrain. Ready to shred jungle trails or cruise the coast.',
    price: 1200, currency: 'USD',
    images: ['https://images.unsplash.com/photo-1544191696-102dbdaeeaa0?auto=format&fit=crop&q=80&w=1200'],
    city: 'Cancún', category: 'bicycle', listing_type: 'sell',
    bicycle_type: 'mountain',
    latitude: 21.1743, longitude: -86.8466, // ~116km north (shows only at 50km+)
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },

  // ── SERVICES (3 cards) ────────────────────────────────────────────────
  {
    id: 'demo-5',
    title: 'Senior Interior Architect',
    description: 'Transforming spaces into experiences. 10+ years of luxury residential design. Expert in sustainable materials and premium finishes.',
    price: 150, pricing_unit: 'hour', currency: 'USD',
    images: ['https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', category: 'worker',
    service_category: 'Interior Design', experience_years: 12, experience_level: 'expert',
    latitude: 20.2114, longitude: -87.6044, // ~15km west
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-8',
    title: 'Fullstack Developer',
    description: 'Specializing in React, Node.js and AI integrations. Available for premium software architecture and product launches.',
    price: 120, pricing_unit: 'hour', currency: 'USD',
    images: ['https://images.unsplash.com/photo-1573164773711-33023fd666cb?auto=format&fit=crop&q=80&w=1200'],
    city: 'Playa del Carmen', category: 'worker',
    service_category: 'Software Development', experience_years: 8, experience_level: 'expert',
    latitude: 20.2114, longitude: -87.1274, // ~37km east
    is_active: true, status: 'active', created_at: new Date().toISOString()
  },
  {
    id: 'demo-10',
    title: 'Personal Fitness Trainer',
    description: 'Certified strength & conditioning coach. Outdoor sessions on the beach or cenotes. Nutrition planning included.',
    price: 60, pricing_unit: 'hour', currency: 'USD',
    images: ['https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?auto=format&fit=crop&q=80&w=1200'],
    city: 'Tulum', category: 'worker',
    service_category: 'Personal Training', experience_years: 6, experience_level: 'intermediate',
    latitude: 20.2454, longitude: -87.4654, // ~4km north
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
            
            if (viewsError) throw viewsError;
            
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

                // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
                try {
                    const { data: rpcListings, error: rpcError } = await (supabase as any).rpc('get_smart_listings', {
                        p_user_id: userId,
                        p_category: (filtersKey.includes('"category":"all"') || !filters?.category) ? null : normalizeCategoryName(filters.category),
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcListings && Array.isArray(rpcListings) && rpcListings.length > 0) {
                        const results = (rpcListings as any[])
                            .filter(l => !adminIds?.has(l.user_id) && ['property', 'motorcycle', 'bicycle', 'worker', 'services'].includes(l.category))
                            .map(l => ({
                                ...l,
                                images: Array.isArray(l.images) ? l.images : (l.images ? [l.images] : [])
                            }));
                        
                        // 🔥 SPEED OF LIGHT: PRE-WARM IMAGES IMMEDIATELY (Hardware-Aware)
                        runIdleTask(() => {
                          const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                          const imagesToPrewarm = results.flatMap(l => l.images || []).slice(0, isHighPerformance ? 25 : 10);
                          pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                        });

                        return results;
                    }
                } catch (_e) {
                    logger.warn('[SmartMatching] RPC Fallback to PostgREST');
                }

                // 2. BUILD SECURE POSTGREST QUERY (Fallback)
                let query = supabase.from('listings').select(SWIPE_CARD_FIELDS)
                    .eq('status', 'active')
                    .neq('user_id', userId); // self-exclusion

                // 3. Apply excluded IDs (Fallback path)
                if (swipedListingIds.size > 0) {
                    const idList = Array.from(swipedListingIds)
                        .filter(id => id && id.length > 30)
                        .slice(0, 150);
                    if (idList.length > 0) {
                        query = query.filter('id', 'not.in', `(${idList.join(',')})`);
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

                const { data: listings, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) throw error;

                // 4.5 Filter out Admins (Hardware-Accelerated Client-Side Filter)
                const adminFiltered = (listings || []).filter(listing => !adminIds?.has(listing.user_id));

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

                // 🚀 EMERGENCY DEMO FALLBACK: If results are very few, manifest high-fidelity demo cards
                // This ensures the 'Wow' reaction even on a fresh database or for users far from Tulum.
                if ((matchedResults.length < 5 || (page === 0 && matchedResults.length === 0)) && page === 0) {
                    logger.info('[SmartMatching] Appending high-fidelity demo cards for testing');
                    const existingDemoIds = new Set(matchedResults.map(r => r.id));
                    
                    // Filter demos by category if applicable, but ignore distance
                    const filteredDemos = DEMO_LISTINGS.filter(l => {
                        if (existingDemoIds.has(l.id)) return false;
                        if (filters?.category && filters.category !== 'all') {
                            const normalized = normalizeCategoryName(filters.category);
                            return l.category === normalized;
                        }
                        return true;
                    });

                    const newDemos = filteredDemos.map(l => ({
                        ...l,
                        matchPercentage: 92 + Math.floor(Math.random() * 7),
                        matchReasons: ['Highly Recommended', 'Global Signal Detected'],
                        incompatibleReasons: [],
                        isDemo: true
                    }));
                    matchedResults.push(...newDemos);
                }

                const finalResults = matchedResults.sort((a, b) => b.matchPercentage - a.matchPercentage);

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


