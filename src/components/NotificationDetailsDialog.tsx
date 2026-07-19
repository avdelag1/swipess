import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Sparkles, X } from 'lucide-react';
import { AppNotification } from '@/state/notificationStore';
import { formatDistanceToNow } from '@/utils/timeFormatter';
import { useNavigate } from 'react-router-dom';
import { notificationTypeConfigs } from '@/utils/notificationConfigs';
import { haptics } from '@/utils/microPolish';

export function NotificationDetailsDialog() {
  const [isOpen, setIsOpen] = useState(false);
  const [notification, setNotification] = useState<AppNotification | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleOpen = (e: Event) => {
      const customEvent = e as CustomEvent<AppNotification>;
      setNotification(customEvent.detail);
      setIsOpen(true);
    };
    window.addEventListener('open-notification-details', handleOpen);
    return () => window.removeEventListener('open-notification-details', handleOpen);
  }, []);

  if (!notification) return null;

  const config = notificationTypeConfigs[notification.type as keyof typeof notificationTypeConfigs] || notificationTypeConfigs.like;
  const Icon = config.icon;

  const handleAction = () => {
    haptics.tap();
    let url: string | null = null;
    if (notification.actionUrl) {
      url = notification.actionUrl;
    } else if (notification.type === 'message' && (notification.conversationId || notification.metadata?.conversationId)) {
      const convId = notification.conversationId || notification.metadata?.conversationId;
      url = `/messages?conversationId=${convId}`;
    }

    if (url) {
      setIsOpen(false);
      navigate(url);
    } else if (notification.type === 'premium_purchase' || notification.type === 'activation_purchase') {
      setIsOpen(false);
      navigate('/client/profile');
    } else {
      setIsOpen(false);
    }
  };

  const hasAction = !!notification.actionUrl || notification.type === 'message' || notification.type === 'premium_purchase' || notification.type === 'activation_purchase';

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent hideCloseButton className="sm:max-w-[425px] rounded-[2rem] p-0 overflow-hidden bg-background border-border/40 shadow-2xl">
        <DialogTitle className="sr-only">Notification Details</DialogTitle>
        <div className="px-5 pt-6 pb-5 border-b border-border/10 flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-2xl flex items-center justify-center shadow-inner" style={{ backgroundColor: config.bg, color: config.accentColor }}>
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black tracking-tight">{notification.title}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  {formatDistanceToNow(notification.timestamp, { addSuffix: true })}
                </span>
                <span className="text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md" style={{ backgroundColor: config.bg, color: config.accentColor }}>
                  {config.label}
                </span>
              </div>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="h-9 w-9 rounded-full bg-muted/50 hover:bg-muted" onClick={() => setIsOpen(false)}>
            <X className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="px-6 py-8">
          <p className="text-[16px] leading-relaxed font-medium text-foreground/90 whitespace-pre-wrap">
            {notification.message}
          </p>
        </div>

        {hasAction && (
          <div className="px-5 pb-5">
            <Button onClick={handleAction} className="w-full rounded-2xl h-14 font-black uppercase tracking-widest shadow-lg active:scale-[0.98] transition-all" style={{ backgroundColor: config.accentColor, color: 'white' }}>
              View Details
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
