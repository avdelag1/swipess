import { memo, useCallback, useEffect, useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, Check, Copy, Languages, Plus, RefreshCw, Sparkles, Trash2, Volume2, VolumeX, Zap } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { ChatListingCard } from '@/components/ChatListingCard';
import { ChatProfileCard } from '@/components/ChatProfileCard';
import { NAV_LABELS, parseNavActions } from './conciergeUtils';
import type { ChatMessage } from '@/hooks/useConciergeAI';

export const MessageBubble = memo(({ message, isUser, isSwipess, isLight, onCopy, onDelete, onTranslate, onResend, onNavigate, onDraft, onFilter, onSpeak, speakingMsgId, isSpeaking }: {
  message: ChatMessage, isUser: boolean, isSwipess: boolean, isLight?: boolean,
  onCopy: () => void, onDelete: () => void, onTranslate?: (l:string)=>void,
  onResend?: () => void, onNavigate?: (p:string)=>void,
  onDraft?: (cat: any, data: any) => void,
  onFilter?: (filters: any) => void,
  onSpeak?: (id: string, text: string) => void, speakingMsgId: string | null, isSpeaking: boolean
}) => {
  const [showActions, setShowActions] = useState(false);
  const [copied, setCopied] = useState(false);
  const { cleanContent, navPaths, draftActions, filterAction, listings, profiles } = useMemo(
    () => isUser ? { cleanContent: message.content, navPaths: [], draftActions: [], filterAction: null, listings: [], profiles: [] } : parseNavActions(message.content),
    [message.content, isUser]
  );

  const displayContent = useMemo(() => {
    return cleanContent
      .replace(/https?:\/\/swipess\.com\/share\/[^\s)]*/g, '')
      .replace(/\[LISTINGS:[^\]]*\]?/g, '')
      .replace(/\[PROFILES:[^\]]*\]?/g, '')
      .replace(/\[DRAFT:[^\]]*\]?/g, '')
      .replace(/\[FILTER:[^\]]*\]?/g, '')
      .replace(/\[NAV:[^\]]*\]?/g, '')
      .trim();
  }, [cleanContent]);

  useEffect(() => {
    if (!isUser && filterAction && onFilter) {
      const timer = setTimeout(() => onFilter(filterAction), 50);
      return () => clearTimeout(timer);
    }
  }, [isUser, filterAction, onFilter]);

  const handleCopy = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCopy();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [onCopy]);

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
            <ReactMarkdown>{displayContent}</ReactMarkdown>
          </div>
        )}
        {!isUser && onSpeak && (
           <button
             onClick={(e) => { e.stopPropagation(); onSpeak(message.id, cleanContent); }}
             className={cn(
               "absolute bottom-2 right-2 w-7 h-7 rounded-lg flex items-center justify-center transition-all",
               speakingMsgId === message.id && isSpeaking
                 ? "bg-primary text-primary-foreground shadow-[0_0_10px_hsl(var(--primary)/0.4)]"
                 : isSwipess ? "bg-white/5 text-white/40 hover:text-white" : "bg-muted text-muted-foreground hover:text-primary"
             )}
           >
             {speakingMsgId === message.id && isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
           </button>
        )}
      </div>

      {!isUser && (
        <div className={cn("flex items-center gap-1 mt-0.5 ml-2", isSwipess ? "opacity-40" : "opacity-60")}>
          <Sparkles className="w-2.5 h-2.5 text-[#f55036]" />
          <span className={cn("text-[9px] font-black tracking-widest uppercase", isSwipess ? "text-white" : "text-muted-foreground")}>
            Powered by Groq
          </span>
        </div>
      )}

      {!isUser && listings.length > 0 && (
        <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {listings.map((l) => (
            <ChatListingCard
              key={l.id}
              listing={l}
              isSwipess={isSwipess}
              onNavigate={(path) => onNavigate?.(path)}
            />
          ))}
        </div>
      )}

      {!isUser && profiles.length > 0 && (
        <div className="w-full mt-2 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {profiles.map((p) => (
            <ChatProfileCard
              key={p.id}
              profile={p}
              isSwipess={isSwipess}
              onNavigate={(path) => onNavigate?.(path)}
            />
          ))}
        </div>
      )}

      {(navPaths.length > 0 || draftActions.length > 0 || filterAction) && (
        <div className="flex flex-wrap gap-1.5 mt-1">
          {onNavigate && navPaths.map(path => (
            <button
              key={path}
              onClick={(e) => { e.stopPropagation(); onNavigate(path); }}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              {NAV_LABELS[path] || path}
              <ArrowRight className="w-3 h-3" />
            </button>
          ))}
          {draftActions.map((draft, idx) => (
            <button
              key={idx}
              onClick={(e) => { e.stopPropagation(); onDraft?.(draft.category, draft.data); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary hover:bg-primary/20 transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Review {draft.category} Draft
              <Sparkles className="w-3 h-3" />
            </button>
          ))}
          {filterAction && (
            <button
              onClick={(e) => { e.stopPropagation(); onFilter?.(filterAction); }}
              className="flex items-center gap-2 px-3 py-1.5 rounded-full text-[11px] font-bold tracking-wide bg-primary/10 text-primary hover:bg-primary/20 transition-all"
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
            <button onClick={handleCopy} className={cn("p-2 rounded-xl transition-all", isLight && !isSwipess ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white")}>
              {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
            </button>
            {!isUser && onTranslate && (
              <button onClick={(e) => { e.stopPropagation(); onTranslate('Spanish'); }} className={cn("p-2 rounded-xl transition-all", isLight && !isSwipess ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white")}>
                <Languages className="w-3.5 h-3.5" />
              </button>
            )}
            {isUser && onResend && (
              <button onClick={(e) => { e.stopPropagation(); onResend(); }} className={cn("p-2 rounded-xl transition-all", isLight && !isSwipess ? "bg-slate-100 text-slate-900" : "bg-white/15 text-white")}>
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            )}
            <button onClick={(e) => { e.stopPropagation(); onDelete(); }} className={cn("p-2 rounded-xl transition-all", isLight && !isSwipess ? "bg-red-50 text-red-600" : "bg-red-500/20 text-red-400")}>
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
});
MessageBubble.displayName = 'MessageBubble';
