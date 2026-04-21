import { useState, useRef, useEffect, useCallback, memo, useMemo, SVGProps } from 'react';
import { createPortal } from 'react-dom';
import { triggerHaptic } from '@/utils/haptics';
import { X, Send, Trash2, Copy, Sparkles, RefreshCw, Plus, Menu, ChevronLeft, Square, Globe, Flame, Sun, Crown, Moon, ChevronDown, Mic, MicOff, Zap, ArrowRight, Check, ChevronUp } from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';
import { Button } from '@/components/ui/button';
import { useConciergeAI, ChatMessage, Conversation, AiCharacter } from '@/hooks/useConciergeAI';
import { useAudioVisualizer } from '@/hooks/useAudioVisualizer';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uiSounds } from '@/utils/uiSounds';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAppNavigate } from '@/hooks/useAppNavigate';

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

const ConciergePrivacyPortal = memo(({ onAccept }: { onAccept: () => void }) => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full">
      <div className="w-20 h-20 rounded-[2rem] bg-primary/10 flex items-center justify-center mb-4 border border-primary/20 relative shadow-[0_0_40px_rgba(168,85,247,0.3)]">
        <Sparkles className="w-10 h-10 text-primary animate-pulse" />
      </div>
      <h2 className="text-2xl font-black tracking-tight text-foreground uppercase">Swipess AI Protocol</h2>
      <p className="text-xs text-muted-foreground leading-relaxed max-w-[280px]">
        Swipess AI is a highly-trained, secure concierge built purely to enhance your experience. Your data is strictly protected under our high standards and will never be used maliciously or sold to third parties. We are here to help you seamlessly.
      </p>
      
      <div className="w-full space-y-3 mt-6">
        <Button 
          onClick={onAccept}
          className="w-full h-14 rounded-2xl bg-indigo-500 hover:bg-indigo-600 active:scale-95 transition-all text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_10px_30px_rgba(99,102,241,0.3)]"
        >
          Initialize AI & Accept
        </Button>
      </div>
    </div>
  );
});

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

      {/* Provider label below AI bubbles */}
      {!isUser && message.provider && (
        <div className="text-[10px] mt-0.5 text-muted-foreground/40 flex items-center gap-1">
          <Zap className="w-2.5 h-2.5" />
          <span>Powered by {message.provider === 'minimax' ? 'MiniMax' : message.provider === 'gemini' ? 'Gemini' : message.provider}</span>
        </div>
      )}

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
        {/* Track */}
        <circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke="hsl(var(--muted) / 0.3)" strokeWidth={stroke} />
        {/* Arc fill */}
        <motion.circle cx={size/2} cy={size/2} r={radius} fill="none"
          stroke={color} strokeWidth={stroke} strokeLinecap="round"
          strokeDasharray={circumference}
          animate={{ strokeDashoffset: dashOffset }}
          transition={{ type: 'spring', stiffness: 200, damping: 25 }}
          style={{ filter: level > 6 ? `drop-shadow(0 0 4px ${color})` : 'none' }}
        />
      </svg>
      {/* Center icon */}
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
    className="absolute inset-y-0 left-0 w-72 z-50 bg-[#0A1A2F] border-r border-white/10 flex flex-col"
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
            onClick={(e) => { 
              e.stopPropagation(); 
              if (window.confirm('Delete this conversation? All messages will be lost.')) {
                onDelete(c.id); 
              }
            }}
            className="ml-2 p-1.5 rounded-lg opacity-60 hover:opacity-100 hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all shrink-0"
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

/* ─── Main Chat ─── */
export function ConciergeChat({ isOpen, onClose }: ConciergeChatProps) {
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

  const isKyle = activeCharacter === 'kyle';
  const isBeauGosse = activeCharacter === 'beaugosse';
  const isDonAjKiin = activeCharacter === 'donajkiin';
  const isBotBetter = activeCharacter === 'botbetter';
  const isLunaShanti = activeCharacter === 'lunashanti';
  const isEzriyah = activeCharacter === 'ezriyah';

  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);

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

  // Derive the arc color from the current character
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

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAmbientLayer, setShowAmbientLayer] = useState(false);
  const originalInputRef = useRef(''); // To preserve text before mic starts

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
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  const mediaRecorderSupported = typeof window !== 'undefined'
    && typeof navigator !== 'undefined'
    && !!navigator.mediaDevices?.getUserMedia
    && typeof (window as any).MediaRecorder !== 'undefined';
  // Mic is available if EITHER browser STT or recording fallback works.
  const micSupported = speechSupported || mediaRecorderSupported;

  // 🎙️ Universal fallback: works on iOS Safari, in-app browsers, native shells.
  // Records via MediaRecorder and transcribes via the `voice-transcribe` edge function.
  const voiceTranscribe = useVoiceTranscribe();
  const usingFallbackRef = useRef(false);

  const COUNTDOWN_SECONDS = 2;
  const SILENCE_DELAY_MS = 1200;
  const isCountingDownRef = useRef(false);
  const lastFinalTranscriptRef = useRef('');

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
    // DO NOT stop recognition — keep listening so user can interrupt countdown
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
    // Fallback path (MediaRecorder + edge transcription)
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
      // No Web Speech API (iOS Safari, etc.) → use MediaRecorder fallback
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
    let userStopped = false;
    let hasInterrupted = false;

    recognition.onstart = () => {
      setIsListening(true);
      originalInputRef.current = input;
      triggerHaptic('medium');
      uiSounds.playMicOn();
    };

    recognition.onresult = (event: any) => {
      // Pulse the visualizer on voice activity (no second mic stream needed)
      voicePulse(0.7);

      // 🚀 INTERRUPTION: If AI is thinking/typing, stop it on the first word detected
      if (isLoading && !hasInterrupted) {
        stopGeneration();
        hasInterrupted = true;
      }

      // If countdown is active and new speech arrives, CANCEL countdown and reset silence timer
      if (isCountingDownRef.current) {
        clearCountdown();
      }

      // Clear the silence timer on any new speech
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
      
      const combined = [
        originalInputRef.current.trim(),
        sanitizedFinal,
        sanitizedInterim
      ].filter(Boolean).join(' ');

      if (combined) {
        setInput(combined);
        countdownTranscriptRef.current = combined;
      }

      if (autoSendRef.current && countdownTranscriptRef.current) {
        silenceTimerRef.current = setTimeout(() => {
          if (!userStopped && !isCountingDownRef.current && autoSendRef.current) {
            startCountdown();
          }
        }, SILENCE_DELAY_MS);
      }
    };

    recognition.onend = () => {
      // Always ensure we reset state if not restarting
      const shouldRestart = recognitionRef.current && !userStopped && !isCountingDownRef.current;
      
      if (!shouldRestart) {
        setIsListening(false);
        recognitionRef.current = null;
        return;
      }

      // Browser killed the session (timeout, etc.) — auto-restart with a small delay
      setTimeout(() => {
        if (recognitionRef.current && !userStopped && !isCountingDownRef.current) {
          try {
            recognitionRef.current.start();
            setIsListening(true);
          } catch (err) {
            console.error('[AI Speech] Restart failed:', err);
            setIsListening(false);
            recognitionRef.current = null;
          }
        } else {
          setIsListening(false);
        }
      }, 300);
    };

    recognition.onerror = (e: any) => {
      // no-speech is common on Android — don't kill the session, just let onend restart it
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      if (isCountingDownRef.current) return; 

      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') {
        // Web Speech denied → transparently switch to MediaRecorder fallback (works on iOS).
        userStopped = true;
        recognitionRef.current = null;
        setIsListening(false);
        clearCountdown();
        startFallbackListening();
        return;
      }

      if (e.error === 'network' || e.error === 'audio-capture') {
        // Web Speech network/audio failure → fall back to MediaRecorder
        userStopped = true;
        recognitionRef.current = null;
        setIsListening(false);
        clearCountdown();
        startFallbackListening();
        return;
      }
      
      userStopped = true;
      setIsListening(false);
      recognitionRef.current = null;
      clearCountdown();
    };

    (recognition as any)._userStop = () => { userStopped = true; };

    recognitionRef.current = recognition;
    lastFinalTranscriptRef.current = '';
    recognition.start();
    setIsListening(true);
  }, [speechSupported, autoSend, sendMessage, clearCountdown, startCountdown, voicePulse, startFallbackListening, isLoading, stopGeneration, input]);

  const toggleListening = useCallback(() => {
    if (isListening || countdown !== null) {
      clearCountdown();
      stopListening();
    } else {
      // If AI is talking, stop it immediately when you tap Mic
      if (isLoading) stopGeneration();
      startListening();
    }
  }, [isListening, countdown, isLoading, stopListening, startListening, clearCountdown, stopGeneration]);

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

  useEffect(() => {
    if (!isOpen) {
      setShowAmbientLayer(false);
      return;
    }

    const timer = window.setTimeout(() => setShowAmbientLayer(true), 120);
    return () => window.clearTimeout(timer);
  }, [isOpen]);

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

  const characterPanel = typeof document !== 'undefined' && characterPanelOpen
    ? createPortal(
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[10025] bg-background/40 backdrop-blur-sm"
            onClick={() => setCharacterPanelOpen(false)}
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 400 }}
            className="fixed inset-x-0 bottom-0 z-[10026] rounded-t-3xl border-t border-border/40 bg-background/95 backdrop-blur-xl shadow-2xl pb-[calc(env(safe-area-inset-bottom,0px)+16px)]"
          >
            <div className="flex justify-center pt-3 pb-2">
              <div className="h-1 w-10 rounded-full bg-muted-foreground/30" />
            </div>
            <p className="mb-3 text-center text-xs font-bold uppercase tracking-widest text-muted-foreground">Choose Your AI</p>
            <div className="flex gap-3 overflow-x-auto px-4 pb-4 scrollbar-hide snap-x snap-mandatory" style={{ WebkitOverflowScrolling: 'touch' }}>
              {CHARACTER_OPTIONS.map(char => {
                const isActive = activeCharacter === char.key;
                return (
                  <button
                    key={char.key}
                    onClick={() => selectCharacter(char.key)}
                    className={cn(
                      "flex min-w-[100px] shrink-0 snap-center flex-col items-center gap-2 rounded-2xl border p-4 transition-all",
                      isActive
                        ? cn("border-2", char.bgColor, char.glowColor)
                        : "border-border/30 bg-muted/20 hover:bg-muted/40"
                    )}
                  >
                    <div
                      className={cn(
                        "flex h-14 w-14 items-center justify-center rounded-full overflow-hidden border-2 transition-all",
                        isActive ? "border-primary shadow-lg" : "border-border/30"
                      )}
                    >
                      <img src={CHARACTER_AVATARS[char.key]} alt={char.label} className="h-full w-full object-cover" loading="lazy" />
                    </div>
                    <span className={cn(
                      "whitespace-nowrap text-xs font-bold",
                      isActive ? char.color : "text-foreground"
                    )}>{char.label}</span>
                    <span className="whitespace-nowrap text-[10px] text-muted-foreground">{char.subtitle}</span>
                    {isActive && (
                      <motion.div
                        layoutId="char-check"
                        className="flex h-5 w-5 items-center justify-center rounded-full bg-primary"
                      >
                        <Check className="h-3 w-3 text-primary-foreground" />
                      </motion.div>
                    )}
                  </button>
                );
              })}
            </div>
          </motion.div>
        </>,
        document.body
      )
    : null;

  const chatContent = (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="fixed inset-0 z-[10020] flex h-full w-full flex-col overflow-hidden bg-zinc-950 shadow-2xl"
          style={{ willChange: 'transform, opacity' }}
        >
          {showAmbientLayer && (
            <>
              <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
                <div className="absolute left-[10%] right-[18%] top-[-8%] h-40 rounded-full bg-primary/10 blur-3xl" />
                <div className="absolute left-[18%] right-[10%] bottom-[-12%] h-48 rounded-full bg-accent/10 blur-3xl" />
              </div>
              <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-60">
                <div
                  className={cn(
                    'absolute top-1/2 left-1/2 h-[180%] w-[180%] -translate-x-1/2 -translate-y-1/2 blur-[80px] transition-all duration-700 ease-out',
                    isLoading || isListening ? 'scale-110 opacity-70' : 'scale-100 opacity-35'
                  )}
                  style={{
                    background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.18) 0%, transparent 62%)',
                  }}
                />
              </div>
            </>
          )}

          {!hasAcceptedPrivacy ? (
             <ConciergePrivacyPortal onAccept={acceptPrivacy} />
          ) : (
            <>
          {/* Sidebar backdrop */}
          <AnimatePresence>
            {sidebarOpen && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="absolute inset-0 z-40 bg-black/60 backdrop-blur-sm"
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
          <div
            className="relative z-10 border-b border-white/10 bg-[#0A1A2F]"
            style={{ paddingTop: 'max(2px, env(safe-area-inset-top, 0px))' }}
          >
            <div className="flex items-center justify-between px-2.5 py-1">
              <div className="flex items-center gap-1.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90" 
                  onClick={() => setSidebarOpen(!sidebarOpen)}
                >
                  <Menu className="h-4 w-4" />
                </Button>
                {/* Character avatar image */}
                <button
                  onClick={() => setCharacterPanelOpen(!characterPanelOpen)}
                  className="relative focus:outline-none"
                  title="Choose character"
                >
                  <motion.div
                    className="h-8 w-8 rounded-full overflow-hidden border border-primary/50"
                    animate={isLoading ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                    transition={isLoading ? { duration: 1.8, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.2 }}
                  >
                    <img src={CHARACTER_AVATARS[activeCharacter]} alt={currentChar.label} className="w-full h-full object-cover" />
                  </motion.div>
                </button>
                <div>
                  <p className={cn("text-xs font-bold leading-none", activeCharacter !== 'default' ? currentChar.color : "text-foreground")}>
                    {activeCharacter !== 'default' ? currentChar.label : "Swipess AI"}
                  </p>
                  <p className="mt-0.5 text-[9px] leading-none text-muted-foreground">
                    {isLoading ? 'Thinking...' : currentChar.subtitle}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-0.5">
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all active:scale-90" 
                  onClick={() => { createConversation(); }}
                >
                  <Plus className="h-4 w-4 text-muted-foreground" />
                </Button>
                {activeConversationId && (
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className={cn(
                      "h-9 w-9 rounded-xl transition-all border border-white/10 active:scale-90",
                      isDeleting ? "bg-destructive text-destructive-foreground hover:bg-destructive/80 scale-105 shadow-lg border-transparent" : "bg-white/5 text-muted-foreground hover:text-destructive"
                    )} 
                    onClick={() => {
                      if (isDeleting) {
                        stopListening();
                        deleteConversation(activeConversationId);
                        setIsDeleting(false);
                        uiSounds.playPop();
                      } else {
                        setIsDeleting(true);
                        uiSounds.playPing(0.6);
                        setTimeout(() => setIsDeleting(false), 3000);
                      }
                    }}
                    title={isDeleting ? "Click again to confirm delete" : "Delete conversation"}
                  >
                    {isDeleting ? <Check className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                  </Button>
                )}
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="h-9 w-9 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-muted-foreground transition-all active:scale-90" 
                  onClick={onClose}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {characterPanel}
          </div>

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 scroll-smooth">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-8">
                <motion.div
                  animate={{ scale: [1, 1.04, 1], opacity: [0.7, 1, 0.7] }}
                  transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
                  className="mb-6"
                >
                  <div className="w-16 h-16 rounded-2xl bg-primary/8 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-primary/60" />
                  </div>
                </motion.div>
                <p className="text-base font-medium text-foreground/80 mb-1">
                  Ask me anything
                </p>
                <p className="text-xs text-muted-foreground/60 max-w-[220px] leading-relaxed">
                  Properties, beaches, cenotes, local tips, cost of living…
                </p>
                <div className="flex flex-wrap gap-2 mt-8 justify-center">
                  {[
                    'Best zones to live in Tulum?',
                    'Average rent in Aldea Zama?',
                  ].map(suggestion => (
                    <button
                      key={suggestion}
                      onClick={() => sendMessage(suggestion)}
                      className="px-3 py-2 text-xs rounded-xl bg-muted/40 text-foreground/70 border border-border/20 hover:bg-muted/60 transition-colors"
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
                onDelete={() => deleteMessage(msg.id)}
                onResend={msg.role === 'user' ? () => resendMessage(msg.id) : undefined}
                onTranslate={msg.role === 'assistant' ? handleTranslate : undefined}
                onNavigate={msg.role === 'assistant' ? handleNavigate : undefined}
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="border-t border-white/10 bg-[#0A1A2F] px-3 py-1.5 pb-[calc(env(safe-area-inset-bottom,0px)+6px)]">
            {/* Countdown / ignition status */}
            {(ignitionFlash || countdown !== null) && (
              <div className="flex items-center gap-2 mb-2 px-1">
                {ignitionFlash && (
                  <motion.span
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1.1 }}
                    exit={{ opacity: 0 }}
                    className="text-xs font-bold text-primary flex items-center gap-1"
                  >
                    <Send className="w-3 h-3" /> Sending
                  </motion.span>
                )}
                {countdown !== null && !ignitionFlash && (
                  <motion.span
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0 }}
                    className="text-[10px] font-medium text-primary/70"
                  >
                    {countdown <= 1 ? 'Sending...' : `${countdown}s`}
                  </motion.span>
                )}
              </div>
            )}
            <div className="flex items-end gap-1">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => {
                  setInput(e.target.value);
                  // Auto-grow textarea — expand UPWARD by scrolling into view
                  const el = e.target;
                  el.style.height = 'auto';
                  const maxH = Math.min(el.scrollHeight, window.innerHeight * 0.3);
                  el.style.height = `${maxH}px`;
                  // Scroll the input container into view so the text stays visible above keyboard
                  requestAnimationFrame(() => {
                    el.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                  });
                }}
                onFocus={() => {
                  // When keyboard opens on mobile, scroll input into view
                  setTimeout(() => {
                    inputRef.current?.scrollIntoView({ block: 'nearest', behavior: 'instant' });
                  }, 300);
                }}
                onKeyDown={handleKeyDown}
                placeholder="Ask Swipes..."
                rows={1}
                className="flex-1 resize-none bg-muted/50 border border-border/40 rounded-lg px-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/30"
                style={{ minHeight: '34px', maxHeight: '30vh' }}
              />
              {/* Auto-send toggle — "Open Talk" mode */}
              {speechSupported && (
                <button
                  onClick={() => {
                    const nextAutoSend = !autoSend;
                    toggleAutoSend();
                    nextAutoSend ? uiSounds.playAutoSendOn() : uiSounds.playAutoSendOff();
                  }}
                  className={cn(
                    "shrink-0 flex h-7 items-center justify-center gap-1 rounded-md px-2 text-[9px] font-semibold tracking-wide uppercase transition-all",
                    autoSend
                      ? "bg-primary/15 text-primary border border-primary/30"
                      : "bg-muted/40 text-muted-foreground border border-border/30"
                  )}
                  title={`Open talk ${autoSend ? 'ON' : 'OFF'}`}
                >
                  <Zap className="h-2.5 w-2.5" />
                  <span className="hidden xs:inline">{autoSend ? 'Auto' : 'Auto'}</span>
                </button>
              )}
              {/* Mic button */}
              {micSupported && (
                <div className="relative shrink-0">
                  {(isListening || countdown !== null) && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-md border border-primary/30"
                      animate={{
                        scale: [1, 1.08, 1],
                        opacity: [0.35, 0.85, 0.35],
                        boxShadow: [
                          '0 0 0px hsl(var(--primary) / 0)',
                          '0 0 22px hsl(var(--primary) / 0.45)',
                          '0 0 0px hsl(var(--primary) / 0)'
                        ]
                      }}
                      transition={{ duration: 1.2, repeat: Infinity, ease: 'easeInOut' }}
                    />
                  )}

                  <Button
                    onClick={toggleListening}
                    size="icon"
                    className={cn(
                        "relative z-10 h-7 w-7 rounded-md border transition-all duration-150",
                      isListening || countdown !== null
                        ? "border-primary/40 bg-primary/12 text-primary shadow-[0_0_16px_hsl(var(--primary)/0.28)]"
                        : "border-border/30 bg-muted/40 text-muted-foreground hover:bg-muted/60"
                    )}
                  >
                    <AnimatePresence mode="wait">
                      {countdown !== null ? (
                        <motion.div
                          key="countdown"
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                          className="text-[13px] font-black"
                        >
                          {countdown}
                        </motion.div>
                      ) : isListening && !ignitionFlash ? (
                        <motion.div
                          key="stop"
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                        >
                          <Square className="h-3 w-3 fill-current" />
                        </motion.div>
                      ) : (
                        <motion.div
                          key="mic"
                          initial={{ scale: 0.85, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.85, opacity: 0 }}
                        >
                          <Mic className="h-3 w-3" />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Button>
                </div>
              )}
              {isLoading ? (
                <Button onClick={stopGeneration} size="icon" variant="outline" className="h-7 w-7 rounded-md shrink-0">
                  <Square className="h-3 w-3" />
                </Button>
              ) : (
                <Button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  size="icon"
                  className="h-7 w-7 rounded-md bg-primary hover:bg-primary/90 text-primary-foreground shrink-0 disabled:opacity-40"
                >
                  <Send className="h-3 w-3" />
                </Button>
              )}
              </div>
            </div>
          </>
        )}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(chatContent, document.body) : null;
}
