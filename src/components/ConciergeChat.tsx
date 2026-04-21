import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  X, Send, Mic, Square, Sparkles, Plus, 
  Trash2, Menu, Check, Zap, Flame, Sun, Crown, Moon, 
  ChevronRight, Copy, Languages, CornerDownRight, Search
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import { useConciergeAI, ChatMessage, AiCharacter } from '@/hooks/useConciergeAI';
import { uiSounds } from '@/utils/uiSounds';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { useTheme } from '@/hooks/useTheme';

/* ─── Character Avatars ─── */
const CHARACTER_AVATARS: Record<string, string> = {
  default: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&h=200&fit=crop',
  kyle: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=200&h=200&fit=crop',
  beaugosse: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop',
  donajkiin: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
  botbetter: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  lunashanti: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop',
  ezriyah: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop',
};

/* ─── Privacy Portal ─── */
const ConciergePrivacyPortal = ({ onAccept, isNexus }: { onAccept: () => void, isNexus: boolean }) => (
  <div className={cn(
    "flex-1 flex flex-col items-center justify-center p-8 relative z-10 space-y-6 text-center h-full",
    isNexus ? "bg-black" : "bg-background"
  )}>
    <div className={cn(
      "w-20 h-20 rounded-[2rem] flex items-center justify-center mb-4 border relative",
      isNexus ? "bg-cyan-500/10 border-cyan-500/20 shadow-[0_0_40px_rgba(34,211,238,0.2)]" : 
      "bg-primary/10 border-primary/20"
    )}>
      <Sparkles className={cn("w-10 h-10 animate-pulse", isNexus ? "text-cyan-400" : "text-primary")} />
    </div>
    <h2 className={cn(
      "text-2xl font-black tracking-tight uppercase",
      isNexus ? "text-white" : "text-foreground"
    )}>
      {isNexus ? "Nexus Intel" : "Concierge AI"}
    </h2>
    <p className={cn(
      "text-xs leading-relaxed max-w-[280px]",
      isNexus ? "text-white/50" : "text-muted-foreground"
    )}>
      Initialize the discovery interface. Your inquiries are handled with absolute confidentiality and processed by flagship-grade intelligence.
    </p>
    
    <div className="w-full max-w-xs pt-4">
      <Button 
        onClick={onAccept}
        className={cn(
          "w-full h-14 rounded-2xl font-black uppercase tracking-[0.2em] text-[11px] transition-all",
          isNexus ? "bg-cyan-500 hover:bg-cyan-600 text-black shadow-[0_10px_30px_rgba(34,211,238,0.3)]" : 
          "shadow-xl"
        )}
      >
        Authorize Session
      </Button>
    </div>
  </div>
);

/* ─── Message Bubble ─── */
const MessageBubble = ({ 
  message, isUser, isNexus, onCopy, onDelete, onTranslate, onResend, onNavigate 
}: { 
  message: ChatMessage, isUser: boolean, isNexus: boolean,
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
          ? (isNexus ? 'bg-cyan-500 text-black rounded-br-md shadow-[0_10px_20px_rgba(34,211,238,0.2)]' : 'bg-primary text-primary-foreground rounded-br-md shadow-md')
          : (isNexus ? 'bg-white/5 backdrop-blur-xl border border-white/10 text-white rounded-bl-md' : 'bg-muted/80 text-foreground border border-border/30 rounded-bl-md shadow-sm')
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
const TypingIndicator = ({ isNexus }: { isNexus: boolean }) => (
  <div className="flex justify-start mb-4">
    <div className={cn(
      "px-5 py-3.5 rounded-2xl rounded-bl-md flex items-center gap-[3px] border transition-all",
      isNexus ? "bg-white/5 backdrop-blur-xl border-cyan-500/20" : "bg-muted/80 border-border/30"
    )}>
      {[0, 1, 2, 3, 4].map(i => (
        <motion.div
          key={i}
          className={cn("w-[2px] rounded-full", isNexus ? "bg-cyan-400/70" : "bg-primary/70")}
          animate={{ scaleY: [0.35, 1, 0.35] }}
          transition={{ duration: 0.9, repeat: Infinity, ease: 'easeInOut', delay: i * 0.1 }}
          style={{ height: '12px' }}
        />
      ))}
    </div>
  </div>
);

/* ─── Sidebar ─── */
const ConversationSidebar = ({ conversations, activeId, onSelect, onDelete, onNew, onClose, isNexus }: any) => (
  <motion.div
    initial={{ x: -280, opacity: 0 }}
    animate={{ x: 0, opacity: 1 }}
    exit={{ x: -300, opacity: 0 }}
    transition={{ type: 'spring', damping: 28, stiffness: 350 }}
    className={cn(
      "absolute inset-y-0 left-0 w-72 z-50 flex flex-col shadow-2xl transition-all",
      isNexus ? "bg-black border-r border-white/5" : "bg-background border-r border-border"
    )}
  >
    <div className={cn("flex items-center justify-between px-5 py-4 border-b", isNexus ? "border-white/5" : "border-border")}>
      <h3 className={cn("text-[11px] font-black uppercase tracking-widest", isNexus ? "text-cyan-400" : "text-foreground")}>Archives</h3>
      <button onClick={onClose} className="p-1 hover:bg-white/5 rounded-full transition-colors">
        <X className="w-4 h-4 opacity-40" />
      </button>
    </div>
    
    <div className="p-3">
      <button 
        onClick={onNew}
        className={cn(
          "w-full flex items-center gap-3 px-4 py-3 rounded-xl border transition-all group",
          isNexus ? "bg-white/5 border-white/5 text-white/80 hover:bg-white/10" : "bg-primary/10 border-primary/20 hover:bg-primary/20"
        )}
      >
        <Plus className={cn("w-4 h-4 group-hover:scale-110 transition-transform", isNexus ? "text-cyan-400" : "text-primary")} />
        <span className="text-xs font-bold uppercase tracking-wider">New Session</span>
      </button>
    </div>

    <div className="flex-1 overflow-y-auto nexus-scroll px-3 space-y-1">
      {conversations.map((c: any) => (
        <div key={c.id} className="group relative">
          <button
            onClick={() => { onSelect(c.id); onClose(); }}
            className={cn(
              "w-full flex flex-col items-start px-4 py-3.5 rounded-xl transition-all duration-300 border",
              activeId === c.id 
                ? (isNexus ? "bg-cyan-500/10 border-cyan-500/20" : "bg-primary/10 border-primary/30") 
                : "hover:bg-muted/50 border-transparent"
            )}
          >
            <span className={cn("text-xs font-bold truncate w-full text-left", activeId === c.id ? (isNexus ? "text-cyan-400" : "text-primary") : "opacity-60")}>
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
  const isNexus = theme === 'nexus-style';

  const [hasAcceptedPrivacy, setHasAcceptedPrivacy] = useState(() => {
    return localStorage.getItem('NEXUS DISCOVERY_ai_privacy') === 'true';
  });

  const LAST_ACTIVITY_KEY = 'NEXUS DISCOVERY_ai_last_activity';

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
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput('');
    triggerHaptic('medium');
  };

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

  // Scroll to bottom
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
            isNexus ? "bg-black nexus-style" : "bg-background"
          )}
        >
          {/* Background Ambient */}
          {isNexus && (
            <div className="absolute inset-0 pointer-events-none opacity-40">
              <div className="absolute top-[-10%] left-[-10%] w-full h-[60%] bg-cyan-900/10 blur-[120px] rounded-full" />
              <div className="absolute bottom-[-10%] right-[-10%] w-[80%] h-[50%] bg-blue-900/10 blur-[100px] rounded-full" />
            </div>
          )}

          {!hasAcceptedPrivacy ? (
            <ConciergePrivacyPortal onAccept={() => {
              localStorage.setItem('NEXUS DISCOVERY_ai_privacy', 'true');
              setHasAcceptedPrivacy(true);
              triggerHaptic('success');
            }} isNexus={isNexus} />
          ) : (
            <div className="flex-1 flex flex-col relative z-20 overflow-hidden">
              {/* Sidebar backdrop */}
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
                    isNexus={isNexus}
                  />
                )}
              </AnimatePresence>

              {/* Header */}
              <div className={cn(
                "h-16 flex items-center justify-between px-5 border-b backdrop-blur-xl transition-all",
                isNexus ? "border-white/5 bg-black/40" : "border-border bg-background/80"
              )}>
                <div className="flex items-center gap-3">
                  <div className={cn(
                    "w-9 h-9 rounded-xl flex items-center justify-center border transition-all",
                    isNexus ? "bg-cyan-500/10 border-cyan-500/20" : "bg-primary/10 border-primary/20"
                  )}>
                    <Zap className={cn("w-5 h-5", isNexus ? "text-cyan-400" : "text-primary")} />
                  </div>
                  <div className="flex flex-col">
                    <span className={cn("text-[11px] font-black uppercase tracking-[0.2em] uppercase", isNexus ? "text-cyan-400" : "text-foreground")}>
                      {isNexus ? "Interface" : "Assistant"}
                    </span>
                    <span className="text-[9px] font-medium opacity-30 tracking-tight">
                      {isNexus ? "V2.9.ZENITH" : "PRO.CONCIERGE"}
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

              {/* Messages Area */}
              <div 
                ref={scrollRef}
                className={cn(
                  "flex-1 overflow-y-auto nexus-scroll p-4 space-y-1 relative"
                )}
              >
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center p-8 text-center space-y-6">
                    <motion.div 
                      initial={{ scale: 0.8 }}
                      animate={{ scale: 1 }}
                      className={cn(
                        "w-16 h-16 rounded-[2rem] border flex items-center justify-center",
                        isNexus ? "bg-cyan-500/5 border-cyan-500/10" : "bg-primary/5 border-primary/10"
                      )}
                    >
                      <Sparkles className={cn("w-8 h-8 opacity-40", isNexus ? "text-cyan-400" : "text-primary")} />
                    </motion.div>
                    <div className="space-y-1.5">
                      <h3 className="text-sm font-black uppercase tracking-[0.3em] opacity-80">
                        {isNexus ? "Interface Ready" : "Concierge Ready"}
                      </h3>
                      <p className="text-[10px] opacity-20 uppercase tracking-widest">
                        {isNexus ? "Awaiting Command" : "How can I assist you today?"}
                      </p>
                    </div>
                  </div>
                ) : (
                  messages.map((m) => (
                    <MessageBubble 
                      key={m.id}
                      message={m}
                      isUser={m.role === 'user'}
                      isNexus={isNexus}
                      onCopy={() => handleCopy(m.content)}
                      onDelete={() => deleteMessage(m.id)}
                      onTranslate={m.role === 'assistant' ? handleTranslate : undefined}
                      onResend={m.role === 'user' ? () => resendMessage(m.id) : undefined}
                      onNavigate={handleNavigate}
                    />
                  ))
                )}
                {isLoading && <TypingIndicator isNexus={isNexus} />}
              </div>

              {/* Input Area */}
              <div className={cn(
                 "p-4 border-t pb-[calc(env(safe-area-inset-bottom,0px)+16px)] transition-all",
                 isNexus ? "bg-black border-white/5" : "bg-background border-border"
              )}>
                <div className={cn(
                  "p-1.5 rounded-2xl relative overflow-hidden group transition-all border",
                  isNexus ? "bg-white/5 border-white/10" : "bg-muted/40 border-border"
                )}>
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={isNexus ? "ENTER COMMAND..." : "Ask anything..."}
                    className="w-full bg-transparent border-none focus:ring-0 text-sm py-3 px-4 resize-none max-h-32 min-h-12 placeholder:opacity-30"
                    rows={1}
                  />
                  <div className="flex items-center justify-between px-2 pb-1">
                    <div className="flex items-center gap-1">
                      <button className="p-2 opacity-30 hover:opacity-100 transition-opacity"><Mic className="w-4 h-4" /></button>
                    </div>
                    <button 
                      onClick={handleSend}
                      disabled={!input.trim() || isLoading}
                      className={cn(
                        "w-10 h-10 flex items-center justify-center rounded-xl transition-all disabled:opacity-20",
                        isNexus ? "bg-cyan-500 text-black" : "bg-primary text-white"
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

