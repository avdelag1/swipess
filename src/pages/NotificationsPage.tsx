/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, MessageSquare, Flame, Star, Sparkles, Trash2,
  MoreHorizontal, Heart, Home, Ship, Bike, Car,
  ExternalLink, X, Clock, MapPin, Zap
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLikedProperties } from '@/hooks/useLikedProperties';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
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
import { cn } from '@/lib/utils';

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
  switch (type) {
    case 'new_message':
    case 'message':
      return role === 'client'
        ? <MessageSquare className={cn(className, "text-purple-500")} />
        : <MessageSquare className={cn(className, "text-primary")} />;
    case 'new_like':
    case 'like':
      return role === 'client'
        ? <Flame className={cn(className, "text-blue-500")} />
        : <Flame className={cn(className, "text-orange-500")} />;
    case 'new_match':
    case 'match':
      return role === 'client'
        ? <Sparkles className={cn(className, "text-cyan-500")} />
        : <Sparkles className={cn(className, "text-primary")} />;
    case 'super_like':
      return role === 'client'
        ? <Star className={cn(className, "text-purple-500")} />
        : <Star className={cn(className, "text-pink-500")} />;
    case 'property':
      return <Home className={cn(className, "text-emerald-500")} />;
    case 'yacht':
      return <Ship className={cn(className, "text-blue-500")} />;
    case 'bicycle':
      return <Bike className={cn(className, "text-orange-500")} />;
    case 'vehicle':
      return <Car className={cn(className, "text-purple-500")} />;
    default:
      return <Bell className={cn(className, "text-muted-foreground")} />;
  }
};

const getNotificationRole = (notification: Notification): 'client' | 'owner' | 'neutral' => {
  if (notification.metadata?.role) return notification.metadata.role;
  if (notification.metadata?.targetType === 'listing') return 'client';
  if (notification.metadata?.targetType === 'profile') return 'owner';
  return 'neutral';
};

const getBgGradient = (type: string, role: 'client' | 'owner' | 'neutral' = 'neutral'): string => {
  switch (type) {
    case 'new_message':
    case 'message':
      return role === 'client'
        ? 'from-purple-500/10'
        : 'from-primary/10';
    case 'new_like':
    case 'like':
      return role === 'client'
        ? 'from-blue-500/10'
        : 'from-orange-500/10';
    case 'new_match':
    case 'match':
      return 'from-primary/15';
    case 'super_like':
      return 'from-purple-500/15';
    default:
      return 'from-secondary/50';
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
        { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const n = payload.new as any;
            setNotifications(prev => [{
              id: n.id,
              type: n.type || 'system',
              title: getNotificationTitle(n.type),
              message: n.message || '',
              created_at: n.created_at,
              read: n.read || false,
              link_url: n.link_url,
              related_user_id: n.related_user_id,
              metadata: n.metadata,
            }, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setNotifications(prev => prev.map(n => n.id === updated.id ? { ...n, read: updated.read } : n));
          }
        }
      )
      .subscribe();

    return () => { channel.unsubscribe(); };
  }, [user?.id]);

  const getNotificationTitle = (type: string) => {
    switch (type) {
      case 'new_like': case 'like': return 'New Like';
      case 'new_match': case 'match': return 'New Match!';
      case 'new_message': case 'message': return 'New Message';
      case 'super_like': return 'Super Like!';
      default: return 'Notification';
    }
  };

  const markAllAsReadSilently = async () => {
    if (!user?.id) return;
    try {
      await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false);
    } catch (e) { logger.error('Error auto-marking as read:', e); }
  };

  const fetchNotifications = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const { data, error } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(100);
      if (error) throw error;
      setNotifications((data || []).map((n: any) => ({
        id: n.id,
        type: n.type || 'system',
        title: getNotificationTitle(n.type),
        message: n.message || '',
        created_at: n.created_at,
        read: n.read || false,
        link_url: n.link_url,
        related_user_id: n.related_user_id,
        metadata: n.metadata,
      })));
    } catch (e) {
      logger.error('Error fetching notifications:', e);
      toast.error('Failed to load notifications');
    } finally { setIsLoading(false); }
  };

  const deleteNotification = async (id: string) => {
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (e) { toast.error('Failed to delete notification'); }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    setDeletingAll(true);
    try {
      const { error } = await supabase.from('notifications').delete().eq('user_id', user.id);
      if (error) throw error;
      setNotifications([]);
      toast.success('Activity cleared');
    } catch (e) { toast.error('Failed to clear activity'); }
    finally { setDeletingAll(false); setDeleteDialogOpen(false); }
  };

  const removeLike = async (listingId: string) => {
    if (!user?.id) return;
    setRemovingLikeId(listingId);
    try {
      const { error } = await supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', listingId).eq('target_type', 'listing');
      if (error) throw error;
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast.success('Removed from liked');
    } catch (e) { toast.error('Failed to remove like'); }
    finally { setRemovingLikeId(null); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const likedCount = likedProperties?.length || 0;

  return (
    <div className="min-h-screen bg-background transition-colors duration-500">
      <div className="max-w-2xl mx-auto px-4 pt-12 pb-32 space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-foreground">Inbox</h1>
            <p className="text-sm font-medium text-muted-foreground mt-1">Updates and saved items</p>
          </div>
          {notifications.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="secondary" size="icon" className="rounded-full">
                  <MoreHorizontal className="w-5 h-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="rounded-2xl">
                <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-destructive focus:text-destructive gap-2 p-3">
                  <Trash2 className="w-4 h-4" />
                  Clear Inbox
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-secondary/50 p-1.5 rounded-[1.5rem] h-auto border border-border/40">
            <TabsTrigger
              value="activity"
              className="rounded-[1.2rem] py-3.5 px-4 text-sm font-bold transition-all flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary"
            >
              <Bell className="w-4 h-4" />
              Activity
              {unreadCount > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground min-w-[20px] justify-center">
                  {unreadCount}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="rounded-[1.2rem] py-3.5 px-4 text-sm font-bold transition-all flex items-center justify-center gap-2 data-[state=active]:bg-background data-[state=active]:shadow-lg data-[state=active]:text-primary"
            >
              <Heart className="w-4 h-4" />
              Liked
              {likedCount > 0 && (
                <Badge variant="default" className="h-5 px-1.5 text-[10px] bg-primary text-primary-foreground min-w-[20px] justify-center">
                  {likedCount}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-8 space-y-4">
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="h-24 w-full rounded-[2rem] bg-secondary/30 animate-pulse" />
              ))
            ) : notifications.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-6">
                  <Bell className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">Nothing yet</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mt-2">Updates about your swipes will appear here.</p>
              </motion.div>
            ) : (
              <div className="space-y-3">
                <AnimatePresence mode="popLayout">
                  {notifications.map((n, i) => {
                    const role = getNotificationRole(n);
                    return (
                      <motion.div
                        key={n.id}
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, x: -20 }}
                        transition={{ delay: i * 0.03 }}
                      >
                        <Card className={cn(
                          "relative overflow-hidden rounded-[2rem] border-border/40 transition-all hover:border-primary/20 bg-card/40 backdrop-blur-sm group",
                          !n.read && "bg-primary/[0.03] border-primary/20 ring-1 ring-primary/10"
                        )}>
                          <div className={cn("absolute inset-y-0 left-0 w-1 bg-gradient-to-b", getBgGradient(n.type, role))} />
                          <CardContent className="p-5 flex items-start gap-4">
                            <div className="w-12 h-12 rounded-2xl bg-secondary flex items-center justify-center flex-shrink-0">
                              <NotificationIcon type={n.type} role={role} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between gap-2">
                                <h4 className="font-bold text-sm truncate">{n.title}</h4>
                                <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {formatDistanceToNow(n.created_at)}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed">{n.message}</p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="w-8 h-8 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                              onClick={() => deleteNotification(n.id)}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </CardContent>
                        </Card>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>

          <TabsContent value="liked" className="mt-8">
            {likedLoading ? (
              <div className="grid grid-cols-1 gap-4">
                {[1, 2].map(i => (
                  <div key={i} className="h-32 w-full rounded-[2rem] bg-secondary/30 animate-pulse" />
                ))}
              </div>
            ) : likedProperties?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-20 h-20 rounded-[2.5rem] bg-secondary flex items-center justify-center mb-6">
                  <Heart className="w-8 h-8 text-muted-foreground" />
                </div>
                <h3 className="text-xl font-bold">No likes yet</h3>
                <p className="text-muted-foreground text-sm max-w-[200px] mt-2">Tap the heart to save items you love.</p>
                <Button onClick={() => navigate('/')} className="mt-6 rounded-full px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold">Explorer Deals</Button>
              </div>
            ) : (
              <div className="space-y-4">
                <AnimatePresence>
                  {likedProperties?.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="rounded-[2rem] border-border/40 bg-card/40 backdrop-blur-sm overflow-hidden group hover:border-primary/20 transition-all">
                        <div className="flex items-center p-3 gap-4">
                          <div className="w-24 h-24 rounded-2xl overflow-hidden flex-shrink-0 cursor-pointer" onClick={() => navigate(`/listing/${p.id}`)}>
                            <img src={p.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0 pr-2">
                            <div className="flex items-start justify-between">
                              <h4 className="font-bold text-sm truncate cursor-pointer hover:text-primary transition-colors" onClick={() => navigate(`/listing/${p.id}`)}>
                                {p.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 rounded-full text-muted-foreground hover:text-destructive"
                                onClick={() => removeLike(p.id)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground mt-1">
                              <MapPin className="w-3 h-3" />
                              <span className="text-[10px] font-medium truncate">{p.neighborhood || p.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="secondary" className="bg-secondary/80 text-[10px] font-bold px-2 py-0 border-none rounded-full">
                                {p.category}
                              </Badge>
                              <span className="text-sm font-black text-primary">
                                ${p.price?.toLocaleString()}
                                <span className="text-[10px] font-normal text-muted-foreground ml-0.5">/mo</span>
                              </span>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem]">
          <AlertDialogHeader>
            <AlertDialogTitle>Clear your inbox?</AlertDialogTitle>
            <AlertDialogDescription>This will permanently remove all activity notifications. Liked items will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2">
            <AlertDialogCancel className="rounded-full">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllNotifications} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-full font-bold px-8">
              {deletingAll ? 'Clearing...' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
