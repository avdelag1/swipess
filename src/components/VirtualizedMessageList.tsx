import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import useAppTheme from '@/hooks/useAppTheme';
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

// Memoized message bubble
const MessageBubble = memo(({
  message,
  isMyMessage,
  otherUserRole,
  isThemeLight
}: {
  message: MessageType;
  isMyMessage: boolean;
  otherUserRole: string;
  isThemeLight: boolean;
}) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex mb-2.5 px-4", isMyMessage ? 'justify-end' : 'justify-start')}
    >
      <div
        className={cn(
          "max-w-[78%] px-4 py-3 transition-all duration-200",
          isMyMessage
            ? "bg-gradient-to-br from-[#EB4898] to-[#c0392b] text-white rounded-[1.5rem] rounded-br-[0.35rem] shadow-[0_4px_20px_rgba(235,72,152,0.3)]"
            : cn(
                "border rounded-[1.5rem] rounded-bl-[0.35rem]",
                isThemeLight
                  ? "bg-white border-black/[0.07] text-slate-800 shadow-sm"
                  : "bg-white/[0.07] border-white/[0.08] text-white backdrop-blur-xl"
              )
        )}
      >
        <p className={cn(
          "text-[14px] font-medium break-words whitespace-pre-wrap leading-relaxed",
          isMyMessage ? "text-white" : (isThemeLight ? "text-slate-800" : "text-white/90")
        )}>
          {message.message_text}
        </p>
        <div className={cn(
          "text-[9px] mt-1.5 font-semibold text-right",
          isMyMessage ? "text-white/60" : (isThemeLight ? "text-black/30" : "text-white/30")
        )}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
        </div>
      </div>
    </motion.div>
  );
});

MessageBubble.displayName = 'MessageBubble';

const TypingIndicator = memo(({ isThemeLight }: { isThemeLight: boolean }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className="flex justify-start items-end gap-2 mt-2 px-5 pb-4"
  >
    <div className={cn(
      "px-4 py-3 rounded-[1.5rem] rounded-bl-[0.35rem] border",
      isThemeLight
        ? "bg-white border-black/[0.07] shadow-sm"
        : "bg-white/[0.07] border-white/[0.08] backdrop-blur-xl"
    )}>
      <div className="flex items-center gap-1.5">
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '120ms' }} />
        <span className="w-2 h-2 bg-[#EB4898] rounded-full animate-bounce" style={{ animationDelay: '240ms' }} />
      </div>
    </div>
  </motion.div>
));

TypingIndicator.displayName = 'TypingIndicator';

/**
 * Virtualized message list - only renders visible messages
 */
export const VirtualizedMessageList = memo(({
  messages,
  currentUserId,
  otherUserRole,
  typingUsers,
}: VirtualizedMessageListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const { theme } = useAppTheme();
  const isThemeLight = theme === 'light' || theme === 'Swipess-style';

  const virtualizer = useVirtualizer({
    count: messages.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 80,
    overscan: 10,
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

  if (messages.length === 0) return null;

  return (
    <div
      ref={parentRef}
      className="flex-1 overflow-y-auto py-4 bg-transparent"
      style={{ contain: 'strict' }}
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
                  isThemeLight={isThemeLight}
                />
              </div>
            );
          })}
        </div>
      </div>
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator isThemeLight={isThemeLight} />}
      </AnimatePresence>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
