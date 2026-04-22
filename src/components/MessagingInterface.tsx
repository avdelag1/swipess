import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, AlertCircle, Zap, ChevronLeft, Info, Star, Smile, Sparkles } from 'lucide-react';
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
import { useAppTheme } from '@/hooks/useAppTheme';
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
  const { theme, isLight } = useAppTheme();
  const isThemeLight = isLight;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: messages = [], isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const [showConnecting, setShowConnecting] = useState(false);
  const connectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isAtLimit, hasMonthlyLimit, messagesRemaining } = useMonthlyMessageLimits();
  const { isOnline } = usePresence(otherUser.id);
  const { startTyping, stopTyping, typingUsers, isConnected } = useRealtimeChat(conversationId);
  useMarkMessagesAsRead(conversationId, true);
  const { prefetchTopConversationMessages } = usePrefetchManager();

  useEffect(() => {
    if (conversationId) {
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

  useEffect(() => {
    if (!isConnected) {
      connectingTimeoutRef.current = setTimeout(() => {
        setShowConnecting(true);
      }, 500);
    } else {
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

  const isScrolledToBottom = useCallback(() => {
    if (!messagesContainerRef.current) return true;
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    return scrollHeight - scrollTop - clientHeight < 100;
  }, []);

  useEffect(() => {
    const messageCountIncreased = messages.length > previousMessageCountRef.current;
    previousMessageCountRef.current = messages.length;
    if (messageCountIncreased && isScrolledToBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, isScrolledToBottom]);

  const { moderate } = useContentModeration();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    if (!moderate(messageText, 'message', conversationId)) return;

    setNewMessage('');
    stopTyping();

    try {
      await sendMessage.mutateAsync({
        conversationId,
        message: messageText
      });
    } catch (error: any) {
      logger.error('Failed to send message:', error);
      setNewMessage(messageText);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-background">
         <div className="w-12 h-12 rounded-xl border-4 border-[#EB4898]/10 border-t-[#EB4898] animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] mt-6 animate-pulse">Connecting...</p>
      </div>
    );
  }

  return (
    <>
      <MessageActivationBanner
        isVisible={showActivationBanner}
        onClose={() => setShowActivationBanner(false)}
        userRole={currentUserRole}
        variant="activation-required"
      />

      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-colors duration-500",
        isThemeLight ? "bg-white" : "bg-background"
      )}>
        
        {/* 🛸 SWIPESS HUD HEADER */}
        <div className={cn(
            "shrink-0 px-6 py-4 z-20 backdrop-blur-3xl border-b transition-all",
            isThemeLight ? "bg-white/80 border-black/5" : "bg-black/40 border-white/5"
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              aria-label="Go back to conversations"
              className={cn(
                 "shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl active:scale-90 transition-all border",
                 isThemeLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.08] border-white/10 text-white"
              )}
            >
              <ChevronLeft className={cn("w-5 h-5", isThemeLight ? "text-black" : "text-white")} />
            </button>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={cn(
                  "p-[1.5px] rounded-full",
                  otherUser.role === 'owner' ? "bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]" : "bg-gradient-to-br from-[#007AFF] to-[#5856D6]"
                )}>
                  <Avatar className="w-10 h-10 border-[1.5px] border-background">
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback className="bg-muted text-foreground text-xs font-bold">
                      {otherUser.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-background",
                  isOnline ? "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" : "bg-slate-500"
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className={cn("font-black text-[15px] uppercase italic tracking-tighter truncate leading-none", isThemeLight ? "text-black" : "text-white")}>
                  {otherUser.full_name}
                </h3>
                <div className="flex items-center gap-1.5">
                   <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                   <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] italic", isOnline ? "text-green-500" : "opacity-30")}>
                    {isOnline ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowRatingDialog(true)}
                className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border transition-all", isThemeLight ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-white/5 border-white/5 text-amber-400")}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border transition-all", isThemeLight ? "bg-black/5 border-black/5 text-black" : "bg-white/5 border-white/5 text-white/40")}>
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {listing && (
              <motion.div 
                initial={{ opacity: 0, y: -10 }} 
                animate={{ opacity: 1, y: 0 }}
                className={cn("mt-4 p-3 rounded-2xl flex items-center gap-4 border", isThemeLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}
              >
                 <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xl shrink-0">
                    <img src={listing.images?.[0]} className="w-full h-full object-cover" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <h4 className={cn("text-[10px] font-black uppercase italic tracking-widest truncate leading-none", isThemeLight ? "text-black" : "text-white")}>{listing.title}</h4>
                    <p className="text-[#EB4898] text-[12px] font-black italic mt-1">${listing.price?.toLocaleString()}</p>
                 </div>
                 <div className="px-3 py-1 bg-[#EB4898]/10 rounded-full border border-[#EB4898]/20">
                    <span className="text-[8px] font-black uppercase text-[#EB4898] tracking-widest italic">{listing.category}</span>
                 </div>
              </motion.div>
          )}
        </div>

        {/* Message Feed */}
        <div className="flex-1 relative min-h-0 bg-background/30" ref={messagesContainerRef}>
            {showConnecting && (
              <div className="absolute top-2 left-0 right-0 z-50 flex justify-center px-6">
                <div className="bg-amber-500/10 backdrop-blur-3xl border border-amber-500/20 px-6 py-2 rounded-full flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Wait: Reconnecting...</span>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                <Sparkles className="w-12 h-12 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Start Chatting</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 max-w-[200px] leading-relaxed">System ready for messages. Send your first message now.</p>
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

        {/* 🛸 COMMAND INPUT */}
        <div className={cn("p-6 backdrop-blur-3xl border-t transition-all", isThemeLight ? "bg-white/90" : "bg-background/50")}>
          
          <AnimatePresence>
              {showEmojiPicker && (
                <motion.div 
                  initial={{ height: 0, opacity: 0 }} 
                  animate={{ height: 'auto', opacity: 1 }} 
                  exit={{ height: 0, opacity: 0 }} 
                  className="pb-4 flex flex-wrap gap-2 justify-center"
                >
                    {QUICK_EMOJIS.map(emoji => (
                        <button 
                          key={emoji} 
                          type="button"
                          onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} 
                          className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/10 transition-all active:scale-90"
                        >
                          {emoji}
                        </button>
                    ))}
                </motion.div>
              )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <button
                type="button"
                onClick={() => setShowEmojiPicker(p => !p)}
                className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all border", isThemeLight ? "bg-black/5 border-black/5 text-black" : "bg-white/5 border-white/10 text-white/40")}
            >
              <Smile className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
                <input
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                  placeholder={isAtLimit ? "LIMIT REACHED" : "TRANSMIT LOGS..."}
                  className={cn(
                      "w-full h-14 pl-6 pr-14 rounded-2xl text-[14px] font-bold outline-none transition-all border",
                      isThemeLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.05] border-white/5 text-white placeholder:text-white/20"
                  )}
                  disabled={sendMessage.isPending || isAtLimit}
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
                    className={cn(
                        "absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        newMessage.trim() ? "bg-[#EB4898] text-white shadow-xl" : "bg-white/5 text-white/20"
                    )}
                >
                    <Send className={cn("w-4 h-4", newMessage.trim() && "animate-pulse")} />
                </button>
            </div>

            <motion.button
              type="submit"
              disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
              className={cn(
                "shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all",
                newMessage.trim() && !isAtLimit 
                  ? "bg-gradient-to-br from-[#EB4898] to-[#FF4D00] text-white shadow-lg shadow-[#EB4898]/20" 
                  : (isThemeLight ? "bg-black/5 text-black/20 border border-black/5" : "bg-white/5 text-white/20 border border-white/5")
              )}
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-5 h-5" />
            </motion.button>
          </form>

          {hasMonthlyLimit && (
              <div className="flex justify-center mt-4">
                  <div className={cn(
                    "px-4 py-1.5 rounded-full border flex items-center gap-2", 
                    isAtLimit ? "bg-red-500/10 border-red-500/20" : "bg-[#EB4898]/5 border-[#EB4898]/10"
                  )}>
                      <Zap className={cn("w-3.5 h-3.5", isAtLimit ? "text-red-500" : "text-[#EB4898]")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest italic", isAtLimit ? "text-red-500" : "text-[#EB4898]/60")}>
                        {isAtLimit ? 'Monthly Quota Exceeded' : `${messagesRemaining} Messages Remaining`}
                      </span>
                  </div>
              </div>
          )}
        </div>

        {/* Modals */}
        <MessageActivationPackages
          isOpen={showUpgradeDialog}
          onClose={() => setShowUpgradeDialog(false)}
          userRole={otherUser.role === 'client' ? 'owner' : 'client'}
        />

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
阻
