import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/utils/prodLogger';
import { MatchedClientProfile, ClientFilters } from './types';

export function useSmartClientMatching(
    userId?: string, // PERF: Accept userId to avoid getUser() inside queryFn
    category?: 'property' | 'moto' | 'bicycle',
    page: number = 0,
    pageSize: number = 10,
    isRefreshMode: boolean = false, // When true, show disliked profiles within cooldown
    filters?: ClientFilters
) {
    // Serialize filters to string for stable query key
    const filtersKey = filters ? JSON.stringify(filters) : '';

    return useQuery<MatchedClientProfile[]>({
        queryKey: ['smart-clients', userId, category, page, isRefreshMode, filtersKey],
        staleTime: 10 * 60 * 1000, // 10 minutes - profiles are stable
        gcTime: 15 * 60 * 1000,
        placeholderData: (prev: any) => prev,
        queryFn: async () => {
            if (!userId) {
                logger.warn('[SmartMatching] No userId provided, returning empty profiles');
                return [] as MatchedClientProfile[];
            }

            if (typeof userId !== 'string' || userId.trim() === '') {
                logger.error('[SmartMatching] Invalid userId:', userId);
                return [] as MatchedClientProfile[];
            }

            try {
                logger.info('[SmartMatching] Fetching client profiles for owner:', userId);

                // Fetch liked clients
                const { data: ownerLikedClients, error: ownerLikesError } = await supabase
                    .from('likes')
                    .select('target_id')
                    .eq('user_id', userId)
                    .eq('target_type', 'profile')
                    .eq('direction', 'right');

                const likedIds = new Set<string>();
                if (!ownerLikesError && ownerLikedClients) {
                    for (const row of ownerLikedClients) {
                        if (row.target_id) likedIds.add(row.target_id);
                    }
                }

                // Fetch left swipes with timestamps for 3-day expiry logic
                const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

                const { data: leftSwipes } = await supabase
                    .from('likes')
                    .select('target_id, created_at')
                    .eq('user_id', userId)
                    .eq('target_type', 'profile')
                    .eq('direction', 'left');

                const permanentlyHiddenIds = new Set<string>();
                const refreshableDislikeIds = new Set<string>();

                if (leftSwipes) {
                    for (const swipe of leftSwipes) {
                        const swipeDate = new Date(swipe.created_at);
                        const threeDaysAgoDate = new Date(threeDaysAgo);

                        if (swipeDate < threeDaysAgoDate) {
                            permanentlyHiddenIds.add(swipe.target_id);
                        } else {
                            refreshableDislikeIds.add(swipe.target_id);
                        }
                    }
                }

                // Build exclusion set
                const swipedProfileIds = new Set<string>();
                for (const id of likedIds) swipedProfileIds.add(id);
                for (const id of permanentlyHiddenIds) swipedProfileIds.add(id);
                if (!isRefreshMode) {
                    for (const id of refreshableDislikeIds) swipedProfileIds.add(id);
                }

                const CLIENT_SWIPE_CARD_FIELDS = `
          user_id, full_name, age, gender, city, country, images, avatar_url,
          interests, lifestyle_tags, smoking, work_schedule, nationality,
          languages_spoken, neighborhood, bio, onboarding_completed
        `;

                let profileQuery = supabase
                    .from('profiles')
                    .select(CLIENT_SWIPE_CARD_FIELDS)
                    .neq('user_id', userId);

                if (swipedProfileIds.size > 0) {
                    const idsToExclude = Array.from(swipedProfileIds);
                    profileQuery = profileQuery.not('user_id', 'in', `(${idsToExclude.map(id => `"${id}"`).join(',')})`);
                }

                const start = page * pageSize;
                const end = start + pageSize - 1;
                const { data: profiles, error: profileError } = await profileQuery.range(start, end);

                if (profileError) {
                    logger.error('[SmartMatching] Error fetching client profiles:', {
                        message: profileError.message,
                        code: profileError.code,
                        details: profileError.details,
                        hint: profileError.hint
                    });
                    return [] as MatchedClientProfile[];
                }

                if (!profiles?.length) {
                    return [] as MatchedClientProfile[];
                }

                // Fetch supplementary data from client_profiles
                const { data: clientProfileData } = await supabase
                    .from('client_profiles')
                    .select('user_id, name, age, gender, city, country, profile_images, bio, interests, nationality, languages, neighborhood')
                    .limit(200);

                const clientProfileMap = new Map<string, any>();
                if (clientProfileData) {
                    for (const cp of clientProfileData) {
                        clientProfileMap.set(cp.user_id, cp);
                    }
                }

                // Map profiles with enriched data
                let filteredProfiles = (profiles as any[])
                    .filter(profile => {
                        if (profile.user_id === userId) {
                            logger.warn('[SmartMatching] CRITICAL: Own profile leaked through DB query');
                            return false;
                        }
                        return true;
                    })
                    .map(profile => {
                        const cpData = clientProfileMap.get(profile.user_id);
                        const name = profile.full_name || cpData?.name || 'New User';
                        const images = (profile.images && (profile.images as any[]).length > 0)
                            ? profile.images
                            : (cpData?.profile_images && (cpData.profile_images as any[]).length > 0)
                                ? cpData.profile_images
                                : ['/placeholder-avatar.svg'];
                        return {
                            ...profile,
                            full_name: name,
                            images,
                            age: profile.age || cpData?.age || null,
                            gender: profile.gender || cpData?.gender || null,
                            city: profile.city || cpData?.city || null,
                            country: profile.country || cpData?.country || null,
                            bio: profile.bio || cpData?.bio || null,
                            nationality: profile.nationality || cpData?.nationality || null,
                            neighborhood: profile.neighborhood || cpData?.neighborhood || null,
                            interests: profile.interests?.length > 0 ? profile.interests : cpData?.interests || [],
                            languages_spoken: profile.languages_spoken?.length > 0 ? profile.languages_spoken : cpData?.languages || [],
                        };
                    });

                // Apply client filters if provided
                if (filters) {
                    filteredProfiles = filteredProfiles.filter(profile => {
                        if (filters.budgetRange && Array.isArray(filters.budgetRange) && filters.budgetRange.length === 2) {
                            const clientBudget = profile.budget_max || profile.monthly_income || 0;
                            if (clientBudget < filters.budgetRange[0] || clientBudget > filters.budgetRange[1]) return false;
                        }

                        if (filters.ageRange && Array.isArray(filters.ageRange) && filters.ageRange.length === 2 && profile.age) {
                            if (profile.age < filters.ageRange[0] || profile.age > filters.ageRange[1]) return false;
                        }

                        if (filters.genders && filters.genders.length > 0 && profile.gender) {
                            if (!filters.genders.includes(profile.gender.toLowerCase())) return false;
                        }

                        if ((filters as any).clientGender && (filters as any).clientGender !== 'any' && profile.gender) {
                            if (profile.gender.toLowerCase() !== (filters as any).clientGender.toLowerCase()) return false;
                        }

                        if ((filters as any).clientType && (filters as any).clientType !== 'all' && profile.preferred_listing_type) {
                            const clientType = (filters as any).clientType;
                            const lookingFor = clientType === 'buy' ? 'sale' : clientType;
                            if (profile.preferred_listing_type !== lookingFor) return false;
                        }

                        if ((filters as any).categories && (filters as any).categories.length > 0) {
                            const categories = (filters as any).categories;
                            let hasMatchingCategory = false;
                            for (const cat of categories) {
                                if (cat === 'property' && profile.preferred_property_types?.length > 0) { hasMatchingCategory = true; break; }
                                if (cat === 'motorcycle' && profile.preferred_listing_type?.includes('moto')) { hasMatchingCategory = true; break; }
                                if (cat === 'bicycle' && profile.preferred_listing_type?.includes('bicycle')) { hasMatchingCategory = true; break; }
                                if (cat === 'services') { hasMatchingCategory = true; break; }
                            }
                            if (!hasMatchingCategory) return false;
                        }

                        if (filters.hasPets !== undefined && profile.has_pets !== undefined) {
                            if (filters.hasPets !== profile.has_pets) return false;
                        }
                        if (filters.smoking !== undefined && profile.smoking !== undefined) {
                            if (filters.smoking !== profile.smoking) return false;
                        }
                        if (filters.partyFriendly !== undefined && profile.party_friendly !== undefined) {
                            if (filters.partyFriendly !== profile.party_friendly) return false;
                        }
                        if (filters.verified && !profile.verified) return false;

                        if (filters.nationalities?.length && profile.nationality) {
                            if (!filters.nationalities.includes(profile.nationality)) return false;
                        }
                        if (filters.languages?.length && profile.languages) {
                            if (!filters.languages.some(lang => profile.languages.includes(lang))) return false;
                        }
                        if (filters.relationshipStatus?.length && profile.relationship_status) {
                            if (!filters.relationshipStatus.includes(profile.relationship_status)) return false;
                        }
                        if (filters.interests?.length && profile.interests) {
                            if (!filters.interests.some(interest => profile.interests.includes(interest))) return false;
                        }
                        if (filters.lifestyleTags?.length && profile.lifestyle_tags) {
                            if (!filters.lifestyleTags.some(tag => profile.lifestyle_tags.includes(tag))) return false;
                        }

                        return true;
                    });
                }

                // Calculate match scores
                const matchedClients: MatchedClientProfile[] = filteredProfiles.map(profile => {
                    const matchReasons: string[] = [];
                    let baseScore = 50;

                    if (profile.full_name) baseScore += 5;
                    if (profile.age) baseScore += 5;
                    if (profile.city) baseScore += 5;
                    if (profile.interests?.length > 0) baseScore += 10;
                    if (profile.verified) baseScore += 15;
                    if (profile.images?.length > 0) baseScore += 10;

                    if (profile.verified) matchReasons.push('Verified profile');
                    if (profile.interests?.length > 0) matchReasons.push(`${profile.interests.length} interests`);
                    if (profile.city) matchReasons.push(`Located in ${profile.city}`);

                    return {
                        id: profile.id,
                        user_id: profile.user_id || profile.id,
                        name: profile.full_name || 'Anonymous',
                        age: profile.age || 0,
                        gender: profile.gender || '',
                        interests: profile.interests || [],
                        preferred_activities: [],
                        location: profile.city ? { city: profile.city } : {},
                        lifestyle_tags: profile.lifestyle_tags || [],
                        profile_images: profile.images || [],
                        preferred_listing_types: [],
                        budget_min: 0,
                        budget_max: 100000,
                        matchPercentage: Math.min(100, baseScore),
                        matchReasons: matchReasons.length > 0 ? matchReasons : ['Profile available'],
                        incompatibleReasons: [],
                        city: profile.city || undefined,
                        country: profile.country || undefined,
                        avatar_url: profile.avatar_url || undefined,
                        verified: false,
                        work_schedule: profile.work_schedule || undefined,
                        nationality: profile.nationality || undefined,
                        languages: profile.languages_spoken || undefined,
                        neighborhood: profile.neighborhood || undefined,
                    } as MatchedClientProfile;
                });

                // Sort by match percentage
                const sortedClients = matchedClients.sort((a, b) => b.matchPercentage - a.matchPercentage);

                // Verify none of the returned profiles are the user's own
                const hasOwnProfile = sortedClients.some(p => p.user_id === userId);
                if (hasOwnProfile) {
                    logger.error('[SmartMatching] CRITICAL BUG: User\'s own profile in results!');
                    return sortedClients.filter(p => p.user_id !== userId);
                }

                return sortedClients;
            } catch (error) {
                logger.error('[useSmartClientMatching] Error loading client profiles', error);
                return [] as MatchedClientProfile[];
            }
        },
        enabled: !!userId,
        refetchOnWindowFocus: false,
        refetchOnMount: 'always' as const,
        refetchOnReconnect: false,
        retry: 1,
        retryDelay: 1000,
    });
}
