import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, Sparkles, Plus, CornerDownLeft,
  Trash2, Menu, Zap, Flame, Sun, Crown, Moon, History, ArrowUp,
  Copy, Languages, Timer, ArrowRight, RefreshCw, Volume2, VolumeX
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import ReactMarkdown from 'react-markdown';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useConciergeAI, ChatMessage, Conversation, AiCharacter } from '@/hooks/useConciergeAI';
import { useVoiceTranscribe } from '@/hooks/useVoiceTranscribe';
import { uiSounds } from '@/utils/uiSounds';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import useAppTheme from '@/hooks/useAppTheme';
import { useSpeechSynthesis, PERSONA_VOICE_PROFILES } from '@/hooks/useSpeechSynthesis';
import { SwipessLogo } from '@/components/SwipessLogo';
import { toast } from 'sonner';
import { useFilterStore } from '@/state/filterStore';

function formatConvoDate(date: Date) {
  return date.toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
}

const NAV_PATTERN = /\[NAV:(\/[^\]]+)\]/g;

const NAV_LABELS: Record<string, string> = {
  '/client/filters': 'Open Filters',
  '/radio': 'Open Radio',
  '/client/profile': 'My Profile',
  '/client/settings': 'Settings',
  '/subscription/packages': 'View Packages',
  '/client/liked': 'Liked Listings',
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
  
  let cleanContent = content.replace(NAV_PATTERN, (_, path) => {
    navPaths.push(path);
    return '';
  });

  const DRAFT_PATTERN = /\[DRAFT:([^:]+):(\{[\s\S]*?\})\]/g;
  cleanContent = cleanContent.replace(DRAFT_PATTERN, (_, category, jsonData) => {
    try {
      draftActions.push({ category, data: JSON.parse(jsonData) });
    } catch (e) {
      console.error('Failed to parse draft JSON:', e);
    }
    return '';
  });

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
      "text-3xl font-bold tracking-tight",
      isSwipess ? "text-white" : "text-foreground"
    )}>
      {isSwipess ? "Swipess Intel" : "Concierge AI"}
    </h2>
    <p className={cn(
      "text-sm leading-relaxed max-w-[300px]",
      isSwipess ? "text-white/50" : "text-muted-foreground"
    )}>
      Start a private conversation with your AI concierge. Your messages are confidential and powered by top-tier intelligence.
    </p>
    
    <div className={cn(
      "p-4 rounded-2xl border text-xs leading-snug text-center",
      isSwipess ? "bg-white/5 border-white/10 text-white/70" : "bg-muted/40 border-border text-muted-foreground"
    )}>
      <p className={cn("font-semibold mb-1.5 text-[11px]", isSwipess ? "text-white/80" : "text-foreground")}>AI Disclaimer</p>
      Swipess AI provides automated recommendations for informational purposes only. It is not a substitute for professional real estate, legal, or financial advice.
    </div>

    <div className="w-full space-y-3 mt-6">
      <Button 
        onClick={onAccept}
        className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 active:scale-[0.97] transition-all text-primary-foreground font-bold tracking-wide text-base shadow-[0_18px_48px_hsl(var(--primary)/0.45)] ring-1 ring-primary/40 flex items-center justify-center gap-2"
      >
        Start Session
        <CornerDownLeft className="w-4 h-4 opacity-80" />
      </Button>
    </div>
  </div>
));
ConciergePrivacyPortal.displayName = 'ConciergePrivacyPortal';

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

  useEffect(() => {
    if (!isUser && filterAction && onFilter) {
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
        isUser 
          ? (isSwipess ? 'bg-[#FF3D00] text-white rounded-br-md shadow-[0_10px_30px_rgba(255,61,0,0.3)]' : 'bg-primary text-primary-foreground rounded-br-md shadow-md')
          : (isSwipess ? 'bg-white/[0.04] backdrop-blur-3xl border border-white/10 text-white rounded-bl-md' : 'bg-white border-black/[0.05] text-black rounded-bl-md shadow-sm')
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
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className="p-2 rounded-lg bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06] transition-all">
              <Copy className="w-3.5 h-3.5 opacity-70" />
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className="p-2 rounded-lg bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06] transition-all">
                <Languages className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className="p-2 rounded-lg bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06] transition-all">
                <RefreshCw className="w-3.5 h-3.5 opacity-70" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className="p-2 rounded-lg bg-black/[0.03] border border-black/[0.05] hover:bg-black/[0.06] transition-all">
              <Trash2 className="w-3.5 h-3.5 text-red-500/40" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = ({ isSwipess }: { isSwipess: boolean }) => (
  <div className="flex justify-start mb-4">
    <div className={cn(
      "px-5 py-4 rounded-2xl rounded-bl-md flex items-center gap-1 border transition-all",
      isSwipess ? "bg-white/5 backdrop-blur-3xl border-white/10" : "bg-black/[0.03] border-black/[0.05]"
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
          stroke="rgba(0,0,0,0.05)" strokeWidth={stroke} />
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
      isSwipess ? "bg-black border-white/5" : "bg-white border-zinc-100"
    )}
  >
    <div className="flex items-center justify-between px-6 py-5 border-b border-black/[0.05]">
      <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-black/50 italic">ARCHIVES</h3>
      <button onClick={onClose} className="p-2 hover:bg-black/[0.05] rounded-full transition-all">
        <X className="w-4 h-4 opacity-70" />
      </button>
    </div>
    
    <div className="p-4">
      <button 
        onClick={onNew}
        className="w-full flex items-center gap-3 px-5 py-4 rounded-2xl border bg-primary/10 border-primary/20 hover:bg-primary/20 transition-all group shadow-lg"
      >
        <Plus className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-primary">Initialize Session</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto px-4 pb-6 space-y-1">
      {conversations.map((c) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              "w-full flex flex-col items-start px-5 py-4 rounded-xl transition-all duration-300 border",
              activeId === c.id ? "bg-black/[0.05] border-black/[0.08]" : "hover:bg-black/[0.02] border-transparent"
            )}
          >
            <span className={cn("text-[11px] font-black uppercase tracking-tight truncate w-full text-left", activeId === c.id ? "text-primary" : "text-black/70")}>
              {c.title || 'Untitled Discovery'}
            </span>
            <span className="text-[9px] font-bold opacity-20 uppercase tracking-tighter mt-1">{formatConvoDate(new Date(c.updatedAt))}</span>
          </button>
          <button 
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500"
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
    sendMessage, resendMessage, deleteMessage,
    createConversation, switchConversation, deleteConversation,
    activeCharacter, setActiveCharacter, egoLevel,
  } = useConciergeAI();

  const { navigate: appNavigate } = useAppNavigate();
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [characterPanelOpen, setCharacterPanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
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
    { key: 'lunashanti', label: 'Luna Shanti', subtitle: 'Boho Spirit', tagline: 'From Tulum', icon: Moon, color: 'text-violet-300', bgColor: 'bg-violet-500/20' },
    { key: 'ezriyah', label: 'Ezriyah', subtitle: 'Integration Coach', tagline: 'Local Legend', icon: Sun, color: 'text-teal-400', bgColor: 'bg-teal-500/20' },
  ];

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
  const recognitionRef = useRef<any>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const inputValueRef = useRef('');
  const isListeningRef = useRef(false);
  const autoSendEnabledRef = useRef(true);
  
  const { 
    start: startTranscribe, 
    stop: stopTranscribe,
  } = useVoiceTranscribe();

  useEffect(() => {
    autoSendEnabledRef.current = autoSendEnabled;
  }, [autoSendEnabled]);

  useEffect(() => { inputValueRef.current = input; }, [input]);
  useEffect(() => { isListeningRef.current = isListening; }, [isListening]);

  const speechSupported = typeof window !== 'undefined' &&
    ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);

  const cancelCountdown = useCallback(() => {
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(null);
    triggerHaptic('light');
  }, []);

  const armSilenceCountdown = useCallback(() => {
    if (!autoSendEnabledRef.current) return;
    if (countdownRef.current) { clearInterval(countdownRef.current); countdownRef.current = null; }
    setCountdown(3);
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
      const success = await startTranscribe();
      if (success) {
        setIsListening(true);
        triggerHaptic('medium');
        uiSounds.playMicOn();
      } else {
        toast.error('Microphone Access Denied');
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
        cancelCountdown();
      }
    };

    recognition.onsoundend = () => { 
      if (isListeningRef.current) armSilenceCountdown(); 
    };

    recognition.onend = () => {
      if (isListeningRef.current) {
        try { 
          recognition.start(); 
        } catch (err) {
          console.warn('[SpeechRecognition] Restart failed:', err);
          setIsListening(false);
          isListeningRef.current = false;
        }
      }
    };

    recognition.onerror = (e: any) => {
      console.error('[SpeechRecognition] Error:', e.error);
      if (e.error === 'not-allowed') {
        toast.error('Microphone access denied');
        setIsListening(false);
        isListeningRef.current = false;
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

  const handleTranslate = useCallback((_text: string) => {
    triggerHaptic('light');
    toast.info('Translation initialization...');
    // Real implementation would call the AI translate function
    // For now we just acknowledge the request to stop the ReferenceError
  }, []);

  const handleNavigate = (path: string) => {
    appNavigate(path);
    onClose();
    triggerHaptic('heavy');
  };

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className={cn("fixed inset-0 z-[60] flex items-center justify-center p-0 sm:p-6 transition-all duration-500", isLight && !isSwipess ? "bg-black/10 backdrop-blur-md" : "bg-black/40 backdrop-blur-xl")}>
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0" />
          
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
            {isSwipess && (
              <div className="absolute inset-0 pointer-events-none z-0">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-[#FF3D00]/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-600/10 blur-[120px] rounded-full" />
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
                  isLight && !isSwipess ? "border-slate-200 bg-white/80 backdrop-blur-md" : "border-white/5 bg-black/60 backdrop-blur-3xl"
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
                      <PopoverContent side="bottom" align="end" className={cn("w-72 p-2 rounded-3xl border shadow-2xl z-[70]", isLight && !isSwipess ? "bg-white border-slate-200" : "bg-black/95 border-white/10 backdrop-blur-3xl")}>
                        <div className="p-3 mb-2">
                          <h4 className="text-[10px] font-black uppercase tracking-widest text-white/40 italic">Select Logic Profile</h4>
                        </div>
                        <div className="space-y-1">
                          {CHARACTER_OPTIONS.map((c) => (
                            <button
                              key={c.key}
                              onClick={() => { setActiveCharacter(c.key); setCharacterPanelOpen(false); triggerHaptic('light'); }}
                              className={cn("w-full flex items-center gap-3 p-3 rounded-2xl transition-all group", activeCharacter === c.key ? "bg-primary/10 border border-primary/20" : "hover:bg-white/5 border border-transparent")}
                            >
                              <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center transition-all", c.bgColor)}>
                                <c.icon className={cn("w-5 h-5", c.color)} />
                              </div>
                              <div className="text-left flex-1 min-w-0">
                                <p className={cn("text-[11px] font-black uppercase tracking-widest", activeCharacter === c.key ? "text-primary" : "text-white")}>{c.label} <span className="opacity-40 font-bold">— {c.tagline}</span></p>
                                <p className="text-[8px] font-bold opacity-40 uppercase tracking-tighter">{c.subtitle}</p>
                              </div>
                              {activeCharacter === c.key && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-primary" />}
                            </button>
                          ))}
                        </div>
                      </PopoverContent>
                    </Popover>

                    <button onClick={onClose} className={cn("w-10 h-10 flex items-center justify-center rounded-xl transition-all border group", isLight && !isSwipess ? "bg-slate-100 border-slate-200 hover:bg-red-500 hover:border-red-500" : "bg-white/5 border-white/10 hover:bg-white/20")}>
                      <X className={cn("w-4 h-4 transition-transform group-hover:scale-110", isLight && !isSwipess ? "text-slate-600 group-hover:text-white" : "text-white/60")} />
                    </button>
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth custom-scrollbar">
                  {messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                       <SwipessLogo className="w-16 h-16 animate-pulse" />
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.4em]">Ready for discovery</p>
                          <p className="text-[8px] font-bold uppercase tracking-widest mt-1">Start by typing or speaking your request</p>
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
                        onTranslate={handleTranslate}
                        onResend={() => resendMessage(m.id)}
                        onNavigate={handleNavigate}
                        onFilter={(f) => { useFilterStore.getState().setFilters(f); toast.success('Search Logic Updated'); }}
                        onSpeak={handleSpeak}
                        speakingMsgId={speakingMsgId}
                        isSpeaking={isSpeaking}
                      />
                    ))
                  )}
                  {isLoading && <TypingIndicator isSwipess={isSwipess} />}
                </div>

                <footer className={cn(
                  "p-4 sm:p-6 transition-all duration-500 border-t relative z-20",
                  isLight && !isSwipess ? "bg-white border-slate-100" : "bg-black border-white/5"
                )}>
                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        className={cn(
                          "absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-3xl border backdrop-blur-2xl shadow-2xl",
                          isLight && !isSwipess ? "bg-foreground text-background border-foreground/20" : "bg-background text-foreground border-border"
                        )}
                      >
                         <Timer className="w-4 h-4 text-primary" />
                         <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">Send in</span>
                         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-black shadow-lg">{countdown}</span>
                         <button onClick={cancelCountdown} className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-foreground hover:bg-muted/80 transition-all" aria-label="Cancel auto-send">
                            <X className="w-4 h-4" />
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-w-3xl mx-auto flex items-center gap-3">
                    <div className={cn("flex-1 min-w-0 relative flex items-center rounded-3xl transition-all duration-500 border group", isLight && !isSwipess ? "bg-slate-50 border-slate-200 focus-within:border-primary/50" : "bg-white/5 border-white/10 focus-within:border-primary/50")}>
                       <div className="pl-2 flex items-center gap-1.5 self-center">
                           <Popover>
                             <PopoverTrigger asChild>
                                 <button className={cn("p-2.5 rounded-2xl transition-all border", isLight && !isSwipess ? "bg-foreground/15 border-foreground/20 text-foreground hover:bg-foreground/25" : "bg-white/10 border-white/10 text-white hover:bg-white/15")} aria-label="Auto-send timer">
                                    <Timer className="w-4 h-4" strokeWidth={2.6} />
                               </button>
                             </PopoverTrigger>
                            <PopoverContent side="top" className={cn("w-64 p-2 rounded-3xl border backdrop-blur-xl shadow-2xl", isLight && !isSwipess ? "bg-foreground text-background border-foreground/20" : "bg-background text-foreground border-border")}>
                               <button onClick={() => { setAutoSendEnabled(!autoSendEnabled); triggerHaptic('light'); }} className="w-full flex items-center justify-between gap-4 p-4 rounded-2xl hover:bg-muted/20 transition-all" aria-pressed={autoSendEnabled}>
                                  <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest">
                                    <Timer className="w-4 h-4 text-primary" />
                                    Auto-Send
                                  </span>
                                  <div className={cn("w-12 h-7 rounded-full relative transition-all ring-1", autoSendEnabled ? "bg-primary ring-primary/30" : "bg-muted ring-border")}>
                                     <div className={cn("absolute top-1 h-5 w-5 rounded-full shadow-md transition-all", autoSendEnabled ? "right-1 bg-primary-foreground" : isLight && !isSwipess ? "left-1 bg-background" : "left-1 bg-foreground")} />
                                 </div>
                              </button>
                           </PopoverContent>
                         </Popover>

                          <button
                            onPointerDown={startListening}
                            onPointerUp={stopListening}
                            onPointerCancel={stopListening}
                            className={cn("p-2.5 rounded-2xl transition-all relative group", isListening ? "bg-cyan-500 text-white shadow-[0_0_20px_rgba(34,211,238,0.5)] scale-110" : isLight && !isSwipess ? "text-foreground/80 hover:bg-foreground/10 hover:text-foreground" : "text-white/80 hover:bg-white/10")}
                          >
                             {isListening ? <Mic className="w-4 h-4 animate-pulse" strokeWidth={2.6} /> : <Mic className="w-4 h-4" strokeWidth={2.6} />}
                            {isListening && (
                               <motion.div className="absolute -inset-1 rounded-2xl border border-cyan-400" animate={{ opacity: [0.5, 0, 0.5], scale: [1, 1.2, 1] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            )}
                         </button>
                       </div>
                       <textarea
                         value={input}
                         onChange={(e) => { setInput(e.target.value); cancelCountdown(); }}
                         placeholder={isListening ? "Listening... Speak now" : "Inquire for discovery..."}
                         rows={1}
                         className={cn("w-full bg-transparent border-none focus:ring-0 py-4 pl-2 pr-5 text-sm resize-none custom-scrollbar min-h-[56px] max-h-32 leading-6 transition-all self-center", isListening && "text-cyan-400 placeholder:text-cyan-400/40")}
                         onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
                       />
                    </div>
                    
                       <button
                         onClick={handleSend}
                         disabled={!input.trim() || isLoading}
                         className={cn(
                           "h-14 w-14 shrink-0 rounded-full inline-flex items-center justify-center transition-all active:scale-90 border shadow-[0_18px_42px_hsl(var(--primary)/0.42)]",
                           "bg-primary text-primary-foreground border-primary/30 hover:bg-primary/90 hover:shadow-[0_22px_54px_hsl(var(--primary)/0.5)]",
                           (!input.trim() || isLoading) && "opacity-60"
                         )}
                         aria-label="Send message"
                       >
                         {isLoading ? (
                           <RefreshCw className="h-6 w-6 animate-spin" strokeWidth={2.4} />
                         ) : (
                           <Send className="h-6 w-6" strokeWidth={2.4} />
                         )}
                       </button>
                  </div>
                </footer>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

ConciergeChatComponent.displayName = 'ConciergeChat';
export const ConciergeChat = memo(ConciergeChatComponent);
