import { memo, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Shield, Sparkles, Users } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import StarFieldBackground from './StarFieldBackground';
import swipessLogo from '@/assets/swipess-logo.jpg';

const SWIPE_THRESHOLD = 120;

function LegendaryLandingPage() {
  const [authDialogOpen, setAuthDialogOpen] = useState(false);
  const isDragging = useRef(false);

  // Motion values for swipe - straight horizontal movement
  const x = useMotionValue(0);
  
  // Fade out as it moves right (like being banished into light)
  const logoOpacity = useTransform(x, [0, 80, 200], [1, 0.6, 0]);
  
  // Scale down slightly as it fades
  const logoScale = useTransform(x, [0, 100, 200], [1, 0.95, 0.85]);
  
  // Blur effect increases as it moves right (like dissolving)
  const logoBlur = useTransform(x, [0, 80, 200], [0, 4, 12]);

  const openAuthDialog = () => setAuthDialogOpen(true);
  const closeAuthDialog = () => setAuthDialogOpen(false);

  const handleDragStart = () => {
    isDragging.current = true;
  };

  const handleDragEnd = (_: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
    const offset = info.offset.x;
    
    // If swiped right past threshold, open auth dialog
    if (offset > SWIPE_THRESHOLD) {
      openAuthDialog();
    }
    
    // Reset position smoothly
    x.set(0);
    
    // Reset dragging state after a short delay
    setTimeout(() => {
      isDragging.current = false;
    }, 100);
  };

  const handleTap = () => {
    // Only open if not dragging
    if (!isDragging.current) {
      openAuthDialog();
    }
  };

  return (
    <div
      className="min-h-screen min-h-dvh flex items-center justify-center relative overflow-hidden"
      style={{ background: '#0a0a0a' }}
    >
      <StarFieldBackground />

      {/* Centered Content */}
      <div className="relative z-20 flex flex-col items-center justify-center text-center w-full px-6">
        {/* Swipable Logo */}
        <motion.div
          data-swipe-logo
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.9}
          dragMomentum={false}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onClick={handleTap}
          style={{
            x,
            opacity: logoOpacity,
            scale: logoScale,
            filter: useTransform(logoBlur, (v) => `blur(${v}px)`)
          }}
          whileTap={{ scale: 0.98 }}
          className="cursor-grab active:cursor-grabbing focus:outline-none touch-none select-none"
        >
          <img src={swipessLogo} alt="Swipess" className="w-[75vw] max-w-[360px] sm:max-w-[420px] md:max-w-[500px] h-auto object-contain rounded-2xl drop-shadow-2xl mx-auto" />
        </motion.div>

        {/* Tagline */}
        <motion.p
          className="-mt-2 relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <span className="text-white/90 text-lg sm:text-xl md:text-2xl font-medium">
            swipe or tap{' '}
          </span>
          <span
            className="text-3xl sm:text-4xl md:text-5xl font-bold italic"
            style={{
              background: 'linear-gradient(to right, #ff69b4, #ffa500)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            to connect
          </span>
        </motion.p>

        {/* Info chips */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="mt-6"
        >
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.12] backdrop-blur-md rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Sparkles className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/90 text-xs font-medium">Perfect Deals</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.12] backdrop-blur-md rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Shield className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/90 text-xs font-medium">Secure Chat</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white/[0.12] backdrop-blur-md rounded-full border border-white/15 shadow-[0_2px_8px_rgba(0,0,0,0.3),inset_0_1px_0_rgba(255,255,255,0.1)]">
              <Users className="w-3.5 h-3.5 text-white/90" />
              <span className="text-white/90 text-xs font-medium">Instant Connect</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Auth Dialog - defaults to client role, user can switch roles after login */}
      <AuthDialog isOpen={authDialogOpen} onClose={closeAuthDialog} role="client" />
    </div>
  );
}

export default memo(LegendaryLandingPage);