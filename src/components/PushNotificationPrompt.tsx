import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Bell, BellRing, MessageSquare, Flame, Crown } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { usePushNotifications } from '@/hooks/usePushNotifications';

const NOTIFICATION_PROMPT_KEY = 'notification_prompt_dismissed';

export function PushNotificationPrompt() {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const { subscribe, isSupported, isSubscribed } = usePushNotifications();

  const handleEnableNotifications = async () => {
    setIsLoading(true);
    try {
      // This calls the hook's subscribe() which:
      // 1. Requests browser permission
      // 2. Creates PushManager subscription
      // 3. Saves endpoint + keys to push_subscriptions table
      const success = await subscribe();

      if (success) {
        toast.success("Notifications Enabled!", { 
          description: "You'll now receive real-time updates for messages, likes, and more.", 
          duration: 4000 
        });
      } else {
        toast.error("Notifications Not Enabled", { 
          description: "You can enable notifications later in your browser settings.", 
          duration: 5000 
        });
      }
    } catch (_error) {
      toast.error("Something went wrong", {
        description: "Please try again later.",
        duration: 4000
      });
    } finally {
      setIsLoading(false);
      setIsOpen(false);
    }
  };

  const handleDismiss = () => {
    localStorage.setItem(NOTIFICATION_PROMPT_KEY, new Date().toISOString());
    setIsOpen(false);
  };

  // Don't render if not supported or already subscribed
  if (!isSupported || isSubscribed) return null;

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="max-w-md p-0 overflow-hidden">
        {/* Header */}
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
              Stay in the Loop
            </DialogTitle>
            <DialogDescription className="text-center text-muted-foreground font-normal text-sm">
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
            disabled={isLoading}
            className="w-full h-12 font-semibold bg-primary hover:bg-primary/90"
          >
            <Bell className="w-4 h-4 mr-2" />
            {isLoading ? "Enabling..." : "Enable Notifications"}
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

