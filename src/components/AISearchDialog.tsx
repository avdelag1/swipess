import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight, User } from 'lucide-react';
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

// ── ELECTRIC BOOM ENTRANCE ──────────────────────────────────────────────────
const dialogMotion = {
  hidden: {
    opacity: 0,
    scale: 0.72,
    y: 80,
    filter: 'blur(8px)',
  },
  visible: {
    opacity: 1,
    scale: 1,
    y: 0,
    filter: 'blur(0px)',
    transition: {
      type: 'spring' as const,
      stiffness: 500,
      damping: 26,
      mass: 0.6,
    },
  },
  exit: {
    opacity: 0,
    scale: 0.88,
    y: 40,
    filter: 'blur(4px)',
    transition: { duration: 0.22, ease: [0.4, 0, 1, 1] as [number, number, number, number] },
  },
};

// ── ANIMATED S MASCOT ───────────────────────────────────────────────────────
function SMascot({
  isTyping,
  isSending,
  pulse,
}: {
  isTyping: boolean;
  isSending: boolean;
  pulse: boolean;
}) {
  const [blink, setBlink] = useState(false);
  const [happy, setHappy] = useState(false);

  // Random blink every 2-5 seconds
  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const scheduleBlink = () => {
      const delay = 2000 + Math.random() * 3000;
      timeout = setTimeout(() => {
        setBlink(true);
        setTimeout(() => setBlink(false), 110);
        scheduleBlink();
      }, delay);
    };
    scheduleBlink();
    return () => clearTimeout(timeout);
  }, []);

  // Happy face when sending
  useEffect(() => {
    if (isSending) {
      setHappy(true);
      const t = setTimeout(() => setHappy(false), 900);
      return () => clearTimeout(t);
    }
  }, [isSending]);

  return (
    <motion.div
      className="relative flex items-center justify-center select-none"
      style={{ width: 44, height: 44, flexShrink: 0 }}
      animate={
        isTyping
          ? { rotate: [0, -8, 8, -5, 5, 0], y: [0, -2, 0] }
          : isSending
          ? { scale: [1, 1.3, 0.9, 1.1, 1], rotate: [0, -12, 12, 0] }
          : pulse
          ? { scale: [1, 1.05, 1] }
          : { scale: 1, rotate: 0, y: 0 }
      }
      transition={
        isTyping
          ? { duration: 0.55, repeat: Infinity, repeatType: 'loop', ease: 'easeInOut' }
          : isSending
          ? { duration: 0.5, ease: 'easeOut' }
          : pulse
          ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
          : { duration: 0.3 }
      }
    >
      {/* Glow ring */}
      <motion.div
        className="absolute inset-0 rounded-2xl"
        animate={
          isTyping
            ? { boxShadow: ['0 0 0px 0px rgba(59,130,246,0)', '0 0 18px 5px rgba(59,130,246,0.55)', '0 0 0px 0px rgba(59,130,246,0)'] }
            : pulse
            ? { boxShadow: ['0 0 0px 0px rgba(59,130,246,0.2)', '0 0 12px 3px rgba(59,130,246,0.38)', '0 0 0px 0px rgba(59,130,246,0.2)'] }
            : { boxShadow: '0 0 8px 1px rgba(59,130,246,0.2)' }
        }
        transition={
          isTyping
            ? { duration: 0.65, repeat: Infinity, ease: 'easeInOut' }
            : pulse
            ? { duration: 2.8, repeat: Infinity, ease: 'easeInOut' }
            : {}
        }
      />

      {/* Body */}
      <div
        className="relative w-full h-full rounded-2xl flex items-center justify-center overflow-hidden border border-blue-400/30"
        style={{
          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 50%, #60a5fa 100%)',
          boxShadow: '0 4px 20px rgba(59,130,246,0.38), inset 0 1px 0 rgba(255,255,255,0.18)',
        }}
      >
        {/* Shimmer sweep */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.35) 50%, transparent 80%)',
            backgroundSize: '200% 100%',
            animation: 'ai-shimmer 2.8s ease-in-out infinite',
          }}
        />

        {/* S face SVG */}
        <svg width="28" height="28" viewBox="0 0 28 28" fill="none" className="relative z-10">
          {/* S letter */}
          <text x="14" y="21" textAnchor="middle" fontSize="22" fontWeight="900"
            fontFamily="system-ui, -apple-system, sans-serif" fill="white">
            S
          </text>
          {/* Left eye */}
          <motion.ellipse
            cx="9" cy="8"
            rx="2" ry={blink ? 0.3 : 2}
            fill="white"
            animate={{ ry: blink ? 0.3 : 2 }}
            transition={{ duration: 0.07 }}
          />
          {/* Right eye */}
          <motion.ellipse
            cx="19" cy="8"
            rx="2" ry={blink ? 0.3 : 2}
            fill="white"
            animate={{ ry: blink ? 0.3 : 2 }}
            transition={{ duration: 0.07 }}
          />
          {!blink && (
            <>
              <circle cx="9.6" cy="8.7" r="0.8" fill="#1e3a8a" />
              <circle cx="19.6" cy="8.7" r="0.8" fill="#1e3a8a" />
              <circle cx="10.3" cy="8" r="0.4" fill="white" opacity="0.85" />
              <circle cx="20.3" cy="8" r="0.4" fill="white" opacity="0.85" />
            </>
          )}
          {/* Mouth */}
          {happy ? (
            <path d="M10 23.5 Q14 27 18 23.5" stroke="white" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          ) : isTyping ? (
            <ellipse cx="14" cy="24.5" rx="2.2" ry="1.6" stroke="white" strokeWidth="1.3" fill="none" />
          ) : (
            <path d="M11 23.5 Q14 26 17 23.5" stroke="white" strokeWidth="1.3" fill="none" strokeLinecap="round" />
          )}
        </svg>
      </div>
    </motion.div>
  );
}

// ── ELECTRIC PARTICLE BURST ON OPEN ────────────────────────────────────────
function ElectricBurst({ active }: { active: boolean }) {
  const particles = useMemo(() =>
    Array.from({ length: 14 }, (_, i) => ({
      id: i,
      angle: (i / 14) * 360 + Math.random() * 10,
      distance: 70 + Math.random() * 50,
      size: 3 + Math.random() * 4,
      delay: Math.random() * 0.12,
    })), []);

  if (!active) return null;

  return (
    <div className="pointer-events-none absolute inset-0 flex items-center justify-center z-50 overflow-hidden rounded-[2rem]">
      {particles.map((p) => {
        const rad = (p.angle * Math.PI) / 180;
        const tx = Math.cos(rad) * p.distance;
        const ty = Math.sin(rad) * p.distance;
        return (
          <motion.div
            key={p.id}
            className="absolute rounded-full bg-blue-400"
            style={{ width: p.size, height: p.size, top: '50%', left: '50%' }}
            initial={{ x: -p.size / 2, y: -p.size / 2, scale: 0, opacity: 1 }}
            animate={{ x: tx, y: ty, scale: [0, 1.6, 0], opacity: [1, 0.7, 0] }}
            transition={{ duration: 0.55, delay: p.delay, ease: [0, 0.55, 0.45, 1] }}
          />
        );
      })}
      {/* Centre flash */}
      <motion.div
        className="absolute inset-0 rounded-[2rem]"
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.4, 0] }}
        transition={{ duration: 0.45, ease: 'easeOut' }}
        style={{ background: 'radial-gradient(circle at 50% 30%, rgba(59,130,246,0.65) 0%, transparent 65%)' }}
      />
    </div>
  );
}

// ── FLOATING AMBIENT SPARKLE ────────────────────────────────────────────────
function FloatingSparkle({ x, y, delay }: { x: number; y: number; delay: number }) {
  return (
    <motion.div
      className="pointer-events-none absolute z-0"
      style={{ left: `${x}%`, top: `${y}%` }}
      initial={{ opacity: 0, scale: 0, y: 0 }}
      animate={{ opacity: [0, 0.55, 0], scale: [0, 1, 0.4], y: -18 }}
      transition={{ duration: 2, delay, repeat: Infinity, repeatDelay: 3.5 + delay }}
    >
      <svg width="7" height="7" viewBox="0 0 7 7">
        <path d="M3.5 0L4.1 2.9L7 3.5L4.1 4.1L3.5 7L2.9 4.1L0 3.5L2.9 2.9Z" fill="rgba(96,165,250,0.75)" />
      </svg>
    </motion.div>
  );
}

// ────────────────────────────────────────────────────────────────────────────
export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [showElectric, setShowElectric] = useState(false);
  const [mascotSending, setMascotSending] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  // Fire electric burst on open
  useEffect(() => {
    if (isOpen) {
      setShowElectric(true);
      const elecT = setTimeout(() => setShowElectric(false), 700);
      setTimeout(() => inputRef.current?.focus(), 200);
      if (messages.length === 0) {
        setIsTyping(true);
        const msgT = setTimeout(() => {
          setIsTyping(false);
          setMessages([{
            role: 'ai',
            content: "Hey! I'm Swipess AI — your personal property concierge. ✨\n\nI can help you find your dream space, check your matches, or explain how tokens work.\n\nWhat are you looking for today?",
            timestamp: Date.now()
          }]);
        }, 1200);
        return () => { clearTimeout(elecT); clearTimeout(msgT); };
      }
      return () => clearTimeout(elecT);
    } else {
      const t = setTimeout(() => { setMessages([]); setQuery(''); }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
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
    setMascotSending(true);
    setTimeout(() => setMascotSending(false), 600);

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
    if (route) { navigate(route); handleClose(); }
  }, [navigate, handleClose]);

  const quickPrompts = useMemo(() => [
    { icon: Home, label: 'Properties', text: 'Show me apartments to rent', color: 'text-blue-400', bg: isDark ? 'bg-blue-500/10 border-blue-500/20' : 'bg-blue-50 border-blue-200' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?', color: 'text-pink-400', bg: isDark ? 'bg-pink-500/10 border-pink-500/20' : 'bg-pink-50 border-pink-200' },
    { icon: Zap, label: 'Tokens', text: 'How do tokens work?', color: 'text-amber-400', bg: isDark ? 'bg-amber-500/10 border-amber-500/20' : 'bg-amber-50 border-amber-200' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat?', color: 'text-emerald-400', bg: isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200' },
  ], [isDark]);

  const sparkles = useMemo(() => [
    { x: 12, y: 18, delay: 0 },
    { x: 82, y: 12, delay: 0.9 },
    { x: 88, y: 58, delay: 1.7 },
    { x: 8, y: 72, delay: 2.5 },
    { x: 48, y: 4, delay: 1.3 },
  ], []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[420px] w-[calc(100%-16px)] max-h-[82vh] border p-0 overflow-hidden rounded-[2rem] shadow-2xl outline-none !flex !flex-col !gap-0",
          isDark ? "bg-background border-blue-500/20" : "bg-white border-blue-200/70"
        )}
        style={{
          boxShadow: isDark
            ? '0 0 0 1px rgba(59,130,246,0.15), 0 24px 80px rgba(0,0,0,0.55), 0 0 50px rgba(59,130,246,0.1)'
            : '0 0 0 1px rgba(59,130,246,0.12), 0 24px 80px rgba(0,0,0,0.15), 0 0 35px rgba(59,130,246,0.08)',
        }}
        hideCloseButton={true}
      >
        <AnimatePresence mode="wait">
          {isOpen && (
            <motion.div
              variants={dialogMotion}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="flex flex-col h-full max-h-[82vh] relative"
            >
              {/* Electric burst on open */}
              <ElectricBurst active={showElectric} />

              {/* Ambient floating sparkles */}
              {messages.length > 0 && sparkles.map((s, i) => (
                <FloatingSparkle key={i} {...s} />
              ))}

              {/* ── HEADER ──────────────────────────────────────────────── */}
              <div
                className={cn(
                  "relative px-5 py-4 border-b flex items-center justify-between overflow-hidden",
                  isDark ? "border-blue-500/15" : "border-blue-100"
                )}
                style={{
                  background: isDark
                    ? 'linear-gradient(135deg, rgba(30,58,138,0.28) 0%, rgba(37,99,235,0.10) 100%)'
                    : 'linear-gradient(135deg, rgba(219,234,254,0.9) 0%, rgba(239,246,255,0.7) 100%)',
                }}
              >
                {/* Animated top border line */}
                <div
                  className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
                  style={{
                    background: 'linear-gradient(90deg, transparent 0%, rgba(59,130,246,0.7) 30%, rgba(147,197,253,1) 50%, rgba(59,130,246,0.7) 70%, transparent 100%)',
                    backgroundSize: '200% 100%',
                    animation: 'ai-shimmer 2.5s ease-in-out infinite',
                  }}
                />

                <div className="flex items-center gap-3 relative z-10">
                  <SMascot isTyping={isTyping} isSending={mascotSending} pulse={!isTyping && !mascotSending} />
                  <div>
                    <h2 className="font-bold text-base tracking-tight leading-none mb-1 text-foreground">
                      Swipess AI
                    </h2>
                    <div className="flex items-center gap-1.5">
                      <motion.div
                        className="w-1.5 h-1.5 rounded-full bg-blue-400"
                        animate={{ scale: [1, 1.5, 1], opacity: [1, 0.6, 1] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut' }}
                      />
                      <p
                        className="text-[10px] font-bold uppercase tracking-widest bg-clip-text text-transparent"
                        style={{ backgroundImage: 'linear-gradient(90deg, #3b82f6, #60a5fa, #93c5fd)' }}
                      >
                        {isTyping ? 'Thinking...' : 'Online · Ready'}
                      </p>
                    </div>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleClose}
                  className={cn(
                    "h-9 w-9 rounded-xl transition-colors border relative z-10",
                    isDark
                      ? "hover:bg-blue-500/10 border-blue-500/20 text-muted-foreground hover:text-foreground"
                      : "hover:bg-blue-50 border-blue-200 text-gray-500 hover:text-gray-900"
                  )}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              {/* ── MESSAGES ────────────────────────────────────────────── */}
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-5 scroll-smooth scrollbar-none relative">

                {/* Empty / loading state */}
                {messages.length === 0 && !isTyping && (
                  <motion.div
                    initial={{ opacity: 0, y: 24 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center space-y-4 py-8"
                  >
                    <motion.div
                      className="mx-auto"
                      style={{ width: 88, height: 88 }}
                      animate={{ y: [0, -7, 0] }}
                      transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                      <div
                        className="w-full h-full rounded-[1.5rem] flex items-center justify-center relative overflow-hidden border border-blue-400/30"
                        style={{
                          background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 55%, #60a5fa 100%)',
                          boxShadow: '0 10px 36px rgba(59,130,246,0.45), inset 0 1px 0 rgba(255,255,255,0.2)',
                        }}
                      >
                        <div
                          className="absolute inset-0 pointer-events-none"
                          style={{ background: 'linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.38) 50%, transparent 80%)', backgroundSize: '200% 100%', animation: 'ai-shimmer 2.5s ease-in-out infinite' }}
                        />
                        <svg width="54" height="54" viewBox="0 0 54 54" fill="none" className="relative z-10">
                          <text x="27" y="38" textAnchor="middle" fontSize="38" fontWeight="900" fontFamily="system-ui, -apple-system, sans-serif" fill="white">S</text>
                          <ellipse cx="17.5" cy="14" rx="4.5" ry="4.5" fill="white" />
                          <ellipse cx="36.5" cy="14" rx="4.5" ry="4.5" fill="white" />
                          <circle cx="19" cy="15.5" r="2" fill="#1e3a8a" />
                          <circle cx="38" cy="15.5" r="2" fill="#1e3a8a" />
                          <circle cx="20" cy="14.2" r="1" fill="white" opacity="0.85" />
                          <circle cx="39" cy="14.2" r="1" fill="white" opacity="0.85" />
                          <path d="M20 43 Q27 48 34 43" stroke="white" strokeWidth="2.8" fill="none" strokeLinecap="round" />
                        </svg>
                      </div>
                    </motion.div>
                    <div>
                      <p className="font-bold text-foreground">Connecting to Swipess AI</p>
                      <p className="text-muted-foreground text-sm mt-1">Your personal concierge is ready...</p>
                    </div>
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
                        {/* Avatar */}
                        <div className="flex-shrink-0 mt-0.5">
                          {message.role === 'ai' ? (
                            <div
                              className="w-8 h-8 rounded-xl flex items-center justify-center border border-blue-400/25 overflow-hidden"
                              style={{
                                background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)',
                                boxShadow: '0 2px 10px rgba(59,130,246,0.3)',
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                                <text x="9" y="13.5" textAnchor="middle" fontSize="13" fontWeight="900" fontFamily="system-ui" fill="white">S</text>
                                <ellipse cx="5.5" cy="5" rx="1.8" ry="1.8" fill="white" />
                                <ellipse cx="12.5" cy="5" rx="1.8" ry="1.8" fill="white" />
                              </svg>
                            </div>
                          ) : (
                            <div className={cn(
                              "w-8 h-8 rounded-xl flex items-center justify-center border overflow-hidden",
                              isDark ? "bg-muted border-border" : "bg-gray-100 border-gray-200"
                            )}>
                              {userAvatar
                                ? <img src={userAvatar} alt="Me" className="w-full h-full object-cover" />
                                : <User className="w-4 h-4 text-muted-foreground" />
                              }
                            </div>
                          )}
                        </div>

                        {/* Bubble */}
                        <div className={cn(
                          "max-w-[85%] px-4 py-3 text-[13px] font-medium leading-relaxed whitespace-pre-line",
                          message.role === 'user'
                            ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-[1.25rem] rounded-tr-md shadow-lg shadow-blue-500/20"
                            : cn(
                              "rounded-[1.25rem] rounded-tl-md border",
                              isDark
                                ? "bg-blue-500/8 border-blue-500/15 text-foreground"
                                : "bg-blue-50/80 border-blue-100 text-gray-800 shadow-sm"
                            )
                        )}>
                          {message.content}
                        </div>
                      </div>

                      {message.role === 'ai' && message.showAction && message.actionRoute && (
                        <Button
                          size="sm"
                          onClick={() => handleAction(message.actionRoute)}
                          className="flex items-center gap-2 px-6 h-10 rounded-full text-white shadow-lg ml-12 uppercase tracking-widest text-[10px] bg-gradient-to-r from-blue-500 to-blue-600"
                        >
                          {message.actionLabel || 'View'}
                          <ArrowRight className="w-4 h-4" />
                        </Button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>

                {/* Typing dots */}
                {isTyping && (
                  <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-3 pl-1">
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center border border-blue-400/25 flex-shrink-0"
                      style={{ background: 'linear-gradient(135deg, #1e3a8a 0%, #2563eb 100%)' }}
                    >
                      <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                        <text x="8" y="12" textAnchor="middle" fontSize="11" fontWeight="900" fontFamily="system-ui" fill="white">S</text>
                      </svg>
                    </div>
                    <div className={cn(
                      "px-4 py-3 rounded-[1.25rem] rounded-tl-md text-xs font-semibold flex items-center gap-2 border",
                      isDark ? "bg-blue-500/10 border-blue-500/20 text-blue-300" : "bg-blue-50 border-blue-100 text-blue-600"
                    )}>
                      <div className="flex gap-1">
                        {[0, 0.15, 0.3].map((delay, i) => (
                          <motion.span
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400"
                            animate={{ y: [0, -4, 0] }}
                            transition={{ duration: 0.6, repeat: Infinity, delay }}
                          />
                        ))}
                      </div>
                      <span>Thinking</span>
                    </div>
                  </motion.div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* ── QUICK PROMPTS ────────────────────────────────────────── */}
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

              {/* ── INPUT ────────────────────────────────────────────────── */}
              <div className={cn(
                "p-4 mt-auto border-t relative",
                isDark ? "border-blue-500/15 bg-background/90 backdrop-blur-2xl" : "border-blue-100 bg-white/95 backdrop-blur-2xl"
              )}>
                <div className={cn(
                  "relative rounded-2xl border overflow-hidden transition-all duration-200 focus-within:ring-2 focus-within:ring-blue-400/25",
                  isDark
                    ? "bg-blue-500/5 border-blue-500/20 focus-within:border-blue-400/45"
                    : "bg-blue-50/60 border-blue-200 focus-within:border-blue-400 shadow-inner"
                )}>
                  <textarea
                    ref={inputRef}
                    placeholder="Ask Swipess AI anything..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onKeyDown={handleKeyDown}
                    rows={1}
                    className={cn(
                      "w-full resize-none bg-transparent px-4 py-3 pr-14 text-sm font-medium outline-none placeholder:text-muted-foreground/50",
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
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-lg shadow-blue-500/25 hover:scale-105"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                  </Button>
                </div>
                <p className="text-center text-[9px] font-bold uppercase tracking-widest mt-2 text-muted-foreground/35">
                  Powered by Swipess AI
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Keyframes */}
        <style>{`
          @keyframes ai-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );

  function applyQuickPrompt(text: string) {
    setQuery(text);
    inputRef.current?.focus();
  }
}
