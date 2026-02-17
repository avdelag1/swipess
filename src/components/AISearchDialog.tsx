// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAIGeneration } from '@/hooks/ai/useAIGeneration';
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
}

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { generate } = useAIGeneration();

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSearch = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      const result = await generate('search', {
        query: userMessage,
        userRole,
      });

      setIsTyping(false);

      if (result) {
        const aiResponse = (result as any).suggestion || 'Search complete!';

        // Add AI typing indicator first
        setMessages(prev => [...prev, { role: 'ai', content: '', timestamp: Date.now() }]);

        // Animate the AI response
        setTimeout(() => {
          setMessages(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], content: aiResponse };
            return updated;
          });

          // Navigate to filters after showing response
          setTimeout(() => {
            navigateToFilters((result as any));
          }, 2000);
        }, 1000);
      } else {
        // Handle case when AI returns null (error occurred)
        setMessages(prev => [...prev, {
          role: 'ai',
          content: 'Sorry, I had trouble processing your request. Please try again or contact support if the issue persists.',
          timestamp: Date.now()
        }]);
      }
    } catch (error) {
      setIsTyping(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      console.error('AI search error:', errorMessage, error);

      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I had trouble processing your request. Please try again or contact support if the issue persists.',
        timestamp: Date.now()
      }]);

      // Show toast for better visibility
      toast.error('AI request failed. Please try again.');
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole, generate, navigate]);

  const navigateToFilters = (result: Record<string, any>) => {
    const params = new URLSearchParams();
    
    if (result.category) params.set('category', result.category);
    if (result.priceMin) params.set('priceMin', result.priceMin.toString());
    if (result.priceMax) params.set('priceMax', result.priceMax.toString());
    if (result.keywords && result.keywords.length > 0) {
      params.set('keywords', result.keywords.join(','));
    }

    const filterPath = userRole === 'owner' ? '/owner/filters' : '/client/filters';
    navigate(`${filterPath}?${params.toString()}`);
    handleClose();
  };

  const handleClose = () => {
    onClose();
    setQuery('');
    setMessages([]);
    setIsSearching(false);
    setIsTyping(false);
  };

  const quickPrompts = [
    "Apartments under $5000",
    "Red motorcycle in Cancun",
    "Mountain bike for rent",
    "Electrician near downtown",
  ];

  const applyQuickPrompt = (prompt: string) => {
    setQuery(prompt);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden"
        hideCloseButton={true}
        style={{ 
          '--modal-radius': '24px' 
        } as React.CSSProperties}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-orange-500/20 via-red-500/10 to-purple-500/10 px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-white" />
              </div>
              {/* Online indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1C1C1E]" />
            </div>
            
            <div>
              <h2 className="text-white font-semibold text-sm">AI Search</h2>
              <div className="flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                <span className="text-xs text-white/50">Online</span>
              </div>
            </div>
          </div>

          {/* Single Close Button */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white/70" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="h-80 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-3"
            >
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <Sparkles className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">What are you looking for?</h3>
                <p className="text-white/50 text-xs mt-1">Tell me in your own words</p>
              </div>
            </motion.div>
          )}

          <AnimatePresence>
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex gap-2",
                  message.role === 'user' && "justify-end"
                )}
              >
                {message.role === 'ai' && (
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Sparkles className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                  message.role === 'user' 
                    ? "bg-orange-500 text-white rounded-br-md" 
                    : "bg-white/10 text-white/90 rounded-bl-md",
                  isTyping && message.role === 'ai' && message.content === ''
                    ? "animate-pulse"
                    : ""
                )}>
                  {message.role === 'ai' && message.content === '' ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  ) : (
                    message.content
                  )}
                </div>

                {message.role === 'user' && (
                  <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                    <span className="text-white text-[10px] font-medium">You</span>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 text-white/50 text-xs pl-8"
            >
              <Loader2 className="w-3 h-3 animate-spin" />
              Processing...
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt)}
                  className="px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all active:scale-95"
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#121214]/50">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Describe what you're looking for..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="pr-20 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-orange-500/50 focus:border-orange-500/50"
              disabled={isSearching}
            />
            
            <Button
              size="sm"
              onClick={handleSearch}
              disabled={!query.trim() || isSearching}
              className={cn(
                "absolute right-1 top-1 bottom-1 rounded-lg px-4 h-auto",
                query.trim() 
                  ? "bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-400 hover:to-red-400" 
                  : "bg-white/10"
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
