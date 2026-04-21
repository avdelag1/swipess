import { memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, MessageCircle, Sparkles } from 'lucide-react';
import { triggerHaptic } from '@/utils/haptics';
import { Button } from '@/components/ui/button';
import { useAppNavigate } from '@/hooks/useAppNavigate';

interface MatchCelebrateModalProps {
  isOpen: boolean;
  onClose: () => void;
  clientProfile: any | null;
  ownerProfile: any | null;
}

function MatchCelebrateModalComponent({ isOpen, onClose, clientProfile, ownerProfile }: MatchCelebrateModalProps) {
  const { navigate } = useAppNavigate();

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('heavy');
      setTimeout(() => triggerHaptic('success'), 300);
      setTimeout(() => triggerHaptic('light'), 600);
    }
  }, [isOpen]);

  if (!isOpen || !clientProfile || !ownerProfile) return null;

  const handleMessage = () => {
    onClose();
    // In NEXUS DISCOVERY, messages route handles active matches
    navigate('/messages');
  };

  return (
    <AnimatePresence>
      <motion.div
        key="match-modal-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-xl overflow-hidden"
      >
        {/* Explosive Shockwave Background Effects */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          {/* Core Glow */}
          <motion.div 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: [0, 2, 1.5], opacity: [0, 0.6, 0.2] }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute w-[800px] h-[800px] bg-primary/40 rounded-full blur-[100px]"
          />
          {/* Shockwave Ring 1 */}
          <motion.div 
            initial={{ scale: 0.1, opacity: 1, borderWidth: '100px' }}
            animate={{ scale: 3, opacity: 0, borderWidth: '0px' }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute w-[300px] h-[300px] rounded-full border-primary/50"
          />
          {/* Shockwave Ring 2 */}
          <motion.div 
            initial={{ scale: 0.1, opacity: 1, borderWidth: '50px' }}
            animate={{ scale: 4, opacity: 0, borderWidth: '0px' }}
            transition={{ duration: 1.2, delay: 0.1, ease: "easeOut" }}
            className="absolute w-[200px] h-[200px] rounded-full border-pink-500/40"
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
            <h1 className="text-5xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/70 italic tracking-tighter drop-shadow-2xl flex items-center justify-center gap-3">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
              MATCH
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </h1>
            <p className="text-white/70 mt-2 font-medium tracking-wide w-full max-w-[280px] mx-auto leading-tight">
              You and {clientProfile.full_name?.split(' ')[0] || ownerProfile.full_name?.split(' ')[0] || "them"} liked each other!
            </p>
          </motion.div>

          {/* Avatars Fusing */}
          <div className="relative flex justify-center items-center w-full h-[180px] mb-12">
            
            {/* Left Avatar */}
            <motion.div
              initial={{ x: -100, rotate: -15, opacity: 0 }}
              animate={{ x: -30, rotate: -5, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.4 }}
              className="absolute z-10 w-32 h-40 rounded-2xl overflow-hidden border-4 border-black/50 shadow-2xl shadow-primary/20"
            >
              <img 
                src={clientProfile.avatar_url || "/placeholder-avatar.svg"} 
                alt="Client" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Right Avatar */}
            <motion.div
              initial={{ x: 100, rotate: 15, opacity: 0 }}
              animate={{ x: 30, rotate: 5, opacity: 1 }}
              transition={{ type: "spring", damping: 20, stiffness: 200, delay: 0.5 }}
              className="absolute z-20 w-32 h-40 rounded-2xl overflow-hidden border-4 border-black box-content shadow-2xl shadow-primary/20"
            >
              <img 
                src={ownerProfile.avatar_url || "/placeholder-avatar.svg"} 
                alt="Owner" 
                className="w-full h-full object-cover"
              />
            </motion.div>

            {/* Center Heart Burst */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.2, 1], opacity: 1 }}
              transition={{ type: "spring", damping: 15, stiffness: 300, delay: 0.7 }}
              className="absolute z-30 w-16 h-16 bg-gradient-to-tr from-primary to-rose-400 rounded-full flex items-center justify-center shadow-xl shadow-primary/50"
            >
              <svg viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white"><path d="M11.645 20.91l-.007-.003-.022-.012a15.247 15.247 0 01-.383-.218 25.18 25.18 0 01-4.244-3.17C4.688 15.36 2.25 12.174 2.25 8.25 2.25 5.322 4.714 3 7.688 3A5.5 5.5 0 0112 5.052 5.5 5.5 0 0116.313 3c2.973 0 5.437 2.322 5.437 5.25 0 3.925-2.438 7.111-4.739 9.256a25.175 25.175 0 01-4.244 3.17 15.247 15.247 0 01-.383.219l-.022.012-.007.004-.003.001a.752.752 0 01-.704 0l-.003-.001z" /></svg>
            </motion.div>
          </div>

          {/* Action Buttons */}
          <motion.div 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, type: "spring" }}
            className="w-full flex flex-col gap-4"
          >
            <Button 
              onClick={handleMessage}
              className="w-full h-14 rounded-full bg-white text-black font-bold text-lg hover:bg-white/90 shadow-[0_0_40px_rgba(255,255,255,0.3)] flex items-center justify-center gap-2"
            >
              <MessageCircle className="w-5 h-5" />
              Say Hello
            </Button>
            
            <Button 
              onClick={onClose}
              variant="outline"
              className="w-full h-14 rounded-full font-bold text-lg bg-transparent border-white/20 text-white hover:bg-white/10 hover:text-white"
            >
              Keep Swiping
            </Button>
          </motion.div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

export const MatchCelebrateModal = memo(MatchCelebrateModalComponent);


