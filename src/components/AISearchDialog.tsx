import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useClientProfile } from '@/hooks/useClientProfile';
import { useTheme } from '@/hooks/useTheme';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'sonner';

interface AISearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'client' | 'owner';
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  showAction?: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

const dialogMotion = {
  hidden: { opacity: 0, y: 60, scale: 0.92 },
  visible: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring', stiffness: 380, damping: 30, mass: 0.8 } },
  exit: { opacity: 0, y: 40, scale: 0.95, transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } },
};

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150);
      if (messages.length === 0) {
        setIsTyping(true);
        const timer = setTimeout(() => {
          setIsTyping(false);
          setMessages([{
            role: 'ai',
            content: "Welcome to Swipess! ✨ I'm your Personal Assistant. I can help you find your dream property, discover new connections, or explain how our token system works.\n\nWhat's on your mind today?",
            timestamp: Date.now()
          }]);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else {
      const timer = setTimeout(() => {
        setMessages([]);
        setQuery('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    if (!user) {
      toast.error('Please sign in to use the AI assistant');
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "You need to sign in first to chat with me. Please log in and try again! 🔐",
        timestamp: Date.now()
      }]);
      return;
    }

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            messages: [
              ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
              { role: 'user', content: userMessage }
            ]
          }
        }
      });

      if (fnError) {
        const errMsg = fnError.message || '';
        if (errMsg.includes('401') || errMsg.includes('Unauthorized')) {
          throw new Error('Session expired. Please sign in again.');
        } else if (errMsg.includes('429') || errMsg.includes('rate limit')) {
          throw new Error('Too many requests — please wait a moment and try again.');
        } else if (errMsg.includes('402')) {
          throw new Error('AI credits exhausted. Please add funds.');
        } else {
          throw new Error(errMsg || 'Connection failed');
        }
      }

      if (data?.error) throw new Error(data.error);

      const responseContent = data?.result?.text || data?.result?.message || String(data?.result || '');
      if (!responseContent) throw new Error('AI returned an empty response. Please try again.');

      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: responseContent,
        timestamp: Date.now(),
        showAction: false,
      }]);
    } catch (error) {
      setIsTyping(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `⚠️ ${errorMessage}\n\nPlease try again.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, messages, user]);

  const handleClose = useCallback(() => {
    onClose();
    setIsSearching(false);
    setIsTyping(false);
  }, [onClose]);

  const handleAction = useCallback((route?: string) => {
    if (route) {
      navigate(route);
      handleClose();
    }
  }, [navigate, handleClose]);

  const quickPrompts = useMemo(() => [
    { icon: Home, label: 'Properties', text: 'Show me apartments to rent', color: 'text-blue-400', bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?', color: 'text-pink-400', bg: isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200' },
    { icon: Zap, label: 'Tokens', text: 'How do tokens work?', color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat?', color: 'text-emerald-400', bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
  ], [isDark]);

  const applyQuickPrompt = (text: string) => {
    setQuery(text);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[420px] w-[calc(100%-16px)] max-h-[82vh] border p-0 overflow-hidden rounded-[2rem] shadow-2xl outline-none !flex !flex-col !gap-0",
          isDark ? "bg-background border-border" : "bg-white border-gray-200/80"
        )}
        hideCloseButton={true}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={dialogMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full max-h-[82vh]"
            >
              {/* Header with frost shimmer */}
              <div className={cn(
                "relative px-5 py-4 border-b flex items-center justify-between overflow-hidden",
                isDark ? "border-border" : "border-gray-100"
              )}>
                {/* Subtle shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/[0.03] to-transparent animate-shimmer pointer-events-none" />
                
                <div className="flex items-center gap-3 relative z-10">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shadow-lg relative overflow-hidden group border",
                    isDark ? "bg-muted border-border" : "bg-orange-50 border-orange-100"
                  )}>
                    {/* Ambient glow */}
                    <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/10 rounded-2xl blur-sm" />
                    <Sparkles className="w-5 h-5 text-orange-400 relative z-10" />
                  </div>

                  <div>
                    <h2 className="font-bold text-base tracking-tight leading-none mb-0.5 text-foreground">AI Assistant</h2>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                      <p className="text-[10px] font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400">Personal Concierge</p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className={cn(
                    "h-9 w-9 rounded-xl transition-colors border relative z-10",
                    isDark ? "hover:bg-muted border-border text-muted-foreground hover:text-foreground" : "hover:bg-gray-100 border-gray-200 text-gray-500 hover:text-gray-900"
                  )}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* Messages Area */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth scrollbar-none relative">
                {messages.length === 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-6 py-10"
                  >
                    <div className={cn(
                      "w-20 h-20 mx-auto rounded-[2rem] flex items-center justify-center shadow-xl border relative overflow-hidden",
                      isDark ? "bg-muted border-border" : "bg-gray-50 border-gray-200"
                    )}>
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/15 to-amber-500/10 rounded-[2rem]" />
                      <Sparkles className="w-10 h-10 text-orange-400 relative z-10" />
                    </div>
                    <p className="text-muted-foreground text-sm font-semibold">Connecting to Oracle...</p>
                  </motion.div>
                )}

                <AnimatePresence mode="popLayout" initial={false}>
                  {messages.map((message) => (
                    <motion.div
                      key={message.timestamp}
                      initial={{ opacity: 0, y: 16, scale: 0.96 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ type: 'spring', stiffness: 400, damping: 28 }}
                      className={cn("flex flex-col gap-2", message.role === 'user' && "items-end")}
                    >
                      <div className={cn("flex gap-2.5", message.role === 'user' && "flex-row-reverse")}>
                        <div className={cn(
                          "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border",
                          message.role === 'ai'
                            ? (isDark ? "bg-muted border-border" : "bg-gray-50 border-gray-200")
                            : "bg-muted border-border"
                        )}>
                          {message.role === 'ai' ? (
                            <Sparkles className="w-4 h-4 text-orange-400" />
                          ) : (
                            userAvatar ? (
                              <img src={userAvatar} alt="Me" className="w-full h-full object-cover rounded-xl" />
                            ) : (
                              <User className="w-4 h-4 text-muted-foreground" />
                            )
                          )}
                        </div>

                        <div className={cn(
                          "max-w-[85%] px-4 py-3 text-[13px] font-medium leading-relaxed",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-[1.25rem] rounded-tr-md shadow-lg shadow-orange-500/15"
                            : cn(
                              "rounded-[1.25rem] rounded-tl-md border",
                              isDark ? "bg-muted/60 border-border text-foreground" : "bg-gray-50 border-gray-100 text-gray-800 shadow-sm"
                            )
                        )}>
                          {message.content}
                        </div>
                      </div>

                      {message.role === 'ai' && message.showAction && message.actionRoute && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(message.actionRoute)}
                          className="flex items-center gap-2 px-6 h-10 rounded-full text-white shadow-lg ml-12 uppercase tracking-widest text-[10px]"
                          style={{ background: 'linear-gradient(135deg, var(--color-brand-accent-2), #C4006C)' }}
                        >
                          {message.actionLabel || 'View'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 pl-1">
                    <div className={cn(
                      "w-8 h-8 rounded-xl flex items-center justify-center border",
                      isDark ? "bg-muted border-border" : "bg-gray-50 border-gray-200"
                    )}>
                      <Sparkles className="w-4 h-4 text-orange-400 animate-pulse" />
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-[1.25rem] rounded-tl-md text-xs font-semibold flex items-center gap-2 border",
                      isDark ? "bg-muted/60 border-border text-muted-foreground" : "bg-gray-50 border-gray-100 text-gray-500"
                    )}>
                      <div className="flex gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:150ms]" />
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:300ms]" />
                      </div>
                      <span>Thinking</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Suggestions */}
              {messages.length > 0 && messages[messages.length - 1].role === 'ai' && !isSearching && !isTyping && (
                <div className="px-5 pb-3">
                  <p className="text-[10px] font-bold uppercase tracking-wider mb-2 text-muted-foreground/50">Quick prompts</p>
                  <div className="flex flex-wrap gap-1.5">
                    {quickPrompts.map((prompt, index) => (
                      <motion.button
                        key={index}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => applyQuickPrompt(prompt.text)}
                        className={cn("flex items-center gap-1.5 px-3 py-2 text-[11px] rounded-xl transition-all font-semibold border", prompt.bg)}
                      >
                        <prompt.icon className={cn("w-3.5 h-3.5", prompt.color)} />
                        <span className={isDark ? "text-foreground/80" : "text-gray-700"}>{prompt.label}</span>
                      </motion.button>
                    ))}
                  </div>
                </div>
              )}

              {/* Frosted Glass Input Area */}
              <div className={cn(
                "p-4 mt-auto border-t relative",
                isDark ? "border-border bg-background/90 backdrop-blur-2xl" : "border-gray-100 bg-white/95 backdrop-blur-2xl"
              )}>
                <div className={cn(
                  "relative rounded-2xl border overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-primary/20",
                  isDark
                    ? "bg-muted/50 border-border focus-within:border-primary/40"
                    : "bg-gray-50 border-gray-200 focus-within:border-orange-300 shadow-inner"
                )}>
                  <textarea
                    ref={inputRef}
                    placeholder="Message your assistant..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className={cn(
                      "w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm font-medium outline-none placeholder:text-muted-foreground/60",
                      "min-h-[48px] max-h-[120px]",
                      isDark ? "text-foreground" : "text-gray-900"
                    )}
                    disabled={isSearching}
                    style={{ fieldSizing: 'content' } as any}
                  />

                  <Button
                    size="sm"
                    onClick={handleSend}
                    disabled={!query.trim() || isSearching}
                    className={cn(
                      "absolute right-2 bottom-2 rounded-xl h-8 w-8 p-0 transition-all duration-200",
                      query.trim()
                        ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white shadow-lg shadow-orange-500/20 hover:shadow-orange-500/30"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
