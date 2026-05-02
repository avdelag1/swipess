import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { MessageCircle, AlertCircle, Sparkles, X, Send } from 'lucide-react';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

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

    triggerHaptic('medium');
    logger.info('[MessageConfirmationDialog] User confirmed message send');
    onConfirm(message);
  };

  const handleCancel = () => {
    triggerHaptic('light');
    logger.info('[MessageConfirmationDialog] User cancelled message send');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-[400px] p-0 overflow-hidden rounded-[32px] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl"
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 py-6 border-b border-white/5">
          <button 
            onClick={handleCancel}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all z-10"
          >
            <X className="w-4 h-4" />
          </button>
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="w-14 h-14 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center mb-4 shadow-lg backdrop-blur-md"
          >
            <MessageCircle className="w-7 h-7 text-cyan-400" strokeWidth={1.5} />
          </motion.div>
          
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Send Message</h2>
          
          {/* Quota info */}
          {quotaLoading ? (
            <div className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-500/50 border-t-cyan-400" />
              <span className="text-xs text-white/60">Checking quota...</span>
            </div>
          ) : !canStartNewConversation ? (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 backdrop-blur-sm">
              <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-amber-400 uppercase tracking-widest">Message limit reached</span>
                <span className="text-[10px] text-amber-400/60 leading-tight mt-0.5">
                  You've reached your monthly limit. Upgrade to send more messages.
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-start gap-3 p-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 backdrop-blur-sm">
              <Sparkles className="w-5 h-5 text-cyan-400 shrink-0" />
              <div className="flex flex-col">
                <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest">
                  {remainingConversations === -1
                    ? 'Unlimited conversations'
                    : `${remainingConversations} remaining`}
                </span>
                <span className="text-[10px] text-cyan-400/60 leading-tight mt-0.5">
                  Your message will be sent to {recipientName}.
                </span>
              </div>
            </div>
          )}
        </div>

        <div className="p-6 relative z-10">
          {/* Message textarea */}
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-white/60">
              Your message
            </label>
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] resize-none rounded-[20px] border-white/10 bg-black/20 text-white text-sm backdrop-blur-md focus-visible:ring-1 focus-visible:ring-cyan-500/50 p-4"
                disabled={!canStartNewConversation || isLoading}
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-bold text-white/40 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                {message.length}/500
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 mt-6">
            <Button
              variant="outline"
              onClick={handleCancel}
              disabled={isLoading}
              className="flex-1 h-12 rounded-[20px] bg-white/5 border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!canStartNewConversation || isLoading || !message.trim()}
              className="flex-[2] h-12 rounded-[20px] bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-bold active:scale-95 transition-all shadow-lg shadow-cyan-500/25 border-none"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <div className="w-4 h-4 mr-2 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                    Sending
                  </motion.div>
                ) : (
                  <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <Send className="w-4 h-4 mr-2" />
                    Send Message
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
