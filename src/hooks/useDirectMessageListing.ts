import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

interface DirectMessageParams {
  listingId: string;
  ownerId: string;
  listingTitle: string;
  listingCategory: string;
  initialMessage?: string;
}

/**
 * Hook for direct messaging on Motorcycles and Bicycles listings
 * These categories have FREE messaging - no activation required
 */
export function useDirectMessageListing() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  // Categories that qualify for free direct messaging
  const FREE_MESSAGING_CATEGORIES = ['motorcycle', 'bicycle'];

  const isFreeMessagingCategory = (category: string) => {
    return FREE_MESSAGING_CATEGORIES.includes(category?.toLowerCase());
  };

  const directMessageMutation = useMutation({
    mutationFn: async ({
      listingId,
      ownerId,
      listingTitle,
      listingCategory,
      initialMessage
    }: DirectMessageParams) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Verify this is a free messaging category
      if (!isFreeMessagingCategory(listingCategory)) {
        throw new Error('Direct messaging is only available for Motorcycles and Bicycles');
      }

      // Check if user is trying to message themselves
      if (user.id === ownerId) {
        throw new Error('You cannot message yourself');
      }

      // Check if conversation already exists for this listing
      const { data: existingConversations, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},owner_id.eq.${ownerId}),and(client_id.eq.${ownerId},owner_id.eq.${user.id})`)
        .eq('listing_id', listingId);

      if (existingError) {
        logger.error('Error checking existing conversations:', existingError);
        throw new Error('Failed to check existing conversations');
      }

      // If conversation exists for this listing, return existing conversation
      if (existingConversations && existingConversations.length > 0) {
        return {
          conversationId: existingConversations[0].id,
          isExisting: true
        };
      }

      // Create new conversation with free_messaging flag
      const { data: newConversation, error: conversationError } = await supabase
        .from('conversations')
        .insert({
          client_id: user.id,
          owner_id: ownerId,
          listing_id: listingId,
          match_id: null,
          status: 'active',
          free_messaging: true
        })
        .select()
        .single();

      if (conversationError) {
        logger.error('Error creating conversation:', conversationError);
        throw new Error(`Failed to create conversation: ${conversationError.message}`);
      }

      // Create match record for tracking
      try {
        await supabase
          .from('matches')
          .insert({
            client_id: user.id,
            owner_id: ownerId,
            listing_id: listingId,
            status: 'active'
          });
      } catch (matchError) {
        // Match creation failed but conversation was created - continue
        logger.error('Match creation failed (non-blocking):', matchError);
      }

      // Send initial message
      const messageText = initialMessage ||
        `Hi! I'm interested in your ${listingCategory}: "${listingTitle}". Is it still available?`;

      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: newConversation.id,
          sender_id: user.id,
          message_text: messageText,
          message_type: 'text'
        })
        .select()
        .single();

      if (messageError) {
        logger.error('Error sending initial message:', messageError);
        throw new Error(`Failed to send message: ${messageError.message}`);
      }

      // Update conversation last_message_at
      await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', newConversation.id);

      return {
        conversationId: newConversation.id,
        message,
        isExisting: false
      };
    },
    onSuccess: async (data) => {
      await queryClient.invalidateQueries({ queryKey: ['conversations'] });

      toast({
        title: data.isExisting ? '💬 Opening Conversation' : '💬 Message Sent!',
        description: data.isExisting
          ? 'Redirecting to your existing conversation...'
          : 'Free messaging for Motos & Bicycles! Redirecting to chat...',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Failed to Send Message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  return {
    sendDirectMessage: directMessageMutation.mutateAsync,
    isLoading: directMessageMutation.isPending,
    isFreeMessagingCategory,
    FREE_MESSAGING_CATEGORIES
  };
}
