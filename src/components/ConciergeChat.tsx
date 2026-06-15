import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowUp, Crown, Flame, Menu, Mic, Moon, RefreshCw, Sparkles, Sun, Timer, X
} from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
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

function ConciergeChatComponent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, isLight } = useAppTheme();
  const isSwipess = theme !== 'light';
  const LAST_ACTIVITY_KEY = 'Swipess_ai_last_activity';

  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    return localStorage.getItem('Swipess_ai_privacy') === 'true';
  });

  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, deleteMessage,
    createConversation, switchConversation, deleteConversation,
    activeCharacter, setActiveCharacter, egoLevel: _egoLevel,
  } = useConciergeAI();

  const { navigate: appNavigate } = useAppNavigate();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const [isExiting, setIsExiting] = useState(false); // Aladdin/genie minimize effect
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
  useEffect(() => {
    if (isOpen && !hasPlayedOpenSound.current) {
      uiSounds.playWelcome();
      hasPlayedOpenSound.current = true;
    } else if (!isOpen) {
      hasPlayedOpenSound.current = false;
    }
  }, [isOpen]);

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

  useEffect(() => {
    if (isOpen) {
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const now = Date.now();
      if (now - lastActivity > 600000) createConversation();
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }
  }, [isOpen, createConversation]);

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

  const {
    start: startTranscribe,
    stop: stopTranscribe,
  } = useVoiceTranscribe({
    onStop: (text) => {
      isListeningRef.current = false;
      setIsListening(false);
      cancelCountdown();
      uiSounds.playMicOff();
      if (text) {
        if (autoSendEnabledRef.current) {
          sendMessage(text);
        } else {
          setInput(prev => (prev.trim() + ' ' + text).trim());
        }
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
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, transition: { duration: 0.6 } }}
          className={cn("fixed inset-0 z-[10010] flex items-center justify-center p-2 sm:p-6 modal-scrim", isLight && !isSwipess && "modal-scrim--lux")}
        >
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={triggerGenieClose} className="absolute inset-0" />

          <motion.div
            layoutId="concierge-panel"
            initial={{ scaleX: 0.05, scaleY: 0.05, y: '45vh', opacity: 0 }}
            animate={{ 
              scaleX: 1, scaleY: 1, y: 0, opacity: 1,
              transition: { type: 'spring', damping: 22, stiffness: 280, mass: 0.7 }
            }}
            exit={{ 
              scale: 0.04,
              y: 520,
              opacity: 0,
              borderRadius: "999px",
              transition: { 
                type: "spring", 
                stiffness: 180, 
                damping: 22, 
                mass: 0.6,
                duration: 0.42 
              }
            }}
            className={cn(
               "relative w-full max-w-4xl h-full sm:h-[88vh] flex flex-col rounded-[2.5rem] sm:rounded-[3.5rem] overflow-hidden border shadow-[0_40px_150px_rgba(0,0,0,0.9)] transition-colors duration-700",
               isLight && !isSwipess ? "bg-white border-black/10" : "bg-black border-white/10"
             )}
            style={{
              transformOrigin: 'bottom center',
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

            <AnimatePresence>
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
                  "h-16 shrink-0 flex items-center justify-between px-6 border-b transition-all duration-500 relative z-30",
                  isLight && !isSwipess ? "border-slate-200 bg-white chrome-solid" : "border-white/5 bg-black/90 chrome-solid"
                )}>
                  <div className="flex items-center gap-4">
                    <button onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }} className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all border group", isLight && !isSwipess ? "bg-slate-100 border-slate-200 hover:bg-slate-200" : "bg-white/5 border-white/10 hover:bg-white/20")}>
                      <Menu className={cn("w-4 h-4 transition-transform group-hover:scale-110", isLight && !isSwipess ? "text-slate-600" : "text-white/60")} />
                    </button>
                    <div className="flex flex-col relative">
                       <span className={cn("text-[11px] font-black uppercase tracking-[0.5em] italic", isSwipess ? "text-[#FF3D00] brand-glow" : isLight ? "text-primary" : "text-[#FF3D00]")}>INTEL CORE</span>
                       <div className="flex items-center gap-1.5">
                          <div className={cn("w-1 h-1 rounded-full animate-pulse", isSwipess ? "bg-[#FF3D00]" : "bg-primary")} />
                          <span className={cn("text-[8px] font-black tracking-widest uppercase opacity-40", isLight && !isSwipess ? "text-slate-900" : "text-white")}>System: Operational</span>
                       </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Popover open={characterPanelOpen} onOpenChange={setCharacterPanelOpen}>
                       <PopoverTrigger asChild>
                         <button className={cn("flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95", isLight && !isSwipess ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10")}>
                            <div className="text-right hidden sm:block">
                               <p className={cn("text-[9px] font-black uppercase tracking-widest", isLight && !isSwipess ? "text-slate-900" : "text-white")}>{CHARACTER_OPTIONS.find(c => c.key === activeCharacter)?.label}</p>
                               <p className="text-[7px] font-bold opacity-40 uppercase tracking-tighter -mt-0.5">{CHARACTER_OPTIONS.find(c => c.key === activeCharacter)?.subtitle}</p>
                            </div>
                            {(() => {
                              const c = CHARACTER_OPTIONS.find(c => c.key === activeCharacter);
                              const Icon = c?.icon || Sparkles;
                              return (
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", c?.bgColor || "bg-primary/15")}>
                                  <Icon className={cn("w-5 h-5", c?.color || "text-primary")} />
                                </div>
                              );
                            })()}
                         </button>
                       </PopoverTrigger>
                      <PopoverContent side="bottom" align="end" className={cn("w-72 p-2 rounded-3xl border shadow-2xl z-[70] chrome-solid", isLight && !isSwipess ? "bg-white border-slate-200" : "bg-black/95 border-white/10")}>
                        <div className="p-3 mb-2">
                          <h4 className={cn("text-[10px] font-black uppercase tracking-widest italic", isLight && !isSwipess ? "text-foreground/50" : "text-white/40")}>Select Logic Profile</h4>
                        </div>
                        <div className="space-y-1">
                          {CHARACTER_OPTIONS.map((c) => (
                            <button
                              key={c.key}
                              onClick={() => { setActiveCharacter(c.key); setCharacterPanelOpen(false); triggerHaptic('light'); }}
                              className={cn("w-full flex items-center gap-3 p-3 rounded-2xl transition-all group", activeCharacter === c.key ? "bg-primary/10 border border-primary/20" : (isLight && !isSwipess ? "hover:bg-foreground/5 border border-transparent" : "hover:bg-white/5 border border-transparent"))}
                            >
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", c.bgColor)}>
                                <c.icon className={cn("w-5 h-5", c.color)} />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className={cn("text-[11px] font-black uppercase tracking-widest", activeCharacter === c.key ? "text-primary" : (isLight && !isSwipess ? "text-foreground" : "text-white"))}>{c.label} <span className="opacity-50 font-bold">— {c.tagline}</span></p>
                                <p className={cn("text-[8px] font-bold opacity-60 uppercase tracking-tighter", isLight && !isSwipess ? "text-foreground/70" : "text-white/70")}>{c.subtitle}</p>
                              </div>
                              {activeCharacter === c.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <button onClick={triggerGenieClose} className={cn("w-9 h-9 flex items-center justify-center rounded-full transition-all border group active:scale-90", isLight && !isSwipess ? "bg-muted border-border hover:bg-slate-200" : "bg-white/5 border-white/10 hover:bg-white/15")} aria-label="Close">
                      <X className={cn("w-[18px] h-[18px]", isLight && !isSwipess ? "text-slate-600" : "text-white/80")} strokeWidth={2.2} />
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

                <footer className="p-4 sm:p-6 transition-all duration-500 relative z-20">
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />

                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-2xl border border-border/50 bg-background chrome-solid shadow-[0_20px_40px_hsl(var(--foreground)/0.1)]"
                      >
                         <Timer className="w-4 h-4 text-[#FF3D00]" />
                         <span className={cn("text-[11px] font-black uppercase tracking-widest whitespace-nowrap", isLight ? "text-slate-900" : "text-white")}>Send in</span>
                         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3D00] text-white text-sm font-black shadow-lg shadow-[#FF3D00]/30">{countdown}</span>
                         <button onClick={cancelCountdown} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-inner" aria-label="Cancel auto-send">
                            <X className="w-4 h-4" />
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-w-3xl mx-auto flex items-end gap-3 relative">
                    <div className="flex-1 min-w-0 relative flex items-center rounded-2xl transition-colors duration-200 border border-border/50 bg-secondary/40 shadow-inner focus-within:bg-background focus-within:border-foreground/15 group overflow-hidden">
                       <div className="pl-2 flex items-center gap-0.5 self-center">
                           <Popover>
                             <PopoverTrigger asChild>
                          <button className={cn("p-2 rounded-xl transition-all hover:bg-secondary/80", isLight ? "text-slate-600 hover:text-slate-900" : "text-white/80 hover:text-white")} aria-label="Auto-send timer">
                                    <Timer className="w-5 h-5" strokeWidth={2.5} />
                               </button>
                             </PopoverTrigger>
                             <PopoverContent side="top" className="w-64 p-2 rounded-2xl border border-border/50 bg-background chrome-solid shadow-[0_20px_40px_hsl(var(--foreground)/0.15)]">
                               <button onClick={() => { setAutoSendEnabled(!autoSendEnabled); triggerHaptic('light'); }} className="w-full flex items-center justify-between gap-4 p-4 rounded-3xl hover:bg-secondary transition-all" aria-pressed={autoSendEnabled}>
                                  <span className={cn("flex items-center gap-3 text-[11px] font-black uppercase tracking-widest", isLight ? "text-slate-900" : "text-white")}>
                                    <Timer className="w-4 h-4 text-[#FF3D00]" />
                                    Auto-Send
                                  </span>
                                  <div className={cn("w-12 h-7 rounded-full relative transition-all ring-1 shadow-inner", autoSendEnabled ? "bg-[#FF3D00] ring-[#FF3D00]/30" : "bg-secondary ring-border")}>
                                     <div className={cn("absolute top-1 h-5 w-5 rounded-full shadow-md transition-all", autoSendEnabled ? "right-1 bg-white" : "left-1 bg-background")} />
                                 </div>
                              </button>
                           </PopoverContent>
                         </Popover>

                          <button
                            onClick={isListening ? stopListening : startListening}
                            className={cn(
                              "p-2 rounded-xl transition-all relative group overflow-hidden hover:bg-secondary/80",
                              isListening
                                ? "bg-[#FF3D00] text-white shadow-[0_0_24px_rgba(255,61,0,0.4)] scale-110"
                                : isLight ? "text-slate-600 hover:text-slate-900" : "text-white/80 hover:text-white"
                            )}
                          >
                             {isListening ? <Mic className="w-5 h-5 animate-pulse relative z-10" strokeWidth={2.5} /> : <Mic className="w-5 h-5 relative z-10" strokeWidth={2.5} />}
                            {isListening && (
                               <motion.div className="absolute inset-0 bg-white/20 rounded-2xl" animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            )}
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
                              el.style.height = `${Math.min(el.scrollHeight, 192)}px`;
                            }
                          }}
                          placeholder={isListening ? "Listening…" : "Inquire for discovery"}
                          rows={1}
                          className={cn(
                            "flex-1 min-w-0 bg-transparent border-none outline-none focus:ring-0 py-4 pl-1 pr-3 text-[16px] resize-none custom-scrollbar min-h-[56px] max-h-48 leading-snug self-center font-medium",
                            isListening ? "text-[#FF3D00] placeholder:text-[#FF3D00]/50" : isLight ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/40"
                          )}
                          onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                        />
                    </div>

                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "h-14 w-14 shrink-0 rounded-full inline-flex items-center justify-center transition-all duration-300 relative group overflow-hidden active:scale-90",
                        (!input.trim() || isLoading)
                          ? "bg-secondary border border-border/50 text-foreground/40 cursor-not-allowed"
                          : "bg-[#FF3D00] text-white shadow-[0_8px_24px_rgba(255,61,0,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,0,0.5)] hover:bg-[#FF3D00]/90 border border-white/10 hover:scale-105"
                      )}
                      aria-label="Send message"
                    >
                      {input.trim() && !isLoading && (
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      )}

                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin relative z-10" strokeWidth={3} />
                      ) : (
                        <ArrowUp className="h-6 w-6 relative z-10" strokeWidth={3} />
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
