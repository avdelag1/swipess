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
  Sparkles,
  MapPin,
  Building2,
  Car,
  User,
  Trash2,
  ChevronRight,
  Brain,
  Utensils,
} from 'lucide-react';
import { useConciergeAI } from '@/hooks/useConciergeAI';
import { useUserMemories } from '@/hooks/useUserMemories';
import { useAIUsage } from '@/hooks/useAIUsage';
import { formatQuota } from '@/config/aiTiers';
import ReactMarkdown from 'react-markdown';
import { SwipessLogo } from './SwipessLogo';
import { useTheme } from '@/hooks/useTheme';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/microPolish';
import { useNavigate } from 'react-router-dom';
import { MemoryDrawer } from './MemoryDrawer';
import { ConversationHistoryPopover } from './ConversationHistoryPopover';
import { formatDistanceToNow } from '@/utils/timeFormatter';

interface ConciergeChatProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCity?: string;
  userRole?: 'client' | 'owner';
  listings?: any[];
}

// Typing indicator dots
function TypingIndicator({ isDark }: { isDark: boolean }) {
  return (
    <div className={cn(
      "flex items-center gap-1.5 px-4 py-3 rounded-2xl rounded-tl-sm w-fit",
      isDark ? "bg-zinc-800" : "bg-gray-100"
    )}>
      {[0, 1, 2].map(i => (
        <motion.span
          key={i}
          className={cn("w-2 h-2 rounded-full", isDark ? "bg-cyan-400" : "bg-cyan-500")}
          animate={{ y: [0, -5, 0] }}
          transition={{ duration: 0.55, delay: i * 0.15, repeat: Infinity, ease: 'easeInOut' }}
        />
      ))}
    </div>
  );
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const isDark = theme === 'dark';

  const [input, setInput] = useState('');
  const [memoryDrawerOpen, setMemoryDrawerOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages,
    deletePermanently,
    userVibe,
    conversations,
    currentConversationId,
    startNewChat,
    switchConversation,
  } = useConciergeAI();

  const { count: memoryCount } = useUserMemories();

  const {
    messagesUsedToday,
    isAtMessageLimit,
    limits,
    tierName,
  } = useAIUsage();

  // Fetch user first name for personalised greeting
  const [userName, setUserName] = useState<string>('');
  useEffect(() => {
    if (!user) return;
    supabase.from('profiles').select('full_name').eq('id', user.id).maybeSingle()
      .then(({ data }) => {
        if (data?.full_name) setUserName(data.full_name.split(' ')[0]);
      });
  }, [user]);

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
    await sendMessage(messageToSend, { city: initialCity, userRole, listings });
  };

  const linkify = (text: string) => {
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
    { icon: MapPin,     label: 'Beach Clubs',    prompt: `What are the best beach clubs in the Hotel Zone with free access?` },
    { icon: Building2,  label: 'Find a Villa',   prompt: 'Find me a 2-bedroom property under $5,000/mo near the beach' },
    { icon: Utensils,   label: 'Best Dinner',    prompt: 'What are the best restaurants for a romantic dinner in Tulum tonight?' },
    { icon: Car,        label: 'Rent a Car',     prompt: 'What car rental options are available near the airport?' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-w-md w-[calc(100%-16px)] h-[88vh] max-h-[780px] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem]",
            isDark
              ? "bg-gradient-to-b from-zinc-900 via-zinc-900 to-zinc-950 border-white/8"
              : "bg-white border-gray-200/80"
          )}
          hideCloseButton
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className={cn(
            "flex items-center justify-between px-4 py-3.5 border-b shrink-0",
            isDark ? "border-white/[0.06]" : "border-gray-100"
          )}>
            {/* Left: logo + identity */}
            <div className="flex items-center gap-3 min-w-0">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center relative overflow-hidden shrink-0 border shadow-sm",
                isDark ? "bg-zinc-900 border-white/8" : "bg-white border-zinc-200"
              )}>
                <SwipessLogo size="sm" className="relative z-10" />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-1.5">
                  <h2 className={cn("font-bold text-base leading-tight", isDark ? "text-white" : "text-gray-900")}>
                    Vibe
                  </h2>
                  <span className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.18em]", isDark ? "text-emerald-400" : "text-emerald-600")}>Live</span>
                  </span>
                  {(userRole === 'owner' || subscription?.subscription_packages?.tier === 'premium' || subscription?.subscription_packages?.tier === 'unlimited') && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      {tierName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1.5">
                  <p className={cn("text-[11px] leading-tight", isDark ? "text-zinc-500" : "text-gray-400")}>
                    Concierge · {initialCity}
                  </p>
                  {limits.dailyMessages !== Infinity && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      isAtMessageLimit
                        ? isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"
                        : isDark ? "bg-white/5 text-zinc-500 border-white/8" : "bg-gray-50 text-gray-400 border-gray-200"
                    )}>
                      {formatQuota(messagesUsedToday, limits.dailyMessages)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-0.5 shrink-0">
              {/* Memory button with badge */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { haptics.tap(); setMemoryDrawerOpen(true); }}
                title={`AI Memory (${memoryCount} stored)`}
                className={cn(
                  "h-9 w-9 rounded-lg relative",
                  memoryCount > 0
                    ? isDark ? "text-cyan-400 hover:bg-cyan-500/10" : "text-cyan-600 hover:bg-cyan-50"
                    : isDark ? "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
                )}
              >
                <Brain className="w-4 h-4" />
                {memoryCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-cyan-500 text-[8px] font-black text-white flex items-center justify-center shadow-sm">
                    {memoryCount > 9 ? '9+' : memoryCount}
                  </span>
                )}
              </Button>

              {/* Conversation history + New Chat */}
              <ConversationHistoryPopover
                conversations={conversations}
                currentConversationId={currentConversationId}
                onSelect={(id) => { haptics.tap(); switchConversation(id); }}
                onNewChat={() => { haptics.tap(); startNewChat(); }}
                isDark={isDark}
              />

              {/* Delete */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  haptics.error();
                  if (window.confirm('Delete this conversation permanently?')) {
                    deletePermanently();
                  }
                }}
                title="Delete conversation"
                className={cn("h-9 w-9 rounded-lg hover:text-rose-500", isDark ? "text-zinc-500 hover:bg-zinc-800" : "text-gray-400 hover:bg-gray-100")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              {/* Close */}
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

          {/* ── Messages Area ────────────────────────────────────────── */}
          <ScrollArea className="flex-1 px-4 py-3">
            <div ref={scrollRef} className="space-y-3">

              {/* Empty / Welcome State */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  {/* Greeting card */}
                  <div className={cn(
                    "p-5 rounded-2xl text-center space-y-2 border",
                    isDark ? "bg-zinc-800/40 border-white/[0.04]" : "bg-gradient-to-b from-gray-50 to-white border-gray-100"
                  )}>
                    <div className={cn(
                      "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto shadow-inner",
                      isDark ? "bg-gradient-to-br from-cyan-500/20 to-blue-600/20" : "bg-gradient-to-br from-cyan-50 to-blue-50"
                    )}>
                      <Bot className={cn("w-7 h-7", isDark ? "text-cyan-400" : "text-cyan-600")} />
                    </div>
                    <div>
                      <p className={cn("font-bold text-base", isDark ? "text-white" : "text-gray-900")}>
                        {userName ? `Hey, ${userName}! 👋` : 'Hey! 👋'}
                      </p>
                      <p className={cn("text-sm mt-1 leading-relaxed", isDark ? "text-zinc-400" : "text-gray-500")}>
                        {memoryCount > 0
                          ? `I remember ${memoryCount} thing${memoryCount === 1 ? '' : 's'} about you — ready to help.`
                          : `Your personal Tulum concierge. Ask me anything.`
                        }
                      </p>
                    </div>
                    {memoryCount > 0 && (
                      <button
                        onClick={() => setMemoryDrawerOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all",
                          isDark
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                            : "bg-cyan-50 text-cyan-600 border-cyan-100 hover:bg-cyan-100"
                        )}
                      >
                        <Brain className="w-3 h-3" />
                        {memoryCount} memor{memoryCount === 1 ? 'y' : 'ies'} active
                      </button>
                    )}
                  </div>

                  {/* Quick suggestion chips */}
                  <div className="grid grid-cols-2 gap-2">
                    {quickSuggestions.map((suggestion, index) => (
                      <motion.button
                        key={index}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.1 + index * 0.07 } }}
                        onClick={() => {
                          haptics.tap();
                          sendMessage(suggestion.prompt, { city: initialCity, userRole, listings });
                        }}
                        className={cn(
                          "flex items-center gap-2.5 p-3 rounded-xl text-left transition-all active:scale-95 group border",
                          isDark
                            ? "bg-zinc-800/50 hover:bg-zinc-800 border-white/[0.06] hover:border-white/10"
                            : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-colors",
                          isDark ? "bg-zinc-900 group-hover:bg-zinc-700" : "bg-gray-50 group-hover:bg-gray-100"
                        )}>
                          <suggestion.icon className={cn("w-4 h-4", isDark ? "text-cyan-400" : "text-cyan-600")} />
                        </div>
                        <span className={cn("text-xs font-semibold leading-tight", isDark ? "text-zinc-300" : "text-gray-700")}>
                          {suggestion.label}
                        </span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}

              {/* ── Chat Messages ─────────────────────────────────────── */}
              <AnimatePresence>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2.5",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold",
                      message.role === 'user'
                        ? isDark ? "bg-zinc-700 text-zinc-300" : "bg-gray-200 text-gray-600"
                        : isDark ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-500"
                    )}>
                      {message.role === 'user'
                        ? (userName ? userName[0].toUpperCase() : <User className="w-3.5 h-3.5" />)
                        : <Bot className="w-3.5 h-3.5 text-white" />
                      }
                    </div>

                    {/* Bubble + timestamp */}
                    <div className={cn("flex flex-col gap-0.5 max-w-[80%]", message.role === 'user' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-3.5 py-2.5 rounded-2xl",
                        message.role === 'user'
                          ? cn(
                              "rounded-tr-sm",
                              isDark
                                ? "bg-gradient-to-br from-cyan-600 to-blue-700 text-white"
                                : "bg-gradient-to-br from-cyan-500 to-blue-500 text-white"
                            )
                          : cn(
                              "rounded-tl-sm",
                              isDark ? "bg-zinc-800 text-zinc-100" : "bg-gray-100 text-gray-900"
                            )
                      )}>
                        {message.role === 'user' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="text-sm max-w-none break-words leading-relaxed space-y-1.5">
                            <ReactMarkdown
                              components={{
                                a: ({ node, ...props }) => (
                                  <a
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className={cn(
                                      "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md font-bold no-underline border transition-colors",
                                      isDark
                                        ? "bg-cyan-500/10 text-cyan-300 border-cyan-500/20 hover:bg-cyan-500/20"
                                        : "bg-cyan-50 text-cyan-700 border-cyan-200 hover:bg-cyan-100"
                                    )}
                                    {...props}
                                  />
                                ),
                                p: ({ node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                                ul: ({ node, ...props }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5" {...props} />,
                                ol: ({ node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5" {...props} />,
                                li: ({ node, ...props }) => <li className="pl-0.5" {...props} />,
                                strong: ({ node, ...props }) => <strong className="font-bold" {...props} />,
                              }}
                            >
                              {linkify(message.content)}
                            </ReactMarkdown>
                          </div>
                        )}

                        {/* Venue card */}
                        {message.role === 'assistant' && message.action?.type === 'show_venue_card' && (
                          <div className={cn("mt-3 overflow-hidden rounded-xl border shadow-lg", isDark ? "border-white/8 bg-zinc-900/80" : "border-gray-200 bg-white")}>
                            <div className="h-20 w-full relative bg-gradient-to-br from-indigo-500/40 via-purple-500/20 to-pink-500/40 flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-0 bg-black/30 mix-blend-overlay" />
                              <Sparkles className="w-7 h-7 text-white/30 relative z-10 animate-pulse" />
                              <div className="absolute bottom-2.5 left-3 right-3 text-white z-10">
                                <h4 className="font-bold text-sm leading-tight drop-shadow">{message.action.params?.title}</h4>
                                <p className="text-[10px] uppercase tracking-widest font-bold text-white/70 drop-shadow">{message.action.params?.category}</p>
                              </div>
                            </div>
                            <div className="p-2 flex gap-1.5">
                              {message.action.params?.whatsapp && (
                                <a href={`https://wa.me/${message.action.params.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                                  className={cn("flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20" : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200")}>
                                  WhatsApp
                                </a>
                              )}
                              {message.action.params?.instagram && (
                                <a href={`https://instagram.com/${message.action.params.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                                  className={cn("flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20" : "bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200")}>
                                  Instagram
                                </a>
                              )}
                              {(!message.action.params?.whatsapp && !message.action.params?.instagram) && message.action.params?.website_url && (
                                <a href={message.action.params.website_url} target="_blank" rel="noreferrer"
                                  className={cn("flex-1 text-center py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200")}>
                                  Website
                                </a>
                              )}
                            </div>
                          </div>
                        )}

                        {/* Listing card */}
                        {message.role === 'assistant' && message.action?.type === 'show_listing_card' && (
                          <div
                            className={cn("mt-3 overflow-hidden rounded-xl border shadow-lg cursor-pointer hover:border-cyan-500/40 transition-colors", isDark ? "border-white/8 bg-zinc-900/80" : "border-gray-200 bg-white")}
                            onClick={() => {
                              onOpenChange(false);
                              setTimeout(() => navigate(`/properties/${message.action.params?.id}`), 100);
                            }}
                          >
                            <div className="h-20 w-full relative bg-gradient-to-br from-cyan-500/40 via-blue-500/20 to-emerald-500/40 flex items-center justify-center overflow-hidden">
                              <div className="absolute inset-0 bg-black/30 mix-blend-overlay" />
                              <Building2 className="w-7 h-7 text-white/30 relative z-10 animate-pulse" />
                              <div className="absolute bottom-2.5 left-3 right-3 text-white z-10">
                                <h4 className="font-bold text-sm leading-tight line-clamp-1 drop-shadow">{message.action.params?.title}</h4>
                                <p className="text-[10px] font-black tracking-widest text-white/70 drop-shadow uppercase">{message.action.params?.location} · ${message.action.params?.price}/mo</p>
                              </div>
                            </div>
                            <div className={cn("p-2 border-t", isDark ? "border-white/5 bg-white/4" : "border-gray-100 bg-gray-50")}>
                              <span className={cn("py-0.5 text-[10px] font-black tracking-widest uppercase flex items-center justify-center gap-1", isDark ? "text-white/60 hover:text-cyan-400" : "text-gray-600 hover:text-cyan-600")}>
                                View Listing <ChevronRight className="w-3 h-3" />
                              </span>
                            </div>
                          </div>
                        )}

                        {/* Expert card (person profiles: coaches, DJs, therapists, etc.) */}
                        {message.role === 'assistant' && message.action?.type === 'show_expert_card' && (
                          <div className={cn("mt-3 overflow-hidden rounded-xl border shadow-lg", isDark ? "border-white/8 bg-zinc-900/80" : "border-gray-200 bg-white")}>
                            <div className="p-3.5">
                              <div className="flex items-center gap-3 mb-2.5">
                                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border shrink-0", isDark ? "bg-zinc-800 border-white/10" : "bg-gray-100 border-gray-200")}>
                                  <User className={cn("w-5 h-5", isDark ? "text-cyan-400" : "text-cyan-600")} />
                                </div>
                                <div>
                                  <h4 className={cn("font-bold text-sm leading-tight", isDark ? "text-white" : "text-gray-900")}>{message.action.params?.title}</h4>
                                  <p className="text-[10px] font-black tracking-widest text-cyan-500 uppercase">{message.action.params?.category || 'Expert'}</p>
                                </div>
                              </div>
                              {message.action.params?.description && (
                                <p className={cn("text-xs leading-relaxed line-clamp-3 mb-3", isDark ? "text-zinc-400" : "text-gray-500")}>
                                  {message.action.params.description}
                                </p>
                              )}
                              <div className="flex flex-wrap gap-1.5">
                                {message.action.params?.whatsapp && (
                                  <a href={`https://wa.me/${message.action.params.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer"
                                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-green-500/10 hover:bg-green-500/20 text-green-400 border-green-500/20" : "bg-green-50 hover:bg-green-100 text-green-700 border-green-200")}>
                                    WhatsApp
                                  </a>
                                )}
                                {message.action.params?.instagram && (
                                  <a href={`https://instagram.com/${message.action.params.instagram.replace('@', '')}`} target="_blank" rel="noreferrer"
                                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-pink-500/10 hover:bg-pink-500/20 text-pink-400 border-pink-500/20" : "bg-pink-50 hover:bg-pink-100 text-pink-700 border-pink-200")}>
                                    Instagram
                                  </a>
                                )}
                                {message.action.params?.website && (
                                  <a href={message.action.params.website} target="_blank" rel="noreferrer"
                                    className={cn("px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest border transition-colors", isDark ? "bg-blue-500/10 hover:bg-blue-500/20 text-blue-400 border-blue-500/20" : "bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200")}>
                                    Website
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Timestamp */}
                      <p className={cn(
                        "text-[9px] px-1",
                        isDark ? "text-zinc-700" : "text-gray-300"
                      )}>
                        {formatDistanceToNow(message.timestamp)}
                      </p>
                    </div>
                  </motion.div>
                ))}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2.5 items-end"
                  >
                    <div className={cn(
                      "w-7 h-7 rounded-full flex items-center justify-center shrink-0",
                      isDark ? "bg-gradient-to-br from-cyan-500 to-blue-600" : "bg-gradient-to-br from-cyan-400 to-blue-500"
                    )}>
                      <Bot className="w-3.5 h-3.5 text-white" />
                    </div>
                    <TypingIndicator isDark={isDark} />
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Error */}
              {error && (
                <div className={cn("p-3 rounded-xl text-center text-sm border", isDark ? "bg-red-900/20 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-100")}>
                  {error}
                </div>
              )}
            </div>
          </ScrollArea>

          {/* ── Input Area ───────────────────────────────────────────── */}
          <div className={cn(
            "px-4 pb-5 pt-2.5 border-t shrink-0",
            isDark ? "border-white/[0.06]" : "border-gray-100"
          )}>
            {isAtMessageLimit ? (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={cn("p-4 rounded-2xl text-center space-y-3 border", isDark ? "bg-amber-500/8 border-amber-500/20" : "bg-amber-50 border-amber-200")}
              >
                <div className="flex items-center justify-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span className={cn("text-sm font-bold", isDark ? "text-amber-300" : "text-amber-700")}>Daily limit reached</span>
                </div>
                <p className={cn("text-xs", isDark ? "text-amber-400/70" : "text-amber-600")}>
                  Upgrade your plan for more messages.
                </p>
                <Button
                  onClick={() => { onOpenChange(false); window.location.href = '/subscription-packages'; }}
                  className="w-full h-9 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 text-white font-bold text-xs uppercase tracking-widest hover:from-amber-600 hover:to-orange-600"
                >
                  View Plans
                </Button>
              </motion.div>
            ) : (
              <div className="relative flex gap-2">
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask Vibe about ${initialCity}…`}
                  className={cn(
                    "min-h-[46px] max-h-28 resize-none rounded-xl text-sm pr-10",
                    isDark
                      ? "bg-zinc-800/80 border-white/8 text-white placeholder:text-zinc-600 focus:border-cyan-500/40"
                      : "bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400 focus:border-cyan-300"
                  )}
                  disabled={isLoading}
                />
                {input.length > 350 && (
                  <span className={cn(
                    "absolute bottom-2 right-14 text-[9px] font-bold",
                    input.length > 480 ? "text-rose-400" : isDark ? "text-zinc-600" : "text-gray-400"
                  )}>
                    {input.length}/500
                  </span>
                )}
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isLoading}
                  size="icon"
                  className={cn(
                    "h-11 w-11 rounded-xl shrink-0 shadow-sm transition-all",
                    isDark
                      ? "bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-40"
                      : "bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40"
                  )}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Memory Drawer — rendered outside the Dialog so it stacks properly */}
      <MemoryDrawer
        open={memoryDrawerOpen}
        onOpenChange={setMemoryDrawerOpen}
        isDark={isDark}
      />
    </>
  );
}
