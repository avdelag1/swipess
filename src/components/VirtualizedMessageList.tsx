import { memo, useRef, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { formatDistanceToNow } from '@/utils/timeFormatter';

import { MessageBubble, type MessageType } from './chat/MessageBubble';

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

// Typing indicator
const TypingIndicator = memo(() => (
  <div className="flex justify-start items-end gap-2 mt-1 px-4">
    <div className="px-4 py-3 bg-[#2C2C2E]/90 backdrop-blur-md rounded-[20px] rounded-bl-[6px] border border-white/10">
      <div className="flex items-center gap-1">
        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
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
    estimateSize: () => 72, // Slightly larger for new bubble padding
    overscan: 10,
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
      className="flex-1 overflow-y-auto py-3 bg-transparent"
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
