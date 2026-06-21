import { memo } from 'react';
import { motion } from 'framer-motion';
import { Megaphone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';
import { NativeBridge } from '@/utils/nativeBridge';
import { appToast } from '@/utils/appNotification';

export const PromoteCTACard = memo(({ onPromote }: { onPromote?: () => void }) => {
  const { theme } = useAppTheme();
  const isLight = theme === 'light';

  const handleBuy = async (productId: string, name: string) => {
    triggerHaptic('medium');
    if (NativeBridge.isNative()) {
      const r = await NativeBridge.purchaseProduct(productId);
      if (r.success) {
        appToast.success('Promotion activated', name);
      } else if ((r as any).error !== 'CANCELLED') {
        appToast.error('Could not complete purchase');
      }
    } else {
      appToast.message('Testing Buy', `Simulated purchase of ${name}`);
    }
  };

  return (
    <div
      className={cn(
        "relative w-full h-full flex flex-col items-center justify-center px-8 transition-colors duration-500 overflow-hidden",
        isLight ? "bg-white" : "bg-[#0a0a0b]"
      )}
    >
      {/* Glow blobs */}
      <div className="absolute top-1/4 left-0 w-64 h-64 rounded-full opacity-20 blur-[80px] pointer-events-none bg-[radial-gradient(circle,#f97316,transparent)]" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-20 blur-[80px] pointer-events-none bg-[radial-gradient(circle,#EB4898,transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="text-center space-y-6 relative z-10"
      >
        <div className="w-20 h-20 rounded-[2rem] mx-auto flex items-center justify-center bg-gradient-to-br from-orange-500/20 to-purple-600/20 border border-orange-500/40 shadow-[0_0_40px_rgba(249,115,22,0.15)]">
          <Megaphone className="w-9 h-9 text-orange-400" />
        </div>

        <div>
          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400/80 mb-3">For Businesses</div>
          <h2 className={cn("text-4xl font-black leading-[1] tracking-tighter mb-3", isLight ? "text-black" : "text-white")}>
            Want to<br />
            <span className="bg-gradient-to-br from-[#FF4D00] to-[#EB4898] bg-clip-text text-transparent">
              Promote here?
            </span>
          </h2>
          <p className={cn("text-sm leading-relaxed max-w-[260px] mx-auto font-medium", isLight ? "text-black/50" : "text-white/50")}>
            Reach 15,000+ Tulum locals, expats & tourists with your event, restaurant, or brand
          </p>
        </div>

        <div className="flex justify-center gap-6">
          {[['15k+', 'Users'], ['120k+', 'Views/mo'], ['89%', 'Engagement']].map(([val, label]) => (
            <div key={label} className="text-center">
              <div className={cn("font-black text-lg", isLight ? "text-black" : "text-white")}>{val}</div>
              <div className={cn("text-[10px] font-bold uppercase tracking-wider", isLight ? "text-black/70" : "text-white/70")}>{label}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-3 w-full max-w-[280px] mx-auto">
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBuy('Swipess.promo.event.week.v3', '1 Week Promo')}
            className="w-full py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-transform bg-white/10 text-white border border-white/20"
          >
            <Megaphone className="w-4 h-4" /> 1 Week - $19.99
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBuy('Swipess.promo.event.month.v3', '1 Month Promo')}
            className="w-full py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-transform bg-gradient-to-br from-[#FF4D00] to-[#EB4898] shadow-[0_12px_40px_rgba(255,77,0,0.35)] text-white"
          >
            <Megaphone className="w-4 h-4" /> 1 Month - $49.99
          </motion.button>
          
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={() => handleBuy('Swipess.promo.event.quarter.v3', '3 Months Promo')}
            className="w-full py-4 rounded-[1.5rem] font-black flex items-center justify-center gap-2 transition-transform bg-white/10 text-white border border-white/20"
          >
            <Megaphone className="w-4 h-4" /> 3 Months - $99.99
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
});


