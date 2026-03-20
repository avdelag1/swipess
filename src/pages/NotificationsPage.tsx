/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Bell, MessageSquare, Flame, Star, Sparkles, Trash2,
  Heart, X, MapPin
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useLikedProperties } from '@/hooks/useLikedProperties';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/prodLogger';
import { useNavigate } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
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
import { useTheme } from '@/hooks/useTheme';
import { haptics } from '@/utils/microPolish';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  created_at: string;
  is_read: boolean;
  link_url?: string | null;
  related_user_id?: string | null;
  metadata?: {
    role?: 'client' | 'owner';
    targetType?: 'listing' | 'profile';
    [key: string]: any;
  };
}

const NotificationIcon = ({ type, role = 'neutral' }: { type: string; role?: 'client' | 'owner' | 'neutral' }) => {
  const baseClass = "w-5 h-5 transition-transform group-hover:scale-110";
  switch (type) {
    case 'new_message':
    case 'message':
      return <MessageSquare className={cn(baseClass, "text-brand-primary")} />;
    case 'new_like':
    case 'like':
      return <Flame className={cn(baseClass, "text-brand-accent-2")} />;
    case 'new_match':
    case 'match':
      return <Sparkles className={cn(baseClass, "text-brand-accent-2")} />;
    case 'super_like':
      return <Star className={cn(baseClass, "text-brand-accent-2 fill-brand-accent-2")} />;
    default:
      return <Bell className={cn(baseClass, "text-muted-foreground/40")} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [_removingLikeId, setRemovingLikeId] = useState<string | null>(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const _isDark = theme === 'dark';
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
              type: n.notification_type || 'system',
              title: n.title || 'New Notification',
              message: n.message || '',
              created_at: n.created_at,
              is_read: n.is_read || false,
              link_url: n.link_url,
              related_user_id: n.related_user_id,
              metadata: n.metadata,
            }, ...prev]);
          } else if (payload.eventType === 'DELETE') {
            setNotifications(prev => prev.filter(n => n.id !== (payload.old as any).id));
          } else if (payload.eventType === 'UPDATE') {
            const updated = payload.new as any;
            setNotifications(prev => prev.map(n => n.id === updated.id ? { ...n, is_read: updated.is_read } : n));
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
        type: n.notification_type || 'system',
        title: n.title || 'Notification',
        message: n.message || '',
        created_at: n.created_at,
        is_read: n.is_read || false,
        link_url: n.link_url,
        related_user_id: n.related_user_id,
        metadata: n.metadata,
      })));
    } catch (e) {
      logger.error('Error fetching notifications:', e);
      toast.error('Failed to load notifications');
    } finally { setIsLoading(false); }
  };

  const deleteNotification = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    try {
      const { error } = await supabase.from('notifications').delete().eq('id', id);
      if (error) throw error;
      setNotifications(prev => prev.filter(n => n.id !== id));
    } catch (_e) { toast.error('Failed to delete'); }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    setDeletingAll(true);
    try {
      await supabase.from('notifications').delete().eq('user_id', user.id);
      setNotifications([]);
      toast.success('Clear!');
    } catch (_e) { toast.error('Failed to clear'); }
    finally { setDeletingAll(false); setDeleteDialogOpen(false); }
  };

  const removeLike = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    if (!user?.id) return;
    setRemovingLikeId(listingId);
    try {
      await supabase.from('likes').delete().eq('user_id', user.id).eq('target_id', listingId).eq('target_type', 'listing');
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast.success('Removed');
    } catch (_e) { toast.error('Failed'); }
    finally { setRemovingLikeId(null); }
  };

  const handleNotificationClick = (n: Notification) => {
    haptics.tap();
    if (n.link_url) navigate(n.link_url);
    if (!n.is_read) {
      supabase.from('notifications').update({ is_read: true }).eq('id', n.id).then(() => {
        setNotifications(prev => prev.map(item => item.id === n.id ? { ...item, is_read: true } : item));
      });
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;
  const likedCount = likedProperties?.length || 0;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-2xl mx-auto px-4 pt-4 pb-32">

        {/* Header */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-medium text-muted-foreground/60 mb-1">
              Notifications
            </p>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Your Updates</h1>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="icon" className="rounded-xl bg-muted/30 border border-border/40 hover:bg-muted/50" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 text-muted-foreground" />
            </Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-fit bg-muted/30 p-1 rounded-xl border border-border/40 mb-8">
            <TabsTrigger
              value="activity"
              className="rounded-lg py-2 px-5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground flex items-center gap-2"
            >
              Activity
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-primary" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="rounded-lg py-2 px-5 text-xs font-medium transition-all data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-sm text-muted-foreground flex items-center gap-2"
            >
              Liked
              {likedCount > 0 && (
                <span className="text-xs text-muted-foreground/50">({likedCount})</span>
              )}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="activity" className="mt-0 outline-none">
            <div className="space-y-3">
              {isLoading ? (
                [1, 2, 3].map(i => (
                  <div key={i} className="h-24 w-full rounded-3xl bg-white/5 animate-pulse" />
                ))
              ) : notifications.length === 0 ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 border border-dashed border-border/40 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-5">
                    <Bell className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground/60">No notifications yet</h3>
                  <p className="text-xs font-normal text-muted-foreground/40 mt-1">Activity will show up here</p>
                </motion.div>
              ) : (
                <AnimatePresence mode="popLayout">
                  {notifications.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card
                        className={cn(
                          "group relative overflow-hidden rounded-2xl border transition-all bg-card hover:bg-accent/5 active:scale-[0.98] cursor-pointer",
                          !n.is_read ? "border-border/40" : "border-border/20"
                        )}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <CardContent className="p-4 flex items-center gap-3.5">
                          <div className="w-10 h-10 rounded-xl bg-muted/30 flex items-center justify-center shrink-0">
                            <NotificationIcon type={n.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <div className="flex items-center gap-2">
                                <h4 className="font-medium text-[13px] text-foreground leading-tight">
                                  {n.title}
                                </h4>
                                {!n.is_read && (
                                  <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />
                                )}
                              </div>
                              <span className="text-[11px] font-normal text-muted-foreground/50 flex-shrink-0 ml-2">
                                {formatDistanceToNow(n.created_at)}
                              </span>
                            </div>
                            <p className="text-xs font-normal text-muted-foreground line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-7 h-7 rounded-lg opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/10 hover:text-rose-500"
                            onClick={(e) => deleteNotification(n.id, e)}
                          >
                            <X className="w-3.5 h-3.5" />
                          </Button>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )}
            </div>
          </TabsContent>

          <TabsContent value="liked" className="mt-0 outline-none">
            <div className="space-y-4">
              {likedLoading ? (
                [1, 2].map(i => (
                  <div key={i} className="h-32 w-full rounded-3xl bg-white/5 animate-pulse" />
                ))
              ) : likedProperties?.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center bg-muted/10 border border-dashed border-border/40 rounded-2xl">
                  <div className="w-16 h-16 rounded-2xl bg-muted/30 flex items-center justify-center mb-5">
                    <Heart className="w-7 h-7 text-muted-foreground/30" />
                  </div>
                  <h3 className="text-sm font-medium text-muted-foreground/60">No likes yet</h3>
                  <p className="text-xs font-normal text-muted-foreground/40 mt-1">Properties you like will appear here</p>
                </div>
              ) : (
                <AnimatePresence>
                  {likedProperties?.map((p, i) => (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <Card className="group relative overflow-hidden rounded-2xl bg-card border-border/30 hover:bg-accent/5 transition-all cursor-pointer" onClick={() => navigate(`/listing/${p.id}`)}>
                        <div className="flex p-3.5 gap-4">
                          <div className="w-22 h-22 rounded-xl overflow-hidden shrink-0 border border-border/30" style={{ width: 88, height: 88 }}>
                            <img src={p.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0 py-0.5">
                            <div className="flex items-start justify-between">
                              <h4 className="font-medium text-sm text-foreground line-clamp-1">
                                {p.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-7 h-7 rounded-lg hover:bg-rose-500/10 hover:text-rose-500 transition-colors"
                                onClick={(e) => removeLike(p.id, e)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5 text-muted-foreground/60 mt-1">
                              <MapPin className="w-3 h-3 text-muted-foreground/50" />
                              <span className="text-[11px] font-normal truncate">{p.neighborhood || p.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-3">
                              <Badge variant="secondary" className="text-[10px] font-medium border-none rounded-md px-2 py-0.5">
                                {p.category}
                              </Badge>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[11px] font-normal text-muted-foreground/60">$</span>
                                <span className="text-base font-semibold text-foreground tracking-tight">
                                  {p.price?.toLocaleString()}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </Card>
                    </motion.div>
                  ))}
                </AnimatePresence>
              )
              }
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-2xl bg-card backdrop-blur-2xl border-border/40 p-6">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-semibold text-foreground">Clear all notifications?</AlertDialogTitle>
            <AlertDialogDescription className="text-muted-foreground font-normal text-sm">This will permanently remove all activity notifications. Liked items will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 mt-4">
            <AlertDialogCancel className="rounded-xl border-border/40 text-foreground font-medium text-sm">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllNotifications} className="bg-destructive hover:bg-destructive/90 text-destructive-foreground rounded-xl font-medium text-sm px-6">
              {deletingAll ? 'Clearing...' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
