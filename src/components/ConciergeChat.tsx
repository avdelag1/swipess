import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp, Crown, Flame, Menu, Mic, Moon, RefreshCw, Sparkles, Sun, Timer, X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { MotionIcon } from '@/components/ui/MotionIcon';
import { triggerHaptic } from '@/utils/haptics';
import { AiCharacter, useConciergeAI } from '@/hooks/useConciergeAI';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uiSounds } from '@/utils/uiSounds';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import useAppTheme from '@/hooks/useAppTheme';
import { PERSONA_VOICE_PROFILES, useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { appToast } from '@/utils/appNotification';
import { useModalStore } from '@/state/modalStore';
import { applyConciergeFilters, applyPassportAction } from '@/utils/conciergeActions';
import type { PassportAction } from '@/utils/passportLocation';
import { ConciergePrivacyPortal } from '@/components/concierge/ConciergePrivacyPortal';
import { WelcomeState } from '@/components/concierge/WelcomeState';

import { ConversationSidebar } from '@/components/concierge/ConversationSidebar';
import { VirtualizedConciergeMessageList } from '@/components/concierge/VirtualizedConciergeMessageList';
import {
  GENIE_ORIGIN_BOTTOM,
  GENIE_PANEL_EXIT,
  GENIE_PANEL_OPEN,
  GENIE_PANEL_VISIBLE,
  GENIE_SPRING_CLOSE,
  GENIE_SPRING_OPEN,
} from '@/utils/genieMotion';
import { AIDisclosure } from '@/components/AIDisclosure';

function ConciergeChatComponent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, isLight } = useAppTheme();
  const isSwipess = theme !== 'light';
  const LAST_ACTIVITY_KEY = 'Swipess_ai_last_activity';

  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    // If a search query is already pending, treat privacy as accepted so the
    // first message is not stuck behind the privacy wall with "no reply".
    try {
      if (localStorage.getItem('Swipess_ai_privacy') === 'true') return true;
      if (localStorage.getItem('swipess_ai_initial_query')) return true;
      if (useModalStore.getState().pendingAIQuery) return true;
    } catch { /* empty */ }
    return false;
  });

  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, deleteMessage,
    createConversation, switchConversation, deleteConversation,
    activeCharacter, setActiveCharacter, egoLevel: _egoLevel,
  } = useConciergeAI();

  const { navigate: appNavigate } = useAppNavigate();
  const [input, setInput] = useState('');
  const [sendPressed, setSendPressed] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const [, setIsExiting] = useState(false); // Aladdin/genie minimize effect
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const triggerGenieClose = () => {
    triggerHaptic('light');
    setIsExiting(true);
    setTimeout(() => {
      onClose();
      setIsExiting(false);
    }, 400);
  };

  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  const hasPlayedOpenSound = useRef(false);

  const handleSpeak = (msgId: string, text: string) => {
    if (speakingMsgId === msgId && isSpeaking) {
      stopSpeaking();
      setSpeakingMsgId(null);
    } else {
      triggerHaptic('light');
      setSpeakingMsgId(msgId);
      const profile = PERSONA_VOICE_PROFILES[activeCharacter] || PERSONA_VOICE_PROFILES.default;
      speak(text, profile);
    }
  };

  const CHARACTER_OPTIONS: { key: AiCharacter; label: string; subtitle: string; tagline: string; icon: typeof Sparkles; color: string; bgColor: string; }[] = [
    { key: 'default', label: 'Swipess AI', subtitle: 'Global Discovery', tagline: 'Worldwide Concierge', icon: Sparkles, color: 'text-[#FF3D00]', bgColor: 'bg-[#FF3D00]/20' },
    { key: 'kyle', label: 'Kyle', subtitle: 'Market Hustler', tagline: 'From Boston', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { key: 'beaugosse', label: 'Beau Gosse', subtitle: 'Social Alpha', tagline: 'From Los Angeles', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { key: 'donajkiin', label: 'Don Aj K\'iin', subtitle: 'Mayan Wisdom', tagline: 'From Yucatán, México', icon: Sun, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { key: 'botbetter', label: 'Bot Better', subtitle: 'Luxury Analyst', tagline: 'From London', icon: Crown, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    { key: 'lunashanti', label: 'Luna Shanti', subtitle: 'Boho Spirit', tagline: 'From Miami', icon: Moon, color: 'text-violet-300', bgColor: 'bg-violet-500/20' },
    { key: 'ezriyah', label: 'Ezriyah', subtitle: 'Integration Coach', tagline: 'Local Legend', icon: Sun, color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  ];

  const _arcColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      default: '#FF3D00',
      kyle: '#fb923c',
      beaugosse: '#a855f7',
      donajkiin: '#10b981',
      botbetter: '#ec4899',
      lunashanti: '#a78bfa',
      ezriyah: '#14b8a6',
    };
    return colorMap[activeCharacter] || 'var(--color-brand-primary)';
  }, [activeCharacter]);

  // Always call latest sendMessage (avoids stale closure after open).
  const sendMessageRef = useRef(sendMessage);
  sendMessageRef.current = sendMessage;
  const didConsumeInitialQueryRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasPlayedOpenSound.current = false;
      didConsumeInitialQueryRef.current = false;
      setSidebarOpen(false);
      setCharacterPanelOpen(false);
      return;
    }

    // Ensure privacy is open when arriving from the search bar with a query
    const pendingPeek =
      useModalStore.getState().pendingAIQuery
      || (() => { try { return localStorage.getItem('swipess_ai_initial_query'); } catch { return null; } })();
    if (pendingPeek && !hasAcceptedPrivacy) {
      try { localStorage.setItem('Swipess_ai_privacy', 'true'); } catch { /* empty */ }
      setHasAcceptedPrivacy(true);
    }

    const timer = window.setTimeout(() => {
      if (!hasPlayedOpenSound.current) {
        uiSounds.playWelcome();
        hasPlayedOpenSound.current = true;
      }
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const now = Date.now();
      // Only auto-create a fresh session if inactive AND the current
      // conversation already has messages (don't stack empty convos).
      if (now - lastActivity > 600000 && messages.length > 0) createConversation();
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());

      if (didConsumeInitialQueryRef.current) return;
      didConsumeInitialQueryRef.current = true;

      // Prefer in-memory modal store (reliable); fall back to localStorage key.
      let initialQuery = useModalStore.getState().consumePendingAIQuery?.() ?? null;
      if (!initialQuery) {
        try {
          initialQuery = localStorage.getItem('swipess_ai_initial_query');
          if (initialQuery) localStorage.removeItem('swipess_ai_initial_query');
        } catch { initialQuery = null; }
      }

      if (initialQuery?.trim()) {
        const q = initialQuery.trim();
        // Put text in the box immediately so the user sees it even if send lags
        setInput(q);
        // Wait for panel mount + sendMessage to be ready
        window.setTimeout(() => {
          setInput('');
          void sendMessageRef.current(q);
        }, 450);
      }
    }, 50);

    return () => window.clearTimeout(timer);
    // Intentionally NOT depending on hasAcceptedPrivacy — flipping it mid-open
    // would cancel the send timer and drop the search query.
  }, [isOpen, createConversation, messages.length]);

  useEffect(() => {
    if (messages.length > 0) localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }, [messages]);

  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputValueRef = useRef('');
  const isListeningRef = useRef(false);
  const autoSendEnabledRef = useRef(true);
  // Input value captured when recording starts, so live words and the final
  // transcript layer on top of any already-typed text without duplicating it.
  const voiceBaseRef = useRef('');

  const {
    start: startTranscribe,
    stop: stopTranscribe,
  } = useVoiceTranscribe({
    onInterim: (live) => {
      const base = voiceBaseRef.current.trim();
      setInput(base ? `${base} ${live}` : live);
    },
    onStop: (text) => {
      isListeningRef.current = false;
      setIsListening(false);
      cancelCountdown();
      uiSounds.playMicOff();
      const base = voiceBaseRef.current.trim();
      if (autoSendEnabledRef.current) {
        // The spoken text becomes a sent message — restore the input to whatever
        // was typed before recording (clears the live preview).
        setInput(base);
        if (text) sendMessage(text);
      } else {
        setInput(text ? (base ? `${base} ${text}` : text) : base);
      }
    }
  });

  useEffect(() => {
    autoSendEnabledRef.current = autoSendEnabled;
  }, [autoSendEnabled]);

  useEffect(() => { inputValueRef.current = input; }, [input]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
    triggerHaptic('light');
  }, []);

  const startListening = useCallback(async () => {
    voiceBaseRef.current = inputValueRef.current;
    const success = await startTranscribe();
    if (success) {
      setIsListening(true);
      triggerHaptic('medium');
      uiSounds.playMicOn();
    } else {
      appToast.error('Microphone Access Denied');
    }
  }, [startTranscribe]);

  const stopListening = useCallback(async () => {
    stopTranscribe();
  }, [stopTranscribe]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    triggerHaptic('medium');
    uiSounds.playTap();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    appToast.success('Telemetry Copied');
    triggerHaptic('light');
  };

  const handleTranslate = useCallback((_text: string) => {
    triggerHaptic('light');
    appToast.info('Translation initialization...');
  }, []);

  const handleNavigate = (path: string) => {
    triggerHaptic('heavy');
    if (/^https?:\/\//i.test(path)) {
      try { window.open(path, '_blank', 'noopener,noreferrer'); } catch { /* ignore */ }
      return;
    }
    appNavigate(path);
    onClose();
  };

  const handlePassport = useCallback(async (action: PassportAction) => {
    triggerHaptic('heavy');
    const result = await applyPassportAction(action);
    if (!result.ok) {
      appToast.error(result.error || 'Could not change location');
      return;
    }
    appToast.success(`Exploring ${result.label}`);
    appNavigate('/client/dashboard');
    onClose();
  }, [appNavigate, onClose]);

  const handleFilter = useCallback(async (filters: Record<string, unknown>) => {
    triggerHaptic('medium');
    const { passportLabel } = await applyConciergeFilters(filters);
    if (passportLabel) {
      appToast.success(`Exploring ${passportLabel} — swipe to see matches`);
      appNavigate('/client/dashboard');
      onClose();
    } else {
      appToast.success('Search filters applied — swipe to see matches');
    }
  }, [appNavigate, onClose]);

  const handleDraft = useCallback((category: string, data: any) => {
    triggerHaptic('heavy');
    if (category === 'profile') {
      const mode = data?.mode === 'owner' ? 'owner' : 'client';
      useModalStore.getState().openAIProfile(mode, data);
      onClose();
      appToast.success('Review your AI-drafted profile and add a photo to publish.');
      return;
    }

    const validCategories = ['property', 'motorcycle', 'bicycle', 'worker'];
    const cat = validCategories.includes(category) ? category : 'property';
    const mode = data?.listing_type === 'sale' || data?.mode === 'sale' ? 'sale' : 'rent';
    try {
      sessionStorage.setItem(
        'swipess_ai_listing_draft',
        JSON.stringify({ category: cat, mode, data, ts: Date.now() })
      );
    } catch { /* ignore */ }
    appNavigate(`/owner/listings/new?category=${cat}&mode=${mode}&fromAI=1`);
    onClose();
    appToast.success('Review your AI-drafted listing and add a photo to publish.');
  }, [appNavigate, onClose]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { duration: 0.12 } }}
          exit={{ opacity: 0, transition: { duration: 0.2 } }}
          className={cn("fixed inset-0 z-[10010] flex items-center justify-center p-2 sm:p-6 modal-scrim", isLight && !isSwipess && "modal-scrim--lux")}
        >
          <motion.div initial={false} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={triggerGenieClose} className="absolute inset-0" />

          <motion.div
            layoutId="concierge-panel"
            initial={GENIE_PANEL_OPEN}
            animate={{
              ...GENIE_PANEL_VISIBLE,
              transition: GENIE_SPRING_OPEN,
            }}
            exit={{
              ...GENIE_PANEL_EXIT,
              transition: GENIE_SPRING_CLOSE,
            }}
            className={cn(
               "relative w-full max-w-4xl h-full sm:h-[88vh] flex flex-col overflow-hidden neo-naive",
               isLight && !isSwipess
                 ? "neo-naive-panel bg-white"
                 : "neo-naive--dark neo-naive-panel--dark bg-black",
             )}
            style={{
              ...GENIE_ORIGIN_BOTTOM,
              paddingTop: 'env(safe-area-inset-top, 0px)',
              paddingBottom: 'env(safe-area-inset-bottom, 0px)',
            }}
          >
            {isSwipess && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/8 rounded-full opacity-70" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full opacity-50" />
              </div>
            )}

            <AnimatePresence mode="sync">
              {sidebarOpen && (
                <ConversationSidebar conversations={conversations} activeId={activeConversationId} onSelect={switchConversation} onDelete={deleteConversation} onNew={() => { createConversation(); setSidebarOpen(false); }} onClose={() => setSidebarOpen(false)} isSwipess={isSwipess} />
              )}
            </AnimatePresence>

            {!hasAcceptedPrivacy ? (
              <ConciergePrivacyPortal onAccept={() => {
                localStorage.setItem('Swipess_ai_privacy', 'true');
                setHasAcceptedPrivacy(true);
                triggerHaptic('success');
              }} isSwipess={isSwipess} />
            ) : (
              <div className="flex-1 flex flex-col relative z-10 overflow-hidden">
                <header className={cn(
                  "h-13 shrink-0 flex items-center justify-between gap-2 px-3 sm:px-4 border-b relative z-30",
                  isLight && !isSwipess ? "border-black/10 bg-white/90" : "border-white/12 bg-black/55"
                )} style={{ height: 52 }}>
                  <div className="flex items-center gap-2.5 min-w-0">
                    <button
                      type="button"
                      onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
                      className={cn(
                        "w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-xl transition-colors",
                        isLight && !isSwipess ? "neo-naive-tile hover:bg-black/[0.04]" : "neo-naive-tile--dark hover:bg-white/[0.06]"
                      )}
                      aria-label="Open chat history"
                    >
                      <Menu className={cn("w-3.5 h-3.5", isLight && !isSwipess ? "text-slate-700" : "text-white")} strokeWidth={2.25} />
                    </button>
                    <div className="flex flex-col min-w-0">
                       <span className={cn("text-[10px] font-black uppercase tracking-[0.28em] italic leading-none", isSwipess ? "text-[#FF3D00]" : isLight ? "text-primary" : "text-[#FF3D00]")}>INTEL CORE</span>
                       <span className={cn("text-[8px] font-bold tracking-widest uppercase opacity-40 mt-1 leading-none", isLight && !isSwipess ? "text-slate-900" : "text-white")}>Online</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <Popover open={characterPanelOpen} onOpenChange={setCharacterPanelOpen}>
                       <PopoverTrigger asChild>
                         <button
                           type="button"
                           className={cn(
                             "h-8 inline-flex items-center gap-2 px-2 rounded-xl transition-colors active:scale-[0.98]",
                             isLight && !isSwipess ? "neo-naive-tile hover:bg-black/[0.04]" : "neo-naive-tile--dark hover:bg-white/[0.06]"
                           )}
                         >
                            <div className="text-right hidden sm:block leading-none">
                               <p className={cn("text-[9px] font-black uppercase tracking-wider", isLight && !isSwipess ? "text-slate-900" : "text-white")}>{CHARACTER_OPTIONS.find(c => c.key === activeCharacter)?.label}</p>
                               <p className="text-[7px] font-bold opacity-40 uppercase tracking-tight mt-0.5">{CHARACTER_OPTIONS.find(c => c.key === activeCharacter)?.subtitle}</p>
                            </div>
                            {(() => {
                              const c = CHARACTER_OPTIONS.find(c => c.key === activeCharacter);
                              const Icon = c?.icon || Sparkles;
                              return (
                                <span className={cn("w-7 h-7 rounded-lg inline-flex items-center justify-center", c?.bgColor || "bg-primary/15")}>
                                  <MotionIcon id="ai-sparkle" loop={isLoading} className="inline-flex items-center justify-center">
                                    <Icon className={cn("w-3.5 h-3.5", c?.color || "text-primary")} strokeWidth={2.25} />
                                  </MotionIcon>
                                </span>
                              );
                            })()}
                         </button>
                       </PopoverTrigger>
                      <PopoverContent side="bottom" align="end" sideOffset={8} className={cn("w-64 p-1.5 z-[70] chrome-solid rounded-2xl", isLight && !isSwipess ? "neo-naive-panel" : "neo-naive-panel--dark")}>
                        <div className="px-2.5 py-2 mb-0.5">
                          <h4 className={cn("text-[9px] font-black uppercase tracking-widest", isLight && !isSwipess ? "text-foreground/45" : "text-white/40")}>Persona</h4>
                        </div>
                        <div className="space-y-0.5 max-h-[50vh] overflow-y-auto">
                          {CHARACTER_OPTIONS.map((c) => (
                            <button
                              key={c.key}
                              type="button"
                              onClick={() => { setActiveCharacter(c.key); setCharacterPanelOpen(false); triggerHaptic('light'); }}
                              className={cn(
                                "w-full flex items-center gap-2.5 px-2 py-2 rounded-xl transition-colors",
                                activeCharacter === c.key
                                  ? "bg-primary/10 border border-primary/20"
                                  : (isLight && !isSwipess ? "hover:bg-foreground/5 border border-transparent" : "hover:bg-white/5 border border-transparent")
                              )}
                            >
                              <span className={cn("w-7 h-7 rounded-lg inline-flex items-center justify-center shrink-0", c.bgColor)}>
                                <c.icon className={cn("w-3.5 h-3.5", c.color)} strokeWidth={2.25} />
                              </span>
                              <div className="text-left flex-1 min-w-0">
                                <p className={cn("text-[11px] font-black uppercase tracking-wide truncate", activeCharacter === c.key ? "text-primary" : (isLight && !isSwipess ? "text-foreground" : "text-white"))}>{c.label}</p>
                                <p className={cn("text-[8px] font-bold uppercase tracking-tight truncate opacity-55", isLight && !isSwipess ? "text-foreground" : "text-white")}>{c.subtitle}</p>
                              </div>
                              {activeCharacter === c.key && <span className="ml-auto w-1.5 h-1.5 rounded-full bg-primary shrink-0" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <button
                      type="button"
                      onClick={triggerGenieClose}
                      className={cn(
                        "w-8 h-8 shrink-0 inline-flex items-center justify-center rounded-xl transition-colors active:scale-95",
                        isLight && !isSwipess ? "neo-naive-tile hover:bg-black/[0.04]" : "neo-naive-tile--dark hover:bg-white/[0.06]"
                      )}
                      aria-label="Close"
                    >
                      <X className={cn("w-3.5 h-3.5", isLight && !isSwipess ? "text-slate-700" : "text-white")} strokeWidth={2.25} />
                    </button>
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto scroll-smooth custom-scrollbar">
                  {messages.length === 0 ? (
                    <WelcomeState
                      isSwipess={isSwipess}
                      isLight={isLight}
                       onPick={(prompt, _category) => {
                          sendMessage(prompt);
                          triggerHaptic('light');
                        }}
                    />
                  ) : (
                    <VirtualizedConciergeMessageList
                      scrollElementRef={scrollRef}
                      messages={messages}
                      isLoading={isLoading}
                      isSwipess={isSwipess}
                      isLight={isLight}
                      speakingMsgId={speakingMsgId}
                      isSpeaking={isSpeaking}
                      onCopy={handleCopy}
                      onDelete={deleteMessage}
                      onTranslate={handleTranslate}
                      onResend={resendMessage}
                      onNavigate={handleNavigate}
                      onDraft={handleDraft}
                      onFilter={handleFilter}
                      onPassport={handlePassport}
                      onSpeak={handleSpeak}
                    />
                  )}
                </div>

                <footer className="p-3 sm:p-4 transition-all duration-500 relative z-20">
                  <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

                  <div className="max-w-3xl mx-auto mb-2">
                    <AIDisclosure isLight={isLight && !isSwipess} variant="compact" />
                  </div>

                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 6, scale: 0.96 }}
                        className="absolute -top-14 left-1/2 -translate-x-1/2 flex items-center gap-2.5 px-3 py-2 rounded-xl border border-border/50 bg-background chrome-solid shadow-lg"
                      >
                         <Timer className="w-3.5 h-3.5 text-[#FF3D00] shrink-0" strokeWidth={2.25} />
                         <span className={cn("text-[10px] font-black uppercase tracking-widest whitespace-nowrap", isLight ? "text-slate-900" : "text-white")}>Send in</span>
                         <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[#FF3D00] text-white text-xs font-black">{countdown}</span>
                         <button type="button" onClick={cancelCountdown} className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors" aria-label="Cancel auto-send">
                            <X className="w-3.5 h-3.5" strokeWidth={2.25} />
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-w-3xl mx-auto flex items-end gap-2 relative">
                    <div className={cn(
                      "flex-1 min-w-0 relative flex items-center transition-all duration-300 overflow-hidden rounded-2xl",
                      isLight && !isSwipess ? "neo-naive-panel" : "neo-naive-panel--dark",
                    )}>
                       <div className="pl-1.5 pr-0.5 flex items-center gap-0.5 self-center shrink-0">
                           <Popover>
                             <PopoverTrigger asChild>
                          <button type="button" className={cn("w-8 h-8 inline-flex items-center justify-center rounded-lg transition-colors", isLight ? "text-slate-600 hover:bg-black/[0.05] hover:text-slate-900" : "text-white/75 hover:bg-white/[0.08] hover:text-white")} aria-label="Auto-send timer">
                                    <Timer className="w-3.5 h-3.5" strokeWidth={2.25} />
                               </button>
                             </PopoverTrigger>
                             <PopoverContent side="top" sideOffset={8} className="w-56 p-1.5 rounded-2xl border border-border/50 bg-background chrome-solid shadow-xl">
                               <button type="button" onClick={() => { setAutoSendEnabled(!autoSendEnabled); triggerHaptic('light'); }} className="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl hover:bg-secondary transition-colors" aria-pressed={autoSendEnabled}>
                                  <span className={cn("inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-900" : "text-white")}>
                                    <Timer className="w-3.5 h-3.5 text-[#FF3D00]" strokeWidth={2.25} />
                                    Auto-Send
                                  </span>
                                  <div className={cn("w-10 h-6 rounded-full relative transition-all", autoSendEnabled ? "bg-[#FF3D00]" : "bg-secondary")}>
                                     <div className={cn("absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all", autoSendEnabled ? "right-0.5" : "left-0.5")} />
                                 </div>
                              </button>
                           </PopoverContent>
                         </Popover>

                          <button
                            type="button"
                            onClick={isListening ? stopListening : startListening}
                            className={cn(
                              "w-8 h-8 inline-flex items-center justify-center rounded-lg transition-all relative",
                              isListening
                                ? "bg-[#FF3D00] text-white shadow-[0_0_16px_rgba(255,61,0,0.35)]"
                                : isLight ? "text-slate-600 hover:bg-black/[0.05] hover:text-slate-900" : "text-white/75 hover:bg-white/[0.08] hover:text-white"
                            )}
                            aria-label={isListening ? "Stop listening" : "Voice input"}
                          >
                             <Mic className={cn("w-3.5 h-3.5 relative z-10", isListening && "animate-pulse")} strokeWidth={2.25} />
                         </button>
                       </div>

                       <textarea
                          ref={textareaRef}
                          value={input}
                          onChange={(e) => {
                            setInput(e.target.value);
                            cancelCountdown();
                            const el = textareaRef.current;
                            if (el) {
                              el.style.height = 'auto';
                              el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
                            }
                          }}
                          placeholder={isListening ? "Listening…" : "Ask anything…"}
                          rows={1}
                          className={cn(
                            "flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 py-3 pl-1 pr-3 text-[15px] resize-none custom-scrollbar min-h-[44px] max-h-40 leading-snug self-center font-medium",
                            isListening ? "text-[#FF3D00] placeholder:text-[#FF3D00]/50" : isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/40"
                          )}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                    </div>

                    <button
                      type="button"
                      onClick={handleSend}
                      onPointerDown={() => setSendPressed(true)}
                      onPointerUp={() => setSendPressed(false)}
                      onPointerLeave={() => setSendPressed(false)}
                      onPointerCancel={() => setSendPressed(false)}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "h-11 w-11 shrink-0 rounded-full inline-flex items-center justify-center transition-all duration-200 relative overflow-hidden active:scale-95",
                        (!input.trim() || isLoading)
                          ? "bg-secondary border border-border/50 text-foreground/40 cursor-not-allowed"
                          : "bg-[#FF3D00] text-white shadow-[0_6px_18px_rgba(255,61,0,0.32)] hover:bg-[#FF3D00]/90 border border-white/10"
                      )}
                      aria-label="Send message"
                    >
                      {isLoading ? (
                        <MotionIcon id="ai-sparkle" loop className="inline-flex items-center justify-center">
                          <RefreshCw className="h-4 w-4 animate-spin" strokeWidth={2.5} />
                        </MotionIcon>
                      ) : (
                        <MotionIcon id="send" active={sendPressed} className="inline-flex items-center justify-center">
                          <ArrowUp className="h-4 w-4" strokeWidth={2.5} />
                        </MotionIcon>
                      )}
                    </button>
                  </div>
                </footer>
              </div>
            )}
          </motion.div>

        </motion.div>
      )}
    </AnimatePresence>,
    document.body
  );
}

ConciergeChatComponent.displayName = 'ConciergeChat';
export const ConciergeChat = memo(ConciergeChatComponent);
