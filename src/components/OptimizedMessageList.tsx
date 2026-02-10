/**
 * Optimized Message List
 * Uses memoization and efficient rendering for chat messages
 * Maintains auto-scroll behavior with minimal re-renders
 */

import { memo, useEffect, useRef, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';

export interface Message {
  id: string;
  message_text: string;
  sender_id: string;
  created_at: string;
  is_read?: boolean;
  sender?: {
    full_name?: string;
    avatar_url?: string;
  };
}

interface OptimizedMessageListProps {
  messages: Message[];
  currentUserId: string;
  className?: string;
}

// Memoized message bubble - only re-renders when message content changes
const MessageBubble = memo(function MessageBubble({
  message,
  isOwn,
  showAvatar,
}: {
  message: Message;
  isOwn: boolean;
  showAvatar: boolean;
}) {
  return (
    <div
      className={cn(
        'flex items-end gap-2 px-4 py-1',
        isOwn ? 'flex-row-reverse' : 'flex-row'
      )}
    >
      {showAvatar && !isOwn && (
        <Avatar className="w-8 h-8 flex-shrink-0">
          <AvatarImage src={message.sender?.avatar_url} loading="lazy" />
          <AvatarFallback className="text-xs">
            {message.sender?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
      )}
      {!showAvatar && !isOwn && <div className="w-8" />}
      
      <div
        className={cn(
          'max-w-[75%] px-4 py-2 rounded-2xl',
          isOwn
            ? 'bg-primary text-primary-foreground rounded-br-md'
            : 'bg-muted rounded-bl-md'
        )}
      >
        <p className="text-sm break-words whitespace-pre-wrap">
          {message.message_text}
        </p>
        <span className={cn(
          'text-[10px] mt-1 block',
          isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground'
        )}>
          {new Date(message.created_at).toLocaleTimeString([], { 
            hour: '2-digit', 
            minute: '2-digit' 
          })}
        </span>
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for minimal re-renders
  return prevProps.message.id === nextProps.message.id &&
         prevProps.isOwn === nextProps.isOwn &&
         prevProps.showAvatar === nextProps.showAvatar;
});

export const OptimizedMessageList = memo(function OptimizedMessageList({
  messages,
  currentUserId,
  className,
}: OptimizedMessageListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const prevLengthRef = useRef(messages.length);

  // Auto-scroll to bottom only when new messages arrive
  useEffect(() => {
    if (messages.length > prevLengthRef.current && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
    prevLengthRef.current = messages.length;
  }, [messages.length]);

  // Initial scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, []);

  if (messages.length === 0) {
    return (
      <div className={cn('flex items-center justify-center h-full text-muted-foreground', className)}>
        No messages yet. Start the conversation!
      </div>
    );
  }

  return (
    <div ref={scrollRef} className={cn('overflow-y-auto h-full', className)}>
      <div className="flex flex-col py-4 space-y-1">
        {messages.map((message, index) => {
          const prevMessage = messages[index - 1];
          const showAvatar = !prevMessage || prevMessage.sender_id !== message.sender_id;
          const isOwn = message.sender_id === currentUserId;

          return (
            <MessageBubble
              key={message.id}
              message={message}
              isOwn={isOwn}
              showAvatar={showAvatar}
            />
          );
        })}
      </div>
    </div>
  );
});

export default OptimizedMessageList;
