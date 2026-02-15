// @ts-nocheck
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Sparkles, Loader2, X, Send, Circle, FileText, HelpCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAIGeneration } from '@/hooks/ai/useAIGeneration';
import { toast } from 'sonner';

interface LegalAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  context?: {
    listingId?: string;
    userRole?: 'client' | 'owner';
    conversationId?: string;
  };
}

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  type?: 'general' | 'document' | 'advice' | 'warning';
}

const QUICK_QUESTIONS = [
  { label: "Lease agreement", icon: FileText },
  { label: "Buying process", icon: HelpCircle },
  { label: "Dispute help", icon: AlertTriangle },
  { label: "Documents needed", icon: CheckCircle },
];

export function LegalAIAssistant({ isOpen, onClose, context }: LegalAIAssistantProps) {
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

  const handleAsk = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { 
      role: 'user', 
      content: userMessage, 
      timestamp: Date.now(),
      type: 'general'
    }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      const result = await generate('legal', {
        query: userMessage,
        context: context,
      });

      setIsTyping(false);

      if (result) {
        const aiResponse = (result as any).answer || (result as any).message || 'I can help you with legal information about real estate, contracts, and property transactions.';
        const responseType = (result as any).type || 'general';
        
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: aiResponse, 
          timestamp: Date.now(),
          type: responseType
        }]);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'I apologize, but I had trouble processing your request. Please try again or rephrase your question.', 
        timestamp: Date.now(),
        type: 'warning'
      }]);
      console.error('Legal AI error:', error);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, context, generate]);

  const handleClose = () => {
    onClose();
    setQuery('');
    setMessages([]);
    setIsSearching(false);
    setIsTyping(false);
  };

  const applyQuickQuestion = (question: string) => {
    setQuery(question);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent 
        className="sm:max-w-md bg-[#1C1C1E]/95 backdrop-blur-2xl border border-white/10 p-0 overflow-hidden"
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="relative bg-gradient-to-r from-blue-500/20 via-purple-500/10 to-orange-500/10 px-4 py-3 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="relative">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <Scale className="w-4 h-4 text-white" />
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-[#1C1C1E]" />
            </div>
            
            <div>
              <h2 className="text-white font-semibold text-sm">Legal Assistant</h2>
              <div className="flex items-center gap-1">
                <Circle className="w-1.5 h-1.5 fill-green-500 text-green-500" />
                <span className="text-xs text-white/50">AI Lawyer</span>
              </div>
            </div>
          </div>

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
              <div className="w-14 h-14 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
                <Scale className="w-7 h-7 text-blue-400" />
              </div>
              <div>
                <h3 className="text-white font-medium text-sm">Legal Assistant</h3>
                <p className="text-white/50 text-xs mt-1">Ask about contracts, leases, disputes, and more</p>
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
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                    <Scale className="w-3 h-3 text-white" />
                  </div>
                )}
                
                <div className={cn(
                  "max-w-[75%] px-3 py-2 rounded-2xl text-sm",
                  message.role === 'user' 
                    ? "bg-blue-500 text-white rounded-br-md" 
                    : message.type === 'warning'
                      ? "bg-red-500/20 text-red-300 border border-red-500/30 rounded-bl-md"
                      : "bg-white/10 text-white/90 rounded-bl-md",
                  isTyping && message.role === 'ai' && message.content === ''
                    ? "animate-pulse"
                    : ""
                )}>
                  {message.role === 'ai' && message.content === '' ? (
                    <div className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
              Analyzing legal information...
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        {messages.length === 0 && (
          <div className="px-4 pb-2">
            <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  onClick={() => applyQuickQuestion(`How do I create a ${q.label.toLowerCase()}?`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all active:scale-95"
                >
                  <q.icon className="w-3 h-3" />
                  {q.label}
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
              placeholder="Ask a legal question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              className="pr-20 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
              disabled={isSearching}
            />
            
            <Button
              size="sm"
              onClick={handleAsk}
              disabled={!query.trim() || isSearching}
              className={cn(
                "absolute right-1 top-1 bottom-1 rounded-lg px-4 h-auto",
                query.trim() 
                  ? "bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-400 hover:to-purple-400" 
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

// Quick access button component for placing anywhere
export function LegalAIButton({ className, context }: { className?: string; context?: LegalAIAssistantProps['context'] }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/20 hover:border-blue-500/40 transition-all",
          className
        )}
      >
        <Scale className="w-4 h-4 text-blue-400" />
        <span className="text-sm text-white font-medium">Legal Help</span>
      </button>

      <LegalAIAssistant isOpen={isOpen} onClose={() => setIsOpen(false)} context={context} />
    </>
  );
}
