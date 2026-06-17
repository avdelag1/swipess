import { memo, useEffect, useRef } from 'react';
import useAppTheme from '@/hooks/useAppTheme';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { cn } from '@/lib/utils';
import { AnimatePresence, motion } from 'framer-motion';
import { DocumentMessageCard } from '@/components/messaging/DocumentMessageCard';
import { isDocumentMessage, parseDocumentAttachments } from '@/utils/messageDocuments';

interface MessageType {
  id: string;
  client_id?: string;
  conversation_id: string;
  sender_id: string;
  content?: string | null;
  message_type: string;
  attachments?: unknown;
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
  currentUserRole?: 'client' | 'owner';
  typingUsers: TypingUser[];
}

const MessageBubble = memo(({
  message,
  isMyMessage,
  _otherUserRole,
  isThemeLight,
  currentUserRole,
}: {
  message: MessageType;
  isMyMessage: boolean;
  otherUserRole: string;
  isThemeLight: boolean;
  currentUserRole?: 'client' | 'owner';
}) => {
  const docAttachments = isDocumentMessage(message.message_type)
    ? parseDocumentAttachments(message.attachments)
    : [];

  return (
    <motion.div
      layout="position"
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.2, ease: [0.23, 1, 0.32, 1] }}
      className={cn("flex mb-2.5 px-4", isMyMessage ? 'justify-end' : 'justify-start')}
    >
      <div className={cn("max-w-[78%] flex flex-col gap-2", isMyMessage ? 'items-end' : 'items-start')}>
        {docAttachments.length > 0 ? (
          docAttachments.map((att) => (
            <DocumentMessageCard
              key={att.id}
              attachment={att}
              isMyMessage={isMyMessage}
              isThemeLight={isThemeLight}
              currentUserRole={currentUserRole}
            />
          ))
        ) : (
          <div
            className={cn(
              "px-4 py-3 transition-all duration-200",
              isMyMessage
                ? "bg-gradient-to-br from-[#EB4898] to-[#c0392b] text-white rounded-[1.5rem] rounded-br-[0.35rem] shadow-[0_4px_20px_rgba(235,72,152,0.3)]"
                : cn(
                    "border rounded-[1.5rem] rounded-bl-[0.35rem]",
                    isThemeLight
                      ? "bg-white border-slate-200 text-black shadow-sm"
                      : "bg-secondary border-white/[0.08] text-white shadow-md backdrop-blur-xl"
                  )
            )}
          >
            <p className={cn(
              "text-[14px] font-medium break-words whitespace-pre-wrap leading-relaxed",
              isMyMessage ? "text-white" : (isThemeLight ? "text-black" : "text-white/90")
            )}>
              {message.content || ''}
            </p>
          </div>
        )}
        {docAttachments.length > 0 && message.content && (
          <p className={cn(
            "text-[12px] font-medium px-1 max-w-[260px]",
            isMyMessage
              ? "text-white/70 text-right"
              : (isThemeLight ? "text-black/50" : "text-white/50"),
          )}>
            {message.content}
          </p>
        )}
        <div className={cn(
          "text-[9px] font-semibold px-1",
          isMyMessage ? "text-white/40 text-right" : (isThemeLight ? "text-black/30" : "text-white/30")
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
        ? "bg-white border-slate-200 shadow-sm"
        : "bg-secondary border-white/[0.08] shadow-md backdrop-blur-xl"
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

export const VirtualizedMessageList = memo(({
  messages,
  currentUserId,
  otherUserRole,
  currentUserRole,
  typingUsers,
}: VirtualizedMessageListProps) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(0);
  const { theme } = useAppTheme();
  const isThemeLight = theme === 'light' || theme === 'Swipess-style';

  // Scroll to bottom on new messages
  useEffect(() => {
    if (messages.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  if (messages.length === 0) return (
    <div className="flex-1 min-h-0 flex items-center justify-center py-16">
      <p className={cn("text-[11px] font-black uppercase tracking-[0.3em] opacity-25", isThemeLight ? "text-black" : "text-white")}>
        Say hello to start the conversation
      </p>
    </div>
  );

  return (
    <div
      ref={scrollRef}
      className="flex-1 min-h-0 overflow-y-auto py-4 bg-transparent overscroll-contain"
    >
      {messages.map((message) => {
        const isMyMessage = message.sender_id === currentUserId;
        return (
          <div key={message.id || message.client_id}>
            <MessageBubble
              message={message}
              isMyMessage={isMyMessage}
              otherUserRole={otherUserRole}
              isThemeLight={isThemeLight}
              currentUserRole={currentUserRole}
            />
          </div>
        );
      })}
      <AnimatePresence>
        {typingUsers.length > 0 && <TypingIndicator isThemeLight={isThemeLight} />}
      </AnimatePresence>
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
