import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

interface MessageType {
  id: string;
  conversation_id: string;
  sender_id: string;
  message_text: string;
  message_type: string;
  created_at: string;
  is_read?: boolean;
  sender?: {
    id: string;
    full_name: string;
    avatar_url?: string;
  };
}

interface TypingUser {
  userId: string;
  userName: string;
}

interface VirtualizedMessageListProps {
  messages: MessageType[];
  currentUserId: string;
  otherUserRole: string;
  typingUsers: TypingUser[];
}

const MessageBubble = memo(({ 
  message, 
  isMyMessage, 
  otherUserRole: _otherUserRole 
}: { 
  message: MessageType; 
  isMyMessage: boolean; 
  otherUserRole: string;
}) => {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.95, x: isMyMessage ? 10 : -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      className={cn("flex mb-2 px-6", isMyMessage ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          "max-w-[85%] px-5 py-3.5 shadow-2xl transition-all relative",
          isMyMessage
            ? "bg-gradient-to-br from-[#EB4898] via-[#FF1493] to-orange-500 text-white rounded-[1.8rem] rounded-br-[0.4rem] shadow-[#EB4898]/20"
            : "bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] text-white rounded-[1.8rem] rounded-bl-[0.4rem]"
        )}
      >
        <p className="text-[14px] font-bold break-words whitespace-pre-wrap leading-relaxed tracking-tight">
          {message.message_text}
        </p>
        <div className={cn(
            "text-[8px] mt-2 font-black uppercase tracking-widest opacity-30 text-right italic",
            isMyMessage ? "text-white/80" : "text-white/40"
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = memo(() => (
  <motion.div 
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start items-end gap-2 mt-4 px-6 pb-4"
  >
    <div className="px-5 py-4 bg-white/[0.04] backdrop-blur-3xl border border-white/[0.08] rounded-[1.8rem] rounded-bl-[0.4rem]">
      <div className="flex items-center gap-1.5">
        <span className="w-1.5 h-1.5 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-1.5 h-1.5 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-1.5 h-1.5 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </motion.div>
));

TypingIndicator.displayName = 'TypingIndicator';

export const VirtualizedMessageList = memo(({
  messages,
  currentUserId,
  otherUserRole,
  typingUsers,
}: VirtualizedMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 70, 
    overscan: 12,
  });

  useEffect(() => {
    if (messages.length > 0) {
      virtualizer.scrollToIndex(messages.length - 1, {
        align: 'end',
        behavior: 'auto',
      });
    }
  }, [messages.length, virtualizer]);

  const items = virtualizer.getVirtualItems();

  if (messages.length === 0) {
    return null;
  }

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto py-6 space-y-2 no-scrollbar"
      style={{ contain: 'strict', backgroundColor: 'transparent' }}
    >
      <div
        style={{
          height: `${virtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            width: '100%',
            transform: `translateY(${items[0]?.start ?? 0}px)`,
          }}
        >
          {items.map((virtualRow) => {
            const message = messages[virtualRow.index];
            const isMyMessage = message.sender_id === currentUserId;

            return (
              <div
                key={message.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
              >
                <MessageBubble
                  message={message}
                  isMyMessage={isMyMessage}
                  otherUserRole={otherUserRole}
                />
              </div>
            );
          })}
        </div>
      </div>
      
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator />}
      </AnimatePresence>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';

