import React, { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, AlertCircle, Zap, ChevronLeft, Info, Star, Smile, Sparkles } from 'lucide-react';
import { useConversationMessages, useSendMessage } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { useAuth } from '@/hooks/useAuth';
import { useMonthlyMessageLimits } from '@/hooks/useMonthlyMessageLimits';
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
import { triggerHaptic } from '@/utils/haptics';

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

const QUICK_EMOJIS = ['👋', '😊', '😍', '🤩', '🙏', '👍', '🔥', '❤️', '✨', '💯'];

export const MessagingInterface = memo(({ conversationId, otherUser, listing, currentUserRole = 'client', onBack }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [showActivationBanner, setShowActivationBanner] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const { theme } = useTheme();
  const isLight = theme === 'light';
  const { user } = useAuth();
  const { data: messages = [], isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showConnecting, setShowConnecting] = useState(false);
  const connectingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { isAtLimit, hasMonthlyLimit, messagesRemaining } = useMonthlyMessageLimits();
  const { isOnline } = usePresence(otherUser.id);
  const { startTyping, stopTyping, typingUsers, isConnected } = useRealtimeChat(conversationId);

  useMarkMessagesAsRead(conversationId, true);
  const { prefetchTopConversationMessages } = usePrefetchManager();

  useEffect(() => {
    if (conversationId) prefetchTopConversationMessages(conversationId);
  }, [conversationId, prefetchTopConversationMessages]);

  useEffect(() => {
    if (!isConnected) {
      connectingTimeoutRef.current = setTimeout(() => setShowConnecting(true), 500);
    } else {
      if (connectingTimeoutRef.current) clearTimeout(connectingTimeoutRef.current);
      setShowConnecting(false);
    }
    return () => { if (connectingTimeoutRef.current) clearTimeout(connectingTimeoutRef.current); };
  }, [isConnected]);

  const { moderate } = useContentModeration();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;
    const messageText = newMessage.trim();
    if (!moderate(messageText, 'message', conversationId)) return;
    
    triggerHaptic('medium');
    setNewMessage('');
    stopTyping();

    try {
      await sendMessage.mutateAsync({ conversationId, message: messageText });
    } catch (error: unknown) {
      setNewMessage(messageText);
    }
  };

  if (isLoading) {
    return (
      <div className={cn("flex-1 flex flex-col items-center justify-center p-8", isLight ? "bg-white" : "bg-black")}>
         <div className="w-12 h-12 rounded-xl border-4 border-[#EB4898]/10 border-t-[#EB4898] animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-[#EB4898] mt-6 animate-pulse">Establishing Connection...</p>
      </div>
    );
  }

  return (
    <>
      <MessageActivationBanner isVisible={showActivationBanner} onClose={() => setShowActivationBanner(false)} userRole={currentUserRole} variant="activation-required" />

      <div className={cn("flex-1 flex flex-col h-full overflow-hidden transition-colors duration-500", isLight ? "bg-white" : "bg-black")}>
        
        {/* 🛸 HUD HEADER (v14) */}
        <div className={cn(
            "shrink-0 px-6 py-4 z-20 backdrop-blur-3xl border-b transition-all",
            isLight ? "bg-white/80 border-black/5" : "bg-black/40 border-white/5"
        )}>
          <div className="flex items-center gap-4">
            <button
              onClick={onBack}
              className={cn(
                 "shrink-0 flex items-center justify-center w-11 h-11 rounded-2xl active:scale-90 transition-all border",
                 isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.08] border-white/10 text-white"
              )}
            >
              <ChevronLeft className="w-6 h-6" />
            </button>

            <div className="flex-1 flex items-center gap-4 min-w-0">
              <div className="relative shrink-0">
                <div className={cn("p-[2px] rounded-2xl bg-gradient-to-br from-[#EB4898] to-orange-500 shadow-xl")}>
                   <Avatar className="w-11 h-11 rounded-[0.9rem] border-2 border-black/80">
                    <AvatarImage src={otherUser.avatar_url} className="object-cover" />
                    <AvatarFallback className="bg-black text-white font-black uppercase italic text-xs">
                      {otherUser.full_name?.charAt(0)}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-1 -right-1 w-3.5 h-3.5 rounded-full border-[3px] border-black transition-all",
                  isOnline ? "bg-green-500 shadow-[0_0_10px_#22c55e]" : "bg-slate-600"
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className={cn("font-black text-[15px] uppercase italic tracking-tighter truncate leading-none", isLight ? "text-black" : "text-white")}>
                  {otherUser.full_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                   <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-green-500 animate-pulse" : "bg-white/20")} />
                   <span className={cn("text-[9px] font-black uppercase tracking-[0.2em] italic", isOnline ? "text-green-500" : "opacity-30")}>
                    {isOnline ? 'Active Sync' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setShowRatingDialog(true)}
                className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border transition-all", isLight ? "bg-amber-500/10 border-amber-500/20 text-amber-600" : "bg-white/5 border-white/5 text-amber-400")}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>
              <button className={cn("w-10 h-10 rounded-2xl flex items-center justify-center border transition-all", isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/5 border-white/5 text-white/40")}>
                <Info className="w-5 h-5" />
              </button>
            </div>
          </div>

          {listing && (
             <motion.div 
               initial={{ opacity: 0, y: -10 }} 
               animate={{ opacity: 1, y: 0 }}
               className={cn("mt-4 p-3 rounded-2xl flex items-center gap-4 border", isLight ? "bg-black/5 border-black/5" : "bg-white/[0.04] border-white/5")}
             >
                <div className="w-12 h-12 rounded-xl overflow-hidden shadow-xl shrink-0">
                   <img src={listing.images?.[0]} className="w-full h-full object-cover" />
                </div>
                <div className="flex-1 min-w-0">
                   <h4 className={cn("text-[10px] font-black uppercase italic tracking-widest truncate leading-none", isLight ? "text-black" : "text-white")}>{listing.title}</h4>
                   <p className="text-[#EB4898] text-[12px] font-black italic mt-1">${listing.price?.toLocaleString()}</p>
                </div>
                <div className="px-3 py-1 bg-[#EB4898]/10 rounded-full border border-[#EB4898]/20">
                   <span className="text-[8px] font-black uppercase text-[#EB4898] tracking-widest italic">{listing.category}</span>
                </div>
             </motion.div>
          )}
        </div>

        {/* Transmission Feed */}
        <div className="flex-1 relative min-h-0">
            {showConnecting && (
              <div className="absolute top-2 left-0 right-0 z-50 flex justify-center px-6">
                <div className="bg-amber-500/10 backdrop-blur-3xl border border-amber-500/20 px-6 py-2 rounded-full flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
                  <span className="text-[9px] font-bold uppercase tracking-widest text-amber-500">Wait: Re-Syncing Network...</span>
                </div>
              </div>
            )}

            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 opacity-30">
                <Sparkles className="w-12 h-12 mb-6 animate-pulse" />
                <h3 className="text-xl font-black uppercase italic tracking-tighter">Initial Burst</h3>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] mt-3 max-w-[200px] leading-relaxed">System ready for decrypted transmissions. Initiate sync now.</p>
              </div>
            ) : (
              <VirtualizedMessageList messages={messages} currentUserId={user?.id || ''} otherUserRole={otherUser.role} typingUsers={typingUsers} />
            )}
            <div ref={messagesEndRef} />
        </div>

        {/* 🛸 COMMAND INPUT (v14) */}
        <div className={cn("p-6 backdrop-blur-3xl border-t transition-all", isLight ? "bg-white border-black/5" : "bg-black/20 border-white/5")}>
          
          <AnimatePresence>
              {showEmojiPicker && (
                <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pb-4 flex flex-wrap gap-2 justify-center">
                    {QUICK_EMOJIS.map(emoji => (
                        <button key={emoji} onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} className="w-10 h-10 flex items-center justify-center text-xl rounded-xl hover:bg-white/10 transition-all active:scale-90">{emoji}</button>
                    ))}
                </motion.div>
              )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-3 items-center">
            <button
                type="button"
                onClick={() => { triggerHaptic('light'); setShowEmojiPicker(p => !p); }}
                className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all border", isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/5 border-white/10 text-white/40")}
            >
                <Smile className={cn("w-6 h-6", showEmojiPicker && "text-[#EB4898]")} />
            </button>

            <div className="flex-1 relative">
                <input
                  value={newMessage}
                  onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                  placeholder={isAtLimit ? "LIMIT REACHED" : "TRANSMIT LOGS..."}
                  className={cn(
                      "w-full h-14 pl-6 pr-14 rounded-2xl text-[14px] font-bold outline-none transition-all border",
                      isLight ? "bg-black/5 border-black/5 text-black" : "bg-white/[0.05] border-white/5 text-white placeholder:text-white/20"
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
          </form>

          {hasMonthlyLimit && (
              <div className="flex justify-center mt-4">
                  <div className={cn("px-4 py-1.5 rounded-full border flex items-center gap-2", isAtLimit ? "bg-red-500/10 border-red-500/20" : "bg-[#EB4898]/5 border-[#EB4898]/10")}>
                      <Zap className={cn("w-3.5 h-3.5", isAtLimit ? "text-red-500" : "text-[#EB4898]")} />
                      <span className={cn("text-[9px] font-black uppercase tracking-widest italic", isAtLimit ? "text-red-500" : "text-[#EB4898]/60")}>
                        {isAtLimit ? 'Monthly Quota Exceeded' : `${messagesRemaining} Decryptions Remaining`}
                      </span>
                  </div>
              </div>
          )}
        </div>

        <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={otherUser.role === 'client' ? 'owner' : 'client'} />
        <RatingSubmissionDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} targetId={listing?.id || otherUser.id} targetType={listing?.id ? 'listing' : 'user'} targetName={listing?.title || otherUser.full_name} categoryId={listing?.id ? 'property' : 'client'} onSuccess={() => setShowRatingDialog(false)} />
      </div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
