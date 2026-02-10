import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';
import { useProfileCache } from '@/hooks/useProfileCache';

interface TypingUser {
  userId: string;
  userName: string;
  timestamp: number;
}

interface UserPresence {
  userId: string;
  userName: string;
  avatarUrl?: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export function useRealtimeChat(conversationId: string) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { getProfile } = useProfileCache();
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState<TypingUser[]>([]);
  const [onlineUsers, setOnlineUsers] = useState<UserPresence[]>([]);
  const [isConnected, setIsConnected] = useState(true); // Start as true to avoid initial flicker

  // Track typing with debounce - use ref to avoid circular dependencies
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const typingChannelRef = useRef<any>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use ref to track typing state to avoid dependency on isTyping in callback
  const isTypingRef = useRef(false);
  // Throttle typing status updates - only send every 1 second max
  const lastTypingSentRef = useRef(0);

  const startTyping = useCallback(() => {
    if (!conversationId || !user?.id || !typingChannelRef.current) return;

    const now = Date.now();
    const timeSinceLastSent = now - lastTypingSentRef.current;

    // OPTIMIZATION: Throttle typing status updates to max 1 per second
    // This prevents sending excessive realtime messages on every keystroke
    if (timeSinceLastSent < 1000 && isTypingRef.current) {
      // Just reset the timeout, don't send another status
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      typingTimeoutRef.current = setTimeout(() => {
        isTypingRef.current = false;
        setIsTyping(false);
        typingChannelRef.current?.track({
          userId: user.id,
          userName: user.user_metadata?.full_name || 'User',
          isTyping: false,
          timestamp: Date.now()
        }).catch((err) => logger.error('Typing indicator error:', err));
      }, 3000);
      return;
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Send typing status if not already typing or if throttle period has elapsed
    if (!isTypingRef.current) {
      isTypingRef.current = true;
      setIsTyping(true);
      lastTypingSentRef.current = now;

      // Use existing channel reference
      typingChannelRef.current.track({
        userId: user.id,
        userName: user.user_metadata?.full_name || 'User',
        isTyping: true,
        timestamp: now
      }).catch((err) => logger.error('Typing indicator error:', err));
    }

    // Set timeout to stop typing after 3 seconds of inactivity
    typingTimeoutRef.current = setTimeout(() => {
      isTypingRef.current = false;
      setIsTyping(false);
      typingChannelRef.current?.track({
        userId: user.id,
        userName: user.user_metadata?.full_name || 'User',
        isTyping: false,
        timestamp: Date.now()
      }).catch((err) => logger.error('Typing indicator error:', err));
    }, 3000);
  }, [conversationId, user?.id, user?.user_metadata?.full_name]);

  const stopTyping = useCallback(() => {
    if (!conversationId || !user?.id || !typingChannelRef.current) return;

    isTypingRef.current = false;
    setIsTyping(false);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = null;
    }

    typingChannelRef.current.track({
      userId: user.id,
      userName: user.user_metadata?.full_name || 'User',
      isTyping: false,
      timestamp: Date.now()
    }).catch(() => {
      // Silently handle typing errors - not critical
    });
  }, [conversationId, user?.id, user?.user_metadata?.full_name]);

  // Set up real-time subscriptions
  useEffect(() => {
    if (!conversationId || !user?.id) return;

    // Messages subscription
    const messagesChannel = supabase
      .channel(`messages-${conversationId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'conversation_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMessage = payload.new;

          // PERFORMANCE: Get sender details from cache (prevents N+1 queries)
          const senderProfile = await getProfile(newMessage.sender_id);

          const completeMessage = {
            ...newMessage,
            sender: senderProfile ? {
              id: senderProfile.id,
              full_name: senderProfile.full_name,
              avatar_url: senderProfile.avatar_url
            } : {
              id: newMessage.sender_id,
              full_name: 'Unknown',
              avatar_url: null
            }
          };
          
          // Update messages immediately
          queryClient.setQueryData(['conversation-messages', conversationId], (oldData: any) => {
            if (!oldData) return [completeMessage];
            
            // Check for both real IDs and temporary optimistic IDs
            const exists = oldData.some((msg: any) => 
              msg.id === newMessage.id || 
              (msg.id.toString().startsWith('temp-') && msg.message_text === newMessage.message_text && msg.sender_id === newMessage.sender_id)
            );
            
            if (exists) {
              // Replace optimistic message with real message if it exists
              return oldData.map((msg: any) => 
                msg.id.toString().startsWith('temp-') && msg.message_text === newMessage.message_text && msg.sender_id === newMessage.sender_id
                  ? completeMessage
                  : msg
              );
            }
            
            return [...oldData, completeMessage];
          });

          // Clear typing status for sender
          setTypingUsers(prev => prev.filter(u => u.userId !== newMessage.sender_id));
          
          // Dispatch custom event for notifications
          window.dispatchEvent(new CustomEvent('new-message', { detail: newMessage }));
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const newState = messagesChannel.presenceState();
        // Clear any pending connection timeout
        if (connectionTimeoutRef.current) {
          clearTimeout(connectionTimeoutRef.current);
          connectionTimeoutRef.current = null;
        }
        setIsConnected(true);
      })
      .on('presence', { event: 'join' }, ({ key, newPresences }) => {
        // User joined
      })
      .on('presence', { event: 'leave' }, ({ key, leftPresences }) => {
        // User left
      })
      .subscribe(async (status) => {

        if (status === 'SUBSCRIBED') {
          // Set connected immediately on subscribe
          setIsConnected(true);

          // Track presence
          await messagesChannel.track({
            userId: user.id,
            userName: user.user_metadata?.full_name || 'User',
            avatarUrl: user.user_metadata?.avatar_url,
            status: 'online',
            lastSeen: new Date().toISOString()
          });
        } else if (status === 'CLOSED' || status === 'CHANNEL_ERROR') {
          // Only show disconnected after a delay to prevent flicker
          if (connectionTimeoutRef.current) {
            clearTimeout(connectionTimeoutRef.current);
          }
          connectionTimeoutRef.current = setTimeout(() => {
            setIsConnected(false);
          }, 1000); // Wait 1 second before showing disconnected
        }
      });

    // Typing indicators subscription
    const typingChannel = supabase
      .channel(`typing-${conversationId}`)
      .on('presence', { event: 'sync' }, () => {
        const newState = typingChannel.presenceState();

        const currentTyping: TypingUser[] = [];
        Object.values(newState).forEach((presences: any) => {
          presences.forEach((presence: any) => {
            if (presence.isTyping && presence.userId !== user.id) {
              currentTyping.push({
                userId: presence.userId,
                userName: presence.userName,
                timestamp: presence.timestamp
              });
            }
          });
        });

        setTypingUsers(currentTyping);
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        // New typing presence
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        // Left typing presence
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          // Store channel reference for startTyping/stopTyping
          typingChannelRef.current = typingChannel;
        }
      });

    return () => {

      // Clear typing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Clear connection timeout
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }

      // Clear typing state
      isTypingRef.current = false;
      setIsTyping(false);

      // Properly unsubscribe channels
      messagesChannel.unsubscribe();
      typingChannel.unsubscribe();

      // Clear state
      setTypingUsers([]);
      setIsConnected(true); // Reset to true to avoid flicker on next mount
      typingChannelRef.current = null;
    };
  }, [conversationId, user?.id, queryClient]);

  // Cleanup typing on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }
      if (connectionTimeoutRef.current) {
        clearTimeout(connectionTimeoutRef.current);
        connectionTimeoutRef.current = null;
      }
    };
  }, []);

  return {
    startTyping,
    stopTyping,
    isTyping,
    typingUsers,
    onlineUsers,
    isConnected
  };
}