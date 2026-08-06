import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { useAuth } from '@/hooks/useAuth';
import { ChevronRight, X, Sparkles, Building, MapPin, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { NEXUS_GRADIENTS } from '@/utils/nexusTheme';

/**
 * Full-screen Cinematic Welcome Tutorial
 */
export function GuidedTour() {
  const { user } = useAuth();
  const { isActive, currentStep, totalSteps, step, nextStep, skipTour } = useGuidedTour(undefined, !!user);

  if (!isActive || !step) return null;

  // Cinematic backgrounds for each step
  const backgrounds = [
    NEXUS_GRADIENTS.warm,
    NEXUS_GRADIENTS.ai,
    NEXUS_GRADIENTS.cta,
    NEXUS_GRADIENTS.owner,
    'linear-gradient(135deg, #10B981 0%, #06B6D4 100%)',
  ];

  const currentBg = backgrounds[currentStep % backgrounds.length];

  // Map step index to an icon for visual flair
  const getIconForStep = (index: number) => {
    switch (index) {
      case 0: return <MapPin className="w-16 h-16 text-white mb-6 animate-bounce" />;
      case 1: return <Sparkles className="w-16 h-16 text-white mb-6" />;
      case 2: return <ShieldCheck className="w-16 h-16 text-white mb-6" />;
      case 3: return <Building className="w-16 h-16 text-white mb-6" />;
      default: return <CheckCircle2 className="w-16 h-16 text-white mb-6" />;
    }
  };

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="guided-tour-cinematic"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0, transition: { duration: 0.5 } }}
        className="fixed inset-0 z-[99999] flex flex-col items-center justify-center overflow-hidden bg-black"
      >
        {/* Animated Gradient Background */}
        <motion.div 
          className="absolute inset-0 opacity-80"
          animate={{ background: currentBg }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
        />
        
        {/* Particle/Glow overlays */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-white/20 via-transparent to-black/60" />

        {/* Content Container */}
        <div className="relative z-10 w-full max-w-md px-8 flex flex-col items-center text-center">
          
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, y: 40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -40, scale: 1.05 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="flex flex-col items-center"
            >
              {getIconForStep(currentStep)}
              
              <h1 className="text-4xl sm:text-5xl font-black text-white tracking-tight leading-[1.1] mb-6 drop-shadow-xl">
                {step.title}
              </h1>
              
              <p className="text-lg sm:text-xl text-white/90 leading-relaxed font-medium drop-shadow-md max-w-[320px]">
                {step.description}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Bottom Navigation Strip */}
        <div className="absolute bottom-0 inset-x-0 p-8 pb-[calc(env(safe-area-inset-bottom,0px)+2rem)] flex flex-col items-center gap-8">
          
          {/* Dot Indicators */}
          <div className="flex gap-3">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <motion.div
                key={i}
                initial={false}
                animate={{
                  width: i === currentStep ? 32 : 8,
                  backgroundColor: i === currentStep ? '#ffffff' : 'rgba(255,255,255,0.3)'
                }}
                className="h-2 rounded-full"
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
              />
            ))}
          </div>

          <div className="flex flex-col items-center gap-4 w-full max-w-[280px]">
            {/* Primary Action */}
            <button
              onClick={nextStep}
              className="w-full h-14 rounded-full bg-white text-black font-black text-lg shadow-[0_8px_30px_rgba(255,255,255,0.4)] active:scale-95 transition-transform flex items-center justify-center gap-2"
            >
              {currentStep === totalSteps - 1 ? 'Start Exploring' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-5 h-5 text-black" />}
            </button>

            {/* Subtle Skip Button */}
            {currentStep < totalSteps - 1 && (
              <button
                onClick={skipTour}
                className="text-black font-bold text-sm bg-white/70 hover:bg-white transition-colors py-2.5 px-6 rounded-full active:scale-95 shadow-md"
              >
                Skip intro
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
