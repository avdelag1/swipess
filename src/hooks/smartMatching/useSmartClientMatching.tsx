import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { MatchedClientProfile, ClientFilters } from './types';

export function useSmartClientMatching(
    userId?: string,
    _category?: 'property' | 'motorcycle' | 'bicycle' | 'services' | 'worker',
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false,
    filters?: ClientFilters,
    isRoommateSection: boolean = false
) {
    const queryClient = useQueryClient();
    const filtersKey = filters ? JSON.stringify(filters) : '';

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
        staleTime: 10 * 60 * 1000,
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) return [] as MatchedClientProfile[];

            try {
                const [
                    { data: likedRecords },
                    { data: leftSwipes }
                ] = await Promise.all([
                    supabase.from('likes').select('target_id').eq('user_id', userId).eq('target_type', 'profile').eq('direction', 'right'),
                    supabase.from('likes').select('target_id, created_at').eq('user_id', userId).eq('target_type', 'profile').eq('direction', 'left')
                ]);

                const likedIds = new Set(likedRecords?.map(r => r.target_id) || []);
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();
                const swipedProfileIds = new Set<string>();
                likedIds.forEach(id => swipedProfileIds.add(id));
                leftSwipes?.forEach(swipe => {
                    if (new Date(swipe.created_at) < new Date(threeDaysAgo)) {
                        swipedProfileIds.add(swipe.target_id);
                    } else if (!isRefreshMode) {
                        swipedProfileIds.add(swipe.target_id);
                    }
                });

                const CLIENT_FIELDS = `
                    user_id, full_name, age, gender, city, country, images, avatar_url,
                    interests, lifestyle_tags, smoking, work_schedule, nationality,
                    languages_spoken, neighborhood, bio, onboarding_completed
                `;

                // 🚀 SPEED OF LIGHT: Attempt database-level filtering (RPC)
                // This is the "Materialized View" strategy: DB handles exclusion in one pass.
                try {
                    const { data: rpcClients, error: rpcError } = await (supabase as any).rpc('get_smart_clients', {
                        p_user_id: userId,
                        p_limit: pageSize,
                        p_offset: page * pageSize
                    });

                    if (!rpcError && rpcClients && Array.isArray(rpcClients) && rpcClients.length > 0) {
                        return rpcClients as any[];
                    }
                } catch {
                    // Fallback to PostgREST
                }

                // 2. BUILD SECURE POSTGREST QUERY (Fallback)
                let query = supabase.from('profiles').select(CLIENT_FIELDS);

                // APPLY CATEGORY FILTER: Ensure we only find clients interested in the owner's offering
                if (_category) {
                    const mappedCategory = _category === 'worker' ? 'services' : _category;
                    query = query.contains('preferred_listing_types', [mappedCategory]);
                }

                if (swipedProfileIds.size > 0) {
                    const idList = Array.from(swipedProfileIds)
                        .filter(id => id && typeof id === 'string' && id.length > 30)
                        .map(id => id.trim())
                        .slice(0, 150); // URL SAFETY: Prevent 400
                    if (idList.length > 0) {
                        query = query.not('user_id', 'in', `(${idList.join(',')})`);
                    }
                }

                const { data: profiles, error } = await query.range(page * pageSize, (page + 1) * pageSize - 1);
                if (error) throw error;

                const validSwipedList = Array.from(swipedProfileIds)
                    .filter(id => id && typeof id === 'string' && id.length > 30)
                    .map(id => id.trim())
                    .slice(0, 150); // URL SAFETY: Prevent 400
                
                const swipeInClause = validSwipedList.length > 0 
                  ? `(${validSwipedList.join(',')})` 
                  : `(00000000-0000-0000-0000-000000000000)`;

                const { data: discovery } = await supabase
                    .from('profiles')
                    .select(CLIENT_FIELDS)
                    .neq('user_id', userId)
                    .eq('role', 'client')
                    .eq('is_active', true)
                    .eq('onboarding_completed', true)
                    .not('user_id', 'in', swipeInClause)
                    .order('created_at', { ascending: false })
                    .limit(2);

                const finalProfiles = [...(profiles || [])];
                discovery?.forEach(d => {
                    if (!finalProfiles.find(p => p.user_id === d.user_id)) {
                        (d as any)._isDiscovery = true;
                        finalProfiles.push(d);
                    }
                });

                if (finalProfiles.length === 0) return [];

                const userIds = finalProfiles.map(p => p.user_id);
                const { data: cpData } = await supabase
                    .from('client_profiles')
                    .select('user_id, age, gender, city, country, preferred_activities, profile_images, interests, roommate_available, work_schedule, name')
                    .in('user_id', userIds);

                const cpMap = new Map(cpData?.map(cp => [cp.user_id, cp]) || []);

                let results = (finalProfiles as any[]).map(p => {
                    const cp = cpMap.get(p.user_id);
                    return {
                        id: p.user_id, // uuid string
                        user_id: p.user_id,
                        name: p.full_name || cp?.name || 'User',
                        age: p.age || cp?.age || 0,
                        gender: p.gender || cp?.gender || '',
                        interests: p.interests || cp?.interests || [],
                        preferred_activities: cp?.preferred_activities || [],
                        location: { city: p.city || cp?.city },
                        lifestyle_tags: (p as any).lifestyle_tags || (cp as any)?.lifestyle_tags || [],
                        profile_images: p.images || cp?.profile_images || ['/placeholder.svg'],
                        matchPercentage: 80,
                        matchReasons: ['Profile available'],
                        incompatibleReasons: [],
                        verified: !!p.onboarding_completed,
                        roommate_available: !!cp?.roommate_available,
                        city: p.city || cp?.city,
                        country: p.country || cp?.country,
                        work_schedule: p.work_schedule || cp?.work_schedule
                    } as MatchedClientProfile;
                });

                if (isRoommateSection) {
                    results = results.filter(r => r.roommate_available || (r as any)._isDiscovery);
                }

                return results.sort((a, b) => b.matchPercentage - a.matchPercentage);
            } catch (err) {
                logger.error('[SmartClientMatching] Error:', err);
                return [];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
    });
}
