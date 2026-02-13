import { memo, useState, useRef } from 'react';
import { motion, useMotionValue, useTransform, PanInfo } from 'framer-motion';
import { Shield, Sparkles, Users } from 'lucide-react';
import { AuthDialog } from './AuthDialog';
import { SwipessLogoWithOrb } from './SwipessLogoWithOrb';
import StarFieldBackground from './StarFieldBackground';

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
      className="min-h-screen min-h-dvh flex flex-col items-center justify-center p-4 sm:p-6 md:p-8 relative overflow-hidden safe-area-p"
    >
      {/* Live Star Timelapse Background */}
      <StarFieldBackground />
      
      {/* Main Content */}
      <div className="relative z-20 text-center space-y-4 sm:space-y-6 max-w-2xl w-full px-2 sm:px-4">
        {/* Swipable Swipess Logo - Only the logo moves */}
        <div className="space-y-3 text-center">
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
            className="cursor-grab active:cursor-grabbing focus:outline-none touch-none select-none bg-transparent"
          >
            <SwipessLogoWithOrb size="4xl" className="drop-shadow-2xl" orbActive={true} />
          </motion.div>

          <motion.p
            className="text-white text-lg sm:text-xl md:text-2xl font-medium text-center px-2"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            Swipe and find your perfect deal
          </motion.p>

          {/* Swipe hint */}
          <motion.p
            className="text-white/60 text-sm font-medium"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
          >
            Swipe or tap Swipess to login or signup
          </motion.p>
        </div>

        {/* Bottom Info Section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="pt-4 space-y-2"
        >
          <div className="flex flex-wrap items-center justify-center gap-1.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
              <Sparkles className="w-3.5 h-3.5 text-white" />
              <span className="text-white/90 text-xs font-medium">Perfect Deals</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
              <Shield className="w-3.5 h-3.5 text-white" />
              <span className="text-white/90 text-xs font-medium">Secure Chat</span>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/10 rounded-full border border-white/20">
              <Users className="w-3.5 h-3.5 text-white" />
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