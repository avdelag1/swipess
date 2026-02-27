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
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { logger } from '@/utils/logger';

interface MessageConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  recipientName?: string;
  isLoading?: boolean;
}

export function MessageConfirmationDialog({
  open,
  onOpenChange,
  onConfirm,
  recipientName = 'this person',
  isLoading = false,
}: MessageConfirmationDialogProps) {
  const [message, setMessage] = useState("Hi! I'd like to connect with you.");
  const messagingQuota = useMessagingQuota();
  const canStartNewConversation = messagingQuota.canStartNewConversation;
  const remainingConversations = messagingQuota.remainingConversations;
  const quotaLoading = false; // useMessagingQuota doesn't have isLoading

  const handleConfirm = () => {
    if (!message.trim()) {
      logger.warn('[MessageConfirmationDialog] Empty message, not sending');
      return;
    }

    logger.info('[MessageConfirmationDialog] User confirmed message send');
    onConfirm(message);
  };

  const handleCancel = () => {
    logger.info('[MessageConfirmationDialog] User cancelled message send');
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
            {quotaLoading ? (
              <div className="flex items-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
                <span>Checking your messaging quota...</span>
              </div>
            ) : !canStartNewConversation ? (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/10 border border-amber-500/20">
                <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-amber-500">Message limit reached</span>
                  <span className="text-sm text-muted-foreground">
                    You've reached your monthly conversation limit. Upgrade to send more messages.
                  </span>
                </div>
              </div>
            ) : (
              <div className="flex items-start gap-2 p-3 rounded-lg bg-cyan-500/10 border border-cyan-500/20">
                <Sparkles className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
                <div className="flex flex-col gap-1">
                  <span className="font-semibold text-cyan-500">
                    {remainingConversations === -1
                      ? 'Unlimited conversations available'
                      : `${remainingConversations} conversation${remainingConversations !== 1 ? 's' : ''} remaining this month`
                    }
                  </span>
                  <span className="text-sm text-muted-foreground">
                    Send a message to start a conversation with {recipientName}
                  </span>
                </div>
              </div>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-2 py-4">
          <label htmlFor="message" className="text-sm font-medium">
            Your message
          </label>
          <Textarea
            id="message"
            placeholder="Type your message here..."
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[120px] resize-none"
            disabled={!canStartNewConversation || isLoading}
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
            disabled={!canStartNewConversation || isLoading || !message.trim()}
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
