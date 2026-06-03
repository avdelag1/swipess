import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// import { } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban, ChevronLeft, Coins, Info, Mic, MicOff, MoreVertical, Send, ShieldAlert, Smile, Sparkles, Star, Timer, X } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { useConversationMessages, useSendMessage } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { useAuth } from '@/hooks/useAuth';
// import { } from '@/hooks/useMonthlyMessageLimits';
// import { } from '@/utils/timeFormatter';
import { useQueryClient } from '@tanstack/react-query';
import { logger } from '@/utils/prodLogger';
import { VirtualizedMessageList } from '@/components/VirtualizedMessageList';
import { useContentModeration } from '@/hooks/useContentModeration';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
import { RatingSubmissionDialog } from '@/components/RatingSubmissionDialog';
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';
import { useBlockUser } from '@/hooks/useBlocking';
import { useSiteContent } from '@/hooks/useSiteContent';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
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
  '\u{1F44B}', '\u{1F60A}', '\u{1F604}', '\u{1F602}', '\u{1F970}', '\u{1F60D}', '\u{1F929}', '\u{1F60E}',
  '\u{1F64F}', '\u{1F44D}', '\u{1F525}', '\u{2764}\u{FE0F}', '\u{1F389}', '\u{2728}', '\u{1F4AF}', '\u{1F91D}',
  '\u{1F4AA}', '\u{1F44F}', '\u{1F973}', '\u{1F607}', '\u{1F917}', '\u{1F601}', '\u{1F31F}', '\u{1F4EC}',
];

export const MessagingInterface = memo(({ conversationId, otherUser, listing, _currentUserRole = 'client', onBack }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [showBlockConfirm, setShowBlockConfirm] = useState(false);
  const { _theme, isLight } = useAppTheme();
  const isThemeLight = isLight;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getText } = useSiteContent('chat');
  const { data: messages = [], isLoading } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const _queryClient = useQueryClient();
  const blockUser = useBlockUser();
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const previousMessageCountRef = useRef(0);
  const { isOnline } = usePresence(otherUser.id);
  const { startTyping, stopTyping, typingUsers, _isConnected } = useRealtimeChat(conversationId);
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

  // â”€â”€ Voice + Auto-Send Logic (Parity with Concierge) â”€â”€
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
        try { recognition.start(); } catch (_err) { setIsListening(false); isListeningRef.current = false; }
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
  }, [messages, user?.id]);

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
         <p className="text-[10px] font-black uppercase tracking-widest text-rose-500 mt-6 animate-pulse">Syncing Swipes...</p>
      </div>
    );
  }

  return (
    <>
      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-colors duration-500",
        isThemeLight ? "bg-[#ffffff]" : "bg-[#000000]"
      )}>

        <div className={cn(
            "shrink-0 px-4 py-3 min-h-[72px] flex items-center z-20 backdrop-blur-3xl border-b transition-all pt-safe",
            isThemeLight
              ? "bg-white/80 border-black/[0.06] shadow-sm"
              : "bg-[#18181B]/80 border-white/[0.08] shadow-[0_1px_0_rgba(255,255,255,0.06)]"
        )}>
          <div className="flex items-center w-full gap-4">
            <button
              onClick={onBack}
              className={cn(
                 "shrink-0 flex items-center justify-center w-12 h-12 rounded-full active:scale-90 transition-all",
                 isThemeLight ? "bg-black/[0.04] text-black hover:bg-black/10" : "bg-white/[0.05] text-white hover:bg-white/[0.12]"
              )}
            >
              <ChevronLeft className="w-6 h-6 stroke-[2.5]" />
            </button>

            <button 
              onClick={() => navigate(`/profile/${otherUser.id}`)}
              className="flex-1 flex items-center gap-3 min-w-0 text-left active:scale-[0.98] transition-transform"
            >
              <div className="relative shrink-0">
                <div className={cn(
                  "p-[2px] rounded-full shadow-md",
                  otherUser.role === 'owner'
                    ? "bg-gradient-to-br from-rose-500 via-violet-600 to-rose-400"
                    : "bg-gradient-to-br from-blue-400 via-violet-600 to-rose-500"
                )}>
                  <Avatar className={cn("w-11 h-11 border-2", isThemeLight ? "border-white" : "border-[#050505]")}>
                    <AvatarImage src={otherUser.avatar_url} className="object-cover" />
                    <AvatarFallback className={cn("text-[12px] font-black", isThemeLight ? "bg-slate-100 text-slate-700" : "bg-[#121212] text-white")}>
                      {otherUser.full_name?.charAt(0) || '?'}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className={cn(
                  "absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2",
                  isThemeLight ? "border-white" : "border-[#050505]",
                  isOnline
                    ? "bg-violet-400 shadow-[0_0_10px_rgba(167,139,250,0.8)]"
                    : "bg-slate-500"
                )} />
              </div>
              
              <div className="flex flex-col min-w-0">
                <div className="flex items-center gap-2">
                  <h3 className={cn("font-black text-[15px] uppercase tracking-tight truncate leading-none", isThemeLight ? "text-black" : "text-white")}>
                    {otherUser.full_name}
                  </h3>
                  {listing && (
                    <div className="px-1.5 py-0.5 bg-rose-500/10 rounded-md border border-rose-500/20 shrink-0">
                      <span className="text-[8px] font-black uppercase text-rose-500 tracking-widest">{listing.title}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <div className={cn("w-1.5 h-1.5 rounded-full", isOnline ? "bg-violet-400 animate-pulse" : "bg-slate-500")} />
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-[0.18em]",
                    isOnline ? "text-violet-400" : (isThemeLight ? "text-black/40" : "text-white/40")
                  )}>
                    {isOnline ? 'Active Now' : 'Offline'}
                  </span>
                </div>
              </div>
            </button>

            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => setShowRatingDialog(true)}
                className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-all",
                  isThemeLight ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "bg-amber-500/[0.08] text-amber-400 hover:bg-amber-500/[0.15]"
                )}
              >
                <Star className="w-5 h-5 fill-current" />
              </button>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button 
                    className={cn("w-11 h-11 rounded-full flex items-center justify-center transition-all",
                    isThemeLight ? "bg-black/[0.04] text-black hover:bg-black/10" : "bg-white/[0.05] text-white hover:bg-white/[0.12]"
                  )}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="rounded-[1.5rem] bg-[#0e0e18] border-white/[0.08] p-2 shadow-2xl text-white backdrop-blur-xl min-w-[200px]">
                  <DropdownMenuItem 
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => navigate(`/profile/${otherUser.id}`)}
                  >
                    <Info className="w-4 h-4" /> View Profile
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => navigate('/subscription/packages')}
                  >
                    <Sparkles className="w-4 h-4" /> Premium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => useModalStore.getState().setModal('showTokensModal', true)}
                  >
                    <Coins className="w-4 h-4" /> Tokens
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-amber-500/[0.12] text-amber-400 cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedUserId: otherUser.id, reportedUserAge: otherUser.age, reportCategory: 'user_profile' } }))}
                  >
                    <ShieldAlert className="w-4 h-4" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-red-500/[0.12] text-red-400 cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => setShowBlockConfirm(true)}
                  >
                    <Ban className="w-4 h-4" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        <div
          id="chat-scroll-container"
          className={cn("flex-1 flex flex-col relative min-h-0", isThemeLight ? "bg-[#f5f5f7]" : "bg-black")}
          ref={messagesContainerRef}
        >
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className={cn(
                "w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-white/5 shadow-2xl",
              )}>
                <Sparkles className="w-10 h-10 text-white" />
              </div>
              <h3 className={cn("text-2xl font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>Swipes Stream</h3>
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
        </div>

        <div className={cn(
          "shrink-0 px-4 py-3 flex items-center backdrop-blur-3xl border-t transition-all pb-safe relative z-20",
          isThemeLight ? "bg-white/90 border-black/[0.06] shadow-[0_-10px_40px_rgba(0,0,0,0.03)]" : "bg-[#18181B]/90 border-white/[0.08] shadow-[0_-10px_40px_rgba(0,0,0,0.5)]"
        )}>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="absolute bottom-full left-0 right-0 p-4 overflow-hidden">
                <div className={cn(
                  "flex flex-wrap gap-2 justify-center p-3 rounded-[2rem] shadow-2xl backdrop-blur-3xl border mx-auto max-w-sm",
                  isThemeLight ? "bg-white/90 border-black/[0.06]" : "bg-[#121214]/90 border-white/[0.08]"
                )}>
                  {QUICK_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} className={cn("w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all active:scale-90", isThemeLight ? "hover:bg-black/[0.06]" : "hover:bg-white/[0.07]")}>
                      {emoji}
                    </button>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleSendMessage} className="flex gap-3 items-end relative w-full">
            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className={cn("shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-sm", showEmojiPicker ? "bg-rose-500/[0.12] border-rose-500/30 text-rose-500" : (isThemeLight ? "bg-black/[0.03] border-black/[0.06] text-black/50 hover:bg-black/[0.08]" : "bg-white/[0.03] border-white/[0.07] text-white/40 hover:bg-white/[0.09]"))}
            >
              <Smile className="w-6 h-6 stroke-[1.5]" />
            </button>

            <div className="flex-1 relative flex items-center group">
              <textarea
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                onFocus={() => { if (isListening) stopListening(); }}
                placeholder={isListening ? "Listening..." : getText('input_placeholder', 'Type a message...')}
                rows={1}
                style={{ resize: 'none' }}
                className={cn(
                  "flex-1 min-h-[48px] max-h-[120px] py-3.5 pl-5 pr-12 rounded-[1.5rem] text-[15px] font-medium outline-none transition-all border shadow-inner focus:ring-4 focus:ring-[#EB4898]/10 no-scrollbar",
                  isThemeLight ? "bg-black/[0.02] border-black/10 text-black placeholder:text-black/30" : "bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.05]"
                )}
                disabled={sendMessage.isPending}
              />
              
              {speechSupported && (
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={cn("absolute right-2 bottom-1.5 w-9 h-9 rounded-full flex items-center justify-center transition-all", isListening ? "bg-red-500 text-white shadow-[0_0_15px_rgba(239,68,68,0.4)] animate-pulse" : (isThemeLight ? "text-black/30 hover:text-rose-500 hover:bg-rose-50" : "text-white/30 hover:text-rose-400 hover:bg-rose-500/10"))}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
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
                  <button onClick={cancelCountdown} aria-label="Cancel auto-send" className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border", isThemeLight ? "bg-foreground text-background border-foreground/20" : "bg-white text-black border-black/10")}>
                    <X className="w-5 h-5 stroke-[3px]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessage.isPending}
              aria-label="Send message"
              className={cn(
                "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                newMessage.trim()
                  ? "bg-gradient-to-tr from-[#EB4898] to-[#FF4D00] text-white shadow-[0_8px_25px_rgba(235,72,152,0.5)] hover:scale-105 active:scale-95 border-none"
                  : (isThemeLight
                      ? "bg-black/[0.04] text-black/30 border border-black/[0.06]"
                      : "bg-white/[0.05] text-white/20 border border-white/[0.05]")
              )}
            >
              <Send className={cn("w-5 h-5 ml-0.5", newMessage.trim() ? "fill-white/20" : "")} />
            </button>
          </form>
        </div>

        <RatingSubmissionDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} targetId={listing?.id || otherUser.id} targetType={listing?.id ? 'listing' : 'user'} targetName={listing?.title || otherUser.full_name} categoryId={listing?.id ? (listing.category === 'vehicle' ? 'vehicle' : 'property') : 'client'} onSuccess={() => setShowRatingDialog(false)} />

        <AlertDialog open={showBlockConfirm} onOpenChange={setShowBlockConfirm}>
          <AlertDialogContent className="rounded-[28px] bg-[#0A0A0A] border-white/10 text-white">
            <AlertDialogHeader>
              <AlertDialogTitle className="text-white text-lg font-bold">Block this user?</AlertDialogTitle>
              <AlertDialogDescription className="text-white/50">
                This will permanently block {otherUser.full_name} from contacting you. You won't see their messages or listings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2">
              <AlertDialogCancel className="rounded-2xl bg-white/10 border-white/20 text-white hover:bg-white/15">
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                className="rounded-2xl bg-red-600 hover:bg-red-500 text-white border-0"
                onClick={() => { blockUser.mutate(otherUser.id); onBack(); }}
              >
                Block
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';
