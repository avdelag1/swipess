import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, MessageCircle, Share2, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { haptics } from '@/utils/microPolish';

export const MatchOverlay = ({ isOpen, profile, onClose }: { isOpen: boolean, profile: any, onClose: () => void }) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[11000] bg-black/90 backdrop-blur-2xl flex flex-col items-center justify-center p-8 text-center"
      >
        {/* Glow Background */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/20 blur-[120px] rounded-full animate-pulse" />
        </div>

        <motion.div
          initial={{ scale: 0.5, opacity: 0, rotate: -10 }}
          animate={{ scale: 1, opacity: 1, rotate: 0 }}
          transition={{ type: "spring", stiffness: 260, damping: 20 }}
          className="space-y-12 relative z-10"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-black text-white italic tracking-tighter uppercase leading-[0.8]">
              It's a <span className="text-primary">Match!</span>
            </h1>
            <p className="text-white/40 font-bold uppercase tracking-widest text-xs">You and {profile?.name} liked each other.</p>
          </div>

          <div className="flex items-center justify-center -space-x-8">
            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-black bg-slate-800 overflow-hidden shadow-2xl rotate-[-6deg]">
               <img src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=400" className="w-full h-full object-cover" alt="You" />
            </div>
            <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center shadow-2xl relative z-10">
              <Heart className="w-8 h-8 text-white fill-white animate-bounce" />
            </div>
            <div className="w-32 h-32 rounded-[2.5rem] border-4 border-black bg-slate-800 overflow-hidden shadow-2xl rotate-[6deg]">
               <img src={profile?.profile_images?.[0] || profile?.image || ""} className="w-full h-full object-cover" alt={profile?.name} />
            </div>
          </div>

          <div className="flex flex-col gap-4 w-full max-w-[280px] mx-auto">
            <Button 
              onClick={() => { haptics.impact('medium'); onClose(); }}
              className="h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black uppercase italic tracking-[0.2em] text-sm shadow-[0_20px_40px_rgba(255,77,0,0.3)]"
            >
              <MessageCircle className="w-5 h-5 mr-3" />
              Send Message
            </Button>
            
            <div className="flex gap-4">
              <Button 
                variant="outline"
                onClick={onClose}
                className="flex-1 h-14 rounded-2xl border-white/10 bg-white/5 text-white/60 font-black uppercase tracking-widest text-[10px]"
              >
                Keep Swiping
              </Button>
              <Button 
                variant="outline"
                className="w-14 h-14 rounded-2xl border-white/10 bg-white/5 flex items-center justify-center"
              >
                <Share2 className="w-5 h-5 text-white/40" />
              </Button>
            </div>
          </div>
        </motion.div>

        <button 
          onClick={onClose}
          className="absolute top-12 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-white/20 hover:text-white transition-colors"
        >
          <X className="w-6 h-6" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
