import { useState, useRef, useEffect, useCallback, memo } from 'react';
import { X, Send, Trash2, Copy, Sparkles, RefreshCw, Plus, Menu, ChevronLeft, Square, Globe, Flame } from 'lucide-react';
import { SwipessLogo } from '@/components/SwipessLogo';
import { Button } from '@/components/ui/button';
import { useConciergeAI, ChatMessage, Conversation, AiCharacter } from '@/hooks/useConciergeAI';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Progress } from '@/components/ui/progress';
import ReactMarkdown from 'react-markdown';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

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

/* ─── Message Bubble ─── */
const MessageBubble = memo(({ message, onCopy, onResend, onTranslate, isUser }: {
  message: ChatMessage;
  onCopy: () => void;
  onResend?: () => void;
  onTranslate?: (lang: string) => void;
  isUser: boolean;
}) => (
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
            <ReactMarkdown>{message.content}</ReactMarkdown>
          </div>
        )}
      </div>

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
));
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

  const isKyle = activeCharacter === 'kyle';
  const isBeauGosse = activeCharacter === 'beaugosse';

  const toggleCharacter = () => {
    const order: AiCharacter[] = ['default', 'kyle', 'beaugosse'];
    const idx = order.indexOf(activeCharacter);
    const next = order[(idx + 1) % order.length];
    setActiveCharacter(next);
    if (next === 'kyle') toast("Kyle activated. Bro... you know what I mean? 🔥");
    else if (next === 'beaugosse') toast("The Beau Gosse activated. Let's make this interesting... ✨");
    else toast("Back to default concierge ✨");
  };

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

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
                    isKyle && "bg-orange-500/20 text-orange-400 shadow-[0_0_12px_rgba(251,146,60,0.3)]",
                    isBeauGosse && "bg-purple-500/20 text-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.3)]"
                  )}
                  onClick={toggleCharacter}
                  title={isKyle ? 'Switch to Beau Gosse' : isBeauGosse ? 'Switch to Default' : 'Switch to Kyle'}
                >
                  {isBeauGosse ? (
                    <Sparkles className="w-4 h-4 text-purple-400" />
                  ) : (
                    <Flame className={cn("w-4 h-4", isKyle ? "text-orange-400" : "text-muted-foreground")} />
                  )}
                </Button>
                <HeaderIcon isLoading={isLoading} />
                <div>
                  {isKyle ? (
                    <p className="text-sm font-bold text-orange-400">Kyle</p>
                  ) : isBeauGosse ? (
                    <p className="text-sm font-bold text-purple-400">The Beau Gosse</p>
                  ) : (
                    <SwipessLogo size="xs" variant="gradient" />
                  )}
                  <p className="text-[11px] text-muted-foreground">
                    {isLoading ? 'Thinking…' : isKyle ? 'Boston Hustler 🔥' : isBeauGosse ? 'El Guapo ✨' : 'Your Tulum concierge'}
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
            {/* Ego Meter */}
            <AnimatePresence>
              {(isKyle || isBeauGosse) && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.2 }}
                  className="px-4 pb-2 overflow-hidden"
                >
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground font-medium whitespace-nowrap">
                      {isBeauGosse ? 'CHARM' : 'EGO'}
                    </span>
                    <div className="flex-1 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{
                          width: `${egoLevel * 10}%`,
                          background: isBeauGosse
                            ? (egoLevel <= 3
                              ? 'hsl(210, 80%, 60%)'
                              : egoLevel <= 6
                                ? 'hsl(270, 70%, 60%)'
                                : 'hsl(330, 70%, 60%)')
                            : (egoLevel <= 3
                              ? 'hsl(210, 80%, 60%)'
                              : egoLevel <= 6
                                ? 'hsl(30, 90%, 55%)'
                                : 'hsl(0, 80%, 55%)'),
                          boxShadow: isBeauGosse
                            ? (egoLevel > 6
                              ? '0 0 8px hsla(330, 70%, 60%, 0.5)'
                              : egoLevel > 3
                                ? '0 0 6px hsla(270, 70%, 60%, 0.4)'
                                : 'none')
                            : (egoLevel > 6
                              ? '0 0 8px hsla(0, 80%, 55%, 0.5)'
                              : egoLevel > 3
                                ? '0 0 6px hsla(30, 90%, 55%, 0.4)'
                                : 'none'),
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
              />
            ))}

            {isLoading && messages[messages.length - 1]?.role !== 'assistant' && <TypingIndicator />}
          </div>

          {/* Input */}
          <div className="border-t border-border/50 bg-background/95 backdrop-blur-xl px-4 py-3 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
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
