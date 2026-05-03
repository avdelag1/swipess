import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, MicOff, Sparkles, Plus, 
  Trash2, Menu, Check, Zap, Flame, Sun, Crown, Moon, 
  Globe, Copy, Languages, Timer, ArrowRight, RefreshCw, ChevronLeft, ChevronDown, Volume2, VolumeX
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
import useAppTheme from '@/hooks/useAppTheme';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { SwipessLogo } from '@/components/SwipessLogo';
import { toast } from 'sonner';
import { useModalStore } from '@/state/modalStore';
import { useFilterStore } from '@/state/filterStore';

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

function parseNavActions(content: string): { 
  cleanContent: string; 
  navPaths: string[]; 
  draftActions: { category: string; data: any }[];
  filterAction: any | null;
} {
  const navPaths: string[] = [];
  const draftActions: { category: string; data: any }[] = [];
  let filterAction = null;
  
  // Parse NAV tags
  let cleanContent = content.replace(NAV_PATTERN, (_, path) => {
    navPaths.push(path);
    return '';
  });

  // Parse DRAFT tags: [DRAFT:category:json]
  const DRAFT_PATTERN = /\[DRAFT:([^:]+):(\{[\s\S]*?\})\]/g;
  cleanContent = cleanContent.replace(DRAFT_PATTERN, (_, category, jsonData) => {
    try {
      draftActions.push({ category, data: JSON.parse(jsonData) });
    } catch (e) {
      console.error('Failed to parse draft JSON:', e);
    }
    return '';
  });

  // Parse FILTER tags: [FILTER:json]
  const FILTER_PATTERN = /\[FILTER:(\{[\s\S]*?\})\]/g;
  cleanContent = cleanContent.replace(FILTER_PATTERN, (_, jsonData) => {
    try {
      filterAction = JSON.parse(jsonData);
    } catch (e) {
      console.error('Failed to parse filter JSON:', e);
    }
    return '';
  });

  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
  
  return { cleanContent, navPaths, draftActions, filterAction };
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
    
    <div className="p-5 rounded-2xl border text-[10px] leading-tight text-center bg-white/5 border-white/5 text-white/70">
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
const MessageBubble = memo(({ message, isUser, isSwipess, onCopy, onDelete, onTranslate, onResend, onNavigate, onDraft, onFilter, onSpeak, speakingMsgId, isSpeaking }: { 
  message: ChatMessage, isUser: boolean, isSwipess: boolean,
  onCopy: () => void, onDelete: () => void, onTranslate?: (l:string)=>void,
  onResend?: () => void, onNavigate?: (p:string)=>void,
  onDraft?: (cat: any, data: any) => void,
  onFilter?: (filters: any) => void,
  onSpeak?: (id: string, text: string) => void, speakingMsgId: string | null, isSpeaking: boolean
}) => {
  const [showActions, setShowActions] = useState(false);
  const { cleanContent, navPaths, draftActions, filterAction } = useMemo(
    () => isUser ? { cleanContent: message.content, navPaths: [], draftActions: [], filterAction: null } : parseNavActions(message.content),
    [message.content, isUser]
  );

  // Auto-apply filters if they appear in the latest assistant message
  useEffect(() => {
    if (!isUser && filterAction && onFilter) {
      // Delay slightly to allow the user to read the confirmation
      const timer = setTimeout(() => onFilter(filterAction), 1500);
      return () => clearTimeout(timer);
    }
  }, [isUser, filterAction, onFilter]);

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
          ? (isSwipess ? 'bg-[#FF3D00] text-white rounded-br-md shadow-[0_10px_30px_rgba(255,61,0,0.3)]' : 'bg-primary text-primary-foreground rounded-br-md shadow-md')
          : (isSwipess ? 'bg-white/[0.04] backdrop-blur-3xl border border-white/10 text-white rounded-bl-md' : 'bg-muted/80 text-foreground border border-border/30 rounded-bl-md shadow-sm')
      )}>
        {isUser ? (
          <span className="whitespace-pre-wrap">{message.content}</span>
        ) : (
          <div className="prose prose-sm dark:prose-invert max-w-none prose-p:my-1 prose-ul:my-1 prose-li:my-0.5">
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        )}
        {!isUser && onSpeak && (
           <button 
             onClick={(e) => { e.stopPropagation(); onSpeak(message.id, cleanContent); }}
             className={cn(
               "absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all border",
               speakingMsgId === message.id && isSpeaking 
                 ? "bg-cyan-500 border-cyan-400 text-white shadow-[0_0_10px_rgba(34,211,238,0.4)]" 
                 : isSwipess ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-muted border-border text-muted-foreground hover:text-primary"
             )}
           >
             {speakingMsgId === message.id && isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
           </button>
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
          {draftActions.map((draft, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onDraft?.(draft.category, draft.data); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-cyan-500/10 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/20 shadow-[0_0_20px_rgba(34,211,238,0.1)] transition-all animate-pulse"
            >
              <Plus className="w-4 h-4" />
              Review {draft.category} Draft
              <Sparkles className="w-3 h-3" />
            </button>
          ))}
          {filterAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onFilter?.(filterAction); }}
              className="flex items-center gap-2 px-4 py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest bg-[#FF3D00]/10 text-[#FF3D00] border border-[#FF3D00]/30 hover:bg-[#FF3D00]/20 shadow-[0_0_20px_rgba(255,61,0,0.1)] transition-all"
            >
              <Zap className="w-4 h-4" />
              Applying Search Filters
              <RefreshCw className="w-3 h-3 animate-spin" />
            </button>
          )}
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
              <Copy className="w-3.5 h-3.5 opacity-70" />
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <Languages className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className="p-2 rounded-lg bg-white/5 border border-white/5 hover:bg-white/10 transition-all">
                <RefreshCw className="w-3.5 h-3.5 opacity-70" />
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
          style={{ filter: `drop-shadow(0 0 6px ${color})` }}
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
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 italic">ARCHIVES</h3>
      <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-all">
        <X className="w-4 h-4 opacity-70" />
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
            <span className={cn("text-[11px] font-black uppercase tracking-tight truncate w-full text-left", activeId === c.id ? "text-primary" : "text-white/70")}>
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

function ConciergeChatComponent({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
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
  
  const { speak, stop: stopSpeaking, isSpeaking } = useSpeechSynthesis();
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // 🚀 NEXUS AUDIO: Play welcome sound when concierge opens
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
      speak(text);
    }
  };

  // Character definitions
  const CHARACTER_OPTIONS: { key: AiCharacter; label: string; subtitle: string; icon: typeof Sparkles; color: string; bgColor: string; }[] = [
    { key: 'default', label: 'Swipess AI', subtitle: 'Global Discovery', icon: Sparkles, color: 'text-[#FF3D00]', bgColor: 'bg-[#FF3D00]/20' },
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

  // ── Voice + Auto-Send Logic ────────────────────────────────────────────────
  const [isListening, setIsListening] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [autoSendEnabled, setAutoSendEnabled] = useState(true);
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputValueRef = useRef('');          // always tracks latest input value
  const isListeningRef = useRef(false);      // stable ref for recognition callbacks
  const autoSendEnabledRef = useRef(true);
  
  // Use the more robust hook for platform fallbacks (iOS/Mobile)
  const { 
    start: startTranscribe, 
    stop: stopTranscribe, 
    isRecording: isTranscribingActive 
  } = useVoiceTranscribe();

  useEffect(() => {
    autoSendEnabledRef.current = autoSendEnabled;
  }, [autoSendEnabled]);
  const SILENCE_SECONDS = 3;

  // Keep refs in sync
  useEffect(() => { inputValueRef.current = input; }, [input]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);
  useEffect(() => { autoSendEnabledRef.current = autoSendEnabled; }, [autoSendEnabled]);

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  // Cancel the silence countdown without sending
  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
    triggerHaptic('light');
  }, []);

  // Start/reset the 3-second silence countdown
  const armSilenceCountdown = useCallback(() => {
    if (!autoSendEnabledRef.current) return;
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(SILENCE_SECONDS);
    countdownRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev !== null && prev <= 1) {
          clearInterval(countdownRef.current!);
          countdownRef.current = null;
          const text = inputValueRef.current.trim();
          if (text) {
            sendMessage(text);
            setInput('');
            triggerHaptic('heavy');
            uiSounds.playTap();
          }
          return null;
        }
        return prev !== null ? prev - 1 : null;
      });
    }, 1000);
  }, [sendMessage]);

  const startListening = useCallback(async () => {
    if (!speechSupported) {
      // Fallback to Transcribe Hook for non-SpeechRecognition browsers
      const success = await startTranscribe();
      if (success) {
        setIsListening(true);
        triggerHaptic('medium');
        uiSounds.playMicOn();
      } else {
        toast.error('Microphone Access Denied', { description: 'Please check your browser permissions.' });
      }
      return;
    }

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

    recognition.onerror = (event: any) => {
      console.error('[SpeechRecognition] error:', event.error);
      if (event.error === 'not-allowed') {
        toast.error('Microphone Access Blocked', { description: 'Enable microphone access in your settings.' });
      } else {
        // Silently restart or handle
        stopListening();
      }
    };

    recognition.onresult = (e: any) => {
      let interim = '';
      let finalText = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript;
        else interim += e.results[i][0].transcript;
      }
      
      if (finalText) {
        setInput(prev => (prev.trim() + ' ' + finalText).trim());
        if (autoSendEnabledRef.current) armSilenceCountdown();
      } else if (interim) {
        // We show the current interim, but we don't overwrite the whole buffer to preserve manual edits
        cancelCountdown();
      }
    };

    recognition.onsoundend = () => { 
      if (autoSendEnabledRef.current) armSilenceCountdown(); 
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { recognition.start(); } catch { /* ignore */ }
      }
    };

    recognitionRef.current = recognition;
    recognition.start();
  }, [speechSupported, startTranscribe, armSilenceCountdown, cancelCountdown]);

  const stopListening = useCallback(async () => {
    isListeningRef.current = false;
    setIsListening(false);
    
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    } else {
      // If we were using the hook fallback
      const text = await stopTranscribe();
      if (text) {
        setInput(prev => (prev.trim() + ' ' + text).trim());
        if (autoSendEnabledRef.current) {
          sendMessage(text);
          setInput('');
        }
      }
    }
    
    cancelCountdown();
    uiSounds.playMicOff();
  }, [stopTranscribe, cancelCountdown, sendMessage]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input.trim());
    setInput('');
    triggerHaptic('medium');
    uiSounds.playTap();
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
        <div className={cn("fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6 transition-all duration-500", isLight && !isSwipess ? "bg-black/10 backdrop-blur-md" : "bg-black/40 backdrop-blur-xl")}>
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0"
          />
          
          <motion.div
            layoutId="concierge-panel"
            initial={{ scale: 0.95, opacity: 0, y: 40 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 40 }}
            className={cn(
               "relative w-full max-w-4xl h-[100dvh] sm:h-[88vh] flex flex-col sm:rounded-[3.5rem] overflow-hidden border shadow-[0_40px_150px_rgba(0,0,0,0.9)] transition-colors duration-700",
               isLight && !isSwipess ? "bg-white border-black/10" : "bg-black border-white/10"
             )}
          >
            {/* Ambient Background Glow */}
            {isSwipess && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF3D00]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
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
                {/* Header: Slender, Flagship Nexus Style */}
                <header className={cn(
                  "h-16 shrink-0 flex items-center justify-between px-6 border-b transition-all duration-500 relative z-30", 
                  isLight && !isSwipess ? "border-slate-200 bg-white/80 backdrop-blur-md" : "border-white/5 bg-black/60 backdrop-blur-3xl"
                )}>
                  <div className="flex items-center gap-4">
                    <button 
                      onClick={() => { triggerHaptic('light'); setSidebarOpen(true); }}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all border group", 
                        isLight && !isSwipess ? "bg-slate-100 border-slate-200 hover:bg-slate-200" : "bg-white/5 border-white/10 hover:bg-white/20"
                      )}
                    >
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
                        <button className={cn(
                          "flex items-center gap-2.5 px-3 py-1.5 rounded-2xl border transition-all hover:scale-[1.02] active:scale-95", 
                          isLight && !isSwipess ? "bg-slate-50 border-slate-200" : "bg-white/5 border-white/10"
                        )}>
                           <div className="text-right hidden sm:block">
                              <p className={cn("text-[9px] font-black uppercase tracking-widest", isLight && !isSwipess ? "text-slate-800" : "text-white")}>{currentChar.label}</p>
                              <p className="text-[7px] font-black text-[#FF3D00] uppercase tracking-tighter opacity-80">{currentChar.subtitle}</p>
                           </div>
                           <div className="relative p-[1px] rounded-full overflow-hidden">
                             <div className="absolute inset-0 bg-gradient-to-tr from-[#FF3D00] via-white to-[#FF3D00] animate-spin" />
                             <div className="relative bg-black rounded-full p-0.5">
                              <ArcGauge level={egoLevel} color={arcColor} isLoading={isLoading} icon={currentChar.icon} />
                             </div>
                           </div>
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-64 p-2 rounded-[2.5rem] bg-black/95 backdrop-blur-2xl border-white/10 shadow-3xl z-[10001]" align="end">
                         <div className="p-4 border-b border-white/5 mb-2">
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-white/60 italic">SELECT ARCHETYPE</span>
                         </div>
                         <div className="space-y-1">
                            {CHARACTER_OPTIONS.map(char => (
                              <button
                                key={char.key}
                                onClick={() => { setActiveCharacter(char.key); setCharacterPanelOpen(false); triggerHaptic('medium'); }}
                                className={cn(
                                  "w-full flex items-center gap-4 p-3 rounded-2xl transition-all",
                                  activeCharacter === char.key ? "bg-[#FF3D00]/10 border border-[#FF3D00]/20" : "hover:bg-white/5 border border-transparent"
                                )}
                              >
                                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center", char.bgColor)}>
                                   <char.icon className={cn("w-5 h-5", char.color)} />
                                </div>
                                <div className="text-left">
                                   <p className="text-[11px] font-black uppercase tracking-wider text-white">{char.label}</p>
                                   <p className="text-[9px] font-bold opacity-70 uppercase">{char.subtitle}</p>
                                </div>
                                {activeCharacter === char.key && <Check className="ml-auto w-4 h-4 text-[#FF3D00]" />}
                              </button>
                            ))}
                         </div>
                      </PopoverContent>
                    </Popover>

                    <button 
                      onClick={onClose}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all border group", 
                        isLight && !isSwipess ? "bg-slate-100 border-slate-200 hover:bg-slate-200" : "bg-white/5 border-white/10 hover:bg-white/20"
                      )}
                    >
                      <X className={cn("w-4 h-4 transition-transform group-hover:rotate-90", isLight && !isSwipess ? "text-slate-600" : "text-white/60")} />
                    </button>
                  </div>
                </header>

                <div className={cn("flex-1 overflow-hidden relative flex flex-col transition-colors duration-500", isLight && !isSwipess ? "bg-white" : "bg-black")}>
                   <div 
                     ref={scrollRef}
                     className="flex-1 overflow-y-auto Swipess-scroll p-6 space-y-4 relative"
                   >
                     {messages.length === 0 ? (
                       <div className="h-full flex flex-col items-center justify-center p-12 text-center space-y-8">
                         <motion.div 
                           animate={{ scale: [1, 1.05, 1], rotate: [0, 5, -5, 0] }}
                           transition={{ duration: 5, repeat: Infinity }}
                           className="w-24 h-24 rounded-[3rem] border border-primary/10 flex items-center justify-center bg-primary/5 shadow-xl"
                         >
                           <Sparkles className="w-10 h-10 text-primary opacity-60" />
                         </motion.div>
                         <div className="space-y-1.5">
                           <h3 className={cn(
                              "text-[15px] font-black uppercase tracking-[0.4em] italic",
                              isLight ? "text-black" : "text-white"
                            )}>
                              {isSwipess ? "INTEL CORE ACTIVE" : "Ready to Help"}
                            </h3>
                            <p className={cn(
                              "text-[10px] uppercase tracking-[0.3em] font-black",
                              isLight ? "text-black/70" : "text-[#FF3D00]/60"
                            )}>
                              {isSwipess ? "AWAITING COMMAND SIGNAL" : "Awaiting user inquiry"}
                            </p>
                         </div>
                         <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-lg">
                           {["Luxury Beach Villas", "Hidden Cenotes Guide", "Best Tulum Coworking", "Yacht Charters"].map(s => (
                             <button 
                               key={s} 
                               onClick={() => setInput(s)}
                               className={cn(
                                 "px-6 py-5 rounded-[2rem] border text-[11px] font-black uppercase tracking-widest transition-all text-left flex justify-between items-center group shadow-md",
                                 isLight && !isSwipess
                                   ? "bg-slate-50 border-slate-200 text-slate-700 hover:bg-primary/5 hover:border-primary/30"
                                   : "bg-[#0A0A0A] border-white/10 text-white/70 hover:bg-[#FF3D00]/10 hover:border-[#FF3D00]/30"
                               )}
                             >
                               {s}
                               <ArrowRight className={cn("w-4 h-4 opacity-0 group-hover:opacity-100 transition-all translate-x-[-10px] group-hover:translate-x-0", isLight && !isSwipess ? "text-primary" : "text-[#FF3D00]")} />
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
                           onDraft={(cat, data) => {
                             triggerHaptic('heavy');
                             useModalStore.getState().openAIListing(cat, data);
                             onClose();
                           }}
                           onFilter={(filters) => {
                             triggerHaptic('success');
                             useFilterStore.getState().updateFilters(filters);
                             toast.success("Filters updated via Intelligence Core");
                             onClose();
                           }}
                           onSpeak={m.role === 'assistant' ? handleSpeak : undefined}
                           speakingMsgId={speakingMsgId}
                            isSpeaking={speakingMsgId === m.id}
                          />
                        ))
                      )}
                    </div>
                        <div className={cn("p-6 pb-[calc(env(safe-area-inset-bottom,0px)+24px)] border-t relative z-20", isLight && !isSwipess ? "bg-white border-slate-200" : "bg-black border-white/5")}>
                           <div className="relative group">
                              <div className={cn(
                               "flex items-end gap-2 p-3 rounded-[2.8rem] border transition-all duration-500 relative overflow-hidden shadow-2xl",
                               isLight && !isSwipess 
                                 ? "bg-slate-100 border-black/10 focus-within:border-primary/30 focus-within:bg-white" 
                                 : "bg-white/[0.03] backdrop-blur-3xl border-white/10 focus-within:border-[#FF3D00]/40 focus-within:bg-black/80"
                             )}>
                                 {/* LEFT ACTIONS: Tactical Control Hub */}
                                 <div className="flex flex-col gap-2 p-1">
                                    <button 
                                      onClick={isListening ? stopListening : startListening}
                                      className={cn(
                                        "w-12 h-12 flex items-center justify-center rounded-[22px] transition-all relative overflow-hidden active:scale-90",
                                       isListening 
                                         ? "bg-[#FF3D00] text-white shadow-[0_0_25px_rgba(255,61,0,0.6)]" 
                                         : isLight && !isSwipess 
                                           ? "bg-slate-200 text-slate-700 hover:bg-slate-300 border border-black/5" 
                                           : "bg-white/10 text-white hover:text-white border border-white/10"
                                      )}
                                    >
                                       <Mic className={cn("w-5 h-5", isListening && "animate-pulse")} />
                                       {isListening && (
                                         <motion.div 
                                           className="absolute inset-0 bg-white/30"
                                           animate={{ opacity: [0, 0.4, 0] }}
                                           transition={{ duration: 1, repeat: Infinity }}
                                         />
                                       )}
                                    </button>

                                    <button 
                                       onClick={() => {
                                         setAutoSendEnabled(!autoSendEnabled);
                                         triggerHaptic('light');
                                       }}
                                       className={cn(
                                         "w-12 h-12 flex flex-col items-center justify-center rounded-[22px] transition-all relative overflow-hidden active:scale-90 border",
                                         autoSendEnabled 
                                           ? "bg-[#FF3D00] text-white border-[#FF3D00]/40 shadow-[0_0_15px_rgba(255,61,0,0.3)]" 
                                           : isLight && !isSwipess
                                             ? "bg-white text-slate-400 border-slate-200"
                                             : "bg-white/5 text-white/40 border-white/10 hover:text-white/70"
                                       )}
                                       title={autoSendEnabled ? "Auto-Send Active" : "Manual Send Only"}
                                     >
                                        <Zap className={cn("w-4 h-4 mb-0.5", autoSendEnabled && "fill-current")} />
                                        <span className="text-[7px] font-black uppercase tracking-tighter">Auto</span>
                                     </button>
                                 </div>

                                 {/* TEXT AREA: Directive Input */}
                                 <div className="flex-1 relative pb-2 min-h-[100px] flex flex-col justify-end">
                                    <AnimatePresence>
                                       {countdown !== null && (
                                         <motion.div
                                           initial={{ opacity: 0, y: 10, scale: 0.9 }}
                                           animate={{ opacity: 1, y: 0, scale: 1 }}
                                           exit={{ opacity: 0, y: 10, scale: 0.9 }}
                                           className="flex items-center gap-1.5 mb-2 ml-2"
                                         >
                                           <div className="relative h-9 px-4 rounded-2xl flex items-center gap-2 text-[10px] font-black overflow-hidden"
                                             style={{ background: 'linear-gradient(135deg,#ff3d00,#ff7c40)', boxShadow: '0 10px 25px rgba(255,61,0,0.4)' }}>
                                             <Timer className="w-3.5 h-3.5 text-white animate-pulse" />
                                             <span className="text-white tabular-nums tracking-widest uppercase">AUTO-SENDING IN {countdown}S</span>
                                             <div className="absolute inset-0 bg-white/10 animate-pulse" />
                                           </div>
                                           <button
                                             onClick={cancelCountdown}
                                             className="w-9 h-9 rounded-2xl flex items-center justify-center bg-white/10 hover:bg-white/20 transition-all border border-white/20"
                                           >
                                             <X className="w-4 h-4 text-white" />
                                           </button>
                                         </motion.div>
                                       )}
                                    </AnimatePresence>

                                    <textarea
                                      ref={inputRef}
                                      value={input}
                                      onChange={(e) => setInput(e.target.value)}
                                      onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                                      placeholder={isListening ? "Listening for directive..." : "Transmitting Directive..."}
                                      className={cn(
                                        "w-full bg-transparent border-none focus:ring-0 focus:outline-none text-[15px] py-2 px-4 resize-none max-h-48 min-h-[50px] font-medium outline-none transition-all",
                                        isLight && !isSwipess ? "text-slate-900 placeholder:text-slate-400" : "text-white placeholder:text-white/30"
                                      )}
                                      rows={1}
                                    />
                                 </div>
                                 
                                 {/* RIGHT ACTION: Execute Button */}
                                 <div className="p-1">
                                    <button 
                                      onClick={handleSend}
                                      disabled={!input.trim() || isLoading}
                                      className={cn(
                                        "w-14 h-14 flex items-center justify-center rounded-[26px] shadow-2xl transition-all active:scale-95 group border",
                                        (input.trim() && !isLoading) 
                                          ? "bg-[#FF3D00] text-white border-[#FF3D00]/50 shadow-[0_15px_35px_rgba(255,61,0,0.5)]" 
                                          : isLight && !isSwipess
                                            ? "bg-slate-100 text-slate-300 border-slate-200"
                                            : "bg-white/5 text-white/10 border-white/5"
                                      )}
                                    >
                                       <Send className={cn("w-6 h-6 transition-transform group-hover:translate-x-1 group-hover:-translate-y-1", input.trim() && "drop-shadow-[0_0_12px_rgba(255,255,255,0.6)]")} />
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

export const ConciergeChat = memo(ConciergeChatComponent);
