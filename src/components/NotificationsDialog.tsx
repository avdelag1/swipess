import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, CheckCheck, Crown, Eye, Flame, MessageCircle, MessageSquare, Sparkles, Star, Trash2 } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

interface NotificationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

// Helper function to get notification role from metadata
const getNotificationRole = (notification: any): 'client' | 'owner' | 'neutral' => {
  if (notification.metadata?.role) {
    return notification.metadata.role;
  }
  if (notification.metadata?.targetType === 'listing') {
    return 'client'; // Client liked a listing
  }
  if (notification.metadata?.targetType === 'profile') {
    return 'owner'; // Owner liked a profile
  }
  return 'neutral';
};

const NotificationIconBg = ({ type, role = 'neutral' }: { type: string; role?: 'client' | 'owner' | 'neutral' }) => {
  // Client uses cooler tones (blue, cyan, purple), Owner uses warmer tones (orange, red, amber)
  const getConfig = (): { bg: string; icon: React.ReactNode } => {
    switch (type) {
      case 'message':
        return role === 'client'
          ? { bg: 'bg-blue-500/10', icon: <MessageSquare className="w-5 h-5 text-blue-500" /> }
          : { bg: 'bg-amber-500/10', icon: <MessageSquare className="w-5 h-5 text-amber-500" /> };
      case 'like':
        return role === 'client'
          ? { bg: 'bg-cyan-500/10', icon: <Flame className="w-5 h-5 text-cyan-500" /> }
          : { bg: 'bg-orange-500/10', icon: <Flame className="w-5 h-5 text-orange-500" /> };
      case 'match':
        return role === 'client'
          ? { bg: 'bg-purple-500/10', icon: <Sparkles className="w-5 h-5 text-purple-500" /> }
          : { bg: 'bg-amber-500/10', icon: <Sparkles className="w-5 h-5 text-amber-500" /> };
      case 'super_like':
        return role === 'client'
          ? { bg: 'bg-purple-500/10', icon: <Star className="w-5 h-5 text-purple-500" /> }
          : { bg: 'bg-yellow-500/10', icon: <Star className="w-5 h-5 text-yellow-500" /> };
      case 'premium_purchase':
        return { bg: 'bg-purple-500/10', icon: <Crown className="w-5 h-5 text-purple-500" /> };
      case 'activation_purchase':
        return { bg: 'bg-rose-500/10', icon: <MessageCircle className="w-5 h-5 text-rose-500" /> };
      default:
        return { bg: 'bg-muted', icon: <Bell className="w-5 h-5 text-muted-foreground" /> };
    }
  };

  const config = getConfig();

  return (
    <div className={`p-2.5 rounded-xl ${config.bg}`}>
      {config.icon}
    </div>
  );
};

export function NotificationsDialog({ isOpen, onClose }: NotificationsDialogProps) {
  const { isLight } = useAppTheme();
  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Mark all as read the moment the panel opens — no need to tap each one
  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen, markAllAsRead]);

  const filteredNotifications = useMemo(() => notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  }), [notifications, activeFilter]);

  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications]);

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        data-swipess-dialog
        className={cn(
          'neo-naive z-[10000] max-w-md sm:max-w-lg h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden',
          !isLight && 'neo-naive--dark',
          isLight ? 'bg-white text-black' : 'bg-[#121218] text-white',
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
        <DialogHeader
          className={cn(
            'shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b',
            isLight ? 'border-black/10 bg-white' : 'border-white/12 bg-[#121218]',
          )}
        >
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div
                className={cn(
                  'p-2 sm:p-2.5 shrink-0 border-2',
                  isLight ? 'bg-white border-[#141414]' : 'bg-[#16161e] border-white/85',
                )}
                style={{
                  borderRadius: '0.85rem 1rem 0.8rem 0.95rem / 0.95rem 0.8rem 1rem 0.85rem',
                  boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)',
                }}
              >
                <Bell className={cn('w-5 h-5', isLight ? 'text-black/70' : 'text-white/80')} strokeWidth={2.25} />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-base sm:text-lg font-semibold tracking-tight">Notifications</DialogTitle>
                <p className="text-xs truncate text-muted-foreground font-normal">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1.5 text-xs h-8 px-3 shrink-0 text-muted-foreground hover:text-foreground"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="flex-1 flex flex-col min-h-0">
          <div className={cn('shrink-0 px-4 sm:px-6 py-2 sm:py-3 border-b', isLight ? 'border-black/10' : 'border-white/12')}>
            <TabsList
              className={cn(
                'flex w-full rounded-xl p-1 h-auto gap-0.5 border-2',
                isLight ? 'bg-black/[0.03] border-[#141414]/40' : 'bg-white/[0.04] border-white/25',
              )}
            >
              <TabsTrigger
                value="all"
                className={cn(
                  'flex-1 min-w-0 rounded-lg py-1.5 px-2 text-xs font-medium transition-all shadow-none',
                  isLight
                    ? 'text-black/45 data-[state=active]:bg-black data-[state=active]:text-white'
                    : 'text-white/50 data-[state=active]:bg-white data-[state=active]:text-black',
                )}
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className={cn(
                  'flex-1 min-w-0 rounded-lg py-1.5 px-2 text-xs font-medium transition-all shadow-none gap-1',
                  isLight
                    ? 'text-black/45 data-[state=active]:bg-black data-[state=active]:text-white'
                    : 'text-white/50 data-[state=active]:bg-white data-[state=active]:text-black',
                )}
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1.5 text-[10px] font-medium">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="message"
                className={cn(
                  'flex-1 min-w-0 rounded-lg py-1.5 px-2 text-xs font-medium transition-all shadow-none flex items-center gap-1',
                  isLight
                    ? 'text-black/45 data-[state=active]:bg-black data-[state=active]:text-white'
                    : 'text-white/50 data-[state=active]:bg-white data-[state=active]:text-black',
                )}
              >
                <MessageSquare className="w-3.5 h-3.5" strokeWidth={2.25} />
                <span className="hidden sm:inline">Msgs</span>
              </TabsTrigger>
              <TabsTrigger
                value="like"
                className={cn(
                  'flex-1 min-w-0 rounded-lg py-1.5 px-2 text-xs font-medium transition-all shadow-none flex items-center gap-1',
                  isLight
                    ? 'text-black/45 data-[state=active]:bg-black data-[state=active]:text-white'
                    : 'text-white/50 data-[state=active]:bg-white data-[state=active]:text-black',
                )}
              >
                <Flame className="w-3.5 h-3.5" strokeWidth={2.25} />
                <span className="hidden sm:inline">Likes</span>
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeFilter} className="flex-1 m-0 min-h-0">
            <ScrollArea className="h-full">
              <div className="p-3 sm:p-4">
                {filteredNotifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="flex flex-col items-center justify-center py-10 sm:py-14 text-center"
                  >
                    <div className="mb-4">
                      <div
                        className={cn(
                          'p-4 sm:p-5 border-2',
                          isLight ? 'bg-white border-[#141414]' : 'bg-[#16161e] border-white/85',
                        )}
                        style={{
                          borderRadius: '1.1rem 1.3rem 1rem 1.2rem / 1.2rem 1rem 1.3rem 1.1rem',
                          boxShadow: isLight ? '1.5px 1.5px 0 #141414' : '1.5px 1.5px 0 rgba(255,255,255,0.3)',
                        }}
                      >
                        <Bell className={cn('w-7 h-7 sm:w-8 sm:h-8', isLight ? 'text-black/25' : 'text-white/30')} strokeWidth={2.25} />
                      </div>
                    </div>
                    <h3 className={cn('text-sm font-medium mb-1', isLight ? 'text-black' : 'text-white')}>
                      {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
                    </h3>
                    <p className={cn('text-xs font-normal max-w-[200px]', isLight ? 'text-black/50' : 'text-white/55')}>
                      New activity will appear here
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {filteredNotifications.map((notification) => {
                        const role = getNotificationRole(notification);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ duration: 0.15 }}
                          >
                            <Card
                              data-neo-naive-card
                              className={cn(
                                'group cursor-pointer transition-colors border-2 overflow-hidden neo-naive-card shadow-none',
                                isLight
                                  ? 'bg-white border-[#141414] hover:bg-black/[0.03]'
                                  : 'bg-[#16161e] border-white/85 hover:bg-white/[0.05]',
                              )}
                              style={{
                                borderRadius: '1.05rem 1.2rem 1rem 1.15rem / 1.15rem 0.95rem 1.2rem 1.05rem',
                                boxShadow: isLight ? '1.25px 1.25px 0 #141414' : '1.25px 1.25px 0 rgba(255,255,255,0.28)',
                              }}
                              onClick={() => {
                                handleNotificationClick(notification);
                                onClose();
                              }}
                            >
                              <CardContent className="p-3 sm:p-4">
                                <div className="flex items-start gap-3">
                                  <div className="flex-shrink-0">
                                    {notification.avatar ? (
                                      <div className="relative">
                                        <img
                                          src={notification.avatar}
                                          alt={notification.title}
                                          className={cn(
                                            'w-10 h-10 object-cover border-2',
                                            isLight ? 'border-[#141414]' : 'border-white/80',
                                          )}
                                          style={{
                                            borderRadius: '0.75rem 0.9rem 0.7rem 0.85rem / 0.85rem 0.7rem 0.9rem 0.75rem',
                                          }}
                                        />
                                        <div className="absolute -bottom-1 -right-1 scale-75">
                                          <NotificationIconBg type={notification.type} role={role} />
                                        </div>
                                      </div>
                                    ) : (
                                      <NotificationIconBg type={notification.type} role={role} />
                                    )}
                                  </div>

                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2 mb-0.5">
                                      <div className="flex items-center gap-2">
                                        <h4 className={cn('font-medium text-[13px] leading-tight', isLight ? 'text-black' : 'text-white')}>
                                          {notification.title}
                                        </h4>
                                        {!notification.read && (
                                          <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          dismissNotification(notification.id);
                                        }}
                                      >
                                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" strokeWidth={2.25} />
                                      </Button>
                                    </div>

                                    <p className={cn('text-xs font-normal line-clamp-2 mb-1.5 leading-relaxed', isLight ? 'text-black/55' : 'text-white/60')}>
                                      {notification.message}
                                    </p>

                                    <div className="flex items-center gap-2">
                                      <span className={cn('text-[11px] font-normal', isLight ? 'text-black/40' : 'text-white/45')}>
                                        {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                      </span>
                                      {!notification.read && (
                                        <span className="text-[10px] font-medium text-primary/80">New</span>
                                      )}
                                    </div>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        );
                      })}
                    </div>
                  </AnimatePresence>
                )}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {notifications.length > 0 && (
          <div className={cn('shrink-0 px-4 sm:px-6 py-3 sm:py-4 border-t', isLight ? 'border-black/10' : 'border-white/12')}>
            <Button
              variant="outline"
              className={cn(
                'w-full gap-2 h-10 text-sm font-medium border-2 rounded-full',
                isLight ? 'border-[#141414] bg-white text-black hover:bg-black/5' : 'border-white/85 bg-[#121218] text-white hover:bg-white/10',
              )}
              style={{ boxShadow: isLight ? '1px 1px 0 #141414' : '1px 1px 0 rgba(255,255,255,0.3)' }}
              onClick={handleViewAll}
            >
              <Eye className="w-4 h-4" strokeWidth={2.25} />
              View All
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}


