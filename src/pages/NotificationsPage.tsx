import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { 
  _X, AlertTriangle, Bell, Heart, Info, 
  MapPin, MessageCircle, Sparkles, Trash2, UserCheck
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { PageHeader } from '@/components/PageHeader';
import { useSiteContent } from '@/hooks/useSiteContent';
import { NotificationListSkeleton } from '@/components/ui/ContentSkeleton';
import { AmbientPageBackground } from '@/components/ui/AmbientPageBackground';

const TYPE_MAP: Record<string, string> = {
  new_like: 'like',
  new_match: 'match',
  new_message: 'message',
  new_review: 'like',
  property_inquiry: 'message',
  contract_signed: 'like',
  contract_pending: 'like',
  payment_received: 'premium_purchase',
  profile_viewed: 'like',
  system_announcement: 'like',
  verification_approved: 'like',
  subscription_expiring: 'premium_purchase',
};

const NotificationsPage = () => {
  const { user } = useAuth();
  const { markNotificationAsRead, dismissNotification, markAllAsRead, handleNotificationClick } = useNotificationSystem();
  const { isLight, isDark } = useAppTheme();

  const { data: pageRows, isLoading, isError, refetch } = useQuery({
    queryKey: ['notifications-page', user?.id],
    enabled: !!user?.id,
    staleTime: 60_000,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('notifications')
        .select('id, notification_type, message, is_read, created_at, title, link_url, related_user_id, metadata')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
        .limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const notifications = useMemo(
    () =>
      (pageRows ?? []).map((row) => ({
        id: row.id,
        type: TYPE_MAP[row.notification_type] || 'like',
        title: row.title || 'Notification',
        message: row.message || '',
        timestamp: new Date(row.created_at),
        read: row.is_read || false,
        actionUrl: row.link_url,
        relatedUserId: row.related_user_id,
        metadata: row.metadata || {},
      })),
    [pageRows],
  );
  const { _navigate } = useAppNavigate();
  const { getText } = useSiteContent('notifications');

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'match': return <Sparkles className="w-5 h-5 text-violet-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-rose-500" />;
      case 'system': return <Info className="w-5 h-5 text-indigo-500" />;
      case 'location': return <MapPin className="w-5 h-5 text-rose-500" />;
      case 'verification': return <UserCheck className="w-5 h-5 text-indigo-500" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-rose-500" />;
      default: return <Bell className="w-5 h-5 text-slate-400" />;
    }
  };

  if (isLoading) {
    return (
      <AmbientPageBackground className="w-full pb-20 min-h-screen pt-4">
        <NotificationListSkeleton rows={6} />
      </AmbientPageBackground>
    );
  }

  if (isError) {
    return (
      <AmbientPageBackground className="w-full min-h-screen">
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 px-6">
          <p className="text-sm font-semibold text-muted-foreground text-center">Could not load notifications.</p>
          <Button onClick={() => refetch()}>Try again</Button>
        </div>
      </AmbientPageBackground>
    );
  }

  return (
    <AmbientPageBackground className={cn(
      "w-full pb-20 min-h-screen page-canvas",
      isDark ? "bg-[#0a0a0c]" : "bg-background"
    )}>
      <div className="max-w-2xl mx-auto px-6 pt-4">
        <PageHeader 
          title={getText('page_title', 'Pulse Feed')} 
          subtitle={getText('page_subtitle', 'Your latest activity')} 
          showBack={false}
          actions={notifications.length > 0 ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { triggerHaptic('medium'); markAllAsRead(); }}
              className={cn("font-black uppercase italic text-[10px] tracking-widest", isLight ? "hover:bg-black/5" : "hover:bg-white/5")}
            >
              {getText('mark_all_read', 'Clear Unread')}
            </Button>
          ) : undefined}
        />
      </div>

      <div className="max-w-2xl mx-auto px-4 pt-10">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className={cn("w-20 h-20 rounded-full flex items-center justify-center mb-6 border", isDark ? "bg-white/5 border-white/5" : "bg-black/5 border-black/5")}>
                <Bell className={cn("w-10 h-10", isDark ? "text-slate-600" : "text-slate-400")} />
              </div>
              <h2 className="text-lg font-black uppercase italic tracking-wider opacity-60">{getText('empty_state', 'Silence is Golden')}</h2>
              <p className="text-xs font-medium opacity-30 mt-2">{getText('empty_state_subtitle', 'Check back later for system updates')}</p>
            </motion.div>
          ) : (
            notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.15, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => { 
                  triggerHaptic('light'); 
                  markNotificationAsRead(notif.id); 
                  handleNotificationClick(notif);
                }}
                className={cn(
                  "group relative transition-all cursor-pointer active:scale-[0.98] rounded-[1.5rem] p-4",
                  notif.read ? "surface-row opacity-70" : "surface-row surface-row--active",
                )}
              >
                <div className="flex gap-4">
                  <div className={cn(
                    "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0",
                    isDark ? "bg-white/[0.04]" : "bg-black/[0.04]"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn("text-[14px] font-semibold leading-snug", isLight ? "text-slate-900" : "text-white")}>
                      {notif.title}
                    </h3>
                    <p className={cn("text-[12px] mt-0.5 line-clamp-2", isLight ? "text-slate-500" : "text-slate-400")}>
                      {notif.message}
                    </p>
                    <span className={cn(
                      "text-[10px] mt-1 block",
                      isLight ? "text-slate-400" : "text-slate-500"
                    )}>
                      {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                    </span>
                  </div>

                  <button
                    onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); dismissNotification(notif.id); }}
                    className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-colors shrink-0 self-start"
                    aria-label="Dismiss notification"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </AmbientPageBackground>
  );
};

export default NotificationsPage;


