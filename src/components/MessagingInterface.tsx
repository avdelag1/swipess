import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Send, AlertCircle, Zap, ChevronLeft, User, Home, Info, ChevronRight, Heart, Star } from 'lucide-react';
import { useConversationMessages, useSendMessage } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyMessageLimits } from '@/hooks/useMonthlyMessageLimits';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { useQueryClient } from '@tanstack/react-query';
import { MessageActivationPackages } from '@/components/MessageActivationPackages';
import { MessageActivationBanner } from '@/components/MessageActivationBanner';
import { SubscriptionPackages } from '@/components/SubscriptionPackages';
import { ChatPreviewSheet } from '@/components/ChatPreviewSheet';
import { logger } from '@/utils/prodLogger';
import { VirtualizedMessageList } from '@/components/VirtualizedMessageList';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { RatingSubmissionDialog } from '@/components/RatingSubmissionDialog';

interface MessagingInterfaceProps {
  conversationId: string;
  otherUser: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
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

export const MessagingInterface = memo(({ conversationId, otherUser, listing, currentUserRole = 'client', onBack }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);
  const [showPreviewSheet, setShowPreviewSheet] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: messages = [], isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const [showConnecting, setShowConnecting] = useState(false);
  const connectingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Check monthly message limits
  const { canSendMessage, messagesRemaining, isAtLimit, hasMonthlyLimit } = useMonthlyMessageLimits();

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

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
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
      <Card className="flex-1 flex items-center justify-center border-0 shadow-none bg-background">
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <p className="text-muted-foreground text-sm">Loading conversation...</p>
        </div>
      </Card>
    );
  }

  return (
    <>
      {/* Activation Banner - shown when at message limit */}
      <MessageActivationBanner
        isVisible={showActivationBanner}
        onClose={() => setShowActivationBanner(false)}
        userRole={currentUserRole}
        variant="activation-required"
      />

      <Card className="flex-1 flex flex-col h-[calc(100vh-6rem)] overflow-hidden border-0 shadow-none bg-background">
        {/* Clean Header */}
        <div className="border-b border-border/50 shrink-0 bg-background/95 backdrop-blur-xl">
          <div className="flex items-center gap-2 px-3 py-2.5">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="shrink-0 text-primary hover:bg-transparent px-1 -ml-1"
            >
              <ChevronLeft className="w-6 h-6" />
            </Button>

            {/* Center: Avatar + Name */}
            <button
              onClick={() => setShowPreviewSheet(true)}
              className="flex-1 flex items-center gap-2.5 min-w-0 py-0.5 rounded-xl transition-colors active:scale-[0.98]"
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
                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-background" />
              </div>
              <div className="flex flex-col items-start min-w-0">
                <h3 className="font-semibold text-[14px] text-foreground truncate max-w-[160px] sm:max-w-[220px]">
                  {otherUser.full_name}
                </h3>
                <span className="text-[10px] text-emerald-500 font-medium">Online</span>
              </div>
            </button>

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
                onClick={() => setShowPreviewSheet(true)}
                className="w-8 h-8 rounded-full bg-muted hover:bg-muted/80 text-muted-foreground"
              >
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

      {/* iOS-style Connection Status */}
      {showConnecting && (
        <div className="px-4 py-2 bg-muted border-b border-border/50 text-center">
          <p className="text-xs text-amber-500 flex items-center justify-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
            Connecting to chat...
          </p>
        </div>
      )}

      {/* Messages - iOS-style with Virtualization for 60fps */}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-12 text-center bg-background">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-4 bg-primary/10">
            <Send className="w-7 h-7 text-primary" />
          </div>
          <p className="text-sm font-medium text-foreground mb-1">
            Start the conversation
          </p>
          <p className="text-xs text-muted-foreground max-w-[200px]">
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
        <div className="px-3 py-2 bg-muted border-t border-border/50">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="font-medium text-xs text-destructive flex-1">Limit reached</p>
            <Button
              size="sm"
              onClick={() => {
                setShowActivationBanner(true);
                setShowUpgradeDialog(true);
              }}
              className="shrink-0 h-6 bg-primary hover:bg-primary/90 text-primary-foreground border-0 rounded-full px-3 text-[10px]"
            >
              Upgrade
            </Button>
          </div>
        </div>
      )}

      {/* Limit Info */}
      {hasMonthlyLimit && !isAtLimit && (
        <div className="px-3 py-1.5 bg-muted border-t border-border/50 flex items-center justify-center">
          <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
            <Zap className="w-3 h-3 text-amber-500" />
            <span>{messagesRemaining} remaining</span>
          </div>
        </div>
      )}

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="px-3 py-2 border-t border-border/50 shrink-0 bg-background">
        <div className="flex gap-2 items-end">
          <div className="flex-1 relative">
            <Input
              value={newMessage}
              onChange={(e) => {
                setNewMessage(e.target.value);
                if (e.target.value.trim()) {
                  startTyping();
                } else {
                  stopTyping();
                }
              }}
              placeholder={isAtLimit ? "Monthly limit reached" : "Type a message..."}
              className="flex-1 text-[15px] min-h-[38px] px-4 py-2 rounded-full border-border/50 bg-muted/60 text-foreground placeholder:text-muted-foreground focus:border-primary/40 focus:ring-0 focus:ring-offset-0 transition-all"
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
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground">
                {1000 - newMessage.length}
              </span>
            )}
          </div>
          <Button
            type="submit"
            disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
            size="icon"
            className={`shrink-0 h-9 w-9 rounded-full transition-all border-0 ${
              newMessage.trim() && !isAtLimit
                ? 'bg-primary hover:bg-primary/90'
                : 'bg-muted opacity-50'
            }`}
            title={isAtLimit ? "Monthly message limit reached" : "Send message"}
          >
            <Send className="w-4 h-4 text-primary-foreground" />
          </Button>
        </div>
      </form>

      {/* Upgrade Dialog */}
      <MessageActivationPackages
        isOpen={showUpgradeDialog}
        onClose={() => setShowUpgradeDialog(false)}
        userRole={otherUser.role === 'client' ? 'owner' : 'client'}
      />

      {/* Profile/Listing Preview Sheet */}
      <ChatPreviewSheet
        isOpen={showPreviewSheet}
        onClose={() => setShowPreviewSheet(false)}
        otherUser={otherUser}
        listing={listing}
        currentUserRole={currentUserRole}
      />

      {/* Rating Submission Dialog */}
      <RatingSubmissionDialog
        open={showRatingDialog}
        onOpenChange={setShowRatingDialog}
        targetId={listing?.id || otherUser.id}
        targetType={listing?.id ? 'listing' : 'user'}
        targetName={listing?.title || otherUser.full_name}
        categoryId={listing?.id ? (listing.category === 'vehicle' ? 'vehicle' : 'property') : 'client'}
        onSuccess={() => {
          setShowRatingDialog(false);
          // Optionally refresh rating data
        }}
      />
      </Card>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
