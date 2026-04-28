import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { MatchedClientProfile, ClientFilters } from './types';
import { pwaImagePreloader, getCardImageUrl } from '@/utils/imageOptimization';
import { runIdleTask } from '@/lib/utils';
import { useAdminUserIds } from '../useAdminUserIds';

const CLIENT_FIELDS = `
    user_id, full_name, age, gender, city, country, images, avatar_url,
    interests, lifestyle_tags, smoking, work_schedule, nationality,
    languages_spoken, neighborhood, bio, onboarding_completed
`;

// 3 per client type: buyers, renters, workers + 2 roommate-available
// Coords near Tulum so owner-side radius slider reacts during testing
const DEMO_CLIENTS: any[] = [
  // ── BUYERS (looking to purchase) ──────────────────────────────────────
  {
    user_id: 'demo-client-1',
    full_name: 'Sophia Laurent',
    age: 26, gender: 'female',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Architecture', 'Piano', 'Gourmet Cooking'],
    lifestyle_tags: ['Non-smoker', 'Early Riser', 'Fitness Enthusiast'],
    bio: 'Looking to purchase a villa or penthouse in Tulum. Budget up to $500k.',
    occupation: 'buyer', client_type: 'buyer',
    latitude: 20.2384, longitude: -87.4654, // ~3km
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-4',
    full_name: 'Julian Sterling',
    age: 34, gender: 'male',
    city: 'Playa del Carmen', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Venture Capital', 'Sailing', 'Espresso'],
    lifestyle_tags: ['High Net Worth', 'Urban Professional'],
    bio: 'Investor buying beachfront property. Need it fast, need it premium.',
    occupation: 'buyer', client_type: 'buyer',
    latitude: 20.1474, longitude: -87.4654, // ~7km
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-8',
    full_name: 'Alexei Volkov',
    age: 33, gender: 'male',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Classic Cars', 'Desert Safari', 'Fintech'],
    lifestyle_tags: ['Collector', 'Private Investor'],
    bio: 'Buying a high-security villa with garage space for vehicle collection.',
    occupation: 'buyer', client_type: 'buyer',
    latitude: 20.4914, longitude: -87.4654, // ~31km
    roommate_available: false, onboarding_completed: true
  },

  // ── RENTERS (looking to rent) ─────────────────────────────────────────
  {
    user_id: 'demo-client-2',
    full_name: 'Marcus Chen',
    age: 31, gender: 'male',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Web3', 'Motorcycles', 'Mixology'],
    lifestyle_tags: ['Tech Nomad', 'Night Owl'],
    bio: 'Remote founder relocating to Tulum. Needs fiber optic and a garage for my bike.',
    occupation: 'renter', client_type: 'renter',
    latitude: 20.2834, longitude: -87.4654, // ~8km
    roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-client-3',
    full_name: 'Elena Rodriguez',
    age: 29, gender: 'female',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Art', 'Surfing', 'Sustainable Design'],
    lifestyle_tags: ['Pet Friendly', 'Yoga Daily'],
    bio: 'Art director seeking a sun-drenched studio or shared house near the beach.',
    occupation: 'renter', client_type: 'renter',
    latitude: 20.2114, longitude: -87.3764, // ~10km
    roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-client-6',
    full_name: 'Liam Henderson',
    age: 28, gender: 'male',
    city: 'Playa del Carmen', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Rugby', 'Craft Beer', 'Kitesurfing'],
    lifestyle_tags: ['Social', 'Gym Regular'],
    bio: 'Looking for a furnished apartment near the beach, 6-month minimum lease.',
    occupation: 'renter', client_type: 'renter',
    latitude: 20.2114, longitude: -87.6044, // ~15km
    roommate_available: false, onboarding_completed: true
  },

  // ── WORKERS / HIRE ────────────────────────────────────────────────────
  {
    user_id: 'demo-client-5',
    full_name: 'Amara Okafor',
    age: 27, gender: 'female',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Fashion Design', 'Urban Art', 'Photography'],
    lifestyle_tags: ['Creative Professional', 'Freelancer'],
    bio: 'Fashion designer & creative director. Available for brand shoots and interior styling.',
    occupation: 'worker', client_type: 'hire',
    latitude: 20.2454, longitude: -87.4654, // ~4km
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-7',
    full_name: 'Yuki Tanaka',
    age: 24, gender: 'female',
    city: 'Tulum', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Robotics', 'Photography', 'Digital Art'],
    lifestyle_tags: ['Digital Artist', 'Freelancer'],
    bio: 'Full-stack dev & photographer. Remote-first. Available for product launches.',
    occupation: 'worker', client_type: 'hire',
    latitude: 20.2114, longitude: -87.1274, // ~37km
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-9',
    full_name: 'David Van der Berg',
    age: 30, gender: 'male',
    city: 'Playa del Carmen', country: 'Mexico',
    images: ['https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Mountain Biking', 'Architecture', 'Woodworking'],
    lifestyle_tags: ['Craftsman', 'Remote Worker'],
    bio: 'Construction project manager & interior carpenter. 8 years building premium residences.',
    occupation: 'worker', client_type: 'hire',
    latitude: 19.8114, longitude: -87.4654, // ~44km
    roommate_available: false, onboarding_completed: true
  },
];


export function useSmartClientMatching(
    userId?: string,
    _category?: 'property' | 'motorcycle' | 'bicycle' | 'services' | 'worker' | 'all' | 'all-clients' | 'buyers' | 'renters' | 'hire',
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false,
    filters?: ClientFilters,
    isRoommateSection: boolean = false,
    isDisabled: boolean = false
) {
    const queryClient = useQueryClient();
    const filtersKey = useMemo(() => filters ? JSON.stringify(filters) : '', [filters]);
    const { data: adminIds } = useAdminUserIds();

    const { data: userSwipes } = useQuery({
        queryKey: ['user-client-swipes', userId],
        queryFn: async () => {
            if (!userId) return { liked: new Set<string>(), left: new Map<string, string>() };
            const { data, error } = await supabase
                .from('likes')
                .select('target_id, direction, created_at')
                .eq('user_id', userId)
                .eq('target_type', 'profile');
            
            if (error) throw error;
            
            const liked = new Set<string>();
            const left = new Map<string, string>();
            data?.forEach(s => {
                if (s.direction === 'right') liked.add(s.target_id);
                else left.set(s.target_id, s.created_at);
            });
            return { liked, left };
        },
        enabled: !!userId,
        staleTime: 5 * 60 * 1000,
    });

    useEffect(() => {
        if (!userId) return;
        const channel = supabase
            .channel('clients-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, () => {
                logger.info('[SmartMatching] New profile inserted, invalidating queries');
                queryClient.invalidateQueries({ queryKey: ['smart-clients'] });
            })
            .subscribe();
        return () => { channel.unsubscribe(); };
    }, [userId, queryClient]);

    return useQuery<MatchedClientProfile[]>({
        queryKey: ['smart-clients', userId, _category, page, isRefreshMode, filtersKey, isRoommateSection],
        staleTime: 2 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [] as MatchedClientProfile[];

            try {
                const swipedProfileIds = new Set<string>();
                if (userSwipes) {
                    userSwipes.liked.forEach(id => swipedProfileIds.add(id));
                    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);
                    userSwipes.left.forEach((createdAt, id) => {
                        const isOldSwipe = new Date(createdAt) < threeDaysAgo;
                        if (isOldSwipe || !isRefreshMode) {
                            swipedProfileIds.add(id);
                        }
                    });
                }

                // RPC attempt — only use results if they match the current category filter
                try {
                    const { data: rpcClients, error: rpcError } = await (supabase as any).rpc('get_smart_clients', {
                        p_user_id: userId,
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcClients && Array.isArray(rpcClients) && rpcClients.length > 0) {
                        let finalClients = (rpcClients as any[])
                            .filter(c => c.user_id !== userId)
                            .filter(c => !adminIds?.has(c.user_id));

                        if (isRoommateSection) {
                          finalClients = finalClients.filter(c => c.roommate_available || (c as any).roommate_active);
                        }

                        // Apply client_type filtering for owner categories (buyers/renters/hire)
                        // If no matching results, fall through to demo fallback below
                        if (_category && ['buyers', 'renters', 'hire'].includes(_category)) {
                            const clientTypeMap: Record<string, string> = { 'buyers': 'buyer', 'renters': 'renter', 'hire': 'hire' };
                            finalClients = finalClients.filter(c => (c.client_type || 'unknown') === clientTypeMap[_category]);
                        }

                        // Only return early from RPC if we have results after filtering
                        if (finalClients.length > 0) {
                            runIdleTask(() => {
                                const imagesToPrewarm = finalClients.flatMap(p => p.profile_images || p.images || []).slice(0, 5);
                                pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                            });
                            return finalClients;
                        }
                        // Fall through to demo logic below when RPC has results but none match category
                    }
                } catch (_e) {}

                // 1. Determine target role dynamically (Owner sees Client, Client sees Owner)
                const { data: roleData } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', userId)
                    .maybeSingle();
                
                const myRole = roleData?.role || 'owner';
                const targetRole = myRole === 'owner' ? 'client' : 'owner';

                // 2. PRIMARY QUERY: Filtered discovery
                let query = supabase.from('profiles')
                    .select(CLIENT_FIELDS)
                    .eq('role', targetRole)
                    .neq('user_id', userId); 
                
                if (isRoommateSection) {
                    query = (query as any).eq('roommate_available', true);
                }

                // Support both listing type filters (property/motorcycle/bicycle/services)
                // AND client type filters (buyers/renters/hire) for owner side
                if (_category && _category !== 'all' && _category !== 'all-clients') {
                    const isClientType = ['buyers', 'renters', 'hire'].includes(_category);
                    if (isClientType) {
                        // Owner side: filter by client_type field
                        const clientTypeMap: Record<string, string> = {
                            'buyers': 'buyer',
                            'renters': 'renter',
                            'hire': 'hire'
                        };
                        const mappedType = clientTypeMap[_category];
                        // Note: client_type is stored in client_profiles table, not profiles
                        // We'll filter it after the join below
                    } else {
                        // Client side: filter by preferred_listing_types
                        const mappedCategory = _category === 'worker' ? 'services' : _category;
                        query = query.contains('preferred_listing_types', [mappedCategory]);
                    }
                }

                // Apply swipes filter ONLY if we have a massive pool (avoids empty decks)
                if (swipedProfileIds.size > 0 && swipedProfileIds.size < 200) {
                    const idList = Array.from(swipedProfileIds).filter(id => id && id.length > 30).slice(0, 100);
                    if (idList.length > 0) query = query.not('user_id', 'in', `(${idList.join(',')})`);
                }

                let { data: profiles, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);

                // 3. DEMO FALLBACK: If first page and category-specific query returns nothing, show demo
                // Skip aggressive fallback in this case - let it fall through to demo at line 336
                const shouldShowDemoIfEmpty = page === 0 && _category && _category !== 'all';

                // 4. EMERGENCY FALLBACK: Fetch ANYONE if deck is empty AND we're not deferring to demo
                if ((!profiles || profiles.length === 0) && !shouldShowDemoIfEmpty) {
                    logger.warn('[SmartMatching] Deck empty, triggering hyper-aggressive fallback (page=' + page + ', category=' + _category + ')');
                    const { data: fallbackData } = await supabase.from('profiles')
                        .select(CLIENT_FIELDS)
                        .eq('role', targetRole)
                        .neq('user_id', userId)
                        .order('created_at', { ascending: false }) // Show newest users first
                        .limit(pageSize);
                    profiles = fallbackData || [];
                }

                if (error && (!profiles || profiles.length === 0)) throw error;

                const finalProfiles = profiles || [];

                const userIds = finalProfiles.map(p => p.user_id);
                const { data: cpData } = await supabase.from('client_profiles').select('user_id, age, gender, city, country, preferred_activities, profile_images, interests, roommate_available, work_schedule, name').in('user_id', userIds);
                const cpMap = new Map(cpData?.map(cp => [cp.user_id, cp]) || []);

                let results = finalProfiles
                    .filter(p => !adminIds?.has(p.user_id)) // admin exclusion
                    .map(p => {
                    const cp = cpMap.get(p.user_id);
                    return {
                        id: p.user_id, user_id: p.user_id, name: p.full_name || cp?.name || 'User',
                        age: p.age || cp?.age || 0, gender: p.gender || cp?.gender || '',
                        interests: p.interests || cp?.interests || [], preferred_activities: cp?.preferred_activities || [],
                        location: { city: p.city || cp?.city }, lifestyle_tags: (p as any).lifestyle_tags || (cp as any)?.lifestyle_tags || [],
                        profile_images: p.images || cp?.profile_images || ['/placeholder.svg'], matchPercentage: 80,
                        matchReasons: ['Profile available'], incompatibleReasons: [], verified: !!p.onboarding_completed,
                        roommate_available: !!cp?.roommate_available, city: p.city || cp?.city, country: p.country || cp?.country, work_schedule: p.work_schedule || cp?.work_schedule
                    } as MatchedClientProfile;
                });

                if (isRoommateSection) {
                    results = results.filter(r => r.roommate_available);
                }

                // Filter by client_type if owner selected a category (buyers/renters/hire)
                if (_category && ['buyers', 'renters', 'hire'].includes(_category)) {
                    const clientTypeMap: Record<string, string> = {
                        'buyers': 'buyer',
                        'renters': 'renter',
                        'hire': 'hire'
                    };
                    const targetType = clientTypeMap[_category];
                    results = results.filter(r => {
                        // Demo clients have client_type set, real profiles may not
                        const rType = (r as any).client_type || 'unknown';
                        return rType === targetType;
                    });
                }

                // 🚀 DEMO FALLBACK REMOVED: Show the "Adjust Radius" page instead of fake demo data
                // This gives users clear feedback when no real matches exist nearby

                return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
            } catch (err) {
                logger.error('[SmartClientMatching] Error:', err);
                return [];
            }
        },
        enabled: !!userId && !isDisabled,
        refetchOnWindowFocus: false,
    });
}


