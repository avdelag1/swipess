import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useAuth } from '@/hooks/useAuth';
import { logger } from '@/utils/prodLogger';

interface SwipeWithMatchOptions {
  onMatch?: (clientProfile: any, ownerProfile: any) => void;
}

export function useSwipeWithMatch(options?: SwipeWithMatchOptions) {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      targetId, 
      direction, 
      targetType 
    }: { 
      targetId: string; 
      direction: 'left' | 'right'; 
      targetType: 'listing' | 'profile' 
    }) => {
      // Defensive auth check
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (!currentUser?.id || !user?.id) {
        logger.error('Auth check failed:', { currentUser: currentUser?.id, user: user?.id });
        throw new Error('User not authenticated. Please refresh the page.');
      }

      // CRITICAL: Prevent self-likes (should never happen due to query filtering, but defense in depth)
      if (targetType === 'profile' && targetId === user.id) {
        logger.error('[useSwipeWithMatch] CRITICAL: Attempted self-like - profile filter failed!', { userId: user.id, targetId });
        throw new Error('You cannot like your own profile');
      }

      // CRITICAL: Also check for own listings
      if (targetType === 'listing') {
        // We need to verify the listing doesn't belong to the user
        // This should already be filtered by the query, but double-check
        const { data: listing } = await supabase
          .from('listings')
          .select('owner_id')
          .eq('id', targetId)
          .maybeSingle();

        if (listing && listing.owner_id === user.id) {
          logger.error('[useSwipeWithMatch] CRITICAL: Attempted to like own listing - filter failed!', { userId: user.id, listingId: targetId });
          throw new Error('You cannot like your own listing');
        }
      }

      let like: any;

      if (targetType === 'profile') {
        // Owner swiping on a client profile
        if (direction === 'right') {
          logger.info('[useSwipeWithMatch] Saving owner like for client:', { ownerId: user.id, clientId: targetId });

          // CRITICAL: Verify the client_id exists in profiles table before inserting
          // This prevents FK violations from stale cached profile data
          const { data: clientExists, error: verifyError } = await supabase
            .from('profiles')
            .select('id, full_name, is_active, city')
            .eq('id', targetId)
            .maybeSingle();

          if (verifyError) {
            logger.error('[useSwipeWithMatch] Error verifying client profile:', {
              clientId: targetId,
              error: verifyError.message,
              errorCode: verifyError.code,
              hint: verifyError.hint
            });
            // RLS or permission error - throw to show user
            throw new Error(`Unable to save like: ${verifyError.message}`);
          }

          if (!clientExists) {
            logger.error('[useSwipeWithMatch] Client profile not found in database:', {
              clientId: targetId,
              hint: 'Profile may have been deleted or deactivated'
            });
            // Profile doesn't exist - throw to notify user
            throw new Error('This user profile is no longer available');
          }

          // Check if profile is active
          if (clientExists.is_active === false) {
            logger.warn('[useSwipeWithMatch] Attempted to like inactive profile:', {
              clientId: targetId,
              fullName: clientExists.full_name
            });
            throw new Error('This user is no longer active');
          }

          // For owner → client likes, use likes table with target_type='profile'
          // First, check if like already exists
          const { data: existingLike } = await supabase
            .from('likes')
            .select('id')
            .eq('user_id', user.id)
            .eq('target_id', targetId)
            .eq('target_type', 'profile')
            .maybeSingle();

          let ownerLike;
          let ownerLikeError;

          if (existingLike) {
            // Update existing like (just update the timestamp)
            const result = await supabase
              .from('likes')
              .update({ created_at: new Date().toISOString() })
              .eq('id', existingLike.id)
              .select()
              .single();
            ownerLike = result.data;
            ownerLikeError = result.error;
          } else {
            // Insert new like
            const result = await supabase
              .from('likes')
              .insert({
                user_id: user.id,
                target_id: targetId,
                target_type: 'profile',
                direction: 'right'
              })
              .select()
              .single();
            ownerLike = result.data;
            ownerLikeError = result.error;
          }

          if (ownerLikeError) {
            // Handle expected errors gracefully (unique constraint violations, RLS, FK violations)
            const errorCode = ownerLikeError.code;
            const isUniqueViolation = errorCode === '23505';
            const isRLSViolation = errorCode === '42501';
            const isFKViolation = errorCode === '23503'; // FK constraint violation

            if (isUniqueViolation) {
              // This is fine - user already liked this client, just log and continue
              logger.info('[useSwipeWithMatch] Like already exists (unique constraint), treating as success');
              // Return existing like data or create minimal response
              like = { id: 'existing', user_id: user.id, target_id: targetId };
            } else if (isRLSViolation) {
              // RLS policy violation - log but don't crash the swipe flow
              logger.warn('[useSwipeWithMatch] RLS policy blocked like insert, continuing without save:', ownerLikeError.message);
              like = { id: 'rls-blocked', user_id: user.id, target_id: targetId };
            } else if (isFKViolation) {
              // FK violation means the target_id doesn't exist in profiles table
              // This happens with stale cached data - skip without error
              logger.warn('[useSwipeWithMatch] FK violation - client profile not in database (stale cache):', {
                clientId: targetId,
                error: ownerLikeError.message
              });
              like = { id: 'fk-violation', user_id: user.id, target_id: targetId, skipped: true };
            } else {
              // Unexpected error - log and throw
              logger.error('[useSwipeWithMatch] Failed to save owner like:', {
                error: ownerLikeError,
                ownerId: user.id,
                clientId: targetId,
                errorCode: ownerLikeError.code,
                errorMessage: ownerLikeError.message
              });
              throw ownerLikeError;
            }
          } else {
            // FIXED: Only set like = ownerLike when there was NO error
            // Previously this ran unconditionally and overwrote error-case values
            logger.info('[useSwipeWithMatch] Successfully saved owner like:', ownerLike);
            like = ownerLike;
          }

          // IMPORTANT: Send notification to the liked client
          // Get owner's profile info for the notification
          const { data: ownerProfile } = await supabase
            .from('profiles')
            .select('full_name, avatar_url')
            .eq('id', user.id)
            .maybeSingle();

          const ownerName = ownerProfile?.full_name || 'Someone';

          // Create in-app notification for the client
          supabase.from('notifications').insert([{
            user_id: targetId,
            notification_type: 'new_like',
            title: '🔥 New Flame!',
            message: `${ownerName} liked your profile!`,
            is_read: false
          }]).then(
            () => logger.info('[useSwipeWithMatch] Notification saved for client:', targetId),
            (err) => logger.error('[useSwipeWithMatch] Failed to save notification:', err)
          );

          // Trigger push notification (fire-and-forget)
          supabase.functions.invoke('send-push-notification', {
            body: {
              user_id: targetId,
              title: '🔥 New Flame!',
              body: `${ownerName} liked your profile!`,
              data: { type: 'like', liker_id: user.id }
            }
          }).then(
            () => logger.info('[useSwipeWithMatch] Push notification sent to client:', targetId),
            (err) => logger.error('[useSwipeWithMatch] Push notification failed:', err)
          );
        } else {
          // For left swipes (dislikes), use likes table with direction='dismiss'
          const { error: dismissError } = await supabase
            .from('likes')
            .upsert({
              user_id: user.id,
              target_id: targetId,
              target_type: targetType as 'listing' | 'profile',
              direction: 'left'
            }, {
              onConflict: 'user_id,target_id,target_type',
              ignoreDuplicates: false
            });

          if (dismissError) {
            logger.error('Error saving dislike:', dismissError);
            throw dismissError;
          }
          like = { id: 'dismissed' };
        }
      } else {
        // Client swiping on a listing
        if (direction === 'right') {
          // Client likes a listing - save to likes table
          // SCHEMA: target_id = listing ID, target_type = 'listing', direction = 'like'
          const { data: clientLike, error: likeError } = await supabase
            .from('likes')
            .upsert({
              user_id: user.id,
              target_id: targetId,
              target_type: 'listing',
              direction: 'right'
            }, {
              onConflict: 'user_id,target_id,target_type',
              ignoreDuplicates: false
            })
            .select()
            .single();

          if (likeError) {
            logger.error('Error saving like:', likeError);
            throw likeError;
          }
          like = clientLike;

          // IMPORTANT: Notify listing owner when client likes their listing
          // Get listing owner and client info for notification
          const [listingResult, clientResult] = await Promise.all([
            supabase.from('listings').select('owner_id, title').eq('id', targetId).maybeSingle(),
            supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
          ]);

          if (listingResult.data?.owner_id) {
            const clientName = clientResult.data?.full_name || 'Someone';
            const listingTitle = listingResult.data.title || 'your listing';

            // Create in-app notification for the owner
            supabase.from('notifications').insert([{
              user_id: listingResult.data.owner_id,
              notification_type: 'new_like',
              title: '🔥 New Flame!',
              message: `${clientName} liked ${listingTitle}!`,
              is_read: false
            }]).then(
              () => logger.info('[useSwipeWithMatch] Notification sent to owner:', listingResult.data.owner_id),
              (err) => logger.error('[useSwipeWithMatch] Failed to notify owner:', err)
            );

            // Trigger push notification (fire-and-forget)
            supabase.functions.invoke('send-push-notification', {
              body: {
                user_id: listingResult.data.owner_id,
                title: '🔥 New Flame!',
                body: `${clientName} liked ${listingTitle}!`,
                data: { type: 'like', liker_id: user.id, listing_id: targetId }
              }
            }).catch(err => logger.error('[useSwipeWithMatch] Push to owner failed:', err));
          }
        } else {
          // Client left swipe on listing - save dismissal using likes table
          const { error: dismissError } = await supabase
            .from('likes')
            .upsert({
              user_id: user.id,
              target_id: targetId,
              target_type: 'listing',
              direction: 'left'
            }, {
              onConflict: 'user_id,target_id,target_type',
              ignoreDuplicates: false
            });

          if (dismissError) {
            logger.error('Error saving listing dislike:', dismissError);
            throw dismissError;
          }
          like = { id: 'dismissed' };
        }
      }

      // OPTIMISTIC: Return immediately after saving swipe
      // Fire-and-forget match detection in background - don't block UI
      if (direction === 'right') {
        // Background match detection - non-blocking
        detectAndCreateMatch({
          targetId,
          targetType,
          userId: user.id,
          onMatch: options?.onMatch
        }).catch(err => {
          // Match errors are non-critical - user can see matches later
          logger.error('[useSwipeWithMatch] Background match detection failed:', err);
        });
      }

      return like;
    },
    onSuccess: (data, variables) => {
      // OPTIMIZED: Invalidate relevant queries based on swipe type
      const isLike = variables.direction === 'right';
      const isDislike = variables.direction === 'left';

      if (isLike && variables.targetType === 'profile') {
        // Owner swiping right on client - invalidate liked-clients cache so it shows in the list
        const invalidations = [
          queryClient.invalidateQueries({ queryKey: ['matches'] }),
          queryClient.invalidateQueries({ queryKey: ['liked-clients'] }),
          queryClient.invalidateQueries({ queryKey: ['owner-stats'] }),
        ];
        Promise.all(invalidations).catch(() => {});
      } else if (isLike && variables.targetType === 'listing') {
        // Client liking listing - cache is updated manually in TinderentSwipeContainer after DB save
        // Only invalidate matches to detect new matches (don't invalidate liked-properties to avoid refetch race)
        queryClient.invalidateQueries({ queryKey: ['matches'] }).catch(() => {});
      } else if (isDislike) {
        // Invalidate dislikes cache so the disliked profiles are excluded from future fetches
        const invalidations = [
          queryClient.invalidateQueries({ queryKey: ['client-profiles'] }),
        ];
        Promise.all(invalidations).catch(() => {});
      }
    },
    onError: (error) => {
      logger.error('Swipe error:', error);
      // Only show error toast for critical failures (auth, network), not for edge cases
      if (error instanceof Error && (error.message.includes('auth') || error.message.includes('network'))) {
        toast.error("Something went wrong. Please try again.");
      }
    }
  });
}

// Background async match detection - doesn't block swipe UI
async function detectAndCreateMatch({
  targetId,
  targetType,
  userId,
  onMatch
}: {
  targetId: string;
  targetType: 'listing' | 'profile';
  userId: string;
  onMatch?: (clientProfile: any, ownerProfile: any) => void;
}) {
  let mutualLike = null;
  let matchClientId: string;
  let matchOwnerId: string;
  let matchListingId: string | null = null;

  if (targetType === 'listing') {
    // Client swiping on a listing
    const { data: listing } = await supabase
      .from('listings')
      .select('owner_id')
      .eq('id', targetId)
      .maybeSingle();

    if (!listing) {
      logger.error('Listing not found');
      return;
    }

    matchClientId = userId;  // Current user is the client
    matchOwnerId = listing.owner_id;  // Listing owner
    matchListingId = targetId;  // The listing

    // Check if owner liked this client (in likes table with target_type='profile')
    const { data: ownerLike } = await supabase
      .from('likes')
      .select('*')
      .eq('user_id', listing.owner_id)
      .eq('target_id', userId)
      .eq('target_type', 'profile')
      .maybeSingle();

    mutualLike = ownerLike;
  } else {
    // Owner swiping on a client profile
    matchClientId = targetId;  // Target is the client
    matchOwnerId = userId;  // Current user is the owner

    // Get owner's listings to check if client liked any of them
    const { data: ownerListings } = await supabase
      .from('listings')
      .select('id')
      .eq('owner_id', userId);

    if (ownerListings && ownerListings.length > 0) {
      const listingIds = ownerListings.map(l => l.id);

      // Check if client liked any of the owner's listings
      // SCHEMA: target_id = listing ID, target_type = 'listing', direction = 'like'
      const { data: clientLike } = await supabase
        .from('likes')
        .select('*')
        .eq('user_id', targetId)
        .eq('target_type', 'listing')
        .eq('direction', 'right')
        .in('target_id', listingIds)
        .limit(1)
        .maybeSingle();

      mutualLike = clientLike;
      // Use the listing that was liked for the match
      matchListingId = clientLike?.target_id || null;
    } else {
      matchListingId = null;
      mutualLike = null;
    }
  }

  if (mutualLike) {
    // It's a match! Create or update match record with retry logic
    let matchCreated = false;
    let match = null;

    for (let attempt = 1; attempt <= 3; attempt++) {
      const { data: matchData, error: matchError } = await supabase
        .from('matches')
        .upsert({
          client_id: matchClientId,
          owner_id: matchOwnerId,
          listing_id: matchListingId,
          status: 'active'
        })
        .select();

      if (!matchError || matchError.code === '23505') {
        // Success or duplicate key (which is fine)
        matchCreated = true;
        match = matchData?.[0];

        // If no match returned (duplicate was ignored), fetch the existing one
        if (!match) {
          const query = supabase
            .from('matches')
            .select()
            .eq('client_id', matchClientId)
            .eq('owner_id', matchOwnerId);

          if (matchListingId) {
            query.eq('listing_id', matchListingId);
          } else {
            query.is('listing_id', null);
          }

          const { data: existingMatch } = await query.maybeSingle();
          match = existingMatch;
        }

        break;
      }

      logger.error(`[detectAndCreateMatch] Match creation attempt ${attempt}/3 failed:`, matchError);

      if (attempt < 3) {
        // Exponential backoff: 300ms, 600ms
        await new Promise(resolve => setTimeout(resolve, attempt * 300));
      }
    }

    if (!matchCreated) {
      logger.error('[detectAndCreateMatch] Failed to create match after 3 attempts');
      toast.error("Match creation failed. Please try again.");
      return;
    }

    if (match) {
      // Create conversation explicitly after match is created
      const { error: conversationError } = await supabase
        .from('conversations')
        .upsert({
          match_id: match.id,
          client_id: match.client_id,
          owner_id: match.owner_id,
          listing_id: match.listing_id,
          status: 'active'
        });

      if (conversationError) {
        logger.error('[detectAndCreateMatch] Error creating conversation:', conversationError);
      }

      // Get profiles for match celebration with error handling
      try {
        const [clientProfile, ownerProfile] = await Promise.all([
          supabase
            .from('profiles')
            .select('*')
            .eq('id', match.client_id)
            .single(),
          supabase
            .from('profiles')
            .select('*')
            .eq('id', match.owner_id)
            .single()
        ]);

        // Trigger match celebration
        if (onMatch && clientProfile.data && ownerProfile.data) {
          onMatch(clientProfile.data, ownerProfile.data);
        }

        toast.success("🎉 It's a Match!", {
          description: "You both liked each other!"
        });
      } catch (profileError) {
        logger.error('Error fetching profiles for match:', profileError);
        toast.success("🎉 It's a Match!", {
          description: "You both liked each other!"
        });
      }
    }
  }
}
