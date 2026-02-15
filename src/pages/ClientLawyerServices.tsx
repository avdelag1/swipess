// @ts-nocheck
/** SPEED OF LIGHT: Client Legal Services - Context-Aware AI + Form */
import { useState, useRef, useCallback, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Scale, ChevronRight, ChevronDown, ArrowLeft, Shield,
  Send, Loader2, FileText, Search, Gavel, Users, DollarSign
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from 'sonner';
import { cn } from "@/lib/utils";

type LegalContext = 'general' | 'contracts' | 'search' | 'disputes' | 'documents';

const LEGAL_CONTEXTS: { id: LegalContext; label: string; icon: typeof FileText; description: string }[] = [
  { id: 'general', label: 'General', icon: Scale, description: 'General legal questions' },
  { id: 'contracts', label: 'Contracts', icon: FileText, description: 'Leases and agreements' },
  { id: 'search', label: 'Buy/Sell', icon: Search, description: 'Property transactions' },
  { id: 'disputes', label: 'Disputes', icon: Gavel, description: 'Conflicts and resolutions' },
  { id: 'documents', label: 'Documents', icon: FileText, description: 'Paperwork help' },
];

interface Message {
  role: 'user' | 'ai';
  content: string;
  timestamp: number;
  type?: 'general' | 'document' | 'advice' | 'warning';
}

const ClientLawyerServices = () => {
  const navigate = useNavigate();
  const [activeContext, setActiveContext] = useState<LegalContext>('general');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Form state
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);
  const [selectedIssue, setSelectedIssue] = useState<{ category: string; subcategory: string } | null>(null);
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleAskAI = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now(), type: 'general' }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      const response = await fetch(
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
              context: { userRole: 'client', legalContext: activeContext }
            }
          })
        }
      );

      const data = await response.json();
      setIsTyping(false);

      if (data.answer) {
        setMessages(prev => [...prev, { role: 'ai', content: data.answer, timestamp: Date.now(), type: data.type || 'general' }]);
      }
    } catch (error) {
      setIsTyping(false);
      setMessages(prev => [...prev, { 
        role: 'ai', 
        content: 'I apologize, but I had trouble processing your request. Please try again.', 
        timestamp: Date.now(),
        type: 'warning'
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, activeContext]);

  const handleSubmitRequest = async () => {
    if (!selectedIssue || !description.trim()) {
      toast.error('Please select an issue type and provide a description');
      return;
    }

    setIsSubmitting(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setIsSubmitting(false);
    setSubmitted(true);
    toast.success('Legal help request submitted!');
  };

  const activeContextInfo = LEGAL_CONTEXTS.find(c => c.id === activeContext)!;

  return (
    <div className="w-full overflow-x-hidden p-4 sm:p-6 lg:p-8 pb-32">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate(-1)} className="mb-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="text-center">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500/20 to-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Scale className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">Legal Services</h1>
            <p className="text-white/60 text-sm">AI Legal Assistant + Human Support</p>
          </div>
        </div>

        {/* Context Selector */}
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-4">
            <div className="flex gap-2 overflow-x-auto pb-1">
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
          </CardContent>
        </Card>

        {/* AI Chat Section */}
        <Card className="bg-gradient-to-br from-blue-900/20 to-purple-900/20 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <activeContextInfo.icon className="w-5 h-5 text-blue-400" />
              AI {activeContextInfo.label} Expert
            </CardTitle>
            <CardDescription className="text-white/60">
              Ask about {activeContextInfo.label.toLowerCase()} - Instant answers powered by AI
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0 px-4 pb-4">
            {/* Messages */}
            <ScrollArea className="h-64 mb-4">
              {messages.length === 0 ? (
                <div className="text-center py-8">
                  <activeContextInfo.icon className="w-12 h-12 text-white/20 mx-auto mb-3" />
                  <p className="text-white/40 text-sm">
                    Ask me about {activeContextInfo.label.toLowerCase()} in Mexican real estate
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <motion.div
                      key={message.timestamp}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={cn(
                        "flex gap-2",
                        message.role === 'user' && "justify-end"
                      )}
                    >
                      {message.role === 'ai' && (
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                          <activeContextInfo.icon className="w-4 h-4 text-white" />
                        </div>
                      )}
                      <div className={cn(
                        "max-w-[80%] px-3 py-2 rounded-2xl text-sm",
                        message.role === 'user' 
                          ? "bg-blue-500 text-white" 
                          : "bg-white/10 text-white/90"
                      )}>
                        {message.content}
                      </div>
                    </motion.div>
                  ))}
                  {isTyping && (
                    <div className="flex items-center gap-2 text-white/40 text-xs pl-10">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Thinking...
                    </div>
                  )}
                </div>
              )}
              <div ref={messagesEndRef} />
            </ScrollArea>

            {/* Input */}
            <div className="flex gap-2">
              <Input
                ref={inputRef}
                placeholder={`Ask about ${activeContextInfo.label.toLowerCase()}...`}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
                className="bg-white/5 border-white/10 text-white placeholder:text-white/40"
                disabled={isSearching}
              />
              <Button
                onClick={handleAskAI}
                disabled={!query.trim() || isSearching}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Form Section */}
        <Separator className="bg-white/10" />
        
        <div>
          <h2 className="text-xl font-semibold text-white mb-4">Request Human Help</h2>
          
          {submitted ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <Card className="bg-green-900/30 border-green-700/50">
                <CardContent className="p-8 text-center">
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Scale className="w-8 h-8 text-green-400" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">Request Submitted!</h3>
                  <p className="text-gray-300 mb-6">
                    Our legal team will review your case and contact you with options.
                  </p>
                  <Button onClick={() => { setSubmitted(false); setSelectedIssue(null); setDescription(''); }}>
                    Submit Another Request
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">Still need more help?</CardTitle>
                <CardDescription className="text-white/60">
                  Submit a request for human legal assistance
                </CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                {/* Issue Categories */}
                {[
                  { id: 'landlord', title: 'Landlord Issues', icon: Shield, desc: 'Problems with landlord' },
                  { id: 'rent', title: 'Rent & Payments', icon: DollarSign, desc: 'Disputes about payments' },
                  { id: 'contracts', title: 'Contracts', icon: FileText, desc: 'Agreement problems' },
                  { id: 'discrimination', title: 'Discrimination', icon: Users, desc: 'Rights violations' },
                  { id: 'other', title: 'Other', icon: Gavel, desc: 'Other legal matters' },
                ].map((category, index) => (
                  <div key={category.id}>
                    <button
                      onClick={() => setExpandedCategory(expandedCategory === category.id ? null : category.id)}
                      className="w-full p-4 flex items-center gap-4 hover:bg-white/5 transition-colors text-left"
                    >
                      <div className="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center text-blue-400">
                        <category.icon className="w-5 h-5" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-white">{category.title}</h4>
                        <p className="text-sm text-white/40">{category.desc}</p>
                      </div>
                      {expandedCategory === category.id ? <ChevronDown className="w-5 h-5 text-white/40" /> : <ChevronRight className="w-5 h-5 text-white/40" />}
                    </button>
                    {index < 4 && <Separator className="bg-white/5" />}
                  </div>
                ))}

                {expandedCategory && (
                  <motion.div initial={{ height: 0 }} animate={{ height: 'auto' }} className="bg-white/5 p-4">
                    <Label className="text-white">Describe your situation</Label>
                    <Textarea
                      placeholder="What happened? When did it occur? What would you like help with?"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      rows={4}
                      className="mt-2 bg-white/5 border-white/10 text-white placeholder:text-white/40"
                    />
                    <Button
                      onClick={handleSubmitRequest}
                      disabled={isSubmitting || !description.trim()}
                      className="mt-4 w-full bg-gradient-to-r from-blue-500 to-purple-500"
                    >
                      {isSubmitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                      Submit Request
                    </Button>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientLawyerServices;
