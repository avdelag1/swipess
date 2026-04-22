import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MessageCircle, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { logger } from '@/utils/prodLogger';
import { triggerHaptic } from '@/utils/haptics';
import { playNotificationSound } from '@/utils/notificationSounds';

interface MatchCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  onMessage: () => void;
  matchedUser: {
    name: string;
    avatar?: string;
    role: 'client' | 'owner';
  };
}

export function MatchCelebration({ isOpen, onClose, onMessage, matchedUser }: MatchCelebrationProps) {
  const [showButtons, setShowButtons] = useState(false);

  useEffect(() => {
    if (isOpen) {
      triggerHaptic('match');
      if ('vibrate' in navigator) {
        navigator.vibrate([100, 50, 100, 50, 200]);
      }
      playNotificationSound('match').catch(err => logger.warn('Match sound failed', err));
      const timer = setTimeout(() => setShowButtons(true), 1200);
      return () => clearTimeout(timer);
    } else {
      setShowButtons(false);
    }
  }, [isOpen]);

  const handleStartConversation = () => {
    onMessage();
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9999] flex flex-col items-center justify-center overflow-hidden bg-black/95 backdrop-blur-sm"
        >
          {/* Close button */}
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2 }}
            onClick={onClose}
            className="absolute top-6 right-6 p-2 rounded-full bg-white/10 text-white/60 hover:text-white"
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* High-Performance Canvas Particles */}
          <canvas
            id="match-celebration-canvas"
            className="absolute inset-0 pointer-events-none z-0"
            style={{ width: '100%', height: '100%' }}
          />
          <script dangerouslySetInnerHTML={{ __html: `
            (function() {
              const canvas = document.getElementById('match-celebration-canvas');
              if (!canvas) return;
              const ctx = canvas.getContext('2d');
              let w = canvas.width = window.innerWidth;
              let h = canvas.height = window.innerHeight;
              canvas.width = w * window.devicePixelRatio;
              canvas.height = h * window.devicePixelRatio;
              ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
              
              const particles = [];
              for (let i = 0; i < 60; i++) {
                particles.push({
                  x: w/2, y: h/2,
                  vx: (Math.random() - 0.5) * 20,
                  vy: (Math.random() - 0.5) * 20,
                  size: Math.random() * 3 + 2,
                  color: ['#fbbf24', '#f472b6', '#3b82f6', '#ffffff'][i % 4],
                  alpha: 1,
                  decay: 0.015 + Math.random() * 0.02
                });
              }
              function animate() {
                ctx.clearRect(0, 0, w, h);
                particles.forEach(p => {
                  p.x += p.vx; p.y += p.vy; p.vy += 0.2; p.alpha -= p.decay;
                  if (p.alpha > 0) {
                    ctx.globalAlpha = p.alpha;
                    ctx.fillStyle = p.color;
                    ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill();
                  }
                });
                if (particles.some(p => p.alpha > 0)) requestAnimationFrame(animate);
              }
              animate();
            })();
          `}} />

          {/* Cinematic Title */}
          <div className="relative mb-12">
            <motion.h2
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ 
                type: "spring", 
                stiffness: 200, 
                damping: 15,
                delay: 0.2 
              }}
              className="text-5xl md:text-7xl font-black text-center italic tracking-tighter"
            >
              <span className="bg-gradient-to-b from-orange-400 via-rose-500 to-pink-600 bg-clip-text text-transparent filter drop-shadow-[0_0_20px_rgba(244,63,94,0.3)]">
                IT'S A MATCH!
              </span>
            </motion.h2>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "100%" }}
              transition={{ delay: 0.6, duration: 0.8 }}
              className="h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent mt-2 mx-auto"
            />
          </div>

          {/* Profile Collision Animation */}
          <div className="relative flex items-center justify-center h-48 w-full max-w-lg mb-12">
            {/* Left side profile - US */}
            <motion.div
              initial={{ x: -300, opacity: 0, rotate: -20 }}
              animate={{ x: -60, opacity: 1, rotate: -5 }}
              transition={{ 
                type: "spring",
                stiffness: 150,
                damping: 12,
                delay: 0.4
              }}
              className="relative z-10"
            >
              <div className="w-32 h-44 rounded-2xl border-4 border-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-[-4deg]">
                <div className="w-full h-full bg-gradient-to-br from-blue-600 to-indigo-900 flex items-center justify-center">
                  <span className="text-white text-3xl font-bold">YOU</span>
                </div>
              </div>
            </motion.div>

            {/* Zap in the middle when they hit */}
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: [0, 1.5, 1], opacity: [0, 1, 0] }}
              transition={{ delay: 0.8, duration: 0.4 }}
              className="absolute z-30"
            >
                <div className="w-24 h-24 bg-white rounded-full blur-2xl" />
            </motion.div>

            {/* Right side profile - MATCH */}
            <motion.div
              initial={{ x: 300, opacity: 0, rotate: 20 }}
              animate={{ x: 60, opacity: 1, rotate: 5 }}
              transition={{ 
                type: "spring",
                stiffness: 150,
                damping: 12,
                delay: 0.45
              }}
              className="relative z-10"
            >
              <div className="w-32 h-44 rounded-2xl border-4 border-white overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.5)] rotate-[4deg]">
                {matchedUser.avatar ? (
                  <img src={matchedUser.avatar} className="w-full h-full object-cover" alt={matchedUser.name} />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-rose-500 to-orange-700 flex items-center justify-center">
                    <span className="text-white text-4xl font-black">{matchedUser.name?.[0] || 'U'}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Subtext */}
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="text-white/70 text-lg font-medium mb-12 text-center px-8"
          >
            You and <span className="text-white font-bold">{matchedUser.name}</span> have a spark!
          </motion.p>

          {/* Action Buttons */}
          <div className="flex flex-col gap-4 w-full max-w-[280px]">
            <AnimatePresence>
              {showButtons && (
                <>
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    className="w-full"
                  >
                    <Button
                      onClick={handleStartConversation}
                      className="w-full h-14 bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-600 hover:to-pink-700 text-white font-black text-lg shadow-[0_10px_30px_rgba(244,63,94,0.4)] relative group overflow-hidden"
                    >
                      <motion.div 
                        className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-sweep" 
                      />
                      <MessageCircle className="w-5 h-5 mr-3" />
                      SEND A MESSAGE
                    </Button>
                  </motion.div>

                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Button
                      onClick={onClose}
                      variant="ghost"
                      className="w-full h-12 text-white/50 hover:text-white hover:bg-white/5 text-sm font-bold uppercase tracking-widest"
                    >
                      Keep Swiping
                    </Button>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}


