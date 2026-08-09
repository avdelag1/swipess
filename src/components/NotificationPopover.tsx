import { useCallback, useEffect, useMemo, useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell,
  CheckCheck,
  Eye,
  Flame,
  MessageSquare,
  Sparkles,
  Trash2,
  X
} from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useUnreadNotifications } from '@/hooks/useUnreadNotifications';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { AnimatePresence, motion } from 'framer-motion';
import { useLocation, useNavigate } from 'react-router-dom';
import { notificationTypeConfigs as typeConfigs } from '@/utils/notificationConfigs';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { getTopBarChrome, isDashboardPath } from '@/utils/chromeStyles';

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

function NotificationItem({ notification, onClick, onDismiss, index: _index }: NotificationItemProps) {
  const _role = getNotificationRole(notification);
  const config = typeConfigs[notification.type as keyof typeof typeConfigs] || typeConfigs.like;
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);
  const [_isSwiping, setIsSwiping] = useState(false);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ 
        type: "spring",
        stiffness: 500,
        damping: 30,
        duration: 0.15
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
      <div className="absolute inset-0 bg-red-500/80 flex items-center justify-end px-6 pointer-events-none rounded-xl">
        <Trash2 className="w-5 h-5 text-white drop-shadow-md" />
      </div>
      
      <Card
        className={cn(
          "group cursor-pointer transition-all duration-300 border overflow-hidden",
          !notification.read
            ? 'bg-white/10 backdrop-blur-xl border-white/20 shadow-[0_8px_30px_rgb(0,0,0,0.12)]'
            : 'bg-white/5 backdrop-blur-md border-white/5 shadow-none',
          "relative z-10 hover:bg-white/15" // Ensure card is above indicator
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
                      "w-11 h-11 rounded-xl object-cover transition-all"
                    )}
                  />
                  {/* Type indicator badge */}
                  <div className="absolute -bottom-1 -right-1 p-1 rounded-full bg-[#1e1b4b] border-none shadow-none flex items-center justify-center">
                    <Icon className="w-3 h-3 text-white" />
                  </div>
                </div>
              ) : (
                <div className={cn(
                  "p-2.5 rounded-xl bg-white/10"
                )}>
                  <Icon className="w-5 h-5 text-white" />
                </div>
              )}
              
              {/* Unread indicator dot */}
              {!notification.read && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary" />
              )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <div className="flex items-center gap-2 min-w-0">
                  <h4 className={cn(
                    "font-semibold text-sm leading-tight truncate",
                    !notification.read ? 'text-white' : 'text-white/80'
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
                    "hover:bg-white/10 hover:text-white",
                    isHovered ? "opacity-100" : "opacity-60 sm:opacity-0"
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

              <p className="text-xs font-normal line-clamp-2 mb-2 text-white/80 leading-relaxed">
                {notification.message}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[11px] font-medium text-white/60 flex items-center gap-1">
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
        <div className="w-20 h-20 rounded-2xl bg-white/10 flex items-center justify-center">
          <Bell className="w-9 h-9 text-white/30" />
        </div>
      </div>
      <h3 className="text-base font-semibold mb-2 text-white">
        {filter === 'all' ? 'No notifications yet' : 
         filter === 'unread' ? 'All caught up!' :
         `No ${filter} notifications`}
      </h3>
      <p className="text-sm text-white/60 max-w-[220px]">
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
  glassPillStyle?: React.CSSProperties;
  pillClassName?: string;
}

import { useAppTheme } from '@/hooks/useAppTheme';
// ...
export function NotificationPopover({ className, children, glassPillStyle, pillClassName }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const _location = useLocation();
  const { isLight, isDark: _isDark } = useAppTheme();
  
  const { 
    notifications, 
    dismissNotification, 
    markAllAsRead, 
    handleNotificationClick,
    markNotificationAsRead 
  } = useNotificationSystem();
  
  const { unreadCount } = useUnreadNotifications();

  // Listen for global open event
  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-notifications-popover', handleOpen);
    return () => window.removeEventListener('open-notifications-popover', handleOpen);
  }, []);
  
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
  const filteredNotifications = useMemo(() => notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  }), [notifications, activeFilter]);

  // Count notifications by type
  const _likesCount = useMemo(() => notifications.filter(n => n.type === 'like' || n.type === 'super_like').length, [notifications]);
  const _messagesCount = useMemo(() => notifications.filter(n => n.type === 'message').length, [notifications]);
  const _matchesCount = useMemo(() => notifications.filter(n => n.type === 'match').length, [notifications]);

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

  const isDashboard = isDashboardPath(_location.pathname);
  // Dashboard always has light background — always use dark icons there
  const { iconColor: bellColor, iconShadow } = getTopBarChrome(isLight, isDashboard);
  const triggerButton = children || (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        "relative shrink-0 transition-all duration-300",
        "hover:opacity-90 active:scale-[0.92] group !rounded-full",
        "touch-manipulation",
        pillClassName,
      )}
      style={{ ...glassPillStyle, overflow: 'visible' }}
      onClick={(_e) => {
        haptics.tap();
        setIsOpen(true);
      }}
      aria-label={`Notifications${unreadCount > 0 ? ` (${unreadCount} unread)` : ''}`}
    >
      <span
        className={cn(
          'relative flex items-center justify-center w-5 h-5 shrink-0 neo-naive neo-naive-header-icon neo-naive-header-icon--coral',
          !isLight && 'neo-naive--dark',
        )}
      >
        <Bell
          strokeWidth={2}
          className={cn(
            "h-[18px] w-[18px] transition-colors duration-150",
            "opacity-90 group-hover:opacity-100"
          )}
          style={{ color: bellColor, filter: iconShadow }}
        />
        {unreadCount > 0 && (
          <span
            className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-background/80 shadow-sm z-[2]"
          />
        )}
      </span>
    </Button>
  );

  return (
    <>
      {triggerButton}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          hideCloseButton
          className={cn(
            "z-[10003] w-[min(calc(100vw-1rem),440px)] p-0 rounded-3xl overflow-hidden gap-0",
            isLight ? "bg-white/70" : "bg-zinc-900/60",
            className
          )}
          style={{
            backdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
            WebkitBackdropFilter: 'blur(40px) saturate(200%) brightness(1.05)',
            border: isLight ? '0.5px solid rgba(255, 255, 255, 0.6)' : '0.5px solid rgba(255, 255, 255, 0.15)',
            boxShadow: isLight
              ? '0 10px 40px rgba(0, 0, 0, 0.1), inset 0 0.5px 0 rgba(255, 255, 255, 0.8)'
              : '0 10px 40px rgba(0, 0, 0, 0.4), inset 0 0.5px 0 rgba(255, 255, 255, 0.12)',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className="flex flex-col w-full h-full text-white force-white"
          >
            <div className="absolute inset-0 bg-black/30 backdrop-blur-[30px] rounded-3xl" style={{ backdropFilter: 'blur(30px) saturate(150%)', WebkitBackdropFilter: 'blur(30px) saturate(150%)' }} />
            
            {/* Header */}
            <div className="relative px-4 pt-4 pb-3 border-b border-white/20 bg-transparent">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary/20">
                    <Bell className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold tracking-tight text-white">Notifications</h2>
                    <p className="text-sm text-white/70">
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
                      className="gap-2 h-9 px-3 text-sm font-medium text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                    >
                      <CheckCheck className="w-4 h-4" />
                      <span className="hidden sm:inline">Mark all read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Tabs */}
            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="relative w-full text-white">
              <div className="px-2 py-2">
                <TabsList className="flex w-full rounded-xl p-1 h-auto gap-0.5 bg-white/5">
                  <TabsTrigger
                    value="all"
                    className="flex-1 min-w-0 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all"
                  >
                    All
                  </TabsTrigger>
                  <TabsTrigger
                    value="unread"
                    className="flex-1 min-w-0 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1.5"
                  >
                    <span>Unread</span>
                    {unreadCount > 0 && (
                      <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">{unreadCount}</Badge>
                    )}
                  </TabsTrigger>
                  <TabsTrigger
                    value="like"
                    className="flex-1 min-w-0 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1"
                  >
                    <Flame className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Likes</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="message"
                    className="flex-1 min-w-0 data-[state=active]:bg-white/20 data-[state=active]:text-white text-white/60 data-[state=active]:shadow-sm rounded-lg py-2 px-3 text-xs font-semibold transition-all flex items-center justify-center gap-1"
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
          </motion.div>

          {/* Footer */}
          {notifications.length > 0 && (
            <div className="relative px-4 py-3 bg-white/5">
              <Button
                variant="ghost"
                className="w-full text-xs font-semibold text-white/70 hover:text-white hover:bg-white/10 transition-colors"
                onClick={() => {
                  haptics.tap();
                  navigate('/dashboard/notifications');
                  setIsOpen(false);
                }}
              >
                <Eye className="w-4 h-4 mr-2" />
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

