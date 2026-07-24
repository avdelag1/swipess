import { useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useDailyQuests } from '@/hooks/useDailyQuests';
import { appToast } from '@/utils/appNotification';
import { logger } from '@/utils/prodLogger';
import { logSupabaseError } from '@/lib/supabaseError';
import { withTimeout } from '@/utils/withTimeout';

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
    age?: number;
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
          .select('id, client_id, owner_id, listing_id, last_message_at, status, created_at, updated_at')
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
        const conversationIds = data.map((c: any) => c.id).filter(Boolean);
        if (conversationIds.length === 0) return [];

        // Collect unique user IDs to fetch profiles
        const userIds = new Set<string>();
        data.forEach((c: any) => {
          if (c.client_id) userIds.add(c.client_id);
          if (c.owner_id) userIds.add(c.owner_id);
        });

        const listingIds = data.filter((c: any) => c.listing_id).map((c: any) => c.listing_id);

        // Single round-trip: fetch profiles, listings, blocked users, and last messages in parallel.
        // Last messages use a single IN query; JS deduplicates by conversation_id keeping
        // the latest row (results come back ordered by created_at DESC globally).
        const [clientsResult, ownersResult, listingsResult, blockedResult, messagesResult] = await Promise.all([
          supabase.from('client_profiles').select('user_id, name, full_name, age, profile_images').in('user_id', Array.from(userIds)),
          supabase.from('owner_profiles').select('user_id, business_name, profile_images').in('user_id', Array.from(userIds)),
          listingIds.length > 0
            ? supabase.from('listings').select('id, title, price, images, category, mode, address, city').in('id', listingIds)
            : Promise.resolve({ data: [] as any[], error: null }),
          supabase.from('user_blocks' as any).select('blocked_id').eq('blocker_id', user.id),
          supabase
            .from('conversation_messages')
            .select('id, conversation_id, content, message_text, created_at, sender_id, is_read, message_type')
            .in('conversation_id', conversationIds)
            .order('created_at', { ascending: false })
            // Generous upper bound: latest message per conversation, interleaved globally by time.
            // conversationIds.length * 3 covers cases where the top rows skew toward a
            // single busy conversation before we see the quieter ones.
            .limit(Math.min(conversationIds.length * 3, 150)),
        ]);

        if (clientsResult.error) {
          logger.error('Error fetching client profiles in useConversations:', clientsResult.error);
        }
        if (ownersResult.error) {
          logger.error('Error fetching owner profiles in useConversations:', ownersResult.error);
        }
        if ((listingsResult as any).error) {
          logger.error('Error fetching listings in useConversations:', (listingsResult as any).error);
          throw (listingsResult as any).error;
        }

        const profilesMap = new Map<string, any>();
        (clientsResult.data || []).forEach((p: any) => profilesMap.set(p.user_id, {
          id: p.user_id,
          full_name: p.name || p.full_name,
          avatar_url: p.profile_images?.[0],
          age: p.age
        }));
        (ownersResult.data || []).forEach((p: any) => {
          const existing = profilesMap.get(p.user_id);
          // If we already have a valid client name, and the owner name is empty, don't overwrite it with empty.
          if (existing && existing.full_name && !p.business_name) return;
          
          profilesMap.set(p.user_id, {
            id: p.user_id,
            full_name: p.business_name || existing?.full_name,
            avatar_url: p.profile_images?.[0] || existing?.avatar_url,
            age: existing?.age
          });
        });
        const listingsMap = new Map<string, any>();
        ((listingsResult as any).data || []).forEach((l: any) => listingsMap.set(l.id, l));

        const blockedUserIds = new Set(((blockedResult as any).data || []).map((b: any) => b.blocked_id));

        // Build last-messages map: first occurrence per conversation_id is the latest
        // because rows are globally sorted by created_at DESC.
        const lastMessagesMap = new Map<string, unknown>();
        for (const msg of ((messagesResult as any).data || [])) {
          if (!lastMessagesMap.has(msg.conversation_id)) {
            lastMessagesMap.set(msg.conversation_id, msg);
          }
        }

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
            other_user: {
              id: otherUserId,
              full_name: otherUserProfile?.full_name || 'Anonymous Entity',
              avatar_url: otherUserProfile?.avatar_url,
              role: otherUserRole,
              age: otherUserProfile?.age
            },
            last_message: lastMessagesMap.get(conversation.id),
            listing: listingData || undefined
          };
        }).filter((conv: any) => {
           // Filter out blocked users
           if (!conv.other_user) return true;
           return !blockedUserIds.has(conv.other_user.id);
        });

        return conversationsWithProfiles;
      } catch (error: unknown) {
        const err = error as { message?: string };
        // Better error handling with user-friendly messages
        if (import.meta.env.DEV) {
          logger.error('[useConversations] Error fetching conversations:', err?.message);
        }

        // Do NOT return [] on a transient JWT/auth hiccup. The realtime handler
        // refetches on every conversation change, and returning [] from a
        // refetch OVERWRITES the cached conversation list with nothing — making
        // the user's chats "disappear". Throwing keeps React Query's last-good
        // data on screen, and `retry` recovers the transient failure.
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

    // Use specific filters to avoid receiving updates for every conversation in the system
    const channel = supabase
      .channel(`conversations-swipes-${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `client_id=eq.${user.id}`,
        },
        () => {
          logger.debug('[Realtime] Conversation update (client)');
          refetch();
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `owner_id=eq.${user.id}`,
        },
        () => {
          logger.debug('[Realtime] Conversation update (owner)');
          refetch();
        }
      )
      // Note: We removed the unfiltered 'conversation_messages' listener because 
      // every message update also triggers a 'last_message_at' update on the 
      // 'conversations' table, which is already caught by the listeners above.
      // This significantly reduces network overhead and client-side processing.
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          logger.debug('[Realtime] Swipes subscription active');
        } else if (status === 'CHANNEL_ERROR') {
          logger.error('[Realtime] Swipes subscription error');
        }
      });

    return () => {
      channel.unsubscribe();
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
        .select('id, client_id, owner_id, listing_id, last_message_at, status, created_at, updated_at')
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

      const [clientResult, ownerResult, listingResult, messagesResult] = await Promise.all([
        otherUserId ? supabase.from('client_profiles').select('user_id, name, full_name, profile_images, age').eq('user_id', otherUserId).maybeSingle() : Promise.resolve({ data: null }),
        otherUserId ? supabase.from('owner_profiles').select('user_id, business_name, profile_images').eq('user_id', otherUserId).maybeSingle() : Promise.resolve({ data: null }),
        data.listing_id ? supabase.from('listings').select('id, title, price, images, category, mode, address, city').eq('id', data.listing_id).maybeSingle() : Promise.resolve({ data: null }),
        supabase.from('conversation_messages').select('id, conversation_id, content, message_text, message_type, created_at, sender_id, is_read').eq('conversation_id', conversationId).order('created_at', { ascending: false }).limit(1)
      ]);

      let otherUserProfile = null;
      if (clientResult.data || ownerResult.data) {
         const clientName = clientResult.data?.name || clientResult.data?.full_name;
         const ownerName = ownerResult.data?.business_name;
         
         otherUserProfile = {
           full_name: ownerName || clientName,
           avatar_url: ownerResult.data?.profile_images?.[0] || clientResult.data?.profile_images?.[0],
           age: clientResult.data?.age
         };
         
         // If owner name was empty, prefer the valid client name
         if (clientName && !ownerName) {
           otherUserProfile.full_name = clientName;
         }
      }
      const otherUserRole = isClient ? 'owner' : 'client';

      return {
        id: data.id,
        client_id: data.client_id ?? '',
        owner_id: data.owner_id ?? '',
        listing_id: data.listing_id ?? undefined,
        last_message_at: undefined,
        status: data.status,
        created_at: data.created_at,
        updated_at: data.updated_at,
        other_user: {
          id: otherUserId,
          full_name: otherUserProfile?.full_name || 'Anonymous Entity',
          avatar_url: otherUserProfile?.avatar_url,
          role: otherUserRole,
          age: otherUserProfile?.age
        },
        last_message: messagesResult.data?.[0] || undefined,
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
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['conversation-messages', conversationId],
    queryFn: async () => {
      // Hard timeout so a stalled request (e.g. a hung auth-lock acquisition,
      // which the 30s fetch timeout does NOT cover) can't leave the chat stuck
      // on its loading skeleton forever — it rejects, React Query retries, and
      // failing that surfaces an error state the UI can offer a retry for.
      const { data: messages, error } = await withTimeout(
        supabase
          .from('conversation_messages')
          .select('id, conversation_id, sender_id, content, message_text, message_type, is_read, created_at')
          .eq('conversation_id', conversationId)
          .order('created_at', { ascending: true }),
        15000,
        'Loading messages',
      );

      if (error) throw error;
      if (!messages || messages.length === 0) return [];

      const senderIds = [...new Set(messages.map((m: any) => m.sender_id))];
      const [clientProfilesData, ownerProfilesData] = await Promise.all([
        supabase.from('client_profiles').select('user_id, name, profile_images').in('user_id', senderIds),
        supabase.from('owner_profiles').select('user_id, business_name, profile_images').in('user_id', senderIds)
      ]);

      const profileMap = new Map<string, any>();
      (clientProfilesData.data || []).forEach((p: any) => profileMap.set(p.user_id, {
         user_id: p.user_id,
         full_name: p.name,
         avatar_url: p.profile_images?.[0]
      }));
      (ownerProfilesData.data || []).forEach((p: any) => profileMap.set(p.user_id, {
         user_id: p.user_id,
         full_name: p.business_name,
         avatar_url: p.profile_images?.[0]
      }));

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
    placeholderData: (prev) => prev,
    staleTime: 5 * 60 * 1000,  // realtime subscription keeps data fresh; 5 min avoids redundant refetches
    gcTime: 10 * 60 * 1000,
    // Fail fast on our own hard timeout: a stalled request/lock will just stall
    // again, so re-trying would only stack another 15s skeleton. Surface the
    // error state (with a Retry button) immediately instead. Genuine transient
    // errors still get a couple of quick auto-retries.
    retry: (failureCount, error) =>
      !(error instanceof Error && error.message.includes('timed out')) && failureCount < 2,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 3000),
  });

  const { refetch } = query;

  // REAL-TIME: Listen for new messages in this conversation
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase
      .channel(`conv-data-${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const newMsg: any = payload.new;
          if (!newMsg) return;
          // Guard: skip if already handled by useRealtimeChat to avoid double-append
          queryClient.setQueryData(['conversation-messages', conversationId], (prev: any) => {
            if (!Array.isArray(prev)) return prev;
            if (prev.some((m: any) => m.id === newMsg.id)) return prev;
            // Replace only the OLDEST matching optimistic bubble — filtering all
            // of them made the second of two rapid identical sends vanish until
            // its own real row arrived.
            const matchIdx = prev.findIndex((m: any) => m.is_optimistic && m.sender_id === newMsg.sender_id && (m.content === newMsg.content || m.message_text === newMsg.message_text));
            if (matchIdx === -1) return [...prev, newMsg];
            const next = prev.slice();
            next[matchIdx] = { ...newMsg, client_id: prev[matchIdx].client_id, sender: prev[matchIdx].sender };
            return next;
          });
        }
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const updated: any = payload.new;
          if (!updated) return;
          queryClient.setQueryData(['conversation-messages', conversationId], (prev: any) => {
            if (!Array.isArray(prev)) return prev;
            return prev.map((m: any) => (m.id === updated.id ? { ...m, ...updated } : m));
          });
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  }, [conversationId, refetch, queryClient]);

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
      canStartNewConversation: _explicitAllow,
    }: {
      otherUserId: string;
      listingId?: string;
      initialMessage: string;
      canStartNewConversation?: boolean;
    }) => {
      if (!user?.id) throw new Error('Not authenticated');
      // Reject demo / placeholder IDs that cannot exist in the backend.
      if (!otherUserId || otherUserId.length < 30 || otherUserId.startsWith('demo-')) {
        throw new Error('This profile is a sample and cannot receive messages yet.');
      }

      const { assertCanStartNewConversation } = await import('@/utils/messagingEntitlements');
      await assertCanStartNewConversation(user.id, otherUserId);

      const { data, error } = await (supabase as any).rpc('start_conversation_with_message', {
        p_other_user_id: otherUserId,
        p_initial_message: initialMessage,
        p_listing_id: listingId ?? null,
      });

      if (error) {
        throw new Error(error.message || 'Failed to start conversation');
      }

      const row = Array.isArray(data) ? data[0] : data;
      const conversationId: string | undefined = row?.conversation_id;
      if (!conversationId) throw new Error('Could not open conversation');

      return { conversationId, message: { id: row?.message_id }, created: !!row?.created };
    },
    onSuccess: () => {
      queryClient.refetchQueries({ queryKey: ['conversations'] });
      queryClient.invalidateQueries({ queryKey: ['conversations-started-count'] });
      queryClient.invalidateQueries({ queryKey: ['user-tokens'] });
    }
  });
}

export function useSendMessage() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { incrementQuest } = useDailyQuests();

  return useMutation({
    onMutate: async ({ conversationId, message }) => {
      // Cancel refetches to prevent overwriting our optimistic update
      await queryClient.cancelQueries({ queryKey: ['conversation-messages', conversationId] });
      await queryClient.cancelQueries({ queryKey: ['conversations', user?.id] });

      // Snapshot previous data
      const prevMessages = queryClient.getQueryData(['conversation-messages', conversationId]);
      const prevConversations = queryClient.getQueryData(['conversations', user?.id]);

      // Stable client-side id that survives the temp->real swap so React keys don't change
      const clientId = `cm-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
      // Optimistically add the new message to the message list
      const optimisticMessage = {
        id: `temp-${Date.now()}`,
        client_id: clientId,
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

      return { prevMessages, prevConversations, clientId };
    },
    mutationFn: async ({ conversationId, message }: { conversationId: string; message: string }) => {
      if (!user?.id) throw new Error('Not authenticated');

      // Hard timeout so a hung insert can't leave the composer frozen with the
      // send button disabled forever — on timeout this rejects, onError rolls
      // back the optimistic bubble and restores the typed text so the user can
      // retry. (The 30s fetch timeout does not cover an auth-lock stall.)
      const { data, error } = await withTimeout(
        supabase
          .from('conversation_messages')
          .insert({
            conversation_id: conversationId,
            sender_id: user.id,
            // Write BOTH columns: `message_text` is NOT NULL and is what the
            // RPC, notification triggers and push previews read; `content` is the
            // newer column the chat UI historically rendered. Keeping them in sync
            // is what stops blank message bubbles.
            message_text: message,
            content: message,
            message_type: 'text'
          })
          .select('id, conversation_id, sender_id, content, message_text, message_type, is_read, created_at')
          .single(),
        15000,
        'Sending message',
      );

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
    onSuccess: (data, variables, context) => {
      // Replace the optimistic temp message with the real one in place, preserving
      // the stable client_id so the React key doesn't change and the bubble doesn't
      // remount/replay its entry animation. Match by client_id — content matching
      // grabbed the wrong bubble when the same text was sent twice rapidly.
      queryClient.setQueryData(['conversation-messages', variables.conversationId], (old: any[] | undefined) => {
        if (!Array.isArray(old)) return old;
        // If the real message is already in the list (real-time beat us), drop our optimistic.
        if (old.some((m: any) => m.id === data.id)) {
          return old.filter((m: any) => !(m.is_optimistic && m.client_id === context?.clientId));
        }
        const idx = old.findIndex((m: any) => m.is_optimistic && m.client_id === context?.clientId);
        if (idx === -1) return [...old, data];
        const next = old.slice();
        next[idx] = { ...data, client_id: old[idx].client_id, sender: old[idx].sender };
        return next;
      });
    },
    onSettled: (_data, _error, _variables) => {
      // Lightweight invalidations only — the message list cache is managed in
      // onMutate/onSuccess + real-time subscription to avoid re-render storms.
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

export function useDeleteMultipleConversations() {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (conversationIds: string[]) => {
      if (!user?.id) throw new Error('Not authenticated');
      if (!conversationIds.length) return [];
      const { error } = await supabase.from('conversations').delete().in('id', conversationIds);
      if (error) throw error;
      return conversationIds;
    },
    onSuccess: (conversationIds) => {
      queryClient.setQueryData(['conversations', user?.id], (oldData: Conversation[] | undefined) => {
        if (!oldData) return [];
        const idSet = new Set(conversationIds);
        return oldData.filter(c => !idSet.has(c.id));
      });
      appToast.success('🗑️ Chats deleted', `${conversationIds.length} conversations have been removed.`);
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
      const { error } = await supabase.from('conversation_messages').update({ is_read: true }).eq('conversation_id', conversationId).neq('sender_id', user.id).eq('is_read', false);
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
      queryClient.invalidateQueries({ queryKey: ['unread-notifications'] });
    },
    onError: (err) => {
      // RLS blocks updating other users' messages — requires DB migration to fix
      if (import.meta.env.DEV) {
        logger.error('[MarkConversationAsRead] Error:', err);
      }
    }
  });
}

export function useConversationStats() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['conversation-stats', user?.id],
    queryFn: async () => {
      if (!user?.id) {
        return { conversationsUsed: 0, conversationsLeft: 0, isPremium: false };
      }
      const { fetchTokenBalance, fetchActivePlanName, computeCanStartNewConversation, PLAN_LIMITS } =
        await import('@/utils/messagingEntitlements');
      const [tokenBalance, planName] = await Promise.all([
        fetchTokenBalance(user.id),
        fetchActivePlanName(user.id),
      ]);
      const limits = PLAN_LIMITS[planName] || PLAN_LIMITS.free;
      return {
        conversationsUsed: 0,
        conversationsLeft: limits.unlimited_messages ? 999999 : tokenBalance,
        isPremium: planName !== 'free' || limits.unlimited_messages,
        canStartNewConversation: computeCanStartNewConversation({ planName, tokenBalance }),
      };
    },
    enabled: !!user?.id,
  });
}


