import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Send, X, Users, Sparkles, Shield, 
  MessageSquare, Heart, Smile, MapPin,
  ChevronLeft
} from 'lucide-react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface Message {
  id: string;
  sender: {
    name: string;
    avatar: string;
    isVerified: boolean;
    role: 'neighbor' | 'organizer' | 'oracle';
  };
  text: string;
  timestamp: Date;
  isMe: boolean;
}

interface EventGroupChatProps {
  isOpen: boolean;
  onClose: () => void;
  eventTitle: string;
  eventImage?: string;
}

const MOCK_MESSAGES: Message[] = [
  {
    id: '1',
    sender: {
      name: 'Sarah J.',
      avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&q=80',
      isVerified: true,
      role: 'neighbor'
    },
    text: "Can't wait for this! Is anyone driving from Aldea Zama?",
    timestamp: new Date(Date.now() - 1000 * 60 * 15),
    isMe: false
  },
  {
    id: '2',
    sender: {
      name: 'Tulum Life',
      avatar: 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=100&q=80',
      isVerified: true,
      role: 'organizer'
    },
    text: "Doors open at 8 PM. Priority entry for Swipess Verified members! 🥂",
    timestamp: new Date(Date.now() - 1000 * 60 * 10),
    isMe: false
  },
  {
    id: '3',
    sender: {
      name: 'Marcus V.',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&q=80',
      isVerified: true,
      role: 'neighbor'
    },
    text: "I'm going with a group of 4. See you guys there!",
    timestamp: new Date(Date.now() - 1000 * 60 * 5),
    isMe: false
  }
];

export function EventGroupChat({ isOpen, onClose, eventTitle, eventImage }: EventGroupChatProps) {
  const [messages, setMessages] = useState<Message[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [neighborsCount, setNeighborsCount] = useState(12);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  // Simulate neighborhood activity
  useEffect(() => {
    if (!isOpen) return;

    const interval = setInterval(() => {
      // 30% chance of neighborhood activity
      if (Math.random() > 0.7) {
        setIsTyping(true);
        setTimeout(() => {
          setIsTyping(false);
          const aiMessages = [
            "Just booked my ticket! 🎟️",
            "Is the dress code jungle chic?",
            "Last one was epic, hoping for the same vibe.",
            "Who's down for a pre-drink at Gitano?"
          ];
          const newMsg: Message = {
            id: Date.now().toString(),
            sender: {
              name: 'Clara M.',
              avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=100&q=80',
              isVerified: true,
              role: 'neighbor'
            },
            text: aiMessages[Math.floor(Math.random() * aiMessages.length)],
            timestamp: new Date(),
            isMe: false
          };
          setMessages(prev => [...prev, newMsg]);
        }, 3000);
      }
      
      // Minor fluctuation in active neighbors
      setNeighborsCount(prev => Math.max(8, Math.min(45, prev + (Math.random() > 0.5 ? 1 : -1))));
    }, 8000);

    return () => clearInterval(interval);
  }, [isOpen]);

  const handleSend = () => {
    if (!input.trim()) return;
    
    const myMsg: Message = {
      id: Date.now().toString(),
      sender: {
        name: 'Me',
        avatar: '',
        isVerified: true,
        role: 'neighbor'
      },
      text: input,
      timestamp: new Date(),
      isMe: true
    };
    
    setMessages(prev => [...prev, myMsg]);
    setInput('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[110]"
          />

          {/* Chat Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed inset-x-0 bottom-0 h-[85vh] bg-zinc-950 rounded-t-[32px] z-[120] flex flex-col overflow-hidden border-t border-white/10 shadow-2xl"
          >
            {/* Handle bar */}
            <div className="w-full flex justify-center py-3">
              <div className="w-12 h-1.5 rounded-full bg-white/10" />
            </div>

            {/* Header */}
            <div className="px-6 py-2 flex items-center justify-between border-b border-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden border border-white/10">
                  <img src={eventImage || 'https://images.unsplash.com/photo-1545128485-c400e7702796?w=200&q=60'} alt={eventTitle} className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-[14px] font-black text-white uppercase tracking-tight truncate max-w-[200px]">{eventTitle}</h3>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1">
                      <div className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                      <span className="text-[10px] font-bold text-white/50">{neighborsCount} Neighbors Active</span>
                    </div>
                  </div>
                </div>
              </div>
              <button 
                onClick={onClose}
                title="Close chat"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Safety Banner */}
            <div className="px-6 py-2 bg-rose-500/5 border-b border-rose-500/10 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-rose-500" />
              <span className="text-[9px] font-black text-rose-500 uppercase tracking-widest">Neighbor Trust Mode Active</span>
            </div>

            {/* Messages Area */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth"
            >
              {messages.map((msg, i) => {
                const isGroupStart = i === 0 || messages[i-1].sender.name !== msg.sender.name;
                
                return (
                  <div key={msg.id} className={cn(
                    "flex flex-col",
                    msg.isMe ? "items-end" : "items-start",
                    !isGroupStart && "-mt-4"
                  )}>
                    {isGroupStart && !msg.isMe && (
                      <div className="flex items-center gap-2 mb-1 ml-11">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{msg.sender.name}</span>
                        {msg.sender.isVerified && <Shield className="w-2.5 h-2.5 text-blue-400 fill-blue-400/20" />}
                        {msg.sender.role === 'organizer' && (
                          <span className="px-1.5 py-0.5 rounded-sm bg-primary/10 border border-primary/20 text-[8px] font-black text-primary uppercase">Host</span>
                        )}
                      </div>
                    )}
                    
                    <div className={cn(
                      "flex gap-3 max-w-[85%]",
                      msg.isMe && "flex-row-reverse"
                    )}>
                      {!msg.isMe && (
                        <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border border-white/10 opacity-100">
                          {isGroupStart ? (
                            <img src={msg.sender.avatar} alt={msg.sender.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full" />
                          )}
                        </div>
                      )}
                      
                      <div className={cn(
                        "px-4 py-2.5 rounded-2xl relative",
                        msg.isMe 
                          ? "bg-gradient-to-br from-rose-500 to-orange-500 text-white rounded-tr-none" 
                          : "bg-white/5 border border-white/10 text-white/90 rounded-tl-none"
                      )}>
                        <p className="text-[13px] leading-relaxed font-medium">{msg.text}</p>
                        <span className={cn(
                          "text-[9px] mt-1 block opacity-40",
                          msg.isMe ? "text-right" : "text-left"
                        )}>
                          {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>

                        {/* Sentient Reaction Mock */}
                        {!msg.isMe && Math.random() > 0.8 && (
                          <div className="absolute -bottom-2 -right-2 px-1.5 py-0.5 rounded-full bg-zinc-900 border border-white/10 text-[10px] flex items-center gap-1 shadow-lg">
                            <span>🔥</span>
                            <span className="font-bold text-white/60">3</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}

              {isTyping && (
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-white/5 border border-white/10 animate-pulse" />
                  <div className="px-4 py-2 bg-white/5 rounded-2xl rounded-tl-none border border-white/10 flex gap-1 items-center">
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce" />
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce [animation-delay:0.2s]" />
                    <div className="w-1 h-1 rounded-full bg-white/40 animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <div className="p-6 bg-zinc-950/80 backdrop-blur-xl border-t border-white/5 pb-[calc(1.5rem+var(--safe-bottom))]">
              <div className="flex items-center gap-3">
                <div className="flex-1 relative">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                    placeholder="Message neighbors..."
                    className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                    <button 
                      title="Add emoji"
                      className="text-white/20 hover:text-white/60 transition-colors"
                    >
                      <Smile className="w-5 h-5" />
                    </button>
                  </div>
                </div>
                <button
                  onClick={handleSend}
                  disabled={!input.trim()}
                  title="Send message"
                  className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center transition-all active:scale-90 shadow-xl shadow-rose-500/10",
                    input.trim() ? "bg-rose-500 text-white" : "bg-white/5 text-white/20"
                  )}
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
