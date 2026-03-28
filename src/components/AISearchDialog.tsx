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
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  showAction?: boolean;
  actionLabel?: string;
  actionRoute?: string;
}

// ────────────────────────────────────────────────────────────────────────────
export function AISearchDialog({ isOpen, onClose, userRole: _userRole = 'client' }: AISearchDialogProps) {
  const { user } = useAuth();
  const { navigate } = useAppNavigate();
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

  const storageKey = user ? `Swipess_vibe_search_${user.id}` : null;

  // Persistence: Hydrate on mount/open
  useEffect(() => {
    if (!isOpen || !storageKey) return;
    
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) {
        setMessages(JSON.parse(stored));
      }
    } catch (err) {
      console.warn('[Vibe Search] Hydration failed:', err);
    }
  }, [isOpen, storageKey]);

  // Persistence: Save on change — limit to 20 for history depth
  useEffect(() => {
    if (!storageKey || messages.length === 0) return;
    localStorage.setItem(storageKey, JSON.stringify(messages.slice(-20)));
  }, [messages, storageKey]);

  // Fire effects and init
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
      
      // PRE-WARMING: Wake up the edge function for high-performance first response
      supabase.functions.invoke('ai-orchestrator', { body: { task: 'ping' } }).catch(() => {});
      if (messages.length === 0) {
        setIsTyping(true);
        const msgT = setTimeout(() => {
          setIsTyping(false);
          setMessages([{
            role: 'ai',
            content: "Welcome. I am the Swipess Concierge — your sharp, market-savvy guide to Tulum. ✨\n\nI can help you create the perfect listing, find your dream space, or answer any local question.\n\nWhat can I assist you with today?",
            timestamp: Date.now()
          }]);
        }, 1200);
        return () => { clearTimeout(msgT); };
      }
    } else {
      setQuery('');
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isTyping, isOpen]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    if (!user) {
      toast.error('Please sign in to use the Swipess Concierge');
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
      // Pre-flight auth check — verify session token exists
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error('Session expired. Please sign in again.');
        throw new Error('Not authenticated');
      }

      // Fetch user profile for deep personalization
      const { data: profile } = await supabase
        .from('profiles')
        .select('full_name, bio, interests, lifestyle_tags')
        .eq('id', user.id)
        .maybeSingle();

      const userName = profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || 'Friend';
      const userTier = (clientProfile as any)?.subscription_tier || 'Basic';

      // LIGHTNING-FAST CONTEXT: Only sync the last 5 messages + dynamic truncation for speed.
      const sanitizedHistory = messages
        .filter(m => !m.content.includes('⚠️') && !m.content.includes('connection lost'))
        .slice(-5)
        .map(m => ({
          role: m.role === 'ai' ? 'assistant' : 'user',
          content: m.content.length > 400 ? m.content.substring(0, 400) + '...' : m.content
        }));

      // Call the AI Orchestrator via Supabase Edge Function with full Vibe context
      const { data, error: funcError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            userName,
            userTier,
            userProfile: {
              bio: profile?.bio,
              interests: profile?.interests,
              lifestyle: profile?.lifestyle_tags
            },
            currentPath: '/ai-search', // Identifying this specific dialog
            messages: sanitizedHistory
          }
        }
      });

      if (funcError) throw funcError;

      // Handle server-side AI errors sent with 200 OK
      if (data?.error) {
        throw new Error(data.error);
      }

      const responseContent = data?.result?.text || data?.result?.message || '';
      if (!responseContent) throw new Error('Vibe is currently pondering. Please try again.');

      setIsTyping(false);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: responseContent,
        timestamp: Date.now(),
        showAction: !!data?.result?.action,
        actionLabel: data?.result?.action?.label || 'View',
        actionRoute: data?.result?.action?.params?.path || data?.result?.action?.route,
      }]);
    } catch (error) {
      setIsTyping(false);
      console.error('[Vibe Search] Error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Vibe connection lost';
      
      setMessages(prev => [...prev, {
        role: 'ai',
        content: `⚠️ ${errorMessage}\n\nPlease check your connection or try again.`,
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, messages, user]);

  const handleClose = useCallback(() => {
    onClose();
    setIsSearching(false);
    setIsTyping(false);
  }, [onClose]);

  const handleAction = useCallback((route?: string) => {
    if (route) { navigate(route); handleClose(); }
  }, [navigate, handleClose]);

  const quickPrompts = useMemo(() => [
    { icon: Home, label: 'Properties', text: 'Show me apartments to rent', color: 'text-orange-400', bg: isDark ? 'bg-orange-500/10 border-orange-500/20' : 'bg-orange-50 border-orange-200' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?', color: 'text-pink-400', bg: isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200' },
    { icon: Zap, label: 'Tokens', text: 'How do tokens work?', color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat?', color: 'text-rose-400', bg: isDark ? 'bg-rose-500/10 border-rose-500/20' : 'bg-rose-50 border-rose-200' },
  ], [isDark]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const applyQuickPrompt = (text: string) => {
    setQuery(text);
    // Auto send prompt after a tiny delay for visibility
    setTimeout(() => {
      setQuery(text); // Ensure it's set
      // We can't easily call handleSend directly due to closure of 'query'
      // Instead we let the user tap Send or we trigger it if we refactor handleSend
    }, 100);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn("sm:max-w-[440px] w-[calc(100%-16px)] h-[85vh] max-h-[750px] border p-0 overflow-hidden rounded-[2.5rem] shadow-2xl outline-none [&]:top-[50%] !flex !flex-col !gap-0", isDark ? "bg-[#0e0e11] border-white/10" : "bg-white border-gray-200")}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className={cn("relative px-5 py-4 border-b flex items-center justify-between", isDark ? "border-white/10" : "border-gray-200")}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden group border",
              isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100 shadow-sm"
            )}>
              <SwipessLogo size="sm" className="relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-pink-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div className="flex flex-col">
              <DialogTitle className={cn("font-black text-base tracking-tight leading-none mb-0.5", isDark ? "text-white" : "text-gray-900")}>
                Swipess Concierge
              </DialogTitle>
              <DialogDescription className="flex items-center gap-1.5 p-0">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                <span className={cn("text-[10px] font-bold uppercase tracking-widest bg-clip-text text-transparent bg-gradient-to-r from-orange-400 to-pink-400")}>
                  Personal Concierge
                </span>
              </DialogDescription>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className={cn("h-11 w-11 rounded-full transition-all border shadow-lg active:scale-90", isDark ? "bg-white/5 hover:bg-white/15 border-white/10 text-white/80 hover:text-white" : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-600 hover:text-gray-900")}
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        {/* Messages Area */}
        <div
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-6 scroll-smooth scrollbar-none relative"
        >
          {messages.length === 0 && !isTyping && (
             <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-20 text-center"
            >
              <div className={cn(
                "w-20 h-20 mx-auto rounded-[2.2rem] flex items-center justify-center shadow-xl border mb-4",
                isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8"
              )}>
                <SwipessLogo size="xl" />
              </div>
              <p className="text-muted-foreground text-xs font-black uppercase tracking-[0.2em] opacity-50">Secure Concierge Link</p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
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
                    "max-w-[85%] px-4 py-3 text-[13px] font-bold leading-relaxed whitespace-pre-line shadow-lg",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-[1.25rem] rounded-tr-sm shadow-orange-500/20"
                      : cn(
                        "rounded-[1.25rem] rounded-tl-sm border",
                        isDark
                          ? "bg-zinc-900/80 border-white/10 text-foreground"
                          : "bg-white border-gray-100 text-gray-800 shadow-sm"
                      )
                  )}>
                    {message.content}
                  </div>
                </div>

                {message.role === 'ai' && message.showAction && message.actionRoute && (
                  <Button
                    size="sm"
                    onClick={() => handleAction(message.actionRoute)}
                    className="flex items-center gap-2 px-6 h-10 rounded-full text-white shadow-lg ml-10 uppercase tracking-widest text-[10px] bg-gradient-to-r from-orange-500 to-pink-500"
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
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                isDark ? "bg-zinc-900 border border-white/10" : "bg-gray-100 border border-black/8"
              )}>
                <SwipessLogo size="xs" className="animate-pulse" />
              </div>
              <div className="bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 px-4 py-3 rounded-[1.5rem] rounded-tl-sm text-xs font-bold text-orange-500 flex items-center gap-2 shadow-sm">
                <Loader2 className="w-3 h-3 animate-spin text-orange-500" />
                Concierge is thinking...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length > 0 && messages[messages.length-1].role === 'ai' && !isSearching && !isTyping && (
          <div className="px-5 pb-4">
            <p className="text-[10px] font-black uppercase tracking-widest mb-3 text-muted-foreground/50">Quick Actions</p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt.text)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-[11px] rounded-xl transition-all font-black uppercase tracking-tighter border group hover:scale-105 active:scale-95",
                    prompt.bg
                  )}
                >
                  <prompt.icon className={cn("w-3.5 h-3.5", prompt.color)} />
                  <span className={isDark ? "text-foreground/80" : "text-gray-700"}>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={cn("p-4 border-t relative", isDark ? "border-white/10 bg-black/40" : "border-gray-200 bg-gray-50/50")}>
          <div className={cn(
            "relative rounded-2xl border transition-all duration-300 group overflow-hidden",
            isDark 
              ? "bg-zinc-900/80 border-white/10 focus-within:border-orange-500/50 focus-within:ring-4 focus-within:ring-orange-500/10" 
              : "bg-white border-gray-200 focus-within:border-orange-500 shadow-sm"
          )}>
            <textarea
              ref={inputRef}
              placeholder="Ask anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent px-4 py-3.5 pr-12 text-sm font-bold outline-none placeholder:text-muted-foreground/30",
                "min-h-[50px] max-h-[150px]",
                isDark ? "text-white" : "text-gray-900"
              )}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!query.trim() || isSearching}
              className={cn(
                "absolute right-2.5 bottom-2.5 rounded-xl h-8 w-8 p-0 transition-all duration-300",
                query.trim() 
                  ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-90" 
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
