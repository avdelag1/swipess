import { useState, useRef, useEffect, memo } from 'react';
import { X, Send, Trash2, Copy, Sparkles, RefreshCw, Plus, Menu, ChevronLeft, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useConciergeAI, ChatMessage, Conversation } from '@/hooks/useConciergeAI';
import { toast } from '@/components/ui/sonner';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import ReactMarkdown from 'react-markdown';

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
}

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
const MessageBubble = memo(({ message, onCopy, onResend, isUser }: {
  message: ChatMessage;
  onCopy: () => void;
  onResend?: () => void;
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

      {/* Action bar */}
      <div className={cn(
        'flex items-center gap-1 mt-1 opacity-0 group-hover:opacity-100 transition-opacity',
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
      </div>
    </div>
  </div>
));
MessageBubble.displayName = 'MessageBubble';

/* ─── Typing Indicator ─── */
const TypingIndicator = () => (
  <div className="flex justify-start mb-3">
    <div className="bg-muted/80 border border-border/30 px-4 py-3 rounded-2xl rounded-bl-md">
      <div className="flex gap-1.5 items-center h-4">
        {[0, 1, 2].map(i => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-muted-foreground/60"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </div>
  </div>
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
  } = useConciergeAI();

  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 300);
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
          <div className="flex items-center justify-between px-4 py-3 border-b border-border/50 bg-background/95 backdrop-blur-xl relative z-10">
            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="w-8 h-8 rounded-full" onClick={() => setSidebarOpen(!sidebarOpen)}>
                <Menu className="w-4 h-4" />
              </Button>
              <div className="w-9 h-9 rounded-full bg-primary/15 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h2 className="text-sm font-semibold text-foreground">SwipesS AI</h2>
                <p className="text-[11px] text-muted-foreground">Your Lisbon concierge</p>
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

          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
            {messages.length === 0 && !isLoading && (
              <div className="flex flex-col items-center justify-center h-full text-center px-6">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Sparkles className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">Welcome to SwipesS AI</h3>
                <p className="text-sm text-muted-foreground max-w-xs leading-relaxed">
                  Ask me about apartments in Lisbon, neighborhood tips, visa info, cost of living, or anything about your search.
                </p>
                <div className="flex flex-wrap gap-2 mt-6 justify-center">
                  {[
                    'Best neighborhoods for expats?',
                    'Average rent in Principe Real?',
                    'Tips for apartment hunting',
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
