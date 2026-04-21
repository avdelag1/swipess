import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { logSupabaseError } from '@/lib/supabaseError';

export interface Conversation {
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
    content: string;
    message_text: string;
    created_at: string;
    sender_id: string;
    is_read: boolean;
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
        // Fetch conversations first, then join profiles manually (no FK constraints on new columns)
        const { data, error } = await supabase
          .from('conversations')
          .select('*')
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

        // Get all conversation IDs and user IDs for batch queries
        const conversationIds = data.map((c: any) => c.id);
        if (conversationIds.length === 0) return [];

        // Collect unique user IDs to fetch profiles
        const userIds = new Set<string>();
        data.forEach((c: any) => {
          if (c.client_id) userIds.add(c.client_id);
          if (c.owner_id) userIds.add(c.owner_id);
        });

        // Batch fetch profiles and listings
        const [profilesResult, listingsResult] = await Promise.all([
          supabase.from('profiles').select('user_id, full_name, avatar_url').in('user_id', Array.from(userIds)),
          data.some((c: any) => c.listing_id)
            ? supabase.from('listings').select('id, title, price, images, category, mode, address, city').in('id', data.filter((c: any) => c.listing_id).map((c: any) => c.listing_id))
            : Promise.resolve({ data: [] as any[], error: null })
        ]);

        if (profilesResult.error) {
          logger.error('Error fetching profiles in useConversations:', profilesResult.error);
          throw profilesResult.error;
        }
        if ((listingsResult as any).error) {
          logger.error('Error fetching listings in useConversations:', (listingsResult as any).error);
          throw (listingsResult as any).error;
        }

        const profilesMap = new Map<string, any>();
        (profilesResult.data || []).forEach((p: any) => profilesMap.set(p.user_id, p));
        const listingsMap = new Map<string, any>();
        ((listingsResult as any).data || []).forEach((l: any) => listingsMap.set(l.id, l));

        // OPTIMIZED: Single query for all last messages instead of N queries
        const { data: messagesData, error: messagesError } = await supabase
          .from('conversation_messages')
          .select('conversation_id, content, message_text, created_at, sender_id, is_read')
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
        const conversationsWithProfiles = (data as any[]).map((conversation: any) => {
          const isClient = conversation.client_id === user.id;
          const otherUserId = isClient ? conversation.owner_id : conversation.client_id;
          const otherUserProfile = profilesMap.get(otherUserId);
          const otherUserRole = isClient ? 'owner' : 'client';
          const listingData = conversation.listing_id ? listingsMap.get(conversation.listing_id) : undefined;

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
              id: otherUserId,
              full_name: otherUserProfile.full_name,
              avatar_url: otherUserProfile.avatar_url,
              role: otherUserRole
            } : undefined,
            last_message: lastMessagesMap.get(conversation.id),
            listing: listingData || undefined
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
    staleTime: 30000,
    retry: 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  const { refetch } = query;

  // REAL-TIME: Listen for conversation updates (last message, status, etc.)
  useEffect(() => {
    if (!user?.id) return;

    const channel = supabase
      .channel(`conversations-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `client_id=eq.${user.id}`,
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `owner_id=eq.${user.id}`,
        },
        () => refetch()
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
        },
        () => refetch() // Message insert updates the 'last_message' in the list
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, refetch]);

  // Helper to ensure a conversation is loaded in cache after creation
  const ensureConversationInCache = async (conversationId: string, maxAttempts = 3): Promise<Conversation | null> => {
    for (let i = 0; i < maxAttempts; i++) {
      const conversations = query.data || [];
      const conv = conversations.find((c: Conversation) => c.id === conversationId);
      if (conv) return conv;

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
      const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', conversationId)
        .single();

      if (error || !data) {
        if (import.meta.env.DEV) {
          logger.error('[useConversations] Error fetching single conversation:', error);
        }
        return null;
      }

      const otherUserId = data.client_id === user.id ? data.owner_id : data.client_id;
      const isClient = data.client_id === user.id;

      const [profileResult, listingResult, messagesResult] = await Promise.all([
        otherUserId ? supabase.from('profiles').select('user_id, full_name, avatar_url').eq('user_id', otherUserId).maybeSingle() : Promise.resolve({ data: null }),
        data.listing_id ? supabase.from('listings').select('id, title, price, images, category, mode, address, city').eq('id', data.listing_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('conversation_messages').select('conversation_id, content, message_text, created_at, sender_id, is_read').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(1)
      ]);

      const otherUserProfile = (profileResult as any).data;
      const otherUserRole = isClient ? 'owner' : 'client';

      return {
        id: data.id,
        client_id: data.client_id ?? '',
        owner_id: data.owner_id ?? '',
        listing_id: data.listing_id ?? undefined,
        last_message_at: data.last_message_at ?? undefined,
        status: data.status ?? 'active',
        created_at: data.created_at,
        updated_at: data.updated_at,
        other_user: otherUserProfile ? {
          id: otherUserId ?? '',
          full_name: otherUserProfile.full_name ?? '',
          avatar_url: otherUserProfile.avatar_url ?? undefined,
          role: otherUserRole
        } : undefined,
        last_message: (messagesResult as any).data?.[0],
        listing: (listingResult as any).data || undefined
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
  const query = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      const { data: messages, error } = await supabase
        .from('conversation_messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, full_name, avatar_url')
        .in('user_id', senderIds);

      const profileMap = new Map<string, any>();
      (profiles || []).forEach((p: any) => profileMap.set(p.user_id, p));

      return messages.map((msg: any) => {
        const profile = profileMap.get(msg.sender_id);
        return {
          ...msg,
          sender: profile ? {
            id: profile.user_id,
            full_name: profile.full_name,
            avatar_url: profile.avatar_url,
          } : undefined,
        };
      });
    },
    enabled: !!conversationId,
  });

  const { refetch } = query;

  // REAL-TIME: Listen for new messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`messages-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        () => refetch()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversationId, refetch]);

  return query;
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

      const { data: existingConversations, error: existingError } = await supabase
        .from('conversations')
        .select('id')
        .or(`and(client_id.eq.${user.id},owner_id.eq.${otherUserId}),and(client_id.eq.${otherUserId},owner_id.eq.${user.id})`);

      if (existingError) {
        throw new Error('Failed to check existing conversations');
      }

      const existingConversation = existingConversations?.[0];
      let conversationId = existingConversation?.id;

      if (!conversationId && !canStartNewConversation) {
        throw new Error('QUOTA_EXCEEDED');
      }

      if (!conversationId) {
        let myRole = 'client';
        let _otherRole = 'client';

        try {
          const { data: myRoleData } = await supabase.from('user_roles').select('role').eq('user_id', user.id).maybeSingle();
          const { data: otherRoleData } = await supabase.from('user_roles').select('role').eq('user_id', otherUserId).maybeSingle();
          myRole = myRoleData?.role || 'client';
          _otherRole = otherRoleData?.role || 'client';
        } catch (_e) {
          myRole = 'client'; _otherRole = 'owner';
        }

        const clientId = myRole === 'client' ? user.id : otherUserId;
        const ownerId = myRole === 'owner' ? user.id : otherUserId;

        const { data: newConversation, error: conversationError } = await supabase
          .from('conversations')
          .insert({
            client_id: clientId,
            owner_id: ownerId,
            listing_id: listingId,
            status: 'active'
          })
          .select()
          .single();

        if (conversationError) throw new Error(`Failed to create conversation: ${conversationError.message}`);
        conversationId = newConversation.id;
      }

      const { data: message, error: messageError } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: initialMessage,
          message_text: initialMessage,
          message_type: 'text'
        })
        .select()
        .single();

      if (messageError) throw new Error(`Failed to send message: ${messageError.message}`);

      const { error: updateError } = await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
      logSupabaseError('conversations.update.last_message_at(starter)', updateError);

      return { conversationId, message };
    },
    onSuccess: async () => {
      await queryClient.refetchQueries({ queryKey: ['conversations'] });
      await queryClient.invalidateQueries({ queryKey: ['conversations-started-count'] });
      appToast.success('💬 Conversation Started', 'Redirecting to chat...');
    }
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    onMutate: async ({ conversationId, message }) => {
      // Cancel refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['conversation-messages', conversationId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', user?.id] });

      // Snapshot previous data
      const prevMessages = queryClient.getQueryData(['conversation-messages', conversationId]);
      const prevConversations = queryClient.getQueryData(['conversations', user?.id]);

      // Optimistically add the new message to the message list
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: user?.id,
        content: message,
        message_text: message,
        message_type: 'text',
        created_at: new Date().toISOString(),
        is_read: true,
        is_optimistic: true, // Tag for potential UI styling (like grayed out)
        sender: {
          id: user?.id,
          full_name: 'You',
          avatar_url: undefined
        }
      };

      queryClient.setQueryData(['conversation-messages', conversationId], (old: any[] | undefined) => 
        old ? [...old, optimisticMessage] : [optimisticMessage]
      );

      // Update the conversation list's last message optimistically
      queryClient.setQueryData(['conversations', user?.id], (old: any[] | undefined) => {
        if (!old) return [];
        return old.map(c => 
          c.id === conversationId 
            ? { ...c, last_message: optimisticMessage, last_message_at: optimisticMessage.created_at } 
            : c
        ).sort((a, b) => new Date(b.last_message_at || 0).getTime() - new Date(a.last_message_at || 0).getTime());
      });

      return { prevMessages, prevConversations };
    },
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      const { data, error } = await supabase
        .from('conversation_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: user.id,
          content: message,
          message_text: message,
          message_type: 'text'
        })
        .select('*')
        .single();

      if (error) throw error;

      // Update basic conversation metadata silently
      const { error: updateError } = await supabase.from('conversations').update({ last_message_at: new Date().toISOString() }).eq('id', conversationId);
      logSupabaseError('conversations.update.last_message_at(send)', updateError);
      return data;
    },
    onError: (err, variables, context) => {
      // Rollback on error
      if (context?.prevMessages) {
        queryClient.setQueryData(['conversation-messages', variables.conversationId], context.prevMessages);
      }
      if (context?.prevConversations) {
        queryClient.setQueryData(['conversations', user?.id], context.prevConversations);
      }
      appToast.error('Failed to send message. Please try again.');
    },
    onSettled: (data, error, variables) => {
      // Refetch to ensure everything is in sync after the real update
      queryClient.invalidateQueries({ queryKey: ['conversation-messages', variables.conversationId] });
      queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    }
  });
}

export function useDeleteConversation() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('conversations').delete().eq('id', conversationId);
      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.setQueryData(['conversations', user?.id], (oldData: Conversation[] | undefined) => {
        if (!oldData) return [];
        return oldData.filter(c => c.id !== conversationId);
      });
      appToast.success('🗑️ Conversation deleted', 'The chat has been removed.');
    }
  });
}

export function useUpdateConversationStatus() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({ conversationId, status }: { conversationId: string; status: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('conversations').update({ status }).eq('id', conversationId).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(['conversations', user?.id], (oldData: Conversation[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(c => c.id === data.id ? { ...c, status: data.status } : c);
      });
      appToast.info(data.status === 'archived' ? '📁 Chat archived' : '🔓 Chat unarchived');
    }
  });
}

export function useMarkConversationAsRead() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase.from('conversation_messages').update({ is_read: true, read_at: new Date().toISOString() }).eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_read', false);
      if (error) throw error;
      return conversationId;
    },
    onSuccess: (conversationId) => {
      queryClient.setQueryData(['conversations', user?.id], (oldData: Conversation[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(c => {
          if (c.id === conversationId && c.last_message) {
            return { ...c, last_message: { ...c.last_message, is_read: true } };
          }
          return c;
        });
      });
      queryClient.invalidateQueries({ queryKey: ['unread-message-count'] });
    }
  });
}

export function useConversationStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversation-stats', user?.id],
    queryFn: async () => ({ conversationsUsed: 0, conversationsLeft: 999, isPremium: true }),
    enabled: !!user?.id
  });
}

