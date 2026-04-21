import React from 'react';
import { useNotifications } from '@/hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, Check, Trash2, Heart, MessageCircle, Info, 
  MapPin, UserCheck, AlertTriangle, Sparkles, X
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { useTheme } from '@/hooks/useTheme';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { useAppNavigate } from '@/hooks/useAppNavigate';

const NotificationsPage = () => {
  const { notifications, isLoading, markAsRead, deleteNotification, markAllAsRead } = useNotifications();
  const { isLight, isDark, isIvanna } = useTheme();
  const { navigate } = useAppNavigate();

  const getIcon = (type: string) => {
    switch (type) {
      case 'like': return <Heart className="w-5 h-5 text-rose-500 fill-rose-500" />;
      case 'match': return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'message': return <MessageCircle className="w-5 h-5 text-sky-500" />;
      case 'system': return <Info className="w-5 h-5 text-blue-500" />;
      case 'location': return <MapPin className="w-5 h-5 text-emerald-500" />;
      case 'verification': return <UserCheck className="w-5 h-5 text-indigo-500" />;
      case 'alert': return <AlertTriangle className="w-5 h-5 text-orange-500" />;
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
      "min-h-full w-full pb-20",
      isIvanna ? "bg-transparent" : (isDark ? "bg-[#0a0a0c]" : "bg-white")
    )}>
      <header className={cn(
        "sticky top-0 z-50 px-6 py-4 backdrop-blur-3xl border-b transition-all",
        isDark ? "bg-[#0a0a0c]/80 border-white/5" : "bg-white/80 border-black/5"
      )}>
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-brand-primary animate-pulse" />
            <h1 className={cn(
              "text-xl font-black uppercase italic tracking-tighter",
              isLight ? "text-slate-900" : "text-white"
            )}>Pulse Feed</h1>
          </div>
          
          {notifications.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={() => { triggerHaptic('medium'); markAllAsRead(); }}
              className="font-black uppercase italic text-[10px] tracking-widest hover:bg-white/5"
            >
              Clear Unread
            </Button>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-20">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-32 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center mb-6 border border-white/5">
                <Bell className="w-10 h-10 text-slate-600" />
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
                onClick={() => { triggerHaptic('light'); markAsRead(notif.id); }}
                className={cn(
                  "group relative p-5 rounded-[2.5rem] border transition-all cursor-pointer active:scale-[0.98]",
                  notif.read_at 
                    ? (isDark ? "bg-white/[0.02] border-white/5 opacity-60" : "bg-black/5 border-black/5 opacity-60")
                    : (isDark ? "bg-white/5 border-white/10 shadow-2xl" : "bg-white border-black/10 shadow-xl")
                )}
              >
                <div className="flex gap-5">
                  <div className={cn(
                    "w-12 h-12 rounded-2xl flex items-center justify-center bg-white/5 border border-white/10 shrink-0",
                    !notif.read_at && "bg-brand-primary/10 border-brand-primary/20"
                  )}>
                    {getIcon(notif.type)}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                       <span className={cn(
                         "text-[10px] font-black uppercase tracking-widest italic opacity-40 mb-1 block",
                         !notif.read_at && "text-brand-primary opacity-100"
                        )}>
                         {notif.type || 'Alert'} — {formatDistanceToNow(new Date(notif.created_at), { addSuffix: true })}
                       </span>
                    </div>
                    
                    <h3 className={cn("text-[14px] font-black tracking-tight leading-snug", isLight ? "text-slate-900" : "text-white")}>
                      {notif.title}
                    </h3>
                    <p className={cn("text-[12px] font-medium opacity-50 mt-1 line-clamp-2", isLight ? "text-slate-600" : "text-slate-400")}>
                      {notif.content}
                    </p>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={(e) => { e.stopPropagation(); triggerHaptic('medium'); deleteNotification(notif.id); }}
                      className="p-2 rounded-xl bg-white/5 hover:bg-rose-500/20 text-slate-500 hover:text-rose-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                    {!notif.read_at && (
                       <button
                        onClick={(e) => { e.stopPropagation(); triggerHaptic('success'); markAsRead(notif.id); }}
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


