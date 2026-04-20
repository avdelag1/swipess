import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, MessageSquare, Flame,
  Sparkles, Star, Crown, MessageCircle, X,
  CheckCircle2, Trash2, ArrowLeft
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog, 
  AlertDialogAction, 
  AlertDialogCancel, 
  AlertDialogContent, 
  AlertDialogDescription, 
  AlertDialogFooter, 
  AlertDialogHeader, 
  AlertDialogTitle 
} from '@/components/ui/alert-dialog';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { haptics } from '@/utils/microPolish';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';

const NotificationIconBg = ({ type, role = 'neutral' }: { type: string; role?: 'client' | 'owner' | 'neutral' }) => {
  const getConfig = () => {
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
  return <div className={cn("p-2.5 rounded-xl transition-colors duration-300", config.bg)}>{config.icon}</div>;
};

export default function NotificationsPage() {
  const { 
    notifications, 
    dismissNotification, 
    clearAllNotifications,
    markAllAsRead, 
    handleNotificationClick,
    unreadCount: _unreadCount
  } = useNotificationSystem();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const navigate = useNavigate();
  const { theme, isLight } = useTheme();

  const handleBack = () => {
    haptics.tap();
    if (window.history.length > 2) {
      window.history.back();
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ── STICKY GLASS HEADER ────────────────────────────────────────── */}
      <header className="sticky top-0 z-40 w-full pt-[var(--safe-top)]">
        <div className="absolute inset-0 bg-background/60 backdrop-blur-3xl" />
        <div className="relative max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-2xl hover:bg-muted/10 active:scale-95 transition-all"
              onClick={handleBack}
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>
            <div className="mb-0" />
          </div>

          {notifications.length > 0 && (
            <div className="flex gap-2">
               <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 rounded-2xl hover:bg-brand-accent-2/10 text-brand-accent-2 transition-all active:scale-90"
                onClick={() => {
                  haptics.success();
                  markAllAsRead();
                }}
                title="Mark all as read"
              >
                <CheckCircle2 className="w-5 h-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="w-10 h-10 rounded-2xl hover:bg-destructive/10 text-destructive transition-all active:scale-90"
                onClick={() => setDeleteDialogOpen(true)}
                title="Clear history"
              >
                <Trash2 className="w-5 h-5" />
              </Button>
            </div>
          )}
        </div>
      </header>

      <div className="max-w-2xl mx-auto px-4 pt-6">
        <div className="space-y-4">
          {notifications.length === 0 ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center justify-center py-24 text-center glass-card-cinematic rounded-[3rem] border-dashed"
            >
              <div className="w-24 h-24 rounded-[2rem] bg-muted/20 flex items-center justify-center mb-8 border border-border/40 relative">
                <Bell className="w-10 h-10 text-muted-foreground/20" strokeWidth={1.5} />
                <motion.div 
                  className="absolute inset-0 rounded-[2rem] border-2 border-brand-accent-2/10"
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ duration: 4, repeat: Infinity }}
                />
              </div>
              <h3 className="text-xl font-black text-foreground mb-2">No Activity Yet</h3>
              <p className="text-sm text-muted-foreground/60 max-w-[240px]">
                Your activity history is empty. New notifications will appear here.
              </p>
            </motion.div>
          ) : (
            <AnimatePresence mode="popLayout" initial={false}>
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.9, filter: 'blur(10px)' }}
                  transition={{ 
                    type: 'spring',
                    stiffness: 400,
                    damping: 30,
                    delay: Math.min(i * 0.03, 0.3)
                  }}
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden rounded-[2rem] border-0 transition-all cursor-pointer active:scale-[0.98]",
                      !n.read 
                        ? (isLight ? "bg-white shadow-xl shadow-black/5" : "bg-card/80 shadow-2xl shadow-brand-accent-2/5 border border-brand-accent-2/10")
                        : "bg-muted/30 border border-transparent opacity-70 grayscale-[0.5]"
                    )}
                    onClick={() => {
                        haptics.tap();
                        handleNotificationClick(n);
                    }}
                  >
                    {!n.read && (
                      <div className="absolute top-0 left-0 w-1.5 h-full bg-gradient-to-b from-brand-accent-2 to-brand-primary" />
                    )}
                    
                    <CardContent className="p-5 flex items-center gap-5">
                      <div className="shrink-0 relative">
                        {n.avatar ? (
                          <div className="relative">
                            <img src={n.avatar} alt="" className="w-14 h-14 rounded-2xl object-cover border border-border shadow-sm" />
                            <div className="absolute -bottom-1 -right-1 scale-75 origin-bottom-right">
                                <NotificationIconBg type={n.type} role={n.metadata?.role} />
                            </div>
                          </div>
                        ) : (
                          <NotificationIconBg type={n.type} role={n.metadata?.role} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <h4 className={cn(
                            "font-black text-sm tracking-tight truncate",
                            !n.read ? "text-foreground" : "text-muted-foreground"
                          )}>
                            {n.title}
                          </h4>
                          <span className="text-[10px] font-black text-muted-foreground/40 uppercase tracking-tighter shrink-0 ml-3">
                            {formatDistanceToNow(n.timestamp, { addSuffix: true }).replace('about ', '')}
                          </span>
                        </div>
                        <p className={cn(
                          "text-xs leading-relaxed",
                          !n.read ? "text-muted-foreground font-medium" : "text-muted-foreground/60"
                        )}>
                          {n.message}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-10 h-10 rounded-2xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive active:scale-90"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.tap();
                          dismissNotification(n.id);
                        }}
                      >
                        <X className="w-5 h-5" />
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="rounded-[2.5rem] border-border bg-card/90 backdrop-blur-3xl">
          <AlertDialogHeader>
            <div className="w-16 h-16 rounded-3xl bg-destructive/10 flex items-center justify-center mb-4 mx-auto">
              <Trash2 className="w-8 h-8 text-destructive" />
            </div>
            <AlertDialogTitle className="font-black text-2xl text-center">Clear Everything?</AlertDialogTitle>
            <AlertDialogDescription className="text-center font-bold text-muted-foreground px-4">
              Your activity history will be completely purged. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2 mt-4 sm:gap-2">
            <AlertDialogCancel className="w-full sm:flex-1 rounded-2xl font-black h-12 border-muted hover:bg-muted/50">CANCEL</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                haptics.warning();
                clearAllNotifications?.();
              }}
              className="w-full sm:flex-1 bg-destructive text-destructive-foreground rounded-2xl font-black h-12 hover:bg-destructive/90 active:scale-95 transition-all"
            >
              CLEAR ALL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
