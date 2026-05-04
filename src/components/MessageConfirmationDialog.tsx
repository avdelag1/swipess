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
        className="max-w-[400px] p-0 overflow-hidden rounded-[32px] border border-white/10 bg-[#0A0A0A] shadow-[0_32px_80px_rgba(0,0,0,0.8)]"
      >
        {/* 🛸 NEXUS ATMOSPHERE */}
        <div className="absolute top-[-20%] left-[-20%] w-[80%] h-[80%] bg-rose-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-[-20%] right-[-20%] w-[80%] h-[80%] bg-violet-600/10 rounded-full blur-[100px] pointer-events-none" />

        {/* Header */}
        <div className="relative px-6 pt-8 pb-6">
          <button 
            onClick={handleCancel}
            className="absolute top-6 right-6 w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/50 hover:bg-white/10 hover:text-white transition-all z-10 active:scale-90"
          >
            <X className="w-4 h-4" />
          </button>
          
          <div className="flex items-center gap-4 mb-6">
            <motion.div 
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-16 h-16 rounded-[24px] bg-gradient-to-br from-rose-500/20 to-violet-600/20 border border-white/10 flex items-center justify-center shadow-lg backdrop-blur-xl"
            >
              <MessageCircle className="w-8 h-8 text-white" strokeWidth={1.5} />
            </motion.div>
            <div>
              <h2 className="text-2xl font-black text-white tracking-tight leading-none">Send Message</h2>
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mt-1.5">Direct Connection</p>
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

        <div className="px-6 pb-8 relative z-10">
          {/* Message textarea */}
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-white/30">
                Your personalized message
              </label>
              <span className="text-[10px] font-bold text-white/20">
                {message.length}/500
              </span>
            </div>
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-rose-500/10 to-violet-600/10 rounded-[24px] blur opacity-0 group-focus-within:opacity-100 transition-opacity" />
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message..."
                className="relative min-h-[160px] resize-none rounded-[24px] border-white/5 bg-[#121212] text-white text-base focus-visible:ring-1 focus-visible:ring-rose-500/30 p-5 placeholder:text-white/10 transition-all"
                disabled={isLoading}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-3 mt-8">
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !message.trim()}
              className="w-full h-14 rounded-[22px] bg-white text-black hover:bg-white/90 font-black text-base uppercase tracking-widest active:scale-[0.98] transition-all shadow-[0_12px_24px_rgba(255,255,255,0.15)] border-none"
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <div className="w-5 h-5 mr-3 border-3 border-black/20 border-t-black rounded-full animate-spin" />
                    Sending...
                  </motion.div>
                ) : (
                  <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <Send className="w-5 h-5 mr-3" />
                    Deliver Message
                  </motion.div>
                )}
              </AnimatePresence>
            </Button>
            
            <Button
              variant="ghost"
              onClick={handleCancel}
              disabled={isLoading}
              className="w-full h-12 rounded-[20px] text-white/40 hover:text-white hover:bg-white/5 font-bold transition-all"
            >
              Cancel
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
