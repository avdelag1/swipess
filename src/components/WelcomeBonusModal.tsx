import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, X, Zap, ShieldCheck, Crown } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/useAuth';

export const WelcomeBonusModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user?.id || !user?.created_at) return;

    // Check if user is "new" (created within last 7 days)
    let createdAt: Date;
    try {
      createdAt = new Date(user.created_at);
      if (isNaN(createdAt.getTime())) return;
    } catch { return; }
    
    const now = new Date();
    const ageMs = now.getTime() - createdAt.getTime();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

    if (ageMs > sevenDaysMs) {
      return;
    }

    // Check if we've already shown this to this user
    const hasSeen = localStorage.getItem(`nexus_welcome_bonus_${user.id}`);
    
    if (!hasSeen) {
      // Small delay for better UX
      const timer = setTimeout(() => {
        setIsOpen(true);
        triggerHaptic('celebration');
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [user]);

  const handleClose = () => {
    setIsOpen(false);
    if (user) {
      localStorage.setItem(`nexus_welcome_bonus_${user.id}`, 'true');
    }
    triggerHaptic('light');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="relative w-full max-w-md bg-[#111] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl"
          >
            {/* Ambient Background Glow */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 bg-orange-500/20 blur-[100px] pointer-events-none" />
            
            <button
              onClick={handleClose}
              title="Close"
              aria-label="Close"
              className="absolute top-6 right-6 w-10 h-10 rounded-full flex items-center justify-center bg-white/5 border border-white/10 text-white/40 hover:text-white transition-colors z-10"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="p-8 pt-12 flex flex-col items-center text-center">
              {/* Animated Icon Ring */}
              <div className="relative mb-6">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
                  className="absolute inset-[-20px] border border-dashed border-orange-500/30 rounded-full"
                />
                <div className="w-24 h-24 rounded-[2rem] bg-gradient-to-br from-orange-400 via-rose-500 to-pink-600 flex items-center justify-center shadow-[0_0_40px_rgba(249,115,22,0.4)]">
                  <Crown className="w-12 h-12 text-white" />
                </div>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
              >
                <div className="text-[11px] font-black uppercase tracking-[0.3em] text-orange-400 mb-2">Early Bird Privilege</div>
                <h2 className="text-4xl font-black text-white leading-tight tracking-tighter mb-4">
                  Congratulations!
                </h2>
                <p className="text-white/60 text-sm leading-relaxed mb-8">
                  Welcome to Nexus Discovery. You are one of our first users! To honor your early support, we've granted you <span className="text-white font-bold">6 MONTHS of NEXUS DISCOVERY God-Mode</span> for absolutely free.
                </p>

                <div className="grid grid-cols-2 gap-3 mb-8">
                  {[
                    { icon: Zap, label: 'Infinite Tokens', color: 'text-yellow-400' },
                    { icon: Sparkles, label: 'Full AI Access', color: 'text-orange-400' },
                    { icon: ShieldCheck, label: 'Priority Support', color: 'text-green-400' },
                    { icon: Crown, label: 'Premium Filter', color: 'text-rose-400' },
                  ].map((feat, i) => (
                    <motion.div
                      key={feat.label}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.4 + (i * 0.1) }}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10"
                    >
                      <feat.icon className={cn("w-4 h-4", feat.color)} />
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">{feat.label}</span>
                    </motion.div>
                  ))}
                </div>

                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClose}
                  className="w-full py-5 rounded-[2rem] font-black text-white text-sm uppercase tracking-widest bg-gradient-to-r from-orange-500 to-rose-600 shadow-[0_12px_32px_rgba(249,115,22,0.3)]"
                >
                  Claim My 6-Months Free
                </motion.button>
                
                <p className="mt-4 text-[10px] text-white/20 font-medium">Automatic activation — no credit card required.</p>
              </motion.div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
export default WelcomeBonusModal;


