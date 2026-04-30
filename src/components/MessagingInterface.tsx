import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, AlertCircle, Zap, ChevronLeft, Info, Star, Smile, Sparkles, MoreVertical, ShieldAlert, Ban } from 'lucide-react';
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
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';
import { useBlockUser } from '@/hooks/useBlocking';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';

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
  const blockUser = useBlockUser();
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
        isThemeLight ? "bg-[#f5f5f7]" : "bg-[#0a0a0f]"
      )}>

        {/* NEXUS HUD HEADER */}
        <div className={cn(
            "shrink-0 px-5 py-4 z-20 backdrop-blur-3xl border-b transition-all",
            isThemeLight
              ? "bg-white/90 border-black/[0.06] shadow-sm"
              : "bg-[#0d0d14]/90 border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)]"
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
              aria-label="Go back to conversations"
              className={cn(
                 "shrink-0 flex items-center justify-center w-10 h-10 rounded-2xl active:scale-90 transition-all",
                 isThemeLight ? "bg-black/[0.06] text-black hover:bg-black/10" : "bg-white/[0.07] text-white hover:bg-white/[0.12]"
              )}
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <div className="flex-1 flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className={cn(
                  "p-[2px] rounded-full",
                  otherUser.role === 'owner'
                    ? "bg-gradient-to-br from-[#a78bfa] via-[#8B5CF6] to-[#6366F1]"
                    : "bg-gradient-to-br from-[#38bdf8] via-[#007AFF] to-[#5856D6]"
                )}>
                  <Avatar className={cn("w-10 h-10 border-2", isThemeLight ? "border-white" : "border-[#0d0d14]")}>
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback className={cn("text-xs font-black", isThemeLight ? "bg-slate-100 text-slate-700" : "bg-[#1a1a2e] text-white")}>
                      {otherUser.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2",
                  isThemeLight ? "border-white" : "border-[#0d0d14]",
                  isOnline
                    ? "bg-emerald-400 shadow-[0_0_10px_rgba(52,211,153,0.8)]"
                    : "bg-slate-500"
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className={cn("font-black text-[15px] uppercase tracking-tight truncate leading-none", isThemeLight ? "text-black" : "text-white")}>
                  {otherUser.full_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-emerald-400 animate-pulse" : "bg-slate-500")} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-[0.18em]",
                    isOnline ? "text-emerald-400" : (isThemeLight ? "text-black/30" : "text-white/25")
                  )}>
                    {isOnline ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowRatingDialog(true)}
                className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                  isThemeLight ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "bg-amber-500/[0.08] text-amber-400 hover:bg-amber-500/[0.15]"
                )}
              >
                <Star className="w-4.5 h-4.5 fill-current" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className={cn("w-10 h-10 rounded-2xl flex items-center justify-center transition-all",
                    isThemeLight ? "bg-black/[0.06] text-black hover:bg-black/10" : "bg-white/[0.07] text-white/60 hover:bg-white/[0.12]"
                  )}>
                    <MoreVertical className="w-4.5 h-4.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[1.5rem] bg-[#0e0e18] border-white/[0.08] p-2 shadow-2xl text-white backdrop-blur-xl min-w-[200px]">
                  <DropdownMenuItem className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[9px] gap-3">
                    <Info className="w-4 h-4" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-amber-500/[0.12] text-amber-400 cursor-pointer font-black uppercase tracking-widest text-[9px] gap-3"
                    onClick={() => (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedUserId: otherUser.id, reportCategory: 'user_profile' } }))}
                  >
                    <ShieldAlert className="w-4 h-4" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-red-500/[0.12] text-red-400 cursor-pointer font-black uppercase tracking-widest text-[9px] gap-3"
                    onClick={() => { if (confirm('Block this entity permanently?')) { blockUser.mutate(otherUser.id); onBack(); } }}
                  >
                    <Ban className="w-4 h-4" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {listing && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "mt-4 p-3 rounded-2xl flex items-center gap-3 border",
                isThemeLight ? "bg-[#f0f0f5] border-black/[0.06]" : "bg-white/[0.04] border-white/[0.06]"
              )}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shrink-0">
                <img src={listing.images?.[0]} className="w-full h-full object-cover" alt={listing.title} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-[10px] font-black uppercase tracking-widest truncate leading-none", isThemeLight ? "text-black" : "text-white")}>{listing.title}</h4>
                <p className="text-[#EB4898] text-[11px] font-black mt-1">${listing.price?.toLocaleString()}</p>
              </div>
              <div className="px-2.5 py-1 bg-[#EB4898]/10 rounded-full border border-[#EB4898]/20">
                <span className="text-[8px] font-black uppercase text-[#EB4898] tracking-widest">{listing.category}</span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Message Feed */}
        <div
          id="chat-scroll-container"
          className={cn("flex-1 relative min-h-0", isThemeLight ? "bg-[#f5f5f7]" : "bg-[#0a0a0f]")}
          ref={messagesContainerRef}
        >
          {showConnecting && (
            <div className="absolute top-3 left-0 right-0 z-50 flex justify-center px-6">
              <div className={cn(
                "backdrop-blur-3xl border px-5 py-2 rounded-full flex items-center gap-2.5",
                isThemeLight ? "bg-amber-50 border-amber-200" : "bg-amber-500/[0.08] border-amber-500/20"
              )}>
                <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Reconnecting...</span>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className={cn(
                "w-20 h-20 rounded-3xl flex items-center justify-center mb-6",
                isThemeLight ? "bg-[#EB4898]/[0.08]" : "bg-[#EB4898]/[0.07]"
              )}>
                <Sparkles className="w-9 h-9 text-[#EB4898]" />
              </div>
              <h3 className={cn("text-xl font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>New Connection</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.15em] mt-3 max-w-[180px] leading-relaxed", isThemeLight ? "text-black/40" : "text-white/30")}>
                Say hello and start the conversation
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

        {/* NEXUS COMMAND INPUT */}
        <div className={cn(
          "shrink-0 px-4 pb-5 pt-3 backdrop-blur-3xl border-t transition-all",
          isThemeLight ? "bg-white/90 border-black/[0.06]" : "bg-[#0d0d14]/90 border-white/[0.05]"
        )}>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="pb-3 overflow-hidden"
              >
                <div className="flex flex-wrap gap-1.5 justify-center py-2">
                  {QUICK_EMOJIS.map(emoji => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all active:scale-90",
                        isThemeLight ? "hover:bg-black/[0.06]" : "hover:bg-white/[0.07]"
                      )}
                    >
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-2.5 items-center">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className={cn(
                "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border",
                showEmojiPicker
                  ? "bg-[#EB4898]/[0.12] border-[#EB4898]/30 text-[#EB4898]"
                  : (isThemeLight
                      ? "bg-black/[0.05] border-black/[0.06] text-black/50 hover:bg-black/[0.09]"
                      : "bg-white/[0.05] border-white/[0.07] text-white/40 hover:bg-white/[0.09]")
              )}
            >
              <Smile className="w-5 h-5" />
            </button>

            <div className="flex-1 relative">
              <input
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                placeholder={isAtLimit ? "LIMIT REACHED" : "Message..."}
                className={cn(
                  "w-full h-12 pl-5 pr-5 rounded-2xl text-[14px] font-medium outline-none transition-all border focus:ring-2 focus:ring-[#EB4898]/20",
                  isThemeLight
                    ? "bg-[#f0f0f5] border-black/[0.07] text-black placeholder:text-black/30 focus:border-[#EB4898]/30 focus:bg-white"
                    : "bg-white/[0.05] border-white/[0.07] text-white placeholder:text-white/20 focus:border-[#EB4898]/30 focus:bg-white/[0.07]"
                )}
                disabled={sendMessage.isPending || isAtLimit}
              />
            </div>

            <motion.button
              type="submit"
              disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
              className={cn(
                "shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all",
                newMessage.trim() && !isAtLimit
                  ? "bg-gradient-to-br from-[#EB4898] to-[#FF4D00] text-white shadow-lg shadow-[#EB4898]/25 hover:brightness-110"
                  : (isThemeLight ? "bg-black/[0.05] text-black/20 border border-black/[0.06]" : "bg-white/[0.05] text-white/15 border border-white/[0.07]")
              )}
              whileTap={{ scale: 0.9 }}
            >
              <Send className="w-4.5 h-4.5" />
            </motion.button>
          </form>

          {hasMonthlyLimit && (
            <div className="flex justify-center mt-3">
              <div className={cn(
                "px-4 py-1.5 rounded-full border flex items-center gap-2",
                isAtLimit
                  ? "bg-red-500/[0.08] border-red-500/20"
                  : (isThemeLight ? "bg-[#EB4898]/[0.06] border-[#EB4898]/15" : "bg-[#EB4898]/[0.05] border-[#EB4898]/10")
              )}>
                <Zap className={cn("w-3 h-3", isAtLimit ? "text-red-500" : "text-[#EB4898]")} />
                <span className={cn("text-[9px] font-black uppercase tracking-widest", isAtLimit ? "text-red-500" : "text-[#EB4898]/70")}>
                  {isAtLimit ? 'Monthly Quota Exceeded' : `${messagesRemaining} left this month`}
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
