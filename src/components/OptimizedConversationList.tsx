/**
 * Optimized Conversation List
 * Uses memoization for efficient rendering of conversation sidebar
 */

import { memo, useCallback } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { Home, Car, Ship, Bike } from 'lucide-react';

export interface Conversation {
  id: string;
  other_user?: {
    id: string;
    full_name: string;
    avatar_url?: string;
    role: string;
  };
  listing?: {
    id: string;
    title: string;
    price?: number;
    images?: string[];
    category?: string;
    mode?: string;
    address?: string;
    city?: string;
  };
  last_message?: string;
  last_message_at?: string;
  unread_count?: number;
}

interface OptimizedConversationListProps {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

// Category icon helper
const getCategoryIcon = (category?: string) => {
  switch (category) {
    case 'property': return Home;
    case 'vehicle': return Car;
    case 'yacht': return Ship;
    case 'bicycle':
    case 'motorcycle': return Bike;
    default: return Home;
  }
};

// Memoized conversation item - only re-renders when data changes
const ConversationItem = memo(function ConversationItem({
  conversation,
  isSelected,
  onSelect,
}: {
  conversation: Conversation;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const CategoryIcon = getCategoryIcon(conversation.listing?.category);

  return (
    <div
      className={cn(
        'flex items-center gap-3 p-3 cursor-pointer transition-colors border-b',
        isSelected
          ? 'bg-primary/10 border-l-2 border-l-primary'
          : 'hover:bg-muted/50'
      )}
      onClick={onSelect}
    >
      <div className="relative">
        <Avatar className="h-12 w-12">
          <AvatarImage 
            src={conversation.other_user?.avatar_url}
            loading="lazy"
          />
          <AvatarFallback>
            {conversation.other_user?.full_name?.charAt(0) || '?'}
          </AvatarFallback>
        </Avatar>
        {(conversation.unread_count ?? 0) > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]"
          >
            {conversation.unread_count}
          </Badge>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">
            {conversation.other_user?.full_name || 'User'}
          </span>
          {conversation.last_message_at && (
            <span className="text-xs text-muted-foreground flex-shrink-0 ml-2">
              {formatDistanceToNow(conversation.last_message_at)}
            </span>
          )}
        </div>

        {conversation.listing && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <CategoryIcon className="h-3 w-3" />
            <span className="truncate">{conversation.listing.title}</span>
          </div>
        )}

        {conversation.last_message && (
          <p className="text-xs text-muted-foreground truncate mt-0.5">
            {conversation.last_message}
          </p>
        )}
      </div>
    </div>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for minimal re-renders
  return prevProps.conversation.id === nextProps.conversation.id &&
         prevProps.conversation.last_message === nextProps.conversation.last_message &&
         prevProps.conversation.unread_count === nextProps.conversation.unread_count &&
         prevProps.isSelected === nextProps.isSelected;
});

export const OptimizedConversationList = memo(function OptimizedConversationList({
  conversations,
  selectedId,
  onSelect,
  className,
}: OptimizedConversationListProps) {
  // Stable callback to prevent unnecessary re-renders
  const handleSelect = useCallback((id: string) => {
    onSelect(id);
  }, [onSelect]);

  if (conversations.length === 0) {
    return (
      <div className={cn('flex flex-col items-center justify-center h-full text-muted-foreground p-4', className)}>
        <p className="text-sm">No conversations yet</p>
      </div>
    );
  }

  return (
    <div className={cn('overflow-y-auto', className)}>
      {conversations.map((conversation) => (
        <ConversationItem
          key={conversation.id}
          conversation={conversation}
          isSelected={selectedId === conversation.id}
          onSelect={() => handleSelect(conversation.id)}
        />
      ))}
    </div>
  );
});

export default OptimizedConversationList;
