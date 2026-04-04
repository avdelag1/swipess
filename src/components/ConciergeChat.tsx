import { useState, useRef, useEffect, useCallback } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import {
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
  Calendar,
  MessageCircle as _ChatIcon,
  ChevronsUp,
  ChevronsDown,
} from 'lucide-react';
import { useConciergeAI } from '@/hooks/useConciergeAI';
import { useUserMemories } from '@/hooks/useUserMemories';
import { useAIUsage } from '@/hooks/useAIUsage';
import { formatQuota } from '@/config/aiTiers';
import ReactMarkdown from 'react-markdown';
import { useTheme } from '@/hooks/useTheme';
import { JarvisAura } from './ui/JarvisAura';
import { useUserSubscription } from '@/hooks/useSubscription';
import { useAuth } from '@/hooks/useAuth';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/microPolish';
import { useNavigate } from 'react-router-dom';
import { MemoryDrawer } from './MemoryDrawer';
import { ConversationHistoryPopover } from './ConversationHistoryPopover';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { toast } from '@/components/ui/sonner';

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
    <div className="flex items-center gap-3 px-4 py-3">
      <JarvisAura isThinking size="sm" />
      <span className={cn("text-[10px] font-black uppercase tracking-widest animate-pulse", isDark ? "text-cyan-400" : "text-cyan-600")}>
        Swipess AI is thinking...
      </span>
    </div>
  );
}

export function ConciergeChat({
  open,
  onOpenChange,
  initialCity: _initialCity,
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
  const topMarkerRef = useRef<HTMLDivElement>(null);
  const lastUserMsgRef = useRef<HTMLDivElement>(null);

  const scrollToTop = useCallback(() => {
    topMarkerRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, []);

  const scrollToLastUserMsg = useCallback(() => {
    lastUserMsgRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }, []);

  const {
    messages,
    isLoading,
    error,
    sendMessage,
    clearMessages: _clearMessages,
    deletePermanently,
    userVibe: _userVibe,
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
    await sendMessage(messageToSend, { userRole, listings });
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
    { icon: Utensils,   label: 'Best Dinner',    prompt: 'What are the best restaurants for a romantic dinner tonight?' },
    { icon: Car,        label: 'Rent a Car',     prompt: 'What car rental options are available near the airport?' },
  ];

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent
          className={cn(
            "max-w-[660px] w-[calc(100%-8px)] sm:w-[calc(100%-32px)] h-[96vh] sm:h-[93vh] max-h-[940px] flex flex-col p-0 gap-0 overflow-hidden rounded-[1.5rem] sm:rounded-[2rem]",
            isDark
              ? "bg-gradient-to-b from-[#0f1117] via-[#111318] to-[#0d0f14] border-white/[0.07] shadow-2xl shadow-black/70"
              : "bg-white border-gray-200/60 shadow-2xl shadow-black/10"
          )}
          hideCloseButton
        >
          {/* ── Header ─────────────────────────────────────────────── */}
          <div className={cn(
            "relative flex items-center justify-between px-4 py-2.5 border-b shrink-0 overflow-hidden",
            isDark
              ? "border-white/[0.05] bg-gradient-to-r from-[#0f1117] via-[#131620] to-[#0f1117]"
              : "border-gray-100 bg-gradient-to-r from-white via-cyan-50/30 to-white"
          )}>
            {/* Subtle glow accent */}
            <div className={cn(
              "absolute left-0 top-0 w-40 h-full pointer-events-none",
              isDark
                ? "bg-gradient-to-r from-cyan-500/5 to-transparent"
                : "bg-gradient-to-r from-cyan-400/8 to-transparent"
            )} />

            {/* Left: logo + identity */}
            <div className="flex items-center gap-3 min-w-0 relative z-10">
              <div className={cn(
                "w-9 h-9 rounded-xl flex items-center justify-center relative overflow-hidden shrink-0 border",
                isDark
                  ? "bg-gradient-to-br from-[#1a2030] to-[#0f1520] border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                  : "bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-200/60 shadow-sm"
              )}>
                <JarvisAura size="sm" isThinking={isLoading} />
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
              </div>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <h2 className={cn("font-black text-[15px] leading-tight tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                    Vibe
                  </h2>
                  <span className="flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className={cn("text-[9px] font-black uppercase tracking-[0.15em]", isDark ? "text-emerald-400" : "text-emerald-600")}>Live</span>
                  </span>
                  {(userRole === 'owner' || subscription?.subscription_packages?.tier === 'premium' || subscription?.subscription_packages?.tier === 'unlimited') && (
                    <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-500 text-[9px] font-bold uppercase tracking-wider border border-amber-500/20">
                      <Sparkles className="w-2.5 h-2.5" />
                      {tierName}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <p className={cn("text-[11px] leading-tight font-medium", isDark ? "text-zinc-500" : "text-gray-400")}>
                    AI Concierge · {initialCity}
                  </p>
                  {limits.dailyMessages !== Infinity && (
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full border",
                      isAtMessageLimit
                        ? isDark ? "bg-red-500/10 text-red-400 border-red-500/20" : "bg-red-50 text-red-600 border-red-200"
                        : isDark ? "bg-white/4 text-zinc-600 border-white/6" : "bg-gray-50 text-gray-400 border-gray-200"
                    )}>
                      {formatQuota(messagesUsedToday, limits.dailyMessages)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Right: action buttons */}
            <div className="flex items-center gap-0.5 shrink-0 relative z-10">
              {/* Memory button with badge */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => { haptics.tap(); setMemoryDrawerOpen(true); }}
                title={`AI Memory (${memoryCount} stored)`}
                className={cn(
                  "h-9 w-9 rounded-xl relative",
                  memoryCount > 0
                    ? isDark ? "text-cyan-400 hover:bg-cyan-500/10" : "text-cyan-600 hover:bg-cyan-50"
                    : isDark ? "text-zinc-600 hover:text-zinc-300 hover:bg-white/5" : "text-gray-400 hover:text-gray-600 hover:bg-gray-100"
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
                className={cn("h-9 w-9 rounded-xl hover:text-rose-500", isDark ? "text-zinc-600 hover:bg-white/5" : "text-gray-400 hover:bg-gray-100")}
              >
                <Trash2 className="w-4 h-4" />
              </Button>

              {/* Close */}
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onOpenChange(false)}
                className={cn(
                  "h-9 w-9 rounded-xl",
                  isDark ? "text-zinc-400 hover:text-white hover:bg-white/5" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100"
                )}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* ── Messages Area ────────────────────────────────────────── */}
          <div className="relative flex-1 min-h-0">
          <ScrollArea className="h-full px-4 py-3 sm:px-5 sm:py-4">
            <div ref={scrollRef} className="space-y-4">
              {/* Top scroll marker */}
              <div ref={topMarkerRef} />

              {/* Empty / Welcome State */}
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="space-y-4 pt-2"
                >
                  {/* Greeting card */}
                  <div className={cn(
                    "p-6 rounded-2xl text-center space-y-3 border relative overflow-hidden",
                    isDark
                      ? "bg-gradient-to-b from-[#151922] to-[#111318] border-white/[0.05]"
                      : "bg-gradient-to-b from-cyan-50/60 to-white border-cyan-100/80"
                  )}>
                    {/* Background glow */}
                    <div className={cn(
                      "absolute inset-x-0 top-0 h-20 pointer-events-none",
                      isDark
                        ? "bg-gradient-to-b from-cyan-500/5 to-transparent"
                        : "bg-gradient-to-b from-cyan-400/10 to-transparent"
                    )} />
                    <div className={cn(
                      "w-16 h-16 rounded-2xl flex items-center justify-center mx-auto relative border",
                      isDark
                        ? "bg-gradient-to-br from-cyan-500/15 to-blue-600/15 border-cyan-500/20 shadow-lg shadow-cyan-500/10"
                        : "bg-gradient-to-br from-cyan-100 to-blue-50 border-cyan-200/60"
                    )}>
                      <JarvisAura size="md" isThinking={isLoading} />
                    </div>
                    <div className="relative">
                      <p className={cn("font-black text-lg tracking-tight", isDark ? "text-white" : "text-gray-900")}>
                        {userName ? `Hey, ${userName}! 👋` : 'Hey! 👋'}
                      </p>
                      <p className={cn("text-sm mt-1.5 leading-relaxed", isDark ? "text-zinc-400" : "text-gray-500")}>
                        {memoryCount > 0
                          ? `I remember ${memoryCount} thing${memoryCount === 1 ? '' : 's'} about you — ready to help.`
                          : `Your personal ${initialCity} concierge. Ask me anything.`
                        }
                      </p>
                    </div>
                    {memoryCount > 0 && (
                      <button
                        onClick={() => setMemoryDrawerOpen(true)}
                        className={cn(
                          "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all relative",
                          isDark
                            ? "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 hover:bg-cyan-500/20"
                            : "bg-cyan-50 text-cyan-600 border-cyan-200 hover:bg-cyan-100"
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
                          "flex items-center gap-3 p-3.5 rounded-2xl text-left transition-all active:scale-95 group border",
                          isDark
                            ? "bg-[#151922]/80 hover:bg-[#1a2030] border-white/[0.05] hover:border-white/[0.08]"
                            : "bg-white hover:bg-gray-50 border-gray-100 hover:border-gray-200 shadow-sm"
                        )}
                      >
                        <div className={cn(
                          "w-8 h-8 flex items-center justify-center rounded-xl shrink-0 transition-colors border",
                          isDark
                            ? "bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/15 group-hover:border-cyan-500/25"
                            : "bg-gradient-to-br from-cyan-50 to-blue-50 border-cyan-100 group-hover:border-cyan-200"
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
                {messages.map((message, idx) => {
                  // Find last user message index for ref attachment
                  const isLastUserMsg = message.role === 'user' &&
                    !messages.slice(idx + 1).some(m => m.role === 'user');
                  return (
                  <motion.div
                    key={message.id}
                    ref={isLastUserMsg ? lastUserMsgRef : undefined}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={cn(
                      "flex gap-2.5",
                      message.role === 'user' ? "flex-row-reverse" : "flex-row"
                    )}
                  >
                    {/* Avatar */}
                    <div className={cn(
                      "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold border overflow-hidden",
                      message.role === 'user'
                        ? isDark
                          ? "bg-[#1e2530] border-white/[0.07] text-zinc-300"
                          : "bg-gray-100 border-gray-200 text-gray-600"
                        : isDark
                          ? "bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                          : "bg-gradient-to-br from-cyan-400 to-blue-500 border-transparent"
                    )}>
                      {message.role === 'user'
                        ? (userName ? userName[0].toUpperCase() : <User className="w-3.5 h-3.5" />)
                        : <JarvisAura size="sm" className="w-full h-full" />
                      }
                    </div>

                    {/* Bubble + timestamp */}
                    <div className={cn("flex flex-col gap-1 max-w-[78%]", message.role === 'user' ? "items-end" : "items-start")}>
                      <div className={cn(
                        "px-4 py-3 rounded-2xl",
                        message.role === 'user'
                          ? cn(
                              "rounded-tr-sm",
                              isDark
                                ? "bg-gradient-to-br from-cyan-600/90 to-blue-700/90 text-white shadow-sm shadow-cyan-500/10"
                                : "bg-gradient-to-br from-cyan-500 to-blue-500 text-white shadow-sm"
                            )
                          : cn(
                              "rounded-tl-sm",
                              isDark
                                ? "bg-[#1a2030] border border-white/[0.05] text-zinc-100"
                                : "bg-gray-50 border border-gray-100 text-gray-900"
                            )
                      )}>
                        {message.role === 'user' ? (
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                        ) : (
                          <div className="text-sm max-w-none break-words leading-relaxed space-y-1.5">
                            <ReactMarkdown
                              components={{
                                a: ({ node: _node, ...props }) => (
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
                                p: ({ node: _node, ...props }) => <p className="mb-1.5 last:mb-0" {...props} />,
                                ul: ({ node: _node, ...props }) => <ul className="list-disc pl-4 mb-1.5 space-y-0.5" {...props} />,
                                ol: ({ node: _node, ...props }) => <ol className="list-decimal pl-4 mb-1.5 space-y-0.5" {...props} />,
                                li: ({ node: _node, ...props }) => <li className="pl-0.5" {...props} />,
                                strong: ({ node: _node, ...props }) => <strong className="font-bold" {...props} />,
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

                        {/* NEW: Itinerary Visualizer */}
                        {message.role === 'assistant' && message.action?.type === 'create_itinerary' && message.action.params?.activities && (
                          <div className={cn(
                            "mt-4 p-4 rounded-2xl border shadow-xl relative overflow-hidden",
                            isDark ? "bg-zinc-900/90 border-white/10" : "bg-blue-50/50 border-blue-100"
                          )}>
                            <div className="absolute top-0 right-0 p-3 opacity-10">
                              <Calendar className="w-12 h-12 rotate-12" />
                            </div>
                            <h4 className={cn("font-black text-xs uppercase tracking-[0.2em] mb-4 flex items-center gap-2", isDark ? "text-cyan-400" : "text-blue-600")}>
                              <Sparkles className="w-3.5 h-3.5" /> Your Saturday Itinerary
                            </h4>
                            <div className="space-y-5 relative">
                              {/* Timeline line */}
                              <div className="absolute left-1.5 top-2 bottom-2 w-0.5 bg-gradient-to-b from-cyan-500/50 via-blue-500/30 to-transparent rounded-full" />
                              
                              {message.action.params.activities.map((act: any, idx: number) => (
                                <motion.div 
                                  key={idx}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0, transition: { delay: idx * 0.1 } }}
                                  className="flex gap-4 relative z-10"
                                >
                                  <div className="w-3 h-3 rounded-full bg-cyan-500 mt-1 shadow-sm shadow-cyan-500/50 shrink-0 border-2 border-white ring-4 ring-cyan-500/10" />
                                  <div className="flex-1">
                                    <div className={cn("text-[10px] font-black uppercase tracking-wider mb-0.5", isDark ? "text-zinc-500" : "text-blue-400")}>
                                      {act.time || "TBD"}
                                    </div>
                                    <h5 className={cn("text-[13px] font-bold leading-tight", isDark ? "text-white" : "text-gray-900")}>
                                      {act.title}
                                    </h5>
                                    <p className={cn("text-[11px] leading-relaxed mt-1 opacity-70", isDark ? "text-zinc-400" : "text-gray-600")}>
                                      {act.description || act.content}
                                    </p>
                                  </div>
                                </motion.div>
                              ))}
                            </div>
                            <Button 
                              variant="ghost" 
                              className={cn("w-full mt-4 h-8 text-[10px] font-black uppercase tracking-widest border transition-all", isDark ? "bg-white/5 border-white/5 hover:bg-white/10" : "bg-blue-100/50 border-blue-200/50 hover:bg-blue-100")}
                              onClick={() => toast.success("Saved to your plans!")}
                            >
                              Add to Calendar
                            </Button>
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
                  );
                })}

                {/* Typing indicator */}
                {isLoading && (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex gap-2.5 items-end"
                  >
                    <div className={cn(
                      "w-8 h-8 rounded-2xl flex items-center justify-center shrink-0 border overflow-hidden",
                      isDark
                        ? "bg-gradient-to-br from-cyan-500 to-blue-600 border-cyan-500/30 shadow-sm shadow-cyan-500/20"
                        : "bg-gradient-to-br from-cyan-400 to-blue-500 border-transparent"
                    )}>
                      <JarvisAura size="sm" className="w-full h-full" isThinking />
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

          {/* ── Scroll Navigation Buttons ──────────────────────────── */}
          {messages.length > 2 && (
            <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-10">
              <button
                onClick={scrollToTop}
                title="Scroll to top"
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm transition-all active:scale-90",
                  isDark
                    ? "bg-[#1a2030]/90 border-white/10 text-zinc-400 hover:text-white hover:border-white/20"
                    : "bg-white/90 border-gray-200 text-gray-500 hover:text-gray-900 hover:border-gray-300"
                )}
              >
                <ChevronsUp className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={scrollToLastUserMsg}
                title="Jump to my last message"
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border shadow-lg backdrop-blur-sm transition-all active:scale-90",
                  isDark
                    ? "bg-cyan-600/80 border-cyan-500/30 text-white hover:bg-cyan-500/90"
                    : "bg-cyan-500/90 border-cyan-400/40 text-white hover:bg-cyan-500"
                )}
              >
                <ChevronsDown className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
          </div>

          {/* ── Input Area ───────────────────────────────────────────── */}
          <div className={cn(
            "px-4 pb-4 pt-2.5 sm:px-5 sm:pb-5 border-t shrink-0",
            isDark
              ? "border-white/[0.05] bg-gradient-to-b from-transparent to-[#0d0f14]/50"
              : "border-gray-100 bg-gradient-to-b from-transparent to-gray-50/30"
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
              <div className={cn(
                "relative flex items-end gap-2.5 rounded-2xl p-2 border transition-colors",
                isDark
                  ? "bg-[#151922] border-white/[0.07] focus-within:border-cyan-500/30"
                  : "bg-white border-gray-200 focus-within:border-cyan-300 shadow-sm"
              )}>
                <Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value.slice(0, 500))}
                  onKeyDown={handleKeyDown}
                  placeholder={`Ask Vibe about ${initialCity}…`}
                  className={cn(
                    "flex-1 min-h-[36px] max-h-32 resize-none border-0 bg-transparent text-sm shadow-none focus-visible:ring-0 focus-visible:ring-offset-0 py-1.5 px-1",
                    isDark
                      ? "text-white placeholder:text-zinc-600"
                      : "text-gray-900 placeholder:text-gray-400"
                  )}
                  disabled={isLoading}
                />
                <div className="flex items-center gap-2 pb-0.5 pr-0.5 shrink-0">
                  {input.length > 350 && (
                    <span className={cn(
                      "text-[9px] font-bold",
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
                      "h-9 w-9 rounded-xl shrink-0 transition-all",
                      isDark
                        ? "bg-gradient-to-br from-cyan-600 to-blue-700 hover:from-cyan-500 hover:to-blue-600 disabled:opacity-30 shadow-sm shadow-cyan-500/20"
                        : "bg-gradient-to-br from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 disabled:opacity-40 shadow-sm"
                    )}
                  >
                    <Send className="w-3.5 h-3.5" />
                  </Button>
                </div>
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
