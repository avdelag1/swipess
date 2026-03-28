import { useState, useRef, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
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
  User
} from 'lucide-react';
import { useConciergeAI } from '@/hooks/useConciergeAI';
import { useTheme } from '@/hooks/useTheme';
import { useUserSubscription } from '@/hooks/useSubscription';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { haptics } from '@/utils/microPolish';

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
  const isDark = theme === 'dark';
  const [input, setInput] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const { 
    messages, 
    isLoading, 
    error, 
    sendMessage, 
    clearMessages,
    isConfigured 
  } = useConciergeAI();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

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

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const quickSuggestions = [
    { icon: MapPin, label: 'Nearby restaurants', prompt: `What are the best restaurants near the beach in ${initialCity}?` },
    { icon: Building2, label: 'Find apartment', prompt: 'Find me a pet-friendly apartment under $1000 near the beach' },
    { icon: Car, label: 'Car rental', prompt: 'What car rental options are available near the airport?' },
    { icon: Sparkles, label: 'Area guide', prompt: `Tell me about the best neighborhoods in ${initialCity} for families` },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className={cn(
          "max-w-md w-[calc(100%-16px)] h-[85vh] max-h-[750px] flex flex-col p-0 gap-0 overflow-hidden rounded-[2rem]",
          isDark 
            ? "bg-gradient-to-br from-zinc-900 via-zinc-800 to-zinc-900 border-zinc-700/50" 
            : "bg-white border-gray-200"
        )}
        hideCloseButton
      >
        {/* Header */}
        <div className={cn(
          "flex items-center justify-between px-5 py-4 border-b shrink-0",
          isDark ? "border-zinc-700/50" : "border-gray-100"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-10 h-10 rounded-xl flex items-center justify-center",
              isDark 
                ? "bg-gradient-to-br from-cyan-500 to-blue-600" 
                : "bg-gradient-to-br from-cyan-400 to-blue-500"
            )}>
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className={cn("font-bold text-lg", isDark ? "text-white" : "text-gray-900")}>
                  Vibe
                </h2>
                {userRole === 'owner' || (subscription?.subscription_packages?.tier === 'premium' || subscription?.subscription_packages?.tier === 'unlimited') && (
                  <span className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-bold uppercase tracking-wider border border-amber-500/20">
                    <Sparkles className="w-2.5 h-2.5" />
                    Premium
                  </span>
                )}
              </div>
              <p className={cn("text-xs", isDark ? "text-zinc-400" : "text-gray-500")}>
                Personal Assistant for {initialCity}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                clearMessages();
              }}
              className={cn("h-9 w-9 rounded-lg", isDark ? "text-zinc-400 hover:text-white hover:bg-zinc-800" : "text-gray-500 hover:text-gray-900 hover:bg-gray-100")}
            >
              <RefreshCw className="w-4 h-4" />
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
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-4"
              >
                <div className={cn(
                  "p-4 rounded-2xl text-center",
                  isDark ? "bg-zinc-800/50" : "bg-gray-50"
                )}>
                  <Sparkles className={cn("w-8 h-8 mx-auto mb-2", isDark ? "text-cyan-400" : "text-cyan-500")} />
                  <p className={cn("font-medium", isDark ? "text-white" : "text-gray-900")}>
                    Hello! I'm your {initialCity} Concierge
                  </p>
                  <p className={cn("text-sm mt-1", isDark ? "text-zinc-400" : "text-gray-500")}>
                    How can I assist you with your listings or local information today?
                  </p>
                </div>

                {/* Quick suggestions */}
                <div className="grid grid-cols-2 gap-2">
                  {quickSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        haptics.tap();
                        setInput(suggestion.prompt);
                      }}
                      className={cn(
                        "flex items-center gap-2 p-3 rounded-xl text-left transition-all hover:scale-[1.02]",
                        isDark 
                          ? "bg-zinc-800/60 hover:bg-zinc-700/60 border border-zinc-700/30" 
                          : "bg-gray-50 hover:bg-gray-100 border border-gray-200"
                      )}
                    >
                      <suggestion.icon className={cn("w-4 h-4 shrink-0", isDark ? "text-cyan-400" : "text-cyan-500")} />
                      <span className={cn("text-xs font-medium", isDark ? "text-zinc-300" : "text-gray-600")}>
                        {suggestion.label}
                      </span>
                    </button>
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
                    "max-w-[80%] p-3 rounded-2xl",
                    message.role === 'user'
                      ? isDark 
                        ? "bg-gradient-to-r from-cyan-600 to-blue-600 text-white"
                        : "bg-gradient-to-r from-cyan-500 to-blue-500 text-white"
                      : isDark 
                        ? "bg-zinc-800 text-zinc-100"
                        : "bg-gray-100 text-gray-900"
                  )}>
                    <p className="text-sm whitespace-pre-wrap">{message.content}</p>
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
                    "flex items-center gap-2 px-4 py-3 rounded-2xl",
                    isDark ? "bg-zinc-800" : "bg-gray-100"
                  )}>
                    <Loader2 className={cn("w-4 h-4 animate-spin", isDark ? "text-zinc-400" : "text-gray-500")} />
                    <span className={cn("text-sm", isDark ? "text-zinc-400" : "text-gray-500")}>
                      Thinking...
                    </span>
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
        </div>
      </DialogContent>
    </Dialog>
  );
}
