import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Megaphone, ArrowRight, Star, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';
import useAppTheme from '@/hooks/useAppTheme';

const PROMO_IMAGES = [
  '/images/events/beach_party_user.jpg',
  '/images/events/jungle_party_user.jpg',
  '/images/events/cenote_party_user.jpg'
];

export const PromoteCTACard: React.FC = () => {
  const navigate = useNavigate();
  const { theme } = useAppTheme();
  const isLight = theme === 'light';
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentImgIdx((prev) => (prev + 1) % PROMO_IMAGES.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  const handlePromote = () => {
    triggerHaptic('medium');
    navigate('/owner/promote-event');
  };

  return (
    <div 
      className={cn(
        "relative w-full h-full rounded-[3rem] overflow-hidden flex flex-col items-center justify-center p-8 text-center border border-white/10",
        isLight ? "bg-white" : "bg-[#0a0a0b]"
      )}
    >
      {/* Background Carousel */}
      <div className="absolute inset-0 z-0">
        <AnimatePresence mode="wait">
          <motion.img 
            key={currentImgIdx}
            src={PROMO_IMAGES[currentImgIdx]} 
            initial={{ opacity: 0, scale: 1.1 }}
            animate={{ opacity: 0.4, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            alt="" 
            className="w-full h-full object-cover grayscale-[0.3]" 
          />
        </AnimatePresence>
        <div 
          className={cn(
            "absolute inset-0 bg-gradient-to-b",
            isLight ? "from-white/60 via-white/80 to-white" : "from-[#0a0a0b]/60 via-[#0a0a0b]/80 to-[#0a0a0b]"
          )}
        />
      </div>

      {/* Glow blobs */}
      <div className="absolute top-1/4 left-0 w-64 h-64 rounded-full opacity-30 blur-[100px] pointer-events-none bg-[radial-gradient(circle,#f97316,transparent)]" />
      <div className="absolute bottom-1/4 right-0 w-64 h-64 rounded-full opacity-30 blur-[100px] pointer-events-none bg-[radial-gradient(circle,#EB4898,transparent)]" />

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="relative z-10 flex flex-col items-center"
      >
        <div className="mb-6 relative">
          <div className="w-20 h-20 rounded-[2rem] bg-orange-500 flex items-center justify-center shadow-2xl shadow-orange-500/40 transform -rotate-6">
            <Megaphone className="w-10 h-10 text-white" />
          </div>
          <motion.div 
            animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="absolute -top-2 -right-2 bg-pink-500 rounded-full p-2"
          >
            <Sparkles className="w-4 h-4 text-white" />
          </motion.div>
        </div>

        <div className="space-y-2 mb-8">
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-500 bg-orange-500/10 px-3 py-1 rounded-full">
            Advertise Events
          </span>
          <h2 className="text-5xl font-black italic uppercase tracking-tighter leading-none">
            Promote
          </h2>
          <p className="text-sm font-medium text-muted-foreground max-w-[200px]">
            Reach thousands of clients instantly.
          </p>
        </div>

        <button
          onClick={handlePromote}
          className="group relative flex items-center gap-3 bg-white text-black px-8 py-5 rounded-full font-black text-xs uppercase tracking-widest overflow-hidden transition-all hover:scale-105 active:scale-95 shadow-xl"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 to-pink-500/20 opacity-0 group-hover:opacity-100 transition-opacity" />
          <span className="relative z-10">Engage Discovery</span>
          <ArrowRight className="w-4 h-4 relative z-10 group-hover:translate-x-1 transition-transform" />
        </button>

        <div className="mt-8 flex items-center gap-4">
          <div className="flex -space-x-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="w-8 h-8 rounded-full border-2 border-background bg-muted overflow-hidden">
                <img src={`https://i.pravatar.cc/100?img=${i + 10}`} alt="" />
              </div>
            ))}
          </div>
          <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            Used by 150+ Organizers
          </span>
        </div>
      </motion.div>
    </div>
  );
};
