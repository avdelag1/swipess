import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDistanceToNow } from '@/utils/timeFormatter';

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

// iOS-style message bubble colors based on conversation type
const getBubbleColors = (otherUserRole: string, isMyMessage: boolean) => {
  if (!isMyMessage) {
    return {
      background: 'bg-[#3A3A3C]',
      text: 'text-white',
      timestamp: 'text-white/50'
    };
  }

  if (otherUserRole === 'owner') {
    return {
      background: 'bg-gradient-to-br from-[#8B5CF6] to-[#6366F1]',
      text: 'text-white',
      timestamp: 'text-white/60'
    };
  } else {
    return {
      background: 'bg-gradient-to-br from-[#007AFF] to-[#5856D6]',
      text: 'text-white',
      timestamp: 'text-white/60'
    };
  }
};

// Memoized message bubble
const MessageBubble = memo(({ 
  message, 
  isMyMessage, 
  otherUserRole 
}: { 
  message: MessageType; 
  isMyMessage: boolean; 
  otherUserRole: string;
}) => {
  const colors = getBubbleColors(otherUserRole, isMyMessage);

  return (
    <div className={`flex ${isMyMessage ? 'justify-end' : 'justify-start'} mb-1 px-4`}>
      <div
        className={`max-w-[75%] px-4 py-2.5 ${colors.background} ${colors.text} ${
          isMyMessage
            ? 'rounded-[20px] rounded-br-[6px]'
            : 'rounded-[20px] rounded-bl-[6px]'
        } shadow-sm`}
      >
        <p className="text-[15px] break-words whitespace-pre-wrap leading-[1.35]">
          {message.message_text}
        </p>
        <p className={`text-[10px] mt-1 ${colors.timestamp} text-right`}>
          {formatDistanceToNow(new Date(message.created_at), { addSuffix: false })}
        </p>
      </div>
    </div>
  );
});

MessageBubble.displayName = 'MessageBubble';

// Typing indicator
const TypingIndicator = memo(() => (
  <div className="flex justify-start items-end gap-2 mt-1 px-4">
    <div className="px-4 py-3 bg-[#3A3A3C] rounded-[20px] rounded-bl-[6px]">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-[#8E8E93] rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  </div>
));

TypingIndicator.displayName = 'TypingIndicator';

/**
 * Virtualized message list - only renders visible messages
 * Maintains 60fps scrolling even with 500+ messages
 */
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
    estimateSize: () => 60, // Estimated message height
    overscan: 10, // Render 10 extra items for smooth scrolling
  });

  // Auto-scroll to bottom on new messages
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
      className="flex-1 overflow-y-auto py-3 bg-[#000000]"
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
                />
              </div>
            );
          })}
        </div>
      </div>
      
      {/* Typing indicator at bottom */}
      {typingUsers.length > 0 && <TypingIndicator />}
    </div>
  );
});

VirtualizedMessageList.displayName = 'VirtualizedMessageList';
