import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Users, MessageCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

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

function timeAgo(iso: string): string {
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (diff < 60) return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

export function EventGroupChat({ eventId, eventTitle, onClose }: EventGroupChatProps) {
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [tableExists, setTableExists] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load messages from Supabase
  useEffect(() => {
    if (!eventId) return;

    const load = async () => {
      const { data, error } = await (supabase as any)
        .from('event_messages')
        .select('id, user_id, display_name, avatar_url, message, created_at')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error) {
        setTableExists(false);
        return;
      }
      setMessages(data ?? []);
    };

    load();

    // Real-time subscription
    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'event_messages',
        filter: `event_id=eq.${eventId}`,
      }, (payload) => {
        setMessages(prev => [...prev, payload.new as ChatMessage]);
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending || !user) return;
    setSending(true);
    setInput('');

    const displayName = user.user_metadata?.full_name
      || user.user_metadata?.name
      || user.email?.split('@')[0]
      || 'Usuario';

    const { error } = await (supabase as any)
      .from('event_messages')
      .insert({
        event_id: eventId,
        user_id: user.id,
        display_name: displayName,
        message: text,
      });

    if (error) {
      // Optimistic local-only fallback so the UI doesn't freeze
      const localMsg: ChatMessage = {
        id: `local-${Date.now()}`,
        user_id: user.id,
        display_name: displayName,
        message: text,
        created_at: new Date().toISOString(),
      };
      setMessages(prev => [...prev, localMsg]);
    }

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
          className="relative mt-auto w-full max-h-[85dvh] flex flex-col bg-background rounded-t-3xl shadow-2xl border-t border-border/40"
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
            {!tableExists && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-2">
                <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">El chat grupal llega pronto</p>
              </div>
            )}
            {tableExists && messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full py-12 text-center gap-2">
                <MessageCircle className="w-10 h-10 text-muted-foreground/40" />
                <p className="text-sm text-muted-foreground">Sé el primero en escribir</p>
              </div>
            )}
            {tableExists && messages.map(msg => {
              const isMe = msg.user_id === user?.id;
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
          {tableExists && (
            <div className="px-4 py-3 border-t border-border/40 flex items-end gap-2 pb-safe">
              <textarea
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe un mensaje..."
                rows={1}
                data-testid="input-group-chat"
                className="flex-1 resize-none bg-muted rounded-2xl px-4 py-2.5 text-sm outline-none placeholder:text-muted-foreground max-h-24 leading-5"
                style={{ overflowY: 'auto' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                data-testid="button-send-message"
                className="w-10 h-10 rounded-full bg-primary flex items-center justify-center flex-shrink-0 disabled:opacity-70 transition-opacity"
              >
                <Send className="w-4 h-4 text-primary-foreground" />
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
