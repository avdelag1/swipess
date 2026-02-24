import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

import { motion } from 'framer-motion';
import { MessageBubble, type MessageType } from './chat/MessageBubble';

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
      <div className="flex-1 flex items-center justify-center" style={{ background: '#080808' }}>
        <div className="text-center">
          <div className="flex items-center justify-center gap-1 mb-3">
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
            <span className="w-2 h-2 bg-white/30 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
          </div>
          <p className="text-white/40 text-sm">Loading conversation...</p>
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

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex-1 flex flex-col h-full overflow-hidden"
        style={{ background: 'transparent' }}
      >
        {/* Premium Header */}
        <div
          className="shrink-0 border-b px-3 py-2.5 z-10"
          style={{
            background: 'rgba(8,8,8,0.7)',
            backdropFilter: 'blur(32px)',
            WebkitBackdropFilter: 'blur(32px)',
            borderColor: 'rgba(255,255,255,0.1)',
          }}
        >
          <div className="flex items-center gap-2">
            {/* Visible glass-pill back button */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={onBack}
              className="shrink-0 flex items-center justify-center w-9 h-9 rounded-xl transition-all"
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
              }}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </motion.button>

            {/* Center: Avatar + Name */}
            <button
              onClick={() => setShowPreviewSheet(true)}
              className="flex-1 flex items-center gap-2.5 min-w-0 py-0.5 rounded-xl transition-colors active:scale-[0.98]"
            >
              <div className="relative shrink-0">
                <div className={`p-[1.5px] rounded-full ${otherUser.role === 'owner'
                  ? 'bg-gradient-to-br from-purple-500 to-indigo-500'
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
                  }`}>
                  <Avatar className="w-9 h-9 border-[1.5px] border-background">
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback className={`font-semibold text-white text-xs ${otherUser.role === 'owner'
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
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-amber-400 border border-white/5"
              >
                <Star className="w-3.5 h-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowPreviewSheet(true)}
                className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 text-muted-foreground border border-white/5"
              >
                <Info className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Connection Status */}
        {showConnecting && (
          <div className="px-4 py-2 text-center z-10" style={{ background: 'rgba(251,191,36,0.1)', backdropFilter: 'blur(8px)', borderBottom: '1px solid rgba(251,191,36,0.2)' }}>
            <p className="text-xs text-amber-400 flex items-center justify-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
              Connecting to secure chat...
            </p>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 min-h-0 relative">
          {messages.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center px-6">
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-24 h-24 rounded-3xl flex items-center justify-center mb-6"
                style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.1), rgba(249,115,22,0.1))', border: '1px solid rgba(236,72,153,0.2)', backdropFilter: 'blur(20px)' }}
              >
                <Send className="w-8 h-8" style={{ color: '#ec4899' }} />
              </motion.div>
              <h2 className="text-lg font-bold text-white mb-2">Message {otherUser.full_name?.split(' ')?.[0]}</h2>
              <p className="text-sm text-white/40 max-w-[240px]">
                Start your premium experience by sending a message!
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
        </div>

        {/* Bottom Panel Wrapper */}
        <div className="shrink-0 z-10 overflow-hidden" style={{ background: 'rgba(8,8,8,0.7)', backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
          {/* Limit Warnings */}
          {hasMonthlyLimit && isAtLimit && (
            <div className="px-4 py-2.5 bg-red-500/10 border-b border-red-500/20">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                <p className="font-medium text-[11px] text-red-400 flex-1 uppercase tracking-wider">Monthly limit reached</p>
                <button
                  onClick={() => {
                    setShowActivationBanner(true);
                    setShowUpgradeDialog(true);
                  }}
                  className="shrink-0 h-7 px-3 rounded-full text-white text-[11px] font-bold"
                  style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                >
                  UPGRADE
                </button>
              </div>
            </div>
          )}

          {hasMonthlyLimit && !isAtLimit && (
            <div className="px-4 py-1.5 flex items-center justify-center border-b border-white/5">
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-[0.1em] text-white/20">
                <Zap className="w-2.5 h-2.5 text-amber-500/50" />
                <span>{messagesRemaining} messages left</span>
              </div>
            </div>
          )}

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            className="px-4 py-4"
          >
            <div className="flex gap-2.5 items-center">
              <div className="flex-1 relative group">
                <input
                  value={newMessage}
                  onChange={(e) => {
                    setNewMessage(e.target.value);
                    if (e.target.value.trim()) startTyping();
                    else stopTyping();
                  }}
                  placeholder={isAtLimit ? "Monthly limit reached" : "Type a message..."}
                  className="w-full text-[15px] px-5 py-3 rounded-[22px] text-white placeholder:text-white/25 outline-none transition-all duration-300 focus:shadow-[0_0_20px_rgba(236,72,153,0.15)] group-focus-within:border-white/30"
                  style={{
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
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
                <AnimatePresence>
                  {newMessage.length > 800 && (
                    <motion.span
                      initial={{ opacity: 0, x: 5 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 5 }}
                      className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-bold text-white/20"
                    >
                      {1000 - newMessage.length}
                    </motion.span>
                  )}
                </AnimatePresence>
              </div>
              <motion.button
                type="submit"
                whileTap={{ scale: 0.9 }}
                disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
                className="shrink-0 w-11 h-11 rounded-full flex items-center justify-center transition-all shadow-lg"
                style={{
                  background: newMessage.trim() && !isAtLimit
                    ? 'linear-gradient(135deg, #ec4899, #f97316)'
                    : 'rgba(255,255,255,0.04)',
                  border: newMessage.trim() && !isAtLimit ? 'none' : '1px solid rgba(255,255,255,0.1)',
                }}
              >
                <Send className={`w-[18px] h-[18px] ${newMessage.trim() && !isAtLimit ? 'text-white' : 'text-white/20'}`} />
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
          onSuccess={() => setShowRatingDialog(false)}
        />
      </motion.div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
