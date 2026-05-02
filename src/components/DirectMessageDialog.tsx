import { useState } from 'react';
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog';
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
        className="max-w-[400px] p-0 overflow-hidden rounded-[32px] border border-white/10 bg-black/40 backdrop-blur-2xl shadow-2xl"
      >
        {/* Animated Background Gradients */}
        <div className="absolute top-0 left-0 w-48 h-48 bg-cyan-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

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
          
          <h2 className="text-xl font-black text-white tracking-tight mb-2">Direct Message</h2>
          
          <div className="flex items-start gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
            <div className="flex items-center justify-center w-8 h-8 rounded-full bg-cyan-500/20 shrink-0">
               <CategoryIcon className="w-4 h-4 text-cyan-400" />
            </div>
            <div className="flex flex-col">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-1">
                <Zap className="w-3 h-3" /> Free Messaging
              </span>
              <span className="text-[10px] text-white/60 leading-tight mt-0.5">
                {categoryLabel} listings support direct messaging with no credits or activation required.
              </span>
            </div>
          </div>
        </div>

        <div className="p-6 relative z-10">
          <div className="space-y-3">
            <label className="text-xs font-bold uppercase tracking-widest text-white/60">
              Message to {recipientName}
            </label>
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px] resize-none rounded-[20px] border-white/10 bg-black/20 text-white text-sm backdrop-blur-md focus-visible:ring-1 focus-visible:ring-cyan-500/50 p-4"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-4 text-[10px] font-bold text-white/40 bg-black/40 px-2 py-1 rounded-md backdrop-blur-sm">
                {message.length}/500
              </div>
            </div>
          </div>

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
              disabled={isLoading || !message.trim()}
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
                    <MessageCircle className="w-4 h-4 mr-2" />
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
