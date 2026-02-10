import { memo, useRef, useCallback, useEffect } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Bell, MessageSquare, Flame, Star, Sparkles, Trash2,
  Archive, Eye, Home, Ship, Bike, Car, MoreHorizontal
} from 'lucide-react';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link_url?: string | null;
  related_user_id?: string | null;
  metadata?: any;
}

interface VirtualizedNotificationListProps {
  notifications: Notification[];
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (url: string) => void;
  /** Called when scroll reaches near the end of the list (within 5 items) */
  onEndReached?: () => void;
}

const NotificationIcon = memo(({ type, className = "w-5 h-5" }: { type: string; className?: string }) => {
  switch (type) {
    case 'new_message':
    case 'message':
      return <MessageSquare className={`${className} text-blue-500`} />;
    case 'new_like':
    case 'like':
      return <Flame className={`${className} text-orange-500`} />;
    case 'new_match':
    case 'match':
      return <Sparkles className={`${className} text-amber-500`} />;
    case 'super_like':
      return <Star className={`${className} text-yellow-500`} />;
    case 'property':
      return <Home className={`${className} text-emerald-500`} />;
    case 'yacht':
      return <Ship className={`${className} text-cyan-500`} />;
    case 'bicycle':
      return <Bike className={`${className} text-orange-500`} />;
    case 'vehicle':
      return <Car className={`${className} text-purple-500`} />;
    default:
      return <Bell className={`${className} text-muted-foreground`} />;
  }
});

NotificationIcon.displayName = 'NotificationIcon';

const NotificationIconBg = memo(({ type }: { type: string }) => {
  const bgGradients: Record<string, string> = {
    'new_message': 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
    'message': 'bg-gradient-to-br from-blue-500/20 to-cyan-500/10',
    'new_like': 'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
    'like': 'bg-gradient-to-br from-orange-500/20 to-amber-500/10',
    'new_match': 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
    'match': 'bg-gradient-to-br from-amber-500/20 to-yellow-500/10',
    'super_like': 'bg-gradient-to-br from-yellow-500/20 to-orange-500/10',
    'property': 'bg-gradient-to-br from-emerald-500/20 to-teal-500/10',
    'yacht': 'bg-gradient-to-br from-cyan-500/20 to-blue-500/10',
    'bicycle': 'bg-gradient-to-br from-orange-500/20 to-red-500/10',
    'vehicle': 'bg-gradient-to-br from-purple-500/20 to-pink-500/10',
  };

  return (
    <div className={`p-3 rounded-2xl shadow-lg ${bgGradients[type] || 'bg-gradient-to-br from-muted to-muted-foreground/20'}`}>
      <NotificationIcon type={type} className="w-6 h-6" />
    </div>
  );
});

NotificationIconBg.displayName = 'NotificationIconBg';

// Single notification row - memoized for performance
const NotificationRow = memo(({
  notification,
  onMarkAsRead,
  onDelete,
  onNavigate,
}: {
  notification: Notification;
  onMarkAsRead: (id: string) => void;
  onDelete: (id: string) => void;
  onNavigate?: (url: string) => void;
}) => {
  const handleClick = useCallback(() => {
    if (!notification.read) {
      onMarkAsRead(notification.id);
    }
    if (notification.link_url && onNavigate) {
      onNavigate(notification.link_url);
    }
  }, [notification, onMarkAsRead, onNavigate]);

  return (
    <Card
      className={`cursor-pointer transition-all duration-200 hover:shadow-xl hover:scale-[1.01] border ${
        notification.read
          ? 'bg-gradient-to-br from-card/80 to-card/40 border-border/40'
          : 'bg-gradient-to-br from-primary/10 via-card to-card border-primary/30 shadow-lg shadow-primary/5'
      }`}
      onClick={handleClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <NotificationIconBg type={notification.type} />

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <h4 className={`font-semibold truncate ${notification.read ? 'text-foreground/70' : 'text-foreground'}`}>
                {notification.title}
              </h4>
              {!notification.read && (
                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary shrink-0">
                  New
                </Badge>
              )}
            </div>
            <p className={`text-sm line-clamp-2 ${notification.read ? 'text-muted-foreground/70' : 'text-muted-foreground'}`}>
              {notification.message}
            </p>
            <p className="text-xs text-muted-foreground mt-2">
              {formatDistanceToNow(new Date(notification.created_at))}
            </p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                <MoreHorizontal className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!notification.read && (
                <DropdownMenuItem onClick={(e) => {
                  e.stopPropagation();
                  onMarkAsRead(notification.id);
                }}>
                  <Eye className="w-4 h-4 mr-2" />
                  Mark as read
                </DropdownMenuItem>
              )}
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  onDelete(notification.id);
                }}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardContent>
    </Card>
  );
});

NotificationRow.displayName = 'NotificationRow';

/**
 * Virtualized notification list - only renders visible rows
 * Maintains 60fps scrolling even with 100+ notifications
 *
 * PERFORMANCE FIX: onEndReached is detected INSIDE the virtualizer,
 * not from outer wrapper scroll events. This ensures prefetch triggers reliably.
 */
export const VirtualizedNotificationList = memo(({
  notifications,
  onMarkAsRead,
  onDelete,
  onNavigate,
  onEndReached,
}: VirtualizedNotificationListProps) => {
  const parentRef = useRef<HTMLDivElement>(null);
  const isFetchingMoreRef = useRef(false);

  const virtualizer = useVirtualizer({
    count: notifications.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 100, // Estimated row height
    overscan: 5, // Render 5 extra items above/below viewport
  });

  const items = virtualizer.getVirtualItems();

  // PERFORMANCE FIX: Detect end-of-list from INSIDE virtualizer
  // This ensures prefetch triggers reliably (scroll events on outer wrapper don't fire)
  useEffect(() => {
    if (!onEndReached || items.length === 0 || isFetchingMoreRef.current) return;

    // Get the last visible item index
    const lastVisibleIndex = items[items.length - 1]?.index ?? 0;
    const totalItems = notifications.length;
    const threshold = 5; // Trigger when within 5 items of end

    // Check if we're near the end
    if (totalItems > threshold && lastVisibleIndex >= totalItems - threshold) {
      isFetchingMoreRef.current = true;

      // Use requestIdleCallback for non-blocking prefetch
      if ('requestIdleCallback' in window) {
        (window as Window).requestIdleCallback(() => {
          onEndReached();
          // Reset after a short delay to allow re-triggering if needed
          setTimeout(() => { isFetchingMoreRef.current = false; }, 2000);
        }, { timeout: 2000 });
      } else {
        setTimeout(() => {
          onEndReached();
          setTimeout(() => { isFetchingMoreRef.current = false; }, 2000);
        }, 100);
      }
    }
  }, [items, notifications.length, onEndReached]);

  return (
    <div
      ref={parentRef}
      className="h-[calc(100vh-320px)] overflow-auto"
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
            const notification = notifications[virtualRow.index];
            return (
              <div
                key={notification.id}
                data-index={virtualRow.index}
                ref={virtualizer.measureElement}
                className="pb-3"
              >
                <NotificationRow
                  notification={notification}
                  onMarkAsRead={onMarkAsRead}
                  onDelete={onDelete}
                  onNavigate={onNavigate}
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
});

VirtualizedNotificationList.displayName = 'VirtualizedNotificationList';
