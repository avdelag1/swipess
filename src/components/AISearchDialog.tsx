import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight, User, LogIn } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  const { theme } = useTheme();
  const isDark = theme !== 'white-matte';

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
    { icon: Home, label: 'Properties', text: 'Show me apartments to rent', color: 'text-blue-400', bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?', color: 'text-pink-400', bg: isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200' },
    { icon: Zap, label: 'Tokens', text: 'How do tokens work?', color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat?', color: 'text-emerald-400', bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
  ], [isDark]);

  const applyQuickPrompt = (text: string) => {
    setQuery(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn("sm:max-w-[400px] w-[calc(100%-16px)] max-h-[80vh] border p-0 overflow-hidden rounded-[2rem] shadow-2xl outline-none [&]:top-[55%] !flex !flex-col !gap-0", isDark ? "bg-[#0e0e11] border-white/10" : "bg-white border-gray-200")}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className={cn("relative px-5 py-4 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-200")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-[1rem] flex items-center justify-center shadow-lg relative overflow-hidden group border",
              isDark ? "bg-zinc-800 border-white/15" : "bg-orange-50 border-orange-200"
            )}>
              <Sparkles className="w-5 h-5 text-orange-400 relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-amber-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div>
              <h2 className={cn("font-black text-base tracking-tight leading-none mb-0.5", isDark ? "text-white" : "text-gray-900")}>AI Assistant</h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                <p className={cn("text-[10px] font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400")}>Personal Concierge</p>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={cn("h-9 w-9 rounded-full transition-colors border", isDark ? "hover:bg-white/15 border-white/15 text-white/80 hover:text-white" : "hover:bg-gray-100 border-gray-200 text-gray-600 hover:text-gray-900")}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6 scroll-smooth scrollbar-none relative"
        >
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-6 py-10"
            >
              <div className={cn(
                "w-20 h-20 mx-auto rounded-[2.2rem] flex items-center justify-center shadow-xl border",
                isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8"
              )}>
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
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border",
                    message.role === 'ai'
                      ? (isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8")
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
                    "max-w-[85%] px-4 py-3 rounded-[1.5rem] text-xs font-semibold leading-relaxed shadow-sm",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-orange-500 to-amber-600 text-white rounded-tr-sm"
                      : cn(
                        "rounded-tl-sm border backdrop-blur-xl",
                        isDark ? "bg-zinc-900/50 border-white/5 text-foreground" : "bg-gray-50 border-black/5 text-gray-800 shadow-sm"
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
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center border",
                isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8"
              )}>
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
          <div className="px-5 pb-3">
            <p className={cn("text-[10px] font-bold uppercase tracking-wider mb-2", isDark ? "text-white/35" : "text-gray-400")}>Quick prompts</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt.text)}
                  className={cn("flex items-center gap-1.5 px-3 py-2 text-[11px] rounded-xl transition-all font-bold border", prompt.bg)}
                >
                  <prompt.icon className={cn("w-3.5 h-3.5", prompt.color)} />
                  <span className={isDark ? "text-white/80" : "text-gray-700"}>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 sm:p-5 mt-auto border-t border-border bg-background/80 backdrop-blur-xl">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Message your assistant..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className={cn("pr-20 h-12 rounded-2xl focus:ring-1 focus:border-orange-500/40 font-bold", isDark ? "bg-muted border-border text-foreground placeholder:text-muted-foreground" : "bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400 shadow-inner")}
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
