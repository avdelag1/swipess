import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTour } from '@/hooks/useGuidedTour';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

export function GuidedTour() {
  const { isActive, currentStep, totalSteps, step, nextStep, prevStep, skipTour } = useGuidedTour();
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    if (!isActive || !step) return;
    const findTarget = () => {
      const el = document.querySelector(step.target);
      if (el) {
        setTargetRect(el.getBoundingClientRect());
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      } else {
        setTargetRect(null);
      }
    };
    findTarget();
    const timer = setInterval(findTarget, 500);
    return () => clearInterval(timer);
  }, [isActive, step, currentStep]);

  if (!isActive || !step) return null;

  const padding = 8;
  const spotlightStyle = targetRect ? {
    top: targetRect.top - padding,
    left: targetRect.left - padding,
    width: targetRect.width + padding * 2,
    height: targetRect.height + padding * 2,
  } : null;

  // Calculate tooltip position
  const tooltipWidth = 280;
  const tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    const pos = step.position || 'bottom';
    // Center tooltip on target, clamped to screen with 16px margin
    const centeredLeft = targetRect.left + targetRect.width / 2 - tooltipWidth / 2;
    const clampedLeft = Math.max(16, Math.min(centeredLeft, window.innerWidth - tooltipWidth - 16));
    if (pos === 'bottom') {
      tooltipStyle.top = targetRect.bottom + padding + 12;
      tooltipStyle.left = clampedLeft;
    } else if (pos === 'top') {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + padding + 12;
      tooltipStyle.left = clampedLeft;
    }
  } else {
    // Use pixel values — avoids conflict with Framer Motion's own transform system
    tooltipStyle.top = Math.max(16, window.innerHeight / 2 - 100);
    tooltipStyle.left = Math.max(16, (window.innerWidth - tooltipWidth) / 2);
  }

  return createPortal(
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999]"
      >
        {/* Dark overlay */}
        <div className="absolute inset-0 bg-black/70" onClick={skipTour} />

        {/* Spotlight cutout */}
        {spotlightStyle && (
          <motion.div
            layoutId="spotlight"
            className="absolute rounded-2xl border-2 border-primary/50 shadow-[0_0_40px_rgba(var(--primary),0.3)]"
            style={{
              ...spotlightStyle,
              boxShadow: `0 0 0 9999px rgba(0,0,0,0.7), 0 0 30px rgba(var(--primary),0.2)`,
              background: 'transparent',
              pointerEvents: 'none',
            }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
          />
        )}

        {/* Tooltip — explicit dark card so contrast is predictable across all themes */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute w-[280px] rounded-2xl shadow-2xl p-4 space-y-3"
          style={{ ...tooltipStyle, backgroundColor: '#1a1a1a', border: '1px solid rgba(255,255,255,0.12)' }}
        >
          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn("h-1.5 rounded-full transition-all", i === currentStep ? "w-4" : "w-1.5")}
                  style={{ backgroundColor: i <= currentStep ? '#ffffff' : 'rgba(255,255,255,0.3)' }}
                />
              ))}
            </div>
            <button onClick={skipTour} aria-label="Close tour" style={{ color: 'rgba(255,255,255,0.7)' }} className="hover:opacity-100 transition-opacity">
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          </div>

          <div>
            <p className="text-sm font-bold" style={{ color: '#ffffff' }}>{step.title}</p>
            <p className="text-xs mt-1 leading-relaxed" style={{ color: 'rgba(255,255,255,0.85)' }}>{step.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button onClick={prevStep} className="inline-flex items-center gap-1 rounded-xl text-xs h-8 px-3 transition-opacity hover:opacity-80" style={{ color: 'rgba(255,255,255,0.85)', border: '1px solid rgba(255,255,255,0.2)' }}>
                <ChevronLeft className="w-3 h-3" />
                Back
              </button>
            )}
            <div className="flex-1" />
            {/* White button on dark card → 21:1 contrast ratio, passes WCAG AAA */}
            <button
              onClick={nextStep}
              className="inline-flex items-center gap-1 rounded-xl text-xs h-8 px-3 font-semibold transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#ffffff', color: '#000000' }}
            >
              {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-3 h-3" />}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}


