// @ts-nocheck
/** Context-Aware Legal AI Assistant - Adapts behavior based on section */
import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scale, Sparkles, Loader2, X, Send, Circle, FileText, HelpCircle, AlertTriangle, CheckCircle, Search, DollarSign, Users, FileCheck, Gavel, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { useAIGeneration } from '@/hooks/ai/useAIGeneration';

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  type?: 'general' | 'document' | 'advice' | 'warning';
}

type LegalContext = 'general' | 'contracts' | 'search' | 'disputes' | 'documents';

const LEGAL_CONTEXTS: { id: LegalContext; label: string; icon: typeof FileText; description: string }[] = [
  { id: 'general', label: 'General', icon: Scale, description: 'General legal questions' },
  { id: 'contracts', label: 'Contracts', icon: FileCheck, description: 'Leases, agreements, documents' },
  { id: 'search', label: 'Buy/Sell', icon: Search, description: 'Property purchase & sale process' },
  { id: 'disputes', label: 'Disputes', icon: Gavel, description: 'Conflicts and resolutions' },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'Required paperwork & forms' },
];

export default function LegalServicesPage() {
  const [activeContext, setActiveContext] = useState<LegalContext>('general');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { generate } = useAIGeneration();

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-focus input when context changes
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, [activeContext]);

  const getSystemPrompt = useCallback((context: LegalContext): string => {
    const prompts: Record<LegalContext, string> = {
      general: `You are a knowledgeable legal assistant specializing in Mexican real estate law.

IMPORTANT: You are an AI assistant, NOT a lawyer. Always include a disclaimer.

Respond with valid JSON:
{
  "answer": "Your helpful response",
  "type": "general",
  "disclaimer": "Consult a licensed attorney for specific legal advice"
}`,
      
      contracts: `You are an expert in real estate CONTRACTS and LEASES in Mexico.

Help users with:
- Lease agreements
- Purchase contracts
- Rental agreements
- Contract clauses and terms
- What to look for before signing
- Common contract pitfalls

IMPORTANT: You are an AI assistant, NOT a lawyer. Always include a disclaimer.

Respond with valid JSON:
{
  "answer": "Your detailed contract advice",
  "type": "document",
  "disclaimer": "Have a lawyer review any contract before signing"
}`,
      
      search: `You are an expert real estate ADVISOR for BUYING and SELLING property in Mexico.

Guide users through:
- Property purchase process in Mexico
- Selling procedures and requirements
- Pricing strategies
- Due diligence checklist
- Closing costs and taxes
- Notary public requirements
- Title search and verification

IMPORTANT: You are an AI assistant, NOT a lawyer or real estate agent.

Respond with valid JSON:
{
  "answer": "Your step-by-step guidance",
  "type": "advice",
  "disclaimer": "Work with licensed professionals for transactions"
}`,
      
      disputes: `You are a legal ADVISOR for PROPERTY DISPUTES in Mexico.

Help users understand:
- Tenant rights and landlord obligations
- Property boundary disputes
- Noise and nuisance complaints
- Security deposit disputes
- Eviction processes
- Neighbor conflicts
- Contract violations

IMPORTANT: You are an AI assistant, NOT a lawyer.

Respond with valid JSON:
{
  "answer": "Your dispute resolution guidance",
  "type": "advice",
  "disclaimer": "For serious disputes, consult a licensed attorney"
}`,
      
      documents: `You are a DOCUMENT EXPERT for MEXICAN REAL ESTATE.

Help users with:
- What documents are needed for transactions
- How to obtain each document
- Which government offices to visit
- Document translation requirements
- Apostille and legalization
- Registration procedures

IMPORTANT: You are an AI assistant, NOT a lawyer or notary.

Respond with valid JSON:
{
  "answer": "Your document guidance",
  "type": "document",
  "disclaimer": "Documents must be verified by official authorities"
}`,
    };

    return prompts[context] || prompts.general;
  }, []);

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
      const systemPrompt = getSystemPrompt(activeContext);
      
      const result = await fetch(
        'https://vplgtcguxujxwrgguxqq.functions.supabase.co/ai-orchestrator',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwbGd0Y3d1eWp4d3JnZ3V4cXEiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTczMjc2NjAwMCwiZXhwIjo0ODg4MzI2MDAwfQ.VxVxVxVxVxVxVxVxVxVxVxVxVxVxVxVxVxVxVx'
          },
          body: JSON.stringify({
            task: 'legal',
            data: {
              query: userMessage,
              context: { userRole: 'client' }
            },
            systemPrompt
          })
        }
      );

      const data = await result.json();
      setIsTyping(false);

      if (data.answer) {
        setMessages(prev => [...prev, { 
          role: 'ai', 
          content: data.answer, 
          timestamp: Date.now(),
          type: data.type || 'general'
        }]);
      } else {
        throw new Error('No answer from AI');
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
  }, [query, isSearching, activeContext, getSystemPrompt]);

  const activeContextInfo = LEGAL_CONTEXTS.find(c => c.id === activeContext)!;

  return (
    <div className="min-h-screen bg-[#0a0a0a] pb-32">
      {/* Header with Context Selector */}
      <div className="sticky top-0 z-20 bg-[#0a0a0a]/95 backdrop-blur-lg border-b border-white/5">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-semibold text-white">Legal Services</h1>
          </div>

          {/* Context Selector - Horizontal Scroll */}
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {LEGAL_CONTEXTS.map((context) => (
              <button
                key={context.id}
                onClick={() => setActiveContext(context.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-lg whitespace-nowrap text-sm transition-all",
                  activeContext === context.id
                    ? "bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30 text-white"
                    : "bg-white/5 border border-white/10 text-white/60 hover:bg-white/10"
                )}
              >
                <context.icon className="w-4 h-4" />
                <span>{context.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Context Description */}
      <div className="px-4 py-3 border-b border-white/5">
        <p className="text-xs text-white/50 flex items-center gap-2">
          <activeContextInfo.icon className="w-4 h-4" />
          {activeContextInfo.description}
        </p>
      </div>

      {/* Messages Area */}
      <div className="h-[calc(100vh-250px)] overflow-y-auto px-4 py-4 space-y-4">
        {messages.length === 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 pt-10"
          >
            <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center">
              <activeContextInfo.icon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <h3 className="text-white font-medium">Legal AI Assistant</h3>
              <p className="text-white/50 text-sm mt-1">
                Ask about {activeContextInfo.label.toLowerCase()} in Mexican real estate
              </p>
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
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 mt-1">
                  <activeContextInfo.icon className="w-4 h-4 text-white" />
                </div>
              )}
              
              <div className={cn(
                "max-w-[80%] px-4 py-3 rounded-2xl text-sm",
                message.role === 'user' 
                  ? "bg-blue-500 text-white rounded-br-md" 
                  : message.type === 'warning'
                    ? "bg-red-500/20 text-red-300 border border-red-500/30 rounded-bl-md"
                    : "bg-white/10 text-white/90 rounded-bl-md",
              )}>
                {message.content}
              </div>

              {message.role === 'user' && (
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white text-xs font-medium">You</span>
                </div>
              )}
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 text-white/50 text-xs pl-10"
          >
            <Loader2 className="w-3 h-3 animate-spin" />
            Analyzing your {activeContextInfo.label.toLowerCase()} question...
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a] to-transparent">
        <div className="max-w-2xl mx-auto">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder={`Ask about ${activeContextInfo.label.toLowerCase()}...`}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleAsk()}
              className="pr-20 h-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50"
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
          
          <p className="text-[10px] text-white/30 text-center mt-2">
            AI assistant • {activeContextInfo.label.toLowerCase()} specialist • Consult a lawyer for important matters
          </p>
        </div>
      </div>
    </div>
  );
}
