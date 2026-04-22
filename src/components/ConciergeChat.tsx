import { useState, useCallback, useRef, useEffect, useMemo, memo, SVGProps } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, MicOff, Square, Sparkles, Plus, 
  Trash2, Menu, Check, Zap, Flame, Sun, Crown, Moon, 
  ChevronRight, ChevronLeft, ChevronUp, ChevronDown, Copy, Globe, Languages, CornerDownRight, Search, Timer, Clock, 
  ArrowRight, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useConciergeAI, ChatMessage, Conversation, AiCharacter } from '@/hooks/useConciergeAI';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uiSounds } from '@/utils/uiSounds';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useTheme } from '@/hooks/useTheme';
import { SwipessLogo } from '@/components/SwipessLogo';
import { toast } from 'sonner';

// Character avatar images
import avatarDefault from '@/assets/avatars/avatar-default.png';
import avatarKyle from '@/assets/avatars/avatar-kyle.png';
import avatarBeauGosse from '@/assets/avatars/avatar-beaugosse.png';
import avatarDonAjKiin from '@/assets/avatars/avatar-donajkiin.png';
import avatarBotBetter from '@/assets/avatars/avatar-botbetter.png';
import avatarLunaShanti from '@/assets/avatars/avatar-lunashanti.png';
import avatarEzriyah from '@/assets/avatars/avatar-ezriyah.png';

const CHARACTER_AVATARS: Record<string, string> = {
  default: avatarDefault,
  kyle: avatarKyle,
  beaugosse: avatarBeauGosse,
  donajkiin: avatarDonAjKiin,
  botbetter: avatarBotBetter,
  lunashanti: avatarLunaShanti,
  ezriyah: avatarEzriyah,
};

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
  '/client/filters': 'Open Filters',
  '/radio': 'Open Radio',
  '/client/profile': 'My Profile',
  '/client/settings': 'Settings',
  '/subscription/packages': 'View Packages',
  '/client/liked': 'Liked Properties',
  '/owner/listings': 'My Listings',
  '/legal': 'Legal Section',
  '/events': 'Browse Events',
};

function parseNavActions(content: string): { cleanContent: string; navPaths: string[] } {
  const navPaths: string[] = [];
  const cleanContent = content.replace(NAV_PATTERN, (_, path) => {
    navPaths.push(path);
    return '';
  }).replace(/\n{3,}/g, '\n\n').trim();
  return { cleanContent, navPaths };
}

/* ─── Privacy Portal ─── */
const ConciergePrivacyPortal = memo(({ onAccept }: { onAccept: () => void }) => (
  <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full">
    <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 relative shadow-[0_0_40px_rgba(168,85,247,0.3)]">
      <Sparkles className="w-10 h-10 text-primary animate-pulse" />
    </div>
    <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">
      Swipess AI Protocol
    </h2>
    <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
      Swipess AI is a highly-trained, secure concierge built purely to enhance your experience. Your data is strictly protected under our high standards and will never be used maliciously or sold to third parties. We are here to help you seamlessly.
    </p>
    
    <div className="p-4 rounded-xl border mb-4 text-[10px] leading-tight text-center bg-muted border-border text-muted-foreground">
      <p className="font-bold uppercase tracking-widest mb-1 text-[11px] text-foreground">AI Disclaimer</p>
      Swipess AI provides automated recommendations for informational purposes only. It is not a substitute for professional real estate, legal, or financial advice. Accuracy is not guaranteed.
    </div>

    <div className="w-full space-y-3 mt-6">
      <Button 
        onClick={onAccept}
        className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
      >
        Initialize AI & Accept
      </Button>
    </div>
  </div>
));
ConciergePrivacyPortal.displayName = 'ConciergePrivacyPortal';

/* ─── Message Bubble ─── */
const MessageBubble = memo(({ message, onCopy, onResend, onDelete, onTranslate, onNavigate, isUser }: {
  message: ChatMessage;
  onCopy: () => void;
  onResend?: () => void;
  onDelete?: () => void;
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
            ? 'bg-primary text-primary-foreground rounded-br-md ml-auto shadow-md'
            : 'bg-muted/80 text-foreground rounded-bl-md border border-border/30 mr-auto'
        )}>
          {isUser ? (
            <span className="whitespace-pre-wrap">{message.content}</span>
          ) : (
            <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
              <ReactMarkdown>{cleanContent}</ReactMarkdown>
            </div>
          )}
        </div>

        {!isUser && message.provider && (
          <div className="text-[10px] mt-0.5 text-muted-foreground/40 flex items-center gap-1">
            <Zap className="w-2.5 h-2.5" />
            <span>Powered by {message.provider === 'minimax' ? 'MiniMax' : message.provider === 'gemini' ? 'Gemini' : message.provider}</span>
          </div>
        )}

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

        <div className={cn(
          'mt-1 flex items-center gap-0 transition-opacity',
          'opacity-60 hover:opacity-100',
          isUser ? 'justify-end' : 'justify-start'
        )}>
          <button onClick={onCopy} className="flex items-center justify-center rounded-md p-[3px] text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground" aria-label="Copy">
            <Copy className="h-2.5 w-2.5" />
          </button>
          {onDelete && (
            <button onClick={onDelete} className="flex items-center justify-center rounded-md p-[3px] text-muted-foreground/60 transition-colors hover:bg-muted hover:text-destructive" aria-label="Delete">
              <Trash2 className="h-2.5 w-2.5" />
            </button>
          )}
          {isUser && onResend && (
            <button onClick={onResend} className="flex items-center justify-center rounded-md p-[3px] text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground" aria-label="Resend">
              <RefreshCw className="h-2.5 w-2.5" />
            </button>
          )}
          {!isUser && onTranslate && (
            <Popover>
              <PopoverTrigger asChild>
                <button className="flex items-center justify-center rounded-md p-[3px] text-muted-foreground/60 hover:bg-muted hover:text-muted-foreground" aria-label="Translate">
                  <Globe className="h-2.5 w-2.5" />
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

/* ─── Typing Indicator ─── */
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

/* ─── Circular Arc Energy Gauge ─── */
const ArcGauge = memo(({ level, color, isLoading, icon: Icon }: {
  level: number; color: string; isLoading: boolean;
  icon: React.ElementType;
}) => {
  const size = 42;
  const stroke = 3;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(1, level / 10));
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="absolute inset-0 -rotate-90">
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="hsl(var(--muted) / 0.3)" strokeWidth={stroke} />
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{ filter: level > 6 ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        />
      </svg>
      <motion.div
        className="absolute inset-0 flex items-center justify-center"
        animate={isLoading ? {
          scale: [1, 1.12, 1],
        } : { scale: 1 }}
        transition={isLoading ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <Icon className="w-4.5 h-4.5" style={{ color }} />
      </motion.div>
    </div>
  );
});
ArcGauge.displayName = 'ArcGauge';

/* ─── Simple Header Icon (default character, no gauge) ─── */
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
    className="absolute inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl transition-all bg-background border-r border-border"
  >
    <div className="flex items-center justify-between px-5 py-4 border-b border-border">
      <h3 className="text-[11px] font-black uppercase tracking-widest text-foreground">archives</h3>
      <div className="flex items-center gap-1">
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onNew}>
          <Plus className="w-4 h-4" />
        </Button>
        <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={onClose}>
          <ChevronLeft className="w-4 h-4" />
        </Button>
      </div>
    </div>
    
    <div className="flex-1 overflow-y-auto nexus-scroll">
      {conversations.length === 0 && (
        <p className="text-xs text-muted-foreground text-center mt-8 px-4">No conversations yet</p>
      )}
      {conversations.map(c => (
        <div
          key={c.id}
          className={cn(
            'flex items-center justify-between px-4 py-3.5 cursor-pointer hover:bg-muted/50 transition-colors border-b border-border/20 group relative',
            activeId === c.id && 'bg-primary/10 border-primary/30'
          )}
          onClick={() => { onSelect(c.id); onClose(); }}
        >
          <div className="min-w-0 flex-1">
            <p className={cn("text-xs font-bold truncate w-full text-left", activeId === c.id ? "text-primary" : "opacity-60")}>
              {c.title || 'New inquiry'}
            </p>
            <p className="text-[10px] opacity-30 mt-1">{formatConvoDate(c.updatedAt)}</p>
          </div>
          <button
            onClick={(e) => { 
              e.stopPropagation(); 
              if (window.confirm('Delete this conversation? All messages will be lost.')) {
                onDelete(c.id); 
              }
            }}
            className="ml-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
            title="Delete conversation"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
));
ConversationSidebar.displayName = 'ConversationSidebar';

/* ─── Main Chat Component ─── */
export function ConciergeChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    return localStorage.getItem('swipess_ai_privacy') === 'true';
  });

  const acceptPrivacy = useCallback(() => {
    localStorage.setItem('swipess_ai_privacy', 'true');
    setHasAcceptedPrivacy(true);
    triggerHaptic('success');
  }, []);

  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, deleteMessage, stopGeneration,
    createConversation, switchConversation, deleteConversation, clearHistory,
    activeCharacter, setActiveCharacter, egoLevel,
  } = useConciergeAI();
  const { navigate: appNavigate } = useAppNavigate();
  const { theme } = useTheme();

  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [showAmbientLayer, setShowAmbientLayer] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const CHARACTER_OPTIONS: { key: AiCharacter; label: string; subtitle: string; icon: typeof Sparkles; color: string; bgColor: string; glowColor: string; toast: string; meterLabel: string }[] = [
    { key: 'default', label: 'Swipess AI', subtitle: 'Tulum Concierge', icon: Sparkles, color: 'text-primary', bgColor: 'bg-primary/20', glowColor: '', toast: 'Back to default concierge', meterLabel: 'EGO' },
    { key: 'kyle', label: 'Kyle', subtitle: 'Boston Hustler', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/20', glowColor: 'shadow-[0_0_12px_rgba(251,146,60,0.3)]', toast: 'Kyle activated. Bro... you know what I mean?', meterLabel: 'EGO' },
    { key: 'beaugosse', label: 'Beau Gosse', subtitle: 'El Guapo', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20', glowColor: 'shadow-[0_0_12px_rgba(168,85,247,0.3)]', toast: 'The Beau Gosse activated. Let\'s make this interesting...', meterLabel: 'CHARM' },
    { key: 'donajkiin', label: 'Don Aj K\'iin', subtitle: 'Mayan Guardian', icon: Sun, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20', glowColor: 'shadow-[0_0_12px_rgba(52,211,153,0.3)]', toast: 'Don Aj K\'iin activated. Mmm... sit down, hermano...', meterLabel: 'WISDOM' },
    { key: 'botbetter', label: 'Bot Better', subtitle: 'Luxury Queen', icon: Crown, color: 'text-pink-400', bgColor: 'bg-pink-500/20', glowColor: 'shadow-[0_0_12px_rgba(236,72,153,0.3)]', toast: 'The Bot Better activated. Mmm… let\'s upgrade this', meterLabel: 'SASS' },
    { key: 'lunashanti', label: 'Luna Shanti', subtitle: 'Boho Guide', icon: Moon, color: 'text-violet-300', bgColor: 'bg-violet-500/20', glowColor: 'shadow-[0_0_12px_rgba(167,139,250,0.3)]', toast: 'Luna Shanti activated. Mmm… breathe… feel into it…', meterLabel: 'ZEN' },
    { key: 'ezriyah', label: 'Ezriyah Suave', subtitle: 'Manbodiment Coach', icon: Sun, color: 'text-teal-400', bgColor: 'bg-teal-500/20', glowColor: 'shadow-[0_0_12px_rgba(45,212,191,0.3)]', toast: 'Ezriyah activated. Brother… let\'s integrate.', meterLabel: 'FLOW' },
  ];

  const currentChar = CHARACTER_OPTIONS.find(c => c.key === activeCharacter) || CHARACTER_OPTIONS[0];

  const arcColor = useMemo(() => {
    if (activeCharacter === 'default') return 'hsl(var(--primary))';
    const colorMap: Record<string, string> = {
      kyle: 'hsl(25, 95%, 60%)',
      beaugosse: 'hsl(270, 70%, 60%)',
      donajkiin: 'hsl(155, 70%, 50%)',
      botbetter: 'hsl(330, 80%, 60%)',
      lunashanti: 'hsl(270, 60%, 65%)',
      ezriyah: 'hsl(170, 70%, 50%)',
    };
    return colorMap[activeCharacter] || 'hsl(var(--primary))';
  }, [activeCharacter]);

  const selectCharacter = (key: AiCharacter) => {
    setActiveCharacter(key);
    const char = CHARACTER_OPTIONS.find(c => c.key === key)!;
    toast(char.toast);
    setCharacterPanelOpen(false);
  };

  // ── Voice-to-text (Web Speech API) ─────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const { volume: voiceVolume, pulse: voicePulse } = useAudioVisualizer(isListening);
  const [autoSend, setAutoSend] = useState(() => {
    try { return localStorage.getItem('concierge-auto-send') === 'true'; } catch { return false; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const [ignitionFlash, setIgnitionFlash] = useState(false);
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const silenceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ignitionTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const autoSendRef = useRef(autoSend);
  const countdownTranscriptRef = useRef<string>('');
  const originalInputRef = useRef('');
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const mediaRecorderSupported = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof (window as any).MediaRecorder !== 'undefined';
  const micSupported = speechSupported || mediaRecorderSupported;

  const voiceTranscribe = useVoiceTranscribe();
  const usingFallbackRef = useRef(false);

  const COUNTDOWN_SECONDS = 2;
  const SILENCE_DELAY_MS = 1200;
  const isCountingDownRef = useRef(false);

  useEffect(() => {
    autoSendRef.current = autoSend;
  }, [autoSend]);

  const clearCountdown = useCallback(() => {
    if (countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }
    if (ignitionTimeoutRef.current) {
      clearTimeout(ignitionTimeoutRef.current);
      ignitionTimeoutRef.current = null;
    }
    isCountingDownRef.current = false;
    setCountdown(null);
    setIgnitionFlash(false);
  }, []);

  const fireIgnitionAndSend = useCallback(() => {
    if (!autoSendRef.current) {
      clearCountdown();
      return;
    }

    isCountingDownRef.current = false;
    const textToSend = countdownTranscriptRef.current.trim();
    setIgnitionFlash(true);
    ignitionTimeoutRef.current = setTimeout(() => {
      setIgnitionFlash(false);
      ignitionTimeoutRef.current = null;
      if (autoSendRef.current && textToSend) {
        sendMessage(textToSend);
        setInput('');
      }
      setIsListening(false);
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
        recognitionRef.current = null;
      }
    }, 600);
  }, [clearCountdown, sendMessage]);

  const startCountdown = useCallback(() => {
    isCountingDownRef.current = true;
    setCountdown(COUNTDOWN_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev === null || prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          fireIgnitionAndSend();
          return null;
        }
        return prev - 1;
      });
    }, 1000);
  }, [fireIgnitionAndSend]);

  const toggleAutoSend = useCallback(() => {
    setAutoSend(prev => {
      const next = !prev;
      autoSendRef.current = next;
      try { localStorage.setItem('concierge-auto-send', String(next)); } catch {}
      if (!next) {
        clearCountdown();
      }
      return next;
    });
  }, [clearCountdown]);

  const stopListening = useCallback(() => {
    clearCountdown();
    if (usingFallbackRef.current) {
      usingFallbackRef.current = false;
      uiSounds.playMicOff();
      setIsListening(false);
      voiceTranscribe.stop().then((text) => {
        if (text) {
          const combined = [originalInputRef.current.trim(), text].filter(Boolean).join(' ');
          setInput(combined);
          if (autoSendRef.current) {
            sendMessage(combined);
            setInput('');
          }
        }
      });
      return;
    }

    if (recognitionRef.current) {
      (recognitionRef.current as any)._userStop?.();
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    uiSounds.playMicOff();
    setIsListening(false);
  }, [clearCountdown, voiceTranscribe, sendMessage]);

  const startFallbackListening = useCallback(async () => {
    clearCountdown();
    originalInputRef.current = input;
    const ok = await voiceTranscribe.start();
    if (!ok) {
      toast.error('Microphone access blocked', {
        description: 'Please allow microphone access in your browser settings to talk to Swipess AI.',
      });
      return;
    }
    usingFallbackRef.current = true;
    triggerHaptic('medium');
    uiSounds.playMicOn();
    setIsListening(true);
  }, [clearCountdown, input, voiceTranscribe]);

  const startListening = useCallback(() => {
    if (!speechSupported) {
      startFallbackListening();
      return;
    }
    clearCountdown();
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = typeof window !== 'undefined' ? (navigator.language || 'en-US') : 'en-US';

    let finalTranscript = '';
    let hasInterrupted = false;

    recognition.onstart = () => {
      setIsListening(true);
      originalInputRef.current = input;
      triggerHaptic('medium');
      uiSounds.playMicOn();
    };

    recognition.onresult = (event: any) => {
      voicePulse(0.7);

      if (isLoading && !hasInterrupted) {
        stopGeneration();
        hasInterrupted = true;
      }

      if (isCountingDownRef.current) {
        clearCountdown();
      }

      if (silenceTimerRef.current) {
        clearTimeout(silenceTimerRef.current);
        silenceTimerRef.current = null;
      }

      let interim = '';
      let newFinalChunk = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          newFinalChunk += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      finalTranscript += newFinalChunk;

      const sanitizedFinal = finalTranscript.trim();
      const sanitizedInterim = interim.trim();
      
      const combined = [originalInputRef.current.trim(), sanitizedFinal, sanitizedInterim].filter(Boolean).join(' ');
      setInput(combined);
      countdownTranscriptRef.current = [originalInputRef.current.trim(), sanitizedFinal].filter(Boolean).join(' ');

      if (autoSendRef.current && sanitizedFinal && !sanitizedInterim) {
        silenceTimerRef.current = setTimeout(() => {
          startCountdown();
        }, SILENCE_DELAY_MS);
      }
    };

    recognition.onerror = () => {
      stopListening();
    };

    recognition.onend = () => {
      if (isListening && !isCountingDownRef.current) {
        try { recognition.start(); } catch {}
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, startFallbackListening, clearCountdown, input, voicePulse, isLoading, stopGeneration, stopListening, startCountdown]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    triggerHaptic('medium');
    uiSounds.playMessageSent();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
    triggerHaptic('light');
  };

  const handleNavigate = (path: string) => {
    appNavigate(path);
    onClose();
    triggerHaptic('medium');
  };

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!isOpen) return null;

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 md:p-4 lg:p-8">
      <motion.div 
        initial={{ opacity: 0 }} 
        animate={{ opacity: 1 }} 
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      />
      
      <motion.div
        layoutId="concierge-chat-panel"
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className={cn(
          "relative w-full h-full md:max-w-2xl md:h-[85vh] md:rounded-[3rem] shadow-2xl flex flex-col overflow-hidden transition-colors duration-500",
          theme === 'dark' ? "bg-background border-white/5" : "bg-white border-black/5"
        )}
      >
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

        <header className="px-5 py-4 border-b border-border flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
              className="p-2 hover:bg-muted/50 rounded-xl transition-colors"
            >
              <Menu className="w-5 h-5 text-muted-foreground" />
            </button>
            <div className="flex items-center gap-2">
              <SwipessLogo className="w-6 h-6" />
              <div>
                <h2 className="text-sm font-black uppercase tracking-widest text-foreground leading-none">Concierge</h2>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Interface Online</span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Popover open={characterPanelOpen} onOpenChange={setCharacterPanelOpen}>
              <PopoverTrigger asChild>
                <button className="flex items-center gap-3 px-3 py-1.5 rounded-full hover:bg-muted/50 transition-all border border-transparent hover:border-border">
                  <div className="text-right hidden sm:block">
                    <p className="text-[10px] font-black uppercase tracking-widest leading-none text-foreground">{currentChar.label}</p>
                    <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter mt-0.5">{currentChar.subtitle}</p>
                  </div>
                  <div className="relative">
                    {activeCharacter === 'default' ? (
                      <HeaderIcon isLoading={isLoading} />
                    ) : (
                      <ArcGauge 
                        level={egoLevel} 
                        color={arcColor} 
                        isLoading={isLoading} 
                        icon={currentChar.icon} 
                      />
                    )}
                    <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-background rounded-full flex items-center justify-center border border-border">
                      <ChevronDown className="w-2 h-2" />
                    </div>
                  </div>
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-64 p-2 rounded-[2rem] shadow-2xl border-border" align="end">
                <div className="p-3 border-b border-border/50 mb-2">
                  <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">Select Archetype</h3>
                </div>
                <div className="grid gap-1">
                  {CHARACTER_OPTIONS.map(char => (
                    <button
                      key={char.key}
                      onClick={() => selectCharacter(char.key)}
                      className={cn(
                        "flex items-center gap-3 p-2.5 rounded-2xl transition-all",
                        activeCharacter === char.key ? "bg-primary/10" : "hover:bg-muted/50"
                      )}
                    >
                      <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", char.bgColor)}>
                        <char.icon className={cn("w-5 h-5", char.color)} />
                      </div>
                      <div className="text-left">
                        <p className="text-xs font-black uppercase tracking-wider text-foreground">{char.label}</p>
                        <p className="text-[10px] opacity-40 uppercase font-bold">{char.subtitle}</p>
                      </div>
                      {activeCharacter === char.key && <Check className="ml-auto w-4 h-4 text-primary" />}
                    </button>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            <button onClick={onClose} className="p-2 hover:bg-muted/50 rounded-xl transition-colors">
              <X className="w-5 h-5 text-muted-foreground" />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-hidden relative flex flex-col">
          {!hasAcceptedPrivacy ? (
            <ConciergePrivacyPortal onAccept={acceptPrivacy} />
          ) : (
            <>
              <div 
                ref={scrollRef}
                className="flex-1 overflow-y-auto nexus-scroll p-5 space-y-2"
              >
                {messages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center px-8 space-y-6">
                    <div className="w-16 h-16 rounded-[2rem] bg-primary/10 flex items-center justify-center border border-primary/20 shadow-lg">
                      <Sparkles className="w-8 h-8 text-primary animate-pulse" />
                    </div>
                    <div>
                      <h3 className="text-lg font-black uppercase tracking-widest text-foreground">Awaiting Intel</h3>
                      <p className="text-xs text-muted-foreground mt-2 leading-relaxed">
                        How can I assist your lifestyle objectives today?
                      </p>
                    </div>
                    <div className="grid grid-cols-1 gap-2 w-full max-w-xs">
                      {[
                        "Find luxury villas in Tulum",
                        "Recommended beach clubs",
                        "Best coworking spaces",
                        "Private yacht rentals"
                      ].map(suggestion => (
                        <button
                          key={suggestion}
                          onClick={() => setInput(suggestion)}
                          className="px-4 py-3 rounded-xl border border-border bg-muted/30 text-xs font-medium hover:bg-muted transition-colors text-left flex items-center justify-between group"
                        >
                          {suggestion}
                          <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-40 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}
                
                {messages.map((m, idx) => (
                  <MessageBubble 
                    key={idx} 
                    message={m} 
                    isUser={m.role === 'user'} 
                    onCopy={() => handleCopy(m.content)}
                    onDelete={() => deleteMessage(idx)}
                    onResend={m.role === 'user' ? () => resendMessage(idx) : undefined}
                    onNavigate={m.role === 'assistant' ? handleNavigate : undefined}
                    onTranslate={m.role === 'assistant' ? (lang) => sendMessage(`Translate your last message to ${lang}`) : undefined}
                  />
                ))}
                {isLoading && <TypingIndicator />}
              </div>

              <div className="p-5 border-t border-border bg-background/80 backdrop-blur-xl relative">
                <AnimatePresence>
                  {isListening && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute inset-x-5 -top-24 p-4 rounded-3xl bg-indigo-500/10 border border-indigo-500/20 backdrop-blur-2xl flex flex-col gap-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex gap-[2px]">
                            {[0, 1, 2, 3].map(i => (
                              <motion.div
                                key={i}
                                className="w-[3px] bg-indigo-500"
                                animate={{ height: [4, 16 * voicePulse(0.5) || 4, 4] }}
                                transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.1 }}
                              />
                            ))}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-indigo-500">Listening...</span>
                        </div>
                        <div className="flex items-center gap-3">
                           {countdown !== null && (
                             <div className="flex items-center gap-2 px-2 py-1 rounded-lg bg-indigo-500 text-white text-[10px] font-black">
                                <Timer className="w-3 h-3" />
                                <span>SENDING IN {countdown}s</span>
                             </div>
                           )}
                           <button 
                             onClick={toggleAutoSend}
                             className={cn("flex items-center gap-1.5 px-2 py-1 rounded-lg text-[9px] font-black border transition-all", autoSend ? "bg-indigo-500 border-indigo-500 text-white" : "border-indigo-500/30 text-indigo-500")}
                           >
                             AUTO-SEND {autoSend ? 'ON' : 'OFF'}
                           </button>
                        </div>
                      </div>
                      <p className="text-xs italic opacity-60 line-clamp-2">{input || 'Awaiting voice input...'}</p>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="relative flex items-end gap-3">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    placeholder={isListening ? "Listening..." : "Message Swipess AI..."}
                    className="w-full min-h-[56px] max-h-32 p-4 pr-14 rounded-2xl bg-muted/50 border border-border resize-none text-sm focus:ring-2 focus:ring-primary/20 outline-none transition-all scrollbar-hide"
                  />
                  
                  <div className="absolute right-2 bottom-2 flex items-center gap-1">
                    <button
                      onClick={isListening ? stopListening : startListening}
                      className={cn(
                        "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                        isListening ? "bg-red-500 text-white animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                    </button>
                    <button
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-30 transition-all hover:scale-105 active:scale-95"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>,
    document.body
  );
}
