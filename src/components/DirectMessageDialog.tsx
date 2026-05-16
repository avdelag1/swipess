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
import useAppTheme from '@/hooks/useAppTheme';
import { cn } from '@/lib/utils';

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
  const { isLight } = useAppTheme();

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
        className={cn(
          "max-w-[420px] w-[calc(100vw-32px)] p-0 overflow-hidden rounded-[32px] border shadow-2xl max-h-[90dvh] flex flex-col",
          isLight ? "bg-white border-slate-200" : "bg-[#0A0A0A] border-white/10"
        )}
      >
        <div className={cn("shrink-0 relative px-6 pt-6 pb-5 border-b", isLight ? "border-slate-200" : "border-white/[0.05]")}>
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
              <h2 className={cn("text-lg font-bold tracking-tight leading-none", isLight ? "text-slate-900" : "text-white")}>Direct Message</h2>
              <p className={cn("text-[11px] font-semibold uppercase tracking-[0.18em] mt-1.5", isLight ? "text-slate-500" : "text-white/50")}>{categoryLabel} Channel</p>
            </div>
          </div>
          
          <div className={cn(
            "flex items-start gap-3 p-3.5 rounded-2xl border",
            isLight ? "bg-slate-50 border-slate-200" : "bg-white/[0.04] border-white/10"
          )}>
            <div className={cn(
              "flex items-center justify-center w-10 h-10 rounded-full shrink-0 border",
              isLight ? "bg-rose-50 border-rose-200" : "bg-rose-500/20 border-rose-500/20"
            )}>
               <CategoryIcon className={cn("w-5 h-5", isLight ? "text-rose-600" : "text-rose-400")} />
            </div>
            <div className="flex flex-col">
              <span className={cn("text-[11px] font-bold uppercase tracking-wider flex items-center gap-1.5", isLight ? "text-rose-600" : "text-rose-400")}>
                <Zap className="w-3.5 h-3.5 fill-current" /> Fast-Track
              </span>
              <span className={cn("text-xs leading-snug mt-0.5", isLight ? "text-slate-500" : "text-white/55")}>
                {categoryLabel} listings support priority direct messaging at no extra cost.
              </span>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="space-y-3">
            <div className="flex justify-between items-center px-1">
              <label className={cn("text-[10px] font-bold uppercase tracking-[0.18em]", isLight ? "text-slate-500" : "text-white/50")}>
                Message to {recipientName}
              </label>
              <span className={cn("text-[10px] font-medium", isLight ? "text-slate-400" : "text-white/30")}>
                {message.length}/500
              </span>
            </div>
            <div className="relative">
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className={cn(
                  "relative min-h-[150px] resize-none rounded-2xl text-sm focus-visible:ring-1 focus-visible:ring-rose-500/40 p-4 transition-all border",
                  isLight ? "bg-slate-50 border-slate-200 text-slate-900 placeholder:text-slate-400"
                          : "bg-[#161616] border-white/10 text-white placeholder:text-white/30"
                )}
                disabled={isLoading}
              />
            </div>
          </div>
        </div>

        <div className={cn("shrink-0 flex flex-col gap-2.5 p-5 pt-4 border-t", isLight ? "border-slate-200 bg-white" : "border-white/[0.05] bg-[#0A0A0A]")}>
            <Button
              onClick={handleConfirm}
              disabled={isLoading || !message.trim()}
              className={cn(
                "w-full h-13 rounded-2xl font-bold text-sm active:scale-[0.98] transition-all shadow-lg border-none",
                "bg-foreground text-background hover:opacity-90"
              )}
            >
              <AnimatePresence mode="wait">
                {isLoading ? (
                  <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center">
                    <div className="w-4 h-4 mr-2.5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
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
