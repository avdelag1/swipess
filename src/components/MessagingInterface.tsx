import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, AlertCircle, Zap, ChevronLeft, Info, Star, Smile } from 'lucide-react';
import { useConversationMessages, useSendMessage } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyMessageLimits } from '@/hooks/useMonthlyMessageLimits';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { useQueryClient } from '@tanstack/react-query';
import { MessageActivationPackages } from '@/components/MessageActivationPackages';
import { MessageActivationBanner } from '@/components/MessageActivationBanner';
import { logger } from '@/utils/prodLogger';
import { VirtualizedMessageList } from '@/components/VirtualizedMessageList';
import { useContentModeration } from '@/hooks/useContentModeration';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { RatingSubmissionDialog } from '@/components/RatingSubmissionDialog';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';

interface MessagingInterfaceProps {
  conversationId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: 'client' | 'owner';
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
  currentUserRole?: 'client' | 'owner' | 'admin';
  onBack: () => void;
}

// iOS-style message bubble colors based on conversation type
const getBubbleColors = (otherUserRole: string, isMyMessage: boolean) => {
  if (!isMyMessage) {
    // Received messages - always gray/muted
    return {
      background: 'bg-[#3A3A3C]',
      text: 'text-white',
      timestamp: 'text-white/50'
    };
  }

  // Sent messages - different colors based on who you're talking to
  if (otherUserRole === 'owner') {
    // Talking to Owner - Purple-Indigo gradient (modern & vibrant)
    return {
      background: 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]',
      text: 'text-white',
      timestamp: 'text-white/60'
    };
  } else {
    // Talking to Client - Blue gradient (iMessage style)
    return {
      background: 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]',
      text: 'text-white',
      timestamp: 'text-white/60'
    };
  }
};

interface MessageType {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_read?: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

// Memoized iOS-style message bubble component
const MessageBubble = memo(({ message, isMyMessage, otherUserRole }: { message: MessageType; isMyMessage: boolean; otherUserRole: string }) => {
  const colors = getBubbleColors(otherUserRole, isMyMessage);

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 ${colors.background} ${colors.text} ${
          isMyMessage
            ? 'rounded-[20px] rounded-br-[6px]'
            : 'rounded-[20px] rounded-bl-[6px]'
        } shadow-sm`}
      >
        <p className="text-[15px] break-words whitespace-pre-wrap leading-[1.35]">{message.message_text}</p>
        <p className={`text-[10px] mt-1 ${colors.timestamp} text-right`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
        </p>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// Curated positive / friendly emojis — no angry or negative faces
const QUICK_EMOJIS = [
  '👋', '😊', '😄', '😂', '🥰', '😍', '🤩', '😎',
  '🙏', '👍', '🔥', '❤️', '🎉', '✨', '💯', '🤝',
  '💪', '👏', '🥳', '😇', '🤗', '😁', '🌟', '💬',
];

export const MessagingInterface = memo(({ conversationId, otherUser, listing, currentUserRole = 'client', onBack }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  const _navigate = useNavigate();
  const { data: messages = [], isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const _queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const [showConnecting, setShowConnecting] = useState(false);
  const connectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Check monthly message limits
  const { isAtLimit, hasMonthlyLimit, messagesRemaining } = useMonthlyMessageLimits();

  // Real-time presence indicator
  const { isOnline } = usePresence(otherUser.id);

  // Enable realtime chat for live message updates
  const { startTyping, stopTyping, typingUsers, isConnected } = useRealtimeChat(conversationId);

  // Mark messages as read when viewing this conversation
  useMarkMessagesAsRead(conversationId, true);

  // Prefetch manager for conversation messages
  const { prefetchTopConversationMessages } = usePrefetchManager();

  // Prefetch messages on mount for faster subsequent loads
  useEffect(() => {
    if (conversationId) {
      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => {
          prefetchTopConversationMessages(conversationId);
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          prefetchTopConversationMessages(conversationId);
        }, 100);
      }
    }
  }, [conversationId, prefetchTopConversationMessages]);

  // Debounce showing "Connecting" message to prevent flicker
  useEffect(() => {
    if (!isConnected) {
      // Only show "Connecting" message after 500ms of being disconnected
      connectingTimeoutRef.current = setTimeout(() => {
        setShowConnecting(true);
      }, 500);
    } else {
      // Clear timeout and hide connecting message immediately when connected
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
      setShowConnecting(false);
    }

    return () => {
      if (connectingTimeoutRef.current) {
        clearTimeout(connectingTimeoutRef.current);
        connectingTimeoutRef.current = null;
      }
    };
  }, [isConnected]);

  // Check if user is scrolled to bottom
  const isScrolledToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    // Consider "bottom" if within 100px of the bottom
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  // Auto-scroll to bottom only when:
  // 1. User is already at the bottom (to show new messages)
  // 2. User sends a message (previousMessageCountRef tracks this)
  useEffect(() => {
    const messageCountIncreased = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;

    if (messageCountIncreased && isScrolledToBottom()) {
      // Use instant scroll to prevent flickering
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, isScrolledToBottom]);

  const { moderate } = useContentModeration();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();

    // Content moderation check
    if (!moderate(messageText, 'message', conversationId)) return;

    setNewMessage('');
    stopTyping(); // Stop typing indicator when message is sent

    try {
      await sendMessage.mutateAsync({
        conversationId,
        message: messageText
      });
    } catch (error: unknown) {
      const err = error as { message?: string; code?: string };
      if (import.meta.env.DEV) {
        logger.error('Failed to send message:', error);
      }

      const errorMessage = err?.message || 'Unknown error occurred';

      if (import.meta.env.DEV) {
        const errorDetails = {
          message: errorMessage,
          code: err?.code,
          conversationId,
          timestamp: new Date().toISOString()
        };
        logger.error('Send error details:', errorDetails);

        if (errorMessage.includes('message_text')) {
          logger.error('❌ Database schema issue detected - message_text column may not exist');
        } else if (errorMessage.includes('receiver_id')) {
          logger.error('❌ Conversation error - receiver_id could not be determined');
        } else if (errorMessage.includes('RLS') || errorMessage.includes('policy')) {
          logger.error('❌ Permission error - Row Level Security policy may be blocking the insert');
        }
      }

      setNewMessage(messageText); // Restore message on error
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-foreground/20 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <p className="text-muted-foreground text-sm">Loading conversation...</p>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Activation Banner */}
      <MessageActivationBanner
        isVisible={showActivationBanner}
        onClose={() => setShowActivationBanner(false)}
        userRole={currentUserRole}
        variant="activation-required"
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden bg-background">
        {/* Premium Header */}
        <div
          className="shrink-0 px-3 py-2.5 z-20"
          style={{
            background: isLight 
              ? 'linear-gradient(to bottom, rgba(255,255,255,0.95), rgba(255,255,255,0))' 
              : 'linear-gradient(to bottom, rgba(12, 12, 14, 0.85) 0%, rgba(12, 12, 14, 0) 100%)',
            backdropFilter: 'blur(12px)',
            WebkitBackdropFilter: 'blur(12px)',
            borderBottom: '1px solid hsla(var(--border) / 0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Visible glass-pill back button */}
            <button
              onClick={onBack}
              aria-label="Go back to conversations"
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all active:scale-90"
              style={{
                background: isLight ? 'rgba(0,0,0,0.05)' : 'rgba(255,255,255,0.09)',
                border: isLight ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.13)',
              }}
            >
              <ChevronLeft className={cn("w-5 h-5", isLight ? "text-foreground" : "text-white")} />
            </button>

            {/* Center: Avatar + Name */}
            <div
              className="flex-1 flex items-center gap-2.5 min-w-0 py-0.5 rounded-xl"
            >
              <div className="relative shrink-0">
                <div className={`p-[1.5px] rounded-full ${
                  otherUser.role === 'owner'
                    ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                    : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                }`}>
                  <Avatar className="w-9 h-9 border-[1.5px] border-background">
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback className={`font-semibold text-white text-xs ${
                      otherUser.role === 'owner'
                        ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                        : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                    }`}>
                      {otherUser.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-background transition-colors duration-500",
                  isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-500"
                )} />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <h3 className="font-semibold text-[14px] text-foreground truncate max-w-[160px] sm:max-w-[220px]">
                  {otherUser.full_name}
                </h3>
                <span className={cn(
                  "text-[10px] font-bold transition-colors duration-500",
                  isOnline ? "text-green-500" : "text-muted-foreground/60"
                )}>
                  {isOnline ? 'Online' : 'Recently active'}
                </span>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-1.5 shrink-0">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowRatingDialog(true)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-amber-400"
              >
                <Star className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {showConnecting && (
          <div className="px-4 py-2 text-center" style={{ background: 'rgba(251,191,36,0.08)', borderBottom: '1px solid rgba(251,191,36,0.15)' }}>
            <p className="text-xs text-amber-400 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Connecting to chat...
            </p>
          </div>
        )}

        {/* Messages */}
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center py-12 text-center">
            <div className="w-20 h-20 rounded-full flex items-center justify-center mb-5" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(249,115,22,0.12))', border: '1px solid rgba(236,72,153,0.18)' }}>
              <Send className="w-9 h-9" style={{ color: '#ec4899' }} />
            </div>
            <p className="text-base font-semibold text-foreground mb-1.5">
              Start the conversation
            </p>
            <p className="text-sm text-muted-foreground max-w-[200px]">
              Say hello to {otherUser.full_name?.split(' ')?.[0] || 'your match'}!
            </p>
          </div>
        ) : (
          <VirtualizedMessageList
            messages={messages}
            currentUserId={user?.id || ''}
            otherUserRole={otherUser.role}
            typingUsers={typingUsers}
          />
        )}
        <div ref={messagesEndRef} />

        {/* Limit Warning */}
        {hasMonthlyLimit && isAtLimit && (
          <div className="px-4 py-2.5" style={{ background: 'rgba(239,68,68,0.08)', borderTop: '1px solid rgba(239,68,68,0.15)' }}>
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
              <p className="font-medium text-xs text-red-400 flex-1">Monthly limit reached</p>
              <button
                onClick={() => {
                  setShowActivationBanner(true);
                  setShowUpgradeDialog(true);
                }}
                className="shrink-0 h-7 px-3 rounded-full text-white text-[11px] font-semibold"
                style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
              >
                Upgrade
              </button>
            </div>
          </div>
        )}

        {/* Limit Info */}
        {hasMonthlyLimit && !isAtLimit && (
          <div className="px-4 py-2 flex items-center justify-center" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
            <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground/60">
              <Zap className="w-3 h-3 text-amber-500" />
              <span>{messagesRemaining} messages remaining</span>
            </div>
          </div>
        )}

        {/* Input Area */}
        <div
          className="shrink-0"
          style={{
            background: 'hsl(var(--background) / 0.97)',
            borderTop: '1px solid hsl(var(--border))',
          }}
        >
          {/* Emoji quick-pick panel */}
          {showEmojiPicker && (
            <div className="px-3 pt-2 pb-1">
              <div className="flex flex-wrap gap-1">
                {QUICK_EMOJIS.map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => {
                      setNewMessage(prev => prev + emoji);
                      setShowEmojiPicker(false);
                    }}
                    className="text-xl w-9 h-9 flex items-center justify-center rounded-xl transition-all active:scale-90 hover:bg-muted"
                    style={{ lineHeight: 1 }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>
            </div>
          )}

          <form
            onSubmit={handleSendMessage}
            className="px-3 py-3"
          >
            <div className="flex gap-2 items-center">
              {/* Emoji toggle button */}
              <button
                type="button"
                onClick={() => setShowEmojiPicker(p => !p)}
                aria-label={showEmojiPicker ? "Close emoji picker" : "Open emoji picker"}
                className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-all active:scale-90"
                style={{
                  background: showEmojiPicker ? 'linear-gradient(135deg, #ec4899, #f97316)' : 'hsl(var(--muted))',
                  border: '1px solid hsl(var(--border))',
                }}
              >
                <Smile className={`w-4 h-4 ${showEmojiPicker ? 'text-white' : 'text-muted-foreground'}`} />
              </button>

              <div className="flex-1 relative">
                <input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim()) startTyping();
                    else stopTyping();
                  }}
                  placeholder={isAtLimit ? "Monthly limit reached" : "Type a message..."}
                  className="w-full text-[15px] px-4 py-2.5 rounded-full text-foreground placeholder:text-muted-foreground outline-none transition-all"
                  style={{
                    background: 'hsl(var(--muted))',
                    border: '1px solid hsl(var(--border))',
                    minHeight: '42px',
                  }}
                  disabled={sendMessage.isPending || isAtLimit}
                  maxLength={1000}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                />
                {newMessage.length > 800 && (
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-white/30">
                    {1000 - newMessage.length}
                  </span>
                )}
              </div>
              <motion.button
                type="submit"
                disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
                aria-label="Send message"
                className="shrink-0 w-10 h-10 rounded-full flex items-center justify-center"
                whileTap={{ scale: 0.82, rotate: -8, transition: { type: "spring", stiffness: 400, damping: 10, mass: 0.7 } }}
                whileHover={{ scale: 1.08, transition: { type: "spring", stiffness: 300, damping: 15 } }}
                style={{
                  background: newMessage.trim() && !isAtLimit
                    ? 'linear-gradient(135deg, #ec4899, #f97316)'
                    : 'rgba(255,255,255,0.07)',
                  border: newMessage.trim() && !isAtLimit ? 'none' : '1px solid rgba(255,255,255,0.10)',
                  boxShadow: newMessage.trim() && !isAtLimit ? '0 4px 16px rgba(236,72,153,0.4)' : 'none',
                }}
              >
                <Send className={`w-4 h-4 ${newMessage.trim() && !isAtLimit ? 'text-white' : 'text-white/30'}`} />
              </motion.button>
            </div>
          </form>
        </div>

        {/* Upgrade Dialog */}
        <MessageActivationPackages
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          userRole={otherUser.role === 'client' ? 'owner' : 'client'}
        />



        {/* Rating Submission Dialog */}
        <RatingSubmissionDialog
          open={showRatingDialog}
          onOpenChange={setShowRatingDialog}
          targetId={listing?.id || otherUser.id}
          targetType={listing?.id ? 'listing' : 'user'}
          targetName={listing?.title || otherUser.full_name}
          categoryId={listing?.id ? (listing.category === 'vehicle' ? 'vehicle' : 'property') : 'client'}
          onSuccess={() => setShowRatingDialog(false)}
        />
      </div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
