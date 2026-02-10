import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { toast } from '@/hooks/use-toast';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { logger } from '@/utils/prodLogger';

interface Conversation {
  id: string;
  client_id: string;
  owner_id: string;
  listing_id?: string;
  last_message_at?: string;
  status: string;
  created_at: string;
  updated_at: string;
  // Joined data
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  last_message?: {
    message_text: string;
    created_at: string;
    sender_id: string;
  };
  listing?: {
    id: string;
    title: string;
    price?: number;
    images?: string[];
    category?: string;
    mode?: string;
    address?: string;
    city?: string;
  };
}

export function useConversations() {
  const { user } = useAuth();

  const query = useQuery({
    queryKey: ['conversations', user?.id],
    // INSTANT NAVIGATION: Keep previous data during refetch to prevent UI blanking
    placeholderData: (prev) => prev,
    queryFn: async () => {
      if (!user?.id) {
        return [];
      }

      try {
        // OPTIMIZED: Single query with joins instead of N+1 queries
        const { data, error } = await supabase
          .from('conversations')
          .select(`
            *,
            client_profile:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
            owner_profile:profiles!conversations_owner_id_fkey(id, full_name, avatar_url),
            listing:listings!conversations_listing_id_fkey(id, title, price, images, category, mode, address, city)
          `)
          .or(`client_id.eq.${user.id},owner_id.eq.${user.id}`)
          .order('last_message_at', { ascending: false, nullsFirst: false });

        if (error) {
          if (import.meta.env.DEV) {
            logger.error('[useConversations] Error loading conversations:', error);
          }
          // Gracefully handle auth errors
          if (error.code === '42501' || error.code === 'PGRST301') {
            return [];
          }
          throw error;
        }

        // Defensive null check
        if (!data) return [];

        // Get all conversation IDs for batch message query
        const conversationIds = data.map(c => c.id);

        if (conversationIds.length === 0) return [];

        // OPTIMIZED: Single query for all last messages instead of N queries
        const { data: messagesData, error: messagesError } = await supabase
          .from('conversation_messages')
          .select('conversation_id, message_text, created_at, sender_id')
          .in('conversation_id', conversationIds)
          .order('created_at', { ascending: false });

        if (messagesError) {
          logger.error('Error fetching conversation messages:', messagesError);
        }

        // Create a map of conversation_id to last message
        const lastMessagesMap = new Map();
        messagesData?.forEach(msg => {
          if (!lastMessagesMap.has(msg.conversation_id)) {
            lastMessagesMap.set(msg.conversation_id, msg);
          }
        });

        // Transform data to include other_user, last_message, and listing
        type ConversationRow = {
          id: string;
          client_id: string;
          owner_id: string;
          listing_id?: string;
          last_message_at?: string;
          status: string;
          created_at: string;
          updated_at: string;
          client_profile: { id: string; full_name: string; avatar_url?: string } | null;
          owner_profile: { id: string; full_name: string; avatar_url?: string } | null;
          listing: { id: string; title: string; price?: number; images?: string[]; category?: string; mode?: string; address?: string; city?: string } | null;
        };
        const conversationsWithProfiles = (data as any[]).map((conversation: any) => {
          const isClient = conversation.client_id === user.id;
          const otherUserProfile = isClient ? conversation.owner_profile : conversation.client_profile;
          // Determine role based on which side of the conversation the other user is
          const otherUserRole = isClient ? 'owner' : 'client';

          return {
            id: conversation.id,
            client_id: conversation.client_id,
            owner_id: conversation.owner_id,
            listing_id: conversation.listing_id,
            last_message_at: conversation.last_message_at,
            status: conversation.status,
            created_at: conversation.created_at,
            updated_at: conversation.updated_at,
            other_user: otherUserProfile ? {
              id: otherUserProfile.id,
              full_name: otherUserProfile.full_name,
              avatar_url: otherUserProfile.avatar_url,
              role: otherUserRole || 'client'
            } : undefined,
            last_message: lastMessagesMap.get(conversation.id),
            listing: conversation.listing || undefined
          };
        });

        return conversationsWithProfiles;
      } catch (error: unknown) {
        const err = error as { message?: string };
        // Better error handling with user-friendly messages
        if (import.meta.env.DEV) {
          logger.error('[useConversations] Error fetching conversations:', err?.message);
        }

        // For temporary auth issues, return empty array to avoid blocking UI
        if (err?.message?.includes('JWT') || err?.message?.includes('auth')) {
          return [];
        }

        throw error;
      }
    },
    enabled: !!user?.id,
    // Add staleTime for better caching
    staleTime: 30000, // 30 seconds
    // Add retry logic for temporary failures
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  // Helper to ensure a conversation is loaded in cache after creation
  // Reduced polling to prevent flickering - rely more on realtime subscriptions
  const ensureConversationInCache = async (conversationId: string, maxAttempts = 3): Promise<Conversation | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      // Check cache first without refetching
      const conversations = query.data || [];
      const conv = conversations.find((c: Conversation) => c.id === conversationId);
      if (conv) return conv;

      // Only refetch if not found and not last attempt
      if (i < maxAttempts - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        await query.refetch();
      }
    }
    return null;
  };

  // Fetch a single conversation directly by ID (when not in cache)
  const fetchSingleConversation = async (conversationId: string): Promise<Conversation | null> => {
    if (!user?.id) return null;

    try {
      const { data, error } = await (supabase as any)
        .from('conversations')
        .select(`
          *,
          client_profile:profiles!conversations_client_id_fkey(id, full_name, avatar_url),
          owner_profile:profiles!conversations_owner_id_fkey(id, full_name, avatar_url),
          listing:listings!conversations_listing_id_fkey(id, title, price, images, category, address, city)
        `)
        .eq('id', conversationId)
        .single();

      if (error || !data) {
        if (import.meta.env.DEV) {
          logger.error('[useConversations] Error fetching single conversation:', error);
        }
        return null;
      }

      // Get last message for this conversation
      const { data: messagesData } = await supabase
        .from('conversation_messages')
        .select('conversation_id, message_text, created_at, sender_id')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: false })
        .limit(1);

      const lastMessage = messagesData?.[0];

      // Transform data - handle both array and object profile responses
      const isClient = data.client_id === user.id;
      const rawOtherProfile = isClient ? data.owner_profile : data.client_profile;
      const otherUserProfile = Array.isArray(rawOtherProfile) ? rawOtherProfile[0] : rawOtherProfile;
      const otherUserRole = isClient ? 'owner' : 'client';

      return {
        id: data.id,
        client_id: data.client_id,
        owner_id: data.owner_id,
        listing_id: data.listing_id,
        last_message_at: data.last_message_at,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        other_user: otherUserProfile ? {
          id: otherUserProfile.id,
          full_name: otherUserProfile.full_name,
          avatar_url: otherUserProfile.avatar_url,
          role: otherUserRole
        } : undefined,
        last_message: lastMessage,
        listing: (data.listing && !('error' in data.listing)) ? data.listing : undefined
      };
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('[useConversations] Error fetching single conversation:', error);
      }
      return null;
    }
  };

  return {
    ...query,
    ensureConversationInCache,
    fetchSingleConversation
  };
}

export function useConversationMessages(conversationId: string) {
  return useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from('conversation_messages')
        .select(`
          *,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return (data || []) as any[];
    },
    enabled: !!conversationId,
  });
}

export function useStartConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      otherUserId, 
      listingId, 
      initialMessage,
      canStartNewConversation
    }: { 
      otherUserId: string; 
      listingId?: string; 
      initialMessage: string;
      canStartNewConversation: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Check if conversation already exists (check both directions)
      const { data: existingConversations, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},owner_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},owner_id.eq.${user.id})`);

      if (existingError) {
        if (import.meta.env.DEV) {
          logger.error('Error checking existing conversations:', existingError);
        }
        throw new Error('Failed to check existing conversations');
      }

      const existingConversation = existingConversations?.[0];

      let conversationId = existingConversation?.id;
      
      // If conversation doesn't exist, check quota
      if (!conversationId && !canStartNewConversation) {
        throw new Error('QUOTA_EXCEEDED');
      }

      if (!conversationId) {
        // IMPROVED: Determine roles using user_roles table (more reliable than checking listings)
        let myRole = 'client';
        let otherRole = 'client';

        try {
          // Check both users' roles from user_roles table
          const { data: myRoleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', user.id)
            .maybeSingle();

          const { data: otherRoleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', otherUserId)
            .maybeSingle();

          myRole = myRoleData?.role || 'client';
          otherRole = otherRoleData?.role || 'client';

          // FALLBACK: If roles not found in user_roles, check listings as backup
          if (!myRoleData) {
            const { data: myListingsData } = await supabase
              .from('listings')
              .select('id')
              .eq('owner_id', user.id)
              .limit(1);
            myRole = (myListingsData && myListingsData.length > 0) ? 'owner' : 'client';
          }

          if (!otherRoleData) {
            const { data: otherListingsData } = await supabase
              .from('listings')
              .select('id')
              .eq('owner_id', otherUserId)
              .limit(1);
            otherRole = (otherListingsData && otherListingsData.length > 0) ? 'owner' : 'client';
          }
        } catch (roleCheckError) {
          logger.error('Error checking user roles:', roleCheckError);
          // If we can't determine roles, assume the initiator is client and other is owner
          myRole = 'client';
          otherRole = 'owner';
        }

        // Determine client and owner IDs based on roles
        const clientId = myRole === 'client' ? user.id : otherUserId;
        const ownerId = myRole === 'owner' ? user.id : otherUserId;

        // Create conversation without requiring a match first (match_id is now nullable)
        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            client_id: clientId,
            owner_id: ownerId,
            listing_id: listingId,
            match_id: null, // We'll create the match after if needed
            status: 'active'
          })
          .select()
          .single();

        if (conversationError) {
          throw new Error(`Failed to create conversation: ${conversationError.message}`);
        }
        conversationId = newConversation.id;

        // Optionally create a match record for tracking purposes (but don't block conversation if it fails)
        try {
          await supabase
            .from('matches')
            .insert({
              client_id: clientId,
              owner_id: ownerId,
              listing_id: listingId,
              status: 'active'
            });
        } catch (matchError) {
          // Match creation failed, but conversation was created successfully
        }
      }

      // Send initial message
      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: initialMessage,
          message_type: 'text'
        })
        .select()
        .single();

      if (messageError) {
        throw new Error(`Failed to send message: ${messageError.message}`);
      }

      // Update conversation last_message_at
      const { error: updateError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateError) {
        logger.error('Error updating conversation timestamp:', updateError);
      }

      return { conversationId, message };
    },
    onSuccess: async (data) => {
      // Immediately refetch conversations
      await queryClient.refetchQueries({ queryKey: ['conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['conversations-started-count'] });

      toast({
        title: '💬 Conversation Started',
        description: 'Redirecting to chat...',
      });
    },
    onError: (error: Error) => {
      if (error.message === 'QUOTA_EXCEEDED') {
        // Don't show error toast - let the component handle upgrade dialog
        throw error;
      } else {
        toast({
          title: 'Failed to Send Message',
          description: error.message,
          variant: 'destructive'
        });
      }
    }
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ 
      conversationId, 
      message 
    }: { 
      conversationId: string; 
      message: string;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Create optimistic message for immediate UI update
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user.id,
        message_text: message,
        message_type: 'text',
        created_at: new Date().toISOString(),
        is_read: false,
        sender: {
          id: user.id,
          full_name: user.user_metadata?.full_name || 'You',
          avatar_url: user.user_metadata?.avatar_url
        }
      };

      // Immediately add optimistic message to UI
      queryClient.setQueryData(['conversation-messages', conversationId], (oldData: unknown[] | undefined) => {
        if (!oldData) return [optimisticMessage];
        return [...oldData, optimisticMessage];
      });

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          message_text: message,
          message_type: 'text'
        })
        .select(`
          *,
          sender:profiles!conversation_messages_sender_id_fkey (
            id,
            full_name,
            avatar_url
          )
        `)
        .single();

      if (error) {
        // Add more context to the error for debugging
        logger.error('Message insert error:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        });
        throw error;
      }

      // Update conversation last_message_at
      const { error: updateTimestampError } = await supabase
        .from('conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      if (updateTimestampError) {
        logger.error('Error updating conversation timestamp:', updateTimestampError);
      }

      return data;
    },
    onSuccess: (data, variables) => {
      // Replace optimistic message with real message
      queryClient.setQueryData(['conversation-messages', variables.conversationId], (oldData: unknown[] | undefined) => {
        if (!oldData) return [data];

        return oldData.map((item: unknown) => {
          const msg = item as { id: string; message_text: string };
          return msg.id.toString().startsWith('temp-') && msg.message_text === data.message_text
            ? data
            : msg;
        });
      });
      
      // Invalidate conversations to update last message
      queryClient.invalidateQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    },
    onError: (error: Error, variables) => {
      // Remove optimistic message on error
      queryClient.setQueryData(['conversation-messages', variables.conversationId], (oldData: unknown[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter((item: unknown) => {
          const msg = item as { id: string };
          return !msg.id.toString().startsWith('temp-');
        });
      });
      
      toast({
        title: 'Failed to Send Message',
        description: error.message,
        variant: 'destructive'
      });
    }
  });
}

export function useConversationStats() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['conversation-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) return { conversationsUsed: 0, conversationsLeft: 999, isPremium: true };

      // Allow unlimited conversations for all users
      return {
        conversationsUsed: 0,
        conversationsLeft: 999,
        isPremium: true
      };
    },
    enabled: !!user?.id
  });
}