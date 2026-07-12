import { useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Send, Users, X } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  user_id: string;
  display_name: string;
  avatar_url?: string;
  message: string;
  created_at: string;
}

interface EventGroupChatProps {
  eventId: string | number;
  eventTitle: string;
  onClose: () => void;
}

const MOCK_MESSAGES: ChatMessage[] = [
  { id: '1', user_id: 'a', display_name: 'Sofia M.', message: '¿Alguien sabe a qué hora empieza exactamente? 🎵', created_at: new Date(Date.now() - 1000 * 60 * 12).toISOString() },
  { id: '2', user_id: 'b', display_name: 'Carlos R.', message: 'A las 10pm según el flyer, pero siempre empieza tarde 😄', created_at: new Date(Date.now() - 1000 * 60 * 9).toISOString() },
  { id: '3', user_id: 'c', display_name: 'Valentina L.', message: 'Estaré ahí! 🙌 ¿Van en grupo?', created_at: new Date(Date.now() - 1000 * 60 * 5).toISOString() },
  { id: '4', user_id: 'b', display_name: 'Carlos R.', message: 'Sí, somos 6. Nos vemos en la entrada 🌴', created_at: new Date(Date.now() - 1000 * 60 * 2).toISOString() },
];

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function EventGroupChat({ eventId: _eventId, eventTitle, onClose }: EventGroupChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    setInput('');

    const newMsg: ChatMessage = {
      id: `local-${Date.now()}`,
      user_id: user?.id ?? 'me',
      display_name: 'Tú',
      message: text,
      created_at: new Date().toISOString(),
    };
    setMessages(prev => [...prev, newMsg]);
    setSending(false);
  };

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex flex-col"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        {/* Backdrop */}
        <motion.div
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        />

        {/* Panel */}
        <motion.div
          className="relative mt-auto w-full max-h-[85dvh] flex flex-col bg-background/90 backdrop-blur-3xl rounded-t-[2.5rem] shadow-[0_-20px_40px_rgba(0,0,0,0.5)] border-t border-white/10"
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        >
          {/* Handle */}
          <div className="flex justify-center pt-3 pb-1">
            <div className="w-10 h-1 rounded-full bg-muted-foreground/30" />
          </div>

          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-border/40">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Users className="w-3 h-3" />
                Chat del evento
              </p>
              <h3 className="text-sm font-semibold truncate">{eventTitle}</h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0"
              data-testid="button-close-chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
            {messages.map(msg => {
              const isMe = msg.user_id === (user?.id ?? 'me') || msg.display_name === 'Tú';
              return (
                <div key={msg.id} className={`flex gap-2 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                  {!isMe && (
                    <div className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-[10px] font-bold text-primary">
                      {msg.display_name[0]}
                    </div>
                  )}
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isMe && (
                      <span className="text-[10px] text-muted-foreground ml-1">{msg.display_name}</span>
                    )}
                    <div className={`px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? 'bg-primary text-primary-foreground rounded-tr-sm'
                        : 'bg-muted text-foreground rounded-tl-sm'
                    }`}>
                      {msg.message}
                    </div>
                    <span className="text-[10px] text-muted-foreground px-1">{timeAgo(msg.created_at)}</span>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="px-4 py-3 border-t border-white/10 flex items-end gap-2 pb-safe">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Escribe un mensaje..."
              rows={1}
              data-testid="input-group-chat"
              className="flex-1 resize-none bg-muted/40 backdrop-blur-xl rounded-2xl px-4 py-2.5 text-[16px] outline-none placeholder:text-muted-foreground max-h-24 leading-snug shadow-[inset_0_2px_4px_rgba(0,0,0,0.1)] focus:bg-background/80 transition-all"
              style={{ overflowY: 'auto' }}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || sending}
              data-testid="button-send-message"
              className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#EB4898] to-[#FF4D00] flex items-center justify-center flex-shrink-0 disabled:opacity-50 transition-all active:scale-90 shadow-[0_8px_16px_rgba(255,77,0,0.3)] hover:scale-105"
            >
              <Send className="w-5 h-5 text-white shadow-sm" />
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}


