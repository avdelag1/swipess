import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/sonner';

interface LikeNotificationActionParams {
  notificationId: string;
  likerId: string;
  targetId: string;
  targetType: 'listing' | 'profile';
  action: 'accept' | 'reject';
}

export function useLikeNotificationActions() {
  const acceptLikeMutation = useMutation({
    mutationFn: async ({
      notificationId,
      likerId,
      targetId,
      targetType,
    }: Omit<LikeNotificationActionParams, 'action'>) => {

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Determine roles
      // matches table has: user_id (client/swiper), owner_id, listing_id
      let matchUserId = '';
      let matchOwnerId = '';
      let listingId = '';

      if (targetType === 'listing') {
        // likerId is client, user is owner
        matchUserId = likerId;
        matchOwnerId = user.id;
        listingId = targetId;
      } else {
        // likerId is owner, user is client
        matchUserId = user.id;
        matchOwnerId = likerId;
      }

      // Create match (matches table: id, user_id, owner_id, listing_id, created_at)
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id')
        .eq('user_id', matchUserId)
        .eq('owner_id', matchOwnerId)
        .maybeSingle();

      let matchId = existingMatch?.id;

      if (!existingMatch && listingId) {
        const { data: newMatch, error: insertError } = await supabase
          .from('matches')
          .insert([{
            user_id: matchUserId,
            owner_id: matchOwnerId,
            listing_id: listingId,
          }])
          .select('id')
          .single();

        if (insertError) throw insertError;
        matchId = newMatch?.id;
      }

      // Create conversation for chat
      // conversations table: client_id, owner_id, listing_id
      const clientId = matchUserId;
      const ownerId = matchOwnerId;

      const { data: existingConversation } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', clientId)
        .eq('owner_id', ownerId)
        .maybeSingle();

      let conversationId = existingConversation?.id;
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert([{
            client_id: clientId,
            owner_id: ownerId,
            listing_id: listingId || null,
          }])
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConversation?.id;
      }

      // Mark notification as read (notifications has: is_read, NO read_at)
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      // Send reciprocal notification
      await supabase.rpc('create_notification_for_user', {
        p_user_id: likerId,
        p_notification_type: 'new_match',
        p_title: '💕 It\'s a Match!',
        p_message: 'Someone accepted your like. Start chatting now!',
        p_related_user_id: user.id,
        p_metadata: { conversationId, matchId }
      });

      return { conversationId, matchId };
    },
    onSuccess: (_data) => {
      toast({
        title: "It's a Match!",
        description: "You can now chat with them. Opening conversation...",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to accept like. Please try again.",
        variant: "destructive"
      });
    }
  });

  const rejectLikeMutation = useMutation({
    mutationFn: async ({ notificationId }: { notificationId: string }) => {
      // Just mark notification as read (no read_at column)
      await supabase
        .from('notifications')
        .update({ is_read: true })
        .eq('id', notificationId);
    },
    onSuccess: () => {
      toast({
        title: "Notification dismissed",
        description: "You can still see them in your activity.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to dismiss notification.",
        variant: "destructive"
      });
    }
  });

  return {
    acceptLike: acceptLikeMutation.mutate,
    rejectLike: rejectLikeMutation.mutate,
    isAccepting: acceptLikeMutation.isPending,
    isRejecting: rejectLikeMutation.isPending,
    acceptingError: acceptLikeMutation.error,
    rejectingError: rejectLikeMutation.error,
  };
}
