import { useNotificationSystem } from '@/hooks/useNotificationSystem';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bell, MessageSquare, Flame,
  Sparkles, Star, Crown, MessageCircle, X
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
  return <div className={cn("p-2.5 rounded-xl", config.bg)}>{config.icon}</div>;
};

export default function NotificationsPage() {
  const { 
    notifications, 
    dismissNotification,
    clearAllNotifications,
    markAllAsRead,
    handleNotificationClick,
  } = useNotificationSystem();
  
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-32">
      <div className="max-w-2xl mx-auto px-4 pt-4">
        <header className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-black text-brand-accent-2/60 uppercase tracking-widest mb-1">
              Activity History
            </p>
            <h1 className="text-2xl font-black tracking-tight text-foreground">Updates</h1>
          </div>
          {notifications.length > 0 && (
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-muted-foreground"
                onClick={markAllAsRead}
              >
                Mark all read
              </Button>
              <Button 
                variant="ghost" 
                size="sm" 
                className="rounded-xl text-[10px] font-black uppercase tracking-widest text-destructive hover:bg-destructive/10"
                onClick={() => setDeleteDialogOpen(true)}
              >
                Clear all
              </Button>
            </div>
          )}
        </header>

        <div className="space-y-3">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center bg-muted/20 border border-dashed border-border rounded-[2.5rem]">
              <div className="w-20 h-20 rounded-3xl bg-muted/50 flex items-center justify-center mb-6 border border-border">
                <Bell className="w-10 h-10 text-muted-foreground/30" />
              </div>
              <h3 className="text-sm font-black text-muted-foreground uppercase tracking-widest">Pure Stillness</h3>
              <p className="text-xs text-muted-foreground/60 mt-1">New activity will manifest here</p>
            </div>
          ) : (
            <AnimatePresence mode="popLayout">
              {notifications.map((n, i) => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Card
                    className={cn(
                      "group relative overflow-hidden rounded-[1.5rem] border transition-all hover:bg-muted/10 active:scale-[0.99] cursor-pointer",
                      !n.read ? "bg-card border-brand-accent-2/20 border-l-4 border-l-brand-accent-2Shadow shadow-lg shadow-brand-accent-2/5" : "bg-card/50 border-border/40 opacity-80"
                    )}
                    onClick={() => {
                        haptics.tap();
                        handleNotificationClick(n);
                    }}
                  >
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="shrink-0 relative">
                        {n.avatar ? (
                          <div className="relative">
                            <img src={n.avatar} alt="" className="w-12 h-12 rounded-2xl object-cover border border-border" />
                            <div className="absolute -bottom-1 -right-1 scale-50">
                                <NotificationIconBg type={n.type} role={n.metadata?.role} />
                            </div>
                          </div>
                        ) : (
                          <NotificationIconBg type={n.type} role={n.metadata?.role} />
                        )}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-0.5">
                          <h4 className="font-black text-[13px] text-foreground leading-tight truncate">
                            {n.title}
                          </h4>
                          <span className="text-[10px] font-bold text-muted-foreground/50 shrink-0 ml-2">
                            {formatDistanceToNow(n.timestamp, { addSuffix: true }).replace('about ', '')}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground line-clamp-1">
                          {n.message}
                        </p>
                      </div>

                      <Button
                        variant="ghost"
                        size="icon"
                        className="w-8 h-8 rounded-xl opacity-0 group-hover:opacity-100 transition-all hover:bg-destructive/10 hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          haptics.tap();
                          dismissNotification(n.id);
                        }}
                      >
                        <X className="w-4 h-4" />
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
        <AlertDialogContent className="rounded-3xl border-border bg-card/90 backdrop-blur-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-black text-xl">Clear Activity?</AlertDialogTitle>
            <AlertDialogDescription className="font-bold">
              This will remove all visible notifications from your history permanently.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl font-bold">Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={() => {
                haptics.success();
                clearAllNotifications?.();
              }}
              className="bg-destructive text-destructive-foreground rounded-xl font-black"
            >
              CLEAR ALL
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
