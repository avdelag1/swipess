import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, Square, Sparkles, Plus, 
  Trash2, Menu, Check, Zap, Flame, Sun, Crown, Moon, 
  ChevronRight, Copy, Languages, CornerDownRight, Search, Timer, Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useConciergeAI, ChatMessage, AiCharacter } from '@/hooks/useConciergeAI';
import { uiSounds } from '@/utils/uiSounds';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useTheme } from '@/hooks/useTheme';
import { useModalStore } from '@/state/modalStore';

/* ─── Privacy Portal ─── */
const ConciergePrivacyPortal = ({ onAccept, isSwipess }: { onAccept: () => void, isSwipess: boolean }) => (
  <div className={cn(
    "flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full",
    isSwipess ? "bg-black" : "bg-background"
  )}>
    <div className={cn(
      "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 border relative",
      isSwipess ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.2)]" : 
      "bg-primary/10 border-primary/20"
    )}>
      <Sparkles className={cn("w-10 h-10 animate-pulse", isSwipess ? "text-cyan-400" : "text-primary")} />
    </div>
    <h2 className={cn(
      "text-2xl font-black tracking-tight uppercase",
      isSwipess ? "text-white" : "text-foreground"
    )}>
      {isSwipess ? "Swipess Intel" : "Concierge AI"}
    </h2>
    <p className={cn(
      "text-xs leading-relaxed max-w-[280px]",
      isSwipess ? "text-white/50" : "text-muted-foreground"
    )}>
      Initialize the discovery interface. Your inquiries are handled with absolute confidentiality and processed by flagship-grade intelligence.
    </p>
    <div className="p-4 rounded-xl border mb-4 text-[10px] leading-tight text-center bg-muted border-border text-muted-foreground">
      <p className="font-bold uppercase tracking-widest mb-1 text-[11px] text-foreground">AI Disclaimer</p>
      Swipess AI provides automated recommendations for informational purposes only. It is not a substitute for professional real estate, legal, or financial advice. Accuracy is not guaranteed.
    </div>
    
    <div className="w-full max-w-xs pt-4">
      <Button 
        onClick={onAccept}
        className="w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all shadow-xl"
      >
        Authorize Session
      </Button>
    </div>
  </div>
);

/* ─── Message Bubble ─── */
const MessageBubble = ({ 
  message, isUser, isSwipess, onCopy, onDelete, onTranslate, onResend, onNavigate 
}: { 
  message: ChatMessage, isUser: boolean, isSwipess: boolean,
  onCopy: () => void, onDelete: () => void, onTranslate?: (l:string)=>void,
  onResend?: () => void, onNavigate?: (p:string)=>void 
}) => {
  const [showActions, setShowActions] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, x: isUser ? 20 : -20, y: 10 }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      className={cn(
        "flex flex-col gap-2 mb-6 max-w-[88%]",
        isUser ? "ml-auto items-end text-right" : "mr-auto items-start text-left"
      )}
      onClick={() => { triggerHaptic('light'); setShowActions(!showActions); }}
    >
      <div className={cn(
        "p-4 rounded-2xl text-sm leading-relaxed break-words relative overflow-hidden",
        isUser 
          ? (isSwipess ? 'bg-cyan-500 text-black rounded-br-md shadow-[0_10px_20px_rgba(34,211,238,0.2)]' : 'bg-primary text-primary-foreground rounded-br-md shadow-md')
          : (isSwipess ? 'bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-bl-md' : 'bg-muted/80 text-foreground border border-border/30 rounded-bl-md shadow-sm')
      )}>
        <span className="whitespace-pre-wrap">{message.content}</span>
      </div>

      <AnimatePresence>
        {showActions && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn("flex items-center gap-1.5 mt-1 px-1", isUser ? "flex-row-reverse" : "flex-row")}
          >
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:bg-white/10 transition-all">
              <Copy className="w-3 h-3 opacity-60" />
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className="p-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:bg-white/10 transition-all">
                <Languages className="w-3 h-3 opacity-60" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className="p-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:bg-white/10 transition-all">
                <Plus className="w-3 h-3 opacity-60" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-1.5 rounded-lg bg-background/50 backdrop-blur-sm border border-border/20 hover:bg-white/10 transition-all">
              <Trash2 className="w-3 h-3 text-red-400/60" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

/* ─── Typing Indicator ─── */
const TypingIndicator = () => (
  <div className="flex justify-start mb-4">
    <div className={cn(
      "px-5 py-3.5 rounded-2xl rounded-bl-md flex items-center gap-[3px] border transition-all",
      isSwipess ? "bg-white/5 backdrop-blur-xl border-cyan-500/20" : "bg-muted/80 border-border/30"
    )}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className={cn("w-[2px] rounded-full", isSwipess ? "bg-cyan-400/70" : "bg-primary/70")}
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          style={{ height: '12px' }}
        />
      ))}
    </div>
  </div>
);

/* ─── Sidebar ─── */
const ConversationSidebar = ({ conversations, activeId, onSelect, onDelete, onNew, onClose }: any) => (
  <motion.div
    initial={{ x: -280, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
    className={cn(
      "absolute inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl transition-all",
      isSwipess ? "bg-black border-r border-white/5" : "bg-background border-r border-border"
    )}
  >
    <div className={cn("flex items-center justify-between px-5 py-4 border-b", isSwipess ? "border-white/5" : "border-border")}>
      <h3 className={cn("text-[11px] font-black uppercase tracking-widest", isSwipess ? "text-cyan-400" : "text-foreground")}>Archives</h3>
      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
        <X className="w-4 h-4 opacity-40" />
      </button>
    </div>
    
    <div className="p-3">
      <button 
        onClick={onNew}
        className="w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group bg-primary/10 border-primary/20 hover:bg-primary/20"
      >
        <Plus className={cn("w-4 h-4 group-hover:scale-110 transition-transform", isSwipess ? "text-cyan-400" : "text-primary")} />
        <span className="text-xs font-bold uppercase tracking-wider">New Session</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto Swipess-scroll px-3 space-y-1">
      {conversations.map((c: any) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              "w-full flex flex-col items-start px-4 py-3.5 rounded-xl transition-all duration-300 border",
              activeId === c.id ? "bg-primary/10 border-primary/30" : "hover:bg-muted/50 border-transparent"
            )}
          >
            <span className={cn("text-xs font-bold truncate w-full text-left", activeId === c.id ? (isSwipess ? "text-cyan-400" : "text-primary") : "opacity-60")}>
              {c.title || 'Untitled Session'}
            </span>
            <span className="text-[10px] opacity-30 mt-1">{new Date(c.updatedAt).toLocaleDateString()}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-400"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
);

/* ─── Main Component ─── */
export function ConciergeChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme } = useTheme();
  const isSwipess = theme === 'Swipess-style';

  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    return localStorage.getItem('Swipess_ai_privacy') === 'true';
  });

  const LAST_ACTIVITY_KEY = 'Swipess_ai_last_activity';

  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, deleteMessage, stopGeneration,
    createConversation, switchConversation, deleteConversation, clearHistory,
    activeCharacter, setActiveCharacter,
  } = useConciergeAI();

  // ── Session Reset Logic ──
  useEffect(() => {
    if (isOpen) {
      const lastActivity = parseInt(localStorage.getItem(LAST_ACTIVITY_KEY) || '0', 10);
      const now = Date.now();
      if (now - lastActivity > 600000) { // 10 minutes session
        createConversation();
      }
      localStorage.setItem(LAST_ACTIVITY_KEY, now.toString());
    }
  }, [isOpen, createConversation]);

  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
    }
  }, [messages]);

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isAutoFlow, setIsAutoFlow] = useState(false);
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const recognitionRef = useRef<any>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Voice & Auto-Flow Logic ──
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
  }, []);

  const handleSend = useCallback(() => {
    const text = inputRef.current?.value || input;
    if (!text.trim() || isLoading) return;
    sendMessage(text);
    setInput('');
    triggerHaptic('medium');
    stopListening();
  }, [input, isLoading, sendMessage, stopListening]);

  const startListening = useCallback(() => {
    if (isListening) {
      stopListening();
      return;
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast.error("Speech Recognition not supported in this browser.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = navigator.language || 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
      triggerHaptic('light');
    };

    recognition.onresult = (event: any) => {
      let finalTranscript = '';
      let interimTranscript = '';
      
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interimTranscript += transcript;
        }
      }

      if (finalTranscript) {
        setInput(prev => prev + finalTranscript + ' ');
      }
      
      if (interimTranscript || finalTranscript) {
        if (isAutoFlow) {
          if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
          silenceTimerRef.current = setTimeout(() => {
            handleSend();
          }, 5000);
        }
      }
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      if (event.error === 'not-allowed') {
        toast.error("Microphone access denied. Please check your browser settings.");
      } else {
        toast.error(`Recognition error: ${event.error}`);
      }
      stopListening();
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [isListening, isAutoFlow, stopListening, handleSend]);

  useEffect(() => {
    return () => {
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    triggerHaptic('success');
  };

  const { navigate: appNavigate } = useAppNavigate();
  const handleNavigate = (path: string) => {
    onClose();
    setTimeout(() => appNavigate(path), 200);
  };

  const handleTranslate = (lang: string) => {
    sendMessage(`Translate your previous message to ${lang}`);
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading, isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          className={cn(
            "fixed inset-0 z-[10000] flex flex-col overflow-hidden transition-colors duration-500",
            isSwipess ? "bg-black Swipess-style" : "bg-background"
          )}
        >
          {/* Background Ambient */}
          {isSwipess && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-[-10%] left-[-10%] w-full h-[60%] bg-cyan-900/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full" />
            </div>
          )}

          {!hasAcceptedPrivacy ? (
            <ConciergePrivacyPortal onAccept={() => {
              localStorage.setItem('Swipess_ai_privacy', 'true');
              setHasAcceptedPrivacy(true);
              triggerHaptic('success');
            }} isSwipess={isSwipess} />
          ) : (
            <div className="flex-1 flex flex-col relative z-20 overflow-hidden">
              <AnimatePresence>
                {sidebarOpen && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                  />
                )}
              </AnimatePresence>

              <AnimatePresence>
                {sidebarOpen && (
                  <ConversationSidebar
                    conversations={conversations}
                    activeId={activeConversationId}
                    onSelect={switchConversation}
                    onDelete={deleteConversation}
                    onNew={() => { createConversation(); setSidebarOpen(false); }}
                    onClose={() => setSidebarOpen(false)}
                  />
                )}
              </AnimatePresence>

              {/* Header */}
              <div className={cn(
                "h-16 flex items-center justify-between px-5 border-b backdrop-blur-xl transition-all",
                isSwipess ? "border-white/5 bg-black/40" : "border-border bg-background/80"
              )}>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center border bg-primary/10 border-primary/20 transition-all">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.2em] uppercase", isSwipess ? "text-cyan-400" : "text-foreground")}>
                      {isSwipess ? "Interface" : "Assistant"}
                    </span>
                    <span className="text-[9px] font-medium opacity-30 tracking-tight">
                      PRO.CONCIERGE
                    </span>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setSidebarOpen(true)}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all opacity-40 hover:opacity-100"
                  >
                    <Menu className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={onClose}
                    className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-all opacity-40 hover:opacity-100"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div 
                ref={scrollRef}
                className={cn(
                  "flex-1 overflow-y-auto Swipess-scroll p-4 space-y-1 relative"
                )}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className="w-16 h-16 rounded-[2rem] border border-primary/10 flex items-center justify-center bg-primary/5"
                    >
                      <Sparkles className="w-8 h-8 opacity-40 text-primary" />
                    </motion.div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-80">
                        {isSwipess ? "Interface Ready" : "Concierge Ready"}
                      </h3>
                      <p className="text-[10px] opacity-20 uppercase tracking-widest">
                        {isSwipess ? "Awaiting Command" : "How can I assist you today?"}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble 
                      key={m.id}
                      message={m}
                      isUser={m.role === 'user'}
                      isSwipess={isSwipess}
                      onCopy={() => handleCopy(m.content)}
                      onDelete={() => deleteMessage(m.id)}
                      onTranslate={m.role === 'assistant' ? handleTranslate : undefined}
                      onResend={m.role === 'user' ? () => resendMessage(m.id) : undefined}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
                {isLoading && <TypingIndicator />}
              </div>

              {/* Input Area */}
              <div className={cn(
                 "p-4 border-t pb-[calc(env(safe-area-inset-bottom,0px)+16px)] transition-all",
                 isSwipess ? "bg-black border-white/5" : "bg-background border-border"
              )}>
                <div className={cn(
                  "p-1.5 rounded-2xl relative overflow-hidden group transition-all border",
                  isSwipess ? "bg-white/5 border-white/10" : "bg-muted/40 border-border"
                )}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isSwipess ? "ENTER COMMAND..." : "Ask anything..."}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 min-h-12 placeholder:opacity-30"
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <div className="flex items-center gap-1">
                      <button className="p-2 opacity-30 hover:opacity-100 transition-opacity"><Mic className="w-4 h-4" /></button>
                      <button 
                        onClick={(e) => {
                          e.preventDefault();
                          useModalStore.getState().openAIListing();
                        }}
                        className="p-2 opacity-30 hover:opacity-100 transition-opacity text-cyan-400"
                      >
                        <Sparkles className="w-4 h-4" />
                      </button>
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-20",
                        isSwipess ? "bg-cyan-500 text-black" : "bg-primary text-white"
                      )}
                    >
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}


