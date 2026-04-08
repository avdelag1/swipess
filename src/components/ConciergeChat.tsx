import { useState, useRef, useEffect, useCallback, memo, useMemo } from 'react';
import { X, Send, Trash2, Copy, Sparkles, RefreshCw, Plus, Menu, ChevronLeft, Square, Globe, Flame, Sun, Crown, Moon, ChevronDown, Mic, MicOff, Zap, ArrowRight } from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';
import { Button } from '@/components/ui/button';
import { useConciergeAI, ChatMessage, Conversation, AiCharacter } from '@/hooks/useConciergeAI';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppNavigate } from '@/hooks/useAppNavigate';

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
}

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'es', label: 'Español' },
  { code: 'fr', label: 'Français' },
  { code: 'de', label: 'Deutsch' },
  { code: 'it', label: 'Italiano' },
  { code: 'zh', label: '中文' },
  { code: 'ja', label: '日本語' },
  { code: 'ru', label: 'Русский' },
];

function formatTime(date: Date) {
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatDate(date: Date) {
  const today = new Date();
  if (date.toDateString() === today.toDateString()) return 'Today';
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatConvoDate(date: Date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

/* ─── NAV Tag Parsing ─── */
const NAV_PATTERN = /\[NAV:(\/[^\]]+)\]/g;

const NAV_LABELS: Record<string, string> = {
  '/client/filters': '🔍 Open Filters',
  '/radio': '📻 Open Radio',
  '/client/profile': '👤 My Profile',
  '/client/settings': '⚙️ Settings',
  '/subscription/packages': '💎 View Packages',
  '/client/liked': '❤️ Liked Properties',
  '/owner/listings': '🏠 My Listings',
  '/legal': '📄 Legal Section',
  '/events': '🎉 Browse Events',
};

function parseNavActions(content: string): { cleanContent: string; navPaths: string[] } {
  const navPaths: string[] = [];
  const cleanContent = content.replace(NAV_PATTERN, (_, path) => {
    navPaths.push(path);
    return '';
  }).replace(/\n{3,}/g, '\n\n').trim();
  return { cleanContent, navPaths };
}

/* ─── Message Bubble ─── */
const MessageBubble = memo(({ message, onCopy, onResend, onTranslate, onNavigate, isUser }: {
  message: ChatMessage;
  onCopy: () => void;
  onResend?: () => void;
  onTranslate?: (lang: string) => void;
  onNavigate?: (path: string) => void;
  isUser: boolean;
}) => {
  const { cleanContent, navPaths } = useMemo(
    () => isUser ? { cleanContent: message.content, navPaths: [] } : parseNavActions(message.content),
    [message.content, isUser]
  );

  return (
  <div className={cn('flex w-full mb-4', isUser ? 'justify-end' : 'justify-start')}>
    <div className="max-w-[82%] relative group">
      <div className={cn(
        'text-[10px] mb-1 font-medium text-muted-foreground/60',
        isUser ? 'text-right' : 'text-left'
      )}>
        {formatDate(message.timestamp)} · {formatTime(message.timestamp)}
      </div>

      <div className={cn(
        'px-4 py-3 rounded-2xl text-sm leading-relaxed break-words',
        isUser
          ? 'bg-primary text-primary-foreground rounded-br-md'
          : 'bg-muted/80 text-foreground rounded-bl-md border border-border/30'
      )}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        )}
      </div>

      {/* Navigation action buttons */}
      {navPaths.length > 0 && onNavigate && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {navPaths.map(path => (
            <button
              key={path}
              onClick={() => onNavigate(path)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
            >
              {NAV_LABELS[path] || path}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      {/* Action bar — always visible on touch, hover on desktop */}
      <div className={cn(
        'flex items-center gap-1 mt-1 transition-opacity',
        'opacity-100 sm:opacity-0 sm:group-hover:opacity-100',
        isUser ? 'justify-end' : 'justify-start'
      )}>
        <button onClick={onCopy} className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground" aria-label="Copy">
          <Copy className="w-3 h-3" />
        </button>
        {isUser && onResend && (
          <button onClick={onResend} className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground" aria-label="Resend">
            <RefreshCw className="w-3 h-3" />
          </button>
        )}
        {!isUser && onTranslate && (
          <Popover>
            <PopoverTrigger asChild>
              <button className="p-1 rounded-md hover:bg-muted text-muted-foreground/60 hover:text-muted-foreground" aria-label="Translate">
                <Globe className="w-3 h-3" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-40 p-1.5" side="top" align="start">
              <div className="grid gap-0.5">
                {LANGUAGES.map(l => (
                  <button
                    key={l.code}
                    onClick={() => onTranslate(l.label)}
                    className="text-left text-xs px-2.5 py-1.5 rounded-lg hover:bg-muted/80 text-foreground transition-colors"
                  >
                    {l.label}
                  </button>
                ))}
              </div>
            </PopoverContent>
          </Popover>
        )}
      </div>
    </div>
  </div>
  );
});
MessageBubble.displayName = 'MessageBubble';

/* ─── Wave Typing Indicator ─── */
const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="bg-muted/80 border border-border/30 px-5 py-3.5 rounded-2xl rounded-bl-md flex items-center gap-[3px]">
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className="w-[3px] rounded-full bg-primary/70"
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{
            duration: 0.9,
            repeat: Infinity,
            ease: 'easeInOut',
            delay: i * 0.12,
          }}
          style={{ height: 16, originY: '50%' }}
        />
      ))}
    </div>
  </div>
);

/* ─── Breathing Header Icon ─── */
const HeaderIcon = ({ isLoading }: { isLoading: boolean }) => (
  <motion.div
    className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center"
    animate={isLoading ? {
      scale: [1, 1.15, 1],
      boxShadow: [
        '0 0 0px hsl(var(--primary) / 0)',
        '0 0 18px hsl(var(--primary) / 0.35)',
        '0 0 0px hsl(var(--primary) / 0)',
      ],
    } : { scale: 1, boxShadow: '0 0 0px hsl(var(--primary) / 0)' }}
    transition={isLoading ? { duration: 2.2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
  >
    <Sparkles className="w-4 h-4 text-primary" />
  </motion.div>
);

/* ─── Conversation Sidebar ─── */
const ConversationSidebar = memo(({
  conversations, activeId, onSelect, onDelete, onNew, onClose,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
}) => (
  <motion.div
    initial={{ x: -300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
    className="absolute inset-y-0 left-0 w-72 z-50 bg-background border-r border-border/50 flex flex-col"
  >
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/50">
      <h3 className="text-sm font-semibold text-foreground">Conversations</h3>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onNew}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onClose}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
    <div className="flex-1 overflow-y-auto">
      {conversations.length === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-8 px-4">No conversations yet</p>
      )}
      {conversations.map(c => (
        <div
          key={c.id}
          className={cn(
            'flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20',
            activeId === c.id && 'bg-muted/60'
          )}
          onClick={() => { onSelect(c.id); onClose(); }}
        >
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{c.title}</p>
            <p className="text-[10px] text-muted-foreground">{formatConvoDate(c.updatedAt)}</p>
          </div>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="ml-2 p-1 rounded-md hover:bg-destructive/20 text-muted-foreground hover:text-destructive shrink-0"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
));
ConversationSidebar.displayName = 'ConversationSidebar';

/* ─── Main Chat ─── */
export function ConciergeChat({ isOpen, onClose }: ConciergeChatProps) {
  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, stopGeneration,
    createConversation, switchConversation, deleteConversation, clearHistory,
    activeCharacter, setActiveCharacter, egoLevel,
  } = useConciergeAI();
  const { navigate: appNavigate } = useAppNavigate();

  const isKyle = activeCharacter === 'kyle';
  const isBeauGosse = activeCharacter === 'beaugosse';
  const isDonAjKiin = activeCharacter === 'donajkiin';
  const isBotBetter = activeCharacter === 'botbetter';
  const isLunaShanti = activeCharacter === 'lunashanti';

  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);

  const CHARACTER_OPTIONS: { key: AiCharacter; label: string; subtitle: string; icon: typeof Sparkles; color: string; bgColor: string; glowColor: string; toast: string; meterLabel: string }[] = [
    { key: 'default', label: 'SwipesS AI', subtitle: 'Tulum Concierge', icon: Sparkles, color: 'text-primary', bgColor: 'bg-primary/20', glowColor: '', toast: 'Back to default concierge ✨', meterLabel: 'EGO' },
    { key: 'kyle', label: 'Kyle', subtitle: 'Boston Hustler 🔥', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/20', glowColor: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]', toast: 'Kyle activated. Bro... you know what I mean? 🔥', meterLabel: 'EGO' },
    { key: 'beaugosse', label: 'Beau Gosse', subtitle: 'El Guapo ✨', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20', glowColor: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]', toast: 'The Beau Gosse activated. Let\'s make this interesting... ✨', meterLabel: 'CHARM' },
    { key: 'donajkiin', label: 'Don Aj K\'iin', subtitle: 'Mayan Guardian 🌿', icon: Sun, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', glowColor: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]', toast: 'Don Aj K\'iin activated. Mmm... sit down, hermano... 🌿', meterLabel: 'WISDOM' },
    { key: 'botbetter', label: 'Bot Better', subtitle: 'Luxury Queen 👑', icon: Crown, color: 'text-pink-400', bgColor: 'bg-pink-500/20', glowColor: 'shadow-[0_0_12px_rgba(236,72,153,0.3)]', toast: 'The Bot Better activated. Mmm… let\'s upgrade this 😌👑', meterLabel: 'SASS' },
    { key: 'lunashanti', label: 'Luna Shanti', subtitle: 'Boho Guide 🌙', icon: Moon, color: 'text-violet-300', bgColor: 'bg-violet-500/20', glowColor: 'shadow-[0_0_12px_rgba(167,139,250,0.3)]', toast: 'Luna Shanti activated. Mmm… breathe… feel into it… ✨🌙', meterLabel: 'ZEN' },
  ];

  const currentChar = CHARACTER_OPTIONS.find(c => c.key === activeCharacter) || CHARACTER_OPTIONS[0];

  const selectCharacter = (key: AiCharacter) => {
    setActiveCharacter(key);
    const char = CHARACTER_OPTIONS.find(c => c.key === key)!;
    toast(char.toast);
    setCharacterPanelOpen(false);
  };

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // ── Voice-to-text (Web Speech API) ─────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [autoSend, setAutoSend] = useState(() => {
    try { return localStorage.getItem('concierge-auto-send') === 'true'; } catch { return false; }
  });
  const recognitionRef = useRef<any>(null);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const toggleAutoSend = useCallback(() => {
    setAutoSend(prev => {
      const next = !prev;
      try { localStorage.setItem('concierge-auto-send', String(next)); } catch {}
      return next;
    });
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      // Signal that user intentionally stopped so onend doesn't restart
      (recognitionRef.current as any)._userStop?.();
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    let finalTranscript = '';
    // Track whether the user intentionally stopped
    let userStopped = false;

    recognition.onresult = (event: any) => {
      let interim = '';
      finalTranscript = '';
      for (let i = 0; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }
      setInput(finalTranscript + interim);
    };

    recognition.onend = () => {
      // If the user didn't manually stop, restart to keep listening
      if (!userStopped && recognitionRef.current) {
        try {
          recognition.start();
          return;
        } catch {
          // Failed to restart, fall through to cleanup
        }
      }
      setIsListening(false);
      recognitionRef.current = null;
      if (autoSend && finalTranscript.trim()) {
        setTimeout(() => {
          sendMessage(finalTranscript.trim());
          setInput('');
        }, 100);
      }
    };

    recognition.onerror = (e: any) => {
      // 'no-speech' is normal — just let onend restart
      if (e.error === 'no-speech') return;
      userStopped = true;
      setIsListening(false);
      recognitionRef.current = null;
    };

    // Expose a way to flag user-stop from stopListening
    (recognition as any)._userStop = () => { userStopped = true; };

    recognitionRef.current = recognition;
    recognition.start();
    setIsListening(true);
  }, [speechSupported, autoSend, sendMessage]);

  const toggleListening = useCallback(() => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  }, [isListening, stopListening, startListening]);

  // Auto-scroll to bottom on new messages, loading state, opening chat, or switching conversation
  const scrollToBottom = useCallback(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  useEffect(() => {
    // Use requestAnimationFrame to ensure DOM has updated before scrolling
    requestAnimationFrame(scrollToBottom);
  }, [messages, isLoading, scrollToBottom]);

  useEffect(() => {
    if (isOpen) {
      // Delay scroll when opening to let animation complete and DOM render
      const t1 = setTimeout(scrollToBottom, 100);
      const t2 = setTimeout(scrollToBottom, 350);
      const t3 = setTimeout(() => inputRef.current?.focus(), 300);
      return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
    }
  }, [isOpen, scrollToBottom]);

  // Also scroll when switching conversations
  useEffect(() => {
    if (activeConversationId) {
      requestAnimationFrame(scrollToBottom);
      const t = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(t);
    }
  }, [activeConversationId, scrollToBottom]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleCopy = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success('Copied to clipboard');
  };

  const handleTranslate = (language: string) => {
    sendMessage(`Translate your last response to ${language}`);
  };

  const handleNavigate = useCallback((path: string) => {
    onClose();
    // Small delay to let chat close animation start
    setTimeout(() => appNavigate(path), 150);
  }, [appNavigate, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ type: 'spring', damping: 28, stiffness: 350 }}
          className="fixed inset-0 z-[10000] flex flex-col bg-background"
        >
          {/* Sidebar backdrop */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-40 bg-black/30"
                onClick={() => setSidebarOpen(false)}
              />
            )}
          </AnimatePresence>

          {/* Sidebar */}
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
          <div className="border-b border-border/50 bg-background/95 backdrop-blur-xl relative z-10">
            <div className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-3">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setSidebarOpen(!sidebarOpen)}>
                  <Menu className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className={cn(
                    "w-8 h-8 rounded-full transition-all",
                    currentChar.bgColor, currentChar.glowColor
                  )}
                  onClick={() => setCharacterPanelOpen(!characterPanelOpen)}
                  title="Choose character"
                >
                  <currentChar.icon className={cn("w-4 h-4", currentChar.color)} />
                </Button>
                <HeaderIcon isLoading={isLoading} />
                <div>
                  {activeCharacter !== 'default' ? (
                    <p className={cn("text-sm font-bold", currentChar.color)}>{currentChar.label}</p>
                  ) : (
                    <SwipessLogo size="xs" variant="gradient" />
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {isLoading ? 'Thinking…' : currentChar.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => { createConversation(); }}>
                  <Plus className="w-4 h-4 text-muted-foreground" />
                </Button>
                {conversations.length > 0 && (
                  <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground hover:text-destructive" onClick={clearHistory}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full text-muted-foreground" onClick={onClose}>
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>

            {/* Character Selector Panel */}
            <AnimatePresence>
              {characterPanelOpen && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-3 pb-3 overflow-hidden"
                >
                  <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
                    {CHARACTER_OPTIONS.map(char => (
                      <button
                        key={char.key}
                        onClick={() => selectCharacter(char.key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-medium whitespace-nowrap transition-all shrink-0 border",
                          activeCharacter === char.key
                            ? cn(char.bgColor, char.color, "border-current/20", char.glowColor)
                            : "bg-muted/30 text-muted-foreground border-border/30 hover:bg-muted/60"
                        )}
                      >
                        <char.icon className="w-3.5 h-3.5" />
                        {char.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Level Meter */}
            <AnimatePresence>
              {activeCharacter !== 'default' && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {currentChar.meterLabel}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${egoLevel * 10}%`,
                          background: isBotBetter
                            ? (egoLevel <= 3 ? 'hsl(340, 70%, 55%)' : egoLevel <= 6 ? 'hsl(330, 80%, 60%)' : 'hsl(320, 85%, 65%)')
                            : isLunaShanti
                              ? (egoLevel <= 3 ? 'hsl(260, 60%, 60%)' : egoLevel <= 6 ? 'hsl(270, 65%, 55%)' : 'hsl(280, 70%, 65%)')
                              : isDonAjKiin
                                ? (egoLevel <= 3 ? 'hsl(180, 60%, 45%)' : egoLevel <= 6 ? 'hsl(155, 70%, 45%)' : 'hsl(45, 80%, 55%)')
                                : isBeauGosse
                                  ? (egoLevel <= 3 ? 'hsl(210, 80%, 60%)' : egoLevel <= 6 ? 'hsl(270, 70%, 60%)' : 'hsl(330, 70%, 60%)')
                                  : (egoLevel <= 3 ? 'hsl(210, 80%, 60%)' : egoLevel <= 6 ? 'hsl(30, 90%, 55%)' : 'hsl(0, 80%, 55%)'),
                          boxShadow: egoLevel > 6
                            ? `0 0 8px ${isBotBetter ? 'hsla(320, 85%, 65%, 0.5)' : isLunaShanti ? 'hsla(280, 70%, 65%, 0.5)' : isDonAjKiin ? 'hsla(45, 80%, 55%, 0.5)' : isBeauGosse ? 'hsla(330, 70%, 60%, 0.5)' : 'hsla(0, 80%, 55%, 0.5)'}`
                            : egoLevel > 3
                              ? `0 0 6px ${isBotBetter ? 'hsla(330, 80%, 60%, 0.4)' : isLunaShanti ? 'hsla(270, 65%, 55%, 0.4)' : isDonAjKiin ? 'hsla(155, 70%, 45%, 0.4)' : isBeauGosse ? 'hsla(270, 70%, 60%, 0.4)' : 'hsla(30, 90%, 55%, 0.4)'}`
                              : 'none',
                        }}
                        animate={{ width: `${egoLevel * 10}%` }}
                        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                      />
                    </div>
                    <span className="text-[10px] text-muted-foreground font-mono w-4 text-right">{egoLevel}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to SwipesS AI</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Ask me about properties in Tulum, best beaches, cenotes, local tips, cost of living, or anything about your search.
                </p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {[
                    'Best zones to live in Tulum?',
                    'Average rent in Aldea Zama?',
                    'Top cenotes & beaches nearby',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-2 text-xs rounded-xl bg-muted/60 text-foreground border border-border/40 hover:bg-muted transition-colors"
                    >
                      {suggestion}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map(msg => (
              <MessageBubble
                key={msg.id}
                message={msg}
                isUser={msg.role === 'user'}
                onCopy={() => handleCopy(msg.content)}
                onResend={msg.role === 'user' ? () => resendMessage(msg.id) : undefined}
                onTranslate={msg.role === 'assistant' ? handleTranslate : undefined}
                onNavigate={msg.role === 'assistant' ? handleNavigate : undefined}
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
            {/* Auto-send toggle */}
            {speechSupported && (
              <div className="flex items-center gap-2 mb-2">
                <button
                  onClick={toggleAutoSend}
                  className={cn(
                    "flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-medium transition-all",
                    autoSend
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/40 text-muted-foreground border border-border/30"
                  )}
                >
                  <Zap className="w-3 h-3" />
                  Auto-send {autoSend ? 'ON' : 'OFF'}
                </button>
              </div>
            )}
            <div className="flex items-end gap-2">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask SwipesS AI..."
                rows={1}
                className="flex-1 resize-none bg-muted/50 border border-border/40 rounded-xl px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
                style={{ minHeight: '40px' }}
              />
              {/* Mic button */}
              {speechSupported && (
                <Button
                  onClick={toggleListening}
                  size="icon"
                  variant="outline"
                  className={cn(
                    "w-10 h-10 rounded-xl shrink-0 transition-all",
                    isListening && "bg-red-500/20 border-red-500/50 text-red-400 animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.4)]"
                  )}
                >
                  {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                </Button>
              )}
              {isLoading ? (
                <Button onClick={stopGeneration} size="icon" variant="outline" className="w-10 h-10 rounded-xl shrink-0">
                  <Square className="w-4 h-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  size="icon"
                  className="w-10 h-10 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-40"
                >
                  <Send className="w-4 h-4" />
                </Button>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
