import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';

/**
 * Bottom-anchored coachmark sheet.
 *
 * Why the redesign: the previous tooltip popped over the page and blocked
 * interaction; tapping outside fired skipTour, which collided with the
 * floating Concierge bubble underneath and caused unwanted navigation. The
 * new layout slides a slim translucent strip up from the bottom safe-area
 * so the user can keep seeing the page being explained while reading the
 * guide. The dim layer is fully click-through (`pointer-events-none`); only
 * the strip itself receives pointer events.
 */
export function GuidedTour() {
  const { isActive, currentStep, totalSteps, step, nextStep, prevStep, skipTour } = useGuidedTour();

  if (!isActive || !step) return null;

  return createPortal(
    <AnimatePresence>
      <motion.div
        key="guided-tour-root"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9998] pointer-events-none"
      >
        {/* Soft top + bottom vignette so the strip reads cleanly without blocking taps */}
        <div
          aria-hidden
          className="absolute inset-x-0 bottom-0 h-[55%] bg-gradient-to-t from-black/60 via-black/20 to-transparent"
        />

        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          transition={{ type: 'spring', stiffness: 380, damping: 34 }}
          className="pointer-events-auto absolute left-3 right-3 rounded-[28px] overflow-hidden border border-white/10 backdrop-blur-2xl"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom, 0px) + 16px)',
            background: 'linear-gradient(180deg, rgba(20,20,22,0.92) 0%, rgba(8,8,10,0.96) 100%)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.55)',
          }}
        >
          {/* Progress strip */}
          <div className="flex items-center justify-between px-4 pt-3">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className="h-1 rounded-full transition-all"
                  style={{
                    width: i === currentStep ? 18 : 6,
                    backgroundColor: i <= currentStep ? '#ffffff' : 'rgba(255,255,255,0.22)',
                  }}
                />
              ))}
            </div>
            <button
              onClick={skipTour}
              aria-label="Close tour"
              className="w-7 h-7 -mr-1 flex items-center justify-center rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="px-4 pt-2 pb-3">
            <p className="text-[15px] font-bold tracking-tight text-white">{step.title}</p>
            <p className="text-[13px] mt-1 leading-snug text-white/75">{step.description}</p>
          </div>

          <div className="flex items-center gap-2 px-3 pb-3">
            {currentStep > 0 && (
              <button
                onClick={prevStep}
                className="inline-flex items-center gap-1 rounded-2xl text-[12px] h-10 px-3.5 font-semibold text-white bg-white/8 border border-white/12 active:scale-95 transition-transform"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
                Back
              </button>
            )}
            <button
              onClick={skipTour}
              className="inline-flex items-center rounded-2xl text-[12px] h-10 px-3 font-semibold text-white/65 active:scale-95 transition-transform"
            >
              Skip
            </button>
            <div className="flex-1" />
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-1.5 rounded-2xl text-[12px] h-10 px-5 font-bold text-black bg-white shadow-[0_8px_20px_rgba(0,0,0,0.35)] active:scale-95 transition-transform"
            >
              {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}


