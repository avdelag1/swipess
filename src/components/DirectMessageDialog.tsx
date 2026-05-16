import { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Zap, Bike, X } from 'lucide-react';
import { MotorcycleIcon } from '@/components/icons/MotorcycleIcon';
import { logger } from '@/utils/prodLogger';
import { DEFAULT_DIRECT_MESSAGE } from '@/utils/directMessaging';
import { triggerHaptic } from '@/utils/haptics';
import { motion, AnimatePresence } from 'framer-motion';

interface DirectMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (message: string) => void;
  recipientName?: string;
  isLoading?: boolean;
  category?: string;
}

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

  const handleConfirm = () => {
    if (!message.trim()) {
      logger.warn('[DirectMessageDialog] Empty message, not sending');
      return;
    }
    triggerHaptic('medium');
    logger.info('[DirectMessageDialog] User confirmed direct message send');
    onConfirm(message);
  };

  const handleCancel = () => {
    triggerHaptic('light');
    logger.info('[DirectMessageDialog] User cancelled direct message');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        hideCloseButton
        className="max-w-[420px] w-[calc(100vw-32px)] p-0 overflow-hidden rounded-[28px] border border-white/[0.08] shadow-2xl max-h-[90dvh] flex flex-col bg-[#080808]/95 backdrop-blur-2xl"
        style={{ background: 'linear-gradient(160deg, rgba(15,15,20,0.97) 0%, rgba(8,8,12,0.97) 100%)' }}
      >
        {/* Atmosphere orbs */}
        <div className="absolute top-0 left-0 w-[60%] h-[60%] bg-rose-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[60%] h-[60%] bg-violet-700/10 rounded-full blur-[80px] pointer-events-none" />

        {/* Header */}
        <div className="shrink-0 relative px-6 pt-7 pb-5 border-b border-white/[0.06]">
          <button
            onClick={handleCancel}
            className="absolute top-5 right-5 w-8 h-8 rounded-full flex items-center justify-center bg-white/5 hover:bg-white/10 border border-white/10 text-white/50 hover:text-white/80 active:scale-90 transition-all z-10"
          >
            <X className="w-3.5 h-3.5" />
          </button>

          <div className="flex items-center gap-3.5 mb-4 pr-12">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, rgba(244,63,94,0.2) 0%, rgba(139,92,246,0.2) 100%)', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <MessageCircle className="w-6 h-6 text-white/80" strokeWidth={1.6} />
            </motion.div>
            <div>
              <h2 className="text-base font-bold text-white tracking-tight leading-none">Direct Message</h2>
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] mt-1 text-white/35">{categoryLabel} Channel</p>
            </div>
          </div>

          {/* Fast-Track badge */}
          <div className="flex items-start gap-2.5 px-3.5 py-2.5 rounded-xl border border-white/[0.07] bg-white/[0.03]">
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-rose-500/15 border border-rose-500/20 shrink-0 mt-0.5">
              <CategoryIcon className="w-3.5 h-3.5 text-rose-400" />
            </div>
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-rose-400 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-current" /> Fast-Track
              </span>
              <span className="text-[10px] leading-snug text-white/35 mt-0.5 block">
                {categoryLabel} listings support priority direct messaging at no extra cost.
              </span>
            </div>
          </div>
        </div>

        {/* Message area */}
        <div className="flex-1 overflow-y-auto px-5 py-4">
          <div className="flex justify-between items-center px-0.5 mb-2">
            <label className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/30">
              Message to {recipientName}
            </label>
            <span className="text-[9px] font-medium text-white/20">
              {message.length}/500
            </span>
          </div>
          <Textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="min-h-[140px] resize-none rounded-xl text-sm p-4 transition-all border bg-white/[0.04] border-white/[0.08] text-white placeholder:text-white/20 focus-visible:ring-1 focus-visible:ring-rose-500/30 focus-visible:border-rose-500/30"
            disabled={isLoading}
          />
        </div>

        {/* Footer */}
        <div className="shrink-0 flex flex-col gap-2 p-5 pt-3 border-t border-white/[0.06]">
          <Button
            onClick={handleConfirm}
            disabled={isLoading || !message.trim()}
            className="w-full h-12 rounded-xl font-bold text-sm active:scale-[0.98] transition-all border-0 text-white shadow-lg"
            style={{ background: 'linear-gradient(135deg, #f43f5e 0%, #8b5cf6 100%)' }}
          >
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  <div className="w-4 h-4 mr-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Sending…
                </motion.div>
              ) : (
                <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Send Message
                </motion.div>
              )}
            </AnimatePresence>
          </Button>

          <Button
            variant="ghost"
            onClick={handleCancel}
            disabled={isLoading}
            className="w-full h-10 rounded-xl font-semibold text-sm text-white/40 hover:text-white/70 hover:bg-white/5 transition-all"
          >
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
