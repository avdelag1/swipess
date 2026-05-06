import { ReactNode, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { triggerHaptic } from '@/utils/haptics';

interface PreviewSwipeCardProps {
  images: string[];
  fallback?: ReactNode;
  topLeft?: ReactNode;
  topRight?: ReactNode;
  badges?: ReactNode;
  overlay?: ReactNode;
  className?: string;
  /** Fill the parent height instead of using a fixed aspect ratio. */
  fill?: boolean;
}

/**
 * Read-only swipe-card frame matching the in-app deck.
 * Used for shared listing/profile previews.
 */
export function PreviewSwipeCard({
  images,
  fallback,
  topLeft,
  topRight,
  badges,
  overlay,
  className,
  fill = false,
}: PreviewSwipeCardProps) {
  const [idx, setIdx] = useState(0);
  const total = images.length;

  const next = useCallback(() => {
    if (total < 2) return;
    triggerHaptic('light');
    setIdx(i => (i + 1) % total);
  }, [total]);

  const prev = useCallback(() => {
    if (total < 2) return;
    triggerHaptic('light');
    setIdx(i => (i - 1 + total) % total);
  }, [total]);

  const current = images[idx];

  return (
    <div
      className={cn(
        'relative w-full overflow-hidden rounded-[36px] bg-[#0A0A0A] shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)] border border-white/[0.06]',
        fill && 'h-full',
        className
      )}
      style={fill ? undefined : { aspectRatio: '3 / 4.4' }}
    >
      {/* Image */}
      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={idx}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="absolute inset-0"
        >
          {current ? (
            <img
              src={current}
              alt=""
              className="w-full h-full object-cover"
              draggable={false}
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-[#FF4D00]/25 via-black to-[#EB4898]/25 flex items-center justify-center">
              {fallback}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Cinematic gradients */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-black via-black/70 to-transparent pointer-events-none" />

      {/* Tap zones */}
      {total > 1 && (
        <>
          <div className="absolute inset-0 flex z-10">
            <button
              type="button"
              aria-label="Previous image"
              className="flex-1"
              onClick={prev}
            />
            <button
              type="button"
              aria-label="Next image"
              className="flex-1"
              onClick={next}
            />
          </div>
          {/* Visible chevron controls */}
          <button
            type="button"
            aria-label="Previous image"
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button"
            aria-label="Next image"
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/35 backdrop-blur-xl border border-white/15 flex items-center justify-center text-white shadow-lg active:scale-90 transition-transform"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </>
      )}

      {/* Pagination */}
      {total > 1 && (
        <div className="absolute top-4 inset-x-0 flex justify-center gap-1.5 z-20 pointer-events-none px-6">
          {images.map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-1 rounded-full transition-all duration-500',
                i === idx ? 'w-8 bg-white' : 'w-2 bg-white/30'
              )}
            />
          ))}
        </div>
      )}

      {/* Top-left / Top-right slots */}
      {topLeft && (
        <div className="absolute top-4 left-4 z-30">{topLeft}</div>
      )}
      {topRight && (
        <div className="absolute top-4 right-4 z-30">{topRight}</div>
      )}

      {/* Badges overlay (top, below pagination) */}
      {badges && (
        <div className="absolute top-16 left-5 right-5 z-20 flex flex-wrap gap-2 pointer-events-none">
          {badges}
        </div>
      )}

      {/* Bottom overlay content */}
      {overlay && (
        <div className="absolute inset-x-0 bottom-0 z-20 p-6 pointer-events-none">
          <div className="pointer-events-auto">{overlay}</div>
        </div>
      )}
    </div>
  );
}

export default PreviewSwipeCard;