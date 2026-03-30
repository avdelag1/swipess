import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Send,
  Sparkles,
  Brain,
  MessageCircle,
  Plus,
  Trash2,
  Clock,
  User,
  Bot,
  Loader2,
  ChevronDown,
  ChevronUp,
  Search,
  Star,
  Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { useAIMemory, AIMemory, AIConversation } from '@/hooks/ai/useAIMemory';
import { SwipessLogo } from './SwipessLogo';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { logger } from '@/utils/prodLogger';
import { haptics } from '@/utils/microPolish';

interface ConciergeChatProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

export function ConciergeChat({ isOpen, onClose }: ConciergeChatProps) {
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const {
    memories,
    conversations,
    isLoading: isMemoryLoading,
    saveMemory,
    getAllMemories,
    getConversations,
    createConversation,
    saveMessage,
    getConversationMessages,
    deleteConversation,
    formatMemoriesForAI,
  } = useAIMemory();

  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [showMemoryPanel, setShowMemoryPanel] = useState(false);
  const [showConversationHistory, setShowConversationHistory] = useState(false);
  const [memorySearchQuery, setMemorySearchQuery] = useState('');
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load memories and conversations on open
  useEffect(() => {
    if (isOpen && user) {
      getAllMemories();
      getConversations();
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen, user, getAllMemories, getConversations]);

  // Initialize with welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setIsTyping(true);
      const timer = setTimeout(() => {
        setIsTyping(false);
        setMessages([{
          id: 'welcome',
          role: 'assistant',
          content: "Hey! I'm Swipess AI — your personal concierge. ✨\n\nI can help you find properties, manage your listings, answer questions about the app, or just chat.\n\nI also remember things you tell me! Try saying something like:\n• \"Remember that John's number is 555-1234\"\n• \"What do you know about Tulum?\"\n• \"Save this: Masculinity Coach website is example.com\"\n\nWhat can I help you with today?",
          timestamp: Date.now(),
        }]);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, messages.length]);

  // Reset on close
  useEffect(() => {
    if (!isOpen) {
      const timer = setTimeout(() => {
        setMessages([]);
        setInput('');
        setActiveConversationId(null);
        setShowMemoryPanel(false);
        setShowConversationHistory(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleSend = useCallback(async () => {
    if (!input.trim() || isSending || !user) return;

    haptics.tap();
    const userMessage = input.trim();
    setInput('');
    
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsSending(true);
    setIsTyping(true);

    try {
      // Create or get conversation
      let conversationId = activeConversationId;
      if (!conversationId) {
        const conversation = await createConversation(
          userMessage.slice(0, 50) + (userMessage.length > 50 ? '...' : '')
        );
        if (conversation) {
          conversationId = conversation.id;
          setActiveConversationId(conversationId);
        }
      }

      // Save user message
      if (conversationId) {
        await saveMessage(conversationId, 'user', userMessage);
      }

      // Get relevant memories for context
      const relevantMemories = memories.length > 0 
        ? formatMemoriesForAI(memories.slice(0, 10))
        : '';

      // Build conversation history for AI
      const conversationHistory = messages.map(m => ({
        role: m.role === 'assistant' ? 'assistant' : 'user',
        content: m.content,
      }));

      // Call AI orchestrator
      const { data, error: fnError } = await supabase.functions.invoke('ai-orchestrator', {
        body: {
          task: 'chat',
          data: {
            query: userMessage,
            messages: [
              ...conversationHistory,
              { role: 'user', content: userMessage }
            ],
            memoryContext: relevantMemories,
            userId: user.id,
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

      // Check if AI wants to save a memory
      if (data?.result?.saveMemory) {
        const memoryData = data.result.saveMemory;
        await saveMemory({
          memory_type: memoryData.type || 'custom',
          category: memoryData.category,
          content: memoryData.content,
          metadata: memoryData.metadata || {},
          importance: memoryData.importance || 5,
        });
        toast.success('I\'ll remember that! 🧠');
      }

      setIsTyping(false);
      const aiMsg: Message = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now(),
      };
      
      setMessages(prev => [...prev, aiMsg]);

      // Save AI message
      if (conversationId) {
        await saveMessage(conversationId, 'assistant', responseContent);
      }

    } catch (error) {
      setIsTyping(false);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      setMessages(prev => [...prev, {
        id: `error-${Date.now()}`,
        role: 'assistant',
        content: `⚠️ ${errorMessage}\n\nPlease try again.`,
        timestamp: Date.now(),
      }]);
    } finally {
      setIsSending(false);
    }
  }, [input, isSending, user, activeConversationId, messages, memories, createConversation, saveMessage, saveMemory, formatMemoriesForAI]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const startNewChat = useCallback(() => {
    setMessages([]);
    setActiveConversationId(null);
    setShowConversationHistory(false);
    setShowMemoryPanel(false);
    setTimeout(() => inputRef.current?.focus(), 100);
  }, []);

  const loadConversation = useCallback(async (conversation: AIConversation) => {
    setActiveConversationId(conversation.id);
    setShowConversationHistory(false);
    
    const conversationMessages = await getConversationMessages(conversation.id);
    const formattedMessages: Message[] = conversationMessages.map(m => ({
      id: m.id,
      role: m.role as 'user' | 'assistant',
      content: m.content,
      timestamp: new Date(m.created_at).getTime(),
    }));
    
    setMessages(formattedMessages);
  }, [getConversationMessages]);

  const handleDeleteConversation = useCallback(async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (activeConversationId === conversationId) {
      startNewChat();
    }
    await deleteConversation(conversationId);
  }, [activeConversationId, deleteConversation, startNewChat]);

  const filteredMemories = memories.filter(m =>
    m.content.toLowerCase().includes(memorySearchQuery.toLowerCase()) ||
    m.category?.toLowerCase().includes(memorySearchQuery.toLowerCase())
  );

  const quickPrompts = [
    { icon: Sparkles, label: 'Find Properties', text: 'Show me apartments to rent in Tulum', color: 'text-orange-400' },
    { icon: Brain, label: 'My Memories', text: 'What do you remember about me?', color: 'text-purple-400' },
    { icon: Zap, label: 'How Tokens Work', text: 'How do tokens work?', color: 'text-amber-400' },
    { icon: MessageCircle, label: 'Help', text: 'How do I start a chat with someone?', color: 'text-rose-400' },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          "sm:max-w-[480px] w-[calc(100%-16px)] h-[90vh] max-h-[800px] border p-0 overflow-hidden rounded-[2.5rem] shadow-2xl outline-none [&]:top-[50%] !flex !flex-col !gap-0",
          isDark ? "bg-[#0a0a0f] border-white/10" : "bg-white border-gray-200"
        )}
        hideCloseButton={true}
      >
        {/* Header */}
        <div className={cn(
          "relative px-5 py-4 border-b flex items-center justify-between shrink-0",
          isDark ? "border-white/10 bg-black/20" : "border-gray-100 bg-gray-50/50"
        )}>
          <div className="flex items-center gap-3">
            <div className={cn(
              "w-12 h-12 rounded-2xl flex items-center justify-center relative overflow-hidden group border",
              isDark ? "bg-zinc-900 border-white/10" : "bg-white border-gray-100 shadow-sm"
            )}>
              <SwipessLogo size="sm" className="relative z-10" />
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            </div>

            <div>
              <h2 className={cn("font-black text-base tracking-tight leading-none mb-0.5", isDark ? "text-white" : "text-gray-900")}>
                AI Concierge
              </h2>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                <p className={cn("text-[10px] font-bold uppercase tracking-widest", isDark ? "text-emerald-400" : "text-emerald-600")}>
                  Online • {memories.length} memories
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Memory Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                setShowMemoryPanel(!showMemoryPanel);
                setShowConversationHistory(false);
              }}
              className={cn(
                "h-10 w-10 rounded-xl transition-all border",
                showMemoryPanel
                  ? "bg-purple-500/20 border-purple-500/30 text-purple-400"
                  : isDark
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
                    : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-500 hover:text-gray-900"
              )}
            >
              <Brain className="h-4 w-4" />
            </Button>

            {/* History Toggle */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                setShowConversationHistory(!showConversationHistory);
                setShowMemoryPanel(false);
              }}
              className={cn(
                "h-10 w-10 rounded-xl transition-all border",
                showConversationHistory
                  ? "bg-blue-500/20 border-blue-500/30 text-blue-400"
                  : isDark
                    ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
                    : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-500 hover:text-gray-900"
              )}
            >
              <Clock className="h-4 w-4" />
            </Button>

            {/* New Chat */}
            <Button
              variant="ghost"
              size="icon"
              onClick={() => {
                haptics.tap();
                startNewChat();
              }}
              className={cn(
                "h-10 w-10 rounded-xl transition-all border",
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
                  : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-500 hover:text-gray-900"
              )}
            >
              <Plus className="h-4 w-4" />
            </Button>

            {/* Close */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className={cn(
                "h-10 w-10 rounded-xl transition-all border",
                isDark
                  ? "bg-white/5 hover:bg-white/10 border-white/10 text-white/60 hover:text-white"
                  : "bg-black/5 hover:bg-black/10 border-gray-200 text-gray-500 hover:text-gray-900"
              )}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Memory Panel */}
        <AnimatePresence>
          {showMemoryPanel && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b overflow-hidden shrink-0",
                isDark ? "border-white/10 bg-purple-500/5" : "border-gray-100 bg-purple-50"
              )}
            >
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className={cn("font-bold text-sm flex items-center gap-2", isDark ? "text-purple-300" : "text-purple-700")}>
                    <Brain className="w-4 h-4" />
                    Memory Bank
                  </h3>
                  <span className={cn("text-xs font-medium", isDark ? "text-purple-400/60" : "text-purple-500")}>
                    {filteredMemories.length} items
                  </span>
                </div>

                {/* Search */}
                <div className={cn(
                  "relative mb-3 rounded-xl border",
                  isDark ? "bg-black/20 border-white/10" : "bg-white border-gray-200"
                )}>
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    placeholder="Search memories..."
                    value={memorySearchQuery}
                    onChange={(e) => setMemorySearchQuery(e.target.value)}
                    className={cn(
                      "w-full bg-transparent pl-10 pr-4 py-2.5 text-sm outline-none",
                      isDark ? "text-white placeholder:text-white/40" : "text-gray-900 placeholder:text-gray-400"
                    )}
                  />
                </div>

                {/* Memory List */}
                <ScrollArea className="h-32">
                  <div className="space-y-2">
                    {filteredMemories.length === 0 ? (
                      <p className={cn("text-xs text-center py-4", isDark ? "text-white/40" : "text-gray-400")}>
                        No memories yet. Tell me something to remember!
                      </p>
                    ) : (
                      filteredMemories.map(memory => (
                        <div
                          key={memory.id}
                          className={cn(
                            "p-3 rounded-xl border text-xs",
                            isDark ? "bg-black/20 border-white/10" : "bg-white border-gray-100"
                          )}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={cn(
                                  "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase",
                                  isDark ? "bg-purple-500/20 text-purple-300" : "bg-purple-100 text-purple-700"
                                )}>
                                  {memory.memory_type}
                                </span>
                                {memory.category && (
                                  <span className={cn("text-[10px]", isDark ? "text-white/40" : "text-gray-400")}>
                                    {memory.category}
                                  </span>
                                )}
                              </div>
                              <p className={cn("font-medium", isDark ? "text-white/80" : "text-gray-700")}>
                                {memory.content}
                              </p>
                            </div>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(memory.importance, 5) }).map((_, i) => (
                                <Star key={i} className="w-3 h-3 text-amber-400 fill-amber-400" />
                              ))}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Conversation History Panel */}
        <AnimatePresence>
          {showConversationHistory && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={cn(
                "border-b overflow-hidden shrink-0",
                isDark ? "border-white/10 bg-blue-500/5" : "border-gray-100 bg-blue-50"
              )}
            >
              <div className="p-4">
                <h3 className={cn("font-bold text-sm flex items-center gap-2 mb-3", isDark ? "text-blue-300" : "text-blue-700")}>
                  <Clock className="w-4 h-4" />
                  Conversation History
                </h3>

                <ScrollArea className="h-40">
                  <div className="space-y-2">
                    {conversations.length === 0 ? (
                      <p className={cn("text-xs text-center py-4", isDark ? "text-white/40" : "text-gray-400")}>
                        No conversations yet
                      </p>
                    ) : (
                      conversations.map(conversation => (
                        <div
                          key={conversation.id}
                          onClick={() => loadConversation(conversation)}
                          className={cn(
                            "p-3 rounded-xl border cursor-pointer transition-all",
                            activeConversationId === conversation.id
                              ? isDark
                                ? "bg-blue-500/20 border-blue-500/30"
                                : "bg-blue-100 border-blue-200"
                              : isDark
                                ? "bg-black/20 border-white/10 hover:bg-white/5"
                                : "bg-white border-gray-100 hover:bg-gray-50"
                          )}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1 min-w-0">
                              <p className={cn("text-xs font-medium truncate", isDark ? "text-white/80" : "text-gray-700")}>
                                {conversation.title || 'New Conversation'}
                              </p>
                              <p className={cn("text-[10px] mt-0.5", isDark ? "text-white/40" : "text-gray-400")}>
                                {new Date(conversation.updated_at).toLocaleDateString()}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={(e) => handleDeleteConversation(conversation.id, e)}
                              className={cn(
                                "h-7 w-7 rounded-lg shrink-0",
                                isDark ? "text-white/40 hover:text-red-400 hover:bg-red-500/10" : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                              )}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4 space-y-4 scroll-smooth scrollbar-none">
          {messages.length === 0 && !isTyping && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-16 text-center"
            >
              <div className={cn(
                "w-20 h-20 mx-auto rounded-[2.2rem] flex items-center justify-center shadow-xl border mb-4",
                isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8"
              )}>
                <SwipessLogo size="xl" />
              </div>
              <p className={cn("text-xs font-black uppercase tracking-[0.2em] opacity-50", isDark ? "text-white/60" : "text-gray-400")}>
                AI Concierge Ready
              </p>
            </motion.div>
          )}

          <AnimatePresence mode="popLayout">
            {messages.map((message) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, y: 12, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn("flex flex-col gap-2", message.role === 'user' && "items-end")}
              >
                <div className={cn("flex gap-2.5", message.role === 'user' && "flex-row-reverse")}>
                  <div className={cn(
                    "w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 shadow-sm border",
                    message.role === 'assistant'
                      ? (isDark ? "bg-zinc-900 border-white/10" : "bg-gray-100 border-black/8")
                      : "bg-gradient-to-br from-orange-500 to-pink-500 border-orange-400"
                  )}>
                    {message.role === 'assistant' ? (
                      <SwipessLogo size="xs" />
                    ) : (
                      <User className="w-4 h-4 text-white" />
                    )}
                  </div>

                  <div className={cn(
                    "max-w-[85%] px-4 py-3 text-[13px] font-medium leading-relaxed whitespace-pre-line shadow-lg",
                    message.role === 'user'
                      ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white rounded-[1.25rem] rounded-tr-sm shadow-orange-500/20"
                      : cn(
                        "rounded-[1.25rem] rounded-tl-sm border",
                        isDark
                          ? "bg-zinc-900/80 border-white/10 text-foreground"
                          : "bg-white border-gray-100 text-gray-800 shadow-sm"
                      )
                  )}>
                    {message.content}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {isTyping && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 pl-2">
              <div className={cn(
                "w-10 h-10 rounded-2xl flex items-center justify-center",
                isDark ? "bg-zinc-900 border border-white/10" : "bg-gray-100 border border-black/8"
              )}>
                <SwipessLogo size="xs" className="animate-pulse" />
              </div>
              <div className={cn(
                "px-4 py-3 rounded-[1.5rem] rounded-tl-sm text-xs font-bold flex items-center gap-2 shadow-sm",
                isDark
                  ? "bg-gradient-to-r from-orange-500/10 to-pink-500/10 border border-orange-500/20 text-orange-400"
                  : "bg-gradient-to-r from-orange-50 to-pink-50 border border-orange-200 text-orange-600"
              )}>
                <Loader2 className="w-3 h-3 animate-spin" />
                Thinking...
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length > 0 && messages[messages.length - 1].role === 'assistant' && !isSending && !isTyping && (
          <div className="px-5 pb-3">
            <p className={cn("text-[10px] font-black uppercase tracking-widest mb-2", isDark ? "text-white/30" : "text-gray-400")}>
              Quick Actions
            </p>
            <div className="flex flex-wrap gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    haptics.tap();
                    setInput(prompt.text);
                    setTimeout(() => inputRef.current?.focus(), 50);
                  }}
                  className={cn(
                    "flex items-center gap-2 px-3 py-2 text-[11px] rounded-xl transition-all font-bold uppercase tracking-tighter border group hover:scale-105 active:scale-95",
                    isDark
                      ? "bg-white/5 border-white/10 hover:bg-white/10"
                      : "bg-gray-50 border-gray-200 hover:bg-gray-100"
                  )}
                >
                  <prompt.icon className={cn("w-3.5 h-3.5", prompt.color)} />
                  <span className={isDark ? "text-white/70" : "text-gray-600"}>{prompt.label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className={cn(
          "p-4 border-t relative shrink-0",
          isDark ? "border-white/10 bg-black/40" : "border-gray-200 bg-gray-50/50"
        )}>
          <div className={cn(
            "relative rounded-2xl border transition-all duration-300 group overflow-hidden",
            isDark
              ? "bg-zinc-900/80 border-white/10 focus-within:border-orange-500/50 focus-within:ring-4 focus-within:ring-orange-500/10"
              : "bg-white border-gray-200 focus-within:border-orange-500 shadow-sm"
          )}>
            <Textarea
              ref={inputRef}
              placeholder="Ask anything or tell me something to remember..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              className={cn(
                "w-full resize-none bg-transparent px-4 py-3.5 pr-12 text-sm font-medium outline-none placeholder:text-muted-foreground/30",
                "min-h-[50px] max-h-[150px]",
                isDark ? "text-white" : "text-gray-900"
              )}
            />
            <Button
              size="sm"
              onClick={handleSend}
              disabled={!input.trim() || isSending}
              className={cn(
                "absolute right-2.5 bottom-2.5 rounded-xl h-8 w-8 p-0 transition-all duration-300",
                input.trim()
                  ? "bg-gradient-to-br from-orange-500 to-pink-500 text-white shadow-lg shadow-orange-500/30 hover:scale-110 active:scale-90"
                  : "bg-muted text-muted-foreground"
              )}
            >
              {isSending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
