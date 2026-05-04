import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMessagingQuota } from '@/hooks/useMessagingQuota';
import { MessageCircle, AlertCircle, Sparkles, X, Send } from 'lucide-react';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

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
  const { isLight } = useAppTheme();
  
  // 🚀 SWIPESS: Enforce unlimited messaging for production
  const canStartNewConversation = true; 
  const remainingConversations = -1; // Unlimited
  const quotaLoading = false;

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
        className={cn(
          "max-w-[400px] w-[calc(100vw-32px)] p-0 overflow-hidden rounded-[32px] border shadow-2xl max-h-[90dvh] flex flex-col",
          isLight ? "bg-white border-slate-200" : "bg-[#0A0A0A] border-white/10"
        )}
      >
        {/* 🛸 NEXUS ATMOSPHERE */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className={cn("shrink-0 relative px-6 pt-7 pb-5 border-b", isLight ? "border-slate-200" : "border-white/[0.05]")}>
          <button 
            onClick={handleCancel}
            className={cn(
              "absolute top-5 right-5 w-9 h-9 rounded-full flex items-center justify-center active:scale-90 transition-all z-10",
              isLight ? "bg-slate-100 text-slate-600 hover:bg-slate-200 border border-slate-200"
                      : "bg-white/5 text-white/70 hover:bg-white/10 border border-white/10"
            )}
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-3.5 mb-5 pr-12">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className={cn(
                "w-14 h-14 rounded-2xl border flex items-center justify-center shadow-md",
                isLight ? "bg-slate-100 border-slate-200" : "bg-white/[0.06] border-white/10"
              )}
            >
              <MessageCircle className={cn("w-7 h-7", isLight ? "text-slate-900" : "text-white")} strokeWidth={1.7} />
            </motion.div>
            <div>
              <h2 className={cn("text-lg font-bold tracking-tight leading-none", isLight ? "text-slate-900" : "text-white")}>Send Message</h2>
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] mt-1.5", isLight ? "text-slate-500" : "text-white/50")}>Direct Connection</p>
            </div>
          </div>
          
          {/* Quota info - Now Unlimited Style */}
          <div className={cn(
            "flex items-center justify-between gap-3 p-3.5 rounded-2xl border",
            isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/10"
          )}>
            <div className="flex items-center gap-3">
              <div className={cn(
                "w-10 h-10 rounded-full flex items-center justify-center border",
                isLight ? "bg-rose-50 border-rose-200" : "bg-rose-500/20 border-rose-500/20"
              )}>
                <Sparkles className={cn("w-5 h-5", isLight ? "text-rose-600" : "text-rose-400")} />
              </div>
              <div className="flex flex-col">
                <span className={cn("text-xs font-bold uppercase tracking-wider", isLight ? "text-slate-900" : "text-white")}>Unlimited Access</span>
                <span className={cn("text-[10px] leading-tight font-semibold mt-0.5", isLight ? "text-slate-500" : "text-white/50")}>Premium Messaging Active</span>
              </div>
            </div>
            
            <button className={cn(
              "px-3 py-1.5 rounded-lg border text-[10px] font-bold uppercase tracking-wider transition-colors",
              isLight ? "bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100"
                      : "bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20"
            )}>
              Get Tokens
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", isLight ? "text-slate-500" : "text-white/50")}>
                Your personalized message
              </label>
              <span className={cn("text-[10px] font-medium", isLight ? "text-slate-400" : "text-white/30")}>
                {message.length}/500
              </span>
            </div>
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className={cn(
                  "relative min-h-[150px] resize-none rounded-2xl text-sm focus-visible:ring-1 focus-visible:ring-rose-500/40 p-4 transition-all border",
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          : "bg-[#161616] border-white/10 text-white placeholder:text-white/30"
                )}
                disabled={isLoading}
              />
            </div>
          </div>
          
          {/* Quota info - Now Unlimited Style */}
          <div className="flex items-center justify-between gap-3 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center border border-rose-500/20">
                <Sparkles className="w-5 h-5 text-rose-400" />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-black text-white uppercase tracking-wider">Unlimited Access</span>
                <span className="text-[10px] text-white/40 leading-tight font-bold">Premium Messaging Active</span>
              </div>
            </div>
            
            <button className="px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/20 text-[10px] font-black text-rose-400 uppercase tracking-widest hover:bg-rose-500/20 transition-colors">
              Get Tokens
            </button>
          </div>
        </div>

        {/* Footer */}
        <div className={cn("shrink-0 flex flex-col gap-2.5 p-5 pt-4 border-t", isLight ? "border-slate-200 bg-white" : "border-white/[0.05] bg-[#0A0A0A]")}>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !message.trim()}
              className={cn(
                "w-full h-13 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg border-none",
                isLight ? "bg-slate-900 text-white hover:bg-slate-800" : "bg-white text-black hover:bg-white/90"
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <div className="w-4 h-4 mr-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                    Sending...
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
              className={cn(
                "w-full h-11 rounded-2xl font-semibold text-sm transition-all",
                isLight ? "text-slate-600 hover:bg-slate-100" : "text-white/60 hover:text-white hover:bg-white/5"
              )}
            >
              Cancel
            </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
