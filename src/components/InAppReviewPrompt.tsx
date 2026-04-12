/**
 * IN-APP REVIEW PROMPT — Beautiful native-styled review request
 * 
 * Mimics the iOS native review prompt aesthetic.
 * Only shown when smart timing conditions are met.
 */

import { useState, useEffect, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, X } from 'lucide-react';
import { shouldShowReviewPrompt, markPromptShown, markAsRated } from '@/utils/inAppReview';

export const InAppReviewPrompt = memo(() => {
  const [visible, setVisible] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredStar, setHoveredStar] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Delay check to avoid showing on mount — wait for user to settle
    const timer = setTimeout(() => {
      if (shouldShowReviewPrompt()) {
        setVisible(true);
        markPromptShown();
      }
    }, 8000); // 8 seconds after dashboard load

    return () => clearTimeout(timer);
  }, []);

  const handleRate = (stars: number) => {
    setRating(stars);
    markAsRated();
    setSubmitted(true);

    // If 4-5 stars, could redirect to App Store review (native bridge)
    if (stars >= 4) {
      // TODO: When native bridge is available, trigger native StoreKit review
    }

    setTimeout(() => setVisible(false), 2500);
  };

  const handleDismiss = () => {
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm"
            onClick={handleDismiss}
          />

          {/* Prompt Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.85, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="fixed inset-x-0 top-1/2 -translate-y-1/2 z-[10000] mx-auto w-[90vw] max-w-sm"
          >
            <div className="bg-card/95 backdrop-blur-2xl border border-border rounded-3xl shadow-2xl overflow-hidden">
              {/* Close button */}
              <button
                onClick={handleDismiss}
                className="absolute top-3 right-3 p-1.5 rounded-full hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-all z-10"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="p-6 text-center">
                {!submitted ? (
                  <>
                    {/* Emoji + Title */}
                    <div className="text-4xl mb-3">✨</div>
                    <h3 className="text-lg font-bold text-foreground mb-1">Enjoying Swipess?</h3>
                    <p className="text-sm text-muted-foreground mb-5 px-4">
                      Your feedback helps us build a better experience for everyone.
                    </p>

                    {/* Star Rating */}
                    <div className="flex items-center justify-center gap-2 mb-5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <motion.button
                          key={star}
                          onPointerEnter={() => setHoveredStar(star)}
                          onPointerLeave={() => setHoveredStar(0)}
                          onClick={() => handleRate(star)}
                          whileTap={{ scale: 1.3 }}
                          className="p-1 touch-manipulation"
                        >
                          <Star
                            className="w-9 h-9 transition-all duration-200"
                            style={{
                              color: (hoveredStar || rating) >= star ? '#f59e0b' : 'rgba(255,255,255,0.15)',
                              fill: (hoveredStar || rating) >= star ? '#f59e0b' : 'none',
                              filter: (hoveredStar || rating) >= star ? 'drop-shadow(0 0 8px rgba(245,158,11,0.5))' : 'none',
                            }}
                          />
                        </motion.button>
                      ))}
                    </div>

                    {/* Action buttons */}
                    <div className="flex flex-col gap-2">
                      <button
                        onClick={handleDismiss}
                        className="text-xs text-muted-foreground/60 hover:text-muted-foreground transition-colors"
                      >
                        Not now
                      </button>
                    </div>
                  </>
                ) : (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <div className="text-4xl mb-3">{rating >= 4 ? '🎉' : '🙏'}</div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {rating >= 4 ? 'Thank You!' : 'We appreciate it'}
                    </h3>
                    <p className="text-sm text-muted-foreground px-4">
                      {rating >= 4
                        ? 'Your support means everything to us!'
                        : "We'll work hard to improve your experience."}
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

InAppReviewPrompt.displayName = 'InAppReviewPrompt';
