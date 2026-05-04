import { useState, useRef, useEffect, memo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Send, AlertCircle, Zap, ChevronLeft, Info, Star, Smile, Sparkles, MoreVertical, ShieldAlert, Ban, Mic, MicOff, Timer, X, CreditCard, Coins } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
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
import { TokensModal } from '@/components/TokensModal';
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
    age?: number;
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
  const [showTokensModal, setShowTokensModal] = useState(false);
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

  // ── Voice + Auto-Send Logic (Parity with Concierge) ──
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputValueRef = useRef('');
  const isListeningRef = useRef(false);
  const SILENCE_SECONDS = 3;

  useEffect(() => { inputValueRef.current = newMessage; }, [newMessage]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
    triggerHaptic('light');
  }, []);

  const armSilenceCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(SILENCE_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          const text = inputValueRef.current.trim();
          if (text) {
            sendMessage.mutate({ conversationId, message: text });
            setNewMessage('');
            triggerHaptic('heavy');
            uiSounds.playTap();
          }
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  }, [sendMessage, conversationId]);

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SR();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      triggerHaptic('medium');
      uiSounds.playMicOn();
    };

    recognition.onresult = (e: any) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      if (finalText) {
        setNewMessage(finalText);
        armSilenceCountdown();
      } else {
        setNewMessage(interim);
        cancelCountdown();
      }
    };

    recognition.onsoundend = () => { if (isListeningRef.current) armSilenceCountdown(); };
    
    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch (err) { setIsListening(false); isListeningRef.current = false; }
      }
    };

    recognition.onerror = (e: any) => {
      if (e.error === 'not-allowed') {
        setIsListening(false);
        isListeningRef.current = false;
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, armSilenceCountdown, cancelCountdown]);

  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    recognitionRef.current?.stop();
    cancelCountdown();
    uiSounds.playMicOff();
  }, [cancelCountdown]);

  useEffect(() => {
    const messageCountIncreased = messages.length > previousMessageCountRef.current;
    
    if (messageCountIncreased) {
      const lastMessage = messages[messages.length - 1];
      if (lastMessage && lastMessage.sender_id !== user?.id) {
        uiSounds.playNotification();
      }
    }
    
    previousMessageCountRef.current = messages.length;
    if (messageCountIncreased && isScrolledToBottom()) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'instant' });
    }
  }, [messages, isScrolledToBottom, user?.id]);

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
      <div className="flex-1 flex flex-col items-center justify-center p-8 bg-black">
         <div className="w-12 h-12 rounded-xl border-4 border-rose-500/10 border-t-rose-500 animate-spin" />
         <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-6 animate-pulse">Syncing Nexus...</p>
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
        isThemeLight ? "bg-[#ffffff]" : "bg-[#000000]"
      )}>

        <div className={cn(
            "shrink-0 px-5 py-4 z-20 border-b transition-all",
            isThemeLight
              ? "bg-white border-black/[0.06] shadow-sm"
              : "bg-[#050505] border-white/[0.06] shadow-[0_1px_0_rgba(255,255,255,0.04)]"
        )}>
          <div className="flex items-center gap-3">
            <button
              onClick={onBack}
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
                    ? "bg-gradient-to-br from-rose-500 via-violet-600 to-rose-400"
                    : "bg-gradient-to-br from-blue-400 via-violet-600 to-rose-500"
                )}>
                  <Avatar className={cn("w-10 h-10 border-2", isThemeLight ? "border-white" : "border-[#050505]")}>
                    <AvatarImage src={otherUser.avatar_url} />
                    <AvatarFallback className={cn("text-xs font-black", isThemeLight ? "bg-black/5 text-black" : "bg-zinc-900 text-white")}>
                      {otherUser.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2",
                  isThemeLight ? "border-white" : "border-[#050505]",
                  isOnline
                    ? "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
                    : (isThemeLight ? "bg-black/10" : "bg-white/10")
                )} />
              </div>
              <div className="flex flex-col min-w-0">
                <h3 className={cn("font-black text-[15px] uppercase tracking-tight truncate leading-none", isThemeLight ? "text-black" : "text-white")}>
                  {otherUser.full_name}
                </h3>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={cn("w-1 h-1 rounded-full", isOnline ? "bg-violet-400 animate-pulse" : (isThemeLight ? "bg-black/10" : "bg-white/10"))} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-[0.18em]",
                    isOnline ? "text-violet-400" : (isThemeLight ? "text-black/30" : "text-white/25")
                  )}>
                    {isOnline ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-1.5 shrink-0">
              <button
                onClick={() => navigate('/subscription/packages')}
                className={cn("px-3.5 h-10 rounded-2xl flex items-center gap-2 transition-all group overflow-hidden relative shadow-lg shadow-rose-500/10",
                  isThemeLight ? "bg-black text-white hover:bg-black/90" : "bg-white text-black hover:bg-white/90"
                )}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-rose-500/20 via-violet-500/20 to-rose-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                <Sparkles className="w-3.5 h-3.5 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block relative z-10">Premium</span>
              </button>

              <button
                onClick={() => setShowTokensModal(true)}
                className={cn("px-4 h-10 rounded-2xl flex items-center gap-2 transition-all",
                  isThemeLight ? "bg-rose-50 text-rose-500 hover:bg-rose-100" : "bg-rose-500/[0.08] text-rose-400 hover:bg-rose-500/[0.15] border border-rose-500/10"
                )}
              >
                <Coins className="w-4 h-4 fill-current" />
                <span className="text-[10px] font-black uppercase tracking-widest hidden xs:block">Tokens</span>
              </button>

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
                    onClick={() => (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedUserId: otherUser.id, reportedUserAge: otherUser.age, reportCategory: 'user_profile' } }))}
                  >
                    <ShieldAlert className="w-4 h-4" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
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
                isThemeLight ? "bg-black/[0.02] border-black/[0.06]" : "bg-white/[0.04] border-white/[0.06]"
              )}
            >
              <div className="w-11 h-11 rounded-xl overflow-hidden shadow-lg shrink-0">
                <img src={listing.images?.[0]} className="w-full h-full object-cover" alt={listing.title} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className={cn("text-[10px] font-black uppercase tracking-widest truncate leading-none", isThemeLight ? "text-black" : "text-white")}>{listing.title}</h4>
                <p className="text-rose-500 text-[11px] font-black mt-1">${listing.price?.toLocaleString()}</p>
              </div>
              <div className="px-2.5 py-1 bg-rose-500/10 rounded-full border border-rose-500/20">
                <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest">{listing.category}</span>
              </div>
            </motion.div>
          )}
        </div>

        <div
          id="chat-scroll-container"
          className={cn("flex-1 relative min-h-0", isThemeLight ? "bg-white" : "bg-[#050505]")}
          ref={messagesContainerRef}
        >
          {showConnecting && (
            <div className="absolute top-3 left-0 right-0 z-50 flex justify-center px-6">
              <div className={cn(
                "backdrop-blur-3xl border px-5 py-2 rounded-full flex items-center gap-2.5",
                isThemeLight ? "bg-amber-50 border-amber-200" : "bg-rose-500/[0.08] border-rose-500/20"
              )}>
                <div className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest text-rose-500">Connecting Nexus...</span>
              </div>
            </div>
          )}

          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className={cn(
                "w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-white/5 shadow-2xl",
              )}>
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className={cn("text-2xl font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>Nexus Stream</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mt-4 max-w-[200px] leading-relaxed text-white/30")}>
                Initialize the connection stream with a greeting
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

        <div className={cn(
          "shrink-0 px-4 pb-6 pt-4 backdrop-blur-3xl border-t transition-all",
          isThemeLight ? "bg-white/90 border-black/[0.06]" : "bg-[#050505]/90 border-white/[0.05]"
        )}>

          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-4">
            <button
              onClick={() => setShowUpgradeDialog(true)}
              className="w-full p-4 rounded-[1.5rem] bg-gradient-to-r from-rose-500 via-violet-600 to-rose-500 border border-white/20 flex items-center justify-between group hover:scale-[1.02] transition-all active:scale-[0.98] shadow-xl shadow-rose-500/20"
            >
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center shadow-lg group-hover:rotate-12 transition-transform">
                  <Zap className="w-6 h-6 text-white fill-white" />
                </div>
                <div className="text-left">
                  <div className="flex items-center gap-2">
                    <motion.p animate={{ opacity: [0.7, 1, 0.7] }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }} className="text-[11px] font-black text-white uppercase tracking-[0.2em] leading-none">Unlimited Messages</motion.p>
                    <div className="px-1.5 py-0.5 rounded-md bg-white text-rose-500 text-[7px] font-black uppercase tracking-widest shadow-sm">Active</div>
                  </div>
                  <p className="text-[9px] font-bold text-white/60 uppercase tracking-widest mt-1.5">Unlock the full Nexus experience</p>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-white/10 hover:bg-white/20 px-4 py-2 rounded-xl transition-colors">
                <span className="text-[10px] font-black uppercase text-white tracking-widest">Upgrade</span>
              </div>
            </button>
          </motion.div>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="pb-4 overflow-hidden">
                <div className="flex flex-wrap gap-2 justify-center py-2">
                  {QUICK_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} className={cn("w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all active:scale-90", isThemeLight ? "hover:bg-black/[0.06]" : "hover:bg-white/[0.07]")}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-3 items-center relative">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className={cn("shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-all border", showEmojiPicker ? "bg-rose-500/[0.12] border-rose-500/30 text-rose-500" : (isThemeLight ? "bg-black/[0.05] border-black/[0.06] text-black/50 hover:bg-black/[0.09]" : "bg-white/[0.05] border-white/[0.07] text-white/40 hover:bg-white/[0.09]"))}
            >
              <Smile className="w-6 h-6" />
            </button>

            <div className="flex-1 relative flex items-center group">
              <input
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                onFocus={() => { if (isListening) stopListening(); }}
                placeholder={isAtLimit ? "LIMIT REACHED" : isListening ? "Listening..." : "Message..."}
                className={cn(
                  "flex-1 h-12 pl-5 pr-12 rounded-2xl text-[14px] font-medium outline-none transition-all border focus:ring-2 focus:ring-[#EB4898]/20",
                  isThemeLight ? "bg-white border-black/10 text-black placeholder:text-black/30" : "bg-zinc-900 border-white/5 text-white placeholder:text-white/10"
                )}
                disabled={sendMessage.isPending || isAtLimit}
              />
              
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={cn("absolute right-1 w-10 h-10 rounded-xl flex items-center justify-center transition-all", isListening ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" : (isThemeLight ? "text-black/40 hover:text-rose-500" : "text-white/20 hover:text-rose-500"))}
                >
                  {isListening ? <MicOff className="w-4.5 h-4.5" /> : <Mic className="w-4.5 h-4.5" />}
                </button>
              )}
            </div>

            <AnimatePresence>
              {countdown !== null && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-full left-0 right-0 mb-4 flex items-center gap-2 z-50">
                  <div className="flex-1 h-12 px-4 rounded-[1.5rem] flex items-center gap-3 overflow-hidden shadow-[0_20px_50px_rgba(235,72,152,0.4)] border border-white/20" style={{ background: 'linear-gradient(135deg, #EB4898 0%, #FF4D00 100%)' }}>
                    <motion.div className="absolute inset-0 bg-white/20" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="absolute bottom-0 left-0 h-1 bg-white/40" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: SILENCE_SECONDS, ease: 'linear' }} />
                    <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md">
                      <Timer className="w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/70 leading-none mb-0.5">Auto-Transmit</span>
                      <span className="text-[12px] font-black text-white leading-none tabular-nums">SENDING IN {countdown}S</span>
                    </div>
                  </div>
                  <button onClick={cancelCountdown} className="w-12 h-12 rounded-2xl flex items-center justify-center bg-white text-black shadow-xl active:scale-90 transition-all border border-black/10">
                    <X className="w-5 h-5 stroke-[3px]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessage.isPending || isAtLimit}
              className={cn("shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center transition-all", newMessage.trim() && !isAtLimit ? "bg-white text-black shadow-xl hover:scale-105 active:scale-95" : (isThemeLight ? "bg-black/[0.05] text-black/10 border border-black/[0.06]" : "bg-white/[0.05] text-white/10 border border-white/[0.05]"))}
            >
              <Send className="w-6 h-6" />
            </button>
          </form>
        </div>

        <MessageActivationPackages isOpen={showUpgradeDialog} onClose={() => setShowUpgradeDialog(false)} userRole={currentUserRole} />
        {showTokensModal && <TokensModal />}
        <RatingSubmissionDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} targetId={listing?.id || otherUser.id} targetType={listing?.id ? 'listing' : 'user'} targetName={listing?.title || otherUser.full_name} categoryId={listing?.id ? (listing.category === 'vehicle' ? 'vehicle' : 'property') : 'client'} onSuccess={() => setShowRatingDialog(false)} />
      </div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
