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

const DEMO_CLIENTS: any[] = [
  {
    user_id: 'demo-client-1',
    full_name: 'Sophia Laurent',
    age: 26,
    gender: 'female',
    city: 'Paris',
    country: 'France',
    images: ['https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Architecture', 'Piano', 'Gourmet Cooking'],
    lifestyle_tags: ['Non-smoker', 'Early Riser', 'Fitness Enthusiast'],
    bio: 'Looking for a premium workspace or a chic loft in the heart of the city.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-2',
    full_name: 'Marcus Chen',
    age: 31,
    gender: 'male',
    city: 'Singapore',
    country: 'Singapore',
    images: ['https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Web3', 'High-speed Racing', 'Mixology'],
    lifestyle_tags: ['Tech Nomad', 'Night Owl'],
    bio: 'Relocating for a tech venture. Need a secure spot for my motorcycle and a view of the harbor.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-3',
    full_name: 'Elena Rodriguez',
    age: 29,
    gender: 'female',
    city: 'Barcelona',
    country: 'Spain',
    images: ['https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Art History', 'Surfing', 'Sustainable Design'],
    lifestyle_tags: ['Pet Friendly', 'Yoga Daily'],
    bio: 'Art director seeking a sun-drenched studio. Love minimalism and natural light.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-4',
    full_name: 'Julian Sterling',
    age: 34,
    gender: 'male',
    city: 'New York',
    country: 'USA',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Venture Capital', 'Sailing', 'Espresso'],
    lifestyle_tags: ['High Net Worth', 'Urban Professional'],
    bio: 'Seeking an executive residence for short-term project stays. Priority on privacy and high-speed infrastructure.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-5',
    full_name: 'Amara Okafor',
    age: 27,
    gender: 'female',
    city: 'Lagos',
    country: 'Nigeria',
    images: ['https://images.unsplash.com/photo-1531123897727-8f129e1688ce?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Afrobeats', 'Fashion Design', 'Urban Exploration'],
    lifestyle_tags: ['Creative Professional', 'Weekend Adventurer'],
    bio: 'Fashion designer looking for a studio space with character. Need inspiration from the surroundings.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-6',
    full_name: 'Liam Henderson',
    age: 28,
    gender: 'male',
    city: 'London',
    country: 'UK',
    images: ['https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Rugby', 'Historical Fiction', 'Craft Beer'],
    lifestyle_tags: ['Social Butterfly', 'Gym Regular'],
    bio: 'Junior partner at a law firm. Looking for a modern apartment with easy access to the Tube.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-7',
    full_name: 'Yuki Tanaka',
    age: 24,
    gender: 'female',
    city: 'Tokyo',
    country: 'Japan',
    images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Hyper-local Travel', 'Robotics', 'Tea Ceremony'],
    lifestyle_tags: ['Digital Artist', 'Zen Practice'],
    bio: 'Finding beauty in the small things. Seeking a creative collective or a minimalist condo with a rooftop view.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-8',
    full_name: 'Alexei Ivanov',
    age: 33,
    gender: 'male',
    city: 'Dubai',
    country: 'UAE',
    images: ['https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Classic Cars', 'Desert Safari', 'Fintech'],
    lifestyle_tags: ['Ultra-High Net Worth', 'Private Jet Travel'],
    bio: 'Restoring a vintage car collection. Looking for a high-security villa with a 10-car garage and climate control.',
    onboarding_completed: true
  }
,
  {
    user_id: 'demo-client-7',
    full_name: 'Yuki Tanaka',
    age: 24,
    gender: 'female',
    city: 'Tokyo',
    country: 'Japan',
    images: ['https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Anime Art', 'Tea Ceremonies', 'Photography'],
    lifestyle_tags: ['Quiet Observer', 'Minimalist'],
    bio: 'Photography student looking for a shared living space with other creatives. Budget-conscious but style-focused.',
    onboarding_completed: true
  },
  {
    user_id: 'demo-client-8',
    full_name: 'David Van der Berg',
    age: 30,
    gender: 'male',
    city: 'Cape Town',
    country: 'South Africa',
    images: ['https://images.unsplash.com/photo-1504257432389-52343af06ae3?auto=format&fit=crop&q=80&w=1200'],
    interests: ['Mountain Biking', 'Wine Tasting', 'Architecture'],
    lifestyle_tags: ['Outdoor Enthusiast', 'Remote Worker'],
    bio: 'Software engineer working remotely. Need a place with a view of Table Mountain and a solid workspace.',
    onboarding_completed: true
  }
];


export function useSmartClientMatching(
    userId?: string,
    _category?: 'property' | 'motorcycle' | 'bicycle' | 'services' | 'worker',
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

                // RPC attempt
                try {
                    const { data: rpcClients, error: rpcError } = await (supabase as any).rpc('get_smart_clients', {
                        p_user_id: userId,
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcClients && Array.isArray(rpcClients) && rpcClients.length > 0) {
                        let finalClients = (rpcClients as any[])
                            .filter(c => c.user_id !== userId) // self-exclusion
                            .filter(c => !adminIds?.has(c.user_id)); // admin exclusion
                        
                        if (isRoommateSection) {
                          finalClients = finalClients.filter(c => c.roommate_available || (c as any).roommate_active);
                        }

                        runIdleTask(() => {
                            const imagesToPrewarm = finalClients.flatMap(p => p.profile_images || p.images || []).slice(0, 5);
                            pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                        });
                        return finalClients;
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
                
                if (_category && _category !== 'all') {
                    const mappedCategory = _category === 'worker' ? 'services' : _category;
                    query = query.contains('preferred_listing_types', [mappedCategory]);
                }

                // Apply swipes filter ONLY if we have a massive pool (avoids empty decks)
                if (swipedProfileIds.size > 0 && swipedProfileIds.size < 200) {
                    const idList = Array.from(swipedProfileIds).filter(id => id && id.length > 30).slice(0, 100);
                    if (idList.length > 0) query = query.not('user_id', 'in', `(${idList.join(',')})`);
                }

                let { data: profiles, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                
                // 3. EMERGENCY FALLBACK: If deck is empty, fetch ANYONE (ignoring ALL constraints)
                // This ensures "Show swipe cards users again" request is always fulfilled
                if (!profiles || profiles.length === 0) {
                    logger.warn('[SmartMatching] Deck empty, triggering hyper-aggressive fallback');
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

                // 🚀 EMERGENCY DEMO FALLBACK: If results are zero, manifest high-fidelity demo cards
                // This ensures the 'Wow' reaction even on a fresh database.
                if (results.length === 0 && page === 0) {
                    logger.info('[SmartClientMatching] Manifesting high-fidelity demo cards');
                    return DEMO_CLIENTS.map(c => ({
                        id: c.user_id,
                        user_id: c.user_id,
                        name: c.full_name,
                        age: c.age,
                        gender: c.gender,
                        interests: c.interests,
                        preferred_activities: [],
                        location: { city: c.city },
                        lifestyle_tags: c.lifestyle_tags,
                        profile_images: c.images,
                        matchPercentage: 88 + Math.floor(Math.random() * 10),
                        matchReasons: ['Profile available', 'Highly compatible'],
                        incompatibleReasons: [],
                        verified: true,
                        roommate_available: false,
                        city: c.city,
                        country: c.country,
                        work_schedule: 'Flexible',
                        isDemo: true
                    })) as MatchedClientProfile[];
                }

                runIdleTask(() => {
                    const isHighPerformance = (navigator as any).deviceMemory >= 4 || !('deviceMemory' in navigator);
                    const imagesToPrewarm = results.flatMap(p => p.profile_images || []).slice(0, isHighPerformance ? 25 : 10);
                    pwaImagePreloader.batchPreload(imagesToPrewarm.map(url => getCardImageUrl(url)));
                });

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


