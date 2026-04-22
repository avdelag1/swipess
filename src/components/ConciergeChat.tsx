import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, MicOff, Sparkles, Plus, 
  Trash2, Menu, Check, Zap, Flame, Sun, Crown, Moon, 
  Globe, Copy, Languages, Timer, ArrowRight, RefreshCw, ChevronLeft, ChevronDown
} from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useAppTheme } from '@/hooks/useAppTheme';
import { SwipessLogo } from '@/components/SwipessLogo';
import { toast } from 'sonner';
import { useModalStore } from '@/state/modalStore';

// Character avatar images (assuming they exist or using fallback)
// import avatarDefault from '@/assets/avatars/avatar-default.png';
// ... others

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
const ConciergePrivacyPortal = memo(({ onAccept, isSwipess }: { onAccept: () => void, isSwipess: boolean }) => (
  <div className={cn(
    "flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full",
    isSwipess ? "bg-black" : "bg-background"
  )}>
    <div className={cn(
      "w-20 h-20 rounded-[2.5rem] flex items-center justify-center mb-4 border relative transition-all duration-700",
      isSwipess ? "bg-primary/10 border-primary/20 shadow-[0_0_40px_rgba(var(--color-brand-primary-rgb),0.2)]" : "bg-primary/10 border-primary/20"
    )}>
      <Sparkles className={cn("w-10 h-10 animate-pulse text-primary")} />
    </div>
    <h2 className={cn(
      "text-3xl font-black tracking-tight uppercase italic",
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
    
    <div className="p-5 rounded-2xl border text-[10px] leading-tight text-center bg-white/5 border-white/5 text-white/40">
      <p className="font-black uppercase tracking-[0.2em] mb-2 text-[11px] text-white/80">AI Disclaimer</p>
      Swipess AI provides automated recommendations for informational purposes only. It is not a substitute for professional real estate, legal, or financial advice.
    </div>

    <div className="w-full space-y-3 mt-6">
      <Button 
        onClick={onAccept}
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 active:scale-95 transition-all text-white font-black uppercase tracking-[0.2em] text-[11px] shadow-[0_20px_40px_rgba(var(--color-brand-primary-rgb),0.3)]"
      >
        Authorize Session
      </Button>
    </div>
  </div>
));
ConciergePrivacyPortal.displayName = 'ConciergePrivacyPortal';

/* ─── Message Bubble ─── */
const MessageBubble = memo(({ message, isUser, isSwipess, onCopy, onDelete, onTranslate, onResend, onNavigate }: { 
  message: ChatMessage, isUser: boolean, isSwipess: boolean,
  onCopy: () => void, onDelete: () => void, onTranslate?: (l:string)=>void,
  onResend?: () => void, onNavigate?: (p:string)=>void 
}) => {
  const [showActions, setShowActions] = useState(false);
  const { cleanContent, navPaths } = useMemo(
    () => isUser ? { cleanContent: message.content, navPaths: [] } : parseNavActions(message.content),
    [message.content, isUser]
  );

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
        "p-4 rounded-2xl text-sm leading-relaxed break-words relative overflow-hidden transition-all duration-500",
        isUser 
          ? (isSwipess ? 'bg-primary text-white rounded-br-md shadow-[0_10px_30px_rgba(var(--color-brand-primary-rgb),0.3)]' : 'bg-primary text-primary-foreground rounded-br-md shadow-md')
          : (isSwipess ? 'bg-white/5 backdrop-blur-2xl border border-white/10 text-white rounded-bl-md' : 'bg-muted/80 text-foreground border border-border/30 rounded-bl-md shadow-sm')
      )}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        )}
      </div>

      {navPaths.length > 0 && onNavigate && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {navPaths.map(path => (
            <button
              key={path}
              onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              {NAV_LABELS[path] || path}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
        </div>
      )}

      <AnimatePresence>
        {showActions && (
          <motion.div 
            initial={{ opacity: 0, y: -5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            className={cn("flex items-center gap-1.5 mt-1 px-1", isUser ? "flex-row-reverse" : "flex-row")}
          >
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
              <Copy className="w-3.5 h-3.5 opacity-40" />
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <Languages className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <RefreshCw className="w-3.5 h-3.5 opacity-40" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
              <Trash2 className="w-3.5 h-3.5 text-red-400/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

/* ─── Typing Indicator ─── */
const TypingIndicator = ({ isSwipess }: { isSwipess: boolean }) => (
  <div className="flex justify-start mb-4">
    <div className={cn(
      "px-5 py-4 rounded-2xl rounded-bl-md flex items-center gap-1 border transition-all",
      isSwipess ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-muted/80 border-border/30"
    )}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className={cn("w-[2px] rounded-full", "bg-primary/70")}
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          style={{ height: '14px' }}
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
          stroke="rgba(255,255,255,0.05)" strokeWidth={stroke} />
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
        animate={isLoading ? { scale: [1, 1.15, 1] } : { scale: 1 }}
        transition={isLoading ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </motion.div>
    </div>
  );
});
ArcGauge.displayName = 'ArcGauge';

const HeaderIcon = ({ isLoading }: { isLoading: boolean }) => (
  <motion.div
    className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20"
    animate={isLoading ? {
      scale: [1, 1.1, 1],
      boxShadow: ['0 0 0px rgba(var(--color-brand-primary-rgb),0)', '0 0 20px rgba(var(--color-brand-primary-rgb),0.3)', '0 0 0px rgba(var(--color-brand-primary-rgb),0)']
    } : { scale: 1 }}
    transition={isLoading ? { duration: 2, repeat: Infinity, ease: 'easeInOut' } : { duration: 0.3 }}
  >
    <Sparkles className="w-5 h-5 text-primary" />
  </motion.div>
);

/* ─── Conversation Sidebar ─── */
const ConversationSidebar = memo(({
  conversations, activeId, onSelect, onDelete, onNew, onClose, isSwipess
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
  onNew: () => void;
  onClose: () => void;
  isSwipess: boolean;
}) => (
  <motion.div
    initial={{ x: -300, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
    className={cn(
      "absolute inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl transition-all border-r",
      isSwipess ? "bg-black border-white/5" : "bg-background border-border"
    )}
  >
    <div className="flex items-center justify-between px-6 py-5 border-b border-white/5">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40 italic">ARCHIVES</h3>
      <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
        <X className="w-4 h-4 opacity-40" />
      </button>
    </div>
    
    <div className="p-4">
      <button 
        onClick={onNew}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border bg-primary/10 border-primary/20 hover:bg-primary/20 transition-all group shadow-lg"
      >
        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white/90">Initialize Session</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
      {conversations.map((c) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              "w-full flex flex-col items-start px-5 py-4 rounded-xl transition-all duration-300 border",
              activeId === c.id ? "bg-white/5 border-white/10" : "hover:bg-white/[0.02] border-transparent"
            )}
          >
            <span className={cn("text-[11px] font-black uppercase tracking-tight truncate w-full text-left", activeId === c.id ? "text-primary" : "text-white/40")}>
              {c.title || 'Untitled Discovery'}
            </span>
            <span className="text-[9px] font-bold opacity-20 uppercase tracking-tighter mt-1">{formatConvoDate(new Date(c.updatedAt))}</span>
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
));
ConversationSidebar.displayName = 'ConversationSidebar';

export function ConciergeChat({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const { theme, isLight } = useAppTheme();
  const isSwipess = theme !== 'light';
  const LAST_ACTIVITY_KEY = 'Swipess_ai_last_activity';

  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    return localStorage.getItem('Swipess_ai_privacy') === 'true';
  });

  const {
    messages, conversations, activeConversationId, isLoading,
    sendMessage, resendMessage, deleteMessage, stopGeneration,
    createConversation, switchConversation, deleteConversation,
    activeCharacter, setActiveCharacter, egoLevel,
  } = useConciergeAI();

  const { navigate: appNavigate } = useAppNavigate();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Character definitions
  const CHARACTER_OPTIONS: { key: AiCharacter; label: string; subtitle: string; icon: typeof Sparkles; color: string; bgColor: string; }[] = [
    { key: 'default', label: 'Swipess AI', subtitle: 'Global Discovery', icon: Sparkles, color: 'text-primary', bgColor: 'bg-primary/20' },
    { key: 'kyle', label: 'Kyle', subtitle: 'Market Hustler', icon: Flame, color: 'text-orange-400', bgColor: 'bg-orange-500/20' },
    { key: 'beaugosse', label: 'Beau Gosse', subtitle: 'Social Alpha', icon: Sparkles, color: 'text-purple-400', bgColor: 'bg-purple-500/20' },
    { key: 'donajkiin', label: 'Don Aj K\'iin', subtitle: 'Mayan Wisdom', icon: Sun, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
    { key: 'botbetter', label: 'Bot Better', subtitle: 'Luxury Analyst', icon: Crown, color: 'text-pink-400', bgColor: 'bg-pink-500/20' },
    { key: 'lunashanti', label: 'Luna Shanti', subtitle: 'Boho Spirit', icon: Moon, color: 'text-violet-300', bgColor: 'bg-violet-500/20' },
    { key: 'ezriyah', label: 'Ezriyah', subtitle: 'Integration Coach', icon: Sun, color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  ];

  const currentChar = CHARACTER_OPTIONS.find(c => c.key === activeCharacter) || CHARACTER_OPTIONS[0];

  const arcColor = useMemo(() => {
    const colorMap: Record<string, string> = {
      default: 'var(--color-brand-primary)',
      kyle: '#fb923c',
      beaugosse: '#a855f7',
      donajkiin: '#10b981',
      botbetter: '#ec4899',
      lunashanti: '#a78bfa',
      ezriyah: '#14b8a6',
    };
    return colorMap[activeCharacter] || 'var(--color-brand-primary)';
  }, [activeCharacter]);

  // Session Management
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

  // Voice Interaction Logic
  const [isListening, setIsListening] = useState(false);
  const { pulse: voicePulse } = useAudioVisualizer(isListening);
  const [autoSend, setAutoSend] = useState(() => {
    try { return localStorage.getItem('concierge-auto-send') === 'true'; } catch { return false; }
  });
  const [countdown, setCountdown] = useState<number | null>(null);
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<any>(null);
  const autoSendRef = useRef(autoSend);
  const speechSupported = typeof window !== 'undefined' && ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const startListening = useCallback(() => {
    if (!speechSupported) return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.onstart = () => { setIsListening(true); triggerHaptic('medium'); uiSounds.playMicOn(); };
    recognition.onresult = (e: any) => {
      let interim = '';
      let final = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) final += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      setInput(prev => final ? final : prev + interim);
      if (autoSendRef.current && final) {
         if (countdownRef.current) clearInterval(countdownRef.current);
         setCountdown(2);
         countdownRef.current = setInterval(() => {
           setCountdown(p => {
             if (p && p <= 1) {
               clearInterval(countdownRef.current);
               sendMessage(input);
               setInput('');
               setIsListening(false);
               recognition.stop();
               return null;
             }
             return p ? p - 1 : null;
           });
         }, 1000);
      }
    };
    recognition.onend = () => { if (isListening) recognition.start(); };
    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, sendMessage, input]);

  const stopListening = useCallback(() => {
    setIsListening(false);
    if (recognitionRef.current) recognitionRef.current.stop();
    if (countdownRef.current) clearInterval(countdownRef.current);
    setCountdown(null);
    uiSounds.playMicOff();
  }, []);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    triggerHaptic('medium');
    uiSounds.playMessageSent();
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Telemetry Copied');
    triggerHaptic('light');
  };

  const handleNavigate = (path: string) => {
    appNavigate(path);
    onClose();
    triggerHaptic('heavy');
  };

  const handleTranslate = (lang: string) => {
    sendMessage(`Translate your last response to ${lang}`);
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-0 md:p-6 lg:p-12 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-md"
          />
          
          <motion.div
            layoutId="concierge-panel"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            className={cn(
              "relative w-full h-full md:max-w-3xl md:h-[90vh] md:rounded-[3rem] shadow-[0_40px_100px_rgba(0,0,0,0.8)] flex flex-col overflow-hidden transition-all duration-700 border border-white/5",
              isSwipess ? "bg-black" : "bg-white"
            )}
          >
            {/* Ambient Background Glow */}
            {isSwipess && (
              <div className="absolute inset-0 pointer-events-none opacity-20 z-0">
                <div className="absolute top-[-20%] left-[-20%] w-full h-full bg-primary/20 blur-[150px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-20%] right-[-20%] w-full h-full bg-blue-500/10 blur-[150px] rounded-full" />
              </div>
            )}

            <AnimatePresence>
              {sidebarOpen && (
                <ConversationSidebar 
                  conversations={conversations}
                  activeId={activeConversationId}
                  onSelect={switchConversation}
                  onDelete={deleteConversation}
                  onNew={() => { createConversation(); setSidebarOpen(false); }}
                  onClose={() => setSidebarOpen(false)}
                  isSwipess={isSwipess}
                />
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
                {/* Header */}
                <header className="h-20 shrink-0 flex items-center justify-between px-6 border-b border-white/5 backdrop-blur-3xl bg-black/40">
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                    >
                      <Menu className="w-5 h-5 text-white/60" />
                    </button>
                    <div className="flex flex-col">
                       <span className="text-[12px] font-black uppercase tracking-[0.3em] text-primary italic">INTEL INTERFACE</span>
                       <span className="text-[9px] font-bold text-white/30 tracking-widest uppercase">System: Operational</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <Popover open={characterPanelOpen} onOpenChange={setCharacterPanelOpen}>
                      <PopoverTrigger asChild>
                        <button className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                           <div className="text-right hidden sm:block">
                              <p className="text-[10px] font-black uppercase tracking-widest text-white">{currentChar.label}</p>
                              <p className="text-[8px] font-bold text-primary uppercase tracking-tighter">{currentChar.subtitle}</p>
                           </div>
                           <div className="relative">
                              <ArcGauge level={egoLevel} color={arcColor} isLoading={isLoading} icon={currentChar.icon} />
                              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-black rounded-full border border-white/10 flex items-center justify-center">
                                 <ChevronDown className="w-2.5 h-2.5 text-white/40" />
                              </div>
                           </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2 rounded-[2.5rem] bg-black border-white/10 shadow-3xl z-[10001]" align="end">
                         <div className="p-4 border-b border-white/5 mb-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/30 italic">SELECT ARCHETYPE</span>
                         </div>
                         <div className="space-y-1">
                            {CHARACTER_OPTIONS.map(char => (
                              <button
                                key={char.key}
                                onClick={() => { setActiveCharacter(char.key); setCharacterPanelOpen(false); triggerHaptic('medium'); }}
                                className={cn(
                                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all",
                                  activeCharacter === char.key ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent"
                                )}
                              >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", char.bgColor)}>
                                   <char.icon className={cn("w-5 h-5", char.color)} />
                                </div>
                                <div className="text-left">
                                   <p className="text-[11px] font-black uppercase tracking-wider text-white">{char.label}</p>
                                   <p className="text-[9px] font-bold opacity-30 uppercase">{char.subtitle}</p>
                                </div>
                                {activeCharacter === char.key && <Check className="ml-auto w-4 h-4 text-primary" />}
                              </button>
                            ))}
                         </div>
                      </PopoverContent>
                    </Popover>

                    <button 
                      onClick={onClose}
                      className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 hover:bg-white/10 transition-all border border-white/5"
                    >
                      <X className="w-5 h-5 text-white/60" />
                    </button>
                  </div>
                </header>

                <div className="flex-1 overflow-hidden relative flex flex-col bg-black/20">
                   <div 
                     ref={scrollRef}
                     className="flex-1 overflow-y-auto Swipess-scroll p-6 space-y-2 relative"
                   >
                     {messages.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8">
                         <motion.div 
                           animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                           transition={{ duration: 5, repeat: Infinity }}
                           className="w-24 h-24 rounded-[3rem] border border-primary/10 flex items-center justify-center bg-primary/5 shadow-[0_0_50px_rgba(var(--color-brand-primary-rgb),0.1)]"
                         >
                           <Sparkles className="w-10 h-10 text-primary opacity-60" />
                         </motion.div>
                         <div className="space-y-1.5">
                           <h3 className={cn(
                             "text-sm font-black uppercase tracking-[0.3em] opacity-80",
                             isLight ? "text-black" : "text-white"
                           )}>
                             {isSwipess ? "System Neutral" : "Ready to Help"}
                           </h3>
                           <p className={cn(
                             "text-[10px] uppercase tracking-widest",
                             isLight ? "text-black/40" : "text-white/20"
                           )}>
                             {isSwipess ? "Awaiting Command Interface" : "Awaiting user inquiry"}
                           </p>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                           {["Luxury Beach Villas", "Hidden Cenotes Guide", "Best Tulum Coworking", "Yacht Charters"].map(s => (
                             <button 
                               key={s} 
                               onClick={() => setInput(s)}
                               className="px-6 py-4 rounded-2xl bg-white/5 border border-white/5 text-[10px] font-black uppercase tracking-widest text-white/60 hover:bg-white/10 hover:text-white transition-all text-left flex justify-between items-center group"
                             >
                               {s}
                               <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-all" />
                             </button>
                           ))}
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
                     {isLoading && <TypingIndicator isSwipess={isSwipess} />}
                   </div>

                   {/* Input Bar */}
                   <div className="p-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] bg-black/60 backdrop-blur-3xl border-t border-white/5">
                      <div className="relative group">
                         <div className={cn(
                           "p-1.5 rounded-[2.2rem] border transition-all duration-500",
                           isListening ? "border-primary/50 bg-primary/5 shadow-[0_0_40px_rgba(var(--color-brand-primary-rgb),0.1)]" : "border-white/5 bg-white/5 group-hover:bg-white/10"
                         )}>
                            <textarea
                              ref={inputRef}
                              value={input}
                              onChange={(e) => setInput(e.target.value)}
                              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                              placeholder={isListening ? "Listening for command..." : "Transmitting Directive..."}
                              className="w-full bg-transparent border-none focus:ring-0 text-sm py-4 px-6 resize-none max-h-48 min-h-[64px] placeholder:text-white/20 text-white font-medium"
                              rows={1}
                            />
                            
                            <div className="flex items-center justify-between px-3 pb-2">
                               <div className="flex items-center gap-2">
                                  <button 
                                    onClick={isListening ? stopListening : startListening}
                                    className={cn(
                                      "w-12 h-12 flex items-center justify-center rounded-2xl transition-all relative overflow-hidden",
                                      isListening ? "bg-red-500 text-white" : "bg-white/5 text-white/40 hover:text-white"
                                    )}
                                  >
                                     <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                                     {isListening && (
                                       <motion.div 
                                         className="absolute inset-0 bg-white/20"
                                         animate={{ opacity: [0, 0.3, 0] }}
                                         transition={{ duration: 1.5, repeat: Infinity }}
                                       />
                                     )}
                                  </button>
                                  
                                  <button 
                                    onClick={() => useModalStore.getState().openAIListing()}
                                    className="w-12 h-12 flex items-center justify-center rounded-2xl bg-white/5 text-primary/40 hover:text-primary transition-all"
                                  >
                                     <Sparkles className="w-5 h-5" />
                                  </button>

                                  <AnimatePresence>
                                     {countdown !== null && (
                                       <motion.div 
                                         initial={{ opacity: 0, x: -10 }}
                                         animate={{ opacity: 1, x: 0 }}
                                         exit={{ opacity: 0, x: -10 }}
                                         className="px-4 h-12 rounded-2xl bg-primary text-black flex items-center gap-2 text-[10px] font-black"
                                       >
                                          <Timer className="w-4 h-4" />
                                          AUTO-SEND: {countdown}S
                                       </motion.div>
                                     )}
                                  </AnimatePresence>
                               </div>

                               <button 
                                 onClick={handleSend}
                                 disabled={!input.trim() || isLoading}
                                 className="w-14 h-14 flex items-center justify-center rounded-full bg-primary text-black shadow-xl disabled:opacity-20 hover:scale-105 active:scale-95 transition-all"
                               >
                                  <Send className="w-6 h-6" />
                               </button>
                            </div>
                         </div>
                      </div>
                   </div>
                </div>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
