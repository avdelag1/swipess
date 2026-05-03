import React from 'react';
import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Trash2, Heart, MessageCircle, Info, 
  MapPin, UserCheck, AlertTriangle, Sparkles, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import useAppTheme from '@/hooks/useAppTheme';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import { PageHeader } from '@/components/PageHeader';

const NotificationsPage = () => {
  const { notifications, markNotificationAsRead, dismissNotification, markAllAsRead } = useNotificationSystem();
  const isLoading = false; // Mock loading state since useNotificationSystem doesn't provide it
  const { isLight, isDark } = useAppTheme();
  const { navigate } = useAppNavigate();

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
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium animate-pulse">Synchronizing Reality...</p>
      </div>
    );
  }

  return (
    <div className={cn(
      "w-full pb-20 min-h-screen",
      isDark ? "bg-[#0a0a0c]" : "bg-white"
    )}>
      <div className="max-w-2xl mx-auto px-6 pt-4">
        <PageHeader 
          title="Pulse Feed" 
          subtitle="System Intelligence Updates" 
          showBack={true}
          actions={notifications.length > 0 ? (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { triggerHaptic('medium'); markAllAsRead(); }}
              className="font-black uppercase italic text-[10px] tracking-widest hover:bg-white/5"
            >
              Clear Unread
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
              <h2 className="text-lg font-black uppercase italic tracking-wider opacity-60">Silence is Golden</h2>
              <p className="text-xs font-medium opacity-30 mt-2">Check back later for system updates</p>
            </motion.div>
          ) : (
            notifications.map((notif, i) => (
              <motion.div
                key={notif.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                onClick={() => { triggerHaptic('light'); markNotificationAsRead(notif.id); }}
                className={cn(
                  "group relative p-5 rounded-[2.5rem] border transition-all cursor-pointer active:scale-[0.98]",
                  notif.read 
                    ? (isDark ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-black/5 border-black/5 opacity-60")
                    : (isDark ? "bg-white/5 border-white/10 shadow-2xl" : "bg-white border-black/10 shadow-xl")
                )}
              >
                <div className="flex gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 border",
                    !notif.read 
                      ? "bg-brand-primary/10 border-brand-primary/20"
                      : isDark ? "bg-white/5 border-white/10" : "bg-black/5 border-black/10"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest italic opacity-40 mb-1 block",
                          !notif.read && "text-brand-primary opacity-100"
                        )}>
                         {notif.type || 'Alert'} — {formatDistanceToNow(notif.timestamp, { addSuffix: true })}
                       </span>
                    </div>
                    
                    <h3 className={cn("text-[14px] font-black tracking-tight leading-snug", isLight ? "text-slate-900" : "text-white")}>
                      {notif.title}
                    </h3>
                    <p className={cn("text-[12px] font-medium opacity-50 mt-1 line-clamp-2", isLight ? "text-slate-600" : "text-slate-400")}>
                      {notif.message}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); dismissNotification(notif.id); }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!notif.read && (
                       <button
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('success'); markNotificationAsRead(notif.id); }}
                        className="p-2 rounded-xl bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary transition-colors"
                      >
                        <Check className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;


