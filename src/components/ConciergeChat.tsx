import { useState, useCallback, useRef, useEffect, useMemo, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, Sparkles, Plus, CornerDownLeft,
  Trash2, Menu, Zap, Flame, Sun, Crown, Moon, History, ArrowUp,
  Copy, Languages, Timer, ArrowRight, RefreshCw, Volume2, VolumeX, Share2
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
  '/owner/properties': 'My Listings',
  '/legal': 'Legal Section',
  '/events': 'Browse Events',
};

function parseNavActions(content: string): { 
  cleanContent: string; 
  navPaths: string[]; 
  draftActions: { category: string; data: any }[];
  filterAction: any | null;
  listings: any[];
  profiles: any[];
} {
  const navPaths: string[] = [];
  const draftActions: { category: string; data: any }[] = [];
  let filterAction = null;
  let listings: any[] = [];
  let profiles: any[] = [];
  
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

  const LISTINGS_PATTERN = /\[LISTINGS:(\[[\s\S]*?\])\]/g;
  cleanContent = cleanContent.replace(LISTINGS_PATTERN, (_, jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) listings = parsed;
    } catch (e) {
      console.error('Failed to parse listings JSON:', e);
    }
    return '';
  });

  const PROFILES_PATTERN = /\[PROFILES:(\[[\s\S]*?\])\]/g;
  cleanContent = cleanContent.replace(PROFILES_PATTERN, (_, jsonData) => {
    try {
      const parsed = JSON.parse(jsonData);
      if (Array.isArray(parsed)) profiles = parsed;
    } catch (e) {
      console.error('Failed to parse profiles JSON:', e);
    }
    return '';
  });

  cleanContent = cleanContent.replace(/\n{3,}/g, '\n\n').trim();
  
  return { cleanContent, navPaths, draftActions, filterAction, listings, profiles };
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

const POPULAR_TOPICS: { label: string; prompt: string; icon: any; tone: string }[] = [
  { label: 'Real Estate', prompt: 'Show me modern houses for sale in Tulum', icon: Crown, tone: 'from-orange-400 to-pink-500' },
  { label: 'Rentals', prompt: 'Find me 2 bedroom apartments for rent under $1500', icon: Sun, tone: 'from-rose-400 to-fuchsia-500' },
  { label: 'Motorcycles', prompt: 'Find motorcycles under $3,000', icon: Flame, tone: 'from-amber-400 to-orange-500' },
  { label: 'Bicycles', prompt: 'Show me bicycles available nearby', icon: Zap, tone: 'from-violet-400 to-indigo-500' },
  { label: 'Find Workers', prompt: 'I need a reliable plumber today', icon: Sparkles, tone: 'from-cyan-400 to-sky-500' },
  { label: 'Find Clients', prompt: 'Help me reach more clients for my listing', icon: Moon, tone: 'from-emerald-400 to-teal-500' },
];

const WelcomeState = memo(({ isSwipess, isLight, onPick }: { isSwipess: boolean; isLight: boolean; onPick: (prompt: string) => void }) => (
  <div className="h-full flex flex-col items-start justify-start gap-7 max-w-2xl mx-auto w-full">
    <div className="space-y-2 w-full">
      <h2 className={cn("text-3xl font-black tracking-tight", isLight && !isSwipess ? "text-foreground" : "text-white")}>
        Hey there! <span className="inline-block">👋</span>
      </h2>
      <p className={cn("text-2xl font-bold leading-tight", isLight && !isSwipess ? "text-foreground/80" : "text-white/80")}>
        What can I help you with today?
      </p>
    </div>
    <div className="w-full">
      <p className={cn("text-[11px] font-black uppercase tracking-[0.25em] mb-3", isLight && !isSwipess ? "text-muted-foreground" : "text-white/50")}>
        Popular Topics
      </p>
      <div className="grid grid-cols-2 gap-3">
        {POPULAR_TOPICS.map((t) => (
          <button
            key={t.label}
            onClick={() => onPick(t.prompt)}
            className={cn(
              "flex flex-col items-center justify-center gap-2 px-4 py-5 rounded-2xl border transition-all active:scale-[0.96] hover:shadow-[0_18px_40px_rgba(0,0,0,0.12)]",
              isLight && !isSwipess ? "bg-white border-slate-200 shadow-sm" : "bg-white/10 border-white/20"
            )}
          >
            <div className={cn("w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center shadow-md", t.tone)}>
              <t.icon className="w-5 h-5 text-white" strokeWidth={2.4} />
            </div>
            <span className={cn("text-[13px] font-bold", isLight && !isSwipess ? "text-foreground" : "text-white")}>{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  </div>
));
WelcomeState.displayName = 'WelcomeState';

const MessageBubble = memo(({ message, isUser, isSwipess, isLight, onCopy, onDelete, onTranslate, onResend, onNavigate, onDraft, onFilter, onSpeak, speakingMsgId, isSpeaking }: { 
  message: ChatMessage, isUser: boolean, isSwipess: boolean, isLight?: boolean,
  onCopy: () => void, onDelete: () => void, onTranslate?: (l:string)=>void,
  onResend?: () => void, onNavigate?: (p:string)=>void,
  onDraft?: (cat: any, data: any) => void,
  onFilter?: (filters: any) => void,
  onSpeak?: (id: string, text: string) => void, speakingMsgId: string | null, isSpeaking: boolean
}) => {
  const [showActions, setShowActions] = useState(false);
  const { cleanContent, navPaths, draftActions, filterAction, listings, profiles } = useMemo(
    () => isUser ? { cleanContent: message.content, navPaths: [], draftActions: [], filterAction: null, listings: [], profiles: [] } : parseNavActions(message.content),
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
        "px-4 py-3 rounded-3xl",
        isUser 
          ? 'bg-primary text-primary-foreground rounded-br-md shadow-[0_8px_24px_hsl(var(--primary)/0.35)]'
          : (isSwipess
              ? 'bg-white/[0.05] backdrop-blur-2xl border border-white/10 text-white rounded-bl-md'
              : 'bg-card border border-border/60 text-foreground rounded-bl-md shadow-sm')
      )}>
        {isUser ? (
          <span className="whitespace-pre-wrap text-[15px] leading-relaxed">{message.content}</span>
        ) : (
          <div className={cn(
            "prose prose-sm max-w-none",
            "prose-p:my-1.5 prose-p:leading-relaxed prose-ul:my-1.5 prose-li:my-0.5",
            "prose-headings:text-foreground prose-strong:text-foreground",
            "prose-a:text-primary prose-a:no-underline hover:prose-a:underline",
            "prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded-md prose-code:before:content-none prose-code:after:content-none",
            "prose-blockquote:border-l-primary prose-blockquote:text-muted-foreground",
            "prose-hr:border-border/60",
            isSwipess ? "prose-invert" : ""
          )}>
            <ReactMarkdown>{cleanContent}</ReactMarkdown>
          </div>
        )}
        {!isUser && onSpeak && (
           <button 
             onClick={(e) => { e.stopPropagation(); onSpeak(message.id, cleanContent); }}
             className={cn(
               "absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all border",
               speakingMsgId === message.id && isSpeaking 
                 ? "bg-primary border-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]" 
                 : isSwipess ? "bg-white/5 border-white/10 text-white/40 hover:text-white" : "bg-muted border-border text-muted-foreground hover:text-primary"
             )}
           >
             {speakingMsgId === message.id && isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
           </button>
        )}
      </div>

      {!isUser && listings.length > 0 && (
        <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {listings.map((l) => (
            <div
              key={l.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border text-left transition-all hover:shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
                isSwipess ? "bg-white/[0.04] border-white/10" : "bg-card border-border/60"
              )}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onNavigate?.(`/listing/${l.id}`); }}
                className="w-full text-left active:scale-[0.98] transition-transform"
              >
                {l.image && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img src={l.image} alt={l.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <p className={cn("text-sm font-bold leading-tight line-clamp-1", isSwipess ? "text-white" : "text-foreground")}>{l.title}</p>
                  <p className="text-[13px] font-black bg-gradient-to-r from-primary to-[#A855F7] bg-clip-text text-transparent">
                    {l.currency === "MXN" ? "MXN$" : "$"}{Number(l.price).toLocaleString()}
                    <span className="text-[10px] font-bold opacity-60 ml-1">/ {l.listing_type}</span>
                  </p>
                  <p className={cn("text-[11px] font-medium opacity-70 line-clamp-1", isSwipess ? "text-white/70" : "text-muted-foreground")}>
                    {[l.bedrooms ? `${l.bedrooms} bd` : null, l.bathrooms ? `${l.bathrooms} ba` : null, l.city].filter(Boolean).join(" · ")}
                  </p>
                </div>
              </button>
              <button
                type="button"
                aria-label="Share listing"
                onClick={async (e) => {
                  e.stopPropagation();
                  const url = `${window.location.origin}/listing/${l.id}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: l.title, url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied');
                    }
                  } catch { /* user cancelled */ }
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center border border-white/15 hover:bg-black/75 active:scale-90 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {!isUser && profiles.length > 0 && (
        <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.map((p) => (
            <div
              key={p.id}
              className={cn(
                "group relative overflow-hidden rounded-2xl border text-left transition-all hover:shadow-[0_18px_40px_rgba(0,0,0,0.18)]",
                isSwipess ? "bg-white/[0.04] border-white/10" : "bg-card border-border/60"
              )}
            >
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); onNavigate?.(`/profile/${p.id}`); }}
                className="w-full text-left active:scale-[0.98] transition-transform"
              >
                {p.image && (
                  <div className="aspect-[16/10] w-full overflow-hidden bg-muted">
                    <img src={p.image} alt={p.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-500" />
                  </div>
                )}
                <div className="p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <p className={cn("text-sm font-bold leading-tight", isSwipess ? "text-white" : "text-foreground")}>
                      {p.name?.split(' ')[0] || "User"}{p.age ? `, ${p.age}` : ''}
                    </p>
                    {p.nationality && (
                      <span className="text-[10px] opacity-40 font-bold uppercase">{p.nationality}</span>
                    )}
                  </div>
                  {p.location && (
                    <p className={cn("text-[11px] font-medium opacity-60 line-clamp-1", isSwipess ? "text-white/70" : "text-muted-foreground")}>
                      {p.location}
                    </p>
                  )}
                  {p.intentions && Array.isArray(p.intentions) && p.intentions.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {p.intentions.slice(0, 2).map((it: string) => (
                        <span key={it} className="text-[9px] px-1.5 py-0.5 rounded-md bg-primary/10 text-primary font-black uppercase tracking-tighter">
                          {it}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </button>
              <button
                type="button"
                aria-label="Share profile"
                onClick={async (e) => {
                  e.stopPropagation();
                  const url = `${window.location.origin}/profile/${p.id}`;
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: p.name, url });
                    } else {
                      await navigator.clipboard.writeText(url);
                      toast.success('Link copied');
                    }
                  } catch { /* user cancelled */ }
                }}
                className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/55 backdrop-blur-md text-white flex items-center justify-center border border-white/15 hover:bg-black/75 active:scale-90 transition-all"
              >
                <Share2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {(navPaths.length > 0 || draftActions.length > 0 || filterAction) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {onNavigate && navPaths.map(path => (
            <button
              key={path}
              onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              {NAV_LABELS[path] || path}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
          {draftActions.map((draft, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onDraft?.(draft.category, draft.data); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Review {draft.category} Draft
              <Sparkles className="w-3 h-3" />
            </button>
          ))}
          {filterAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onFilter?.(filterAction); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-all"
            >
              <Zap className="w-3.5 h-3.5" />
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
            <button onClick={(e) => { e.stopPropagation(); onCopy(); }} className={cn("p-2 rounded-xl transition-all border", isLight && !isSwipess ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-white/15 border-white/20 text-white")}>
              <Copy className="w-3.5 h-3.5" />
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className={cn("p-2 rounded-xl transition-all border", isLight && !isSwipess ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-white/15 border-white/20 text-white")}>
                <Languages className="w-3.5 h-3.5" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className={cn("p-2 rounded-xl transition-all border", isLight && !isSwipess ? "bg-slate-100 border-slate-200 text-slate-900" : "bg-white/15 border-white/20 text-white")}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={cn("p-2 rounded-xl transition-all border", isLight && !isSwipess ? "bg-red-50 border-red-100 text-red-600" : "bg-red-500/20 border-red-500/30 text-red-400")}>
              <Trash2 className="w-3.5 h-3.5" />
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
  <>
    {/* Backdrop for mobile */}
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={onClose}
      className="absolute inset-0 z-40 bg-black/20 backdrop-blur-sm sm:hidden"
    />
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
    <div className={cn("flex items-center justify-between px-6 py-5 border-b", isSwipess ? "border-white/[0.06]" : "border-border")}>
      <h3 className={cn("text-[10px] font-black uppercase tracking-[0.3em] italic", isSwipess ? "text-white/50" : "text-foreground/50")}>ARCHIVES</h3>
      <button onClick={onClose} className={cn("p-2 rounded-full transition-all", isSwipess ? "hover:bg-white/[0.08]" : "hover:bg-foreground/[0.08]")}>
        <X className={cn("w-4 h-4 opacity-70", isSwipess ? "text-white" : "text-foreground")} />
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
              activeId === c.id
                ? (isSwipess ? "bg-white/[0.08] border-white/[0.12]" : "bg-foreground/[0.06] border-foreground/[0.10]")
                : (isSwipess ? "hover:bg-white/[0.04] border-transparent" : "hover:bg-foreground/[0.04] border-transparent")
            )}
          >
            <span className={cn("text-[11px] font-black uppercase tracking-tight truncate w-full text-left", activeId === c.id ? "text-primary" : (isSwipess ? "text-white/85" : "text-foreground/85"))}>
              {c.title || 'Untitled Discovery'}
            </span>
            <span className={cn("text-[9px] font-bold uppercase tracking-tighter mt-1", isSwipess ? "text-white/40" : "text-foreground/40")}>{formatConvoDate(new Date(c.updatedAt))}</span>
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); onDelete(c.id); }}
            className={cn("absolute right-2 top-1/2 -translate-y-1/2 p-2 opacity-0 group-hover:opacity-100 transition-opacity hover:text-red-500", isSwipess ? "text-white/60" : "text-foreground/60")}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ))}
    </div>
  </motion.div>
  </>
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
    triggerHaptic('heavy');
    // External URLs → open in browser
    if (/^https?:\/\//i.test(path)) {
      try { window.open(path, '_blank', 'noopener,noreferrer'); } catch { /* ignore */ }
      return;
    }
    // Internal app routes
    appNavigate(path);
    onClose();
  };

  // AI-drafted listing → stash payload, jump into the new-listing flow with prefill
  const handleDraft = useCallback((category: string, data: any) => {
    triggerHaptic('heavy');
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
    toast.success('Review your AI-drafted listing and add a photo to publish.');
  }, [appNavigate, onClose]);

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
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 blur-[120px] rounded-full animate-pulse" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 blur-[120px] rounded-full" />
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

                    <button onClick={onClose} className={cn("w-9 h-9 flex items-center justify-center rounded-full transition-all border group active:scale-90", isLight && !isSwipess ? "bg-muted border-border hover:bg-muted/80" : "bg-white/5 border-white/10 hover:bg-white/15")} aria-label="Close">
                      <X className={cn("w-[18px] h-[18px]", isLight && !isSwipess ? "text-foreground" : "text-white/80")} strokeWidth={2.2} />
                    </button>
                  </div>
                </header>

                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-8 scroll-smooth custom-scrollbar">
                  {messages.length === 0 ? (
                    <WelcomeState
                      isSwipess={isSwipess}
                      isLight={isLight}
                      onPick={(prompt) => { setInput(prompt); triggerHaptic('light'); }}
                    />
                  ) : (
                    messages.map((m) => (
                      <MessageBubble 
                        key={m.id} 
                        message={m} 
                        isUser={m.role === 'user'} 
                        isSwipess={isSwipess}
                        isLight={isLight}
                        onCopy={() => handleCopy(m.content)}
                        onDelete={() => deleteMessage(m.id)}
                        onTranslate={handleTranslate}
                        onResend={() => resendMessage(m.id)}
                        onNavigate={handleNavigate}
                        onDraft={handleDraft}
                        onFilter={(f) => { useFilterStore.getState().setFilters(f); toast.success('Search Logic Updated'); }}
                        onSpeak={handleSpeak}
                        speakingMsgId={speakingMsgId}
                        isSpeaking={isSpeaking}
                      />
                    ))
                  )}
                  {isLoading && <TypingIndicator isSwipess={isSwipess} />}
                </div>

                <footer className="p-4 sm:p-6 transition-all duration-500 relative z-20">
                  {/* Subtle top border gradient line */}
                  <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent opacity-50" />
                  
                  <AnimatePresence>
                    {countdown !== null && (
                      <motion.div
                        initial={{ opacity: 0, y: 12, scale: 0.96 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.94 }}
                        className="absolute -top-16 left-1/2 -translate-x-1/2 flex items-center gap-3 px-4 py-3 rounded-3xl border border-border/50 bg-background/95 backdrop-blur-2xl shadow-[0_20px_40px_hsl(var(--foreground)/0.1)]"
                      >
                         <Timer className="w-4 h-4 text-[#FF3D00]" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-foreground whitespace-nowrap">Send in</span>
                         <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#FF3D00] text-white text-sm font-black shadow-lg shadow-[#FF3D00]/30">{countdown}</span>
                         <button onClick={cancelCountdown} className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-all shadow-inner" aria-label="Cancel auto-send">
                            <X className="w-4 h-4" />
                         </button>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <div className="max-w-3xl mx-auto flex items-end gap-3 relative">
                    <div className="flex-1 min-w-0 relative flex items-center rounded-[2rem] transition-all duration-300 border border-border/50 bg-secondary/30 backdrop-blur-xl shadow-inner focus-within:bg-background focus-within:shadow-[0_0_0_4px_hsl(var(--primary)/0.15)] focus-within:border-primary/40 group overflow-hidden">
                       <div className="pl-3 flex items-center gap-1.5 self-center">
                           <Popover>
                             <PopoverTrigger asChild>
                                 <button className="p-2.5 rounded-2xl transition-all text-muted-foreground hover:text-foreground hover:bg-secondary" aria-label="Auto-send timer">
                                    <Timer className="w-5 h-5" strokeWidth={2} />
                               </button>
                             </PopoverTrigger>
                            <PopoverContent side="top" className="w-64 p-2 rounded-[2rem] border border-border/50 bg-background/95 backdrop-blur-2xl shadow-[0_20px_40px_hsl(var(--foreground)/0.15)]">
                               <button onClick={() => { setAutoSendEnabled(!autoSendEnabled); triggerHaptic('light'); }} className="w-full flex items-center justify-between gap-4 p-4 rounded-3xl hover:bg-secondary transition-all" aria-pressed={autoSendEnabled}>
                                  <span className="flex items-center gap-3 text-[11px] font-black uppercase tracking-widest text-foreground">
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
                            onPointerDown={startListening}
                            onPointerUp={stopListening}
                            onPointerCancel={stopListening}
                            className={cn(
                              "p-2.5 rounded-2xl transition-all relative group overflow-hidden",
                              isListening 
                                ? "bg-[#FF3D00] text-white shadow-[0_0_24px_rgba(255,61,0,0.4)] scale-110" 
                                : "text-muted-foreground hover:text-foreground hover:bg-secondary"
                            )}
                          >
                             {isListening ? <Mic className="w-5 h-5 animate-pulse relative z-10" strokeWidth={2} /> : <Mic className="w-5 h-5 relative z-10" strokeWidth={2} />}
                            {isListening && (
                               <motion.div className="absolute inset-0 bg-white/20 rounded-2xl" animate={{ scale: [1, 1.5, 1], opacity: [0.8, 0, 0.8] }} transition={{ duration: 1.5, repeat: Infinity }} />
                            )}
                         </button>
                       </div>
                       
                       <textarea
                         value={input}
                         onChange={(e) => { setInput(e.target.value); cancelCountdown(); }}
                         placeholder={isListening ? "Listening... Speak now" : "Inquire for discovery..."}
                         rows={1}
                         className={cn(
                           "w-full bg-transparent border-none outline-none focus:ring-0 py-4 pl-3 pr-4 text-[16px] resize-none custom-scrollbar min-h-[56px] max-h-32 leading-relaxed transition-all self-center font-medium",
                           isListening ? "text-[#FF3D00] placeholder:text-[#FF3D00]/50" : "text-foreground placeholder:text-muted-foreground"
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
                          ? "bg-secondary text-muted-foreground cursor-not-allowed border border-border/50" 
                          : "bg-[#FF3D00] text-white shadow-[0_8px_24px_rgba(255,61,0,0.35)] hover:shadow-[0_12px_32px_rgba(255,61,0,0.5)] hover:bg-[#FF3D00]/90 border border-white/10 hover:scale-105"
                      )}
                      aria-label="Send message"
                    >
                      {/* Shine effect on active button */}
                      {input.trim() && !isLoading && (
                        <div className="absolute inset-0 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite] bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12" />
                      )}
                      
                      {isLoading ? (
                        <RefreshCw className="h-6 w-6 animate-spin relative z-10" strokeWidth={2.5} />
                      ) : (
                        <ArrowUp className="h-6 w-6 relative z-10" strokeWidth={2.5} />
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
