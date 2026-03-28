import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { cn } from '@/lib/utils';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useTheme } from '@/hooks/useTheme';
import { SwipessLogo } from './SwipessLogo';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AISearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'client' | 'owner';
}

interface Message {
  role: 'user' | 'ai' | 'system';
  content: string;
  timestamp: number;
  showAction?: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

interface ChatSession {
  id: string;
  messages: Message[];
  title: string;
  timestamp: number;
}

const MAX_MESSAGES = 20;
const MAX_HISTORY = 10;
const STORAGE_SESSIONS_KEY = (userId: string) => `Swipess_sessions_${userId}`;

// ────────────────────────────────────────────────────────────────────────────
export function AISearchDialog({ isOpen, onClose, userRole: _userRole = 'client' }: AISearchDialogProps) {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [view, setView] = useState<'chat' | 'history'>('chat');
  const [isTyping, setIsTyping] = useState(false);
  
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  // Hydrate sessions on mount
  useEffect(() => {
    if (!user || !isOpen) return;
    
    const stored = localStorage.getItem(STORAGE_SESSIONS_KEY(user.id));
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as ChatSession[];
        setSessions(parsed.sort((a, b) => b.timestamp - a.timestamp));
      } catch (err) {
        console.warn('[Concierge] History hydration failed:', err);
      }
    }
  }, [user, isOpen]);

  // Handle initial greeting or restore active session
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      // Auto-focus input
      setTimeout(() => inputRef.current?.focus(), 300);

      // If no current session, start one
      if (!currentSessionId) {
        const welcome: Message = {
          role: 'ai',
          content: "Welcome. I am the Swipess Concierge — your sharp, market-savvy guide to Tulum. ✨\n\nI can help you find your dream space, refine your listing, or answer local secrets.\n\nWhat's on your mind today?",
          timestamp: Date.now()
        };
        setMessages([welcome]);
        setCurrentSessionId(Math.random().toString(36).substring(7));
      }

      // Pre-warm the edge function
      supabase.functions.invoke('ai-orchestrator', { body: { task: 'ping' } }).catch(() => {});
    }
  }, [isOpen, messages.length, currentSessionId]);

  // Auto-scroll
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  // Persistence: Save sessions to localStorage
  useEffect(() => {
    if (!user || !currentSessionId || messages.length === 0) return;

    const currentTitle = messages.find(m => m.role === 'user')?.content.substring(0, 30) || 'New Conversation';
    
    setSessions(prev => {
      const otherSessions = prev.filter(s => s.id !== currentSessionId);
      const updatedSessions = [
        { id: currentSessionId, messages, title: currentTitle, timestamp: Date.now() },
        ...otherSessions
      ].slice(0, MAX_HISTORY);
      
      localStorage.setItem(STORAGE_SESSIONS_KEY(user.id), JSON.stringify(updatedSessions));
      return updatedSessions;
    });
  }, [messages, currentSessionId, user]);

  const startNewChat = useCallback(() => {
    // Collect context from previous session (last 10 messages) if any
    const prevContext = messages.length > 0 ? messages.slice(-10) : [];
    
    setMessages([{
      role: 'system',
      content: `CONTEXT FROM PREVIOUS SESSION: ${prevContext.map(m => `[${m.role}] ${m.content}`).join(' | ')}`,
      timestamp: Date.now()
    }, {
      role: 'ai',
      content: "Chat limit reached. I've archived our previous conversation and refreshed my memory. I'm ready to continue — what's next? 🚀",
      timestamp: Date.now()
    }]);
    setCurrentSessionId(Math.random().toString(36).substring(7));
    setView('chat');
  }, [messages]);

  const handleSend = useCallback(async () => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery || isSearching || isTyping) return;
    
    // Check limit (only user + ai pairs, ignoring system messages)
    const interactionCount = messages.filter(m => m.role !== 'system').length;
    if (interactionCount >= MAX_MESSAGES) {
      toast.error('Session limit reached. Please start a new chat.');
      return;
    }

    if (!user) {
      toast.error('Please sign in to use the Concierge');
      return;
    }

    // LOCK IMMEDIATELY to prevent double sends
    setIsSearching(true);
    setIsTyping(true);
    setQuery('');

    const userMessage: Message = { role: 'user', content: trimmedQuery, timestamp: Date.now() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Session expired');

      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, interests, lifestyle_tags')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || user.user_metadata?.full_name || 'Friend';
      
      // Sanitize context for API (History + System context if it exists)
      const sanitizedHistory = newMessages
        .slice(-12) // Keep a slightly larger window for better multi-turn
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : (m.role === 'system' ? 'system' : 'user'),
          content: m.content
        }));

      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: trimmedQuery,
            userName,
            messages: sanitizedHistory,
            currentPath: '/ai-search'
          }
        }
      });

      if (funcError) throw funcError;
      if (data?.error) throw new Error(data.error);

      const responseContent = data?.result?.text || data?.result?.message || 'I am focused. Say again?';

      setMessages(prev => [...prev, {
        role: 'ai',
        content: responseContent,
        timestamp: Date.now(),
        showAction: !!data?.result?.action,
        actionLabel: data?.result?.action?.label,
        actionRoute: data?.result?.action?.params?.path || data?.result?.action?.route,
      }]);
    } catch (error) {
      console.error('[Concierge] Error:', error);
      toast.error('Concierge connection disrupted. Re-sending...');
      // Allow retry by not clearing the input if it fails early, but here we already cleared it.
      // So we add a helpful error message instead.
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "⚠️ I encountered a brief disruption in my connection. Could you please repeat that? I've archived our progress so far.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
      setIsTyping(false);
    }
  }, [query, isSearching, isTyping, messages, user]);

  const handleClose = useCallback(() => {
    onClose();
    setIsSearching(false);
    setIsTyping(false);
  }, [onClose]);

  const restoreSession = (session: ChatSession) => {
    setMessages(session.messages);
    setCurrentSessionId(session.id);
    setView('chat');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const interactionCount = messages.filter(m => m.role !== 'system').length;
  const isLimitReached = interactionCount >= MAX_MESSAGES;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn("sm:max-w-[460px] w-[calc(100%-16px)] h-[85vh] max-h-[800px] border p-0 overflow-hidden rounded-[2.8rem] shadow-2xl outline-none [&]:top-[50%] !flex !flex-col !gap-0", isDark ? "bg-[#0e0e11] border-white/10" : "bg-white border-gray-200")}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className={cn("relative px-6 py-5 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-200")}>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setView(view === 'chat' ? 'history' : 'chat')}
              className={cn(
                "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden group border transition-all",
                isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100 shadow-sm"
              )}
            >
              <SwipessLogo size="sm" className="relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500 to-rose-500 opacity-0 group-hover:opacity-20 transition-opacity" />
            </button>

            <div className="flex flex-col">
              <DialogTitle className={cn("font-black text-lg tracking-tight leading-none mb-1", isDark ? "text-white" : "text-gray-900")}>
                {view === 'history' ? 'Conversation Vault' : 'Concierge'}
              </DialogTitle>
              <DialogDescription className="flex items-center gap-2 p-0">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-rose-400">
                  {view === 'history' ? `${sessions.length}/10 Archived` : `${interactionCount}/${MAX_MESSAGES} Messages`}
                </span>
              </DialogDescription>
            </div>
          </div>

          <div className="flex items-center gap-2">
             <Button
                variant="ghost"
                size="icon"
                onClick={handleClose}
                className={cn("h-11 w-11 rounded-full transition-all border shadow-lg active:scale-90", isDark ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/50" : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-500")}
              >
                <X className="h-5 w-5" />
              </Button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-0 flex flex-col relative overflow-hidden">
          <AnimatePresence mode="wait">
            {view === 'history' ? (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="flex-1 overflow-y-auto px-6 py-6 space-y-4"
              >
                {sessions.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-30 italic text-sm">
                    No archived conversations yet.
                  </div>
                ) : (
                  sessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => restoreSession(s)}
                      className={cn(
                        "w-full text-left p-4 rounded-3xl border transition-all flex items-start gap-4 group hover:scale-[1.02] active:scale-[0.98]",
                        isDark ? "bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10" : "bg-gray-50 border-gray-100 hover:bg-gray-100"
                      )}
                    >
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500/20 to-rose-500/20 flex items-center justify-center flex-shrink-0 text-orange-500">
                        <MessageCircle className="w-5 h-5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("font-bold text-sm truncate mb-1", isDark ? "text-white" : "text-gray-900")}>{s.title}</p>
                        <p className="text-[10px] text-muted-foreground font-black uppercase tracking-wider">
                          {new Date(s.timestamp).toLocaleDateString()} • {s.messages.length} messages
                        </p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                    </button>
                  ))
                )}
              </motion.div>
            ) : (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="flex-1 flex flex-col min-h-0"
              >
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 scrollbar-none">
                  {messages.filter(m => m.role !== 'system').map((message, idx) => (
                    <motion.div
                      key={`${message.timestamp}-${idx}`}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn("flex flex-col gap-2", message.role === 'user' && "items-end")}
                    >
                      <div className={cn("flex gap-3", message.role === 'user' && "flex-row-reverse")}>
                        <div className={cn(
                          "w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border",
                          message.role === 'ai'
                            ? (isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8")
                            : "bg-muted border-border"
                        )}>
                          {message.role === 'ai' ? (
                            <SwipessLogo size="xs" />
                          ) : (
                            userAvatar ? (
                              <img src={userAvatar} alt="Me" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )
                          )}
                        </div>

                        <div className={cn(
                          "max-w-[85%] px-5 py-4 text-[14px] font-bold leading-relaxed whitespace-pre-line shadow-xl",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-orange-500 to-rose-500 text-white rounded-[1.5rem] rounded-tr-sm shadow-orange-500/20"
                            : cn(
                                "rounded-[1.5rem] rounded-tl-sm border",
                                isDark ? "bg-zinc-900/80 border-white/10 text-foreground" : "bg-white border-gray-100 text-gray-800 shadow-sm"
                              )
                        )}>
                          {message.content}
                        </div>
                      </div>

                      {message.role === 'ai' && message.showAction && message.actionRoute && (
                        <Button
                          size="sm"
                          onClick={() => { navigate(message.actionRoute!); handleClose(); }}
                          className="flex items-center gap-2 px-6 h-11 rounded-full text-white shadow-lg ml-12 uppercase tracking-widest text-[10px] bg-gradient-to-r from-orange-500 to-rose-500"
                        >
                          {message.actionLabel || 'Explore'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                  
                  {isTyping && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-4 pl-3">
                      <div className={cn(
                        "w-11 h-11 rounded-2xl flex items-center justify-center",
                        isDark ? "bg-zinc-900 border border-white/10" : "bg-gray-100 border border-black/8 shadow-sm"
                      )}>
                        <SwipessLogo size="xs" className="animate-pulse" />
                      </div>
                      <div className="bg-gradient-to-r from-orange-500/5 to-rose-500/5 border border-orange-500/10 px-5 py-4 rounded-[1.8rem] rounded-tl-sm text-xs font-bold text-orange-500 flex items-center gap-2 shadow-sm italic">
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-orange-500" />
                        Concierge is thinking...
                      </div>
                    </motion.div>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                {/* Footer Input Area */}
                <div className={cn("p-5 border-t relative", isDark ? "border-white/5 bg-black/40" : "border-gray-100 bg-gray-50/50")}>
                  {isLimitReached ? (
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                      className="flex flex-col items-center gap-4 py-2"
                    >
                      <p className="text-xs font-black uppercase tracking-widest text-muted-foreground opacity-60">Conversation limit reached</p>
                      <Button 
                        onClick={startNewChat}
                        className="w-full h-14 rounded-2xl bg-gradient-to-r from-orange-500 to-rose-500 text-white font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20"
                      >
                         Refresh & Start New Chat
                      </Button>
                    </motion.div>
                  ) : (
                    <div className={cn(
                      "relative rounded-3xl border transition-all duration-300 group overflow-hidden",
                      isDark 
                        ? "bg-zinc-900 border-white/10 focus-within:border-orange-500/50 focus-within:ring-4 focus-within:ring-orange-500/10" 
                        : "bg-white border-gray-200 focus-within:border-orange-500 shadow-xl"
                    )}>
                      <textarea
                        ref={inputRef}
                        placeholder="Ask the expert..."
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={handleKeyDown}
                        rows={1}
                        disabled={isSearching}
                        className={cn(
                          "w-full resize-none bg-transparent px-6 py-4.5 pr-14 text-sm font-bold outline-none placeholder:text-muted-foreground/40",
                          "min-h-[56px] max-h-[160px]",
                        )}
                      />
                      <Button
                        size="icon"
                        onClick={handleSend}
                        disabled={!query.trim() || isSearching || isTyping}
                        className={cn(
                          "absolute right-2 top-2 h-10 w-10 rounded-[1.1rem] transition-all",
                          query.trim() 
                            ? "bg-gradient-to-r from-orange-500 to-rose-500 text-white shadow-lg active:scale-90" 
                            : "bg-muted text-muted-foreground opacity-50"
                        )}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}
