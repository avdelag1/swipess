import { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  MessageSquare,
  Flame,
  CheckCheck,
  Trash2,
  Star,
  Sparkles,
  Eye,
  Crown,
  X,
  Zap,
  UserPlus
} from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { notificationTypeConfigs as typeConfigs } from '@/utils/notificationConfigs';
import { useTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';

// Notification type configurations for visual consistency

// Helper function to get notification role from metadata
const getNotificationRole = (notification: any): 'client' | 'owner' | 'neutral' => {
  if (notification.metadata?.role) {
    return notification.metadata.role;
  }
  if (notification.metadata?.targetType === 'listing') {
    return 'client';
  }
  if (notification.metadata?.targetType === 'profile') {
    return 'owner';
  }
  return 'neutral';
};

// Notification item component with individual animations
interface NotificationItemProps {
  notification: any;
  onClick: () => void;
  onDismiss: () => void;
  index: number;
}

function NotificationItem({ notification, onClick, onDismiss, index }: NotificationItemProps) {
  const role = getNotificationRole(notification);
  const config = typeConfigs[notification.type as keyof typeof typeConfigs] || typeConfigs.like;
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);
  const [isSwiping, setIsSwiping] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 10, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ 
        duration: 0.2, 
        delay: index * 0.03,
        ease: "easeOut"
      }}
      drag="x"
      dragConstraints={{ left: -140, right: 0 }}
      dragElastic={0.25}
      onDragStart={() => { setIsSwiping(true); haptics.tap(); }}
      onDragEnd={(_, info) => {
        setIsSwiping(false);
        if (info.offset.x < -70) {
          haptics.success();
          onDismiss();
        }
      }}
      className="relative overflow-hidden rounded-xl"
    >
      {/* Swipe to dismiss indicator — shown behind card */}
      <div className="absolute inset-0 bg-destructive/10 flex items-center justify-end px-6 pointer-events-none">
        <Trash2 className="w-5 h-5 text-destructive animate-pulse" />
      </div>
      
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-200 border overflow-hidden",
          !notification.read
            ? 'bg-card border-border/60 shadow-sm'
            : 'bg-card/50 border-border/20',
          "relative z-10" // Ensure card is above indicator
        )}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <CardContent className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            {/* Avatar or Icon */}
            <div className="flex-shrink-0 relative">
              {notification.avatar ? (
                <div className="relative">
                  <img
                    src={notification.avatar}
                    alt={notification.title}
                    className={cn(
                      "w-11 h-11 rounded-xl object-cover ring-2 transition-all",
                      !notification.read 
                        ? 'ring-primary/30' 
                        : 'ring-transparent'
                    )}
                  />
                  {/* Type indicator badge */}
                  <div className="absolute -bottom-1.5 -right-1.5 p-1.5 rounded-lg" style={{ backgroundColor: config.bg }}>
                    <Icon className="w-3 h-3" style={{ color: config.accentColor }} />
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "p-2.5 rounded-xl",
                  role === 'client' ? 'bg-cyan-500/10' : 
                  role === 'owner' ? 'bg-amber-500/10' : config.bg
                )}>
                  <Icon className="w-5 h-5" style={{ 
                    color: role === 'client' ? '#06b6d4' : 
                          role === 'owner' ? '#f59e0b' : config.accentColor
                  }} />
                </div>
              )}
              
              {/* Unread indicator dot */}
              {!notification.read && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background animate-pulse" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className={cn(
                    "font-semibold text-sm leading-tight truncate",
                    !notification.read ? 'text-foreground' : 'text-foreground/80'
                  )}>
                    {notification.title}
                  </h4>
                </div>
                
                {/* Dismiss button — ENLARGED TOUCH TARGET */}
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-9 w-9 p-0 flex-shrink-0 transition-all duration-200 rounded-full",
                    "hover:bg-destructive/10 hover:text-destructive",
                    isHovered ? "opacity-100" : "opacity-0 sm:opacity-0"
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.tap();
                    onDismiss();
                  }}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>

              <p className="text-xs font-normal line-clamp-2 mb-2 text-muted-foreground leading-relaxed">
                {notification.message}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-muted-foreground/70 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </span>
                {!notification.read && (
                  <Badge variant="secondary" className="h-5 px-2 text-[10px] font-semibold bg-primary/10 text-primary">
                    NEW
                  </Badge>
                )}
                <span className="text-[10px] font-medium px-1.5 py-0.5 rounded-md" style={{ backgroundColor: config.bg, color: config.accentColor }}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

// Empty state component
function EmptyState({ filter }: { filter: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="mb-5 relative">
        <div className="w-20 h-20 rounded-2xl bg-muted/30 flex items-center justify-center">
          <Bell className="w-9 h-9 text-muted-foreground/30" />
        </div>
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute inset-0 rounded-2xl border-2 border-primary/20"
        />
      </div>
      <h3 className="text-base font-semibold mb-2 text-foreground">
        {filter === 'all' ? 'No notifications yet' : 
         filter === 'unread' ? 'All caught up!' :
         `No ${filter} notifications`}
      </h3>
      <p className="text-sm text-muted-foreground/70 max-w-[220px]">
        {filter === 'all' 
          ? 'When you get new notifications, they\'ll show up here'
          : 'You\'ve seen all your notifications in this category'}
      </p>
    </motion.div>
  );
}

// Main Notification Popover Component
interface NotificationPopoverProps {
  className?: string;
  children?: React.ReactNode;
}

export function NotificationPopover({ className, children }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const { 
    notifications, 
    dismissNotification, 
    markAllAsRead, 
    handleNotificationClick,
    markNotificationAsRead 
  } = useNotificationSystem();
  
  const { unreadCount } = useUnreadNotifications();
  
  // Mark all as read when popover opens
  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      // Use a slight delay for better UX
      const timeout = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  // Filter notifications based on active tab
  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  // Count notifications by type
  const _likesCount = notifications.filter(n => n.type === 'like' || n.type === 'super_like').length;
  const _messagesCount = notifications.filter(n => n.type === 'message').length;
  const _matchesCount = notifications.filter(n => n.type === 'match').length;

  const handleNotificationAction = useCallback((notification: any) => {
    // Mark as read if not already
    if (!notification.read) {
      markNotificationAsRead(notification.id);
    }
    
    // Handle click navigation
    handleNotificationClick(notification);
    
    // Close popover and navigate
    setIsOpen(false);
  }, [handleNotificationClick, markNotificationAsRead]);

  const handleDismiss = useCallback((id: string) => {
    haptics.tap();
    dismissNotification(id);
  }, [dismissNotification]);

  const handleViewAll = useCallback(() => {
    setIsOpen(false);
    navigate('/notifications');
  }, [navigate]);

  const triggerButton = children || (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative h-9 w-9 transition-all duration-200",
        "hover:scale-105 active:scale-95 group bg-transparent border-0",
        "touch-manipulation"
      )}
      onClick={() => {
        haptics.tap();
        setIsOpen(true);
      }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <div className="relative">
        <Bell
          strokeWidth={1.5}
          className={cn(
            "h-5 w-5 transition-colors duration-150",
            isDark ? "text-white/70" : "text-foreground/80",
            "group-hover:text-foreground"
          )}
        />
        {/* Notification badge */}
        <AnimatePresence>
          {unreadCount > 0 && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
              className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center rounded-full bg-primary text-[10px] font-bold text-white px-1.5 shadow-lg"
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </motion.span>
          )}
        </AnimatePresence>
      </div>

      {/* Subtle indicator shadow removed per user request for simplicity */}
    </Button>
  );

  return (
    <>
      {triggerButton}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          hideCloseButton
          className={cn(
            "w-[min(calc(100vw-1rem),440px)] p-0 rounded-2xl",
            theme === 'ivanna-style' ? "bg-sky-50/90 backdrop-blur-3xl border-sky-100/50" : "bg-background border border-border/60 shadow-2xl",
            "overflow-hidden gap-0",
            className
          )}
          onInteractOutside={() => setIsOpen(false)}
        >
          <DialogTitle className="sr-only">Notifications</DialogTitle>

          {/* Header */}
          <div className={cn(
            "px-4 pt-4 pb-3 border-b border-border/40 backdrop-blur-sm",
            theme === 'ivanna-style' ? "bg-sky-100/30" : "bg-background/80"
          )}>
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10">
                  <Bell className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-lg font-bold tracking-tight">Notifications</h2>
                  <p className="text-sm text-muted-foreground">
                    {unreadCount > 0 ? (
                      <span className="font-medium text-primary">{unreadCount} unread</span>
                    ) : (
                      'All caught up'
                    )}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1">
                {unreadCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      haptics.tap();
                      markAllAsRead();
                    }}
                    className="gap-2 h-9 px-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <CheckCheck className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark all read</span>
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg text-muted-foreground hover:text-foreground"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs value={activeFilter} onValueChange={setActiveFilter} className="w-full">
            <div className={cn(
              "px-2 py-2 border-b border-border/30",
              theme === 'ivanna-style' ? "bg-sky-50/20" : ""
            )}>
              <TabsList className={cn(
                "flex w-full rounded-xl p-1 h-auto gap-0.5",
                theme === 'ivanna-style' ? "bg-sky-400/10" : "bg-muted/40"
              )}>
                <TabsTrigger
                  value="all"
                  className="flex-1 min-w-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all"
                >
                  All
                </TabsTrigger>
                <TabsTrigger
                  value="unread"
                  className="flex-1 min-w-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                >
                  <span>Unread</span>
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">{unreadCount}</Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="like"
                  className="flex-1 min-w-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <Flame className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Likes</span>
                </TabsTrigger>
                <TabsTrigger
                  value="message"
                  className="flex-1 min-w-0 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Msgs</span>
                </TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value={activeFilter} className="m-0 mt-0">
              <ScrollArea className="h-[min(calc(100vh-16rem),420px)]">
                <div className="p-3">
                  {filteredNotifications.length === 0 ? (
                    <EmptyState filter={activeFilter} />
                  ) : (
                    <AnimatePresence mode="popLayout">
                      <div className="space-y-2">
                        {filteredNotifications.map((notification, index) => (
                          <NotificationItem
                            key={notification.id}
                            notification={notification}
                            index={index}
                            onClick={() => handleNotificationAction(notification)}
                            onDismiss={() => handleDismiss(notification.id)}
                          />
                        ))}
                      </div>
                    </AnimatePresence>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="px-4 py-3 border-t border-border/40 bg-muted/20">
              <Button
                variant="outline"
                className="w-full gap-2 h-10 text-sm font-semibold border-border/40 hover:bg-muted/50 transition-colors"
                onClick={handleViewAll}
              >
                <Eye className="w-4 h-4" />
                View All Notifications
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

export default NotificationPopover;
