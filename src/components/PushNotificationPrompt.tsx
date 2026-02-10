import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, MessageSquare, Flame, Crown, X } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from '@/hooks/use-toast';
import { logger } from '@/utils/prodLogger';

const NOTIFICATION_PROMPT_KEY = 'notification_prompt_dismissed';
const PROMPT_DELAY_DAYS = 7; // Days before showing prompt again if dismissed

export function PushNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isSupported, setIsSupported] = useState(false);

  useEffect(() => {
    // SPEED OF LIGHT: Do NOT auto-show notification prompt on startup
    // This prompt should only be triggered by user action (settings button)
    // Just track if notifications are supported for the settings UI
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setIsSupported(true);
    }
    // REMOVED: Auto-show timer that was blocking user experience
    // Permission is now requested only from settings
  }, []);

  const handleEnableNotifications = async () => {
    try {
      const permission = await Notification.requestPermission();

      if (permission === 'granted') {
        toast({
          title: "Notifications Enabled!",
          description: "You'll now receive real-time updates for messages, likes, and more.",
          duration: 4000,
        });

        // Show a test notification
        const notification = new Notification('Notifications Enabled!', {
          body: 'You will now receive updates when someone messages or likes you.',
          icon: '/favicon.ico',
          badge: '/favicon.ico',
          tag: 'welcome-notification',
        });
        setTimeout(() => notification.close(), 5000);
      } else if (permission === 'denied') {
        toast({
          title: "Notifications Blocked",
          description: "You can enable notifications later in your browser settings.",
          variant: "destructive",
          duration: 5000,
        });
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        logger.error('Error requesting notification permission:', error);
      }
    }

    setIsOpen(false);
  };

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, new Date().toISOString());
    setIsOpen(false);
  };

  if (!isSupported) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-background p-6 pb-4">
          <DialogHeader className="space-y-3">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              className="mx-auto p-4 rounded-full bg-primary/10 border border-primary/20"
            >
              <BellRing className="w-8 h-8 text-primary" />
            </motion.div>
            <DialogTitle className="text-center text-xl font-bold">
              Stay in the Loop!
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground">
              Enable notifications to never miss important updates
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Benefits */}
        <div className="px-6 py-4 space-y-3">
          <p className="text-sm font-medium text-foreground mb-3">
            Get notified when:
          </p>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-blue-500/10 border border-blue-500/20"
          >
            <MessageSquare className="w-5 h-5 text-blue-500" />
            <span className="text-sm text-foreground">Someone sends you a message</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-orange-500/10 border border-orange-500/20"
          >
            <Flame className="w-5 h-5 text-orange-500" />
            <span className="text-sm text-foreground">Someone likes your profile or property</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center gap-3 p-3 rounded-lg bg-purple-500/10 border border-purple-500/20"
          >
            <Crown className="w-5 h-5 text-purple-500" />
            <span className="text-sm text-foreground">Your premium or activation purchase is confirmed</span>
          </motion.div>
        </div>

        {/* Actions */}
        <div className="px-6 pb-6 pt-2 space-y-3">
          <Button
            onClick={handleEnableNotifications}
            className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
          >
            <Bell className="w-4 h-4 mr-2" />
            Enable Notifications
          </Button>

          <Button
            variant="ghost"
            onClick={handleDismiss}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Maybe Later
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
