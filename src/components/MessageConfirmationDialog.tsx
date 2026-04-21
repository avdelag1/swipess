import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { MessageCircle, AlertCircle, Sparkles } from 'lucide-react';
import { logger } from '@/utils/prodLogger';

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
      <DialogContent
        className="sm:max-w-[460px] p-0 overflow-hidden rounded-[2rem] border border-cyan-500/20 shadow-2xl"
        style={{ boxShadow: '0 0 0 1px rgba(6,182,212,0.12), 0 24px 80px rgba(0,0,0,0.2), 0 0 40px rgba(6,182,212,0.08)' }}
      >
        {/* Header */}
        <div
          className="relative px-5 py-4 border-b border-cyan-500/15 overflow-hidden"
          style={{ background: 'linear-gradient(135deg, rgba(8,51,68,0.25) 0%, rgba(6,182,212,0.08) 100%)' }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none"
            style={{
              background: 'linear-gradient(90deg, transparent, rgba(6,182,212,0.8), rgba(103,232,249,1), rgba(6,182,212,0.8), transparent)',
              backgroundSize: '200% 100%',
              animation: 'msg-shimmer 2.5s ease-in-out infinite',
            }}
          />
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-2xl flex items-center justify-center border border-cyan-400/30 flex-shrink-0"
              style={{ background: 'linear-gradient(135deg, #083344 0%, #0891b2 50%, #06b6d4 100%)', boxShadow: '0 4px 16px rgba(6,182,212,0.35)' }}
            >
              <MessageCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="font-bold text-base text-foreground leading-none mb-1">Send Message</h2>
              <p className="text-[11px] text-muted-foreground">
                Start a conversation with {recipientName}
              </p>
            </div>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Quota info */}
          {quotaLoading ? (
            <div className="flex items-center gap-2 p-3 rounded-2xl bg-muted/30 border border-border/40">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
              <span className="text-sm text-muted-foreground">Checking quota...</span>
            </div>
          ) : !canStartNewConversation ? (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <AlertCircle className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-amber-500 text-sm">Message limit reached</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  You've reached your monthly limit. Upgrade to send more messages.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-2.5 p-3.5 rounded-2xl bg-cyan-500/10 border border-cyan-500/20">
              <Sparkles className="w-5 h-5 text-cyan-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-cyan-500 text-sm">
                  {remainingConversations === -1
                    ? 'Unlimited conversations'
                    : `${remainingConversations} conversation${remainingConversations !== 1 ? 's' : ''} remaining`}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Your message will be sent to {recipientName}
                </p>
              </div>
            </div>
          )}

          {/* Message textarea */}
          <div className="space-y-2">
            <label htmlFor="message" className="text-xs font-bold uppercase tracking-widest text-muted-foreground/60">
              Your message
            </label>
            <Textarea
              id="message"
              placeholder="Type your message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="min-h-[110px] resize-none rounded-2xl border-border/60 bg-muted/30 focus:border-cyan-400/50 focus:ring-cyan-400/20 focus:ring-2"
              disabled={!canStartNewConversation || isLoading}
            />
            <p className="text-xs text-muted-foreground/50 text-right">
              {message.length}/500
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 rounded-2xl border-border/60 hover:bg-muted/50 font-semibold"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canStartNewConversation || isLoading || !message.trim()}
              className="flex-1 rounded-2xl mexican-pink-premium font-semibold"
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
          </div>
        </div>

        <style>{`
          @keyframes msg-shimmer {
            0%   { background-position: -200% center; }
            100% { background-position: 200% center; }
          }
        `}</style>
      </DialogContent>
    </Dialog>
  );
}

