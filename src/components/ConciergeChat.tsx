import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Bot,
  Send,
  X,
  Loader2,
  Sparkles,
  MapPin,
  Building2,
  Car,
  RefreshCw,
  User,
  Trash2,
  Archive,
  ChevronRight
} from 'lucide-react';
import { useConciergeAI } from '@/hooks/useConciergeAI';
import { useAIUsage } from '@/hooks/useAIUsage';
import { formatQuota } from '@/config/aiTiers';
import ReactMarkdown from 'react-markdown';
import { SwipessLogo } from './SwipessLogo';
import { useTheme } from '@/hooks/useTheme';
import { useUserSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/microPolish';
import { useNavigate } from 'react-router-dom';

interface ConciergeChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCity?: string;
  userRole?: 'client' | 'owner';
  listings?: any[];
}

export function ConciergeChat({ 
  open, 
  onOpenChange, 
  initialCity = 'Tulum',
  userRole = 'client',
  listings = []
}: ConciergeChatProps) {
  const { theme } = useTheme();
  const { data: subscription } = useUserSubscription();
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages,
    deletePermanently,
    userVibe,
    isConfigured 
  } = useConciergeAI();

  const {
    messagesUsedToday,
    isAtMessageLimit,
    limits,
    tierName,
  } = useAIUsage();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  // Pre-warm the Edge Function to avoid cold-start delays
  useEffect(() => {
    if (open) {
      supabase.functions.invoke('ai-orchestrator', { body: { task: 'ping' } }).catch(() => {});
    }
  }, [open]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    haptics.tap();
    const messageToSend = input.trim();
    setInput('');
    
    await sendMessage(messageToSend, {
      city: initialCity,
      userRole,
      listings
    });
  };

  const linkify = (text: string) => {
    // Basic regex to find raw URLs that aren't already part of a markdown link
    const urlRegex = /(?<!\(|\[)(https?:\/\/[^\s<]+[^.,\s<])/g;
    return text.replace(urlRegex, '[$1]($1)');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = [
    { icon: MapPin, label: 'Beach Clubs', prompt: `What are the best beach clubs in the Hotel Zone with free access?` },
    { icon: Building2, label: 'Find a Villa', prompt: 'Find me a 2-bedroom property under $5,000/mo near the beach' },
    { icon: Sparkles, label: 'Local Prices', prompt: 'Which luxury restaurants in Tulum have a minimum spend under $100?' },
    { icon: Car, label: 'Rent a Car', prompt: 'What car rental options are available near the airport?' },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-md w-[calc(100%-16px)] h-[85vh] max-h-[750px] flex flex-col p-0 gap-0 overflow-hidden rounded-[2.5rem] border-none shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]",
          isDark 
            ? "bg-[#0a0a0b]/80 backdrop-blur-2xl" 
            : "bg-white/90 backdrop-blur-2xl"
        )}
        hideCloseButton
      >
        {/* Animated Glow Border */}
        <div className="absolute inset-0 p-[1px] rounded-[2.5rem] pointer-events-none z-0">
          <div className={cn(
            "w-full h-full rounded-[2.5rem] opacity-30",
            isDark 
              ? "bg-gradient-to-br from-cyan-500 via-purple-500 to-rose-500" 
              : "bg-gradient-to-br from-cyan-400 via-blue-400 to-indigo-400"
          )} />
        </div>
        
        {/* Header */}
        <div className={cn(
          "relative z-10 flex items-center justify-between px-6 py-5 border-b shrink-0",
          isDark ? "border-white/5 bg-white/5" : "border-gray-100 bg-gray-50/50"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-11 h-11 rounded-full flex items-center justify-center relative overflow-hidden group shadow-lg border",
              isDark ? "bg-zinc-900 border-white/10" : "bg-white border-zinc-200"
            )}>
              <SwipessLogo size="sm" className="relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-rose-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
                  Swipess Concierge
                </h2>
                <div className="flex items-center gap-1.5 ml-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse shadow-[0_0_8px_rgba(6,182,212,0.8)]" />
                  <span className="text-[10px] font-black text-cyan-500 uppercase tracking-[0.2em]">Sentient AI</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={userVibe || 'syncing'}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className={cn(
                      "flex items-center gap-1.5 px-2 py-0.5 rounded-full border text-[9px] font-bold uppercase tracking-wider",
                      isDark 
                        ? "bg-white/5 border-white/10 text-zinc-400" 
                        : "bg-gray-100 border-gray-200 text-gray-500"
                    )}
                  >
                    <Bot className="w-2.5 h-2.5" />
                    Persona: {userVibe || 'Exploring...'}
                    <span className="absolute inset-0 bg-cyan-500/10 blur-[5px] rounded-full animate-pulse" />
                  </motion.div>
                </AnimatePresence>
              </div>
                {limits.dailyMessages !== Infinity && (
                  <span className={cn(
                    "text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full border",
                    isAtMessageLimit 
                      ? isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"
                      : isDark ? "bg-white/5 text-zinc-400 border-white/10" : "bg-gray-50 text-gray-500 border-gray-200"
                  )}>
                    {formatQuota(messagesUsedToday, limits.dailyMessages)}
                  </span>
                )}
              </div>
            </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.warning();
                clearMessages();
              }}
              title="Archive Conversation"
              className={cn("h-9 w-9 rounded-lg", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
            >
              <Archive className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.error();
                if (window.confirm('Permanently delete this conversation?')) {
                  deletePermanently();
                }
              }}
              title="Delete Permanently"
              className={cn("h-9 w-9 rounded-lg hover:text-rose-500", isDark ? "text-zinc-400 hover:bg-zinc-800" : "text-gray-500 hover:bg-gray-100")}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onOpenChange(false)}
              className={cn("h-9 w-9 rounded-lg", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Messages Area */}
        <ScrollArea className="flex-1 px-4 py-2">
          <div ref={scrollRef} className="space-y-4">
            {/* Welcome message */}
            {messages.length === 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-6 pt-4"
              >
                <div className={cn(
                  "p-6 rounded-[2rem] text-center relative overflow-hidden group",
                  isDark ? "bg-white/5 shadow-inner" : "bg-gray-50 shadow-inner"
                )}>
                   {/* Background ambient light */}
                  <div className="absolute -top-24 -left-24 w-48 h-48 bg-cyan-500/20 rounded-full blur-[80px] pointer-events-none" />
                  <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-purple-500/20 rounded-full blur-[80px] pointer-events-none" />

                  <div className={cn(
                    "w-16 h-16 rounded-3xl mx-auto mb-4 flex items-center justify-center rotate-6 group-hover:rotate-0 transition-transform duration-500 shadow-xl border",
                    isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100"
                  )}>
                    <SwipessLogo size="sm" />
                  </div>
                  
                  <h3 className={cn("text-xl font-black tracking-tight mb-2", isDark ? "text-white" : "text-gray-900")}>
                    Welcome to Swipess {initialCity}
                  </h3>
                  <p className={cn("text-sm leading-relaxed", isDark ? "text-zinc-400" : "text-gray-500")}>
                    Your sentient local expert for properties, listings, and Tulum's secret spots.
                  </p>
                </div>

                {/* Quick suggestions */}
                <div className="grid grid-cols-2 gap-2 mt-4">
                  {quickSuggestions.map((suggestion, index) => (
                    <motion.button
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0, transition: { delay: index * 0.1 } }}
                      key={index}
                      onClick={() => {
                        haptics.tap();
                        sendMessage(suggestion.prompt, { city: initialCity, userRole, listings });
                      }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl text-left transition-all active:scale-95 group",
                        isDark 
                          ? "bg-zinc-800/40 hover:bg-zinc-700/60 border border-zinc-700/50" 
                          : "bg-white hover:bg-gray-50 border border-gray-200 shadow-sm"
                      )}
                    >
                      <div className={cn(
                        "w-8 h-8 flex items-center justify-center rounded-full shrink-0",
                        isDark ? "bg-zinc-900 group-hover:bg-zinc-800" : "bg-gray-100 group-hover:bg-white"
                      )}>
                        <suggestion.icon className={cn("w-4 h-4", isDark ? "text-cyan-400" : "text-cyan-500")} />
                      </div>
                      <span className={cn("text-xs font-semibold leading-tight", isDark ? "text-zinc-300" : "text-gray-700")}>
                        {suggestion.label}
                      </span>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* Chat messages */}
            <AnimatePresence>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex gap-3",
                    message.role === 'user' ? "flex-row-reverse" : "flex-row"
                  )}
                >
                  {/* Avatar */}
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    message.role === 'user' 
                      ? isDark ? "bg-zinc-700" : "bg-gray-200"
                      : isDark ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-500"
                  )}>
                    {message.role === 'user' 
                      ? <User className={cn("w-4 h-4", isDark ? "text-zinc-300" : "text-gray-600")} />
                      : <Bot className="w-4 h-4 text-white" />
                    }
                  </div>

                  {/* Message bubble */}
                  <div className={cn(
                    "max-w-[85%] p-4 rounded-3xl relative overflow-hidden",
                    message.role === 'user'
                      ? isDark 
                        ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white shadow-[0_10px_20px_-10px_rgba(79,70,229,0.5)]"
                        : "bg-gradient-to-br from-indigo-500 to-indigo-600 text-white shadow-lg"
                      : isDark 
                        ? "bg-white/5 text-zinc-100 border border-white/5 backdrop-blur-md"
                        : "bg-gray-100 text-gray-900 border border-gray-200"
                  )}>
                    {/* User bubble accent */}
                    {message.role === 'user' && (
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl pointer-events-none" />
                    )}
                    {message.role === 'user' ? (
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                    ) : (
                      <div className={cn(
                        "text-sm max-w-none break-words leading-relaxed space-y-2",
                        isDark ? "text-zinc-100" : "text-gray-900"
                      )}>
                        <ReactMarkdown
                          components={{
                            a: ({ node, ...props }) => (
                              <a 
                                target="_blank" 
                                rel="noopener noreferrer" 
                                className={cn(
                                  "inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 font-bold no-underline border border-cyan-500/20 hover:bg-cyan-500/20 transition-colors shadow-sm",
                                  !isDark && "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                                )} 
                                {...props} 
                              />
                            ),
                            p: ({ node, ...props }) => <p className="mb-2 last:mb-0" {...props} />,
                            ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-2 space-y-1" {...props} />,
                            ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-2 space-y-1" {...props} />,
                            li: ({ node, ...props }) => <li className="pl-1" {...props} />
                          }}
                        >
                          {linkify(message.content)}
                        </ReactMarkdown>
                      </div>
                    )}

                    {/* Render Interactive Card if Action exists */}
                    {message.role === 'assistant' && message.action?.type === 'show_venue_card' && (
                      <div className={cn("mt-3 overflow-hidden rounded-xl border shadow-xl breathing-zoom backdrop-blur-md", isDark ? "border-white/10 bg-zinc-900/80" : "border-gray-200 bg-white")}>
                        <div className="h-24 w-full relative bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-pink-500/40 flex items-center justify-center overflow-hidden">
                           <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
                           <Sparkles className="w-8 h-8 text-white/40 relative z-10 animate-pulse" />
                          <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                            <h4 className="font-bold leading-tight drop-shadow-md">{message.action.params?.title}</h4>
                            <p className="text-[10px] uppercase tracking-wider font-extrabold text-white/80 drop-shadow-md">{message.action.params?.category}</p>
                          </div>
                        </div>
                        <div className="p-2.5 flex gap-2">
                           {message.action.params?.whatsapp && message.action.params?.whatsapp !== '' && (
                             <a href={`https://wa.me/${message.action.params.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className={cn("flex-1 text-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20" : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200")}>WhatsApp</a>
                           )}
                           {message.action.params?.instagram && message.action.params?.instagram !== '' && (
                             <a href={`https://instagram.com/${message.action.params.instagram.replace('@', '')}`} target="_blank" rel="noreferrer" className={cn("flex-1 text-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20" : "bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200")}>Instagram</a>
                           )}
                           {(!message.action.params?.whatsapp && !message.action.params?.instagram) && message.action.params?.website_url && (
                             <a href={message.action.params?.website_url} target="_blank" rel="noreferrer" className={cn("flex-1 text-center py-2 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200")}>Website</a>
                           )}
                        </div>
                      </div>
                    )}
                    
                    {message.role === 'assistant' && message.action?.type === 'show_listing_card' && (
                      <div className={cn("mt-3 overflow-hidden rounded-xl border shadow-xl breathing-zoom backdrop-blur-md cursor-pointer hover:border-cyan-500/50 transition-colors", isDark ? "border-white/10 bg-zinc-900/80" : "border-gray-200 bg-white")}
                           onClick={() => {
                             onOpenChange(false);
                             setTimeout(() => navigate(`/properties/${message.action.params?.id}`), 100);
                           }}
                      >
                        <div className="h-24 w-full relative bg-gradient-to-br from-cyan-500/40 via-blue-500/20 to-emerald-500/40 flex items-center justify-center overflow-hidden">
                           <div className="absolute inset-0 bg-black/40 mix-blend-overlay" />
                           <Building2 className="w-8 h-8 text-white/40 relative z-10 animate-pulse" />
                          <div className="absolute bottom-3 left-3 right-3 text-white z-10">
                            <h4 className="font-bold leading-tight line-clamp-1 drop-shadow-md">{message.action.params?.title}</h4>
                            <p className="text-[10px] font-black tracking-widest text-white/80 drop-shadow-md uppercase">{message.action.params?.location} • ${message.action.params?.price}/mo</p>
                          </div>
                        </div>
                        <div className={cn("p-2 border-t text-center", isDark ? "border-white/5 bg-white/5" : "border-gray-100 bg-gray-50")}>
                           <span className={cn("py-1 p-1 text-[10px] font-black tracking-widest uppercase transition-colors flex items-center justify-center gap-1.5", isDark ? "text-white hover:text-cyan-400" : "text-gray-700 hover:text-cyan-600")}>
                             View Listing <ChevronRight className="w-3 h-3" />
                           </span>
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex gap-3"
                >
                  <div className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                    isDark ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-500"
                  )}>
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <div className={cn(
                    "flex flex-col gap-1 px-4 py-3 rounded-2xl relative overflow-hidden",
                    isDark ? "bg-white/5 border border-white/5" : "bg-gray-100 border border-gray-200"
                  )}>
                    <div className="flex items-center gap-2">
                       <Loader2 className={cn("w-3 h-3 animate-spin", isDark ? "text-cyan-400" : "text-cyan-600")} />
                       <span className={cn("text-[10px] font-black uppercase tracking-widest", isDark ? "text-cyan-500" : "text-cyan-600")}>
                         {messages.length > 5 ? "Deepening Memory..." : "Analyzing Context..."}
                       </span>
                    </div>
                    <span className={cn("text-xs font-medium", isDark ? "text-zinc-400" : "text-gray-500")}>
                      Swipess AI is thinking...
                    </span>
                    {/* Progress bar line */}
                    <div className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 via-purple-500 to-rose-500 w-full animate-shimmer" />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Error message */}
            {error && (
              <div className={cn(
                "p-3 rounded-xl text-center text-sm",
                isDark ? "bg-red-900/30 text-red-400" : "bg-red-50 text-red-600"
              )}>
                {error}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Input Area */}
        <div className={cn(
          "px-4 pb-4 pt-2 border-t shrink-0",
          isDark ? "border-zinc-700/50" : "border-gray-100"
        )}>
          {isAtMessageLimit ? (
            /* ── Upgrade Banner ── */
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={cn(
                "p-4 rounded-2xl text-center space-y-3",
                isDark ? "bg-amber-500/10 border border-amber-500/20" : "bg-amber-50 border border-amber-200"
              )}
            >
              <div className="flex items-center justify-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <span className={cn("text-sm font-bold", isDark ? "text-amber-300" : "text-amber-700")}>
                  Daily AI limit reached
                </span>
              </div>
              <p className={cn("text-xs", isDark ? "text-amber-400/70" : "text-amber-600")}>
                Upgrade your plan for more AI messages & features.
              </p>
              <Button
                onClick={() => {
                  onOpenChange(false);
                  window.location.href = '/subscription-packages';
                }}
                className="w-full h-10 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-widest hover:from-amber-600 hover:to-orange-600"
              >
                View Plans
              </Button>
            </motion.div>
          ) : (
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about restaurants, properties, or the city..."
              className={cn(
                "min-h-[48px] max-h-32 resize-none rounded-xl",
                isDark 
                  ? "bg-zinc-800 border-zinc-700 text-white placeholder:text-zinc-500" 
                  : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400"
              )}
              disabled={isLoading}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              size="icon"
              className={cn(
                "h-12 w-12 rounded-xl shrink-0",
                isDark 
                  ? "bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500" 
                  : "bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400"
              )}
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </Button>
          </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
