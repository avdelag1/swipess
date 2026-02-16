// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Circle, Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAIGeneration } from '@/hooks/ai/useAIGeneration';

interface AISearchDialogProps {
  isOpen: boolean;
  onClose: () => void;
  userRole?: 'client' | 'owner';
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  filterData?: Record<string, any> | null;
}

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { generate } = useAIGeneration();

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsSearching(true);

    try {
      const result = await generate('search', {
        query: userMessage,
        userRole,
      });

      if (result) {
        const suggestion = (result as any).suggestion || "I found some results for you!";
        const hasFilters = (result as any).category || (result as any).priceMin || (result as any).priceMax || ((result as any).keywords?.length > 0);

        setMessages(prev => [...prev, {
          role: 'ai',
          content: suggestion,
          timestamp: Date.now(),
          filterData: hasFilters ? result : null,
        }]);
      } else {
        setMessages(prev => [...prev, {
          role: 'ai',
          content: "I can help you find properties, motorcycles, bicycles, or services. Try describing what you're looking for!",
          timestamp: Date.now(),
        }]);
      }
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I had trouble processing that. Please try again.',
        timestamp: Date.now(),
      }]);
      console.error('AI search error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, generate]);

  const navigateToFilters = (filterData: Record<string, any>) => {
    const params = new URLSearchParams();
    if (filterData.category) params.set('category', filterData.category);
    if (filterData.priceMin) params.set('priceMin', filterData.priceMin.toString());
    if (filterData.priceMax) params.set('priceMax', filterData.priceMax.toString());
    if (filterData.keywords?.length > 0) params.set('keywords', filterData.keywords.join(','));

    const filterPath = userRole === 'owner' ? '/owner/filters' : '/client/filters';
    navigate(`${filterPath}?${params.toString()}`);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setMessages([]);
    setIsSearching(false);
  };

  const quickPrompts = [
    "Apartments under $5000",
    "Red motorcycle in Cancun",
    "Mountain bike for rent",
    "Electrician near downtown",
  ];

  const applyQuickPrompt = (prompt: string) => {
    setQuery(prompt);
    inputRef.current?.focus();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md bg-[#0F0F11]/98 backdrop-blur-3xl border border-white/8 p-0 overflow-hidden rounded-[28px]"
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500/15 via-red-500/8 to-purple-500/8 px-5 py-4 border-b border-white/6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#0F0F11]" />
            </div>
            <div>
              <h2 className="text-white font-bold text-[15px] tracking-tight">AI Search</h2>
              <div className="flex items-center gap-1.5">
                <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                <span className="text-[11px] text-white/40 font-medium">Online</span>
              </div>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-9 w-9 rounded-full bg-white/6 hover:bg-white/12 transition-colors"
          >
            <X className="w-4 h-4 text-white/60" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="h-[340px] overflow-y-auto px-5 py-5 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
              className="text-center space-y-4 pt-6"
            >
              <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-orange-500/15 to-red-500/10 flex items-center justify-center border border-white/5">
                <Sparkles className="w-8 h-8 text-orange-400/80" />
              </div>
              <div>
                <h3 className="text-white font-semibold text-base tracking-tight">What are you looking for?</h3>
                <p className="text-white/40 text-sm mt-1.5 font-medium">Tell me in your own words</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 10, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                className={cn("flex gap-2.5", message.role === 'user' && "justify-end")}
              >
                {message.role === 'ai' && (
                  <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 mt-0.5 shadow-md shadow-orange-500/15">
                    <Sparkles className="w-3.5 h-3.5 text-white" />
                  </div>
                )}

                <div className="flex flex-col gap-2 max-w-[78%]">
                  <div className={cn(
                    "px-4 py-2.5 text-[13px] leading-relaxed",
                    message.role === 'user'
                      ? "bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-2xl rounded-br-lg shadow-md shadow-orange-500/15"
                      : "bg-white/6 text-white/85 rounded-2xl rounded-bl-lg border border-white/5"
                  )}>
                    {message.content}
                  </div>

                  {/* Show "Apply Filters" button if AI detected search filters */}
                  {message.filterData && (
                    <motion.button
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => navigateToFilters(message.filterData!)}
                      className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500/15 to-red-500/10 border border-orange-500/20 rounded-2xl text-orange-300 text-xs font-semibold hover:from-orange-500/25 hover:to-red-500/15 transition-all active:scale-[0.97] self-start"
                    >
                      <Search className="w-3.5 h-3.5" />
                      Apply filters & search
                      <ArrowRight className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-7 h-7 rounded-full bg-white/8 flex items-center justify-center flex-shrink-0 mt-0.5 border border-white/6">
                    <span className="text-white text-[9px] font-bold">You</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isSearching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2.5"
            >
              <div className="w-7 h-7 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 shadow-md shadow-orange-500/15">
                <Sparkles className="w-3.5 h-3.5 text-white" />
              </div>
              <div className="px-4 py-2.5 bg-white/6 rounded-2xl rounded-bl-lg border border-white/5">
                <div className="flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="px-5 pb-3">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt)}
                  className="px-3.5 py-2 text-xs font-medium bg-white/4 hover:bg-white/8 border border-white/8 hover:border-white/15 rounded-2xl text-white/60 hover:text-white/90 transition-all active:scale-[0.96]"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#0A0A0C]/60">
          <div className="relative flex items-center gap-2">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 h-12 bg-white/5 border-white/8 text-white placeholder:text-white/30 rounded-2xl focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500/30 text-sm"
              disabled={isSearching}
            />

            <Button
              size="icon"
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className={cn(
                "h-10 w-10 rounded-xl flex-shrink-0 transition-all",
                query.trim()
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400 shadow-lg shadow-orange-500/20"
                  : "bg-white/8"
              )}
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
