import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
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
  X,
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
import useAppTheme from '@/hooks/useAppTheme';

const getNotificationRole = (notification: any): 'client' | 'owner' | 'neutral' => {
  if (notification.metadata?.role) return notification.metadata.role;
  if (notification.metadata?.targetType === 'listing') return 'client';
  if (notification.metadata?.targetType === 'profile') return 'owner';
  return 'neutral';
};

interface NotificationItemProps {
  notification: any;
  onClick: () => void;
  onDismiss: () => void;
  index: number;
  isLight: boolean;
}

function NotificationItem({ notification, onClick, onDismiss, index: _index, isLight }: NotificationItemProps) {
  getNotificationRole(notification);
  const config = typeConfigs[notification.type as keyof typeof typeConfigs] || typeConfigs.like;
  const Icon = config.icon;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.15 } }}
      transition={{ type: 'spring', stiffness: 500, damping: 30, duration: 0.15 }}
      drag="x"
      dragConstraints={{ left: -140, right: 0 }}
      dragElastic={0.25}
      onDragStart={() => {
        haptics.tap();
      }}
      onDragEnd={(_, info) => {
        if (info.offset.x < -70) {
          haptics.success();
          onDismiss();
        }
      }}
      className="relative overflow-hidden"
      style={{ borderRadius: '1.1rem 1.25rem 1.05rem 1.2rem / 1.2rem 1rem 1.25rem 1.1rem' }}
    >
      <div
        className="absolute inset-0 bg-red-500 flex items-center justify-end px-6 pointer-events-none"
        style={{ borderRadius: 'inherit' }}
      >
        <Trash2 className="w-5 h-5 text-white drop-shadow-md" strokeWidth={2.25} />
      </div>

      <div
        data-neo-naive-card
        className={cn(
          'group cursor-pointer transition-colors relative z-10 neo-naive-card border-2 overflow-hidden',
          isLight
            ? !notification.read
              ? 'bg-white border-[#141414] hover:bg-black/[0.03]'
              : 'bg-white/90 border-[#141414]/70 hover:bg-black/[0.02]'
            : !notification.read
              ? 'bg-[#16161e] border-white/90 hover:bg-white/[0.06]'
              : 'bg-[#14141c] border-white/55 hover:bg-white/[0.04]',
        )}
        style={{
          borderRadius: 'inherit',
          boxShadow: isLight ? '1.25px 1.25px 0 #141414' : '1.25px 1.25px 0 rgba(255,255,255,0.28)',
        }}
        onClick={onClick}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="p-3 sm:p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0 relative">
              {notification.avatar ? (
                <div className="relative">
                  <img
                    src={notification.avatar}
                    alt={notification.title}
                    className={cn(
                      'w-11 h-11 object-cover border-2',
                      isLight ? 'border-[#141414]' : 'border-white/80',
                    )}
                    style={{
                      borderRadius: '0.85rem 1rem 0.8rem 0.95rem / 0.95rem 0.8rem 1rem 0.85rem',
                      boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.28)',
                    }}
                  />
                  <div
                    className={cn(
                      'absolute -bottom-1 -right-1 p-1 rounded-full border-2 flex items-center justify-center',
                      isLight ? 'bg-white border-[#141414]' : 'bg-[#121218] border-white/85',
                    )}
                  >
                    <Icon className={cn('w-3 h-3', isLight ? 'text-black' : 'text-white')} strokeWidth={2.25} />
                  </div>
                </div>
              ) : (
                <div
                  className={cn(
                    'p-2.5 border-2',
                    isLight ? 'bg-black/[0.04] border-[#141414]' : 'bg-white/10 border-white/80',
                  )}
                  style={{
                    borderRadius: '0.85rem 1rem 0.8rem 0.95rem / 0.95rem 0.8rem 1rem 0.85rem',
                    boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.28)',
                  }}
                >
                  <Icon className={cn('w-5 h-5', isLight ? 'text-black' : 'text-white')} strokeWidth={2.25} />
                </div>
              )}

              {!notification.read && (
                <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-primary border border-background" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4
                  className={cn(
                    'font-semibold text-sm leading-tight truncate',
                    isLight
                      ? !notification.read
                        ? 'text-black'
                        : 'text-black/75'
                      : !notification.read
                        ? 'text-white'
                        : 'text-white/75',
                  )}
                >
                  {notification.title}
                </h4>

                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    'h-9 w-9 p-0 flex-shrink-0 transition-all duration-200 rounded-full',
                    isLight ? 'hover:bg-black/5 hover:text-black text-black/50' : 'hover:bg-white/10 hover:text-white text-white/55',
                    isHovered ? 'opacity-100' : 'opacity-60 sm:opacity-0',
                  )}
                  onClick={(e) => {
                    e.stopPropagation();
                    haptics.tap();
                    onDismiss();
                  }}
                >
                  <X className="w-4 h-4" strokeWidth={2.25} />
                </Button>
              </div>

              <p
                className={cn(
                  'text-xs font-normal line-clamp-2 mb-2 leading-relaxed',
                  isLight ? 'text-black/55' : 'text-white/60',
                )}
              >
                {notification.message}
              </p>

              <div className="flex items-center gap-2 flex-wrap">
                <span
                  className={cn(
                    'text-[11px] font-medium flex items-center gap-1',
                    isLight ? 'text-black/40' : 'text-white/45',
                  )}
                >
                  <Sparkles className="w-3 h-3" strokeWidth={2.25} />
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </span>
                {!notification.read && (
                  <Badge
                    variant="secondary"
                    className={cn(
                      'h-5 px-2 text-[10px] font-semibold border',
                      isLight ? 'bg-primary/10 text-primary border-primary/25' : 'bg-primary/15 text-primary border-primary/30',
                    )}
                  >
                    NEW
                  </Badge>
                )}
                <span
                  className="text-[10px] font-medium px-1.5 py-0.5 rounded-md border"
                  style={{
                    backgroundColor: config.bg,
                    color: config.accentColor,
                    borderColor: isLight ? 'rgba(20,20,20,0.15)' : 'rgba(255,255,255,0.2)',
                  }}
                >
                  {config.label}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

function EmptyState({ filter, isLight }: { filter: string; isLight: boolean }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col items-center justify-center py-12 px-4 text-center"
    >
      <div className="mb-5 relative">
        <div
          className={cn(
            'w-20 h-20 flex items-center justify-center border-2',
            isLight ? 'bg-white border-[#141414]' : 'bg-[#16161e] border-white/85',
          )}
          style={{
            borderRadius: '1.15rem 1.35rem 1.05rem 1.25rem / 1.25rem 1.05rem 1.35rem 1.15rem',
            boxShadow: isLight ? '1.5px 1.5px 0 #141414' : '1.5px 1.5px 0 rgba(255,255,255,0.3)',
          }}
        >
          <Bell className={cn('w-9 h-9', isLight ? 'text-black/25' : 'text-white/30')} strokeWidth={2.25} />
        </div>
      </div>
      <h3 className={cn('text-base font-semibold mb-2', isLight ? 'text-black' : 'text-white')}>
        {filter === 'all'
          ? 'No notifications yet'
          : filter === 'unread'
            ? 'All caught up!'
            : `No ${filter} notifications`}
      </h3>
      <p className={cn('text-sm max-w-[220px]', isLight ? 'text-black/50' : 'text-white/55')}>
        {filter === 'all'
          ? "When you get new notifications, they'll show up here"
          : "You've seen all your notifications in this category"}
      </p>
    </motion.div>
  );
}

interface NotificationPopoverProps {
  className?: string;
  children?: ReactNode;
  glassPillStyle?: CSSProperties;
  pillClassName?: string;
}

export function NotificationPopover({ className, children, glassPillStyle, pillClassName }: NotificationPopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const _location = useLocation();
  const { isLight } = useAppTheme();

  const {
    notifications,
    dismissNotification,
    markAllAsRead,
    handleNotificationClick,
    markNotificationAsRead,
  } = useNotificationSystem();

  const { unreadCount } = useUnreadNotifications();

  useEffect(() => {
    const handleOpen = () => setIsOpen(true);
    window.addEventListener('open-notifications-popover', handleOpen);
    return () => window.removeEventListener('open-notifications-popover', handleOpen);
  }, []);

  useEffect(() => {
    if (isOpen && unreadCount > 0) {
      const timeout = setTimeout(() => {
        markAllAsRead();
      }, 500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, unreadCount, markAllAsRead]);

  const filteredNotifications = useMemo(
    () =>
      notifications.filter((n) => {
        if (activeFilter === 'all') return true;
        if (activeFilter === 'unread') return !n.read;
        return n.type === activeFilter;
      }),
    [notifications, activeFilter],
  );

  const handleNotificationAction = useCallback(
    (notification: any) => {
      if (!notification.read) {
        markNotificationAsRead(notification.id);
      }
      handleNotificationClick(notification);
      setIsOpen(false);
    },
    [handleNotificationClick, markNotificationAsRead],
  );

  const handleDismiss = useCallback(
    (id: string) => {
      haptics.tap();
      dismissNotification(id);
    },
    [dismissNotification],
  );

  const isDashboard = isDashboardPath(_location.pathname);
  const { iconColor: bellColor, iconShadow } = getTopBarChrome(isLight, isDashboard);
  const triggerButton = children || (
    <Button
      variant="ghost"
      size="icon"
      className={cn(
        'relative shrink-0 transition-all duration-300',
        'hover:opacity-90 active:scale-[0.92] group !rounded-full',
        'touch-manipulation',
        pillClassName,
      )}
      style={{ ...glassPillStyle, overflow: 'visible' }}
      onClick={() => {
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
          className={cn('h-[18px] w-[18px] transition-colors duration-150', 'opacity-90 group-hover:opacity-100')}
          style={{ color: bellColor, filter: iconShadow }}
        />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-brand-primary ring-2 ring-background/80 shadow-sm z-[2]" />
        )}
      </span>
    </Button>
  );

  const inkBorder = isLight ? 'rgba(20,20,20,0.12)' : 'rgba(255,255,255,0.12)';
  const tabIdle = isLight ? 'text-black/45' : 'text-white/50';
  const tabActive = isLight
    ? 'data-[state=active]:bg-black data-[state=active]:text-white'
    : 'data-[state=active]:bg-white data-[state=active]:text-black';

  return (
    <>
      {triggerButton}

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent
          hideCloseButton
          data-swipess-dialog
          className={cn(
            'neo-naive z-[10003] w-[min(calc(100vw-1rem),440px)] p-0 overflow-hidden gap-0',
            !isLight && 'neo-naive--dark',
            isLight ? 'bg-white text-black' : 'bg-[#121218] text-white',
            className,
          )}
          style={{
            borderRadius: '1.55rem 1.75rem 1.45rem 1.7rem / 1.65rem 1.4rem 1.75rem 1.5rem',
            border: isLight ? '2.5px solid #141414' : '2.5px solid rgba(255,255,255,0.92)',
            boxShadow: isLight
              ? '1.5px 1.5px 0 #141414, 0 24px 60px rgba(20,20,20,0.18)'
              : '1.5px 1.5px 0 rgba(255,255,255,0.35), 0 24px 60px rgba(0,0,0,0.55)',
            background: isLight ? '#ffffff' : '#121218',
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
            className={cn('flex flex-col w-full h-full', isLight ? 'text-black' : 'text-white')}
          >
            <div className="relative px-4 pt-4 pb-3 border-b" style={{ borderColor: inkBorder }}>
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'p-2.5 border-2',
                      isLight ? 'bg-primary/10 border-[#141414]' : 'bg-primary/20 border-white/85',
                    )}
                    style={{
                      borderRadius: '0.85rem 1rem 0.8rem 0.95rem / 0.95rem 0.8rem 1rem 0.85rem',
                      boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)',
                    }}
                  >
                    <Bell className="w-5 h-5 text-primary" strokeWidth={2.25} />
                  </div>
                  <div>
                    <h2 className={cn('text-lg font-bold tracking-tight', isLight ? 'text-black' : 'text-white')}>
                      Notifications
                    </h2>
                    <p className={cn('text-sm', isLight ? 'text-black/55' : 'text-white/60')}>
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
                      className={cn(
                        'gap-2 h-9 px-3 text-sm font-medium transition-colors',
                        isLight ? 'text-black/55 hover:text-black hover:bg-black/5' : 'text-white/60 hover:text-white hover:bg-white/10',
                      )}
                    >
                      <CheckCheck className="w-4 h-4" strokeWidth={2.25} />
                      <span className="hidden sm:inline">Mark all read</span>
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="icon"
                    className={cn(
                      'h-9 w-9 rounded-full border-2',
                      isLight
                        ? 'border-[#141414] text-black hover:bg-black/5'
                        : 'border-white/85 text-white hover:bg-white/10',
                    )}
                    style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)' }}
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-4 h-4" strokeWidth={2.25} />
                  </Button>
                </div>
              </div>
            </div>

            <Tabs value={activeFilter} onValueChange={setActiveFilter} className="relative w-full">
              <div className="px-2 py-2">
                <TabsList
                  className={cn(
                    'flex w-full rounded-xl p-1 h-auto gap-0.5 border-2',
                    isLight ? 'bg-black/[0.03] border-[#141414]/40' : 'bg-white/[0.04] border-white/25',
                  )}
                >
                  {(['all', 'unread', 'like', 'message'] as const).map((value) => (
                    <TabsTrigger
                      key={value}
                      value={value}
                      className={cn(
                        'flex-1 min-w-0 rounded-lg py-2 px-3 text-xs font-semibold transition-all shadow-none',
                        tabIdle,
                        tabActive,
                        value !== 'all' && 'flex items-center justify-center gap-1.5',
                      )}
                    >
                      {value === 'like' && <Flame className="w-3.5 h-3.5" strokeWidth={2.25} />}
                      {value === 'message' && <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.25} />}
                      <span className={cn((value === 'like' || value === 'message') && 'hidden sm:inline')}>
                        {value === 'all' ? 'All' : value === 'unread' ? 'Unread' : value === 'like' ? 'Likes' : 'Msgs'}
                      </span>
                      {value === 'unread' && unreadCount > 0 && (
                        <Badge variant="secondary" className="h-5 min-w-[20px] px-1.5 text-[10px] font-bold">
                          {unreadCount}
                        </Badge>
                      )}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              <TabsContent value={activeFilter} className="m-0 mt-0">
                <ScrollArea className="h-[min(calc(100vh-16rem),420px)]">
                  <div className="p-3">
                    {filteredNotifications.length === 0 ? (
                      <EmptyState filter={activeFilter} isLight={isLight} />
                    ) : (
                      <AnimatePresence mode="popLayout">
                        <div className="space-y-2">
                          {filteredNotifications.map((notification, index) => (
                            <NotificationItem
                              key={notification.id}
                              notification={notification}
                              index={index}
                              isLight={isLight}
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

          {notifications.length > 0 && (
            <div className="relative px-4 py-3 border-t" style={{ borderColor: inkBorder }}>
              <Button
                variant="ghost"
                className={cn(
                  'w-full text-xs font-semibold transition-colors border-2 rounded-full h-10',
                  isLight
                    ? 'text-black border-[#141414] hover:bg-black/5'
                    : 'text-white border-white/85 hover:bg-white/10',
                )}
                style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)' }}
                onClick={() => {
                  haptics.tap();
                  navigate('/dashboard/notifications');
                  setIsOpen(false);
                }}
              >
                <Eye className="w-4 h-4 mr-2" strokeWidth={2.25} />
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
