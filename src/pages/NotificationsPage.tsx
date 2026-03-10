/** SPEED OF LIGHT: DashboardLayout is now rendered at route level */
import { useState, useEffect, useCallback } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Bell, MessageSquare, Flame, Star, Sparkles, Trash2,
  MoreHorizontal, Heart, Home, Ship, Bike, Car,
  ExternalLink, X, Clock, MapPin, Zap, ChevronRight
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useLikedProperties } from '@/hooks/useLikedProperties';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from '@/components/ui/sonner';
import { logger } from '@/utils/logger';
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
      return <Bell className={cn(baseClass, "text-white/40")} />;
  }
};

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('activity');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [removingLikeId, setRemovingLikeId] = useState<string | null>(null);
  const { user } = useAuth();
  const { theme } = useTheme();
  const isDark = theme !== 'white-matte';
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
    } catch (e) { toast.error('Failed to delete'); }
  };

  const deleteAllNotifications = async () => {
    if (!user?.id) return;
    setDeletingAll(true);
    try {
      await supabase.from('notifications').delete().eq('user_id', user.id);
      setNotifications([]);
      toast.success('Clear!');
    } catch (e) { toast.error('Failed to clear'); }
    finally { setDeletingAll(false); setDeleteDialogOpen(false); }
  };

  const removeLike = async (listingId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    haptics.tap();
    setRemovingLikeId(listingId);
    try {
      await supabase.from('likes').delete().eq('user_id', user?.id || '').eq('target_id', listingId).eq('target_type', 'listing');
      queryClient.invalidateQueries({ queryKey: ['liked-properties'] });
      toast.success('Removed');
    } catch (e) { toast.error('Failed'); }
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
      <div className="max-w-2xl mx-auto px-4 pt-[calc(56px+var(--safe-top)+1.5rem)] pb-32">

        {/* Header - Unified Style */}
        <header className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-4 h-4 text-brand-accent-2 animate-pulse" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">
                Marketplace Inbox
              </span>
            </div>
            <h1 className="text-3xl font-black tracking-tighter text-white">Your Updates</h1>
          </div>
          {notifications.length > 0 && (
            <Button variant="ghost" size="icon" className="rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="w-4 h-4 text-white/60" />
            </Button>
          )}
        </header>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="flex w-fit bg-white/5 p-1 rounded-2xl border border-white/5 mb-8">
            <TabsTrigger
              value="activity"
              className="rounded-xl py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-brand-accent-2 data-[state=active]:text-white flex items-center gap-2"
            >
              Activity
              {unreadCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_8px_white]" />
              )}
            </TabsTrigger>
            <TabsTrigger
              value="liked"
              className="rounded-xl py-2 px-6 text-[10px] font-black uppercase tracking-widest transition-all data-[state=active]:bg-brand-accent-2 data-[state=active]:text-white flex items-center gap-2"
            >
              Liked
              {likedCount > 0 && (
                <span className="text-[10px] opacity-40">({likedCount})</span>
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
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Bell className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">Inbox Empty</h3>
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
                          "group relative overflow-hidden rounded-3xl border-white/5 transition-all bg-black/40 backdrop-blur-3xl hover:bg-white/[0.03] active:scale-[0.98] cursor-pointer",
                          !n.is_read && "border-l-4 border-l-brand-accent-2"
                        )}
                        onClick={() => handleNotificationClick(n)}
                      >
                        <CardContent className="p-5 flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center shrink-0 group-hover:bg-white/10 transition-colors">
                            <NotificationIcon type={n.type} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                              <h4 className="font-black text-xs uppercase tracking-tight text-white group-hover:text-brand-accent-2 transition-colors">
                                {n.title}
                              </h4>
                              <span className="text-[10px] font-black uppercase text-white/20">
                                {formatDistanceToNow(n.created_at)}
                              </span>
                            </div>
                            <p className="text-[11px] font-bold text-muted-foreground line-clamp-2 leading-relaxed">
                              {n.message}
                            </p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-xl bg-white/5 opacity-0 group-hover:opacity-100 transition-all hover:bg-rose-500/20 hover:text-rose-500"
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
                <div className="flex flex-col items-center justify-center py-20 text-center bg-white/[0.02] border border-dashed border-white/5 rounded-[3rem]">
                  <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6">
                    <Heart className="w-8 h-8 text-white/20" />
                  </div>
                  <h3 className="text-sm font-black uppercase tracking-widest text-white/40">No Likes Yet</h3>
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
                      <Card className="group relative overflow-hidden rounded-[2.5rem] bg-black/40 backdrop-blur-3xl border-white/5 hover:bg-white/[0.03] transition-all cursor-pointer" onClick={() => navigate(`/listing/${p.id}`)}>
                        <div className="flex p-4 gap-5">
                          <div className="w-24 h-24 rounded-[1.5rem] overflow-hidden shrink-0 border border-white/10">
                            <img src={p.images?.[0]} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                          </div>
                          <div className="flex-1 min-w-0 py-1">
                            <div className="flex items-start justify-between">
                              <h4 className="font-black text-sm text-white tracking-tight line-clamp-1 group-hover:text-brand-accent-2 transition-colors">
                                {p.title}
                              </h4>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="w-8 h-8 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-500 transition-colors"
                                onClick={(e) => removeLike(p.id, e)}
                              >
                                <X className="w-3.5 h-3.5" />
                              </Button>
                            </div>
                            <div className="flex items-center gap-1.5 text-white/40 mt-1">
                              <MapPin className="w-3 h-3 text-brand-accent-2" />
                              <span className="text-[10px] font-black uppercase truncate">{p.neighborhood || p.city}</span>
                            </div>
                            <div className="flex items-center justify-between mt-4">
                              <Badge className="bg-white/5 text-[9px] font-black uppercase border-none rounded-lg tracking-widest px-2.5">
                                {p.category}
                              </Badge>
                              <div className="flex items-baseline gap-0.5">
                                <span className="text-[10px] font-black text-white/40">$</span>
                                <span className="text-base font-black text-white tracking-tighter">
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
        <AlertDialogContent className="rounded-[2.5rem] bg-black/90 backdrop-blur-2xl border-white/10 p-8">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl font-black text-white">Clear your inbox?</AlertDialogTitle>
            <AlertDialogDescription className="text-white/60 font-bold">This will permanently remove all activity notifications. Liked items will be preserved.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-3 mt-6">
            <AlertDialogCancel className="rounded-2xl border-white/10 bg-white/5 hover:bg-white/10 text-white font-black text-xs uppercase tracking-widest">Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={deleteAllNotifications} className="bg-brand-accent-2 hover:bg-brand-accent-2/80 text-white rounded-2xl font-black text-xs uppercase tracking-widest px-8">
              {deletingAll ? 'Clearing...' : 'Clear All'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
