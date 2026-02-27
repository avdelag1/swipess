import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Zap, Bike } from 'lucide-react';
import { logger } from '@/utils/logger';
import { DEFAULT_DIRECT_MESSAGE } from '@/utils/directMessaging';

// Custom motorcycle icon matching the one used elsewhere
const MotorcycleIcon = ({ className }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="5" cy="17" r="3" />
    <circle cx="19" cy="17" r="3" />
    <path d="M9 17h6" />
    <path d="M19 17l-2-5h-4l-3-4H6l1 4" />
    <path d="M14 7h3l2 5" />
  </svg>
);

interface DirectMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  recipientName?: string;
  isLoading?: boolean;
  category?: string;
}

/**
 * DirectMessageDialog - A simplified messaging dialog for motorcycle and bicycle listings
 *
 * This dialog is shown instead of MessageConfirmationDialog for categories that
 * support direct messaging (motorcycle, bicycle). It has no quota warnings or
 * activation requirements - users can message freely.
 */
export function DirectMessageDialog({
  open,
  onOpenChange,
  onConfirm,
  recipientName = 'the owner',
  isLoading = false,
  category = 'motorcycle',
}: DirectMessageDialogProps) {
  const [message, setMessage] = useState(DEFAULT_DIRECT_MESSAGE);

  const isBicycle = category?.toLowerCase() === 'bicycle';
  const CategoryIcon = isBicycle ? Bike : MotorcycleIcon;
  const categoryLabel = isBicycle ? 'Bicycle' : 'Motorcycle';
  const categoryColor = isBicycle ? 'text-emerald-500' : 'text-slate-500';
  const categoryBgColor = isBicycle ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-slate-500/10 border-slate-500/20';

  const handleConfirm = () => {
    if (!message.trim()) {
      logger.warn('[DirectMessageDialog] Empty message, not sending');
      return;
    }

    logger.info('[DirectMessageDialog] User confirmed direct message send');
    onConfirm(message);
  };

  const handleCancel = () => {
    logger.info('[DirectMessageDialog] User cancelled direct message');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl">
            <MessageCircle className="w-5 h-5 text-cyan-500" />
            Send Message
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            <div className={`flex items-start gap-2 p-3 rounded-lg ${categoryBgColor} border`}>
              <div className="flex items-center gap-2 flex-shrink-0 mt-0.5">
                <Zap className="w-4 h-4 text-yellow-500" />
                <CategoryIcon className={`w-5 h-5 ${categoryColor}`} />
              </div>
              <div className="flex flex-col gap-1">
                <span className={`font-semibold ${categoryColor}`}>
                  Free Direct Messaging
                </span>
                <span className="text-sm text-muted-foreground">
                  {categoryLabel} listings support free messaging - no limits, no activation required!
                </span>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <label htmlFor="direct-message" className="text-sm font-medium">
            Your message to {recipientName}
          </label>
          <Textarea
            id="direct-message"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={isLoading}
          />
          <p className="text-xs text-muted-foreground">
            {message.length}/500 characters
          </p>
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={handleCancel}
            disabled={isLoading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !message.trim()}
            className="bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600"
          >
            {isLoading ? (
              <>
                <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-white border-t-transparent" />
                Sending...
              </>
            ) : (
              <>
                <MessageCircle className="w-4 h-4 mr-2" />
                Send Message
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
