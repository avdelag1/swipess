import useAppTheme from "@/hooks/useAppTheme";
import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Send, Sparkles, X } from 'lucide-react';
import { cn } from "@/lib/utils";
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { AnimatePresence, motion } from 'framer-motion';
import { useModalStore } from '@/state/modalStore';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { guardNewConversation } from '@/utils/messagingQuotaUX';

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
  const { isLight } = useAppTheme();
  const [message, setMessage] = useState("Hi! I'd like to connect with you.");
  const { canStartNewConversation, tokenBalance, isUnlimited, currentPlan } = useMessagingQuota();

  const quotaLabel = isUnlimited
    ? 'Unlimited messaging'
    : tokenBalance > 0
      ? `${tokenBalance} token${tokenBalance === 1 ? '' : 's'} left`
      : 'No tokens — upgrade to message';

  const handleConfirm = () => {
    if (!message.trim()) {
      logger.warn('[MessageConfirmationDialog] Empty message, not sending');
      return;
    }
    if (!guardNewConversation(canStartNewConversation)) return;
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
        className={cn("z-[10000] max-w-[380px] w-[calc(100vw-32px)] p-0 overflow-hidden rounded-[32px] border shadow-[0_20px_60px_rgba(0,0,0,0.6)] flex flex-col backdrop-blur-3xl", isLight ? "bg-white/95 border-slate-200" : "bg-black/95 border-white/[0.06]")}
        style={{ background: isLight ? 'rgba(255, 255, 255, 0.95)' : 'linear-gradient(180deg, rgba(20,20,20,0.95) 0%, rgba(10,10,10,0.95) 100%)' }}
      >
        {/* Subtle top highlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-[1px] bg-gradient-to-r from-transparent via-white/30 to-transparent opacity-50" />

        {/* Header */}
        <div className={cn("shrink-0 relative px-6 pt-8 pb-5 border-b", isLight ? "border-slate-200" : "border-white/[0.04]")}>
          <button
            onClick={handleCancel}
            className={cn("absolute top-6 right-6 w-8 h-8 rounded-full flex items-center justify-center transition-all z-10", isLight ? "bg-slate-100 text-slate-500 hover:bg-slate-200" : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white")}
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-4 pr-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn("w-12 h-12 rounded-[18px] flex items-center justify-center shadow-inner", isLight ? "bg-slate-100" : "bg-white/5")}
              style={{ border: isLight ? '1px solid rgba(0,0,0,0.05)' : '1px solid rgba(255,255,255,0.05)' }}
            >
              <MessageCircle className={cn("w-6 h-6", isLight ? "text-slate-800" : "text-white")} strokeWidth={1.5} />
            </motion.div>
            <div>
              <h2 className={cn("text-xl font-black uppercase tracking-tight leading-none", isLight ? "text-slate-900" : "text-white")}>Send Message</h2>
              <p className={cn("text-[10px] font-bold uppercase tracking-widest mt-1.5", isLight ? "text-rose-500" : "text-rose-400")}>Direct Connection</p>
            </div>
          </div>

          {/* Premium badge */}
          <div className={cn("mt-6 flex items-center justify-between gap-3 px-4 py-3 rounded-2xl border transition-all", isLight ? "border-slate-200 bg-slate-50/50" : "border-white/[0.05] bg-white/[0.02]")}>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-violet-500/10 border border-violet-500/20">
                <Sparkles className="w-4 h-4 text-violet-400" />
              </div>
              <div>
                <span className={cn("text-[11px] font-black uppercase tracking-wider block", isLight ? "text-slate-900" : "text-white")}>
                  {isUnlimited ? 'Unlimited Access' : 'Message Tokens'}
                </span>
                <span className={cn("text-[10px] font-semibold uppercase tracking-widest mt-0.5 block", isLight ? "text-slate-500" : "text-white/80")}>
                  {isUnlimited ? `${currentPlan} plan` : quotaLabel}
                </span>
              </div>
            </div>
            <button
              onClick={() => { triggerHaptic('light'); useModalStore.getState().setModal('showTokensModal', true); }}
              className={cn("px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all", isLight ? "bg-slate-200 text-slate-700 hover:bg-slate-300" : "bg-white/10 text-white hover:bg-white/20")}
            >
              Tokens
            </button>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 px-6 py-6">
          <div className="flex justify-between items-center mb-3">
            <label className={cn("text-[10px] font-black uppercase tracking-widest", isLight ? "text-slate-500" : "text-white/90")}>
              Message to {recipientName}
            </label>
            <span className={cn("text-[10px] font-bold", isLight ? "text-slate-400" : "text-white/70")}>
              {message.length}/500
            </span>
          </div>
          <Textarea
            autoGrow
            maxHeight={200}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Type your message..."
            className={cn(
              "min-h-[140px] resize-none rounded-2xl text-[15px] p-5 transition-all outline-none border", 
              isLight 
                ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400 focus:bg-white focus:border-slate-300 focus:shadow-sm" 
                : "bg-white/[0.03] border-white/[0.08] text-white placeholder:text-white/60 focus:bg-white/[0.05] focus:border-white/20"
            )}
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className={cn("shrink-0 flex flex-col gap-3 p-6 pt-2 pb-8")}>
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !message.trim() || !canStartNewConversation}
            className={cn(
              "w-full h-14 rounded-full font-black text-xs uppercase tracking-widest active:scale-[0.98] transition-all", 
              isLight 
                ? "bg-black text-white hover:bg-slate-800 shadow-md" 
                : "bg-white text-black hover:bg-white/90 shadow-[0_0_20px_rgba(255,255,255,0.2)]"
            )}
          >
            <AnimatePresence mode="sync">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  <div className="w-4 h-4 mr-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Sending…
                </motion.div>
              ) : (
                <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  <Send className="w-4 h-4 mr-2" />
                  Deliver Message
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className={cn("w-full h-12 rounded-full font-bold text-xs uppercase tracking-widest active:scale-[0.98] transition-all border", 
              isLight ? "bg-white text-slate-500 border-slate-200 hover:bg-slate-50" : "bg-transparent text-white/80 border-white/20 hover:bg-white/10 hover:text-white"
            )}
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

