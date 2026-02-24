import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, Loader2, X, Send, Zap, Home, MessageCircle, Flame, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useClientProfile } from '@/hooks/useClientProfile';

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

// Knowledge base about Swipess app
const SWIPESS_KNOWLEDGE = {
  routes: {
    '/client/dashboard': 'Main page where you browse listings by swiping right to like or left to pass.',
    '/client/liked-properties': 'Shows all properties you have liked. When there\'s a mutual match, you can start chatting.',
    '/client/who-liked-you': 'Shows people who liked your profile (for owners) or listings that liked you.',
    '/client/filters': 'Filter settings to narrow down your search by price, location, amenities, etc.',
    '/owner/dashboard': 'Owner dashboard to discover clients who match your preferences.',
    '/owner/liked-clients': 'Clients you have liked. When mutual, you can connect.',
    '/owner/properties': 'Manage your property listings.',
    '/messages': 'Chat with matches - your connections after mutual likes.',
    '/notifications': 'View all notifications about likes, matches, and updates.',
  },
  features: [
    { name: 'Swipe Matching', description: 'Swipe right to like, left to pass. Mutual likes create matches!' },
    { name: 'AI Search', description: 'Describe what you want in natural language and AI finds matches.' },
    { name: 'Instant Connect', description: 'Chat immediately after matching with no delays.' },
    { name: 'Verified Profiles', description: 'All users and listings can be verified for safety.' },
    { name: 'Token System', description: 'Use tokens to unlock premium features and messaging.' },
  ],
  categories: {
    'property': 'Apartments, houses, rooms for rent',
    'vehicle': 'Motorcycles, bicycles, cars',
    'services': 'Workers, professionals, service providers',
  },
  filterKeywords: {
    'cheap': { priceMax: 500 },
    'expensive': { priceMin: 5000 },
    'affordable': { priceMax: 2000 },
    'luxury': { priceMin: 5000 },
    'apartment': { category: 'property' },
    'house': { category: 'property' },
    'room': { category: 'property' },
    'motorcycle': { category: 'vehicle' },
    'moto': { category: 'vehicle' },
    'bike': { category: 'bicycle' },
    'bicycle': { category: 'bicycle' },
    'service': { category: 'worker' },
    'worker': { category: 'worker' },
    'near': { location: true },
    'nearby': { location: true },
    'verified': { verified: true },
    'furnished': { furnished: true },
    'pet': { petFriendly: true },
    'pool': { amenities: ['pool'] },
    'parking': { amenities: ['parking'] },
  },
  general: [
    'Swipess is a matching platform for rentals, vehicles, and services.',
    'You can swipe on listings as a client, or swipe on clients as an owner.',
    'Mutual likes create matches and unlock the chat feature.',
    'Use filters to find exactly what you\'re looking for.',
    'The AI can help you search and filter listings faster.',
    'Your profile helps others know more about you before matching.',
  ]
};

// Generate AI response based on user query
function generateAIResponse(query: string, userRole: string): { response: string; showAction?: boolean; actionLabel?: string; actionRoute?: string } {
  const lowerQuery = query.toLowerCase();

  // Check for filter-related requests
  const filterKeywords = SWIPESS_KNOWLEDGE.filterKeywords;
  const detectedFilters: Record<string, any> = {};

  for (const [keyword, filters] of Object.entries(filterKeywords)) {
    if (lowerQuery.includes(keyword)) {
      for (const [filterKey, filterValue] of Object.entries(filters)) {
        detectedFilters[filterKey] = filterValue;
      }
    }
  }

  // If user is asking to filter, show action to apply filters
  const filterTriggers = ['find', 'show me', 'search for', 'i want', 'looking for', 'need', 'filter'];
  const isFilterRequest = filterTriggers.some(trigger => lowerQuery.includes(trigger));

  if (isFilterRequest && Object.keys(detectedFilters).length > 0) {
    // Build filter description
    const filterParts = [];
    if (detectedFilters.category) filterParts.push(detectedFilters.category);
    if (detectedFilters.priceMax) filterParts.push(`under $${detectedFilters.priceMax}`);
    if (detectedFilters.priceMin) filterParts.push(`over $${detectedFilters.priceMin}`);
    if (detectedFilters.verified) filterParts.push('verified');
    if (detectedFilters.furnished) filterParts.push('furnished');

    const filterDesc = filterParts.join(', ') || 'your filters';

    return {
      response: `I'll help you find ${filterDesc}! Let me apply these filters to your dashboard.\n\nTap "View Results" to see your filtered listings!`,
      showAction: true,
      actionLabel: 'View Results',
      actionRoute: '/client/dashboard'
    };
  }

  // Check for route-related questions
  if (lowerQuery.includes('where') || lowerQuery.includes('how do i') || lowerQuery.includes('navigate')) {
    for (const [route, description] of Object.entries(SWIPESS_KNOWLEDGE.routes)) {
      if (lowerQuery.includes(route.split('/').pop() || '')) {
        return {
          response: description + '\n\nTap "Go There" to navigate directly!',
          showAction: true,
          actionLabel: 'Go There',
          actionRoute: route
        };
      }
    }
  }

  // Check for feature questions
  if (lowerQuery.includes('what is') || lowerQuery.includes('how does') || lowerQuery.includes('what can')) {
    for (const feature of SWIPESS_KNOWLEDGE.features) {
      if (lowerQuery.includes(feature.name.toLowerCase())) {
        return { response: feature.description };
      }
    }
  }

  // Check for category questions
  if (lowerQuery.includes('category') || lowerQuery.includes('types') || lowerQuery.includes('what can i')) {
    const categories = Object.entries(SWIPESS_KNOWLEDGE.categories)
      .map(([key, desc]) => `• **${key}**: ${desc}`)
      .join('\n');
    return { response: `Here are the categories available:\n\n${categories}` };
  }

  // General questions about the app
  if (lowerQuery.includes('what is swipess') || lowerQuery.includes('what does swipess do')) {
    return { response: 'Swipess is a swipe-based matching platform for rentals, vehicles, and services. You can find properties to rent, discover clients as an owner, or hire services - all through a fun swipe interface!' };
  }

  if (lowerQuery.includes('how to use') || lowerQuery.includes('how does it work')) {
    return {
      response: `Here's how Swipess works:\n\n` +
        `1. **Browse**: Swipe right on items you like, left to pass\n` +
        `2. **Match**: When someone likes you back, you\'re matched!\n` +
        `3. **Connect**: Chat instantly with your matches\n` +
        `4. **AI Helper**: Use the AI button to find things faster`,
      showAction: true,
      actionLabel: 'Start Swiping',
      actionRoute: '/client/dashboard'
    };
  }

  if (lowerQuery.includes('match') || lowerQuery.includes('like')) {
    return { response: 'A match happens when two people like each other! When you swipe right on someone and they swipe right on you, it\'s a match. This unlocks the chat feature so you can connect.' };
  }

  if (lowerQuery.includes('token') || lowerQuery.includes('credit')) {
    return { response: 'Tokens are used for premium features like extra super likes, AI searches, and message boosts. You can get them through subscription packages.' };
  }

  if (lowerQuery.includes('verify') || lowerQuery.includes('verified')) {
    return { response: 'Verification confirms that users and listings are real. Verified items have a checkmark badge, making the community safer.' };
  }

  if (lowerQuery.includes('chat') || lowerQuery.includes('message')) {
    return { response: 'You can only chat with your matches! When you and another person both swipe right on each other, a match is created and you can start messaging.' };
  }

  if (lowerQuery.includes('time') || lowerQuery.includes('hour')) {
    return { response: 'It\'s currently ' + new Date().toLocaleTimeString() + '. Want to find something to do?' };
  }

  if (lowerQuery.includes('hi') || lowerQuery.includes('hello') || lowerQuery.includes('hey')) {
    return { response: 'Hey there! 👋 I\'m Swipess AI! I can help you:\n\n• Find listings by describing what you want\n• Navigate to different pages\n• Answer questions about how Swipess works\n• Explain features like matching, tokens, and more!\n\nWhat would you like to know?' };
  }

  // Default helpful response
  return {
    response: `I can help you with questions about Swipess! Try asking:\n\n` +
      `• "Find apartments under $1000"\n` +
      `• "How do matches work?"\n` +
      `• "Show me motorcycles"\n` +
      `• "What are tokens?"\n` +
      `• "Where are my matches?"\n\n` +
      `Or just describe what you're looking for and I'll help you find it!`
  };
}

export function AISearchDialog({ isOpen, onClose, userRole = 'client' }: AISearchDialogProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { data: clientProfile } = useClientProfile();
  // Fix: Fallback chain for avatar - client profile images → avatar_url → null
  const userAvatar = (clientProfile?.profile_images as string[] | undefined)?.[0] ?? (clientProfile as any)?.avatar_url ?? null;

  // Auto-focus input when dialog opens
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      // Reset when closed
      setMessages([]);
      setQuery('');
    }
  }, [isOpen]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = useCallback(async () => {
    if (!query.trim() || isSearching) return;

    const userMessage = query.trim();
    setQuery('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage, timestamp: Date.now() }]);
    setIsSearching(true);
    setIsTyping(true);

    try {
      // Simulate a small delay for better UX
      await new Promise(resolve => setTimeout(resolve, 600));

      setIsTyping(false);

      const result = generateAIResponse(userMessage, userRole);

      setMessages(prev => [...prev, {
        role: 'ai',
        content: result.response,
        timestamp: Date.now(),
        showAction: result.showAction,
        actionLabel: result.actionLabel,
        actionRoute: result.actionRoute,
      }]);
    } catch (error) {
      setIsTyping(false);
      console.error('AI search error:', error);
      setMessages(prev => [...prev, {
        role: 'ai',
        content: 'Sorry, I had trouble processing that. Please try again!',
        timestamp: Date.now()
      }]);
    } finally {
      setIsSearching(false);
    }
  }, [query, isSearching, userRole]);


  // Fix: Declare handleClose before handleAction to avoid reference-before-declaration
  const handleClose = useCallback(() => {
    onClose();
    setQuery('');
    setMessages([]);
    setIsSearching(false);
    setIsTyping(false);
  }, [onClose]);

  const handleAction = useCallback((route?: string) => {
    if (route) {
      navigate(route);
      handleClose();
    }
  }, [navigate, handleClose]);

  const quickPrompts = useMemo(() => [
    { icon: Home, label: 'Browse', text: 'Show me apartments to rent' },
    { icon: Flame, label: 'Matches', text: 'Where are my matches?' },
    { icon: Zap, label: 'Tokens', text: 'What are tokens?' },
    { icon: MessageCircle, label: 'Help', text: 'How does Swipess work?' },
  ], []);

  const applyQuickPrompt = (text: string) => {
    setQuery(text);
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent
        className="sm:max-w-md bg-[#1C1C1E]/97 backdrop-blur-2xl border border-white/8 p-0 overflow-hidden rounded-3xl"
        hideCloseButton={true}
      >
        {/* Header */}
        <div className="relative px-4 py-3 border-b border-white/5 flex items-center justify-between" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.12), rgba(249,115,22,0.08))' }}>
          <div className="flex items-center gap-3">
            {/* AI Avatar */}
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}>
              <Sparkles className="w-4 h-4 text-white" />
            </div>

            <div>
              <h2 className="text-white font-semibold text-sm">Swipess AI</h2>
              <p className="text-xs text-white/40">Ask me anything!</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={handleClose}
            className="h-8 w-8 rounded-full hover:bg-white/10"
          >
            <X className="w-4 h-4 text-white/60" />
          </Button>
        </div>

        {/* Messages Area */}
        <div className="h-80 overflow-y-auto px-4 py-4 space-y-4">
          {messages.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center space-y-4"
            >
              <div className="w-16 h-16 mx-auto rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, rgba(236,72,153,0.2), rgba(249,115,22,0.12))' }}>
                <Sparkles className="w-8 h-8" style={{ color: '#f97316' }} />
              </div>
              <div>
                <h3 className="text-white font-medium text-base">Swipess AI</h3>
                <p className="text-white/40 text-xs mt-1">Your personal app assistant</p>
              </div>

              {/* Quick prompts */}
              <div className="grid grid-cols-2 gap-2 pt-2">
                {quickPrompts.map((prompt, index) => (
                  <button
                    key={index}
                    onClick={() => applyQuickPrompt(prompt.text)}
                    className="flex items-center gap-2 px-3 py-2.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white/70 hover:text-white transition-all text-left"
                  >
                    <prompt.icon className="w-4 h-4" style={{ color: '#f97316' }} />
                    <span className="flex-1">{prompt.label}</span>
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          <AnimatePresence key={messages.length}>
            {messages.map((message) => (
              <motion.div
                key={message.timestamp}
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={cn(
                  "flex flex-col gap-2",
                  message.role === 'user' && "items-end"
                )}
              >
                <div className={cn(
                  "flex gap-2",
                  message.role === 'user' && "justify-end"
                )}>
                  {message.role === 'ai' && (
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0 mt-1" style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}>
                      <Sparkles className="w-3 h-3 text-white" />
                    </div>
                  )}

                  <div className={cn(
                    "max-w-[80%] px-3 py-2 rounded-2xl text-sm whitespace-pre-wrap",
                    message.role === 'user'
                      ? "text-white rounded-br-sm"
                      : "bg-white/8 text-white/90 rounded-bl-sm",
                    isTyping && message.role === 'ai' && message.content === ''
                      ? "animate-pulse"
                      : ""
                  )}
                    style={message.role === 'user' ? { background: 'linear-gradient(135deg, #ec4899, #f97316)' } : {}}
                  >
                    {message.role === 'ai' && message.content === '' ? (
                      <div className="flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#f97316', animationDelay: '0ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#f97316', animationDelay: '150ms' }} />
                        <span className="w-1.5 h-1.5 rounded-full animate-bounce" style={{ background: '#f97316', animationDelay: '300ms' }} />
                      </div>
                    ) : (
                      message.content
                    )}
                  </div>

                  {message.role === 'user' && (
                    <div className="w-7 h-7 rounded-full flex-shrink-0 mt-1 overflow-hidden border border-white/10">
                      {userAvatar ? (
                        <img src={userAvatar} alt="You" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-white/10 flex items-center justify-center">
                          <span className="text-white text-[9px] font-semibold">Me</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Action button if available */}
                {message.role === 'ai' && message.showAction && message.actionRoute && (
                  <button
                    onClick={() => handleAction(message.actionRoute)}
                    className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-full text-white hover:opacity-90 transition-all ml-8"
                    style={{ background: 'linear-gradient(135deg, #ec4899, #f97316)' }}
                  >
                    {message.actionLabel || 'View'}
                    <ArrowRight className="w-3 h-3" />
                  </button>
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
              AI is thinking...
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick action buttons (appear after first message) */}
        {messages.length > 0 && messages[messages.length - 1].role === 'ai' && (
          <div className="px-4 pb-2">
            <div className="flex flex-wrap gap-2">
              {quickPrompts.slice(0, 2).map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => applyQuickPrompt(prompt.text)}
                  className="flex items-center gap-1.5 px-3 py-1.5 text-xs bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-white/70 hover:text-white transition-all"
                >
                  <prompt.icon className="w-3 h-3" style={{ color: '#f97316' }} />
                  {prompt.label}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 border-t border-white/5 bg-[#0e0e10]/60">
          <div className="relative">
            <Input
              ref={inputRef}
              type="text"
              placeholder="Ask me anything..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              className="pr-20 h-11 bg-white/5 border-white/10 text-white placeholder:text-white/35 rounded-2xl focus:ring-1 focus:border-orange-500/40"
              disabled={isSearching}
            />

            <Button
              size="sm"
              onClick={handleSend}
              disabled={!query.trim() || isSearching}
              className="absolute right-1 top-1 bottom-1 rounded-xl px-4 h-auto text-white"
              style={query.trim() ? { background: 'linear-gradient(135deg, #ec4899, #f97316)' } : { background: 'rgba(255,255,255,0.08)' }}
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
