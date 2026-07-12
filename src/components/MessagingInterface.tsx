import { memo, Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { lazyWithRetry } from '@/utils/lazyRetry';
import { AnimatePresence, motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
// Empty line to keep line count consistent
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Ban, ChevronLeft, Coins, FileText, Info, Mic, MicOff, MoreVertical, Search, Send, Share2, ShieldAlert, Smile, Sparkles, Star, Timer, X } from 'lucide-react';
import { MessageDocumentsPanel } from '@/components/messaging/MessageDocumentsPanel';

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { triggerHaptic } from '@/utils/haptics';
import { uiSounds } from '@/utils/uiSounds';
import { appToast } from '@/utils/appNotification';
import { useConversationMessages, useSendMessage } from '@/hooks/useConversations';
import { useRealtimeChat } from '@/hooks/useRealtimeChat';
import { useMarkMessagesAsRead } from '@/hooks/useMarkMessagesAsRead';
import { useAuth } from '@/hooks/useAuth';
// Empty line to keep line count consistent
// Empty line to keep line count consistent
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
const SwipeInsightsModal = lazyWithRetry(() => import('@/components/SwipeInsightsModal').then(m => ({ default: m.SwipeInsightsModal })));
import { logger } from '@/utils/prodLogger';
import { VirtualizedMessageList } from '@/components/VirtualizedMessageList';
import { useContentModeration } from '@/hooks/useContentModeration';
import { usePrefetchManager } from '@/hooks/usePrefetchManager';
const RatingSubmissionDialog = lazyWithRetry(() => import('@/components/RatingSubmissionDialog').then(m => ({ default: m.RatingSubmissionDialog })));
const ShareDialog = lazyWithRetry(() => import('@/components/ShareDialog').then(m => ({ default: m.ShareDialog })));
import { useModalStore } from '@/state/modalStore';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';
import { usePresence } from '@/hooks/usePresence';
import { useBlockedUsers, useBlockUser, useUnblockUser } from '@/hooks/useBlocking';
import { useSiteContent } from '@/hooks/useSiteContent';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import { MessageListSkeleton } from '@/components/ui/ContentSkeleton';

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
  onRequestBlock?: (userId: string, name: string) => void;
  onRequestReport?: (userId: string, age?: number | string, category?: string) => void;
}

const QUICK_EMOJIS = [
  '\u{1F44B}', '\u{1F60A}', '\u{1F604}', '\u{1F602}', '\u{1F970}', '\u{1F60D}', '\u{1F929}', '\u{1F60E}',
  '\u{1F64F}', '\u{1F44D}', '\u{1F525}', '\u{2764}\u{FE0F}', '\u{1F389}', '\u{2728}', '\u{1F4AF}', '\u{1F91D}',
  '\u{1F4AA}', '\u{1F44F}', '\u{1F973}', '\u{1F607}', '\u{1F917}', '\u{1F601}', '\u{1F31F}', '\u{1F4EC}',
];

export const MessagingInterface = memo(({ conversationId, otherUser, listing, currentUserRole = 'client', onBack, onRequestBlock, onRequestReport }: MessagingInterfaceProps) => {
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showDocumentsPanel, setShowDocumentsPanel] = useState(false);
  const [showRatingDialog, setShowRatingDialog] = useState(false);
  const [_showBlockConfirm, _setShowBlockConfirm] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showInsightsModal, setShowInsightsModal] = useState(false);
  const [showChatInfo, setShowChatInfo] = useState(false);
  // Controlled so the menu can't get stuck by the Radix mobile toggle race.
  const [menuOpen, setMenuOpen] = useState(false);
  // In-chat keyword search (WhatsApp-style): filter this conversation's messages.
  const [showChatSearch, setShowChatSearch] = useState(false);
  const [chatSearch, setChatSearch] = useState('');
  // The chat component is reused (not remounted) when switching conversations,
  // so reset per-chat UI state when the conversation changes. Without this the
  // previous chat's search query AND its half-typed draft would carry over to
  // the next chat — the draft leak could send a message to the wrong person.
  useEffect(() => {
    setShowChatSearch(false);
    setChatSearch('');
    setNewMessage('');
  }, [conversationId]);
  const { _theme, isLight } = useAppTheme();
  const isThemeLight = isLight;
  const { user } = useAuth();
  const navigate = useNavigate();
  const { getText } = useSiteContent('chat');
  const { data: messages = [], isLoading, isError, error, refetch: refetchMessages } = useConversationMessages(conversationId);
  const sendMessage = useSendMessage();
  const _queryClient = useQueryClient();
  const _blockUser = useBlockUser();
  const unblock = useUnblockUser();
  const { data: blockedList = [] } = useBlockedUsers();
  // True when *I* have blocked the person in this chat — listings stay visible,
  // but the composer is swapped for an "unblock to message" banner.
  const isBlockedByMe = (blockedList as any[]).some((b) => b?.blocked_id === otherUser.id);

  const { data: partnerProfile } = useQuery({
    queryKey: ['chat-partner-profile', otherUser.id],
    queryFn: async () => {
      // Try client_profiles first, then fall back to owner_profiles
      const { data: clientData } = await supabase
        .from('client_profiles')
        .select('name, age, city, gender, bio, occupation, profile_images, interests, work_schedule, verified')
        .eq('user_id', otherUser.id)
        .maybeSingle();
      if (clientData) return clientData;
      // Fallback: partner might be an owner
      const { data: ownerData } = await supabase
        .from('owner_profiles')
        .select('business_name, profile_images, city')
        .eq('user_id', otherUser.id)
        .maybeSingle();
      if (ownerData) return { name: ownerData.business_name, profile_images: ownerData.profile_images, city: ownerData.city } as any;
      return null;
    },
    enabled: showInsightsModal,
    staleTime: 5 * 60 * 1000,
  });
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const composerRef = useRef<HTMLTextAreaElement>(null);
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

  // ─── Voice + Auto-Send Logic (Parity with Concierge) ───
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputValueRef = useRef('');
  const isListeningRef = useRef(false);
  const SILENCE_SECONDS = 3;

  useEffect(() => { inputValueRef.current = newMessage; }, [newMessage]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const voiceBaseRef = useRef('');
  const { start: startVoiceTranscribe, stop: stopVoiceTranscribe, isRecording: isVoiceRecording } = useVoiceTranscribe({
    onInterim: (live) => {
      const base = voiceBaseRef.current.trim();
      setNewMessage(base ? `${base} ${live}` : live);
    },
    onStop: (text) => {
      setIsListening(false);
      isListeningRef.current = false;
      const base = voiceBaseRef.current.trim();
      if (text) {
        setNewMessage(base ? `${base} ${text}` : text);
        armSilenceCountdown();
      } else {
        setNewMessage(base);
      }
      uiSounds.playMicOff();
    }
  });

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

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
  }, []);

  const startListening = useCallback(async () => {
    // Whisper backend gives the authoritative final text; Web Speech (when
    // available) streams a live preview on top of whatever's already typed.
    voiceBaseRef.current = inputValueRef.current;
    const ok = await startVoiceTranscribe();
    if (ok) { setIsListening(true); triggerHaptic('medium'); uiSounds.playMicOn(); }
    else { appToast.error('Microphone Access Denied'); }
  }, [startVoiceTranscribe]);

  const stopListening = useCallback(async () => {
    stopVoiceTranscribe();
  }, [stopVoiceTranscribe]);

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

  // Auto-grow the composer as the user types: it expands to fit the text up to
  // a max height, then switches to an internal scrollbar so a long draft stays
  // fully reachable instead of being clipped at a fixed height.
  const COMPOSER_MAX_H = 200;
  useEffect(() => {
    const el = composerRef.current;
    if (!el) return;
    el.style.height = 'auto';
    const next = Math.min(el.scrollHeight, COMPOSER_MAX_H);
    el.style.height = `${next}px`;
    el.style.overflowY = el.scrollHeight > COMPOSER_MAX_H ? 'auto' : 'hidden';
  }, [newMessage]);

  const { moderate } = useContentModeration();

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const messageText = newMessage.trim();
    // This is an already-opened (token-paid) conversation, so sharing contact
    // details is allowed here — only profanity is still blocked. Contact info
    // stays blocked in descriptions, profiles and the cold opener.
    if (!moderate(messageText, 'message', conversationId, { allowContactInfo: true })) return;

    setNewMessage('');
    stopTyping();
    triggerHaptic('medium');

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

  // In-chat search: when a keyword is typed, show only messages that contain it.
  const trimmedChatSearch = chatSearch.trim().toLowerCase();
  const displayedMessages = trimmedChatSearch
    ? messages.filter((m: any) => (m.content || m.message_text || '').toLowerCase().includes(trimmedChatSearch))
    : messages;

  // NOTE: we intentionally do NOT gate the whole screen on `isLoading`. The
  // chat shell (header + composer) renders immediately so a slow/stalled message
  // load can never freeze the entire chat on a full-screen skeleton — only the
  // message-list area shows the loader (and a Retry on error).
  return (
    <>
      <div className={cn(
        "flex-1 flex flex-col h-full overflow-hidden transition-colors duration-200",
        isThemeLight ? "bg-background page-canvas" : "bg-background"
      )}>

        <div className={cn(
            "shrink-0 px-4 py-3 min-h-[72px] flex items-center z-20 backdrop-blur-3xl transition-all pt-safe",
            isThemeLight
              ? "surface-4 border-b-0"
              : "bg-background/90"
        )}>
          <div className="flex items-center w-full gap-4">
            <button
              onClick={onBack}
              className={cn(
                 "shrink-0 flex items-center justify-center w-12 h-12 rounded-full press-snappy",
                 isThemeLight ? "surface-2 text-black hover:shadow-[var(--elev-3)]" : "bg-white/[0.05] text-white hover:bg-white/[0.12]"
              )}
            >
              <ChevronLeft className="z-[10000] w-6 h-6 stroke-[2.5]" />
            </button>

            <button
              onClick={() => setShowChatInfo(true)}
              className="flex items-center gap-3 min-w-0 text-left active:scale-[0.98] transition-transform"
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
                    ? "bg-violet-400"
                    : "bg-slate-500"
                )} />
              </div>
              
              <div className="flex flex-col min-w-0 flex-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h3 className={cn("font-black text-[15px] uppercase tracking-tight truncate leading-none shrink min-w-0 max-w-[140px]", isThemeLight ? "text-black" : "text-white")}>
                    {otherUser.full_name}
                  </h3>
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

            <div className="flex-1" />

            <div className="flex shrink-0">
              <button
                onClick={() => { setShowChatSearch(s => !s); setChatSearch(''); triggerHaptic('light'); }}
                aria-label="Search messages"
                className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                  showChatSearch
                    ? "bg-rose-500/[0.15] text-rose-400"
                    : (isThemeLight ? "surface-2 text-black hover:shadow-[var(--elev-3)]" : "bg-white/[0.05] text-white hover:bg-white/[0.12]")
                )}
              >
                <Search className="z-[10000] w-5 h-5" />
              </button>

              <button
                onClick={() => setShowRatingDialog(true)}
                className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                  isThemeLight ? "bg-amber-50 text-amber-500 hover:bg-amber-100" : "bg-amber-500/[0.08] text-amber-400 hover:bg-amber-500/[0.15]"
                )}
              >
                <Star className="z-[10000] w-5 h-5 fill-current" />
              </button>

              <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen} modal={false}>
                <DropdownMenuTrigger asChild>
                  <button
                    aria-label="More options"
                    className={cn("w-10 h-10 rounded-full flex items-center justify-center transition-all outline-none focus:outline-none focus-visible:outline-none focus:ring-0 focus-visible:ring-0",
                    isThemeLight ? "surface-2 text-black hover:shadow-[var(--elev-3)]" : "bg-white/[0.05] text-white hover:bg-white/[0.12]"
                  )}>
                    <MoreVertical className="w-5 h-5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" sideOffset={8} className={cn("z-[10050] rounded-[1.5rem] p-2 shadow-2xl backdrop-blur-xl min-w-[200px]", isThemeLight ? "surface-5 text-slate-900" : "bg-secondary text-white border-white/[0.08]")}>
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => { setMenuOpen(false); setShowInsightsModal(true); }}
                  >
                    <Info className="w-4 h-4" /> Insights
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => setShowShareDialog(true)}
                  >
                    <Share2 className="w-4 h-4" /> Share
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => { setMenuOpen(false); onBack(); setTimeout(() => navigate('/subscription/packages'), 50); }}
                  >
                    <Sparkles className="w-4 h-4" /> Premium
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-white/[0.07] cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => { setMenuOpen(false); useModalStore.getState().setModal('showTokensModal', true); }}
                  >
                    <Coins className="w-4 h-4" /> Tokens
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-amber-500/[0.12] text-amber-400 cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => {
                      setMenuOpen(false);
                      // Adding a tiny delay lets the popover finish its close animation
                      // before we blast a new modal on top, preventing Radix portal crashes
                      setTimeout(() => {
                        if (onRequestReport) {
                          onRequestReport(otherUser.id, otherUser.age, 'user_profile');
                        } else {
                          (window as any).dispatchEvent(new CustomEvent('open-report', { detail: { reportedUserId: otherUser.id, reportedUserAge: otherUser.age, category: 'user_profile' } }));
                        }
                      }, 400);
                    }}
                  >
                    <ShieldAlert className="w-4 h-4" /> Report
                  </DropdownMenuItem>
                  <DropdownMenuSeparator className="bg-white/[0.06] my-1.5" />
                  <DropdownMenuItem
                    className="p-4 rounded-[1rem] focus:bg-red-500/[0.12] text-red-400 cursor-pointer font-black uppercase tracking-widest text-[10px] gap-3"
                    onClick={() => { setMenuOpen(false); onRequestBlock?.(otherUser.id, otherUser.full_name || 'User'); }}
                  >
                    <Ban className="w-4 h-4" /> Block
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>

        {showChatSearch && (
          <div className={cn("shrink-0 px-4 py-2 border-b z-10", isThemeLight ? "bg-background border-slate-200" : "bg-background/95 border-white/10")}>
            <div className="relative flex items-center">
              <Search className="absolute left-4 w-4 h-4 text-rose-400 pointer-events-none" />
              <input
                autoFocus
                value={chatSearch}
                onChange={(e) => setChatSearch(e.target.value)}
                placeholder="Search in this chat…"
                className={cn(
                  "w-full h-11 pl-11 pr-10 rounded-full text-[14px] outline-none border",
                  isThemeLight ? "bg-slate-50 border-slate-200 text-black placeholder:text-slate-400" : "bg-white/[0.05] border-white/10 text-white placeholder:text-white/30"
                )}
              />
              {chatSearch && (
                <button
                  type="button"
                  onClick={() => setChatSearch('')}
                  aria-label="Clear search"
                  className="absolute right-3 w-7 h-7 flex items-center justify-center rounded-full bg-white/10 text-white/60 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
            {trimmedChatSearch && (
              <p className={cn("mt-1.5 px-2 text-[10px] font-bold uppercase tracking-widest", isThemeLight ? "text-black/40" : "text-white/40")}>
                {displayedMessages.length} {displayedMessages.length === 1 ? 'match' : 'matches'}
              </p>
            )}
          </div>
        )}

        <div
          id="chat-scroll-container"
          className={cn("flex-1 flex flex-col relative min-h-0", isThemeLight ? "bg-background surface-0" : "bg-background")}
          ref={messagesContainerRef}
        >
          {isLoading && messages.length === 0 ? (
            <MessageListSkeleton rows={8} />
          ) : isError && messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className="w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 bg-gradient-to-br from-rose-500/20 to-amber-500/20 border border-white/5 shadow-2xl">
                <ShieldAlert className="z-[10000] w-10 h-10 text-rose-400" />
              </div>
              <h3 className={cn("text-2xl font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>Couldn't load messages</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mt-4 max-w-[220px] leading-relaxed", isThemeLight ? "text-black/30" : "text-white/30")}>
                The connection stalled. Check your network and try again.
              </p>
              <p className="mt-2 text-red-500 text-xs font-mono max-w-[80%] break-words">
                Error details: {error instanceof Error ? error.message : JSON.stringify(error)}
              </p>
              <button
                type="button"
                onClick={() => { triggerHaptic('light'); refetchMessages(); }}
                className="mt-8 px-6 py-3 rounded-full text-[10px] font-black uppercase tracking-widest bg-gradient-to-tr from-[#EB4898] to-[#FF4D00] text-white active:scale-95 transition-transform shadow-[0_8px_25px_rgba(235,72,152,0.4)]"
              >
                Retry
              </button>
            </div>
          ) : messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <div className={cn(
                "w-20 h-20 rounded-[32px] flex items-center justify-center mb-8 bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-white/5 shadow-2xl",
              )}>
                <Sparkles className="z-[10000] w-10 h-10 text-white" />
              </div>
              <h3 className={cn("text-2xl font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>Swipes Stream</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mt-4 max-w-[200px] leading-relaxed", isThemeLight ? "text-black/30" : "text-white/30")}>
                Initialize the connection stream with a greeting
              </p>
            </div>
          ) : trimmedChatSearch && displayedMessages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center p-10">
              <Search className="w-10 h-10 text-rose-400/50 mb-4" />
              <h3 className={cn("text-lg font-black uppercase tracking-tight", isThemeLight ? "text-black" : "text-white")}>No matches</h3>
              <p className={cn("text-[10px] font-bold uppercase tracking-[0.2em] mt-2 max-w-[220px]", isThemeLight ? "text-black/30" : "text-white/30")}>
                No messages contain “{chatSearch.trim()}”
              </p>
            </div>
          ) : (
            <VirtualizedMessageList
              messages={displayedMessages}
              currentUserId={user?.id || ''}
              otherUserRole={otherUser.role}
              currentUserRole={currentUserRole}
              typingUsers={typingUsers}
            />
          )}
        </div>

        {isBlockedByMe ? (
          <div className={cn(
            "shrink-0 px-4 py-4 flex items-center justify-between gap-3 backdrop-blur-3xl pb-safe relative z-20 border-t",
            isThemeLight ? "bg-rose-50 border-rose-200" : "bg-rose-500/[0.06] border-rose-500/20"
          )}>
            <div className="flex items-center gap-2.5 min-w-0">
              <Ban className="w-5 h-5 text-rose-500 shrink-0" />
              <p className={cn("text-[13px] font-semibold leading-tight", isThemeLight ? "text-slate-700" : "text-white/80")}>
                You blocked {otherUser.full_name || 'this user'}. Unblock to send messages.
              </p>
            </div>
            <button
              type="button"
              onClick={() => unblock.mutate(otherUser.id)}
              disabled={unblock.isPending}
              className="shrink-0 px-4 py-2.5 rounded-full bg-gradient-to-tr from-[#EB4898] to-[#FF4D00] text-white text-[11px] font-black uppercase tracking-wider active:scale-95 transition-all disabled:opacity-60"
            >
              {unblock.isPending ? 'Unblocking…' : 'Unblock'}
            </button>
          </div>
        ) : (
        <div className={cn(
          "shrink-0 px-4 py-3 flex items-center backdrop-blur-3xl transition-all pb-safe relative z-20",
          isThemeLight ? "surface-4 border-t-0" : "bg-background/90"
        )}>

          <AnimatePresence>
            {showEmojiPicker && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="absolute bottom-full left-0 right-0 p-4 overflow-hidden">
                <div className={cn(
                  "flex flex-wrap gap-2 justify-center p-3 rounded-[2rem] shadow-2xl backdrop-blur-3xl border mx-auto max-w-sm",
                  isThemeLight ? "surface-5" : "bg-[#121214]/90 border-white/[0.08]"
                )}>
                  {QUICK_EMOJIS.map(emoji => (
                    <button key={emoji} type="button" onClick={() => { setNewMessage(p => p + emoji); setShowEmojiPicker(false); }} className={cn("w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all active:scale-90", isThemeLight ? "hover:bg-background/[0.06]" : "hover:bg-white/[0.07]")}>
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
              onClick={() => { setShowDocumentsPanel(true); triggerHaptic('light'); }}
              aria-label="Send documents"
              className={cn(
                "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-sm",
                showDocumentsPanel
                  ? "bg-rose-500/[0.12] border-rose-500/30 text-rose-500"
                  : (isThemeLight ? "surface-3 text-black/50 hover:shadow-[var(--elev-4)]" : "bg-white/[0.03] border-white/[0.07] text-white hover:bg-white/0.09"),
              )}
            >
              <FileText className="z-[10000] w-5 h-5 stroke-[1.5]" />
            </button>

            <button
              type="button"
              onClick={() => setShowEmojiPicker(p => !p)}
              className={cn("shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all border shadow-sm", showEmojiPicker ? "bg-rose-500/[0.12] border-rose-500/30 text-rose-500" : (isThemeLight ? "surface-3 text-black/50 hover:shadow-[var(--elev-4)]" : "bg-white/[0.03] border-white/[0.07] text-white hover:bg-white/[0.09]"))}
            >
              <Smile className="z-[10000] w-6 h-6 stroke-[1.5]" />
            </button>

            <div className="flex-1 relative flex items-center group min-w-0">
              <textarea
                ref={composerRef}
                value={newMessage}
                onChange={(e) => { setNewMessage(e.target.value); if (e.target.value.trim()) startTyping(); else stopTyping(); }}
                onFocus={() => { if (isListening) stopListening(); }}
                onKeyDown={(e) => {
                  // Enter sends; Shift+Enter (and mobile "return") add a newline.
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (newMessage.trim() && !sendMessage.isPending) {
                      handleSendMessage(e as unknown as React.FormEvent);
                    }
                  }
                }}
                enterKeyHint="send"
                placeholder={isListening ? "Listening..." : getText('input_placeholder', 'Type a message...')}
                rows={1}
                style={{ resize: 'none' }}
                className={cn(
                  "flex-1 w-full min-h-[48px] py-3.5 pl-5 pr-12 rounded-[1.5rem] text-[15px] font-medium outline-none transition-all border shadow-inner focus:ring-4 focus:ring-[#EB4898]/10",
                  isThemeLight ? "surface-inset text-black placeholder:text-slate-400" : "bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/20 focus:border-white/20 focus:bg-white/[0.05]"
                )}
                disabled={sendMessage.isPending}
              />
              
              {/* Mic button — always visible, iOS uses Whisper fallback */}
                <button
                  type="button"
                  onClick={isListening ? stopListening : startListening}
                  className={cn("absolute right-2 bottom-1.5 w-9 h-9 rounded-full flex items-center justify-center transition-all", (isListening || isVoiceRecording) ? "bg-red-600 text-white animate-pulse scale-110" : (isThemeLight ? "text-black/30 hover:text-rose-500 hover:bg-rose-50" : "text-white hover:text-rose-400 hover:bg-rose-500/10"))}
                >
                  {(isListening || isVoiceRecording) ? <MicOff className="z-[10000] w-4 h-4" /> : <Mic className="z-[10000] w-4 h-4" />}
                </button>
            </div>

            <AnimatePresence>
              {countdown !== null && (
                <motion.div initial={{ opacity: 0, scale: 0.9, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.9, y: 10 }} className="absolute bottom-full left-0 right-0 mb-4 flex items-center gap-2 z-50">
                  <div className="flex-1 h-12 px-4 rounded-[1.5rem] flex items-center gap-3 overflow-hidden shadow-[0_20px_50px_rgba(235,72,152,0.4)] border border-white/20" style={{ background: 'linear-gradient(135deg, #EB4898 0%, #FF4D00 100%)' }}>
                    <motion.div className="absolute inset-0 bg-white/20" animate={{ opacity: [0, 0.4, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
                    <motion.div className="absolute bottom-0 left-0 h-1 bg-white/40" initial={{ width: '100%' }} animate={{ width: '0%' }} transition={{ duration: SILENCE_SECONDS, ease: 'linear' }} />
                    <div className="relative z-10 flex items-center justify-center w-6 h-6 rounded-full bg-white/20 backdrop-blur-md">
                      <Timer className="z-[10000] w-3.5 h-3.5 text-white animate-pulse" />
                    </div>
                    <div className="flex flex-col relative z-10">
                      <span className="text-[8px] font-black uppercase tracking-[0.2em] text-white/70 leading-none mb-0.5">Auto-Transmit</span>
                      <span className="text-[12px] font-black text-white leading-none tabular-nums">SENDING IN {countdown}S</span>
                    </div>
                  </div>
                  <button onClick={cancelCountdown} aria-label="Cancel auto-send" className={cn("w-12 h-12 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all border", isThemeLight ? "bg-foreground text-background border-foreground/20" : "bg-white text-black border-black/10")}>
                    <X className="z-[10000] w-5 h-5 stroke-[3px]" />
                  </button>
                </motion.div>
              )}
            </AnimatePresence>

            <button
              type="submit"
              disabled={!newMessage.trim() || sendMessage.isPending}
              aria-label="Send message"
              className={cn(
                // Always clearly visible so the Send button is never "missing".
                // It brightens to the full gradient once there's text to send.
                "shrink-0 w-12 h-12 rounded-full flex items-center justify-center transition-all",
                newMessage.trim()
                  ? "bg-gradient-to-tr from-[#EB4898] to-[#FF4D00] text-white shadow-[0_8px_25px_rgba(235,72,152,0.5)] hover:scale-105 active:scale-95 border-none"
                  : (isThemeLight
                      ? "bg-slate-200 text-slate-500 border border-slate-300 hover:bg-slate-300"
                      : "bg-white/[0.15] text-white hover:bg-white/[0.25] border border-white/[0.1]")
              )}
            >
              <Send className={cn("w-5 h-5 ml-0.5", newMessage.trim() ? "fill-white/20" : "")} />
            </button>
          </form>
        </div>
        )}

        <Suspense fallback={null}><RatingSubmissionDialog open={showRatingDialog} onOpenChange={setShowRatingDialog} targetId={listing?.id || otherUser.id} targetType={listing?.id ? 'listing' : 'user'} targetName={listing?.title || otherUser.full_name} categoryId={listing?.id ? (listing.category === 'vehicle' ? 'vehicle' : 'property') : 'client'} onSuccess={() => setShowRatingDialog(false)} /></Suspense>

        <Suspense fallback={null}><ShareDialog
          open={showShareDialog}
          onOpenChange={setShowShareDialog}
          profileId={otherUser.id}
          title={otherUser.full_name || 'Check out this profile'}
          previewImage={otherUser.avatar_url || null}
        /></Suspense>

        <Suspense fallback={null}><SwipeInsightsModal
          open={showInsightsModal}
          onOpenChange={setShowInsightsModal}
          profile={{
            id: otherUser.id,
            user_id: otherUser.id,
            name: partnerProfile?.name || otherUser.full_name,
            age: otherUser.age ?? partnerProfile?.age ?? 0,
            gender: partnerProfile?.gender ?? '',
            interests: partnerProfile?.interests ?? [],
            preferred_activities: [],
            location: null,
            lifestyle_tags: (partnerProfile as any)?.lifestyle_tags ?? [],
            profile_images: partnerProfile?.profile_images?.length
              ? partnerProfile.profile_images
              : (otherUser.avatar_url ? [otherUser.avatar_url] : []),
            matchPercentage: 0,
            matchReasons: [],
            incompatibleReasons: [],
            city: partnerProfile?.city ?? '',
            verified: partnerProfile?.verified ?? false,
            work_schedule: partnerProfile?.work_schedule ?? undefined,
            occupation: partnerProfile?.occupation ?? undefined,
            bio: partnerProfile?.bio ?? undefined,
          } as any}
        /></Suspense>

        <MessageDocumentsPanel
          open={showDocumentsPanel}
          onClose={() => setShowDocumentsPanel(false)}
          conversationId={conversationId}
          otherUser={otherUser}
          currentUserRole={currentUserRole}
          onChatClose={onBack}
        />


        <Dialog open={showChatInfo} onOpenChange={setShowChatInfo}>
          <DialogContent className={cn("max-w-[320px] rounded-[32px] p-6 border-0", isThemeLight ? "bg-white shadow-2xl" : "bg-[#111111] shadow-[0_0_40px_rgba(0,0,0,0.5)]")} hideCloseButton>
            <DialogHeader className="mb-2">
              <DialogTitle className="hidden">Chat Info</DialogTitle>
              <DialogDescription className="hidden">Details about this chat</DialogDescription>
            </DialogHeader>
            <div className="flex flex-col items-center text-center relative">
              <button 
                onClick={() => setShowChatInfo(false)}
                className={cn("absolute -top-2 -right-2 w-8 h-8 rounded-full flex items-center justify-center transition-colors", isThemeLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/10 text-white/60 hover:bg-white/20 hover:text-white")}
              >
                <X className="w-4 h-4" />
              </button>

              <Avatar className={cn("w-24 h-24 border-[3px] mb-4 shadow-lg", isThemeLight ? "border-white" : "border-[#111111]")}>
                <AvatarImage src={otherUser.avatar_url} className="object-cover" />
                <AvatarFallback className="text-3xl font-black bg-rose-100 text-rose-500">{otherUser.full_name?.charAt(0) || '?'}</AvatarFallback>
              </Avatar>
              
              <h2 className={cn("text-xl font-black uppercase tracking-tight leading-none", isThemeLight ? "text-slate-900" : "text-white")}>
                {otherUser.full_name}
              </h2>
              <p className="text-[10px] font-bold text-rose-500 uppercase tracking-widest mt-1.5 mb-6">
                {otherUser.role === 'owner' ? 'Property Owner' : 'Client'}
              </p>

              {listing && (
                <div className={cn("w-full p-4 rounded-2xl mb-6 text-left border relative overflow-hidden", isThemeLight ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10")}>
                  <div className="absolute top-0 right-0 p-3 opacity-20 pointer-events-none">
                    <FileText className="w-12 h-12" />
                  </div>
                  <div className="text-[9px] font-black text-rose-500 uppercase tracking-widest mb-2 relative z-10">Related Listing</div>
                  <div className="flex items-center gap-3 relative z-10">
                    {listing.images?.[0] ? (
                      <img src={listing.images[0]} alt={listing.title} className="w-14 h-14 rounded-xl object-cover border border-black/10" />
                    ) : (
                      <div className="w-14 h-14 rounded-xl bg-black/10 flex items-center justify-center"><FileText className="w-6 h-6 text-black/20" /></div>
                    )}
                    <div className="flex-1 min-w-0 pr-4">
                      <p className={cn("font-bold text-[13px] leading-tight line-clamp-2", isThemeLight ? "text-slate-900" : "text-white")}>{listing.title}</p>
                      {listing.city && <p className="text-[11px] font-semibold text-slate-500 truncate mt-1">{listing.city}</p>}
                    </div>
                  </div>
                </div>
              )}

              <div className="flex flex-col gap-2 w-full">
                <button
                  onClick={() => { setShowChatInfo(false); navigate(`/profile/${otherUser.id}`); }}
                  className="w-full py-3.5 rounded-2xl bg-rose-500 text-white font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-transform"
                >
                  View Profile
                </button>
                {listing && (
                  <button
                    onClick={() => { setShowChatInfo(false); navigate(`/listing/${listing.id}`); }}
                    className={cn("w-full py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-transform border", 
                      isThemeLight ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50" : "bg-white/5 text-white border-white/10 hover:bg-white/10")}
                  >
                    View Listing
                  </button>
                )}
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </>
  );
});

MessagingInterface.displayName = 'MessagingInterface';


