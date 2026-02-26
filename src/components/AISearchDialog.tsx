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

// Hardcoded response logic removed in favor of real Minimax AI integration.

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  // Fix: Fallback chain for avatar - client profile images → avatar_url → null
  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset when closed
      setMessages([]);
      setQuery('');
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      // Execute real AI call via Edge Function
      const currentConversation = [
        ...messages.map(m => ({ role: m.role === 'ai' ? 'assistant' : 'user', content: m.content })),
        { role: 'user', content: userMessage }
      ];

      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            messages: currentConversation
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
        content: "The Swipess Oracle is currently meditating in the high mountains of Chiapas. 🌸✨\n\nPlease try again in a heartbeat, and I'll be back with my full wisdom.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, messages]);


  // Fix: Declare handleClose before handleAction to avoid reference-before-declaration
  const handleClose = useCallback(() => {
    onClose();
    setQuery('');
    setMessages([]);
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
    { icon: Home, label: 'Browse', text: 'Show me apartments to rent' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?' },
    { icon: Zap, label: 'Tokens', text: 'What are tokens?' },
    { icon: MessageCircle, label: 'Help', text: 'How does Swipess work?' },
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
        className="fixed z-[10010] flex flex-col !w-[100vw] sm:!w-[500px] !max-w-none !left-0 sm:!left-[50%] !bottom-0 sm:!bottom-auto !top-auto sm:!top-[50%] !translate-x-0 sm:!-translate-x-1/2 !translate-y-0 sm:!-translate-y-1/2 !mt-auto h-[90dvh] sm:h-[85vh] sm:max-h-[800px] !p-0 !gap-0 !rounded-b-none sm:!rounded-b-[2.5rem] !rounded-t-[2.5rem] !border-x-0 !border-b-0 sm:!border border-border dark:border-white/10 bg-background/95 dark:bg-zinc-950/95 backdrop-blur-3xl shadow-[0_-20px_60px_-15px_rgba(228,0,124,0.15)] outline-none overflow-hidden"
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="relative px-6 py-6 border-b border-border dark:border-white/5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(228,0,124,0.15), rgba(245,222,179,0.05))' }}>
          <div className="flex items-center gap-4">
            {/* AI Avatar */}
            <div className="w-12 h-12 rounded-[1.5rem] flex items-center justify-center shadow-lg" style={{ background: 'linear-gradient(135deg, #E4007C, #F5DEB3)' }}>
              <Sparkles className="w-6 h-6 text-white" />
            </div>

            <div>
              <h2 className="text-foreground font-black text-lg tracking-tight">Swipess AI</h2>
              <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground opacity-60">Personal Assistant</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-10 w-10 rounded-full hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5 text-foreground/60" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6 space-y-6 scrollbar-none relative w-full overflow-x-hidden">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20, filter: 'blur(10px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              className="text-center space-y-6 py-8"
            >
              <div className="w-20 h-20 mx-auto rounded-[2.2rem] flex items-center justify-center shadow-xl" style={{ background: 'linear-gradient(135deg, rgba(228,0,124,0.1), rgba(245,222,179,0.1))' }}>
                <Sparkles className="w-10 h-10" style={{ color: '#E4007C' }} />
              </div>
              <div>
                <h3 className="text-foreground font-black text-2xl tracking-tighter">Swipess Oracle</h3>
                <p className="text-muted-foreground text-sm font-bold mt-2">The app expert is listening. What's on your mind?</p>
              </div>

              {/* Quick prompts - HIGH CONTRAST */}
              <div className="grid grid-cols-1 gap-3 pt-4 px-4">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickPrompt(prompt.text)}
                    className="flex items-center gap-4 px-5 py-4 text-sm font-bold bg-muted/50 hover:bg-muted dark:bg-zinc-900/50 dark:hover:bg-zinc-800 border border-border dark:border-white/5 rounded-2xl text-foreground dark:text-zinc-100 transition-all text-left shadow-lg group active:scale-95"
                  >
                    <div className="w-10 h-10 rounded-xl bg-background/50 dark:bg-zinc-800/50 flex items-center justify-center group-hover:bg-[#E4007C]/20 transition-colors">
                      <prompt.icon className="w-5 h-5 text-[#E4007C]" />
                    </div>
                    <span className="flex-1 leading-tight">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 20, scale: 0.9, filter: 'blur(10px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                className={cn(
                  "flex flex-col gap-2",
                  message.role === 'user' && "items-end"
                )}
              >
                <div className={cn(
                  "flex gap-3",
                  message.role === 'user' && "flex-row-reverse"
                )}>
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 mt-1 shadow-md transition-transform duration-500",
                    message.role === 'ai' ? "bg-gradient-to-br from-[#E4007C] to-[#F5DEB3]" : "bg-muted dark:bg-white/10 border border-border dark:border-white/5"
                  )}>
                    {message.role === 'ai' ? (
                      <Sparkles className="w-5 h-5 text-white" />
                    ) : (
                      userAvatar ? (
                        <img src={userAvatar} alt="Me" className="w-full h-full object-cover rounded-2xl" />
                      ) : (
                        <User className="w-5 h-5 text-muted-foreground" />
                      )
                    )}
                  </div>

                  <div className={cn(
                    "max-w-[85%] px-5 py-4 rounded-[2rem] text-sm font-bold leading-relaxed shadow-sm",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-[#E4007C] to-[#C4006C] text-white rounded-tr-sm"
                      : "bg-muted/80 dark:bg-white/10 text-foreground rounded-tl-sm border border-border dark:border-white/5 backdrop-blur-xl"
                  )}
                  >
                    {message.content}
                  </div>
                </div>

                {/* Action button if available */}
                {message.role === 'ai' && message.showAction && message.actionRoute && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAction(message.actionRoute)}
                    className="flex items-center gap-2 px-6 py-3 text-xs font-black rounded-full text-white shadow-[0_10px_20px_rgba(228,0,124,0.3)] transition-all ml-12 uppercase tracking-widest"
                    style={{ background: 'linear-gradient(135deg, #E4007C, #C4006C)' }}
                  >
                    {message.actionLabel || 'View'}
                    <ArrowRight className="w-4 h-4" />
                  </motion.button>
                )}
              </motion.div>
            ))}
          </AnimatePresence>


          {isTyping && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-muted-foreground text-xs pl-8"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              AI is thinking...
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action buttons (appear after first message) */}
        {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-muted hover:bg-muted/80 dark:bg-white/5 dark:hover:bg-white/10 border border-border dark:border-white/10 rounded-full text-muted-foreground hover:text-foreground dark:text-white/70 dark:hover:text-white transition-all"
                >
                  <prompt.icon className="w-3 h-3" style={{ color: '#f97316' }} />
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
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-20 h-11 bg-muted dark:bg-white/5 border-border dark:border-white/10 text-foreground dark:text-white placeholder:text-muted-foreground dark:placeholder:text-white/35 rounded-2xl focus:ring-1 focus:border-orange-500/40"
              disabled={isSearching}
            />

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!query.trim() || isSearching}
              className="absolute right-1 top-1 bottom-1 rounded-xl px-4 h-auto text-white"
              style={query.trim() ? { background: 'linear-gradient(135deg, #ec4899, #f97316)' } : { background: 'rgba(255,255,255,0.08)' }}
            >
              {isSearching ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Send className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
