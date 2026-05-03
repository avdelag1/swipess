import { memo, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { useAppNavigate } from '@/hooks/useAppNavigate';
import confetti from 'canvas-confetti';

interface MatchCelebrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientProfile: any | null;
  ownerProfile: any | null;
}

function MatchCelebrateModalComponent({ isOpen, onClose, clientProfile, ownerProfile }: MatchCelebrateModalProps) {
  const { navigate } = useAppNavigate();
  const confettiRunRef = useRef(false);

  useEffect(() => {
    if (isOpen && !confettiRunRef.current) {
      confettiRunRef.current = true;
      triggerHaptic('heavy');
      
      // Premium Confetti Burst
      const duration = 3 * 1000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 11000 };

      const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

      const interval: any = setInterval(function() {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          return clearInterval(interval);
        }

        const particleCount = 50 * (timeLeft / duration);
        // since particles fall down, start a bit higher than random
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
        confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
      }, 250);

      setTimeout(() => triggerHaptic('success'), 300);
      setTimeout(() => triggerHaptic('light'), 600);
    }
    
    if (!isOpen) {
      confettiRunRef.current = false;
    }
  }, [isOpen]);

  if (!isOpen || !clientProfile || !ownerProfile) return null;

  const handleMessage = () => {
    onClose();
    navigate('/messages');
  };

  return (
    <AnimatePresence>
      <motion.div
        key="match-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/90 backdrop-blur-2xl overflow-hidden"
      >
        {/* Explosive Shockwave Background Effects */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 1.5], opacity: [0, 0.6, 0.2] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[800px] h-[800px] bg-primary/40 rounded-full blur-[120px]"
          />
          <motion.div 
            initial={{ scale: 0.1, opacity: 1, borderWidth: '100px' }}
            animate={{ scale: 3, opacity: 0, borderWidth: '0px' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-[300px] h-[300px] rounded-full border-primary/50"
          />
        </div>

        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: "spring", damping: 25, stiffness: 300, delay: 0.1 }}
          className="relative w-full max-w-sm px-6 flex flex-col items-center"
        >
          {/* Epic Match Text */}
          <motion.div 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, type: "spring" }}
            className="mb-10 text-center"
          >
            <h1 className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-white/40 italic tracking-tighter drop-shadow-[0_0_30px_rgba(255,255,255,0.3)] flex items-center justify-center gap-3">
              MATCH
            </h1>
            <p className="text-white font-bold mt-4 tracking-wider text-xl uppercase opacity-90">
              It's Mutual!
            </p>
          </motion.div>

          {/* Avatars Fusing with Physics */}
          <div className="relative flex justify-center items-center w-full h-[220px] mb-12">
            
            {/* Left Avatar */}
            <motion.div
              initial={{ x: -150, rotate: -30, opacity: 0, scale: 0.5 }}
              animate={{ x: -40, rotate: -8, opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, rotate: -5, zIndex: 50 }}
              transition={{ type: "spring", damping: 15, stiffness: 150, delay: 0.4 }}
              className="absolute z-10 w-36 h-48 rounded-[2rem] overflow-hidden border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img 
                src={clientProfile.avatar_url || "/placeholder-avatar.svg"} 
                alt="Client" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Right Avatar */}
            <motion.div
              initial={{ x: 150, rotate: 30, opacity: 0, scale: 0.5 }}
              animate={{ x: 40, rotate: 8, opacity: 1, scale: 1 }}
              whileHover={{ scale: 1.05, rotate: 5, zIndex: 50 }}
              transition={{ type: "spring", damping: 15, stiffness: 150, delay: 0.5 }}
              className="absolute z-20 w-36 h-48 rounded-[2rem] overflow-hidden border-[6px] border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transform-gpu"
            >
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10" />
              <img 
                src={ownerProfile.avatar_url || "/placeholder-avatar.svg"} 
                alt="Owner" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Center Heart Burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.4, 1], opacity: 1 }}
              transition={{ type: "spring", damping: 12, stiffness: 400, delay: 0.7 }}
              className="absolute z-30 w-20 h-20 bg-gradient-to-tr from-primary via-rose-500 to-amber-400 rounded-full flex items-center justify-center shadow-[0_0_40px_rgba(234,63,94,0.6)]"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-10 h-10 text-white drop-shadow-lg"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
            </motion.div>
          </div>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="text-white/80 text-center mb-10 font-medium px-4"
          >
            You and {clientProfile.full_name?.split(' ')[0] || "this user"} are now connected.
          </motion.p>

          {/* Action Buttons */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.9, type: "spring" }}
            className="w-full flex flex-col gap-4"
          >
            <Button 
              onClick={handleMessage}
              className="w-full h-16 rounded-2xl bg-white text-black font-black text-xl hover:bg-white/90 shadow-[0_10px_40px_rgba(255,255,255,0.2)] flex items-center justify-center gap-3 transition-all active:scale-95"
            >
              <MessageCircle className="w-6 h-6" />
              SAY HELLO
            </Button>
            
            <button 
              onClick={onClose}
              className="w-full h-16 rounded-2xl font-bold text-lg bg-white/5 border border-white/10 text-white/60 hover:bg-white/10 hover:text-white transition-all active:scale-95"
            >
              KEEP SWIPING
            </button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const MatchCelebrateModal = memo(MatchCelebrateModalComponent);


