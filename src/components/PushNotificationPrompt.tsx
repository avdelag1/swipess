import { useEffect, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { BellRing, Flame, MessageSquare, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { appToast } from '@/utils/appNotification';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useAuth } from '@/hooks/useAuth';

const NOTIFICATION_PROMPT_KEY = 'notification_prompt_dismissed_v2';
const PROMPT_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

export function PushNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe, isSupported, isSubscribed, permission } = usePushNotifications();
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !isSupported || isSubscribed || permission === 'granted') return;
    if (permission === 'denied') return;

    const raw = localStorage.getItem(NOTIFICATION_PROMPT_KEY);
    if (raw) {
      const ts = Date.parse(raw);
      if (!Number.isNaN(ts) && Date.now() - ts < PROMPT_COOLDOWN_MS) return;
    }

    const t = window.setTimeout(() => setIsOpen(true), 4500);
    return () => window.clearTimeout(t);
  }, [user?.id, isSupported, isSubscribed, permission]);

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      const success = await subscribe();
      if (success) {
        appToast.success('Phone notifications on', 'You’ll get alerts even when Swipess is closed.');
      } else {
        appToast.error('Notifications not enabled', 'You can turn them on later in system settings.');
      }
    } catch {
      appToast.error('Something went wrong');
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      localStorage.setItem(NOTIFICATION_PROMPT_KEY, new Date().toISOString());
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, new Date().toISOString());
    setIsOpen(false);
  };

  if (!isSupported || isSubscribed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleDismiss(); else setIsOpen(true); }}>
      <DialogContent className="max-w-md p-0 overflow-hidden z-[2147483000]">
        <div className="bg-background p-6 pb-4">
          <DialogHeader className="space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="mx-auto p-3.5 rounded-2xl bg-primary/8"
            >
              <BellRing className="w-7 h-7 text-primary" />
            </motion.div>
            <DialogTitle className="text-center text-lg font-semibold">
              Get alerts on your phone
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-normal text-sm">
              Allow notifications so matches, messages, and promos pop up even when the app is closed.
            </DialogDescription>
          </DialogHeader>
        </div>

        <div className="px-6 py-4 space-y-3">
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
          >
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-foreground">New messages</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.15 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-foreground">Likes & matches</span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20"
          >
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="text-sm text-foreground">Partner promos & updates</span>
          </motion.div>
        </div>

        <div className="p-6 pt-2 flex flex-col gap-2">
          <Button onClick={() => void handleEnableNotifications()} disabled={isLoading} className="w-full h-11">
            {isLoading ? 'Enabling…' : 'Enable phone notifications'}
          </Button>
          <Button variant="ghost" onClick={handleDismiss} className="w-full">
            Not now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
