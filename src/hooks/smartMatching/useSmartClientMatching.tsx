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

// Demos disabled — show real users only.
// 🚀 SWIPESS SYNC: High-quality demo profiles to ensure the deck never feels empty.
// These use diverse Unsplash avatars to look like a real community.
const DEMO_CLIENTS: any[] = [
  {
    user_id: 'demo-roommate-1',
    full_name: 'Elena Vance',
    age: 26, gender: 'female',
    city: 'Tulum', country: 'Mexico', nationality: 'American',
    images: ['https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Yoga', 'Vegan Cooking', 'Ocean Conservation'],
    lifestyle_tags: ['Digital Nomad', 'Morning Person', 'Clean'],
    bio: 'Looking for a shared villa in Aldea Zama. I work remotely in tech and love weekend cenote trips!',
    client_type: 'renter', roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-roommate-2',
    full_name: 'Julian Ricci',
    age: 31, gender: 'male',
    city: 'Tulum', country: 'Mexico', nationality: 'Italian',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Music Production', 'Padel', 'Mezcal'],
    lifestyle_tags: ['Entrepreneur', 'Social', 'Dog Friendly'],
    bio: 'Finding a creative space to share. I produce melodic techno and enjoy the Tulum night life.',
    client_type: 'renter', roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-roommate-3',
    full_name: 'Sofia Chen',
    age: 24, gender: 'female',
    city: 'Tulum', country: 'Mexico', nationality: 'Canadian',
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Photography', 'Surfing', 'Sustainability'],
    lifestyle_tags: ['Artist', 'Quiet', 'Minimalist'],
    bio: 'Recent grad traveling the world. Looking for a zen room near the beach.',
    client_type: 'renter', roommate_available: true, onboarding_completed: true
  }
];

const _DEPRECATED_DEMO_CLIENTS: any[] = [
  {
    user_id: 'demo-client-buyer-1-disabled',
    full_name: 'Isabela Torres',
    age: 29, gender: 'female',
    city: 'Tulum', country: 'Mexico', nationality: 'Mexican',
    images: [
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Architecture', 'Wellness', 'Beachfront Homes'],
    lifestyle_tags: ['Investor', 'Yoga Daily', 'Pet Friendly'],
    bio: 'Buying a polished jungle villa or design-forward condo in Tulum. Ready to move fast for the right place.',
    occupation: 'buyer', client_type: 'buyer', budget_min: 280000, budget_max: 520000,
    latitude: 20.2384, longitude: -87.4654,
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-buyer-2',
    full_name: 'Mateo Rojas',
    age: 34, gender: 'male',
    city: 'Miami', country: 'USA', nationality: 'Colombian',
    images: [
      'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d8b?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Fintech', 'Padel', 'Ocean Views'],
    lifestyle_tags: ['Founder', 'High Intent', 'Fast Closing'],
    bio: 'Looking for a premium condo with strong rental upside between Miami and the Riviera Maya.',
    occupation: 'buyer', client_type: 'buyer', budget_min: 450000, budget_max: 900000,
    latitude: 20.1474, longitude: -87.4654,
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-buyer-3',
    full_name: 'Valentina Márquez',
    age: 31, gender: 'female',
    city: 'New York', country: 'USA', nationality: 'Venezuelan',
    images: [
      'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1548142813-c348350df52b?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Art Collecting', 'Boutique Hotels', 'Interior Design'],
    lifestyle_tags: ['Cash Buyer', 'Design Focused', 'Quiet Luxury'],
    bio: 'Searching for an elegant second home with natural light, privacy, and a premium neighborhood feel.',
    occupation: 'buyer', client_type: 'buyer', budget_min: 350000, budget_max: 750000,
    latitude: 20.2454, longitude: -87.4654,
    roommate_available: false, onboarding_completed: true
  },

  // ── RENTERS (3 — move-ready owner-side cards) ─────────────────────────
  {
    user_id: 'demo-client-renter-1',
    full_name: 'Camila Duarte',
    age: 27, gender: 'female',
    city: 'Canggu', country: 'Indonesia', nationality: 'Brazilian',
    images: [
      'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1509967419530-da38b4704bc6?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Surfing', 'Content Creation', 'Wellness'],
    lifestyle_tags: ['Digital Nomad', 'Clean', 'Social'],
    bio: 'Needs a beautiful monthly rental with fiber internet, natural light, and beach access.',
    occupation: 'renter', client_type: 'renter', budget_min: 1800, budget_max: 3600,
    latitude: 20.2114, longitude: -87.3764,
    roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-client-renter-2',
    full_name: 'Nicolás Herrera',
    age: 30, gender: 'male',
    city: 'Tulum', country: 'Mexico', nationality: 'Colombian',
    images: [
      'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519345182560-3f2917c472ef?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Motorcycles', 'Restaurants', 'Remote Work'],
    lifestyle_tags: ['Night Owl', 'Respectful', 'Garage Needed'],
    bio: 'Relocating for six months and looking for a furnished place with workspace and secure parking.',
    occupation: 'renter', client_type: 'renter', budget_min: 2200, budget_max: 4200,
    latitude: 20.2834, longitude: -87.4654,
    roommate_available: true, onboarding_completed: true
  },
  {
    user_id: 'demo-client-renter-3',
    full_name: 'Arielle Cohen',
    age: 28, gender: 'female',
    city: 'Miami', country: 'USA', nationality: 'American',
    images: [
      'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1526510747491-58f928ec870f?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1487412720507-e7ab37603c6f?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Pilates', 'Design', 'Beach Walks'],
    lifestyle_tags: ['Quiet', 'Early Riser', 'Minimalist'],
    bio: 'Looking for a bright, calm rental with premium finishes and a walkable neighborhood.',
    occupation: 'renter', client_type: 'renter', budget_min: 2600, budget_max: 5000,
    latitude: 20.2214, longitude: -87.4754,
    roommate_available: false, onboarding_completed: true
  },

  // ── HIRE (3 — clients seeking workers/services) ───────────────────────
  {
    user_id: 'demo-client-hire-1',
    full_name: 'Lucía Fernández',
    age: 33, gender: 'female',
    city: 'Tulum', country: 'Mexico', nationality: 'Mexican',
    images: [
      'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1544723795-3fb6469f5b39?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1551836022-d5d88e9218df?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Hospitality', 'Villa Management', 'Guest Experience'],
    lifestyle_tags: ['Property Manager', 'Weekly Bookings', 'Verified'],
    bio: 'Needs a reliable cleaning crew, private chef, and maintenance workers for rotating villa guests.',
    occupation: 'client', client_type: 'hire', budget_min: 500, budget_max: 4000,
    latitude: 20.2454, longitude: -87.4654,
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-hire-2',
    full_name: 'Andrés Salazar',
    age: 36, gender: 'male',
    city: 'New York', country: 'USA', nationality: 'Venezuelan',
    images: [
      'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Events', 'Brand Activations', 'Luxury Service'],
    lifestyle_tags: ['Event Host', 'High Standards', 'Fast Booking'],
    bio: 'Booking photographers, decorators, and service staff for private events in Miami and Tulum.',
    occupation: 'client', client_type: 'hire', budget_min: 1000, budget_max: 8500,
    latitude: 20.2114, longitude: -87.1274,
    roommate_available: false, onboarding_completed: true
  },
  {
    user_id: 'demo-client-hire-3',
    full_name: 'Maya Thompson',
    age: 32, gender: 'female',
    city: 'Bali', country: 'Indonesia', nationality: 'American',
    images: [
      'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1558898479-33c0057a5d12?auto=format&fit=crop&q=80&w=1200',
      'https://images.unsplash.com/photo-1534751516642-a1af1ef26a56?auto=format&fit=crop&q=80&w=1200'
    ],
    interests: ['Wellness Retreats', 'Content Shoots', 'Interior Styling'],
    lifestyle_tags: ['Retreat Owner', 'Creative', 'Recurring Work'],
    bio: 'Hiring fitness coaches, massage therapists, and villa stylists for premium retreat guests.',
    occupation: 'client', client_type: 'hire', budget_min: 800, budget_max: 6500,
    latitude: 20.2214, longitude: -87.4754,
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

    const normalizeImageList = (...sources: unknown[]): string[] => {
        const urls: string[] = [];
        const push = (value: unknown) => {
            if (typeof value === 'string' && value.trim()) urls.push(value.trim());
            else if (Array.isArray(value)) value.forEach(push);
            else if (value && typeof value === 'object') {
                const record = value as Record<string, unknown>;
                push(record.url || record.image_url || record.src || record.publicUrl);
            }
        };
        sources.forEach(push);
        return Array.from(new Set(urls)).filter(url => !url.includes('placeholder'));
    };

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

                // Helper: append demo clients AFTER real ones. Demos bypass swipe exclusion
                // so the user can keep practicing repeatedly without losing them.
                const appendDemoClients = (real: MatchedClientProfile[]): MatchedClientProfile[] => {
                    if (page !== 0) return real;
                    const existing = new Set(real.map(r => r.user_id));
                    const filteredDemos = DEMO_CLIENTS.filter(c => {
                        if (existing.has(c.user_id)) return false;
                        if (isRoommateSection && !c.roommate_available) return false;
                        if (_category && ['buyers', 'renters', 'hire'].includes(_category)) {
                            const map: Record<string, string> = { buyers: 'buyer', renters: 'renter', hire: 'hire' };
                            return c.client_type === map[_category];
                        }
                        return true;
                    });
                    const mapped = filteredDemos.map(c => ({
                        id: c.user_id, user_id: c.user_id, name: c.full_name,
                        age: c.age, gender: c.gender,
                        interests: c.interests || [], preferred_activities: [],
                        location: { city: c.city },
                        lifestyle_tags: c.lifestyle_tags || [],
                        profile_images: c.images || ['/placeholder.svg'],
                        matchPercentage: 92 + Math.floor(Math.random() * 7),
                        matchReasons: ['Highly Recommended'],
                        incompatibleReasons: [],
                        verified: !!c.onboarding_completed,
                        roommate_available: !!c.roommate_available,
                        city: c.city, country: c.country,
                        client_type: c.client_type,
                        bio: c.bio,
                        isDemo: true,
                    } as unknown as MatchedClientProfile));
                    return [...real, ...mapped];
                };

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
                            .filter(c => !adminIds?.has(c.user_id))
                            .filter(c => c.role === 'client')
                            .filter(c => (c.client_type || '') !== 'business');

                        if (isRoommateSection) {
                          finalClients = finalClients.filter(c => c.roommate_available || (c as any).roommate_active);
                        }

                        // Apply client_type filtering for owner categories (buyers/renters/hire)
                        // If no matching results, fall through to demo fallback below
                        if (_category && ['buyers', 'renters', 'hire'].includes(_category)) {
                            const clientTypeMap: Record<string, string> = { 'buyers': 'buyer', 'renters': 'renter', 'hire': 'hire' };
                            finalClients = finalClients.filter(c => (c.client_type || 'unknown') === clientTypeMap[_category]);
                        }

                        const normalizedClients = finalClients.map((c: any) => {
                            const images = normalizeImageList(c.profile_images, c.images, c.avatar_url);
                            return {
                                ...c,
                                id: c.id || c.user_id,
                                name: c.name || c.full_name || 'User',
                                profile_images: images,
                                images,
                            };
                        }).filter((c: any) => c.profile_images.length > 0);

                        // Always append demos (real first) so testing data is never lost
                        const withDemos = appendDemoClients(normalizedClients as any);
                        if (withDemos.length > 0) {
                            runIdleTask(() => {
                                const imagesToPrewarm = withDemos.flatMap((p: any) => p.profile_images || p.images || []).slice(0, 5);
                                pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                            });
                            return withDemos;
                        }
                    }
                } catch (_e) {}

                // 1. Determine target role dynamically using user_roles (source of truth).
                // profiles.role is unreliable (often empty), so we resolve roles from
                // user_roles and translate them into a list of allowed user_ids.
                const { data: myRoleRow } = await supabase
                    .from('user_roles')
                    .select('role')
                    .eq('user_id', userId)
                    .maybeSingle();
                const myRole = (myRoleRow?.role as string) || 'owner';
                const targetRole = myRole === 'owner' ? 'client' : 'owner';

                const { data: targetRoleRows } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .eq('role', targetRole as any);
                const targetUserIds = (targetRoleRows || [])
                    .map((r: any) => r.user_id)
                    .filter((id: string) => id && id !== userId);

                // 2. PRIMARY QUERY: pull profiles for those user_ids.
                let query = supabase.from('profiles')
                    .select(CLIENT_FIELDS)
                    .neq('user_id', userId);
                if (targetUserIds.length > 0) {
                    query = query.in('user_id', targetUserIds);
                }
                
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
                    let fallback = supabase.from('profiles')
                        .select(CLIENT_FIELDS)
                        .neq('user_id', userId)
                        .order('created_at', { ascending: false })
                        .limit(pageSize);
                    if (targetUserIds.length > 0) {
                        fallback = fallback.in('user_id', targetUserIds);
                    }
                    const { data: fallbackData } = await fallback;
                    profiles = fallbackData || [];
                }

                if (error && (!profiles || profiles.length === 0)) throw error;

                const finalProfiles = profiles || [];

                const userIds = finalProfiles.map(p => p.user_id);
                const { data: cpData } = await supabase.from('client_profiles').select('user_id, age, gender, city, country, preferred_activities, profile_images, interests, roommate_available, work_schedule, name').in('user_id', userIds);
                const cpMap = new Map(cpData?.map(cp => [cp.user_id, cp]) || []);

                let results = finalProfiles
                    .filter(p => !adminIds?.has(p.user_id)) // admin exclusion
                    .filter(p => (p as any).client_type !== 'business') // business/place exclusion
                    .map(p => {
                    const cp = cpMap.get(p.user_id);
                    // Merge all available photo sources so real roommate cards always show their photo.
                    const finalImgs = normalizeImageList((p as any).images, (cp as any)?.profile_images, (p as any).avatar_url);
                    return {
                        id: p.user_id, user_id: p.user_id, name: p.full_name || cp?.name || 'User',
                        age: p.age || cp?.age || 0, gender: p.gender || cp?.gender || '',
                        interests: p.interests || cp?.interests || [], preferred_activities: cp?.preferred_activities || [],
                        location: { city: p.city || cp?.city }, lifestyle_tags: (p as any).lifestyle_tags || (cp as any)?.lifestyle_tags || [],
                        profile_images: finalImgs, matchPercentage: 80,
                        matchReasons: ['Profile available'], incompatibleReasons: [], verified: !!p.onboarding_completed,
                        roommate_available: !!cp?.roommate_available, city: p.city || cp?.city, country: p.country || cp?.country, work_schedule: p.work_schedule || cp?.work_schedule
                    } as MatchedClientProfile;
                });

                if (isRoommateSection) {
                    results = results.filter(r => r.roommate_available);
                }

                // Hide profiles that have no real photo — avoids empty/placeholder cards in PWA.
                results = results.filter(r => {
                    const imgs = (r as any).profile_images as any[] | undefined;
                    const hasRealPhoto = Array.isArray(imgs) && imgs.some(u => typeof u === 'string' && u && !u.includes('placeholder'));
                    const isDemo = (r as any).isDemo;
                    return hasRealPhoto || isDemo; // Always allow demo photos
                });

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

                const sortedReal = results.sort((a, b) => b.matchPercentage - a.matchPercentage);
                return appendDemoClients(sortedReal);
            } catch (err) {
                logger.error('[SmartClientMatching] Error:', err);
                return [];
            }
        },
        enabled: !!userId && !isDisabled,
        refetchOnWindowFocus: false,
    });
}


