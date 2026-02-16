import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Bell, MessageSquare, Flame, CheckCheck, Trash2, Star, Sparkles, Eye, Crown, MessageCircle } from 'lucide-react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

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
        return { bg: 'bg-green-500/10', icon: <MessageCircle className="w-5 h-5 text-green-500" /> };
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
  const { notifications, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();

  // Mark all as read the moment the panel opens — no need to tap each one
  useEffect(() => {
    if (isOpen) {
      markAllAsRead();
    }
  }, [isOpen, markAllAsRead]);

  const filteredNotifications = notifications.filter(n => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'unread') return !n.read;
    return n.type === activeFilter;
  });

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleViewAll = () => {
    onClose();
    navigate('/notifications');
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md sm:max-w-lg h-[90vh] sm:h-[80vh] flex flex-col p-0 gap-0 overflow-hidden rounded-2xl border-border/50">
        <DialogHeader className="shrink-0 px-4 sm:px-6 pt-4 sm:pt-6 pb-3 sm:pb-4 border-b bg-gradient-to-r from-primary/5 via-background to-background">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0">
              <div className="p-2 sm:p-2.5 rounded-xl bg-primary/10 shrink-0">
                <Bell className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
              </div>
              <div className="min-w-0">
                <DialogTitle className="text-lg sm:text-xl font-bold">Notifications</DialogTitle>
                <p className="text-xs sm:text-sm text-gray-300 truncate">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
            </div>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={markAllAsRead}
                className="gap-1.5 text-[10px] sm:text-xs h-8 px-2 sm:px-3 shrink-0"
              >
                <CheckCheck className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Mark all read</span>
                <span className="sm:hidden">Read</span>
              </Button>
            )}
          </div>
        </DialogHeader>

        <Tabs value={activeFilter} onValueChange={setActiveFilter} className="flex-1 flex flex-col min-h-0">
          <div className="shrink-0 px-3 sm:px-6 py-2 sm:py-3 border-b bg-muted/20">
            <TabsList className="flex w-full bg-card/80 backdrop-blur-sm border border-border/40 rounded-lg p-1 h-auto gap-1">
              <TabsTrigger
                value="all"
                className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md py-1.5 px-2 text-[11px] sm:text-xs font-medium transition-all"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md py-1.5 px-2 text-[11px] sm:text-xs font-medium transition-all gap-1"
              >
                <span>Unread</span>
                {unreadCount > 0 && (
                  <Badge variant="secondary" className="h-4 px-1 text-[9px] bg-background/50">{unreadCount}</Badge>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="message"
                className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md py-1.5 px-2 text-[11px] sm:text-xs font-medium transition-all"
              >
                <span className="hidden sm:inline">Msgs</span>
                <MessageSquare className="w-3.5 h-3.5 sm:hidden" />
              </TabsTrigger>
              <TabsTrigger
                value="like"
                className="flex-1 min-w-0 data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm rounded-md py-1.5 px-2 text-[11px] sm:text-xs font-medium transition-all"
              >
                <span className="hidden sm:inline">Flames</span>
                <Flame className="w-3.5 h-3.5 sm:hidden" />
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
                    <div className="relative mb-4">
                      <div className="absolute inset-0 bg-orange-500/10 rounded-full blur-xl scale-150" />
                      <div className="relative p-4 sm:p-5 rounded-full bg-gradient-to-br from-gray-800 to-gray-900 border border-white/10 shadow-lg">
                        <Bell className="w-8 h-8 sm:w-9 sm:h-9 text-white/50" />
                      </div>
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white mb-1">
                      {activeFilter === 'all' ? 'No notifications yet' : `No ${activeFilter} notifications`}
                    </h3>
                    <p className="text-xs text-gray-400 max-w-[200px]">
                      New activity will appear here
                    </p>
                  </motion.div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    <div className="space-y-2">
                      {filteredNotifications.map((notification, index) => {
                        const role = getNotificationRole(notification);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -50 }}
                            transition={{ delay: index * 0.03 }}
                          >
                            <Card
                              className={`
                                group cursor-pointer transition-all duration-200 border overflow-hidden
                                hover:shadow-md hover:-translate-y-0.5
                                ${!notification.read
                                  ? 'bg-gradient-to-r from-primary/5 via-card to-card border-primary/20'
                                  : 'hover:bg-accent/30 border-border/50'
                                }
                              `}
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
                                          className="w-10 h-10 rounded-xl object-cover"
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
                                      <h4 className="font-semibold text-foreground text-sm">
                                        {notification.title}
                                      </h4>
                                      {!notification.read && (
                                        <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                                      )}
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        dismissNotification(notification.id);
                                      }}
                                    >
                                      <Trash2 className="w-3.5 h-3.5 text-muted-foreground hover:text-destructive" />
                                    </Button>
                                  </div>
                                  
                                  <p className="text-xs text-gray-300 line-clamp-2 mb-1.5">
                                    {notification.message}
                                  </p>
                                  
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] text-gray-400">
                                      {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                                    </span>
                                    {!notification.read && (
                                      <Badge className="text-[10px] px-1.5 py-0 h-4 bg-primary/10 text-primary border-0">
                                        New
                                      </Badge>
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
          <div className="shrink-0 px-3 sm:px-6 py-3 sm:py-4 border-t bg-muted/30">
            <Button
              variant="outline"
              className="w-full gap-2 h-9 sm:h-10 text-xs sm:text-sm"
              onClick={handleViewAll}
            >
              <Eye className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              View All Notifications
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
