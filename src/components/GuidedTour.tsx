import { useEffect, useState, useRef } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { useGuidedTour, TourStep } from '@/hooks/useGuidedTour';
import { Button } from '@/components/ui/button';
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
  const tooltipStyle: React.CSSProperties = {};
  if (targetRect) {
    const pos = step.position || 'bottom';
    if (pos === 'bottom') {
      tooltipStyle.top = targetRect.bottom + padding + 12;
      tooltipStyle.left = 16;
    } else if (pos === 'top') {
      tooltipStyle.bottom = window.innerHeight - targetRect.top + padding + 12;
      tooltipStyle.left = 16;
    }
  } else {
    tooltipStyle.top = '50%';
    tooltipStyle.left = 16;
    tooltipStyle.transform = 'translateY(-50%)';
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

        {/* Tooltip */}
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          className="absolute rounded-2xl bg-card border border-border shadow-2xl p-4 space-y-3"
          style={{ ...tooltipStyle, width: 'min(280px, calc(100vw - 32px))' }}
        >
          {/* Progress dots */}
          <div className="flex items-center justify-between">
            <div className="flex gap-1.5">
              {Array.from({ length: totalSteps }).map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "w-1.5 h-1.5 rounded-full transition-all",
                    i === currentStep ? "bg-primary w-4" : i < currentStep ? "bg-primary/50" : "bg-muted"
                  )}
                />
              ))}
            </div>
            <button onClick={skipTour} className="text-muted-foreground hover:text-foreground transition-colors">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div>
            <h4 className="text-sm font-bold text-foreground">{step.title}</h4>
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{step.description}</p>
          </div>

          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <Button variant="ghost" size="sm" onClick={prevStep} className="rounded-xl text-xs gap-1 h-8">
                <ChevronLeft className="w-3 h-3" />
                Back
              </Button>
            )}
            <div className="flex-1" />
            <Button size="sm" onClick={nextStep} className="rounded-xl text-xs gap-1 h-8">
              {currentStep === totalSteps - 1 ? 'Done' : 'Next'}
              {currentStep < totalSteps - 1 && <ChevronRight className="w-3 h-3" />}
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
