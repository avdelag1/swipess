import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useClientProfile } from '@/hooks/useClientProfile';

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

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();

  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  // Auto-focus input and add welcome message when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);

      // Add welcome message if chat is empty
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
      // Small delay on cleanup for smooth exit transition
      const timer = setTimeout(() => {
        setMessages([]);
        setQuery('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || isSearching) return;

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

      if (fnError) throw fnError;

      const responseContent = data?.result?.text || data?.result?.message || String(data?.result || '');
      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: responseContent,
        timestamp: Date.now(),
        showAction: false,
      }]);
    } catch (error) {
      setIsTyping(false);
      console.error('AI search error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: "I'm having a brief moment of silence while I reconnect with my data sources. 💎✨\n\nPlease try again in a moment.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, messages]);

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
    { icon: Home, label: 'Properties', text: 'Show me apartments to rent' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?' },
    { icon: Zap, label: 'Tokens', text: 'How do tokens work?' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat?' },
  ], []);

  const applyQuickPrompt = (text: string) => {
    setQuery(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-[400px] w-full max-h-[80vh] sm:max-h-[75vh] bg-background dark:bg-[#0e0e11] border border-white/10 dark:border-white/5 p-0 overflow-hidden rounded-[2rem] shadow-2xl outline-none [&]:top-[55%]"
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="relative px-5 py-3.5 border-b border-white/5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(255,255,255,0.05), rgba(0,0,0,0.02))' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-[1rem] flex items-center justify-center shadow-lg bg-zinc-900 border border-white/10 relative overflow-hidden group">
              <Sparkles className="w-5 h-5 text-orange-400 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div>
              <h2 className="text-foreground font-black text-sm tracking-tight leading-none mb-0.5">Swipess AI</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-green-500 animate-pulse" />
                <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Personal Concierge</p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4 text-foreground/60" />
          </Button>
        </div>

        {/* Messages Area */}
        <div 
          className="flex-1 overflow-y-auto px-5 py-5 space-y-6 scroll-smooth scrollbar-none relative" 
          style={{ 
            height: 'min(60vh, 450px)', 
            minHeight: '300px',
            maxHeight: 'calc(85vh - 200px)',
            overflowY: 'auto'
          }}
        >
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-10"
            >
              <div className="w-20 h-20 mx-auto rounded-[2.2rem] flex items-center justify-center shadow-xl bg-zinc-900 border border-white/10">
                <Sparkles className="w-10 h-10 text-orange-400" />
              </div>
              <p className="text-muted-foreground text-sm font-bold">Connecting to Oracle...</p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout" initial={false}>
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex flex-col gap-2", message.role === 'user' && "items-end")}
              >
                <div className={cn("flex gap-2.5", message.role === 'user' && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm",
                    message.role === 'ai' ? "bg-zinc-900 border border-white/10" : "bg-muted dark:bg-white/10 border border-border dark:border-white/5"
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
                    "max-w-[85%] px-4 py-3 rounded-[1.5rem] text-xs font-semibold leading-relaxed shadow-sm",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-sm"
                      : "bg-muted/80 dark:bg-zinc-900/50 text-foreground rounded-tl-sm border border-border dark:border-white/5 backdrop-blur-xl"
                  )}>
                    {message.content}
                  </div>
                </div>

                {message.role === 'ai' && message.showAction && message.actionRoute && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(message.actionRoute)}
                    className="flex items-center gap-2 px-6 h-10 rounded-full text-white shadow-lg ml-12 uppercase tracking-widest text-[10px]"
                    style={{ background: 'linear-gradient(135deg, #E4007C, #C4006C)' }}
                  >
                    {message.actionLabel || 'View'}
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pl-2">
              <div className="w-10 h-10 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-orange-400 animate-pulse" />
              </div>
              <div className="bg-muted px-4 py-3 rounded-[1.5rem] rounded-tl-sm text-xs font-bold text-muted-foreground flex items-center gap-2">
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Suggestions */}
        {messages.length > 0 && messages[messages.length - 1].role === 'ai' && !isSearching && !isTyping && (
          <div className="px-6 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-[10px] bg-muted dark:bg-white/5 border border-border dark:border-white/10 rounded-full text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-all font-bold uppercase tracking-wider"
                >
                  <prompt.icon className="w-3 h-3 text-orange-500" />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 sm:p-5 mt-auto border-t border-border dark:border-white/5 bg-background/80 dark:bg-[#0e0e10]/80 backdrop-blur-xl">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Message your assistant..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-20 h-12 bg-muted dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/35 rounded-2xl focus:ring-1 focus:border-orange-500/40 font-bold"
              disabled={isSearching}
            />

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!query.trim() || isSearching}
              className="absolute right-1 top-1 bottom-1 rounded-xl px-4 h-auto text-white"
              style={query.trim() ? { background: 'linear-gradient(135deg, #ec4899, #f97316)' } : { background: 'rgba(255,255,255,0.08)' }}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
