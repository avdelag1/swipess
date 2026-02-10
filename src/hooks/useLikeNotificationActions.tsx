import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

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
      let clientId = '';
      let ownerId = '';
      let listingId = '';

      if (targetType === 'listing') {
        // likerId is client, user is owner
        clientId = likerId;
        ownerId = user.id;
        listingId = targetId;
      } else {
        // likerId is owner, user is client
        clientId = user.id;
        ownerId = likerId;
      }

      // Create or update match
      const { data: existingMatch } = await supabase
        .from('matches')
        .select('id, status')
        .eq('client_id', clientId)
        .eq('owner_id', ownerId)
        .maybeSingle();

      if (existingMatch) {
        // Update existing match
        const { error: updateError } = await supabase
          .from('matches')
          .update({
            status: 'active',
            updated_at: new Date().toISOString()
          })
          .eq('id', existingMatch.id);

        if (updateError) throw updateError;
      } else {
        // Create new match
        const { error: insertError } = await supabase
          .from('matches')
          .insert([{
            client_id: clientId,
            owner_id: ownerId,
            listing_id: listingId || null,
            status: 'active',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);

        if (insertError) throw insertError;
      }

      // Create conversation for chat
      const { data: conversations } = await supabase
        .from('conversations')
        .select('id')
        .eq('client_id', clientId)
        .eq('owner_id', ownerId)
        .maybeSingle();

      let conversationId = conversations?.id;
      if (!conversationId) {
        const { data: newConversation, error: convError } = await supabase
          .from('conversations')
          .insert([{
            client_id: clientId,
            owner_id: ownerId,
            listing_id: listingId || null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }])
          .select('id')
          .single();

        if (convError) throw convError;
        conversationId = newConversation?.id;
      }

      // Mark notification as read
      await supabase
        .from('notifications')
        .update({ is_read: true, read_at: new Date().toISOString() })
        .eq('id', notificationId);

      // Send reciprocal notification
      await supabase.from('notifications').insert([{
        user_id: likerId,
        notification_type: 'new_match',
        title: '💕 It\'s a Match!',
        message: 'Someone accepted your like. Start chatting now!',
        related_user_id: user.id,
        related_match_id: existingMatch?.id,
        metadata: { conversationId }
      }] as any);

      return { conversationId, matchId: existingMatch?.id };
    },
    onSuccess: (data) => {
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

      // Just mark notification as read/archived
      await supabase
        .from('notifications')
        .update({
          is_read: true,
          read_at: new Date().toISOString()
        })
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
