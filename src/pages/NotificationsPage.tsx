/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect, useCallback, useMemo } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, MessageSquare, Flame, Star, Sparkles, Trash2,
  CheckCheck, MoreHorizontal, Heart, Home, Ship, Bike, Car,
  ExternalLink, X, Clock, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLikedProperties } from '@/hooks/useLikedProperties';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  read: boolean;
  link_url?: string | null;
  related_user_id?: string | null;
  metadata?: {
    role?: 'client' | 'owner';
    targetType?: 'listing' | 'profile';
    [key: string]: any;
  };
}

const NotificationIcon = ({ type, role = 'neutral', className = "w-5 h-5" }: { type: string; role?: 'client' | 'owner' | 'neutral'; className?: string }) => {
  // Client uses cooler tones (blue, cyan, purple), Owner uses warmer tones (orange, red, amber)
  switch (type) {
    case 'new_message':
    case 'message':
      return role === 'client'
        ? <MessageSquare className={`${className} text-blue-500`} />
        : <MessageSquare className={`${className} text-amber-500`} />;
    case 'new_like':
    case 'like':
      return role === 'client'
        ? <Flame className={`${className} text-cyan-500`} />
        : <Flame className={`${className} text-orange-500`} />;
    case 'new_match':
    case 'match':
      return role === 'client'
        ? <Sparkles className={`${className} text-purple-500`} />
        : <Sparkles className={`${className} text-amber-500`} />;
    case 'super_like':
      return role === 'client'
        ? <Star className={`${className} text-purple-500`} />
        : <Star className={`${className} text-yellow-500`} />;
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
};

// Helper function to get notification role from metadata
const getNotificationRole = (notification: Notification): 'client' | 'owner' | 'neutral' => {
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

const getBgGradient = (type: string, role: 'client' | 'owner' | 'neutral' = 'neutral'): string => {
  switch (type) {
    case 'new_message':
    case 'message':
      return role === 'client'
        ? 'from-blue-500/20 to-cyan-500/10'
        : 'from-amber-500/20 to-yellow-500/10';
    case 'new_like':
    case 'like':
      return role === 'client'
        ? 'from-cyan-500/20 to-blue-500/10'
        : 'from-orange-500/20 to-amber-500/10';
    case 'new_match':
    case 'match':
      return role === 'client'
        ? 'from-purple-500/20 to-pink-500/10'
        : 'from-amber-500/20 to-yellow-500/10';
    case 'super_like':
      return role === 'client'
        ? 'from-purple-500/20 to-pink-500/10'
        : 'from-yellow-500/20 to-orange-500/10';
    case 'property':
      return 'from-emerald-500/20 to-teal-500/10';
    case 'yacht':
      return 'from-cyan-500/20 to-blue-500/10';
    case 'bicycle':
      return 'from-orange-500/20 to-red-500/10';
    case 'vehicle':
      return 'from-purple-500/20 to-pink-500/10';
    default:
      return 'from-card/80 to-card/40';
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
  const [deletingAll, setDeletingAll] = useState(false);
  const [removingLikeId, setRemovingLikeId] = useState<string | null>(null);
  const { user } = useAuth();
  const { data: userRole } = useUserRole(user?.id);
  const { data: likedProperties, isLoading: likedLoading } = useLikedProperties();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user?.id) return;

    fetchNotifications();
    markAllAsReadSilently();

    const channel = supabase
      .channel('notifications-page')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'notifications',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const n = payload.new as Record<string, unknown>;
            const newNotification: Notification = {
              id: n.id as string,
              type: (n.type as string) || 'system',
              title: n.type === 'new_like' || n.type === 'like' ? 'New Like' :
                     n.type === 'new_match' || n.type === 'match' ? 'New Match!' :
                     n.type === 'new_message' || n.type === 'message' ? 'New Message' :
                     n.type === 'super_like' ? 'Super Like!' : 'Notification',
              message: (n.message as string) || '',
              created_at: n.created_at as string,
              read: (n.read as boolean) || false,
              link_url: n.link_url as string | null,
              related_user_id: n.related_user_id as string | null,
              metadata: n.metadata,
            };
            setNotifications(prev => [newNotification, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as { id: string }).id));
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as { id: string; read: boolean };
            setNotifications(prev =>
              prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n)
            );
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }, [user?.id]);

  const markAllAsReadSilently = async () => {
    if (!user?.id) return;
    try {
      await (supabase as any)
        .from('notifications')
        .update({ is_read: true })
        .eq('user_id', user.id)
        .eq('is_read', false);
    } catch (error) {
      logger.error('Error auto-marking as read:', error);
    }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      const formattedNotifications: Notification[] = (data || []).map((n: Record<string, unknown>) => ({
        id: n.id as string,
        type: (n.type as string) || 'system',
        title: n.type === 'new_like' || n.type === 'like' ? 'New Like' :
               n.type === 'new_match' || n.type === 'match' ? 'New Match!' :
               n.type === 'new_message' || n.type === 'message' ? 'New Message' :
               n.type === 'super_like' ? 'Super Like!' : 'Notification',
        message: (n.message as string) || '',
        created_at: n.created_at as string,
        read: (n.read as boolean) || false,
        link_url: n.link_url as string | null,
        related_user_id: n.related_user_id as string | null,
        metadata: n.metadata,
      }));

      setNotifications(formattedNotifications);
    } catch (error) {
      logger.error('Error fetching notifications:', error);
      toast({
        title: "Error loading notifications",
        description: "Failed to load your notifications. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const deleteNotification = async (notificationId: string) => {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;

      setNotifications(prev => prev.filter(n => n.id !== notificationId));

      toast({
        title: 'Notification deleted',
        description: 'The notification has been removed.',
      });
    } catch (error) {
      logger.error('Error deleting notification:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notification.',
        variant: 'destructive',
      });
    }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    setDeletingAll(true);

    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', user.id);

      if (error) throw error;

      setNotifications([]);

      toast({
        title: 'All notifications deleted',
        description: 'Your notifications have been cleared.',
      });
    } catch (error) {
      logger.error('Error deleting all notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete notifications.',
        variant: 'destructive',
      });
    } finally {
      setDeletingAll(false);
      setDeleteDialogOpen(false);
    }
  };

  const removeLike = async (listingId: string) => {
    if (!user?.id) return;
    setRemovingLikeId(listingId);

    try {
      // SCHEMA: target_id = listing ID, target_type = 'listing'
      const { error } = await supabase
        .from('likes')
        .delete()
        .eq('user_id', user.id)
        .eq('target_id', listingId)
        .eq('target_type', 'listing');

      if (error) throw error;

      // Invalidate liked properties cache
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });

      toast({
        title: 'Removed from likes',
        description: 'Property removed from your liked list.',
      });
    } catch (error) {
      logger.error('Error removing like:', error);
      toast({
        title: 'Error',
        description: 'Failed to remove like.',
        variant: 'destructive',
      });
    } finally {
      setRemovingLikeId(null);
    }
  };

  const handleConfirmDelete = () => {
    if (notificationToDelete) {
      deleteNotification(notificationToDelete);
    } else {
      deleteAllNotifications();
    }
    setNotificationToDelete(null);
    setDeleteDialogOpen(false);
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const likedCount = likedProperties?.length || 0;

  // Category icons for liked properties
  const getCategoryIcon = (category?: string) => {
    switch (category) {
      case 'yacht': return <Ship className="w-3.5 h-3.5" />;
      case 'bicycle': return <Bike className="w-3.5 h-3.5" />;
      case 'vehicle': return <Car className="w-3.5 h-3.5" />;
      default: return <Home className="w-3.5 h-3.5" />;
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 pb-20 sm:pb-24">
        <div className="px-3 py-4 sm:p-6 lg:p-8">
          <div className="max-w-2xl mx-auto space-y-4 sm:space-y-6">
            {/* Header */}
            <PageHeader
              title="Notifications"
              subtitle="Your activity and saved items"
              actions={
                <div className="flex items-center gap-2">
                  {notifications.length > 0 && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-5 h-5" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => {
                            setNotificationToDelete(null);
                            setDeleteDialogOpen(true);
                          }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Clear all activity
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              }
            />

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 bg-card/80 backdrop-blur-sm border border-border/40 rounded-xl p-1 h-auto">
                <TabsTrigger
                  value="activity"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg py-3 px-4 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Activity
                  {unreadCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background/50">
                      {unreadCount}
                    </Badge>
                  )}
                </TabsTrigger>
                <TabsTrigger
                  value="liked"
                  className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/90 data-[state=active]:to-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md rounded-lg py-3 px-4 text-sm font-medium transition-all flex items-center gap-2"
                >
                  <Heart className="w-4 h-4" />
                  Liked
                  {likedCount > 0 && (
                    <Badge variant="secondary" className="h-5 px-1.5 text-xs bg-background/50">
                      {likedCount}
                    </Badge>
                  )}
                </TabsTrigger>
              </TabsList>

              {/* Activity Tab */}
              <TabsContent value="activity" className="mt-4 sm:mt-6">
                {isLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                      <Card key={i} className="animate-pulse bg-gradient-to-br from-card/80 to-card/40 border-border/40">
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className="w-10 h-10 rounded-xl bg-muted" />
                            <div className="flex-1 space-y-2">
                              <div className="h-4 w-1/3 bg-muted rounded" />
                              <div className="h-3 w-2/3 bg-muted rounded" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center px-4"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-purple-500/20 to-primary/20 rounded-full blur-2xl scale-150 animate-pulse" />
                      <div className="relative p-6 rounded-full bg-gradient-to-br from-primary/10 via-purple-500/5 to-primary/10 border-2 border-primary/20">
                        <Bell className="w-12 h-12 text-primary" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-primary via-purple-500 to-primary bg-clip-text text-transparent mb-2">
                      No activity yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs">
                      Your matches, likes, and messages will appear here
                    </p>
                  </motion.div>
                ) : (
                  <div className="space-y-2">
                    <AnimatePresence mode="popLayout">
                      {notifications.map((notification, index) => {
                        const role = getNotificationRole(notification);
                        return (
                          <motion.div
                            key={notification.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, x: -100 }}
                            transition={{ delay: index * 0.02 }}
                          >
                            <Card className={`bg-gradient-to-br ${getBgGradient(notification.type, role)} border-border/40 hover:border-border/60 transition-all group`}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-3">
                                  <div className="p-2.5 rounded-xl bg-background/50 shadow-sm">
                                    <NotificationIcon type={notification.type} role={role} className="w-5 h-5" />
                                  </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-start justify-between gap-2">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-semibold text-foreground text-sm">
                                        {notification.title}
                                      </p>
                                      <p className="text-sm text-muted-foreground line-clamp-2 mt-0.5">
                                        {notification.message}
                                      </p>
                                      <div className="flex items-center gap-2 mt-2">
                                        <Clock className="w-3 h-3 text-muted-foreground" />
                                        <span className="text-xs text-muted-foreground">
                                          {formatDistanceToNow(notification.created_at)}
                                        </span>
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                                      onClick={() => deleteNotification(notification.id)}
                                    >
                                      <X className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                        );
                      })}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>

              {/* Liked Properties Tab */}
              <TabsContent value="liked" className="mt-4 sm:mt-6">
                {likedLoading ? (
                  <div className="grid grid-cols-1 gap-3">
                    {[1, 2, 3].map(i => (
                      <Card key={i} className="animate-pulse bg-card/80 border-border/40">
                        <CardContent className="p-0">
                          <div className="flex">
                            <div className="w-28 h-28 bg-muted rounded-l-lg" />
                            <div className="flex-1 p-3 space-y-2">
                              <div className="h-4 w-2/3 bg-muted rounded" />
                              <div className="h-3 w-1/2 bg-muted rounded" />
                              <div className="h-3 w-1/4 bg-muted rounded" />
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : !likedProperties || likedProperties.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex flex-col items-center justify-center py-16 text-center px-4"
                  >
                    <div className="relative mb-6">
                      <div className="absolute inset-0 bg-gradient-to-r from-red-500/20 via-pink-500/20 to-red-500/20 rounded-full blur-2xl scale-150 animate-pulse" />
                      <div className="relative p-6 rounded-full bg-gradient-to-br from-red-500/10 via-pink-500/5 to-red-500/10 border-2 border-red-500/20">
                        <Heart className="w-12 h-12 text-red-500" />
                      </div>
                    </div>
                    <h3 className="text-xl font-bold bg-gradient-to-r from-red-500 via-pink-500 to-red-500 bg-clip-text text-transparent mb-2">
                      No liked properties yet
                    </h3>
                    <p className="text-sm text-muted-foreground max-w-xs mb-4">
                      Start swiping to save properties you like
                    </p>
                    <Button
                      onClick={() => navigate(userRole === 'owner' ? '/owner/dashboard' : '/client/dashboard')}
                      className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600"
                    >
                      <Flame className="w-4 h-4 mr-2" />
                      Start Swiping
                    </Button>
                  </motion.div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm text-muted-foreground">
                        {likedCount} saved {likedCount === 1 ? 'item' : 'items'}
                      </p>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => navigate(userRole === 'owner' ? '/owner/liked-clients' : '/client/liked-properties')}
                        className="text-primary hover:text-primary/80"
                      >
                        View All
                        <ExternalLink className="w-3.5 h-3.5 ml-1.5" />
                      </Button>
                    </div>
                    <AnimatePresence mode="popLayout">
                      {likedProperties.map((property, index) => (
                        <motion.div
                          key={property.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -100 }}
                          transition={{ delay: index * 0.03 }}
                        >
                          <Card className="bg-card/80 border-border/40 hover:border-border/60 transition-all overflow-hidden group">
                            <CardContent className="p-0">
                              <div className="flex">
                                {/* Property Image */}
                                <div
                                  className="w-28 h-28 sm:w-32 sm:h-32 flex-shrink-0 relative overflow-hidden cursor-pointer"
                                  onClick={() => navigate(`/listing/${property.id}`)}
                                >
                                  {property.images?.[0] ? (
                                    <img
                                      src={property.images[0]}
                                      alt={property.title}
                                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                                      loading="lazy"
                                    />
                                  ) : (
                                    <div className="w-full h-full bg-muted flex items-center justify-center">
                                      <Home className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                  )}
                                  {/* Image count badge */}
                                  {property.images && property.images.length > 1 && (
                                    <div className="absolute bottom-1.5 right-1.5 bg-black/60 text-white text-xs px-1.5 py-0.5 rounded">
                                      +{property.images.length - 1}
                                    </div>
                                  )}
                                </div>

                                {/* Property Info */}
                                <div className="flex-1 p-3 flex flex-col justify-between min-w-0">
                                  <div>
                                    <div className="flex items-start justify-between gap-2">
                                      <div className="flex-1 min-w-0">
                                        <h3
                                          className="font-semibold text-foreground text-sm line-clamp-1 cursor-pointer hover:text-primary transition-colors"
                                          onClick={() => navigate(`/listing/${property.id}`)}
                                        >
                                          {property.title}
                                        </h3>
                                        {(property.city || property.neighborhood) && (
                                          <div className="flex items-center gap-1 mt-1 text-muted-foreground">
                                            <MapPin className="w-3 h-3" />
                                            <span className="text-xs line-clamp-1">{property.city || property.neighborhood}</span>
                                          </div>
                                        )}
                                      </div>
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-7 w-7 opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive flex-shrink-0"
                                        onClick={() => removeLike(property.id)}
                                        disabled={removingLikeId === property.id}
                                      >
                                        {removingLikeId === property.id ? (
                                          <div className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                                        ) : (
                                          <X className="w-4 h-4" />
                                        )}
                                      </Button>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between mt-2">
                                    <div className="flex items-center gap-2">
                                      <Badge variant="secondary" className="text-xs py-0.5 px-2 bg-background/50 flex items-center gap-1">
                                        {getCategoryIcon(property.category)}
                                        {property.category || 'Property'}
                                      </Badge>
                                    </div>
                                    {property.price && (
                                      <span className="text-sm font-bold text-primary">
                                        ${property.price.toLocaleString()}
                                        <span className="text-xs font-normal text-muted-foreground">/mo</span>
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {notificationToDelete ? 'Delete notification?' : 'Clear all activity?'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {notificationToDelete
                ? 'This notification will be permanently deleted.'
                : 'All your activity notifications will be permanently deleted. This action cannot be undone.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deletingAll ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
